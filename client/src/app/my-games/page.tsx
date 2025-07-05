'use client';
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client
    const userData = localStorage.getItem("user");
    const tokenData = localStorage.getItem("token");
    setUser(userData ? JSON.parse(userData) : null);
    setToken(tokenData || null);
  }, []);

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
    return <div className="max-w-2xl mx-auto mt-10 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="max-w-2xl mx-auto mt-10 text-center">Please log in to view your games.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">My Games</h2>
      {error && <div className="text-red-600">{error}</div>}
      {!loading && games.length === 0 && <div>No active games found.</div>}
      <ul>
        {games.map(game => (
          <li key={game.id} className="mb-2">
            <Link href={`/game/${game.id}`} className="text-blue-600 underline">
              Game vs {game.playerUsernames?.find((u: string) => u !== user.username) || "Unknown"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}