'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "../../../../components/card";

type Tournament = {
  id: string;
  name: string;
  description?: string;
  registrationTime: string;
  startTime: string;
  endTime: string | null;
  participants: string[];
  matches: any[];
  results: { [userId: string]: number };
  firstBadge: string | null;
  secondBadge: string | null;
  participantBadge: string | null;
  status: "upcoming" | "active" | "finished";
};

type Match = {
  id: string;
  round: number;
  player1: string;
  player2: string;
  gameId: string;
  result: string;
};

export default function TournamentPage() {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    }
  }, []);

  useEffect(() => {
    async function fetchTournament() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournament/${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setTournament(data.tournament || null);
        setLoading(false);
      } catch {
        setError("Failed to load tournament.");
        setLoading(false);
      }
    }
    if (tournamentId) fetchTournament();
  }, [tournamentId]);

  useEffect(() => {
    async function fetchMatches() {
      if (!tournamentId) return;
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournament/${tournamentId}/matches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setMatches(data.matches || []);
      } catch {
        setMatches([]);
      }
    }
    fetchMatches();
  }, [tournamentId]);

  if (loading) {
    return (
      <Card className="max-w-3xl mx-auto mt-10 p-8">
        <div className="text-center text-gray-400 text-lg">Loading tournament...</div>
      </Card>
    );
  }

  if (error || !tournament) {
    return (
      <Card className="max-w-3xl mx-auto mt-10 p-8">
        <div className="text-center text-red-400 text-lg">{error || "Tournament not found."}</div>
      </Card>
    );
  }

  const now = new Date();
  const registrationTime = new Date(tournament.registrationTime);
  const startTime = new Date(tournament.startTime);
  const endTime = tournament.endTime ? new Date(tournament.endTime) : null;
  const isRegistered = user && tournament.participants.includes(user.id);

  // Registration phase
  const canRegister =
    now >= registrationTime &&
    now < startTime &&
    tournament.status === "upcoming";

  // Tournament active
  const isActive =
    now >= startTime &&
    (!endTime || now < endTime) &&
    tournament.status === "active";

  // Tournament finished
  const isFinished =
    endTime && now >= endTime && tournament.status === "finished";

  async function handleJoin() {
    setJoining(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournament/${tournamentId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTournament(prev =>
          prev
            ? { ...prev, participants: [...prev.participants, user.id] }
            : prev
        );
      } else {
        setError(data.error || "Failed to join tournament.");
      }
    } catch {
      setError("Failed to join tournament.");
    }
    setJoining(false);
  }

  async function handleLeave() {
    // Implement leave logic if you have an endpoint for leaving
    setError("Leaving tournaments is not yet implemented.");
  }

  return (
    <Card className="max-w-3xl mx-auto mt-10 p-8">
      <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center">{tournament.name}</h1>
      <p className="text-gray-300 text-center mb-4">{tournament.description}</p>
      <div className="flex flex-col sm:flex-row justify-center gap-6 mb-6">
        <div>
          <span className="font-semibold text-gray-400">Registration:</span>{" "}
          <span className="text-white">{registrationTime.toLocaleString()}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-400">Start:</span>{" "}
          <span className="text-white">{startTime.toLocaleString()}</span>
        </div>
        {endTime && (
          <div>
            <span className="font-semibold text-gray-400">End:</span>{" "}
            <span className="text-white">{endTime.toLocaleString()}</span>
          </div>
        )}
        <div>
          <span className="font-semibold text-gray-400">Status:</span>{" "}
          <span className="text-white capitalize">{tournament.status}</span>
        </div>
      </div>

      {/* Registration actions */}
      {canRegister && user && (
        <div className="flex justify-center mb-6">
          {isRegistered ? (
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
              onClick={handleLeave}
              disabled={joining}
            >
              Leave Tournament
            </button>
          ) : (
            <button
              className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-4 py-2 rounded font-semibold"
              onClick={handleJoin}
              disabled={joining}
            >
              Join Tournament
            </button>
          )}
        </div>
      )}

      {/* Participants */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-2">Participants ({tournament.participants.length})</h2>
        <div className="flex flex-wrap gap-2">
          {tournament.participants.length === 0 ? (
            <span className="text-gray-400">No participants yet.</span>
          ) : (
            tournament.participants.map(pid => (
              <span key={pid} className="bg-[#232323] text-yellow-400 px-3 py-1 rounded font-mono text-sm">
                {pid}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Active tournament: show matches */}
      {isActive && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Matches</h2>
          {matches.length === 0 ? (
            <span className="text-gray-400">No matches scheduled yet.</span>
          ) : (
            <table className="min-w-full rounded-lg overflow-x-auto">
              <thead>
                <tr className="text-gray-300 border-b border-[#333]">
                  <th className="py-2 px-2 font-semibold text-left">Round</th>
                  <th className="py-2 px-2 font-semibold text-left">Player 1</th>
                  <th className="py-2 px-2 font-semibold text-left">Player 2</th>
                  <th className="py-2 px-2 font-semibold text-left">Game</th>
                  <th className="py-2 px-2 font-semibold text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(match => (
                  <tr key={match.id} className="border-b border-[#232323]">
                    <td className="py-2 px-2">{match.round}</td>
                    <td className="py-2 px-2">{match.player1}</td>
                    <td className="py-2 px-2">{match.player2}</td>
                    <td className="py-2 px-2">
                      {match.gameId ? (
                        <Link
                          href={`/game/${match.gameId}`}
                          className="text-blue-400 hover:underline"
                        >
                          View Game
                        </Link>
                      ) : (
                        <span className="text-gray-400">Not started</span>
                      )}
                    </td>
                    <td className="py-2 px-2">{match.result || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Finished tournament: show results */}
      {isFinished && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Results</h2>
          {tournament.results && Object.keys(tournament.results).length > 0 ? (
            <table className="min-w-full rounded-lg overflow-x-auto">
              <thead>
                <tr className="text-gray-300 border-b border-[#333]">
                  <th className="py-2 px-2 font-semibold text-left">User</th>
                  <th className="py-2 px-2 font-semibold text-left">Placement</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tournament.results)
                  .sort((a, b) => a[1] - b[1])
                  .map(([userId, placement]) => (
                    <tr key={userId} className="border-b border-[#232323]">
                      <td className="py-2 px-2">{userId}</td>
                      <td className="py-2 px-2">{placement}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <span className="text-gray-400">No results available.</span>
          )}
        </div>
      )}

      {error && <div className="text-red-400 mt-4 text-center">{error}</div>}
    </Card>
  );
}