import { Game, GameMode, GameTiming } from "./game";
import { createGameState } from "./gameState";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for active games
const activeGames = new Map<string, Game>();

export const GameManager = {
    createGame: (mode: GameMode, timing: GameTiming, players: string[], playerUsernames: string[], size: number = 11): Game => {
        const id = uuidv4();
        const now = new Date();
        const game: Game = {
            id,
            mode,
            timing,
            players,
            playerUsernames,
            state: createGameState(size),
            createdAt: now,
            updatedAt: now,
            winner: null,
        };
        activeGames.set(id, game);
        return game;
    },

    getGame: (id: string): Game | undefined => {
        return activeGames.get(id);
    },

    updateGame: (id: string, game: Game): void => {
        game.updatedAt = new Date();
        activeGames.set(id, game);
    },

    removeGame: (id: string): void => {
        activeGames.delete(id);
    },

    listGames: (): Game[] => {
        return Array.from(activeGames.values());
    },
};