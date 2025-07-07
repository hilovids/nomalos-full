import Card from "../../../components/card";

export const metadata = {
  title: "About | Nomalos",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
        <Card className="w-full mt-8 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-yellow-400">About Nomalos</h1>
          <p className="text-gray-200 mb-4">
            <strong>Nomalos</strong> was created in 2020 as an attempt to design a game with the highest possible strategic complexity using the fewest and simplest rules. Inspired by classic abstract games, Nomalos explores how deep gameplay can emerge from minimal mechanics and constraints. The game’s name, Nomalos, is derived from the English negation ‘no’ and the Greek word ‘ομαλός’ meaning smooth or even. Putting the two loosely together, you get the central concept of the game.
          </p>
          <p className="text-gray-200 mb-4">
            Nomalos was designed and developed by <span className="font-bold text-yellow-400">Davis Murphy</span>. Additional support was provided by <span className="font-bold text-yellow-400">Logan Smith</span>, <span className="font-bold text-yellow-400">Nicholas Lorch</span> and <span className="font-bold text-yellow-400">Randal Tuggle</span>.
          </p>
          <p className="text-gray-200 mb-4">
            This web app allows you to play Nomalos online, track your stats, and compete with others. For more information about how to play, visit the <a href="/rules" className="text-yellow-400 hover:underline">Rules</a> page.
          </p>
          <div className="mt-6 flex gap-4">
            <a
              href="https://github.com/hilovids"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#232323] text-blue-400 hover:text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              GitHub
            </a>
            {/* <a
              className="bg-[#232323] text-yellow-400 hover:text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              Contact
            </a> */}
          </div>
        </Card>
      </main>
    </div>
  );
}