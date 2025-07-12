import { Router, Request, Response } from "express";
import { getDb } from "../database/mongodb";
import { authenticateJWT } from "../middleware/jwt";

const router = Router();
const FRIEND_REQUESTS_COLLECTION = "FriendRequests";
const GAME_REQUESTS_COLLECTION = "GameRequests";

// GET /api/request/count - returns total count of incoming friend + game requests
router.get("/count", authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
    }
    const db = getDb();
    try {
        const [friendCount, gameCount] = await Promise.all([
            db.collection(FRIEND_REQUESTS_COLLECTION).countDocuments({ recipient: userId, status: "pending" }),
            db.collection(GAME_REQUESTS_COLLECTION).countDocuments({ recipient: userId, status: "pending" }),
        ]);
        res.json({ count: friendCount + gameCount, friendCount, gameCount });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;