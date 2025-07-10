'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../../components/card";
import { getSocket } from "@/lib/socket";

export default function NewGamePage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [timing, setTiming] = useState<"short" | "long">("short");
  const [rated, setRated] = useState(true);
  const [size, setSize] = useState(11);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    document.title = "New Game | Nomalos";
    // Fetch friends and recent players
    const token = localStorage.getItem("token");
    if (!token) return;
    // Fetch friends
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFriends(data.friends || []);
        // Select the first friend by default if available
        if (data.friends && data.friends.length > 0) {
          setSelectedUser(data.friends[0]);
        }
      });
    // Fetch recent players
    // fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/recent`, {
    //   headers: { Authorization: `Bearer ${token}` }
    // })
    //   .then(res => res.json())
    //   .then(data => setRecentPlayers(data.recent || []));
  }, []);

  // Listen for game_request_accepted socket event to redirect
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return;
    const socket = getSocket(user.id);

    const handler = (data: { gameId: string }) => {
      router.push(`/game/${data.gameId}`);
    };
    socket.on("game_request_accepted", handler);
    return () => {
      socket.off("game_request_accepted", handler);
    };
  }, [router]);

  const handleSendRequest = async () => {
    setError("");
    setSuccess("");
    if (!selectedUser) {
      setError("Please select a player.");
      return;
    }
    setSending(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game-request/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: selectedUser._id,
          timing,
          rated,
          size,
        }),
      });
      const data = await res.json();
      setSending(false);
      if (!res.ok) {
        setError(data.error || "Failed to send game request.");
        return;
      }
      setSuccess("Game request sent!");
      router.push("/inbox");
    } catch (err) {
      setSending(false);
      setError("Failed to send game request.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-lg mt-8 mb-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-yellow-400">Start a New Game</h2>
        {/* Player Selection Section */}
        <div className="w-full mb-6 bg-[#232323] rounded-lg p-4 shadow-inner">
          <div className="mb-2 text-gray-300 font-semibold text-center">Choose a player:</div>
          <div className="mb-4">
            <div className="text-green-300 font-semibold mb-1">Friends</div>
            {friends.length === 0 && (
              <div className="text-gray-500 text-sm mb-2">No friends found.</div>
            )}
            <div
              className={`flex flex-col gap-1 ${friends.length > 3 ? "max-h-40 overflow-y-auto pr-1" : ""}`}
              style={{ scrollbarGutter: "stable" }}
            >
              {friends.map((user) => (
                <button
                  key={`friend-${user.id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded w-full transition border ${selectedUser?.id === user.id
                    ? "bg-[#3fae49] border-[#3fae49] text-white"
                    : "bg-[#232323] border-[#333] text-[#3fae49] hover:bg-[#2e8c36]"
                    }`}
                  onClick={() => setSelectedUser(user)}
                  type="button"
                  style={{ minHeight: 40 }}
                >
                  <span className="font-semibold">{user.username}</span>
                  {user.avatarUrl && (
                    <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* <div>
            <div className="text-blue-400 font-semibold mb-1">Recent Opponents</div>
            {recentPlayers.length === 0 && (
              <div className="text-gray-500 text-sm mb-2">No recent players found.</div>
            )}
            <div
              className={`flex flex-col gap-1 ${recentPlayers.filter(u => !friends.some(f => f.id === u.id)).length > 3 ? "max-h-40 overflow-y-auto pr-1" : ""}`}
              style={{ scrollbarGutter: "stable" }}
            >
              {recentPlayers
                .filter((u) => !friends.some((f) => f.id === u.id))
                .slice(0, 5)
                .map((user) => (
                  <button
                    key={user.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded w-full transition border ${selectedUser?.id === user.id
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-[#232323] border-[#333] text-blue-200 hover:bg-blue-700"
                      }`}
                    onClick={() => setSelectedUser(user)}
                    type="button"
                    style={{ minHeight: 40 }}
                  >
                    <span className="font-semibold">{user.username}</span>
                    {user.avatarUrl && (
                      <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full" />
                    )}
                  </button>
                ))}
            </div>
          </div> */}
        </div>
        {/* Game Settings Section */}
        <div className="w-full mb-6 bg-[#232323] rounded-lg p-4 shadow-inner flex flex-col items-center">
          <div className="mb-6 w-full flex flex-col items-center">
            <label htmlFor="timing" className="block text-gray-300 mb-2 font-medium text-center">
              Match Type
            </label>
            <select
              id="timing"
              value={timing}
              onChange={e => setTiming(e.target.value as "short" | "long")}
              className="bg-[#232323] text-white rounded px-4 py-2 w-40 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] transition text-center"
              disabled={sending}
            >
              <option value="short">Short (2 mins)</option>
              <option value="long">Long (24 hrs)</option>
            </select>
          </div>
          <div className="mb-6 w-full flex flex-col items-center">
            <label className="block text-gray-300 mb-2 font-medium text-center">
              Rated Match
            </label>
            <div className="flex items-center gap-4 justify-center">
              <button
                className={`px-4 py-2 rounded font-semibold transition-colors border ${rated ? "bg-[#3fae49] text-white border-[#3fae49]" : "bg-[#232323] text-gray-300 border-[#333]"}`}
                onClick={() => setRated(true)}
                disabled={sending}
                type="button"
              >
                Rated
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold transition-colors border ${!rated ? "bg-[#3fae49] text-white border-[#3fae49]" : "bg-[#232323] text-gray-300 border-[#333]"}`}
                onClick={() => setRated(false)}
                disabled={sending}
                type="button"
              >
                Unrated
              </button>
            </div>
          </div>
          {/* <div className="mb-6 w-full flex flex-col items-center">
            <label className="block text-gray-300 mb-2 font-medium text-center">
              Board Size
            </label>
            <input
              type="number"
              min={7}
              max={19}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="bg-[#232323] text-white rounded px-4 py-2 w-24 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] transition text-center"
              disabled={sending}
            />
          </div> */}
        </div>
        <button
          className="bg-[#3fae49] hover:bg-[#2b8233] text-white px-6 py-2 rounded font-semibold transition-colors mb-2"
          onClick={handleSendRequest}
          disabled={sending || !selectedUser}
        >
          {sending ? "Sending..." : "Send Game Request"}
        </button>
        {error && <div className="text-red-400 mt-2">{error}</div>}
        {success && <div className="text-green-400 mt-2">{success}</div>}
      </Card>
    </div>
  );
}