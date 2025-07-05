export type User = {
    id: string;
    username: string;
    passwordHash?: string;
    shortRating: number;
    longRating: number;
    lastSeen: Date;
    shortStats: {
        gamesPlayed: number;
        gamesWon: number;
        gamesLost: number;
        gamesDrawn: number;
    };
    longStats: {
        gamesPlayed: number;
        gamesWon: number;
        gamesLost: number;
        gamesDrawn: number;
    };
    combinedStats: {
        gamesPlayed: number;
        gamesWon: number;
        gamesLost: number;
        gamesDrawn: number;
    };
};