import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { User } from "../nomalos/user";

const COLLECTION = "Users";

// Create a new user
export async function createUser(user: Omit<User, "id">): Promise<ObjectId> {
    const db = getDb();
    const now = new Date();
    const result = await db.collection<User>(COLLECTION).insertOne({
        ...user,
        createdAt: now,
        updatedAt: now,
    } as any); // 'as any' to allow extra fields for timestamps
    return result.insertedId;
}

// Get a user by their ObjectId
export async function getUserById(id: string): Promise<User | null> {
    const db = getDb();
    const user = await db.collection<User>(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    // Convert _id to id string for consistency
    return { ...user, id: user._id?.toString() };
}

// Get a user by username
export async function getUserByUsername(username: string): Promise<User | null> {
    const db = getDb();
    const user = await db.collection<User>(COLLECTION).findOne({ username });
    if (!user) return null;
    return { ...user, id: user._id?.toString() };
}

// Update a user by their ObjectId
export async function updateUser(id: string, update: Partial<User>): Promise<void> {
    const db = getDb();
    await db.collection<User>(COLLECTION).updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...update, updatedAt: new Date() } }
    );
}

// Delete a user by their ObjectId
export async function deleteUser(id: string): Promise<void> {
    const db = getDb();
    await db.collection<User>(COLLECTION).deleteOne({ _id: new ObjectId(id) });
}

// List all users (optionally with a filter)
export async function listUsers(filter: Partial<User> = {}): Promise<User[]> {
    const db = getDb();
    const users = await db.collection<User>(COLLECTION).find(filter).toArray();
    // Convert _id to id string for all users
    return users.map(user => ({ ...user, id: user._id?.toString() }));
}