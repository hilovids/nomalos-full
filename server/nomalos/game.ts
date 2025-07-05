import { GameState } from "./gameState";

// Game modes
export type GameMode = "single" | "bot" | "multiplayer";

export type GameTiming = "short" | "long";

// Game model
export type Game = {
    id: string;
    mode: GameMode;
    timing: GameTiming;
    players: string[]; // [blackPlayerId, whitePlayerId]
    playerUsernames: string[];
    blackPlayer: string; // user ID for Black
    whitePlayer: string; // user ID for White
    state: GameState;
    createdAt: Date;
    updatedAt: Date;
    winner: string | null;
};