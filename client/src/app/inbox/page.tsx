'use client';
import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import Card from "../../../components/card";
import { FaClock, FaCheck, FaTimes } from "react-icons/fa";

export default function InboxPage() {
  const [friendRequests, setFriendRequests] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [gameRequests, setGameRequests] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Fetch all requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    setToken(token || null);
    setUser(userData ? JSON.parse(userData) : null);

    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch friend requests
    const friendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const friendData = await friendRes.json();

    // Fetch game requests
    const gameRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game-request/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const gameData = await gameRes.json();

    setFriendRequests({
      incoming: friendData.incoming || [],
      outgoing: friendData.outgoing || [],
    });
    setGameRequests({
      incoming: gameData.incoming || [],
      outgoing: gameData.outgoing || [],
    });
    setLoading(false);
  }, []);

  // Socket: update on friend_status_update or game_request
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return;
    const socket = getSocket(user.id);

    const updateHandler = () => fetchRequests();

    // Friend request events
    socket.on("friend_status_update", updateHandler);
    socket.on("friend_request", updateHandler);

    // Game request events
    socket.on("game_status_update", updateHandler);
    socket.on("game_request", updateHandler);

    return () => {
      socket.off("friend_status_update", updateHandler);
      socket.off("friend_request", updateHandler);
      socket.off("game_status_update", updateHandler);
      socket.off("game_request", updateHandler);
    };
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Accept/Decline Friend Request
  const handleFriendAction = async (requestId: string, action: "accept" | "decline") => {
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId }),
    });
    fetchRequests();
    const socket = getSocket(user?.id);
    socket.emit("self_ui_update", {
      userId: user.id,
    });
  };

  // Cancel Friend Request (outgoing)
  const handleFriendCancel = async (recipient: string) => {
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipient }),
    });
    fetchRequests();
    const socket = getSocket(user?.id);
    socket.emit("self_ui_update", {
      userId: user.id,
    });
  };

  const handleGameAction = async (requestId: string, action: "accept" | "decline") => {
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game-request/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId }),
    });
    fetchRequests();
    const socket = getSocket(user?.id);
    socket.emit("self_ui_update", {
      userId: user.id,
    });
  };

  // Cancel Game Request (outgoing)
  const handleGameCancel = async (requestId: string) => {
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game-request/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId }),
    });
    fetchRequests();
    const socket = getSocket(user?.id);
    socket.emit("self_ui_update", {
      userId: user.id,
    });
  };

  // Button/icon styles to match profile page
  const iconBtn = "p-2 rounded-full shadow flex items-center justify-center";
  const acceptBtn = "bg-green-600 hover:bg-green-700 text-white";
  const declineBtn = "bg-red-600 hover:bg-red-700 text-white";
  const cancelBtn = "bg-yellow-600 hover:bg-yellow-700 text-white";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {loading && <div className="text-gray-300 text-center">Loading...</div>}

      {/* Game Requests Card */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-blue-300 mb-2">Game Requests</h2>
        {/* Incoming */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-1">Incoming</div>
          {gameRequests.incoming.length === 0 ? (
            <div className="text-gray-500 text-center">No incoming game requests.</div>
          ) : (
            gameRequests.incoming.map((req) => (
              <div key={req._id} className="flex items-center justify-between gap-2 mb-2 bg-[#232323] rounded-lg px-3 py-2">
                <a
                  href={`/profile/${req.requester}`}
                  className="text-blue-400 font-semibold hover:underline truncate"
                  style={{ maxWidth: 160 }}
                >
                  {req.requesterUsername || req.requester}
                </a>
                <div className="flex gap-2">
                  <button
                    className={`${iconBtn} ${acceptBtn}`}
                    title="Accept"
                    aria-label="Accept"
                    onClick={() => handleGameAction(req._id, "accept")}
                    style={{ width: 36, height: 36 }}
                  >
                    <FaCheck className="w-5 h-5" />
                  </button>
                  <button
                    className={`${iconBtn} ${declineBtn}`}
                    title="Decline"
                    aria-label="Decline"
                    onClick={() => handleGameAction(req._id, "decline")}
                    style={{ width: 36, height: 36 }}
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Outgoing */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Outgoing</div>
          {gameRequests.outgoing.length === 0 ? (
            <div className="text-gray-500 text-center">No outgoing game requests.</div>
          ) : (
            gameRequests.outgoing.map((req) => (
              <div key={req._id} className="flex items-center justify-between gap-2 mb-2 bg-[#232323] rounded-lg px-3 py-2">
                <a
                  href={`/profile/${req.recipient}`}
                  className="text-blue-400 font-semibold hover:underline truncate"
                  style={{ maxWidth: 160 }}
                >
                  {req.recipientUsername || req.recipient}
                </a>
                <button
                  className={`${iconBtn} ${cancelBtn}`}
                  title="Cancel Game Request"
                  aria-label="Cancel Game Request"
                  onClick={() => handleGameCancel(req._id)}
                  style={{ width: 36, height: 36 }}
                >
                  <FaClock className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Friend Requests Card */}
      <Card>
        <h2 className="text-lg font-semibold text-green-300 mb-2">Friend Requests</h2>
        {/* Incoming */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-1">Incoming</div>
          {friendRequests.incoming.length === 0 ? (
            <div className="text-gray-500 text-center">No incoming friend requests.</div>
          ) : (
            friendRequests.incoming.map((req) => (
              <div key={req._id} className="flex items-center justify-between gap-2 mb-2 bg-[#232323] rounded-lg px-3 py-2">
                <a
                  href={`/profile/${req.requester}`}
                  className="text-green-400 font-semibold hover:underline truncate"
                  style={{ maxWidth: 160 }}
                >
                  {req.requesterUsername || req.requester}
                </a>
                <div className="flex gap-2">
                  <button
                    className={`${iconBtn} ${acceptBtn}`}
                    title="Accept"
                    aria-label="Accept"
                    onClick={() => handleFriendAction(req._id, "accept")}
                    style={{ width: 36, height: 36 }}
                  >
                    <FaCheck className="w-5 h-5" />
                  </button>
                  <button
                    className={`${iconBtn} ${declineBtn}`}
                    title="Decline"
                    aria-label="Decline"
                    onClick={() => handleFriendAction(req._id, "decline")}
                    style={{ width: 36, height: 36 }}
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Outgoing */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Outgoing</div>
          {friendRequests.outgoing.length === 0 ? (
            <div className="text-gray-500 text-center">No outgoing friend requests.</div>
          ) : (
            friendRequests.outgoing.map((req) => (
              <div key={req._id} className="flex items-center justify-between gap-2 mb-2 bg-[#232323] rounded-lg px-3 py-2">
                <a
                  href={`/profile/${req.recipient}`}
                  className="text-green-400 font-semibold hover:underline truncate"
                  style={{ maxWidth: 160 }}
                >
                  {req.recipientUsername || req.recipient}
                </a>
                <button
                  className={`${iconBtn} ${cancelBtn}`}
                  title="Cancel Friend Request"
                  aria-label="Cancel Friend Request"
                  onClick={() => handleFriendCancel(req.recipient)}
                  style={{ width: 36, height: 36 }}
                >
                  <FaClock className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>
      <div style={{ height: "80px" }} />
    </div>
  );
}