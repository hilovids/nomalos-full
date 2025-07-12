import { Router } from "express";
import { getDb } from "../database/mongodb";
import { authenticateJWT } from "../middleware/jwt";
import { Badge } from "../nomalos/badge";

const router = Router();

// GET /api/badge/:userId - Get all badges earned by a user
router.get("/:userId", authenticateJWT, async (req, res) => {
  const db = getDb();
  const userId = req.params.userId;

  // Find all badges where awardedTo includes userId
  const badges = await db.collection<Badge>("Badges").find({ awardedTo: userId }).toArray();
  res.json({ badges });
});

export default router;