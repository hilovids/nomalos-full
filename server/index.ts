import express from "express";
import gameRouter from "./api/game";
import { connectToMongo } from "./database/mongodb";

const app = express();
app.use(express.json());

// Connect to MongoDB before starting the server
connectToMongo().then(() => {
    app.use("/api/game", gameRouter);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});