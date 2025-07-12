import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import gameRouter from "./api/game";
import userRouter from "./api/user";
import friendRouter from "./api/friend";
import requestRouter from "./api/request";
import badgeRouter from "./api/badge";
import gameRequestRouter from "./api/gameRequest";
import { connectToMongo } from "./database/mongodb";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import * as GameRepo from "./database/games";
import createHealthRouter from "./api/health";
import GameService from "./nomalos/gameService";
import cron from "node-cron";
import { clearStaleGameRequests } from "./database/gameRequests";


dotenv.config();

const app = express();
app.use(express.json());
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split("|") || ["http://localhost:3000"],
        credentials: true
    }
});

export const userSocketMap = new Map<string, string>();

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${req.method}] ${new Date().toISOString()} ${req.originalUrl} from ${req.ip}`);
    next();
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split("|") || ["http://localhost:3000"],
    credentials: true
}));
// app.use(rateLimit({
//     windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//     max: Number(process.env.RATE_LIMIT_MAX) || 100,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: "Too many requests, please try again later."
// }));
app.use(express.json());

// Connect to MongoDB before starting the server
connectToMongo().then(() => {
    app.use("/api/game", gameRouter);
    app.use("/api/user", userRouter);
    app.use("/api/friend", friendRouter);
    app.use("/api/request", requestRouter);
    app.use("/api/game-request", gameRequestRouter);
    app.use("/api/badge", badgeRouter);

    const matchmakingQueue: any[] = [];

    // Socket.IO connection handler
    io.on("connection", (socket) => {
        console.log(`[SOCKET] Connected: ${socket.id}`);

        function updateActivity() {
            (socket as any).lastActivity = Date.now();
        }

        io.emit("online_count", io.engine.clientsCount);


        socket.on("disconnect", () => {
            io.emit("online_count", io.engine.clientsCount);
        });

        socket.on("register", ({ userId }) => {
            const oldSocketId = userSocketMap.get(userId);
            if (oldSocketId && oldSocketId !== socket.id) {
                const oldSocket = io.sockets.sockets.get(oldSocketId);
                if (oldSocket) {
                    oldSocket.disconnect(true);
                    console.log(`[SOCKET] Disconnected previous socket for user ${userId}: ${oldSocketId}`);
                }
            }
            userSocketMap.set(userId, socket.id);
            (socket as any).userId = userId;
            console.log(`[SOCKET] Registered user ${userId} to socket ${socket.id}`);
        });

        socket.on("find_match", async ({ userId, username, rating, timing, size, rated }) => {
            console.log(`[SOCKET] find_match from ${socket.id} (${username}, rating: ${rating}, timing: ${timing}, size: ${size}, rated: ${rated})`);
            // Try to find a match
            const matchIndex = matchmakingQueue.findIndex(
                (p) =>
                    p.userId !== userId &&
                    Math.abs(p.rating - rating) < 500 && // ELO difference threshold
                    p.timing === timing &&
                    p.size === size &&
                    p.rated === rated // Only match with same rated/unrated preference
            );

            if (matchIndex !== -1) {
                const opponent = matchmakingQueue.splice(matchIndex, 1)[0];
                // Create game using GameService
                const players: [string, string] = [userId, opponent.userId];
                const playerUsernames: [string, string] = [username, opponent.username];
                const playerRatings: { [userId: string]: number } = {
                    [userId]: rating,
                    [opponent.userId]: opponent.rating
                };
                const game = await GameService.createGame(
                    "multiplayer",
                    timing,
                    rated,
                    players,
                    playerUsernames,
                    playerRatings,
                    size
                );
                console.log(`[SOCKET] Match found: ${username} (${socket.id}) vs ${opponent.username} (${opponent.socketId}) -> Game ID: ${game.id}`);

                // Notify both players
                io.to(socket.id).emit("match_found", { gameId: game.id, opponent: opponent.username });
                io.to(opponent.socketId).emit("match_found", { gameId: game.id, opponent: username });

                // Join both to game room
                socket.join(game.id);
                io.sockets.sockets.get(opponent.socketId)?.join(game.id);
            } else {
                // Add to queue
                matchmakingQueue.push({ userId, username, rating, timing, size, rated, socketId: socket.id });
                socket.emit("waiting_for_match");
                console.log(`[SOCKET] Added to matchmaking queue: ${username} (${socket.id})`);
            }
        });

        (socket as any).lastActivity = Date.now();
        socket.onAny(() => updateActivity());

        socket.on("cancel_matchmaking", () => {
            const idx = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
            if (idx !== -1) {
                const removed = matchmakingQueue.splice(idx, 1)[0];
                console.log(`[SOCKET] cancel_matchmaking: Removed ${removed.username} (${socket.id}) from queue`);
            }
        });

        socket.on("self_ui_update", ({ userId }) => {
            // Find the socket for this user
            const socketId = userSocketMap.get(userId);
            if (socketId) {
                // Emit both status updates in case either is needed
                io.to(socketId).emit("friend_status_update");
                io.to(socketId).emit("game_status_update");
            }
        });

        socket.on("game_request_accepted", (data) => {
            // data should include the recipient's userId (the original requester)
            const { recipientUserId, gameId } = data;
            const recipientSocketId = userSocketMap.get(recipientUserId);
            console.log(`[SOCKET] game_request_accepted: ${socket.id} accepted request for gameId=${gameId} from ${recipientUserId}`);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("game_request_accepted", {
                    gameId
                });
            }
        });

        socket.on("join_game", (gameId) => {
            socket.join(gameId);
            console.log(`[SOCKET] ${socket.id} joined room ${gameId}`);
        });

        socket.on("disconnect", () => {
            const idx = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
            if (idx !== -1) {
                const removed = matchmakingQueue.splice(idx, 1)[0];
                console.log(`[SOCKET] Disconnected: Removed ${removed.username} (${socket.id}) from queue`);
            } else {
                console.log(`[SOCKET] Disconnected: ${socket.id}`);
            }
        });

        socket.on("move", async ({ gameId, row, col, userId }) => {
            console.log(`[SOCKET] move: userId=${userId}, gameId=${gameId}, row=${row}, col=${col}`);
            try {
                const result = await GameService.makeMove(gameId, row, col, userId);
                if (!result) {
                    socket.emit("move_error", "Invalid move or not your turn.");
                    return;
                }
                const { game, winnerId, isDraw } = result;

                // Emit game update to all clients in this game room
                io.to(game.id).emit("game_update", { gameId: game.id, game });
                console.log(`[SOCKET] game_update emitted for gameId=${game.id}`);

                // Handle game over
                if (game.state.isOver) {
                    io.to(game.id).emit("game_over", {
                        gameId: game.id,
                        winner: winnerId,
                        isDraw
                    });
                    console.log(`[SOCKET] game_over emitted for gameId=${game.id}, winner=${winnerId}, isDraw=${isDraw}`);
                }
            } catch (err) {
                console.error(`[SOCKET] move_error: Server error processing move`, err);
                socket.emit("move_error", "Server error processing move");
            }
        });

        socket.on("forfeit_game", async ({ gameId, userId }) => {
            try {
                const result = await GameService.forfeitGame(gameId, userId);
                if (!result) {
                    socket.emit("forfeit_error", "Invalid forfeit request.");
                    return;
                }
                const { game, winnerId } = result;

                io.to(game.id).emit("game_over", {
                    gameId: game.id,
                    winner: winnerId,
                    isDraw: false,
                    forfeit: true,
                    forfeitedBy: userId
                });

                console.log(`[SOCKET] forfeit_game: userId=${userId} forfeited gameId=${gameId}, winner=${winnerId}`);
            } catch (err) {
                console.error(`[SOCKET] forfeit_error: Server error processing forfeit`, err);
                socket.emit("forfeit_error", "Server error processing forfeit");
            }
        });
    });

    app.use("/api/health", createHealthRouter(io, matchmakingQueue));


    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    cron.schedule("* * * * * *", async () => {
        const now = new Date();
        // Get all in-progress games
        const games = await GameRepo.getActiveGames(); // Implement this to return games where !state.isOver
        for (const game of games) {
            const isShort = game.timing === "short";
            const msLimit = isShort ? 30 * 1000 : 24 * 60 * 60 * 1000; // 30 sec or 24 hours
            const lastMove = new Date(game.updatedAt || game.createdAt);
            if (now.getTime() - lastMove.getTime() > msLimit) {
                console.log(`[CRON] Forfeiting game ${game.id} due to inactivity`);
                // It's the current player's turn, so forfeit for them
                const currentPlayerId =
                    game.state.currentPlayer === 1 ? game.blackPlayer : game.whitePlayer;
                const result = await GameService.forfeitGame(game.id, currentPlayerId);

                // Determine winnerId after forfeit
                let winnerId = null;
                if (result && result.game && result.game.winner) {
                    winnerId = result.game.winner;
                }

                io.to(game.id).emit("game_over", {
                    gameId: game.id,
                    winner: winnerId,
                    isDraw: false,
                    forfeit: true,
                    forfeitedBy: currentPlayerId
                });
            }
        }
    });

    cron.schedule("*/10 * * * *", async () => {
        await clearStaleGameRequests(10);
        console.log("[CRON] Cleared stale game requests older than 10 minutes");
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});