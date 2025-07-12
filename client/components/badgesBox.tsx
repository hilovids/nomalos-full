import { useEffect, useState } from "react";

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export function BadgesBox({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badge/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        console.log("Fetched badges:", data);
        setBadges(data.badges || []);
      } catch {
        setBadges([]);
      }
      setLoading(false);
    }
    if (userId) fetchBadges();
  }, [userId]);

  return (
    <section className="mb-6 bg-[#181818] rounded-lg shadow p-4 sm:p-6 w-full">
      <h2 className="text-2xl font-bold mb-4 text-white text-center">Badges</h2>
      <div className="flex flex-wrap gap-3 justify-center">
        {loading ? (
          <span className="text-gray-400">Loading...</span>
        ) : badges.length === 0 ? (
          <span className="text-gray-400">No badges earned yet.</span>
        ) : (
          badges.map(badge => (
            <div
              key={badge.id}
              className="flex flex-col items-center bg-[#232323] rounded-lg px-3 py-2 shadow min-w-[90px] max-w-[120px]"
              title={badge.description}
            >
              <img
                src={badge.icon}
                alt={badge.name}
                className="w-10 h-10 mb-2 rounded"
                style={{ objectFit: "contain" }}
              />
              <span className="text-yellow-400 font-semibold text-sm text-center">{badge.name}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}