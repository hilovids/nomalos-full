const K_FACTOR = 32;

export function calculateElo(r1: number, r2: number, score: number): [number, number] {
    const K = 32;
    const expected1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    const expected2 = 1 / (1 + Math.pow(10, (r1 - r2) / 400));
    const newR1 = Math.round(r1 + K * (score - expected1));
    const newR2 = Math.round(r2 + K * ((1 - score) - expected2));
    return [newR1, newR2];
}

/**
 * Predict ELO change for a player for win, draw, and loss scenarios.
 * @param playerRating The player's current rating
 * @param opponentRating The opponent's current rating
 * @returns [winChange, drawChange, lossChange]
 */
export function predictEloChange(
    playerRating: number,
    opponentRating: number
): [number, number, number] {
    const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const winChange = Math.round(K_FACTOR * (1 - expected));
    const drawChange = Math.round(K_FACTOR * (0.5 - expected));
    const lossChange = Math.round(K_FACTOR * (0 - expected));
    return [winChange, drawChange, lossChange];
}