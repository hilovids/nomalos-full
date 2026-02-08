import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_CONNECTIONSTRING as string;

if (!uri) {
    throw new Error("MONGODB_CONNECTIONSTRING is not set in .env");
}

const client = new MongoClient(uri);

let db: Db | null = null;

export async function connectToMongo(dbName: string = "nomalosSiteData"): Promise<Db> {
    if (!db) {
        await client.connect();
        db = client.db(dbName);
        console.log(`Connected to MongoDB: ${dbName}`);
    }
    return db;
}

export function getDb(): Db {
    if (!db) {
        throw new Error("MongoDB not connected. Call connectToMongo() first.");
    }
    return db;
}