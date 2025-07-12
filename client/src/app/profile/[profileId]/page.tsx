'use client';
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProfileStats, ProfileGameTable, InProgressGames } from "../../../../components/profileView";
import { FaUserPlus, FaUserMinus, FaClock, FaCheck } from "react-icons/fa";
import { getSocket } from "@/lib/socket";
import { BadgesBox } from "../../../../components/badgesBox";


function AddFriendButton({
  profileId,
  loggedInUserId,
  token,
  isFriend,
  pendingRequest,
  incomingRequest,
  onAdd,
  onRemove,
  onCancel,
  onAccept,
  disabled,
}: {
  profileId: string;
  loggedInUserId: string | null;
  token: string | null;
  isFriend: boolean;
  pendingRequest: boolean;
  incomingRequest: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onCancel: () => void;
  onAccept: () => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);

  if (!loggedInUserId || loggedInUserId === profileId) return null;

  if (isFriend) {
    return (
      <button
        className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow flex items-center justify-center"
        title="Remove Friend"
        aria-label="Remove Friend"
        onClick={onRemove}
        disabled={disabled}
        style={{ width: 36, height: 36 }}
      >
        <FaUserMinus className="w-5 h-5" />
      </button>
    );
  }

  if (pendingRequest) {
    return (
      <button
        className="p-2 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white shadow flex items-center justify-center"
        title={hover ? "Cancel Friend Request" : "Pending Friend Request"}
        aria-label="Cancel Friend Request"
        onClick={onCancel}
        disabled={disabled}
        style={{ width: 36, height: 36 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {hover ? <FaUserMinus className="w-5 h-5" /> : <FaClock className="w-5 h-5" />}
      </button>
    );
  }

  if (incomingRequest) {
    return (
      <button
        className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white shadow flex items-center justify-center"
        title="Accept Friend Request"
        aria-label="Accept Friend Request"
        onClick={onAccept}
        disabled={disabled}
        style={{ width: 36, height: 36 }}
      >
        <FaCheck className="w-5 h-5" />
      </button>
    );
  }

  // Default: Add Friend
  return (
    <button
      className="p-2 rounded-full bg-[#3fae49] hover:bg-[#2e8c36] text-white shadow flex items-center justify-center"
      title="Add Friend"
      aria-label="Add Friend"
      onClick={onAdd}
      disabled={disabled}
      style={{ width: 36, height: 36 }}
    >
      <FaUserPlus className="w-5 h-5" />
    </button>
  );
}

export default function ProfileIdPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = Array.isArray(params.profileId) ? params.profileId[0] : params.profileId!;

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const pageSize = 10;
  const [isFriend, setIsFriend] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1500); // 1.5 seconds cooldown
  };

  // Set token and loggedInUserId on mount
  useEffect(() => {
    setToken(localStorage.getItem("token"));
    let loggedInId = "";
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      if (userObj && userObj.id) {
        loggedInId = userObj.id;
      }
    } catch { }
    setLoggedInUserId(loggedInId);
  }, []);

  // Redirect if viewing own profile
  useEffect(() => {
    let loggedInId = "";
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      if (userObj && userObj.id) {
        loggedInId = userObj.id;
      }
    } catch { }
    if (profileId === loggedInId) {
      router.replace("/profile");
    }
  }, [profileId, router]);

  // Fetch user info and games
  useEffect(() => {
    setLoading(true);
    setError("");
    setUserInfo(null);
    setGames([]);
    if (!profileId) return;

    const token = localStorage.getItem("token") || "";

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

  // Helper to refresh friend status
  const refreshFriendStatus = useCallback(() => {
    if (!profileId || !loggedInUserId || !token) return;
    // Check if already friends
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const friends = data.friends || [];
        // Always compare as strings to avoid ObjectId issues
        setIsFriend(friends.some((f: any) => String(f._id) === String(profileId)));
      });

    // Check pending/incoming requests
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const outgoing = data.outgoing || [];
        const incoming = data.incoming || [];
        setPendingRequest(outgoing.some((req: any) => String(req.recipient) === String(profileId)));
        setIncomingRequest(incoming.some((req: any) => String(req.requester) === String(profileId)));
      });
  }, [profileId, loggedInUserId, token]);

  // Fetch friend/request status on mount and when dependencies change
  useEffect(() => {
    refreshFriendStatus();
  }, [refreshFriendStatus]);

  // --- Friend actions ---
  const handleAddFriend = async () => {
    if (!token || friendLoading || cooldown) return;
    setFriendLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient: profileId,
      }),
    });
    setFriendLoading(false);
    startCooldown();
    refreshFriendStatus();
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return;
    const socket = getSocket(user.id);

    const handler = (data: any) => {
      // Optionally check if data.userId matches profileId or loggedInUserId
      refreshFriendStatus();
    };

    socket.on("friend_status_update", handler);
    return () => {
      socket.off("friend_status_update", handler);
    };
  }, [refreshFriendStatus]);
  
  const handleCancelRequest = async () => {
    if (!token || friendLoading || cooldown) return;
    setFriendLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient: profileId,
      }),
    });
    setFriendLoading(false);
    startCooldown();
    refreshFriendStatus();
  };

  const handleAcceptRequest = async () => {
    if (!token) return;
    setFriendLoading(true);
    // Find the requestId for this incoming request
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/requests?userId=${loggedInUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const incoming = data.incoming || [];
    const request = incoming.find((req: any) => req.requester === profileId);
    if (request) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: request._id,
        }),
      });
    }
    setFriendLoading(false);
    refreshFriendStatus();
  };

  const handleRemoveFriend = async () => {
    if (!token || !loggedInUserId) return;
    setFriendLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: loggedInUserId, friendId: profileId }),
    });
    setFriendLoading(false);
    refreshFriendStatus();
  };

  // Split games into in-progress and finished
  const inProgressGames = games.filter(
    (g) => !g.state?.isOver && !g.wasAborted
  );
  const finishedGames = games.filter(
    (g) => g.state?.isOver || g.wasAborted
  );

  const totalPages = Math.ceil(finishedGames.length / pageSize);
  const pagedGames = finishedGames
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const shortStats = userInfo?.shortStats || {};
  const longStats = userInfo?.longStats || {};
  const shortRating = userInfo?.shortRating ?? 1200;
  const longRating = userInfo?.longRating ?? 1200;

  if (loading) {
    return <div className="max-w-4xl mx-auto mt-2 text-center text-gray-300">Loading...</div>;
  }

  if (!userInfo) {
    return <div className="max-w-4xl mx-auto mt-2 text-center text-gray-300">{error || "User not found."}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-2 px-2 sm:px-0" style={{ paddingTop: "40px" }}>
      <div className="flex justify-end mb-2 gap-2">
        <AddFriendButton
          profileId={profileId}
          loggedInUserId={loggedInUserId}
          token={token}
          isFriend={isFriend}
          pendingRequest={pendingRequest}
          incomingRequest={incomingRequest}
          onAdd={handleAddFriend}
          onRemove={handleRemoveFriend}
          onCancel={handleCancelRequest}
          onAccept={handleAcceptRequest}
          disabled={friendLoading || cooldown}
        />
      </div>
      <ProfileStats
        username={userInfo.username}
        lastSeen={userInfo.lastSeen}
        shortStats={shortStats}
        longStats={longStats}
        shortRating={shortRating}
        longRating={longRating}
        isSelf={false}
      />
      <InProgressGames
        games={inProgressGames}
        userId={loggedInUserId ? loggedInUserId : ""}
      />
      <BadgesBox userId={profileId} />
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {!loading && finishedGames.length === 0 && <div className="text-gray-400">No finished games found.</div>}
      <ProfileGameTable
        games={pagedGames}
        userId={profileId}
        loggedInUserId={loggedInUserId ? loggedInUserId : ""}
      />
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
      <div style={{ height: "80px" }} />
    </div>
  );
}