export type User = {
    id: string;
    username: string;
    passwordHash?: string;
    rating: number;
    lastSeen?: Date;
    stats?: {
        gamesPlayed: number;
        gamesWon: number;
        gamesLost: number;
        gamesDrawn: number;
    };
};