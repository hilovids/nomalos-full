import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import gameRouter from "./api/game";
import archiveRouter from "./api/archive";
import userRouter from "./api/user";
import { connectToMongo } from "./database/mongodb";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { GameManager } from "./nomalos/gameManager";
import * as GameRepo from "./database/games";
import createHealthRouter from "./api/health";

dotenv.config();

const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split("|") || ["http://localhost:3000"],
        credentials: true
    }
});

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
app.use(rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later."
}));
app.use(express.json());

// Connect to MongoDB before starting the server
connectToMongo().then(() => {
    app.use("/api/game", gameRouter);
    app.use("/api/archive", archiveRouter);
    app.use("/api/user", userRouter);

    const matchmakingQueue: any[] = [];

    // Socket.IO connection handler
    io.on("connection", (socket) => {
        console.log(`[SOCKET] Connected: ${socket.id}`);

        socket.on("find_match", async ({ userId, username, rating, timing, size }) => {
            console.log(`[SOCKET] find_match from ${socket.id} (${username}, rating: ${rating}, timing: ${timing}, size: ${size})`);
            // Try to find a match
            const matchIndex = matchmakingQueue.findIndex(
                (p) =>
                    p.userId !== userId &&
                    Math.abs(p.rating - rating) < 100 && // ELO difference threshold
                    p.timing === timing &&
                    p.size === size
            );

            if (matchIndex !== -1) {
                const opponent = matchmakingQueue.splice(matchIndex, 1)[0];
                // Create game (call GameManager or API logic)
                const players = [userId, opponent.userId];
                const playerUsernames = [username, opponent.username];
                const game = GameManager.createGame("multiplayer", timing, players, playerUsernames, size);
                await GameRepo.createGame(game);

                console.log(`[SOCKET] Match found: ${username} (${socket.id}) vs ${opponent.username} (${opponent.socketId}) -> Game ID: ${game.id}`);

                // Notify both players
                io.to(socket.id).emit("match_found", { gameId: game.id, opponent: opponent.username });
                io.to(opponent.socketId).emit("match_found", { gameId: game.id, opponent: username });

                // Join both to game room
                socket.join(game.id);
                io.sockets.sockets.get(opponent.socketId)?.join(game.id);
            } else {
                // Add to queue
                matchmakingQueue.push({ userId, username, rating, timing, size, socketId: socket.id });
                socket.emit("waiting_for_match");
                console.log(`[SOCKET] Added to matchmaking queue: ${username} (${socket.id})`);
            }
        });

        function updateActivity() {
            (socket as any).lastActivity = Date.now();
        }
        (socket as any).lastActivity = Date.now();
        socket.onAny(() => updateActivity());

        socket.on("cancel_matchmaking", () => {
            const idx = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
            if (idx !== -1) {
                const removed = matchmakingQueue.splice(idx, 1)[0];
                console.log(`[SOCKET] cancel_matchmaking: Removed ${removed.username} (${socket.id}) from queue`);
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
                // Call the same logic as your REST API (simulate a request/response)
                const game = await GameRepo.getGameById(gameId);
                if (!game) {
                    console.log(`[SOCKET] move_error: Game not found (gameId=${gameId})`);
                    socket.emit("move_error", "Game not found");
                    return;
                }
                // Authorization: Only allow players in the game to move
                if (!userId || !game.players.includes(userId)) {
                    console.log(`[SOCKET] move_error: Unauthorized move attempt by userId=${userId} in gameId=${gameId}`);
                    socket.emit("move_error", "You are not a player in this game.");
                    return;
                }
                // Input validation
                const boardSize = game.state.board.size;
                if (
                    typeof row !== "number" || typeof col !== "number" ||
                    row < 0 || row >= boardSize || col < 0 || col >= boardSize
                ) {
                    console.log(`[SOCKET] move_error: Invalid move input (row=${row}, col=${col}, boardSize=${boardSize})`);
                    socket.emit("move_error", "Invalid move input");
                    return;
                }
                // Check turn
                const currentPlayerId = game.state.currentPlayer === 1 ? game.blackPlayer : game.whitePlayer;
                if (userId !== currentPlayerId) {
                    console.log(`[SOCKET] move_error: Not user's turn (userId=${userId}, currentPlayerId=${currentPlayerId})`);
                    socket.emit("move_error", "It's not your turn.");
                    return;
                }
                // Apply the move
                const { makeMove } = require("./nomalos/gameState");
                const newState = makeMove(game.state, row, col);
                if (!newState) {
                    console.log(`[SOCKET] move_error: Invalid move (row=${row}, col=${col})`);
                    socket.emit("move_error", "Invalid move");
                    return;
                }
                game.state = newState;
                game.updatedAt = new Date();

                // Emit game update to all clients in this game room
                io.to(game.id).emit("game_update", { gameId: game.id, game });
                console.log(`[SOCKET] game_update emitted for gameId=${game.id}`);

                // Handle game over
                let isDraw = false;
                let winnerId: string | null = null;
                if (newState.isOver) {
                    if (newState.winner === 1) {
                        winnerId = game.blackPlayer;
                    } else if (newState.winner === 2) {
                        winnerId = game.whitePlayer;
                    } else {
                        isDraw = true;
                        winnerId = null;
                    }
                    game.winner = winnerId;
                    io.to(game.id).emit("game_over", { gameId: game.id, winner: winnerId, isDraw });
                    console.log(`[SOCKET] game_over emitted for gameId=${game.id}, winner=${winnerId}, isDraw=${isDraw}`);
                    await GameRepo.updateGame(game.id, game);
                } else {
                    await GameRepo.updateGame(game.id, game);
                }
            } catch (err) {
                console.error(`[SOCKET] move_error: Server error processing move`, err);
                socket.emit("move_error", "Server error processing move");
            }
        });
    });

    app.use("/api/health", createHealthRouter(io, matchmakingQueue));

    // Periodic cleanup for idle sockets
    const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    setInterval(() => {
        const now = Date.now();
        for (const socket of io.sockets.sockets.values()) {
            const lastActivity = (socket as any).lastActivity || 0;
            const inMatchmaking = matchmakingQueue.some(q => q.socketId === socket.id);
            const inGame = Array.from(socket.rooms).some(room => room !== socket.id && room.startsWith("game_"));
            if (!inMatchmaking && !inGame && now - lastActivity > IDLE_TIMEOUT_MS) {
                console.log(`[CLEANUP] Disconnecting idle socket: ${socket.id}`);
                socket.disconnect(true);
            }
        }
    }, 60 * 1000); // Check every minute

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});