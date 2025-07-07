'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProfileStats, ProfileGameTable, InProgressGames } from "../../../../components/profileView";

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

  useEffect(() => {
    // Get logged-in user id from localStorage
    let loggedInId = "";
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      if (userObj && userObj.id) {
        loggedInId = userObj.id;
      }
    } catch {}
    // If viewing own profile, redirect to /profile
    if (profileId === loggedInId) {
      router.replace("/profile");
    }
  }, [profileId, router]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setUserInfo(null);
    setGames([]);
    if (!profileId) return;

    const token = localStorage.getItem("token") || "";

    let loggedInId = "";
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      if (userObj && userObj.id) {
        loggedInId = userObj.id;
      }
    } catch { }
    setLoggedInUserId(loggedInId);

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
        userId={profileId}
      />
      <h2 className="text-2xl font-bold mb-6 text-white">Game History</h2>
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