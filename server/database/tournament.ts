import { getDb } from "../database/mongodb";
import { Match } from "../nomalos/match";
import { createSwissTournament, getSwissRounds } from "../utils/tournamentUtils";
import { ObjectId } from "mongodb";

export async function startTournament(tournamentId: string) {
  const db = getDb();
  const tournament = await db.collection("Tournaments").findOne({ _id: new ObjectId(tournamentId) });
  if (!tournament || tournament.status !== "upcoming") return false;

  const participantCount = tournament.participants.length;
  if (participantCount < 2) {
    // Not enough participants: mark tournament as finished
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      { $set: { status: "finished", endTime: new Date() } }
    );
    return false;
  }

  // Calculate rounds and set current round
  const totalRounds = getSwissRounds(participantCount);
  const currentRound = 1;

  // Generate Swiss pairings for round 1
  const swissTournament = createSwissTournament(
    tournament.participants.map((id: string) => ({
      id,
      score: 0,
      rating: null // Optionally fetch ratings from Users collection
    })),
    currentRound
  );
  const matches = swissTournament;

  // Create match documents
  const matchDocs = matches.map(match => ({
    _id: new ObjectId(tournamentId + "-" + currentRound + "-" + match.match),
    tournamentId: tournamentId,
    round: currentRound,
    matchNumber: match.match,
    player1: match.player1,
    player2: match.player2,
    winner: null,
    status: "pending",
  }));

  // Insert matches
  const matchInsert = await db.collection("Matches").insertMany(matchDocs);
  const matchIds = Object.values(matchInsert.insertedIds);

  // Update tournament status, rounds, matches, and current round
  await db.collection("Tournaments").updateOne(
    { _id: new ObjectId(tournamentId) },
    {
      $set: {
        status: "active",
        totalRounds,
        currentRound,
        matches: matchIds
      }
    }
  );

  // TODO: Send notifications to users about their matches

  return true;
}

export async function getTournamentMatches(tournamentId: string, round: number) {
  const db = getDb();
  const matches = await db.collection("Matches").find({
    tournamentId,
    round
  }).toArray();
  return matches;
}

export async function reportMatchVictory(tournamentId: string, matchId: string, winnerId: string, loserId: string, scoreWinner = 1, scoreLoser = 0) {
  const db = getDb();

  // Update the match document
  await db.collection("Matches").updateOne(
    { _id: new ObjectId(matchId) },
    { $set: { winner: winnerId, status: "finished" } }
  );

  // Get current scores from tournament
  const tournament = await db.collection("Tournaments").findOne({ _id: new ObjectId(tournamentId) });
  if (!tournament) return false;

  const results = tournament.results || {};

  // Update scores
  results[winnerId] = (results[winnerId] ?? 0) + scoreWinner;
  results[loserId] = (results[loserId] ?? 0) + scoreLoser;

  // Save updated scores to tournament
  await db.collection("Tournaments").updateOne(
    { _id: new ObjectId(tournamentId) },
    { $set: { results } }
  );

  return true;
}

export async function reportAbandonedMatch(
  tournamentId: string,
  matchId: string,
  player1Id: string,
  player2Id: string,
  abandonedScore = 0.25
) {
  const db = getDb();

  // Update the match document
  await db.collection("Matches").updateOne(
    { _id: new ObjectId(matchId) },
    { $set: { status: "abandoned" } }
  );

  // Get current scores from tournament
  const tournament = await db.collection("Tournaments").findOne({ _id: new ObjectId(tournamentId) });
  if (!tournament) return false;

  const results = tournament.results || {};

  // Assign abandoned score to both players
  results[player1Id] = (results[player1Id] ?? 0) + abandonedScore;
  results[player2Id] = (results[player2Id] ?? 0) + abandonedScore;

  // Save updated scores to tournament
  await db.collection("Tournaments").updateOne(
    { _id: new ObjectId(tournamentId) },
    { $set: { results } }
  );

  return true;
}