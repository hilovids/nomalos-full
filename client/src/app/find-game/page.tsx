'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

export default function FindGamePage() {
    const [status, setStatus] = useState<"idle" | "waiting" | "matched" | "error">("idle");
    const [error, setError] = useState("");
    const [timing, setTiming] = useState<"short" | "long">("short");
    const [rated, setRated] = useState(true);
    const router = useRouter();
    const socket = getSocket();

    useEffect(() => {
        if (status === "waiting") {
            document.title = "Waiting... | Nomalos";
        } else {
            document.title = "Find Game | Nomalos";
        }
    }, [status]);

    useEffect(() => {
        setError("");
        socket.on("waiting_for_match", () => setStatus("waiting"));
        socket.on("match_found", (data) => {
            setStatus("matched");
            router.push(`/game/${data.gameId}`);
        });
        socket.on("connect_error", () => setError("Socket connection error."));

        return () => {
            socket.off("waiting_for_match");
            socket.off("match_found");
            socket.off("connect_error");
        };
    }, [socket, router]);

    function handleFindMatch() {
        setError("");
        setStatus("idle");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user?.id || !user?.username) {
            setError("You must be logged in.");
            return;
        }
        socket.emit("find_match", {
            userId: user.id,
            username: user.username,
            rating: timing === "short" ? user.shortRating || 1000 : user.longRating || 1000,
            timing,
            rated,
            size: 11,
        });
    }

    function handleCancel() {
        socket.emit("cancel_matchmaking");
        setStatus("idle");
    }

    return (
        <div className="max-w-md mx-auto mt-24">
            <div className="bg-[#181818] rounded-lg shadow p-8 w-full flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-6 text-[#60a5fa]">Find a Match</h2>
                <div className="mb-6 w-full flex flex-col items-center">
                    <label htmlFor="timing" className="block text-gray-300 mb-2 font-medium">
                        Match Type
                    </label>
                    <select
                        id="timing"
                        value={timing}
                        onChange={e => setTiming(e.target.value as "short" | "long")}
                        className="bg-[#232323] text-white rounded px-4 py-2 w-40 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] transition"
                        disabled={status === "waiting" || status === "matched"}
                    >
                        <option value="short">Short (2 mins)</option>
                        <option value="long">Long (24 hrs)</option>
                    </select>
                </div>
                <div className="mb-6 w-full flex flex-col items-center">
                    <label className="block text-gray-300 mb-2 font-medium">
                        Rated Match
                    </label>
                    <div className="flex items-center gap-4">
                        <button
                            className={`px-4 py-2 rounded font-semibold transition-colors border ${rated ? "bg-[#3fae49] text-white border-[#3fae49]" : "bg-[#232323] text-gray-300 border-[#333]"}`}
                            onClick={() => setRated(true)}
                            disabled={status === "waiting" || status === "matched"}
                        >
                            Rated
                        </button>
                        <button
                            className={`px-4 py-2 rounded font-semibold transition-colors border ${!rated ? "bg-[#3fae49] text-white border-[#3fae49]" : "bg-[#232323] text-gray-300 border-[#333]"}`}
                            onClick={() => setRated(false)}
                            disabled={status === "waiting" || status === "matched"}
                        >
                            Unrated
                        </button>
                    </div>
                </div>
                {status === "idle" && (
                    <button
                        className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-6 py-2 rounded font-semibold transition-colors w-full"
                        onClick={handleFindMatch}
                    >
                        Find Match
                    </button>
                )}
                {status === "waiting" && (
                    <>
                        <div className="mb-4 text-gray-200">Looking for an opponent...</div>
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors w-full"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </>
                )}
                {status === "matched" && (
                    <div className="text-green-400 font-semibold mt-4">Match found! Redirecting...</div>
                )}
                {error && <div className="text-red-400 mt-4">{error}</div>}
            </div>
        </div>
    );
}