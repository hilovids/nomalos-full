import { Swiss } from "tournament-pairings";
/**
 * Maps participants and their scores/ratings to Swiss player objects.
 * @param participants Array of user objects: { id: string, score: number, rating?: number }
 * @param round Current round number
 * @returns Swiss tournament instance
 */
export function createSwissTournament(
  participants: { id: string; score: number; rating?: number }[],
  round: number
) {

  // Create Swiss tournament instance
  const swissTournament = Swiss(participants, round, true, true);

  return swissTournament;
}

export function getSwissRounds(participantCount: number): number {
  return Math.ceil(Math.log2(participantCount));
}
