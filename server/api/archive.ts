import { Router, Request, Response } from "express";
import {lehmerDecode} from "../utils/encodingUtils";
import * as ArchiveRepo from "../database/archive";

const router = Router();

// Archive a finished game
// router.post("/", async (req: Request, res: Response) => {
//     try {
//         const id = await ArchiveRepo.archiveGame(req.body);
//         res.status(201).json({ id });
//         return;
//     } catch (err) {
//         res.status(400).json({ error: "Failed to archive game", details: err });
//         return;
//     }
// });

// Get an archived game by ID
// router.get("/:id", async (req: Request, res: Response) => {
//     const game = await ArchiveRepo.getArchivedGameById(req.params.id);
//     if (!game) {
//         res.status(404).json({ error: "Archived game not found" });
//         return;
//     }
//     res.json(game);
//     return;
// });

// Find games with a given move prefix
// router.post("/find-by-prefix", async (req: Request, res: Response) => {
//     const { startingMoves, size } = req.body;
//     const games = await ArchiveRepo.getGamesWithStartingMoves(startingMoves, size);
//     const decodedGames = games.map(game => lehmerDecode(game.canonicalMoveList, size));
//     res.json(decodedGames);
//     return;
// });

export default router;