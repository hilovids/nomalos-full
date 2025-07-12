'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import Card from "../../../components/card";

type Tournament = {
  id: string;
  name: string;
  registrationTime: string;
  startTime: string;
  endTime?: string | null;
  status: "upcoming" | "active" | "finished";
  participants: string[];
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Tournaments | Nomalos";
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token") || "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tournament`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTournaments(Array.isArray(data.tournaments) ? data.tournaments : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tournaments.");
        setLoading(false);
      });
  }, []);

  const openRegistration = tournaments.filter(t => t.status === "upcoming");
  const active = tournaments.filter(t => t.status === "active");
  const finished = tournaments.filter(t => t.status === "finished");

  function renderSection(title: string, items: any[]) {
    return (
      <Card className="w-full max-w-full sm:max-w-4xl mt-8 mb-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400 text-center">{title}</h2>
        <div className="w-full">
          <div className="rounded-lg overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-gray-300 border-b border-[#333]">
                  <th className="py-3 px-2 font-semibold text-left">Name</th>
                  <th className="py-3 px-2 font-semibold text-left">Start</th>
                  <th className="py-3 px-2 font-semibold text-left">Participants</th>
                  <th className="py-3 px-2 font-semibold text-left">Status</th>
                  <th className="py-3 px-2 font-semibold text-left"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-red-400">{error}</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No tournaments found.</td>
                  </tr>
                ) : (
                  items.map(tournament => (
                    <tr key={tournament.id} className="border-b border-[#232323] hover:bg-[#232323] transition">
                      <td className="py-2 px-2 font-semibold max-w-[16rem]">
                        <Link
                          href={`/tournaments/${tournament._id}`}
                          className="text-white hover:underline block truncate"
                          title={tournament.name}
                        >
                          {tournament.name}
                        </Link>
                      </td>
                      <td className="py-2 px-2 text-gray-400 text-sm">
                        {tournament.startTime ? new Date(tournament.startTime).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="py-2 px-2 text-yellow-400 font-bold">{tournament.participants.length}</td>
                      <td className="py-2 px-2 text-gray-300">{tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</td>
                      <td className="py-2 px-2">
                        <Link
                          href={`/tournaments/${tournament._id}`}
                          className="bg-[#3fae49] hover:bg-[#2e8c36] text-white px-3 py-1 rounded font-semibold transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col mb-14">
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-4">
        {renderSection("Open Registration", openRegistration)}
        {renderSection("Active Tournaments", active)}
        {renderSection("Finished Tournaments", finished)}
      </main>
    </div>
  );
}