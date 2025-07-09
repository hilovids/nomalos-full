'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { FaUserFriends } from "react-icons/fa";

export default function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxAlert, setInboxAlert] = useState(false);
  const [popup, setPopup] = useState<{ fromUsername: string, requestId: string } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Check friend requests
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/request/count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(({ count, friendCount, gameCount }) => {
        if (friendCount > 0 || gameCount > 0) {
          setInboxAlert(true);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return;
    const socket = getSocket(user.id);
    // Listen for friend_request
    socket.on("friend_request", (data) => {
      setInboxAlert(true);
      console.log("Friend request received:", data);
      setPopup({ fromUsername: data.fromUsername, requestId: data.requestId }); // <-- include requestId
      setTimeout(() => setPopup(null), 5000); // Hide popup after 5s
    });
    return () => {
      socket.off("friend_request");
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(true);
    window.location.href = "/login";
  }

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="w-full flex justify-between items-center px-4 sm:px-8 py-1 sm:py-2 border-b border-[#333] bg-[#181818] shadow-sm overflow-hidden">
      <Link href="/" className="flex items-center min-w-0">
        <img
          src="/logo_small.svg"
          alt="Nomalos Logo"
          width={36}
          height={36}
          style={{ display: "block", padding: 0, margin: 0 }}
          className="m-0 p-0 w-9 h-9 sm:w-12 sm:h-12"
        />
        <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded text-xs font-bold text-yellow-400">
          beta
        </span>
      </Link>
      {/* Hamburger menu button for mobile */}
      {pathname !== "/login" && (
        <button
          className="sm:hidden flex flex-col justify-center items-center w-10 h-10 ml-2 focus:outline-none"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={`block w-6 h-0.5 bg-gray-200 mb-1 transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-200 mb-1 transition-all ${menuOpen ? "opacity-0" : ""}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-200 transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}></span>
        </button>
      )}
      <div className="hidden sm:flex items-center gap-3 sm:gap-4 text-sm sm:text-base">
        {user ? (
          <>
            <Link href="/new-game" className="text-[#e0e7ef] hover:text-white font-medium transition-colors">
              New Game
            </Link>
            <Link href="/find-game" className="text-[#e0e7ef] hover:text-white font-medium transition-colors">
              Find Game
            </Link>
            <Link href="/leaderboard" className="text-[#e0e7ef] hover:text-white font-medium transition-colors">
              Leaderboard
            </Link>
            <Link href="/inbox" className="relative text-[#e0e7ef] hover:text-white font-medium transition-colors">
              Inbox
              {inboxAlert && (
                <span className="absolute -top-1 -right-3 bg-red-600 text-white rounded-full px-1.5 text-xs font-bold">
                  !
                </span>
              )}
            </Link>
            <Link href="/profile" className="text-[#e0e7ef] hover:text-white font-medium transition-colors">
              Profile
            </Link>
            <span className="font-medium text-gray-500 ml-2">Hello, {user.username}</span>
            <button
              className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors font-semibold text-xs sm:text-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          pathname !== "/login" && (
            <Link
              href="/login"
              className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-4 py-1.5 rounded font-semibold transition-colors text-xs sm:text-sm"
            >
              Login / Register
            </Link>
          )
        )}
      </div>
      {/* Mobile menu */}
      {pathname !== "/login" && (
        <div
          className={`sm:hidden absolute left-0 w-full bg-[#181818] border-b border-[#333] shadow-md transition-all duration-200 z-40 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
            } overflow-hidden`}
          style={{ top: "100%" }}
        >
          <div className="flex flex-col items-start gap-2 px-4 py-3 text-base">
            {user ? (
              <>
                <Link href="/new-game" className="w-full py-2 text-[#e0e7ef] hover:text-white font-medium transition-colors" onClick={() => setMenuOpen(false)}>
                  New Game
                </Link>
                <Link href="/find-game" className="w-full py-2 text-[#e0e7ef] hover:text-white font-medium transition-colors" onClick={() => setMenuOpen(false)}>
                  Find Game
                </Link>
                <Link href="/leaderboard" className="w-full py-2 text-[#e0e7ef] hover:text-white font-medium transition-colors" onClick={() => setMenuOpen(false)}>
                  Leaderboard
                </Link>
                <Link href="/inbox" className="relative">
                  Inbox
                  {inboxAlert && (
                    <span className="absolute -top-1 -right-3 bg-red-600 text-white rounded-full px-1.5 text-xs font-bold">
                      !
                    </span>
                  )}
                </Link>
                <Link href="/profile" className="w-full py-2 text-[#e0e7ef] hover:text-white font-medium transition-colors" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <span className="w-full font-medium text-gray-500 text-center py-2">Hello, {user.username}</span>
                <button
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors font-semibold mt-1"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              pathname !== "/login" && (
                <Link
                  href="/login"
                  className="w-full bg-[#3fae49] hover:bg-[#2e8c36] text-white px-4 py-2 rounded font-semibold transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Login / Register
                </Link>
              )
            )}
          </div>
        </div>
      )}
      {popup && !pathname.includes("/game") && (
        <div
          className="fixed bottom-24 right-8 z-50 bg-[#232323] text-white rounded-lg shadow-xl px-6 py-3 border-r-4 border-green-400 flex flex-col items-start min-w-[220px] max-w-[90vw] animate-slide-in"
          style={{ fontSize: "1rem" }}
        >
          <div className="font-bold text-green-400 text-base mb-1 flex items-center gap-2">
            <FaUserFriends className="text-green-400 w-5 h-5" />
            Friend Request
          </div>
          <div className="mb-1 w-full">
            From{" "}
            <span
              className="text-green-300 font-semibold inline-block max-w-[140px] truncate align-bottom"
              title={popup.fromUsername}
              style={{ verticalAlign: "bottom" }}
            >
              {popup.fromUsername}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1 rounded transition"
              onClick={async () => {
                const token = localStorage.getItem("token");
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/accept`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ requestId: popup.requestId }),
                });
                setPopup(null);
                setInboxAlert(false);
                // Notify profile page to refresh friend status
                window.dispatchEvent(new Event("friendStatusChanged"));
              }}
            >
              Accept
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1 rounded transition"
              onClick={async () => {
                const token = localStorage.getItem("token");
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/decline`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ requestId: popup.requestId }),
                });
                setPopup(null);
                setInboxAlert(false);
                // Notify profile page to refresh friend status
                window.dispatchEvent(new Event("friendStatusChanged"));
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}