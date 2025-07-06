'use client';
import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
    id: string;
    username: string;
    shortRating: number;
    longRating: number;
    lastSeen?: string;
};

export default function LeaderboardPage() {
    const [timing, setTiming] = useState<"short" | "long">("short");
    const [shortLeaderboard, setShortLeaderboard] = useState<User[]>([]);
    const [longLeaderboard, setLongLeaderboard] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = "Leaderboard | Nomalos";
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token") || "";
        // Fetch both leaderboards in parallel, with Authorization header
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/leaderboard/short`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/leaderboard/long`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())
        ])
            .then(([shortData, longData]) => {
                setShortLeaderboard(Array.isArray(shortData) ? shortData : []);
                setLongLeaderboard(Array.isArray(longData) ? longData : []);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load leaderboard.");
                setLoading(false);
            });
    }, []);

    const leaderboard = timing === "short" ? shortLeaderboard : longLeaderboard;

    return (
        <div className="max-w-3xl mx-auto min-h-screen flex flex-col" style={{ paddingTop: "88px", paddingBottom: "64px" }}>
            <h1 className="text-3xl font-bold mb-6 text-[#60a5fa] text-center">Leaderboard</h1>
            <div className="flex justify-center mb-6">
                <button
                    className={`px-4 py-2 rounded-l font-semibold transition-colors border border-[#333] ${timing === "short"
                        ? "bg-[#3fae49] text-white"
                        : "bg-[#232323] text-gray-300"
                        }`}
                    onClick={() => setTiming("short")}
                >
                    Short
                </button>
                <button
                    className={`px-4 py-2 rounded-r font-semibold transition-colors border border-[#333] border-l ${timing === "long"
                        ? "bg-[#3fae49] text-white"
                        : "bg-[#232323] text-gray-300"
                        }`}
                    onClick={() => setTiming("long")}
                >
                    Long
                </button>
            </div>
            <div className="bg-[#181818] rounded-lg shadow p-6 w-full overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="text-gray-300 border-b border-[#333]">
                            <th className="py-3 px-2 font-semibold text-left">#</th>
                            <th className="py-3 px-2 font-semibold text-left">Username</th>
                            <th className="py-3 px-2 font-semibold text-left">ELO</th>
                            <th className="py-3 px-2 font-semibold text-left">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-red-400">{error}</td>
                            </tr>
                        ) : leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">No players found.</td>
                            </tr>
                        ) : (
                            leaderboard.map((user, idx) => (
                                <tr key={user.id} className="border-b border-[#232323] hover:bg-[#232323] transition">
                                    <td className="py-2 px-2 font-mono text-gray-400">{idx + 1}</td>
                                    <td className="py-2 px-2 font-semibold">
                                        <Link
                                            href={`/profile/${user.id}`}
                                            className="text-white hover:underline"
                                        >
                                            {user.username}
                                        </Link>
                                    </td>
                                    <td className="py-2 px-2 font-bold text-[#60a5fa]">
                                        {timing === "short" ? user.shortRating : user.longRating}
                                    </td>
                                    <td className="py-2 px-2 text-gray-400 text-sm">
                                        {user.lastSeen ? new Date(user.lastSeen).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Footer buffer */}
            <div style={{ height: "80px" }} />
        </div>
    );
}