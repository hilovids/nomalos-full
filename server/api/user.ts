import { Router, Request, Response } from "express";
import * as UserRepo from "../database/users";
import bcrypt from "bcryptjs";

const router = Router();

/**
 * Login or register a user by username.
 * - If the username exists and has no password, log in.
 * - If the username exists and has a password, require password.
 * - If the username does not exist, create a new user.
 */
router.post("/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username) {
        res.status(400).json({ error: "Username is required" });
        return;
    }

    let user = await UserRepo.getUserByUsername(username);

    if (!user) {
        // Create new user
        const newUser = {
            username,
            shortRating: 1000,
            longRating: 1000,
            lastSeen: new Date(),
            shortStats: {
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesDrawn: 0
            },
            longStats: {
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesDrawn: 0
            },
            combinedStats: {
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesDrawn: 0
            }
        };
        const id = await UserRepo.createUser(newUser);
        user = await UserRepo.getUserById(id.toString());
        res.status(201).json({ user, message: "Account created and logged in" });
        return;
    }

    // User exists
    if (user.passwordHash) {
        if (!password) {
            res.status(401).json({ error: "Password required for this account" });
            return;
        }
        // Use bcrypt to compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: "Incorrect password" });
            return;
        }
    }

    // Update lastSeen
    await UserRepo.updateUser(user.id, { lastSeen: new Date() });

    res.json({ user, message: "Logged in" });
});

/**
 * Set or update a password for a user.
 * Requires username and password.
 */
router.post("/set-password", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
    }

    const user = await UserRepo.getUserByUsername(username);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    // Hash the password before storing
    const hash = await bcrypt.hash(password, 10);
    await UserRepo.updateUser(user.id, { passwordHash: hash });
    res.json({ message: "Password set/updated" });
});

/**
 * Get user by username
 */
router.get("/:username", async (req: Request, res: Response) => {
    const user = await UserRepo.getUserByUsername(req.params.username);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json(user);
});

export default router;