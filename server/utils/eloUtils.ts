const K_FACTOR = 32;

/**
 * Calculate new ELO ratings for two players after a game.
 * @param ratingA Player A's current rating
 * @param ratingB Player B's current rating
 * @param resultA 1 = win for A, 0.5 = draw, 0 = loss for A
 * @returns [newRatingA, newRatingB]
 */
export function calculateElo(
    ratingA: number,
    ratingB: number,
    resultA: 1 | 0.5 | 0,
): [number, number] {
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));
    const newA = ratingA + K_FACTOR * (resultA - expectedA);
    const newB = ratingB + K_FACTOR * ((1 - resultA) - expectedB);
    return [Math.round(newA), Math.round(newB)];
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