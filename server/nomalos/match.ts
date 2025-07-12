export class Match {
  id: string;
  tournamentId: string;
  round: number;
  player1: string; // user ID
  player2: string; // user ID
  gameId: string | null;
  result: "pending" | "player1" | "player2" | "forfeit";

  constructor(params: {
    id: string;
    tournamentId: string;
    round: number;
    player1: string;
    player2: string;
    gameId?: string | null;
    result?: "pending" | "player1" | "player2" | "forfeit";
  }) {
    this.id = params.id;
    this.tournamentId = params.tournamentId;
    this.round = params.round;
    this.player1 = params.player1;
    this.player2 = params.player2;
    this.gameId = params.gameId || null;
    this.result = params.result || "pending";
  }
}