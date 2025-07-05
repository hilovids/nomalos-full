import { GameState } from "./gameState";

// Game modes
export type GameMode = "single" | "bot" | "multiplayer";

export type GameTiming = "live" | "async";

// Game model
export type Game = {
    id: string;
    mode: GameMode;
    timing: GameTiming;
    players: string[];
    playerUsernames: string[];
    state: GameState;
    createdAt: Date;
    updatedAt: Date;
    winner: string | null;
};