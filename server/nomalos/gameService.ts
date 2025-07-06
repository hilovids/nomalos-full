import * as GameRepo from "../database/games";
import * as UserRepo from "../database/users";
import * as ArchiveRepo from "../database/archive";
import { ObjectId } from "mongodb";
import { Game, GameMode, GameTiming } from "../nomalos/game";
import { GameState, createGameState } from "../nomalos/gameState";
import { User } from "../nomalos/user";
import { calculateElo } from "../utils/eloUtils";

export default class GameService {
    // Fetch a game by ID from the database
    static async getGame(gameId: string): Promise<Game | null> {
        return await GameRepo.getGameById(gameId) as Game | null;
    }

    static async updateEloAndStats(game: Game, winnerId: string | null, isDraw: boolean) {
        if (!game.rated || !game.players || game.players.length !== 2) return;

        const [playerAId, playerBId] = game.players;
        const playerA = await UserRepo.getUserById(playerAId);
        const playerB = await UserRepo.getUserById(playerBId);
        if (!playerA || !playerB) return;

        const isShort = game.timing === "short";
        const ratingA = isShort ? playerA.shortRating : playerA.longRating;
        const ratingB = isShort ? playerB.shortRating : playerB.longRating;

        let resultA: 1 | 0.5 | 0 = 0.5, resultB: 1 | 0.5 | 0 = 0.5;
        if (!isDraw) {
            resultA = winnerId === playerAId ? 1 : 0;
            resultB = 1 - resultA as 1 | 0;
        }
        const [newA, newB] = calculateElo(ratingA, ratingB, resultA);

        // Update ratings
        await UserRepo.updateUser(playerAId, isShort ? { shortRating: newA } : { longRating: newA });
        await UserRepo.updateUser(playerBId, isShort ? { shortRating: newB } : { longRating: newB });

        // Update stats
        const statsField = isShort ? "shortStats" : "longStats";
        const updateStats = (user: any, result: 1 | 0.5 | 0) => {
            const stats = { ...(user[statsField] || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0 }) };
            stats.gamesPlayed += 1;
            if (result === 1) stats.gamesWon += 1;
            else if (result === 0) stats.gamesLost += 1;
            else stats.gamesDrawn += 1;
            return stats;
        };

        await UserRepo.updateUser(playerAId, {
            [statsField]: updateStats(playerA, resultA),
        });
        await UserRepo.updateUser(playerBId, {
            [statsField]: updateStats(playerB, resultB),
        });

        const eloChanges = {
            [playerAId]: newA - ratingA,
            [playerBId]: newB - ratingB,
        };
        game.eloChanges = eloChanges;
        await GameRepo.updateGame(game.id, game);
    }

    // Make a move in the game
    static async makeMove(
        gameId: string,
        row: number,
        col: number,
        userId: string
    ): Promise<false | { game: Game; winnerId: string | null; isDraw: boolean }> {
        const game = await GameRepo.getGameById(gameId) as Game | null;
        if (!game) return false;

        // Authorization: Only allow players in the game to move
        if (!userId || !game.players.includes(userId)) {
            return false;
        }

        // Check turn
        const currentPlayerId = game.state.currentPlayer === 1 ? game.blackPlayer : game.whitePlayer;
        if (userId !== currentPlayerId) {
            return false;
        }

        // Input validation
        const boardSize = game.state.board.size;
        if (
            typeof row !== "number" || typeof col !== "number" ||
            row < 0 || row >= boardSize || col < 0 || col >= boardSize
        ) {
            return false;
        }

        // Apply the move using your game logic
        const { makeMove } = require("./gameState") as { makeMove: (state: GameState, row: number, col: number) => GameState | null };
        const newState = makeMove(game.state, row, col);
        if (!newState) {
            return false;
        }

        game.state = newState;
        game.updatedAt = new Date();

        // Handle game over
        let isDraw = false;
        let winnerId: string | null = null;
        if (newState.isOver) {
            if (newState.winner === 1) {
                winnerId = game.blackPlayer;
            } else if (newState.winner === 2) {
                winnerId = game.whitePlayer;
            } else {
                isDraw = true;
                winnerId = null;
            }
            game.winner = winnerId;
        }

        await GameService.updateEloAndStats(game, winnerId, isDraw);

        await GameRepo.updateGame(game.id, game);

        // Optionally archive if game is over
        // if (newState.isOver) {
        //     await ArchiveRepo.archiveGame(game);
        // }

        return { game, winnerId, isDraw };
    }

    // Forfeit a game
    static async forfeitGame(
        gameId: string,
        userId: string
    ): Promise<false | { game: Game; winnerId: string | null }> {
        const game = await GameRepo.getGameById(gameId) as Game | null;
        if (!game) return false;

        // Only allow players in the game to forfeit
        if (!userId || !game.players.includes(userId)) {
            return false;
        }
        if (game.state.isOver || game.winner) {
            return false;
        }

        // The other player is the winner
        let winnerId: string | null = null;
        if (userId === game.blackPlayer) {
            winnerId = game.whitePlayer;
        } else if (userId === game.whitePlayer) {
            winnerId = game.blackPlayer;
        }

        game.state.isOver = true;
        game.state.winner = winnerId === game.blackPlayer ? 1 : 2;
        game.winner = winnerId;
        game.updatedAt = new Date();

        await GameService.updateEloAndStats(game, winnerId, false);
        await GameRepo.updateGame(game.id, game);
        await ArchiveRepo.archiveGame(game);

        return { game, winnerId };
    }

    // End a game (for admin or system use)
    static async endGame(
        gameId: string,
        winnerId: string | null = null,
        isDraw = false
    ): Promise<Game> {
        const game = await GameRepo.getGameById(gameId) as Game | null;
        if (!game) throw new Error("Game not found");

        game.state.isOver = true;
        if (isDraw) {
            game.state.winner = null;
            game.winner = null;
        } else if (winnerId) {
            game.state.winner = winnerId === game.blackPlayer ? 1 : 2;
            game.winner = winnerId;
        }
        game.updatedAt = new Date();

        await GameService.updateEloAndStats(game, winnerId, isDraw);
        await GameRepo.updateGame(game.id, game);
        await ArchiveRepo.archiveGame(game);

        return game;
    }

    // Create a new game
    static async createGame(
        mode: GameMode,
        timing: GameTiming,
        rated: boolean,
        players: [string, string],
        playerUsernames: [string, string],
        size: number
    ): Promise<Game> {
        // Randomly assign black and white
        const blackIdx = Math.random() < 0.5 ? 0 : 1;
        const whiteIdx = 1 - blackIdx;

        const blackPlayer = players[blackIdx];
        const whitePlayer = players[whiteIdx];
        const blackPlayerUsername = playerUsernames[blackIdx];
        const whitePlayerUsername = playerUsernames[whiteIdx];

        const state = createGameState(size);
        const game: Game = {
            id: new ObjectId().toString(),
            timing,
            mode,
            rated,
            players: [blackPlayer, whitePlayer],
            playerUsernames: [blackPlayerUsername, whitePlayerUsername],
            blackPlayer,
            whitePlayer,
            state,
            createdAt: new Date(),
            updatedAt: new Date(),
            winner: null,
        };

        await GameRepo.createGame(game);
        return game;
    }
}