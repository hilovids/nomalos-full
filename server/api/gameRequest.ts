import { Router, Request, Response } from "express";
import { createGameRequest, acceptGameRequest, deleteGameRequest, GameRequest } from "../database/gameRequests";
import { getDb } from "../database/mongodb";
import { ObjectId } from "mongodb";
import { authenticateJWT } from "../middleware/jwt";
import { io, userSocketMap } from "..";

const router = Router();
const USER_COLLECTION = "Users";
const GAME_REQUESTS_COLLECTION = "GameRequests";

// --- Helper Validation Functions ---
async function userExists(userId: string) {
    const db = getDb();
    if (!ObjectId.isValid(userId)) return false;
    const user = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(userId) });
    return !!user;
}

// --- Game Request Endpoints ---

// Send a game request
router.post("/send", authenticateJWT, async (req: Request, res: Response) => {
    const requester = (req as any).user?.id;
    const { recipient, timing, rated, size } = req.body;
    if (!requester || !recipient || !timing || typeof rated !== "boolean" || !size) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    if (requester === recipient) {
        res.status(400).json({ error: "Cannot send a game request to yourself" });
        return;
    }
    if (!(await userExists(requester)) || !(await userExists(recipient))) {
        res.status(404).json({ error: "Requester or recipient does not exist" });
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
    try {
        const requestId = await createGameRequest({ requester, recipient, timing, rated, size });
        // Emit socket event to recipient if online
        const requesterUser = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(requester) });
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId && requesterUser) {
            io.to(recipientSocketId).emit("game_request", {
                fromUserId: requester,
                fromUsername: requesterUser.username,
                requestId: requestId.toString(),
                timing,
                rated,
                size,
            });
        }
        res.status(201).json({ success: true, requestId });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Cancel a game request (by requester)
router.post("/cancel", authenticateJWT, async (req: Request, res: Response) => {
    const requester = (req as any).user?.id;
    const { requestId } = req.body;
    if (!requester || !requestId) {
        res.status(400).json({ error: "Missing requestId" });
        return;
    }
    try {
        await deleteGameRequest(requestId);
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Accept a game request
router.post("/accept", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { requestId } = req.body;
    if (!requestId || !userId) {
        res.status(400).json({ error: "Missing requestId" });
        return;
    }
    const db = getDb();
    const request = await db.collection(GAME_REQUESTS_COLLECTION).findOne({ _id: new ObjectId(requestId), status: "pending" });
    if (!request || request.recipient !== userId) {
        res.status(403).json({ error: "Not authorized to accept this request" });
        return;
    }
    try {
        const gameId = await acceptGameRequest(request as GameRequest);
        const requesterSocketId = userSocketMap.get(request.requester);
        if (requesterSocketId) {
            io.to(requesterSocketId).emit("game_status_update", {
                userId, // the user who accepted
                status: "accepted",
                requestId,
                gameId, // <-- send gameId to the requester too
            });
        }
        res.status(200).json({ success: true, gameId }); // <-- return gameId to client
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Decline a game request
router.post("/decline", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { requestId } = req.body;
    if (!requestId || !userId) {
        res.status(400).json({ error: "Missing requestId" });
        return;
    }
    const db = getDb();
    const request = await db.collection(GAME_REQUESTS_COLLECTION).findOne({ _id: new ObjectId(requestId), status: "pending" });
    if (!request || request.recipient !== userId) {
        res.status(403).json({ error: "Not authorized to decline this request" });
        return;
    }
    try {
        await deleteGameRequest(requestId);
        // --- SOCKET EMIT TO REQUESTER ---
        const requesterSocketId = userSocketMap.get(request.requester);
        if (requesterSocketId) {
            io.to(requesterSocketId).emit("game_status_update", {
                userId, // the user who declined
                status: "declined",
                requestId,
            });
        }
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// List incoming/outgoing game requests
router.get("/requests", authenticateJWT, async (req: Request, res: Response) => {
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

        // Collect all unique user IDs to fetch usernames
        const userIds = [
            ...incoming.map(req => req.requester),
            ...outgoing.map(req => req.recipient),
        ].filter(Boolean).map(id => id.toString());
        const uniqueUserIds = [...new Set(userIds)].map(id => new ObjectId(id));

        // Fetch users in one query
        const users = await db.collection(USER_COLLECTION)
            .find({ _id: { $in: uniqueUserIds } })
            .project({ username: 1 })
            .toArray();
        const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u.username]));

        // Attach usernames to requests
        const normalize = (arr: any[], type: "incoming" | "outgoing") => arr.map(req => ({
            ...req,
            _id: req._id.toString(),
            requester: req.requester?.toString?.() ?? req.requester,
            recipient: req.recipient?.toString?.() ?? req.recipient,
            requesterUsername: userMap[req.requester?.toString?.() ?? req.requester] || req.requester,
            recipientUsername: userMap[req.recipient?.toString?.() ?? req.recipient] || req.recipient,
        }));

        res.json({
            incoming: normalize(incoming, "incoming"),
            outgoing: normalize(outgoing, "outgoing"),
        });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;