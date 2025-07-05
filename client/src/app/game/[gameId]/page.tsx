'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io as clientIO, Socket } from "socket.io-client";

const socket: Socket = clientIO(process.env.NEXT_PUBLIC_API_URL!);

export default function GamePage() {
  const { gameId } = useParams();
  const [game, setGame] = useState<any>(null);

  // For demonstration, default to 11x11 if no game loaded
  const boardSize = game?.state?.board?.size || 11;
  const spaces: number[] = game?.state?.board?.spaces || Array(boardSize * boardSize).fill(0);

  // Helper to get a row from the 1D spaces array
  function getRow(rowIdx: number) {
    const start = rowIdx * boardSize;
    return spaces.slice(start, start + boardSize);
  }

  useEffect(() => {
    if (!gameId) return;
    socket.emit("join_game", gameId);

    socket.on("game_update", (data) => {
      if (data.gameId === gameId) setGame(data.game);
    });
    socket.on("game_over", (data) => {
      if (data.gameId === gameId) alert("Game Over!");
    });
    socket.on("game_forfeit", (data) => {
      if (data.gameId === gameId) alert("Game Forfeited!");
    });

    // Fetch initial game state
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${gameId}`)
      .then(res => res.json())
      .then(setGame);

    return () => {
      socket.emit("leave_game", gameId);
      socket.off("game_update");
      socket.off("game_over");
      socket.off("game_forfeit");
    };
  }, [gameId]);

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Game ID: {gameId}</h2>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {Array.from({ length: boardSize }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {getRow(rowIdx).map((cell: number, colIdx: number) => (
                  <td
                    key={colIdx}
                    className="w-8 h-8 border border-gray-400 text-center align-middle"
                    style={{ minWidth: 32, minHeight: 32 }}
                  >
                    {cell === 1 ? "●" : cell === 2 ? "○" : cell === 3 ? "✕" : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!game && <div className="mt-4 text-gray-500">Loading game...</div>}
    </div>
  );
}