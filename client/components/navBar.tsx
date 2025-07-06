'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const [user, setUser] = useState<any>(null);
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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 border-b border-[#333] bg-[#181818] shadow-sm">
      <Link href="/" className="text-2xl font-bold tracking-tight text-[#60a5fa] hover:text-[#38bdf8] transition-colors">
        Nomalos
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/new-game" className="text-[#e0e7ef] hover:text-white font-medium transition-colors">
              New Game
            </Link>
            <Link href="/find-game" className="text-[#e0e7ef] hover:text-white font-medium transition-colors">
              Find Game
            </Link>
                        <Link href="/profile" className="text-[#e0e7ef] hover:text-white font-medium transition-colors">
              Profile
            </Link>
            <span className="font-medium text-gray-500 ml-2">Hello, {user.username}</span>
            <button
              className="ml-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors font-semibold"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          pathname !== "/login" && (
            <Link
              href="/login"
              className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-5 py-2 rounded font-semibold transition-colors"
            >
              Login / Register
            </Link>
          )
        )}
      </div>
    </nav>
  );
}