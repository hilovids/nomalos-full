'use client';
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "@/lib/socket";

export default function GamePage() {
    const { gameId } = useParams();
    const [game, setGame] = useState<any>(null);
    const [error, setError] = useState("");
    const [isConnected, setIsConnected] = useState(true);
    const socket = getSocket();
    const reconnectingRef = useRef(false);

    // Get user info from localStorage
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

    // For demonstration, default to 11x11 if no game loaded
    const boardSize = game?.state?.board?.size || 11;
    const spaces: number[] = game?.state?.board?.spaces || Array(boardSize * boardSize).fill(0);

    // Helper to get a row from the 1D spaces array
    function getRow(rowIdx: number) {
        const start = rowIdx * boardSize;
        return spaces.slice(start, start + boardSize);
    }

    // Determine if it's the user's turn
    const isMyTurn = game && user && (
        (game.state.currentPlayer === 1 && user.id === game.blackPlayer) ||
        (game.state.currentPlayer === 2 && user.id === game.whitePlayer)
    );

    // Handle cell click
    function handleCellClick(rowIdx: number, colIdx: number) {
        if (!isConnected) {
            setError("Reconnecting... please try again in a moment.");
            socket.connect();
            return;
        }
        if (!game || !user || !isMyTurn || game.state.isOver) return;
        const idx = rowIdx * boardSize + colIdx;
        if (spaces[idx] !== 0) return; // Only allow moves on empty cells

        setError("");
        socket.emit("move", {
            gameId,
            row: rowIdx,
            col: colIdx,
            userId: user.id,
        });
    }

    // Listen for socket connection changes and refresh board on reconnect or user activity
    useEffect(() => {
        function fetchGame() {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${gameId}`)
                .then(res => res.json())
                .then(setGame);
        }

        function handleReconnect() {
            setIsConnected(true);
            setError("");
            socket.emit("join_game", gameId);
            fetchGame();
            reconnectingRef.current = false;
        }

        function handleDisconnect() {
            setIsConnected(false);
            setError("Disconnected from server. Trying to reconnect...");
            reconnectingRef.current = true;
        }

        socket.on("connect", handleReconnect);
        socket.on("disconnect", handleDisconnect);

        // Optionally, refresh board when user becomes active again (after disconnect)
        function handleVisibilityChange() {
            if (
                document.visibilityState === "visible" &&
                !socket.connected &&
                reconnectingRef.current
            ) {
                socket.connect();
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            socket.off("connect", handleReconnect);
            socket.off("disconnect", handleDisconnect);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [gameId, socket]);

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
        socket.on("move_error", (msg) => setError(msg));

        // Initial fetch
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${gameId}`)
            .then(res => res.json())
            .then(setGame);

        return () => {
            socket.emit("leave_game", gameId);
            socket.off("game_update");
            socket.off("game_over");
            socket.off("game_forfeit");
            socket.off("move_error");
        };
    }, [gameId, socket]);

    return (
        <div className="min-h-screen bg-[#232323] flex flex-col items-center py-8"
            style={{ paddingTop: "88px" }} // Add top padding to clear the fixed navbar
        >
            {/* Game Status */}
            <div className="mb-4 text-center">
                {game?.state?.isOver
                    ? <span className="text-red-400 font-bold">Game Over</span>
                    : isMyTurn
                        ? <span className="text-green-400 font-bold">YOUR TURN</span>
                        : <span className="text-gray-400">Opponent's turn</span>
                }
                {!isConnected && (
                    <div className="text-orange-400 mt-1">Disconnected. Attempting to reconnect...</div>
                )}
                {error && <div className="text-red-400 mt-1">{error}</div>}
            </div>

            {/* Board */}
            <div className="overflow-x-auto flex justify-center w-full">
                <div
                    style={{
                        background: "repeating-linear-gradient(135deg, #f9e4b7, #f9e4b7 40px, #f5d399 40px, #f5d399 80px)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        borderRadius: "12px",
                        display: "inline-block",
                        padding: "8px"
                    }}
                >
                    <table className="border-collapse mx-auto">
                        <tbody>
                            {Array.from({ length: boardSize }).map((_, rowIdx) => (
                                <tr key={rowIdx}>
                                    {getRow(rowIdx).map((cell: number, colIdx: number) => (
                                        <td
                                            key={colIdx}
                                            className={`
                                            w-8 h-8 border select-none text-center align-middle
                                            ${cell === 0 && isMyTurn && !game?.state?.isOver && isConnected ? "hover:bg-amber-700/40 cursor-pointer" : ""}
                                            ${cell === 3 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""}
                                        `}
                                            style={{
                                                minWidth: 32,
                                                minHeight: 32,
                                                padding: 0,
                                                verticalAlign: "middle",
                                                borderColor: "#633f2559"
                                            }}
                                            onClick={() => cell === 0 ? handleCellClick(rowIdx, colIdx) : undefined}
                                        >
                                            {cell === 1 ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: "inline-block" }}>
                                                    <circle cx="12" cy="12" r="10" fill="#22272b" stroke="black" strokeWidth="2" />
                                                </svg>
                                            ) : cell === 2 ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: "inline-block" }}>
                                                    <circle cx="12" cy="12" r="10" fill="white" stroke="#888" strokeWidth="2" />
                                                </svg>
                                            ) : cell === 3 ? (
                                                <span style={{ fontSize: 20, fontWeight: "bold" }}>✕</span>
                                            ) : (
                                                ""
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Player Info Card */}
            <div className="nomalos-card w-full max-w-xl mt-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold">Players</span>
                    <span className="text-sm text-gray-400">Game ID: {gameId}</span>
                </div>
                <div className="nomalos-player-row">
                    <svg className="nomalos-player-piece" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="#22272b" stroke="black" strokeWidth="2" />
                    </svg>
                    <span className="font-semibold">
                        {game?.blackPlayerUsername || "Black"} {user && user.id === game?.blackPlayer && "(You)"}
                    </span>
                </div>
                <div className="nomalos-player-row">
                    <svg className="nomalos-player-piece" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="white" stroke="#888" strokeWidth="2" />
                    </svg>
                    <span className="font-semibold">
                        {game?.whitePlayerUsername || "White"} {user && user.id === game?.whitePlayer && "(You)"}
                    </span>
                </div>
            </div>
        </div>
    );
}