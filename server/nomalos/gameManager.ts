import { Game, GameMode, GameTiming } from "./game";
import { createGameState } from "./gameState";
import { v4 as uuidv4 } from "uuid";

const activeGames = new Map<string, Game>();

export const GameManager = {
    // Only manages in-memory games and game lifecycle logic

    createGame: (mode: GameMode, timing: GameTiming, players: string[], playerUsernames: string[], size: number = 11): Game => {
        const id = uuidv4();
        const now = new Date();
        const game: Game = {
            id,
            mode,
            timing,
            players,
            playerUsernames,
            blackPlayer: players[0],
            whitePlayer: players[1],
            state: createGameState(size),
            createdAt: now,
            updatedAt: now,
            winner: null,
        };
        activeGames.set(id, game);
        return game;
    },

    getGame: (id: string): Game | null => {
        return activeGames.get(id) || null;
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
    }
};