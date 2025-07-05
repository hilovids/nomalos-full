import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { Game } from "../nomalos/game"; // Import your Game type

const COLLECTION = "games";

// Create a new game document
export async function createGame(game: Game) {
    const db = getDb();
    const result = await db.collection<Game>(COLLECTION).insertOne(game);
    return result.insertedId;
}

// Get a game by its MongoDB ObjectId
export async function getGameById(id: string): Promise<Game | null> {
    const db = getDb();
    return db.collection<Game>(COLLECTION).findOne({ _id: new ObjectId(id) });
}

// Update a game by its MongoDB ObjectId
export async function updateGame(id: string, update: Partial<Game>) {
    const db = getDb();
    return db.collection<Game>(COLLECTION).updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
    );
}

// Get all games for a given userId (assumes userId is in the players array)
export async function getGamesByUserId(userId: string): Promise<Game[]> {
    const db = getDb();
    return db.collection<Game>(COLLECTION).find({ players: userId }).toArray();
}