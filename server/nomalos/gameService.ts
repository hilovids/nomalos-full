import * as GameRepo from "../database/games";
import * as UserRepo from "../database/users";
import * as ArchiveRepo from "../database/archive";
import { ObjectId } from "mongodb";
import { Game, GameMode, GameTiming } from "../nomalos/game";
import { GameState, createGameState } from "../nomalos/gameState";
import { calculateElo } from "../utils/eloUtils";

export default class GameService {
    // Fetch a game by ID from the database
    static async getGame(gameId: string): Promise<Game | null> {
        return await GameRepo.getGameById(gameId) as Game | null;
    }

    static async updateEloAndStats(game: Game, winnerId: string | null) {
        if (!game.rated || !game.players || game.players.length !== 2) {
            console.log("Game not rated or invalid players:", game);
            return;
        }

        const [playerAId, playerBId] = game.players;
        const playerA = await UserRepo.getUserById(playerAId);
        const playerB = await UserRepo.getUserById(playerBId);
        if (!playerA || !playerB) {
            console.log("Could not find both players:", playerAId, playerBId, playerA, playerB);
            return;
        }

        const isShort = game.timing === "short";
        const ratingA = isShort ? playerA.shortRating : playerA.longRating;
        const ratingB = isShort ? playerB.shortRating : playerB.longRating;

        // Use precalculated ELO outcomes
        if (!game.eloOutcomes) {
            console.log("No precalculated ELO outcomes found on game object.");
            return;
        }

        let eloDeltaA = 0, eloDeltaB = 0;
        if (winnerId) {
            // Winner gets win delta, loser gets loss delta
            if (winnerId === playerAId) {
                eloDeltaA = game.eloOutcomes[playerAId]?.win ?? 0;
                eloDeltaB = game.eloOutcomes[playerBId]?.loss ?? 0;
            } else {
                eloDeltaA = game.eloOutcomes[playerAId]?.loss ?? 0;
                eloDeltaB = game.eloOutcomes[playerBId]?.win ?? 0;
            }
        } else {
            // Should not happen in Nomalos, but fallback to 0
            eloDeltaA = 0;
            eloDeltaB = 0;
        }

        const newA = ratingA + eloDeltaA;
        const newB = ratingB + eloDeltaB;

        // Update ratings in DB
        await UserRepo.updateUser(playerAId, isShort ? { shortRating: newA } : { longRating: newA });
        await UserRepo.updateUser(playerBId, isShort ? { shortRating: newB } : { longRating: newB });

        // Update stats
        const statsField = isShort ? "shortStats" : "longStats";
        const updateStats = (user: any, result: 1 | 0) => {
            const stats = { ...(user[statsField] || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 }) };
            stats.gamesPlayed += 1;
            if (result === 1) stats.gamesWon += 1;
            else stats.gamesLost += 1;
            return stats;
        };

        // Only win/loss in Nomalos
        const resultA = winnerId === playerAId ? 1 : 0;
        const resultB = winnerId === playerBId ? 1 : 0;

        await UserRepo.updateUser(playerAId, {
            [statsField]: updateStats(playerA, resultA),
        });
        await UserRepo.updateUser(playerBId, {
            [statsField]: updateStats(playerB, resultB),
        });

        // Update game object with ELO deltas for future reference
        const eloChanges = {
            [playerAId]: eloDeltaA,
            [playerBId]: eloDeltaB,
        };
        game.eloChanges = eloChanges;
        await GameRepo.updateGame(game.id, game);

        // Return the ELO deltas for both players
        return eloChanges;
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
            }
            game.winner = winnerId;
        }

        await GameService.updateEloAndStats(game, winnerId);

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

        await GameService.updateEloAndStats(game, winnerId);
        await GameRepo.updateGame(game.id, game);
        await ArchiveRepo.archiveGame(game);

        return { game, winnerId };
    }

    // End a game (for admin or system use)
    static async endGame(
        gameId: string,
        winnerId: string | null = null,
    ): Promise<Game> {
        const game = await GameRepo.getGameById(gameId) as Game | null;
        if (!game) throw new Error("Game not found");

        game.state.isOver = true;
        if (winnerId) {
            game.state.winner = winnerId === game.blackPlayer ? 1 : 2;
            game.winner = winnerId;
        }
        game.updatedAt = new Date();

        await GameService.updateEloAndStats(game, winnerId);
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
        playerRatings: { [userId: string]: number },
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

        // Precalculate ELO outcomes for each player (win/loss only, no draws)
        let eloOutcomes: { [userId: string]: { win: number; loss: number } } = {};
        if (rated) {
            const K = 32;
            function expected(r1: number, r2: number) {
                return 1 / (1 + Math.pow(10, (r2 - r1) / 400));
            }
            // Black
            const blackRating = playerRatings[blackPlayer] ?? 1000;
            const whiteRating = playerRatings[whitePlayer] ?? 1000;
            const expBlack = expected(blackRating, whiteRating);
            const expWhite = expected(whiteRating, blackRating);

            eloOutcomes[blackPlayer] = {
                win: Math.round(K * (1 - expBlack)),
                loss: Math.round(K * (0 - expBlack)),
            };
            eloOutcomes[whitePlayer] = {
                win: Math.round(K * (1 - expWhite)),
                loss: Math.round(K * (0 - expWhite)),
            };
        }

        const game: Game = {
            id: new ObjectId().toString(),
            timing,
            mode,
            rated,
            players: [blackPlayer, whitePlayer],
            playerUsernames: [blackPlayerUsername, whitePlayerUsername],
            playerRatings: playerRatings,
            blackPlayer,
            whitePlayer,
            state,
            createdAt: new Date(),
            updatedAt: new Date(),
            winner: null,
            eloOutcomes
        };

        await GameRepo.createGame(game);
        return game;
    }
}