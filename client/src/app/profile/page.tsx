'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileStats, ProfileGameTable, InProgressGames } from "../../../components/profileView";
import { FaUserFriends } from "react-icons/fa";

function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-[#232323] rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        {children}
        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendListModal({ open, onClose, token, user }: { open: boolean, onClose: () => void, token: string | null, user: any }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !token || !user?.id) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setFriends(data.friends || []))
      .finally(() => setLoading(false));
  }, [open, token, user?.id]);

  if (!open) return null;

  // Add scroll if more than 5 friends
  const scrollClass = friends.length > 5 ? "friends-scroll max-h-56 overflow-y-auto pr-1" : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="bg-[#232323] rounded-lg shadow-lg p-6 min-w-[90vw] max-w-md w-full sm:min-w-[320px]">
        <div className="text-xl font-bold text-white mb-4 text-center">Your Friends</div>
        {/* Friend list section with dark background and scroll */}
        <div
          className={`bg-[#18181b] rounded-md p-3 mb-4 ${scrollClass}`}
          style={{ minHeight: "80px" }}
        >
          {loading ? (
            <div className="text-gray-300">Loading...</div>
          ) : friends.length === 0 ? (
            <div className="text-gray-400">You do not have any friends.</div>
          ) : (
            <ul className="space-y-2">
              {friends.map(friend => (
                <li key={friend._id} className="text-white flex items-center gap-2">
                  <a
                    href={`/profile/${friend._id}`}
                    className="font-semibold hover:underline"
                  >
                    {friend.username}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState<string>("");
  const router = useRouter();
  const [showFriends, setShowFriends] = useState(false);

  async function handleDeleteAccount() {
    setDeleteError("");
    if (!user?.id || !token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account.");
        return;
      }
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setShowDeleteModal(false);
      router.push("/");
      window.location.reload();
    } catch {
      setDeleteError("Failed to delete account.");
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const tokenData = localStorage.getItem("token");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setLoggedInUserId(parsedUser.id); // <-- set loggedInUserId from user object
    }
    setToken(tokenData || null);
    document.title = "Your Profile | Nomalos";
  }, []);

  useEffect(() => {
    if (!user?.username || !token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${user.id}`, {
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

  if (loading) {
    return <div className="max-w-4xl mx-auto mt-2 text-center text-gray-300">Loading...</div>;
  }

  if (!user) {
    return <div className="max-w-4xl mx-auto mt-2 text-center text-gray-300">Please log in to view your games.</div>;
  }

  const shortStats = userInfo?.shortStats || {};
  const longStats = userInfo?.longStats || {};
  const shortRating = userInfo?.shortRating ?? 1200;
  const longRating = userInfo?.longRating ?? 1200;

  return (
    <div className="p-4 max-w-4xl mx-auto mt-2" style={{ paddingTop: "40px" }}>
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="text-center">
          <div className="text-xl font-bold text-red-400 mb-2">Delete Account</div>
          <div className="text-base text-gray-200 mb-4">
            Are you sure you want to <span className="text-red-400 font-semibold">delete your account</span>?<br />
            This action cannot be undone.
          </div>
          {deleteError && <div className="text-red-400 mb-2">{deleteError}</div>}
          <div className="flex justify-center gap-4">
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold shadow"
              onClick={handleDeleteAccount}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
      <div className="flex justify-end mb-2">
        <button
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow flex items-center justify-center"
          title="View Friends"
          aria-label="View Friends"
          onClick={() => setShowFriends(true)}
          style={{ width: 36, height: 36 }}
        >
          <FaUserFriends className="w-5 h-5" />
        </button>
      </div>
      <FriendListModal open={showFriends} onClose={() => setShowFriends(false)} token={token} user={user} />
      <ProfileStats
        username={userInfo?.username || user?.username}
        lastSeen={userInfo?.lastSeen}
        shortStats={shortStats}
        longStats={longStats}
        shortRating={shortRating}
        longRating={longRating}
        isSelf
        onDelete={() => setShowDeleteModal(true)}
        showDelete
      />
      <InProgressGames
        games={inProgressGames}
        userId={user.id}
      />
      <h2 className="text-2xl font-bold mb-6 text-white">Game History</h2>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {!loading && finishedGames.length === 0 && <div className="text-gray-400">No finished games found.</div>}
      <ProfileGameTable
        games={pagedGames}
        userId={user.id}
        isSelf
        loggedInUserId={loggedInUserId}
      />
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {/* ...pagination... */}
        </div>
      )}
      <div style={{ height: "80px" }} />
    </div>
  );
}