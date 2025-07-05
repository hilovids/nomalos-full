import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import gameRouter from "./api/game";
import archiveRouter from "./api/archive";
import userRouter from "./api/user";
import { connectToMongo } from "./database/mongodb";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split("|") || ["http://localhost:3000"],
    credentials: true
}));
app.use(rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later."
}));
app.use(express.json());

// Connect to MongoDB before starting the server
connectToMongo().then(() => {
    app.use("/api/game", gameRouter);
    app.use("/api/archive", archiveRouter);
    app.use("/api/user", userRouter);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});