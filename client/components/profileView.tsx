import Link from "next/link";
import React from "react";

type UserStats = {
    gamesPlayed?: number;
    gamesWon?: number;
    gamesLost?: number;
};

type Game = any; // You can type this more strictly if you want

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getResult(game: any, userId: string) {
    if (game.wasAborted) return { label: "Aborted", color: "text-gray-400", icon: "🏳️" };
    if (!game.state?.isOver) return { label: "In Progress", color: "text-gray-400", icon: "⏳" };
    if (!userId) return { label: "—", color: "text-gray-400", icon: "" };
    if (game.winner === userId) return { label: "Win", color: "text-green-400", icon: "✔️" };
    if (game.winner && game.winner !== userId) return { label: "Loss", color: "text-red-400", icon: "❌" };
    return { label: "Draw", color: "text-yellow-400", icon: "➖" };
}

export function ProfileStats({
    username,
    lastSeen,
    shortStats,
    longStats,
    shortRating,
    longRating,
    isSelf,
    onDelete,
    onFindGame,
    onNewGame,
    showDelete,
    isOwnProfile, // <-- add this prop
}: {
    username: string;
    lastSeen?: string;
    shortStats: UserStats;
    longStats: UserStats;
    shortRating: number;
    longRating: number;
    isSelf?: boolean;
    onDelete?: () => void;
    onFindGame?: () => void;
    onNewGame?: () => void;
    showDelete?: boolean;
    isOwnProfile?: boolean; // <-- add this prop
}) {
    return (
        <section className="mb-6 bg-[#181818] rounded-lg shadow p-4 sm:p-6 w-full relative">
            {/* Find Game/New Game and profile actions always top right */}
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                {isSelf ? (
                    <>
                        <Link
                            href="/find-game"
                            className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-2 py-1 rounded font-semibold transition-colors text-xs shadow"
                            style={{ minWidth: 0 }}
                            onClick={onFindGame}
                        >
                            Find Game
                        </Link>
                        <Link
                            href="/profile/edit"
                            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-2 py-1 rounded font-semibold transition-colors text-xs shadow"
                            style={{ minWidth: 0 }}
                        >
                            Edit
                        </Link>
                        {showDelete && (
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-semibold transition-colors text-xs shadow"
                                style={{ minWidth: 0 }}
                                onClick={onDelete}
                            >
                                Delete
                            </button>
                        )}
                    </>
                ) : (
                    <Link
                        href="/new-game"
                        className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-2 py-1 rounded font-semibold transition-colors text-xs shadow"
                        style={{ minWidth: 0 }}
                        onClick={onNewGame}
                    >
                        New Game
                    </Link>
                )}
            </div>
            {/* Username and last seen */}
            <div className="flex flex-col gap-1 mb-2">
                <h2 className="text-2xl font-bold text-yellow-400 break-words">{username}</h2>
                {lastSeen && (
                    <div className="text-gray-400 text-xs">Last seen: {formatDate(lastSeen)}</div>
                )}
            </div>
            {/* Ratings section */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-2">
                {/* Short */}
                <div className="flex-1 bg-[#232323] rounded-lg p-3 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 text-lg">⚡</span>
                        <span className="text-base font-semibold text-white">Short</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-white">{shortRating}</span>
                            <span className="text-xs text-gray-400">Elo</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-base font-bold text-gray-200">{shortStats.gamesPlayed ?? 0}</span>
                            <span className="text-xs text-gray-400">Games</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-base font-bold text-green-400">{shortStats.gamesWon ?? 0}</span>
                            <span className="text-xs text-gray-400">Wins</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-base font-bold text-red-400">{shortStats.gamesLost ?? 0}</span>
                            <span className="text-xs text-gray-400">Losses</span>
                        </div>
                    </div>
                </div>
                {/* Long */}
                <div className="flex-1 bg-[#232323] rounded-lg p-3 flex flex-col items-center mt-2 sm:mt-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-300 text-lg">📆</span>
                        <span className="text-base font-semibold text-white">Long</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-white">{longRating}</span>
                            <span className="text-xs text-gray-400">Elo</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-base font-bold text-gray-200">{longStats.gamesPlayed ?? 0}</span>
                            <span className="text-xs text-gray-400">Games</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-base font-bold text-green-400">{longStats.gamesWon ?? 0}</span>
                            <span className="text-xs text-gray-400">Wins</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-base font-bold text-red-400">{longStats.gamesLost ?? 0}</span>
                            <span className="text-xs text-gray-400">Losses</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// In Progress Games Section
export function InProgressGames({
    games,
    userId,
}: {
    games: Game[];
    userId: string;
}) {
    if (!games.length) return null;
    return (
        <section className="mb-6">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">In Progress</h2>      
            <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-[#181818] rounded-lg text-[10px] sm:text-sm">
                    <thead>
                        <tr className="text-gray-300 border-b border-[#333]">
                            <th className="py-2 px-2 font-semibold text-left min-w-[90px] sm:min-w-[120px]">Players</th>
                            <th className="py-2 px-1 font-semibold text-left">Mode</th>
                            <th className="py-2 px-1 font-semibold text-left">Moves</th>
                            <th className="py-2 px-1 font-semibold text-left">Started</th>
                            <th className="py-2 px-1 font-semibold text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {games.map((game) => {
                            const userIsBlack = game.blackPlayer === userId;
                            const userIsWhite = game.whitePlayer === userId;
                            // Replicate logic from ProfileGameTable for "You" badge
                            const loggedInIsBlack = userId && game.blackPlayer === userId;
                            const loggedInIsWhite = userId && game.whitePlayer === userId;
                            return (
                                <tr key={game.id} className="border-b border-[#222] hover:bg-[#232323] transition">
                                    {/* Players */}
                                    <td className="py-1 px-2 flex flex-col gap-1 min-w-[90px] sm:min-w-[120px] max-w-[110px] sm:max-w-[140px]">
                                        {/* Black */}
                                        <span className={`flex items-center gap-2 ${userIsBlack ? "font-bold text-white" : "text-gray-300"} truncate`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#22272b" stroke="black" strokeWidth="2" /></svg>
                                            <Link
                                                href={`/profile/${game.players?.[0] || game.blackPlayer}`}
                                                className="hover:underline text-white truncate max-w-[4.5rem] sm:max-w-[10rem]"
                                            >
                                                {game.playerUsernames?.[0] || "Black"}
                                            </Link>
                                            {loggedInIsBlack && (
                                                <span className="ml-1 text-[10px] bg-green-700 text-white px-1 py-0.5 rounded">You</span>
                                            )}
                                        </span>
                                        {/* White */}
                                        <span className={`flex items-center gap-2 ${userIsWhite ? "font-bold text-white" : "text-gray-300"} truncate`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="white" stroke="#888" strokeWidth="2" /></svg>
                                            <Link
                                                href={`/profile/${game.players?.[1] || game.whitePlayer}`}
                                                className="hover:underline text-white truncate max-w-[4.5rem] sm:max-w-[10rem]"
                                            >
                                                {game.playerUsernames?.[1] || "White"}
                                            </Link>
                                            {loggedInIsWhite && (
                                                <span className="ml-1 text-[10px] bg-green-700 text-white px-1 py-0.5 rounded">You</span>
                                            )}
                                        </span>
                                    </td>
                                    {/* Mode */}
                                    <td className="py-1 px-1">
                                        <span className="inline-block bg-[#232323] text-gray-200 px-2 py-1 rounded text-[10px] sm:text-xs font-medium">
                                            {game.timing === "short" ? "⚡ Short" : "📆 Long"}
                                        </span>
                                    </td>
                                    {/* Moves */}
                                    <td className="py-1 px-1 text-gray-200">{game.state?.moveList?.length || 0}</td>
                                    {/* Started */}
                                    <td className="py-1 px-1 text-gray-400">{formatDate(game.createdAt)}</td>
                                    {/* Play/Spectate */}
                                    <td className="py-1 px-1">
                                        <Link
                                            href={`/game/${game.id}`}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] sm:text-xs font-semibold transition"
                                        >
                                            {loggedInIsBlack || loggedInIsWhite ? "Play" : "Spectate"}
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export function ProfileGameTable({
    games,
    userId,
    isSelf,
    loggedInUserId,
}: {
    games: Game[];
    userId: string;
    isSelf?: boolean;
    loggedInUserId: string;
}) {
    return (
        <div>
            {/* Always show a table, but smaller on mobile */}
            <div className="overflow-x-auto rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6 text-white text-center">Game History</h2>      
                <table className="min-w-full bg-[#181818] rounded-lg text-[10px] sm:text-sm">
                    <thead>
                        <tr className="text-gray-300 border-b border-[#333]">
                            <th className="py-2 px-2 font-semibold text-left min-w-[90px] sm:min-w-[120px]">Players</th>
                            <th className="py-2 px-1 font-semibold text-left">Mode</th>
                            <th className="py-2 px-1 font-semibold text-left">Result</th>
                            <th className="py-2 px-1 font-semibold text-left">ELO Δ</th>
                            <th className="py-2 px-1 font-semibold text-left">Moves</th>
                            <th className="py-2 px-1 font-semibold text-left">Date</th>
                            <th className="py-2 px-1 font-semibold text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {games.map((game) => {
                            const userIsBlack = game.blackPlayer === userId;
                            const userIsWhite = game.whitePlayer === userId;
                            const loggedInIsBlack = loggedInUserId && game.blackPlayer === loggedInUserId;
                            const loggedInIsWhite = loggedInUserId && game.whitePlayer === loggedInUserId;
                            const result = getResult(game, userId);
                            const eloDelta = game.eloChanges?.[userId];
                            return (
                                <tr key={game.id} className="border-b border-[#222] hover:bg-[#232323] transition">
                                    <td className="py-1 px-2 flex flex-col gap-1 min-w-[90px] sm:min-w-[120px] max-w-[110px] sm:max-w-[140px]">
                                        {/* Black */}
                                        <span className={`flex items-center gap-2 ${userIsBlack ? "font-bold text-white" : "text-gray-300"} truncate`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#22272b" stroke="black" strokeWidth="2" /></svg>
                                            <Link
                                                href={`/profile/${game.players?.[0] || game.blackPlayer}`}
                                                className="hover:underline text-white truncate max-w-[4.5rem] sm:max-w-[10rem]"
                                            >
                                                {game.playerUsernames?.[0] || "Black"}
                                            </Link>
                                            {loggedInUserId && loggedInIsBlack && (
                                                <span className="ml-1 text-[10px] bg-green-700 text-white px-1 py-0.5 rounded">You</span>
                                            )}
                                        </span>
                                        {/* White */}
                                        <span className={`flex items-center gap-2 ${userIsWhite ? "font-bold text-white" : "text-gray-300"} truncate`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="white" stroke="#888" strokeWidth="2" /></svg>
                                            <Link
                                                href={`/profile/${game.players?.[1] || game.whitePlayer}`}
                                                className="hover:underline text-white truncate max-w-[4.5rem] sm:max-w-[10rem]"
                                            >
                                                {game.playerUsernames?.[1] || "White"}
                                            </Link>
                                            {loggedInUserId && loggedInIsWhite && (
                                                <span className="ml-1 text-[10px] bg-green-700 text-white px-1 py-0.5 rounded">You</span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="py-1 px-1">
                                        <span className="inline-block bg-[#232323] text-gray-200 px-2 py-1 rounded text-[10px] sm:text-xs font-medium">
                                            {game.timing === "short" ? "⚡ Short" : "📆 Long"}
                                        </span>
                                    </td>
                                    <td className={`py-1 px-1 font-semibold ${result.color}`}>
                                        <span>{result.icon}</span>
                                        <span>{result.label}</span>
                                    </td>
                                    <td className="py-1 px-1 font-mono text-[10px] sm:text-xs">
                                        {game.state?.isOver && typeof eloDelta === "number" ? (
                                            <span className={eloDelta > 0 ? "text-green-400" : eloDelta < 0 ? "text-red-400" : "text-yellow-400"}>
                                                {eloDelta > 0 ? "+" : ""}{eloDelta}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-1 px-1 text-gray-200">{game.state?.moveList?.length || 0}</td>
                                    <td className="py-1 px-1 text-gray-400">{formatDate(game.updatedAt || game.createdAt)}</td>
                                    <td className="py-1 px-1">
                                        <Link
                                            href={`/game/${game.id}`}
                                            className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-2 py-1 rounded text-[10px] sm:text-xs font-semibold transition"
                                        >
                                            {game.state?.isOver ? "View" : "Spectate"}
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}