'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewGamePage() {
  const [timing, setTiming] = useState("short");
  const [size, setSize] = useState(11);
  const [opponentId, setOpponentId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || !user?.id) {
      setError("You must be logged in.");
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "multiplayer",
          timing,
          players: [user.id, opponentId],
          playerUsernames: [user.username, "opponent"], // Replace with actual opponent username if available
          size,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create game");
      router.push(`/game/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleCreateGame} className="max-w-xs mx-auto mt-20 flex flex-col gap-4">
      <label>
        Opponent User ID:
        <input
          className="border p-2 rounded w-full"
          value={opponentId}
          onChange={e => setOpponentId(e.target.value)}
          required
        />
      </label>
      <label>
        Timing:
        <select className="border p-2 rounded w-full" value={timing} onChange={e => setTiming(e.target.value)}>
          <option value="short">Short</option>
          <option value="long">Long</option>
        </select>
      </label>
      <label>
        Board Size:
        <input
          className="border p-2 rounded w-full"
          type="number"
          min={5}
          max={19}
          value={size}
          onChange={e => setSize(Number(e.target.value))}
        />
      </label>
      <button className="bg-blue-600 text-white rounded p-2">Create Game</button>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
}