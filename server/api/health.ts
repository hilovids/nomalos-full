import { Router, Request, Response } from "express";
import { Server, Socket } from "socket.io";

export default function createHealthRouter(io: Server, matchmakingQueue: any[]) {
    const router = Router();

    // List all connected sockets and matchmaking queue
    router.get("/sockets", (req: Request, res: Response) => {
        const sockets = Array.from(io.sockets.sockets.values()).map(socket => ({
            id: socket.id,
            handshake: socket.handshake,
            rooms: Array.from(socket.rooms),
        }));

        res.json({
            connectedSockets: sockets,
            matchmakingQueue,
        });
    });

    // Remove (disconnect) a socket by ID
    router.post("/sockets/disconnect", async (req: Request, res: Response) => {
        const { socketId } = req.body;
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) {
            res.status(404).json({ error: "Socket not found" });
            return;
        }
        socket.disconnect(true);
        res.json({ success: true, message: `Socket ${socketId} disconnected` });
    });

    return router;
}