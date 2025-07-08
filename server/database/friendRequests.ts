import { ObjectId, PullOperator } from "mongodb";
import { getDb } from "./mongodb";

const COLLECTION = "FriendRequests";
const USER_COLLECTION = "Users";


export type FriendRequest = {
    _id?: ObjectId;
    requester: string; // userId
    recipient: string; // userId
    status: "pending" | "accepted" | "declined";
    createdAt: Date;
};

export async function sendFriendRequest(requester: string, recipient: string) {
    const db = getDb();
    const now = new Date();
    // Prevent duplicates
    const existing = await db.collection<FriendRequest>(COLLECTION).findOne({
        requester,
        recipient,
        status: { $in: ["pending", "accepted"] }
    });
    if (existing) throw new Error("Request already exists or already friends");
    await db.collection<FriendRequest>(COLLECTION).insertOne({
        requester,
        recipient,
        status: "pending",
        createdAt: now
    });
}

export async function acceptFriendRequest(requestId: string) {
    const db = getDb();

    // Find the request and ensure it's pending
    const request = await db.collection<FriendRequest>(COLLECTION).findOne({
        _id: new ObjectId(requestId),
        status: "pending"
    });
    if (!request) throw new Error("Request not found or already handled");

    // Update the request status to accepted
    await db.collection<FriendRequest>(COLLECTION).updateOne(
        { _id: new ObjectId(requestId) },
        { $set: { status: "accepted" } }
    );

    // Add each user to the other's friends array (if not already present)
    await db.collection(USER_COLLECTION).updateOne(
        { _id: new ObjectId(request.requester) },
        { $addToSet: { friends: request.recipient } }
    );
    await db.collection(USER_COLLECTION).updateOne(
        { _id: new ObjectId(request.recipient) },
        { $addToSet: { friends: request.requester } }
    );

    return { success: true };
}

export async function declineFriendRequest(requestId: string) {
    const db = getDb();

    // Find the request and ensure it's pending
    const request = await db.collection<FriendRequest>(COLLECTION).findOne({
        _id: new ObjectId(requestId),
        status: "pending"
    });
    if (!request) throw new Error("Request not found or already handled");

    // Update the request status to declined
    await db.collection<FriendRequest>(COLLECTION).updateOne(
        { _id: new ObjectId(requestId) },
        { $set: { status: "declined" } }
    );

    return { success: true };
}

export async function removeFriend(userId: string, friendId: string) {
    const db = getDb();

    // Remove each user from the other's friends array
    await db.collection(USER_COLLECTION).updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { friends: friendId } } as any
    );
    await db.collection(USER_COLLECTION).updateOne(
        { _id: new ObjectId(friendId) },
        { $pull: { friends: userId } } as any
    );

    // Optionally, remove any existing friend requests between these users
    await db.collection<FriendRequest>(COLLECTION).deleteMany({
        $or: [
            { requester: userId, recipient: friendId },
            { requester: friendId, recipient: userId }
        ]
    });

    return { success: true };
}