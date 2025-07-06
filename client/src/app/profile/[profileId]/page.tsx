'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getResult(game: any, userId: string) {
  if (!game.state?.isOver) return { label: "In Progress", color: "text-gray-400", icon: "⏳" };
  if (!userId) return { label: "—", color: "text-gray-400", icon: "" };
  if (game.winner === userId) return { label: "Win", color: "text-green-400", icon: "✔️" };
  if (game.winner && game.winner !== userId) return { label: "Loss", color: "text-red-400", icon: "❌" };
  return { label: "Draw", color: "text-yellow-400", icon: "➖" };
}

export default function ProfileIdPage() {
  const params = useParams();
  const profileId = Array.isArray(params.profileId) ? params.profileId[0] : params.profileId!;

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    setError("");
    setUserInfo(null);
    setGames([]);
    if (!profileId) return;

    const token = localStorage.getItem("token") || "";

    // Fetch user info by ID with JWT
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUserInfo(data);
        document.title = `${data.username}'s Profile | Nomalos`;
      })
      .catch(() => {
        setUserInfo(null);
        setError("Failed to load user info.");
      });

    // Fetch games for this user with JWT
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/games/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setGames(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load games.");
        setLoading(false);
      });
  }, [profileId]);

  const totalPages = Math.ceil(games.length / pageSize);
  const pagedGames = games.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Prepare short and long stats
  const shortStats = userInfo?.shortStats || {};
  const longStats = userInfo?.longStats || {};
  const shortRating = userInfo?.shortRating ?? 1200;
  const longRating = userInfo?.longRating ?? 1200;

  if (loading) {
    return <div className="max-w-4xl mx-auto mt-10 text-center text-gray-300">Loading...</div>;
  }

  if (!userInfo) {
    return <div className="max-w-4xl mx-auto mt-10 text-center text-gray-300">{error || "User not found."}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10" style={{ paddingTop: "40px" }}>
      {/* User Info Section */}
      <section className="mb-8 bg-[#181818] rounded-lg shadow p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#60a5fa] mb-1">{userInfo.username}</h2>
            <div className="text-gray-400 text-sm mb-4">
              {userInfo.lastSeen && <>Last seen: {formatDate(userInfo.lastSeen)}</>}
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
            <Link
              href="/find-game"
              className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-5 py-2 rounded font-semibold transition-colors"
            >
              Find Game
            </Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 mt-4">
          {/* Short Stats */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Short</h3>
            <div className="flex gap-4">
              <div>
                <div className="text-lg font-bold text-white">{shortRating}</div>
                <div className="text-xs text-gray-400">Elo</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-200">{shortStats.gamesPlayed ?? 0}</div>
                <div className="text-xs text-gray-400">Games</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">{shortStats.gamesWon ?? 0}</div>
                <div className="text-xs text-gray-400">Wins</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-400">{shortStats.gamesLost ?? 0}</div>
                <div className="text-xs text-gray-400">Losses</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-400">{shortStats.gamesDrawn ?? 0}</div>
                <div className="text-xs text-gray-400">Draws</div>
              </div>
            </div>
          </div>
          {/* Divider */}
          <div className="hidden sm:block w-px bg-[#232323] mx-2" />
          {/* Long Stats */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Long</h3>
            <div className="flex gap-4">
              <div>
                <div className="text-lg font-bold text-white">{longRating}</div>
                <div className="text-xs text-gray-400">Elo</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-200">{longStats.gamesPlayed ?? 0}</div>
                <div className="text-xs text-gray-400">Games</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">{longStats.gamesWon ?? 0}</div>
                <div className="text-xs text-gray-400">Wins</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-400">{longStats.gamesLost ?? 0}</div>
                <div className="text-xs text-gray-400">Losses</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-400">{longStats.gamesDrawn ?? 0}</div>
                <div className="text-xs text-gray-400">Draws</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <h2 className="text-2xl font-bold mb-6 text-white">Game History</h2>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {!loading && games.length === 0 && <div className="text-gray-400">No active games found.</div>}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-[#181818] rounded-lg">
          <thead>
            <tr className="text-gray-300 border-b border-[#333]">
              <th className="py-3 px-2 font-semibold text-left">Players</th>
              <th className="py-3 px-2 font-semibold text-left">Mode</th>
              <th className="py-3 px-2 font-semibold text-left">Result</th>
              <th className="py-3 px-2 font-semibold text-left">ELO Δ</th>
              <th className="py-3 px-2 font-semibold text-left">Moves</th>
              <th className="py-3 px-2 font-semibold text-left">Date</th>
              <th className="py-3 px-2 font-semibold text-left"></th>
            </tr>
          </thead>
          <tbody>
            {pagedGames
              .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
              .map(game => {
                const userIsBlack = game.blackPlayer === profileId;
                const userIsWhite = game.whitePlayer === profileId;
                const result = getResult(game, profileId);
                const eloDelta = game.eloChanges?.[profileId];
                return (
                  <tr key={game.id} className="border-b border-[#222] hover:bg-[#232323] transition">
                    <td className="py-2 px-2 flex flex-col gap-1">
                      <span className={`flex items-center gap-2 ${userIsBlack ? "font-bold text-white" : "text-gray-300"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#22272b" stroke="black" strokeWidth="2" /></svg>
                        {userIsBlack ? (
                          <>
                            {game.playerUsernames?.[0] || "Black"}
                            <span className="ml-1 text-xs bg-green-700 text-white px-2 py-0.5 rounded">User</span>
                          </>
                        ) : (
                          game.players?.[0] ? (
                            <Link
                              href={`/profile/${game.players[0]}`}
                              className="hover:underline text-white"
                            >
                              {game.playerUsernames?.[0] || "Black"}
                            </Link>
                          ) : (
                            game.playerUsernames?.[0] || "Black"
                          )
                        )}
                      </span>
                      <span className={`flex items-center gap-2 ${userIsWhite ? "font-bold text-white" : "text-gray-300"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="white" stroke="#888" strokeWidth="2" /></svg>
                        {userIsWhite ? (
                          <>
                            {game.playerUsernames?.[1] || "White"}
                            <span className="ml-1 text-xs bg-green-700 text-white px-2 py-0.5 rounded">User</span>
                          </>
                        ) : (
                          game.players?.[1] ? (
                            <Link
                              href={`/profile/${game.players[1]}`}
                              className="hover:underline text-white"
                            >
                              {game.playerUsernames?.[1] || "White"}
                            </Link>
                          ) : (
                            game.playerUsernames?.[1] || "White"
                          )
                        )}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="inline-block bg-[#232323] text-gray-200 px-2 py-1 rounded text-xs font-medium">
                        {game.timing === "short" ? "⚡ Short" : "📆 Long"}
                      </span>
                    </td>
                    <td className={`py-2 px-2 font-semibold ${result.color}`}>
                      <span>{result.icon}</span>
                      <span>{result.label}</span>
                    </td>
                    <td className="py-2 px-2 font-mono text-sm">
                      {game.state?.isOver && typeof eloDelta === "number" ? (
                        <span className={eloDelta > 0 ? "text-green-400" : eloDelta < 0 ? "text-red-400" : "text-yellow-400"}>
                          {eloDelta > 0 ? "+" : ""}{eloDelta}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-200">{game.state?.moveList?.length || 0}</td>
                    <td className="py-2 px-2 text-gray-400">{formatDate(game.updatedAt || game.createdAt)}</td>
                    <td className="py-2 px-2">
                      <Link
                        href={`/game/${game.id}`}
                        className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-3 py-1 rounded text-sm font-semibold transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-3 py-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold transition disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="text-gray-300 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold transition disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
      {/* Footer buffer */}
      <div style={{ height: "80px" }} />
    </div>
  );
}