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
    <nav className="w-full flex justify-between items-center px-6 py-4 border-b bg-white">
      <Link href="/" className="text-xl font-bold">
        Nomalos
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/my-games" className="text-blue-600 hover:underline">
              My Games
            </Link>
            <Link href="/new-game" className="text-blue-600 hover:underline">
              New Game
            </Link>
            <span className="font-medium">Hello, {user.username}</span>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          pathname !== "/login" && (
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Login / Register
            </Link>
          )
        )}
      </div>
    </nav>
  );
}