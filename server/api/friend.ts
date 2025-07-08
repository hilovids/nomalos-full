import { Router, Request, Response } from "express";
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from "../database/friendRequests";
import { getDb } from "../database/mongodb";
import { ObjectId } from "mongodb";
import { authenticateJWT } from "../middleware/jwt";

const router = Router();
const USER_COLLECTION = "Users";
const FRIEND_REQUESTS_COLLECTION = "FriendRequest";

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
    const { requester, recipient } = req.body;
    if (!requester || !recipient) {
        res.status(400).json({ error: "Missing requester or recipient" });
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
    const { requester, recipient } = req.body;
    if (!requester || !recipient) {
        res.status(400).json({ error: "Missing requester or recipient" });
        return;
    }
    const db = getDb();
    try {
        await db.collection(FRIEND_REQUESTS_COLLECTION).deleteOne({
            requester,
            recipient,
            status: "pending"
        });
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Accept a friend request
router.post("/accept", authenticateJWT, async (req: Request, res: Response) => {
    const { requestId, userId } = req.body;
    if (!requestId || !userId) {
        res.status(400).json({ error: "Missing requestId or userId" });
        return;
    }
    if (!(await friendRequestIsPending(requestId))) {
        res.status(404).json({ error: "Friend request not found or already handled" });
        return;
    }
    try {
        await acceptFriendRequest(requestId);
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Decline a friend request
router.post("/decline", authenticateJWT, async (req: Request, res: Response) => {
    const { requestId, userId } = req.body;
    if (!requestId || !userId) {
        res.status(400).json({ error: "Missing requestId or userId" });
        return;
    }
    if (!(await friendRequestIsPending(requestId))) {
        res.status(404).json({ error: "Friend request not found or already handled" });
        return;
    }
    try {
        await declineFriendRequest(requestId);
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Remove a friend
router.post("/remove", authenticateJWT, async (req: Request, res: Response) => {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
        res.status(400).json({ error: "Missing userId or friendId" });
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
    const userId = req.query.userId?.toString();
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
        res.json({ friends });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// List incoming/outgoing friend requests
router.get("/requests", authenticateJWT, async (req: Request, res: Response) => {
    const userId = req.query.userId?.toString();
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
        res.json({ incoming, outgoing });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;