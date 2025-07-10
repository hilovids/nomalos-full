import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { GameTiming } from "../nomalos/game";
import GameService from "../nomalos/gameService";
import { getUserById } from "./users";

export type GameRequest = {
    _id?: ObjectId;
    requester: string;
    recipient: string;
    status: "pending" | "accepted";
    createdAt: Date;
    timing: GameTiming;
    rated: boolean;
    size: number;
};

const COLLECTION = "GameRequests";

export async function createGameRequest(data: {
    requester: string;
    recipient: string;
    timing: GameTiming;
    rated: boolean;
    size: number;
}) {
    const db = getDb();
    const now = new Date();
    const result = await db.collection<GameRequest>(COLLECTION).insertOne({
        requester: data.requester,
        recipient: data.recipient,
        timing: data.timing,
        rated: data.rated,
        size: data.size,
        status: "pending",
        createdAt: now,
    });
    return result.insertedId;
}

// Create a new game request
export async function acceptGameRequest(request: GameRequest) {
    const db = getDb();
    console.log("acceptGameRequest", request);
    const [requesterUser, recipientUser] = await Promise.all([
        await getUserById(request.requester),
        await getUserById(request.recipient)
    ]);
    console.log(["acceptGameRequest", request, requesterUser, recipientUser]);
    if (!requesterUser || !recipientUser) throw new Error("Requester or recipient user not found");

    // Prepare ratings array based on fetched users
    const playerRatings: { [userId: string]: number } = {
        [request.requester]: request.timing === "short" ? requesterUser.shortRating : requesterUser.longRating,
        [request.recipient]: request.timing === "short" ? recipientUser.shortRating : recipientUser.longRating
    };

    // Get the gameId from GameService.createGame
    const gameId = await GameService.createGame(
        "multiplayer",
        request.timing,
        request.rated,
        [requesterUser.id, recipientUser.id],
        [requesterUser.username, recipientUser.username], // Use requester and recipient as usernames
        playerRatings,
        request.size
    );

    // Delete the request after accepting
    await db.collection<GameRequest>(COLLECTION).deleteOne({ _id: request._id });

    return gameId; // <-- return the gameId
}

// Delete a game request (used for decline, cancel, or clearing stale requests)
export async function deleteGameRequest(requestId: string) {
    const db = getDb();
    await db.collection<GameRequest>(COLLECTION).deleteOne({ _id: new ObjectId(requestId) });
}

// Utility: Delete all stale (pending and old) game requests
export async function clearStaleGameRequests(olderThanMinutes = 60) {
    const db = getDb();
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    await db.collection<GameRequest>(COLLECTION).deleteMany({
        status: "pending",
        createdAt: { $lt: cutoff }
    });
}