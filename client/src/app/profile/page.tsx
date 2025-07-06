'use client';
import { useEffect, useState } from "react";
import Link from "next/link";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getResult(game: any, user: any) {
  if (!game.state?.isOver) return { label: "In Progress", color: "text-gray-400", icon: "⏳" };
  if (!user) return { label: "—", color: "text-gray-400", icon: "" };
  if (game.winner === user.id) return { label: "Win", color: "text-green-400", icon: "✔️" };
  if (game.winner && game.winner !== user.id) return { label: "Loss", color: "text-red-400", icon: "❌" };
  return { label: "Draw", color: "text-yellow-400", icon: "➖" };
}

export default function ProfilePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const tokenData = localStorage.getItem("token");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setToken(tokenData || null);
  }, []);

  // Fetch up-to-date user info from API
  useEffect(() => {
    if (!user?.username || !token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${user.username}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUserInfo(data))
      .catch(() => setUserInfo(null));
  }, [user, token]);

  useEffect(() => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/games/${user.id}`, {
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
  }, [user, token]);

  if (loading) {
    return <div className="max-w-4xl mx-auto mt-10 text-center text-gray-300">Loading...</div>;
  }

  if (!user) {
    return <div className="max-w-4xl mx-auto mt-10 text-center text-gray-300">Please log in to view your games.</div>;
  }

  // Prepare short and long stats
  const shortStats = userInfo?.shortStats || {};
  const longStats = userInfo?.longStats || {};
  const shortRating = userInfo?.shortRating ?? 1200;
  const longRating = userInfo?.longRating ?? 1200;

  return (
    <div className="max-w-4xl mx-auto mt-10" style={{ paddingTop: "40px" }}>
      {/* User Info Section */}
      <section className="mb-8 bg-[#181818] rounded-lg shadow p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#60a5fa] mb-1">{userInfo?.username || user?.username}</h2>
            <div className="text-gray-400 text-sm mb-4">
              {userInfo?.lastSeen && <>Last seen: {formatDate(userInfo.lastSeen)}</>}
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
            <Link
              href="/new-game"
              className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-5 py-2 rounded font-semibold transition-colors"
            >
              New Game
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
              <th className="py-3 px-2 font-semibold text-left">Moves</th>
              <th className="py-3 px-2 font-semibold text-left">Date</th>
              <th className="py-3 px-2 font-semibold text-left"></th>
            </tr>
          </thead>
          <tbody>
            {[...games]
              .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
              .map(game => {
                const userIsBlack = game.blackPlayer === user.id;
                const userIsWhite = game.whitePlayer === user.id;
                const result = getResult(game, user);
                return (
                  <tr key={game.id} className="border-b border-[#222] hover:bg-[#232323] transition">
                    <td className="py-2 px-2 flex flex-col gap-1">
                      <span className={`flex items-center gap-2 ${userIsBlack ? "font-bold text-white" : "text-gray-300"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#22272b" stroke="black" strokeWidth="2" /></svg>
                        {game.playerUsernames?.[0] || "Black"}
                        {userIsBlack && <span className="ml-1 text-xs bg-green-700 text-white px-2 py-0.5 rounded">You</span>}
                      </span>
                      <span className={`flex items-center gap-2 ${userIsWhite ? "font-bold text-white" : "text-gray-300"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="white" stroke="#888" strokeWidth="2" /></svg>
                        {game.playerUsernames?.[1] || "White"}
                        {userIsWhite && <span className="ml-1 text-xs bg-green-700 text-white px-2 py-0.5 rounded">You</span>}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="inline-block bg-[#232323] text-gray-200 px-2 py-1 rounded text-xs font-medium">
                        {game.timing === "short" ? "Short" : "Long"}
                      </span>
                    </td>
                    <td className={`py-2 px-2 font-semibold flex items-center gap-1 ${result.color}`}>
                      <span>{result.icon}</span>
                      <span>{result.label}</span>
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
    </div>
  );
}