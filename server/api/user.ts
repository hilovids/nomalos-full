import { Router, Request, Response } from "express";
import * as UserRepo from "../database/users";
import * as GameRepo from "../database/games";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateJWT } from "../middleware/jwt";
import { GameTiming } from "../nomalos/game";
import leoProfanity from "leo-profanity";


const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export function sanitizeUser(user: any) {
    if (!user) return user;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}

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

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        res.status(400).json({ error: "Username may only contain letters, numbers, and underscores." });
        return;
    }

    if (username.length <= 3 || username.length >= 20) {
        res.status(400).json({ error: "Username must be between 3 and 20 characters long." });
        return;
    }

    if (leoProfanity.check(username)) {
        res.status(400).json({ error: "Username contains inappropriate language." });
        return;
    }
    if (password && leoProfanity.check(password)) {
        res.status(400).json({ error: "Password contains inappropriate language." });
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
            },
            ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {})
        };

        const id = await UserRepo.createUser(newUser);
        user = await UserRepo.getUserById(id.toString());
        if (!user) {
            res.status(500).json({ error: "Failed to create user" });
            return;
        }
        // Issue JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ user: sanitizeUser(user), token, message: "Account created and logged in" });
        return;
    }
    else {
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
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
            res.status(201).json({ user: sanitizeUser(user), token, message: "Logged in" });
            await UserRepo.updateUser(user.id, { lastSeen: new Date() });
            return;
        }
        else {
            if (password) {
                const newUser = {
                    ...user,
                    passwordHash: await bcrypt.hash(password, 10)
                };
                newUser.lastSeen = new Date();
                await UserRepo.updateUser(user.id, newUser);
                const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: "7d" });
                res.status(201).json({ user: sanitizeUser(newUser), token, message: "Logged in" });
                return;
            } else {
                const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
                res.status(201).json({ user: sanitizeUser(user), token, message: "Logged in" });
                return;
            }
        }
    }
});

router.delete("/:userId", authenticateJWT, async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const user = await UserRepo.getUserById(userId);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    await UserRepo.deleteUser(userId);
    res.json({ message: "User deleted successfully" });
});

/**
 * Set or update a password for a user.
 * Requires username and password.
 */
router.post("/set-password", authenticateJWT, async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
    }

    if (username.length <= 3 || username.length >= 20) {
        res.status(400).json({ error: "Username must be between 3 and 20 characters long." });
        return;
    }
    
    if (leoProfanity.check(username)) {
        res.status(400).json({ error: "Username contains inappropriate language." });
        return;
    }

    if (leoProfanity.check(password)) {
        res.status(400).json({ error: "Password contains inappropriate language." });
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
 * Get user by userId
 */
router.get("/:userId", authenticateJWT, async (req: Request, res: Response) => {
    const user = await UserRepo.getUserById(req.params.userId);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json(sanitizeUser(user));
});

// Get all games for a user (protected)
router.get("/games/:userId", authenticateJWT, async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const games = await GameRepo.getGamesByUserId(userId);
    res.json(games);
});

router.post("/logout", authenticateJWT, async (req: Request, res: Response) => {
    // Optionally, you can implement token blacklisting here if needed. REDIS
    res.json({ message: "Logged out. Please remove your token on the client." });
});

router.get("/leaderboard/:gameTiming", authenticateJWT, async (req: Request, res: Response) => {
    const gameTiming = req.params.gameTiming || "short"; // Default to short timing if not specified
    if (!["short", "long"].includes(gameTiming)) {
        res.status(400).json({ error: "Invalid game timing" });
        return;
    }
    const leaderboard = await UserRepo.getLeaderboard(gameTiming as GameTiming);
    res.status(200).json(leaderboard);
});

export default router;