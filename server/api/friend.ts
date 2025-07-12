import { Router, Request, Response } from "express";
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from "../database/friendRequests";
import { getDb } from "../database/mongodb";
import { ObjectId } from "mongodb";
import { authenticateJWT } from "../middleware/jwt";
import { io, userSocketMap } from "..";

const router = Router();
const USER_COLLECTION = "Users";
const FRIEND_REQUESTS_COLLECTION = "FriendRequests";

// --- Helper Validation Functions ---
async function userExists(userId: string) {
    const db = getDb();
    if (!ObjectId.isValid(userId)) return false;
    const user = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(userId) });
    return !!user;
}

async function friendRequestIsPending(requestId: string) {
    const db = getDb();
    if (!ObjectId.isValid(requestId)) return false;
    const req = await db.collection(FRIEND_REQUESTS_COLLECTION).findOne({ _id: new ObjectId(requestId), status: "pending" });
    return !!req;
}

// --- Friend Endpoints ---

// Send a friend request
// Send a friend request
router.post("/send", authenticateJWT, async (req: Request, res: Response) => {
    const requester = (req as any).user?.id;
    const { recipient } = req.body;
    if (!requester || !recipient) {
        res.status(400).json({ error: "Missing recipient" });
        return;
    }
    if (requester === recipient) {
        res.status(400).json({ error: "Cannot send a friend request to yourself" });
        return;
    }
    if (!(await userExists(requester)) || !(await userExists(recipient))) {
        res.status(404).json({ error: "Requester or recipient does not exist" });
        return;
    }
    try {
        await sendFriendRequest(requester, recipient);
        res.status(201).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

router.post("/cancel", authenticateJWT, async (req: Request, res: Response) => {
    const requester = (req as any).user?.id;
    const { recipient } = req.body;
    if (!requester || !recipient) {
        res.status(400).json({ error: "Missing recipient" });
        return;
    }
    const db = getDb();
    try {
        await db.collection(FRIEND_REQUESTS_COLLECTION).deleteOne({
            requester,
            recipient,
            status: "pending"
        });
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("friend_status_update", {
                recipient, // the user who accepted
                status: "declined",
            });
        }
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Accept a friend request
router.post("/accept", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { requestId } = req.body;
    if (!requestId || !userId) {
        res.status(400).json({ error: "Missing requestId" });
        return;
    }
    // Check that the request exists and the logged-in user is the recipient
    const db = getDb();
    const request = await db.collection(FRIEND_REQUESTS_COLLECTION).findOne({ _id: new ObjectId(requestId), status: "pending" });
    if (!request || request.recipient !== userId) {
        res.status(403).json({ error: "Not authorized to accept this request" });
        return;
    }
    try {
        await acceptFriendRequest(requestId);
        // --- SOCKET EMIT TO REQUESTER ---
        const requesterId = request.requester;
        const requesterSocketId = userSocketMap.get(requesterId);
        if (requesterSocketId) {
            io.to(requesterSocketId).emit("friend_status_update", {
                userId, // the user who accepted
                status: "accepted",
            });
        }
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Decline a friend request
router.post("/decline", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { requestId } = req.body;
    if (!requestId || !userId) {
        res.status(400).json({ error: "Missing requestId or userId" });
        return;
    }
    const db = getDb();
    const request = await db.collection(FRIEND_REQUESTS_COLLECTION).findOne({ _id: new ObjectId(requestId), status: "pending" });
    if (!request || request.recipient !== userId) {
        res.status(403).json({ error: "Not authorized to decline this request" });
        return;
    }
    if (!(await friendRequestIsPending(requestId))) {
        res.status(404).json({ error: "Friend request not found or already handled" });
        return;
    }
    try {
        await declineFriendRequest(requestId);
        // --- SOCKET EMIT TO REQUESTER ---
        const requesterId = request.requester;
        const requesterSocketId = userSocketMap.get(requesterId);
        if (requesterSocketId) {
            io.to(requesterSocketId).emit("friend_status_update", {
                userId, // the user who declined
                status: "declined",
            });
        }
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Remove a friend
router.post("/remove", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { friendId } = req.body;
    if (!userId || !friendId) {
        res.status(400).json({ error: "Missing friendId" });
        return;
    }
    if (userId === friendId) {
        res.status(400).json({ error: "Cannot remove yourself as a friend" });
        return;
    }
    if (!(await userExists(userId)) || !(await userExists(friendId))) {
        res.status(404).json({ error: "User or friend does not exist" });
        return;
    }
    try {
        await removeFriend(userId, friendId);
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// List a user's friends
router.get("/list", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id; // Use user ID from JWT
    if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
    }
    const db = getDb();
    try {
        const user = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(userId) });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const friends = await db.collection(USER_COLLECTION)
            .find({ _id: { $in: (user.friends || []).map((id: string) => new ObjectId(id)) } })
            .project({ username: 1, online: 1 })
            .toArray();
        // Normalize _id to string
        const normalizedFriends = friends.map((f: any) => ({
            ...f,
            _id: f._id.toString(),
        }));
        res.json({ friends: normalizedFriends });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// List incoming/outgoing friend requests
router.get("/requests", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
    }
    const db = getDb();
    try {
        const incoming = await db.collection(FRIEND_REQUESTS_COLLECTION)
            .find({ recipient: userId, status: "pending" }).toArray();
        const outgoing = await db.collection(FRIEND_REQUESTS_COLLECTION)
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