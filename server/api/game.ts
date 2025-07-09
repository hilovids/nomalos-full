import { Router, Request, Response } from "express";
import * as GameRepo from "../database/games";
import * as UserRepo from "../database/users";
import * as ArchiveRepo from "../database/archive";
import { calculateElo } from "../utils/eloUtils";
import { Space } from "../nomalos/space";
import rateLimit from "express-rate-limit";
import { io, userSocketMap } from "../index"; // <-- Socket.IO instance
import GameService from "../nomalos/gameService"; // <-- Use GameService
import { getDb } from "../database/mongodb";
import { authenticateJWT } from "../middleware/jwt";
import { ObjectId } from "mongodb";

const router = Router();
const GAME_REQUESTS_COLLECTION = "GameRequests";
const USER_COLLECTION = "Users";

// --- 9. Per-user rate limiting for move endpoint ---
const moveLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 5, // max 5 moves per 10 seconds per user
    keyGenerator: (req) => req.body.userId || req.ip,
    message: "Too many moves from this user, please slow down."
});

// --- 2. Input validation helper ---
function isValidMoveInput(row: any, col: any, boardSize: number): boolean {
    return (
        typeof row === "number" &&
        typeof col === "number" &&
        row >= 0 && row < boardSize &&
        col >= 0 && col < boardSize
    );
}

// --- 3. Simple authentication/authorization stub (replace with real auth) ---
async function isUserInGame(userId: string, game: any): Promise<boolean> {
    return game.players.includes(userId);
}

// Create a new game
router.post("/", async (req: Request, res: Response) => {
    try {
        const { mode, rated, timing, players, playerUsernames, size } = req.body;
        // --- 2. Input validation ---
        if (
            !Array.isArray(players) || players.length !== 2 ||
            !Array.isArray(playerUsernames) || playerUsernames.length !== 2 ||
            !["short", "long"].includes(timing)
        ) {
            res.status(400).json({ error: "Invalid game creation parameters" });
            return;
        }
        const playerRatings = req.body.playerRatings || { [players[0]]: 1200, [players[1]]: 1200 }; // Default ratings if not provided
        const game = await GameService.createGame(
            mode,
            timing,
            rated,
            players as [string, string],
            playerUsernames as [string, string],
            playerRatings,
            size
        );
        res.status(201).json({ id: game.id, game });
        return;
    } catch (err) {
        res.status(400).json({ error: "Failed to create game", details: err instanceof Error ? err.message : err });
        return;
    }
});

// Get a game by ID
router.get("/:id", async (req: Request, res: Response) => {
    const game = await GameRepo.getGameById(req.params.id);
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    res.json(game);
});

// --- 9. Per-user rate limiting, 3. Auth, 2. Input validation, 4. Error handling, 5. Concurrency, 1. Draw handling, 8. Forfeit ---
router.post("/:id/move", moveLimiter, async (req: Request, res: Response) => {
    const { row, col, userId } = req.body;
    const game = await GameRepo.getGameById(req.params.id);
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }

    // --- 3. Authorization: Only allow players in the game to move ---
    if (!userId || !(await isUserInGame(userId, game))) {
        res.status(403).json({ error: "You are not a player in this game." });
        return;
    }

    // --- 2. Input validation ---
    const boardSize = game.state.board.size;
    if (!isValidMoveInput(row, col, boardSize)) {
        res.status(400).json({ error: "Invalid move input" });
        return;
    }

    // --- 5. Concurrency: Check if it's the user's turn ---
    const currentPlayerId = game.state.currentPlayer === Space.Black ? game.blackPlayer : game.whitePlayer;
    if (userId !== currentPlayerId) {
        res.status(409).json({ error: "It's not your turn." });
        return;
    }

    // Apply the move using GameService
    try {
        const result = await GameService.makeMove(game.id, row, col, userId);
        if (!result) {
            res.status(400).json({ error: "Invalid move or move could not be applied." });
            return;
        }
        const { game: updatedGame, winnerId, isDraw } = result;

        // Emit game update to all clients in this game room
        io.to(updatedGame.id).emit("game_update", { gameId: updatedGame.id, game: updatedGame });

        // --- 1. Draw Handling ---
        if (updatedGame.state.isOver) {
            io.to(updatedGame.id).emit("game_over", { gameId: updatedGame.id, winner: winnerId, isDraw });

            // --- ELO and stats update (for 2-player games) ---
            if (updatedGame.players.length === 2) {
                const [playerAId, playerBId] = updatedGame.players;
                const playerA = await UserRepo.getUserById(playerAId);
                const playerB = await UserRepo.getUserById(playerBId);
                if (playerA && playerB) {
                    const isShort = updatedGame.timing === "short";
                    const ratingA = isShort ? playerA.shortRating : playerA.longRating;
                    const ratingB = isShort ? playerB.shortRating : playerB.longRating;
                    let resultA: 1 | 0.5 | 0 = 0.5, resultB: 1 | 0.5 | 0 = 0.5;
                    if (!isDraw) {
                        resultA = winnerId === playerAId ? 1 : 0;
                        resultB = 1 - resultA as 1 | 0;
                    }
                    const [newA, newB] = calculateElo(ratingA, ratingB, resultA);

                    // Update ratings
                    await UserRepo.updateUser(playerAId, isShort ? { shortRating: newA } : { longRating: newA });
                    await UserRepo.updateUser(playerBId, isShort ? { shortRating: newB } : { longRating: newB });

                    // Update stats (shortStats/longStats/combinedStats)
                    const statsField = isShort ? "shortStats" : "longStats";
                    const updateStats = (user: any, result: 1 | 0.5 | 0) => {
                        const stats = { ...(user[statsField] || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0 }) };
                        stats.gamesPlayed += 1;
                        if (result === 1) stats.gamesWon += 1;
                        else if (result === 0) stats.gamesLost += 1;
                        else stats.gamesDrawn += 1;
                        return stats;
                    };

                    await UserRepo.updateUser(playerAId, {
                        [statsField]: updateStats(playerA, resultA),
                    });
                    await UserRepo.updateUser(playerBId, {
                        [statsField]: updateStats(playerB, resultB),
                    });
                }
            }

            // Persist game as finished
            await GameRepo.updateGame(updatedGame.id, updatedGame);

            // Archive the game
            await ArchiveRepo.archiveGame(updatedGame);

            // Reload the finished game from DB for response
            const finishedGame = await GameRepo.getGameById(updatedGame.id);
            res.json({ game: finishedGame, message: isDraw ? "Game finished in a draw" : "Game finished" });
            return;
        }

        // Otherwise, update DB
        await GameRepo.updateGame(updatedGame.id, updatedGame);
        res.json({ game: updatedGame });
    } catch (err) {
        res.status(400).json({ error: "Failed to make move", details: err instanceof Error ? err.message : err });
    }
});

router.post("/request", authenticateJWT, async (req: Request, res: Response) => {
    const requester = (req as any).user?.id;
    const { recipient } = req.body;
    if (!requester || !recipient) {
        res.status(400).json({ error: "Missing recipient" });
        return;
    }
    if (requester === recipient) {
        res.status(400).json({ error: "Cannot send a game request to yourself" });
        return;
    }
    const db = getDb();
    // Prevent duplicate requests
    const existing = await db.collection(GAME_REQUESTS_COLLECTION).findOne({
        requester,
        recipient,
        status: "pending"
    });
    if (existing) {
        res.status(409).json({ error: "Game request already pending" });
        return;
    }
    // Insert the game request
    const now = new Date();
    const result = await db.collection(GAME_REQUESTS_COLLECTION).insertOne({
        requester,
        recipient,
        status: "pending",
        createdAt: now
    });

    // Emit socket event to recipient if online
    try {
        const requesterUser = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(requester) });
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId && requesterUser) {
            io.to(recipientSocketId).emit("game_request", {
                fromUserId: requester,
                fromUsername: requesterUser.username,
                requestId: result.insertedId.toString(),
            });
        }
    } catch (err) {
        console.error("Error emitting game_request event:", err);
    }

    res.status(201).json({ success: true });
});

// List incoming/outgoing game requests
router.get("/requests", authenticateJWT, async (req: Request, res: Response) => {
    console.log("Fetching game requests for user");
    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
    }
    const db = getDb();
    try {
        const incoming = await db.collection(GAME_REQUESTS_COLLECTION)
            .find({ recipient: userId, status: "pending" }).toArray();
        const outgoing = await db.collection(GAME_REQUESTS_COLLECTION)
            .find({ requester: userId, status: "pending" }).toArray();
        // Normalize _id to string
        const normalize = (arr: any[]) => arr.map(req => ({
            ...req,
            _id: req._id.toString(),
            requester: req.requester?.toString?.() ?? req.requester,
            recipient: req.recipient?.toString?.() ?? req.recipient,
        }));
        res.json({ incoming: normalize(incoming), outgoing: normalize(outgoing) });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;