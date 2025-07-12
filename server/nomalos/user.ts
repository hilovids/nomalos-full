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
    shortRatingHistory?: EloEntry[];
    longRatingHistory?: EloEntry[];
    allowFriendRequests?: boolean;
    allowGameRequests?: boolean;
};

export type EloEntry = {
    date: Date;
    shortRating: number;
    longRating: number;
};