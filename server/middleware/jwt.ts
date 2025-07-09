import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Replace this with your actual secret, or load from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Define the expected payload type
interface JwtPayload {
    id: string;
    username?: string;
    // add other fields if needed
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (!payload.id) {
            res.status(401).json({ error: "Invalid token payload" });
            return;
        }
        // Attach user info to request
        (req as any).user = { id: payload.id, username: payload.username };
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }
}