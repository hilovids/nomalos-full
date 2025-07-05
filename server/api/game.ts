import { Router, Request, Response } from "express";
import * as GameRepo from "../database/games";

const router = Router();

// Create a new game
router.post("/", async (req: Request, res: Response) => {
    try {
        const game = req.body;
        const id = await GameRepo.createGame(game);
        res.status(201).json({ id });
        return;
    } catch (err) {
        res.status(400).json({ error: "Failed to create game", details: err });
        return;
    }
});

// Get a game by ID
router.get("/:id", async (req: Request, res: Response) => {
    const game = await GameRepo.getGameById(req.params.id);
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    res.json(game);
});

// Update a game (e.g., make a move)
router.patch("/:id", async (req: Request, res: Response) => {
    await GameRepo.updateGame(req.params.id, req.body);
    res.status(204).send();
    return;
});

// List games for a user
router.get("/user/:userId", async (req: Request, res: Response) => {
    const games = await GameRepo.getGamesByUserId(req.params.userId);
    res.json(games);
    return;
});

export default router;