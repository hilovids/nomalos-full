import Card from "../../../components/card";

export const metadata = {
  title: "Rules | Nomalos",
};

export default function RulesPage() {
  return (
    <div className="flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4 mb-14">
        <Card className="w-full mt-8 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-[#60a5fa]">Nomalos Rules</h1>
          <p className="text-gray-200 mb-4">
            <strong>Nomalos</strong> is an abstract strategy game for two players. The rules are simple, but the strategy is deep. Below are the rules for Nomalos.
          </p>

          <h3 className="text-lg font-semibold text-white mt-6 mb-2">How to Play</h3>
          <ol className="list-decimal list-inside text-gray-200 mb-4">
            <li>Play alternates between two players, each with their own colored pieces.</li>
            <li>On your turn, place one of your colored pieces onto any unoccupied space on the board.</li>
            <li>
              If your placement connects an <strong>even</strong> number of similarly colored pieces (connections are strictly orthogonal, not diagonal), all those pieces are immediately removed from the board. Play then continues.
            </li>
            <li>Play ends when every space on the board is occupied or removed.</li>
            <li>The winner is the player with the most pieces remaining on the board at the end of the game.</li>
            <li>Spaces removed from the board do not count towards either player's piece count.</li>
          </ol>

          <h3 className="text-lg font-semibold text-white mt-6 mb-2">Clarifications</h3>
          <ul className="list-disc list-inside text-gray-200 mb-4">
            <li>
              Connected pieces of the same color are called <em>islands</em>.
            </li>
            <li>
              Only count pieces of the same color for removal. If Black has a 1-piece island and White has a 3-piece island, neither is removed.
            </li>
          </ul>

          <div className="mt-8 text-gray-400 text-sm">
            For more details, discussion, and advanced strategies, see somewhere... idk yet.
          </div>
        </Card>
      </main>
    </div>
  );
}