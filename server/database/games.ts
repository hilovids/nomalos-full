import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { Game } from "../nomalos/game";

const COLLECTION = "Games";

// Create a new game document
export async function createGame(game: Game) {
    const db = getDb();
    // If the game doesn't have an id, generate one (as a string)
    if (!game.id) {
        game.id = new ObjectId().toHexString();
    }
    // Store both a custom string id and let MongoDB generate _id
    const result = await db.collection<Game>(COLLECTION).insertOne(game);
    return game.id;
}

export async function getActiveGames() {
    const db = getDb();
    return await db.collection("Games").find({ "state.isOver": { $ne: true } }).toArray();
}

// Get a game by its custom string id or MongoDB ObjectId
export async function getGameById(id: string): Promise<Game | null> {
    const db = getDb();
    // Try to find by custom id field first
    let game = await db.collection<Game>(COLLECTION).findOne({ id });
    if (!game && ObjectId.isValid(id)) {
        // Fallback: try MongoDB _id
        game = await db.collection<Game>(COLLECTION).findOne({ _id: new ObjectId(id) });
    }
    return game;
}

// Update a game by its custom string id or MongoDB ObjectId
export async function updateGame(id: string, update: Partial<Game>) {
    const db = getDb();
    // Try to update by custom id field first
    let result = await db.collection<Game>(COLLECTION).updateOne(
        { id },
        { $set: update }
    );
    if (result.matchedCount === 0 && ObjectId.isValid(id)) {
        // Fallback: try MongoDB _id
        result = await db.collection<Game>(COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        );
    }
    return result;
}

// Get all games for a given userId (assumes userId is in the players array)
export async function getGamesByUserId(userId: string): Promise<Game[]> {
    const db = getDb();
    return db
        .collection<Game>(COLLECTION)
        .find({ players: userId })
        .sort({ updatedAt: -1, createdAt: -1 }) // Sort by updatedAt, then createdAt, newest first
        .toArray();
}