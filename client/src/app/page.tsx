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
    <div className="flex flex-col" style={{ paddingTop: "88px" }}>
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
        <img
          src="/logo.svg"
          alt="Nomalos Logo"
          className="mb-4"
          height={512}
          width={512}
          style={{ display: "block", margin: "0 auto" }}
        />        <section className="mb-8 bg-[#181818] rounded-lg shadow p-6 w-full">
          <h2 className="text-xl font-semibold mb-2 text-white">What is Nomalos?</h2>
          <p className="text-gray-200 mb-2">
            <span className="font-bold text-[#60a5fa]">Nomalos</span> is an abstract strategy game for two players involving the placement of pieces on a board. In Nomalos, players maximize their territory through the construction of similarly colored islands containing odd numbers of pieces. The core rules of Nomalos and this web app were designed by <span className="font-bold text-[#60a5fa]">Davis Murphy</span>.
          </p>
        </section>
        <section className="mb-8 bg-[#181818] rounded-lg shadow p-6 w-full">
          <h2 className="text-xl font-semibold mb-2 text-white">How to Play</h2>
          <ol className="list-decimal list-inside text-gray-200 mb-2">
            <li>Players take turns placing their colored pieces on empty spaces of the board.</li>
            <li>The goal is to form islands (connected groups) of your color that contain an <strong>odd</strong> number of pieces. Islands formed with an even number of pieces are removed from the board.</li>
            <li>At the end of the game, only islands with an odd number of pieces count towards your score.</li>
            <li>The player with the most spaces wins!</li>
          </ol>
          <p className="text-gray-400 text-sm">
            For more details on how to play, jump into a match or see the in-game rules.
          </p>
        </section>
      </main>
    </div>
  );
}