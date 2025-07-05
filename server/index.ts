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
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.ip}`);
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

        socket.on("cancel_matchmaking", () => {
            const idx = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
            if (idx !== -1) {
                const removed = matchmakingQueue.splice(idx, 1)[0];
                console.log(`[SOCKET] cancel_matchmaking: Removed ${removed.username} (${socket.id}) from queue`);
            }
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
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});