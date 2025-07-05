import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { Game } from "../nomalos/game";
import { canonicalizeMoveList, compressMoveList } from "../utils/encodingUtils";

const ARCHIVE_COLLECTION = "archived_games";

// Utility to condense game data for archive
function condenseGameForArchive(game: Game) {
    const size = game.state.board.size;
    const compressed = compressMoveList(game.state.moveList, size);
    return compressed;
}

// Archive a finished game (condensed format)
export async function archiveGame(game: Game) {
    const db = getDb();
    const condensed = condenseGameForArchive(game);
    const result = await db.collection(ARCHIVE_COLLECTION).insertOne({ _id: new ObjectId(condensed.toString()), moves: canonicalizeMoveList(game.state.moveList, game.state.board.size)});
    return result.insertedId;
}

// Get an archived game by its MongoDB ObjectId
export async function getArchivedGameById(id: string) {
    const db = getDb();
    return db.collection(ARCHIVE_COLLECTION).findOne({ _id: new ObjectId(id) });
}

// Find games where the first N moves match a given prefix
export async function getGamesWithStartingMoves(startingMoves: number[], size: number) {
    const db = getDb();
    const canonicalPrefix = canonicalizeMoveList(startingMoves, size);

    const matchExpr = {
        $expr: {
            $and: canonicalPrefix.map((val, idx) => ({
                $eq: [{ $arrayElemAt: ["$canonicalMoveList", idx] }, val]
            }))
        }
    };

    return db.collection(ARCHIVE_COLLECTION).find(matchExpr).toArray();
}