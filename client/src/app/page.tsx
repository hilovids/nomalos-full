'use client';
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Nomalos!</h1>
        <p className="mb-8 text-lg text-gray-700">
          Play, compete, and track your stats.
        </p>
      </main>
    </div>
  );
}