import { Router, Request, Response } from "express";
import { getDb } from "../database/mongodb";
import { authenticateJWT } from "../middleware/jwt";
import { Tournament } from "../nomalos/tournament";
import { Match } from "../nomalos/match";
import { Badge } from "../nomalos/badge";

const router = Router();

// List all tournaments
router.get("/", async (req: Request, res: Response) => {
    const db = getDb();
    const tournaments = await db.collection<Tournament>("Tournaments").find().toArray();
    res.json({ tournaments });
});

// Get a tournament by ID
router.get("/:id", async (req: Request, res: Response) => {
    const db = getDb();
    const tournament = await db.collection<Tournament>("Tournaments").findOne({ id: req.params.id });
    if (!tournament) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    res.json({ tournament });
});

// Join a tournament
router.post("/:id/join", authenticateJWT, async (req: Request, res: Response) => {
    const db = getDb();
    const userId = (req as any).user?.id;
    const tournament = await db.collection<Tournament>("Tournaments").findOne({ id: req.params.id });
    if (!tournament) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    if (tournament.participants.includes(userId)) {
        res.status(409).json({ error: "Already joined" });
        return;
    }
    await db.collection<Tournament>("Tournaments").updateOne(
        { id: req.params.id },
        { $addToSet: { participants: userId } }
    );
    res.json({ success: true });
});

// Get matches for a tournament
router.get("/:id/matches", async (req: Request, res: Response) => {
    const db = getDb();
    const matches = await db.collection<Match>("Matches").find({ tournamentId: req.params.id }).toArray();
    res.json({ matches });
});

// Report match result
router.post("/:id/report", authenticateJWT, async (req: Request, res: Response) => {
    const db = getDb();
    const { matchId, result } = req.body;
    if (!matchId || !result) {
        res.status(400).json({ error: "Missing matchId or result" });
        return;
    }
    await db.collection<Match>("Matches").updateOne(
        { id: matchId, tournamentId: req.params.id },
        { $set: { result } }
    );
    res.json({ success: true });
});

// Award badges for tournament results
router.post("/:id/award-badges", authenticateJWT, async (req: Request, res: Response) => {
    const db = getDb();
    const tournament = await db.collection<Tournament>("Tournaments").findOne({ id: req.params.id });
    if (!tournament) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    const { firstPlaceUserId, secondPlaceUserId } = req.body;
    const participantUserIds = tournament.participants || [];
    const { firstBadge, secondBadge, participantBadge } = tournament;

    // Award first place badge
    if (firstBadge && firstPlaceUserId) {
        await db.collection<Badge>("Badges").updateOne(
            { id: firstBadge },
            { $addToSet: { awardedTo: firstPlaceUserId } }
        );
    }
    // Award second place badge
    if (secondBadge && secondPlaceUserId) {
        await db.collection<Badge>("Badges").updateOne(
            { id: secondBadge },
            { $addToSet: { awardedTo: secondPlaceUserId } }
        );
    }
    // Award participation badge to all participants
    if (participantBadge && participantUserIds.length > 0) {
        await db.collection<Badge>("Badges").updateOne(
            { id: participantBadge },
            { $addToSet: { awardedTo: { $each: participantUserIds } } }
        );
    }

    res.json({ success: true });
});

export default router;