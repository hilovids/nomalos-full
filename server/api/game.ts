import { Router, Request, Response } from "express";
import { GameManager } from "../nomalos/gameManager";
import * as GameRepo from "../database/games";
import * as UserRepo from "../database/users";
import * as ArchiveRepo from "../database/archive";
import { makeMove } from "../nomalos/gameState";
import { calculateElo } from "../utils/eloUtils";
import { Space } from "../nomalos/space";
import rateLimit from "express-rate-limit";
import { io } from "../index"; // <-- Socket.IO instance

const router = Router();

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
        const { mode, timing, players, playerUsernames, size } = req.body;
        // --- 2. Input validation ---
        if (
            !Array.isArray(players) || players.length !== 2 ||
            !Array.isArray(playerUsernames) || playerUsernames.length !== 2 ||
            !["short", "long"].includes(timing)
        ) {
            res.status(400).json({ error: "Invalid game creation parameters" });
            return;
        }
        const game = GameManager.createGame(mode, timing, players, playerUsernames, size);
        await GameRepo.createGame(game);
        res.status(201).json({ id: game.id, game });
        return;
    } catch (err) {
        res.status(400).json({ error: "Failed to create game", details: err instanceof Error ? err.message : err });
        return;
    }
});

// Get a game by ID
router.get("/:id", async (req: Request, res: Response) => {
    let game = GameManager.getGame(req.params.id);
    if (!game) {
        game = await GameRepo.getGameById(req.params.id);
    }
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    res.json(game);
});

// --- 9. Per-user rate limiting, 3. Auth, 2. Input validation, 4. Error handling, 5. Concurrency, 1. Draw handling, 8. Forfeit ---
router.post("/:id/move", moveLimiter, async (req: Request, res: Response) => {
    const { row, col, userId } = req.body;
    let game = GameManager.getGame(req.params.id);
    if (!game) {
        game = await GameRepo.getGameById(req.params.id);
        if (!game) {
            res.status(404).json({ error: "Game not found" });
            return;
        }
        GameManager.updateGame(game.id, game);
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

    // Apply the move
    const newState = makeMove(game.state, row, col);
    if (!newState) {
        res.status(400).json({ error: "Invalid move" });
        return;
    }
    game.state = newState;
    game.updatedAt = new Date();

    // Emit game update to all clients in this game room
    io.to(game.id).emit("game_update", { gameId: game.id, game });

    // --- 1. Draw Handling ---
    let isDraw = false;
    let winnerId: string | null = null;
    if (newState.isOver) {
        if (newState.winner === Space.Black) {
            winnerId = game.blackPlayer;
        } else if (newState.winner === Space.White) {
            winnerId = game.whitePlayer;
        } else {
            isDraw = true;
            winnerId = null;
        }
        game.winner = winnerId;

        // Emit game over event
        io.to(game.id).emit("game_over", { gameId: game.id, winner: winnerId, isDraw });

        // --- ELO and stats update (for 2-player games) ---
        if (game.players.length === 2) {
            const [playerAId, playerBId] = game.players;
            const playerA = await UserRepo.getUserById(playerAId);
            const playerB = await UserRepo.getUserById(playerBId);
            if (playerA && playerB) {
                const isShort = game.timing === "short";
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
                const updateCombined = (user: any, result: 1 | 0.5 | 0) => {
                    const stats = { ...(user.combinedStats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0 }) };
                    stats.gamesPlayed += 1;
                    if (result === 1) stats.gamesWon += 1;
                    else if (result === 0) stats.gamesLost += 1;
                    else stats.gamesDrawn += 1;
                    return stats;
                };

                await UserRepo.updateUser(playerAId, {
                    [statsField]: updateStats(playerA, resultA),
                    combinedStats: updateCombined(playerA, resultA)
                });
                await UserRepo.updateUser(playerBId, {
                    [statsField]: updateStats(playerB, resultB),
                    combinedStats: updateCombined(playerB, resultB)
                });
            }
        }

        // Persist game as finished
        await GameRepo.updateGame(game.id, game);

        // Remove from memory if present
        GameManager.removeGame(game.id);

        // Archive the game
        await ArchiveRepo.archiveGame(game);

        // Reload the finished game from DB for response
        const finishedGame = await GameRepo.getGameById(game.id);
        res.json({ game: finishedGame, message: isDraw ? "Game finished in a draw" : "Game finished" });
        return;
    }

    // Otherwise, update in memory and DB
    GameManager.updateGame(game.id, game);
    await GameRepo.updateGame(game.id, game);
    res.json({ game });
});

// --- 8. Forfeit endpoint ---
router.post("/:id/forfeit", async (req: Request, res: Response) => {
    const { userId } = req.body;
    let game = GameManager.getGame(req.params.id);
    if (!game) {
        game = await GameRepo.getGameById(req.params.id);
        if (!game) {
            res.status(404).json({ error: "Game not found" });
            return;
        }
        GameManager.updateGame(game.id, game);
    }

    // Only allow a player in the game to forfeit
    if (!userId || !(await isUserInGame(userId, game))) {
        res.status(403).json({ error: "You are not a player in this game." });
        return;
    }

    // Can't forfeit if already over
    if (game.state.isOver) {
        res.status(409).json({ error: "Game is already finished." });
        return;
    }

    // The other player is the winner
    let winnerId: string | null = null;
    if (userId === game.blackPlayer) {
        winnerId = game.whitePlayer;
    } else if (userId === game.whitePlayer) {
        winnerId = game.blackPlayer;
    }

    game.state.isOver = true;
    game.state.winner = winnerId === game.blackPlayer ? Space.Black : Space.White;
    game.winner = winnerId;

    // Emit forfeit event
    io.to(game.id).emit("game_forfeit", { gameId: game.id, winner: winnerId });

    // ELO and stats update (for 2-player games)
    if (game.players.length === 2 && winnerId) {
        const [playerAId, playerBId] = game.players;
        const playerA = await UserRepo.getUserById(playerAId);
        const playerB = await UserRepo.getUserById(playerBId);
        if (playerA && playerB) {
            const isShort = game.timing === "short";
            const ratingA = isShort ? playerA.shortRating : playerA.longRating;
            const ratingB = isShort ? playerB.shortRating : playerB.longRating;
            const resultA = winnerId === playerAId ? 1 : 0;
            const resultB = 1 - resultA as 1 | 0;
            const [newA, newB] = calculateElo(ratingA, ratingB, resultA);

            // Update ratings
            await UserRepo.updateUser(playerAId, isShort ? { shortRating: newA } : { longRating: newA });
            await UserRepo.updateUser(playerBId, isShort ? { shortRating: newB } : { longRating: newB });

            // Update stats (shortStats/longStats/combinedStats)
            const statsField = isShort ? "shortStats" : "longStats";
            const updateStats = (user: any, isWinner: boolean) => {
                const stats = { ...(user[statsField] || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0 }) };
                stats.gamesPlayed += 1;
                if (isWinner) stats.gamesWon += 1;
                else stats.gamesLost += 1;
                return stats;
            };
            const updateCombined = (user: any, isWinner: boolean) => {
                const stats = { ...(user.combinedStats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0 }) };
                stats.gamesPlayed += 1;
                if (isWinner) stats.gamesWon += 1;
                else stats.gamesLost += 1;
                return stats;
            };

            await UserRepo.updateUser(playerAId, {
                [statsField]: updateStats(playerA, resultA === 1),
                combinedStats: updateCombined(playerA, resultA === 1)
            });
            await UserRepo.updateUser(playerBId, {
                [statsField]: updateStats(playerB, resultB === 1),
                combinedStats: updateCombined(playerB, resultB === 1)
            });
        }
    }

    // Persist game as finished
    await GameRepo.updateGame(game.id, game);

    // Remove from memory if present
    GameManager.removeGame(game.id);

    // Archive the game
    await ArchiveRepo.archiveGame(game);

    // Reload the finished game from DB for response
    const finishedGame = await GameRepo.getGameById(game.id);
    res.json({ game: finishedGame, message: "Game forfeited" });
});

export default router;