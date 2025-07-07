'use client';
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import Link from "next/link";

export default function GamePage() {
    const { gameId } = useParams();
    const [game, setGame] = useState<any>(null);
    const [error, setError] = useState("");
    const [isConnected, setIsConnected] = useState(true);
    const [showEndModal, setShowEndModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [eloChange, setEloChange] = useState<number | null>(null);
    const [result, setResult] = useState<"win" | "loss" | "draw" | null>(null);
    const socket = getSocket();
    const router = useRouter();
    const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const thunkAudioRef = useRef<HTMLAudioElement | null>(null);

    const [soundOn, setSoundOn] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("soundOn");
            return stored === null ? true : stored === "true";
        }
        return true;
    });

    function handleForfeit() {
        if (!game || !user || !isPlayer) return;
        setShowForfeitConfirm(true);
    }

    function getPlayerScores() {
        // 1 = black, 2 = white
        let black = 0, white = 0;
        if (!Array.isArray(spaces)) return { black, white };
        for (const cell of spaces) {
            if (cell === 1) black++;
            if (cell === 2) white++;
        }
        return { black, white };
    }

    function confirmForfeit() {
        setShowForfeitConfirm(false);
        socket.emit("forfeit_game", { gameId, userId: user.id });
    }

    function getMoveTimeMs() {
        return game?.timing === "short" ? 2 * 60 * 1000 : 24 * 60 * 60 * 1000; // 2 min or 24 hours
    }

    function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
        if (!open) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                <div className="bg-[#232323] rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
                    {children}
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={onClose}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    function formatMove(move: any) {
        // move: integer index (0 ... boardSize*boardSize-1)
        if (typeof move !== "number" || isNaN(move) || !Number.isFinite(move)) return "";
        const row = Math.floor(move / boardSize);
        const col = move % boardSize;
        const colLetter = String.fromCharCode(65 + col); // A, B, C...
        return `${colLetter}${row + 1}`;
    }

    function getRow(rowIdx: number) {
        const start = rowIdx * boardSize;
        return spaces.slice(start, start + boardSize);
    }

    function getLastMoveTime() {
        // Prefer lastMoveAt if present, else fallback to updatedAt/createdAt
        return new Date(game?.lastMoveAt || game?.updatedAt || game?.createdAt || Date.now());
    }

    // Get user info from localStorage
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    const isPlayer = user && (user.id === game?.blackPlayer || user.id === game?.whitePlayer);

    // For demonstration, default to 11x11 if no game loaded
    const boardSize = game?.state?.board?.size || 11;
    const spaces: number[] = game?.state?.board?.spaces || Array(boardSize * boardSize).fill(0);

    const { black: blackScore, white: whiteScore } = getPlayerScores();

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
        // Only allow moves if user is a player
        if (!isPlayer) return;
        const idx = rowIdx * boardSize + colIdx;
        if (spaces[idx] !== 0) return;
        setError("");
        socket.emit("move", {
            gameId,
            row: rowIdx,
            col: colIdx,
            userId: user.id,
        });
    }

    useEffect(() => {
        if (!game || !soundOn) return;
        // Only play sound if a move was just made (not on initial load)
        if (!thunkAudioRef.current) {
            thunkAudioRef.current = new Audio("/thunk.wav");
        } else {
            thunkAudioRef.current.currentTime = 0;
        }
        // Only play if moveList length increased
        if (game.state?.moveList?.length > 0) {
            thunkAudioRef.current.play().catch(() => { });
        }
        // eslint-disable-next-line
    }, [game?.state?.moveList?.length]);

    function formatTime(ms: number) {
        if (game?.timing === "short") {
            const totalSeconds = Math.floor(ms / 1000);
            const min = Math.floor(totalSeconds / 60);
            const sec = totalSeconds % 60;
            return `${min}:${sec.toString().padStart(2, "0")}`;
        } else {
            // long: show "Xhr", then "Xmin", then "0:XX"
            const totalSeconds = Math.floor(ms / 1000);
            if (totalSeconds >= 3600) {
                const hours = Math.floor(totalSeconds / 3600);
                return `${hours}hr`;
            } else if (totalSeconds >= 60) {
                const min = Math.floor(totalSeconds / 60);
                return `${min}min`;
            } else {
                // under 1 minute, show as 0:SS
                const sec = totalSeconds % 60;
                return `0:${sec.toString().padStart(2, "0")}`;
            }
        }
    }

    const lastMoveIdx = game?.state?.moveList?.length
        ? game.state.moveList[game.state.moveList.length - 1]
        : null;

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("soundOn", soundOn ? "true" : "false");
        }
    }, [soundOn]);

    function toggleSound() {
        setSoundOn((prev) => !prev);
    }

    useEffect(() => {
        if (!game) return;
        if (game.state?.isOver) {
            // Show "vs X" where X is the opponent's username
            if (user && game.playerUsernames && game.players) {
                const myIdx = game.players[0] === user.id ? 0 : 1;
                const oppIdx = myIdx === 0 ? 1 : 0;
                const oppName = game.playerUsernames[oppIdx] || "Opponent";
                document.title = `Match vs. ${oppName} | Nomalos`;
            } else {
                document.title = "Game | Nomalos";
            }
        }
        else if (!isPlayer) {
            document.title = "Spectating Game | Nomalos";
        }
        else if (isMyTurn) {
            document.title = "Your Turn | Nomalos";
        } else {
            document.title = "Opponent's Turn | Nomalos";
        }
    }, [game, isMyTurn, user]);

    // Listen for socket connection changes and refresh board on reconnect or user activity
    useEffect(() => {
        if (!gameId) return;
        socket.emit("join_game", gameId);

        socket.on("game_update", (data) => {
            if (data.gameId === gameId) setGame(data.game);
        });
        socket.on("game_over", (data) => {
            if (data.gameId === gameId) {
                if (data.game) {
                    setGame(data.game);
                } else {
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${gameId}`)
                        .then(res => res.json())
                        .then(setGame);
                }
                // Determine result and ELO change
                if (user && (data.game || game)) {
                    const g = data.game || game;
                    let res: "win" | "loss" | "draw" = "draw";
                    if (g.winner === user.id) res = "win";
                    else if (g.winner === null) res = "draw";
                    else res = "loss";
                    setResult(res);

                    if (!g.rated) {
                        setEloChange(null);
                    }
                }
                setShowEndModal(true);
            }
        });
        socket.on("move_error", (msg) => {
            setError(msg);
            setShowErrorModal(true);
        });

        // Initial fetch
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${gameId}`)
            .then(res => res.json())
            .then(setGame);

        return () => {
            socket.emit("leave_game", gameId);
            socket.off("game_update");
            socket.off("game_over");
            socket.off("move_error");
        };
    }, [gameId, socket]);

    useEffect(() => {
        if (!game) return;

        let interval: NodeJS.Timeout | null = null;

        function updateTime() {
            if (!game) return setTimeLeft(null);

            const msAllowed = getMoveTimeMs();
            const lastMove = getLastMoveTime();
            const now = Date.now();

            // Is it my turn?
            const myTurn = isMyTurn;

            if (myTurn && !game.state.isOver) {
                const msLeft = msAllowed - (now - lastMove.getTime());
                setTimeLeft(Math.max(0, msLeft));
            } else {
                setTimeLeft(msAllowed);
            }
        }

        updateTime();

        // Only count down if it's my turn and game not over
        if (isMyTurn && !game.state.isOver) {
            interval = setInterval(updateTime, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game, isMyTurn]);

    const cellPx = 32;
    const boardPadding = 16; // 8px top + 8px bottom
    const boardHeight = boardSize * cellPx + boardPadding;

    return (
        <div className="min-h-screen bg-[#232323] flex flex-col items-center py-8"
            style={{ paddingTop: "88px" }}
        >
            <audio ref={thunkAudioRef} src="/thunk.wav" preload="auto" style={{ display: "none" }} />

            {/* Forfeit Confirmation Modal */}
            <Modal
                open={showForfeitConfirm}
                onClose={() => setShowForfeitConfirm(false)}
            >
                <div className="text-center">
                    <div className="text-xl font-bold text-red-400 mb-2">Forfeit Game</div>
                    <div className="text-base text-gray-200 mb-4">
                        Are you sure you want to forfeit this game? This will count as a loss unless less than 5 moves have been played.
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold shadow"
                            onClick={confirmForfeit}
                        >
                            Forfeit
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={showEndModal}
                onClose={() => {
                    setShowEndModal(false);
                }}
            >
                <div className="text-center">
                    <div className="text-2xl font-bold text-[#60a5fa] mb-2">Game Over</div>
                    {/* Win/Loss/Draw Text */}
                    {user && game ? (
                        game.winner === user.id ? (
                            <div className="text-green-400 text-lg font-semibold mb-4">You won!</div>
                        ) : game.wasAborted ? (
                            <div className="text-yellow-300 text-lg font-semibold mb-4">Game Aborted</div>
                        ) : (
                            <div className="text-red-400 text-lg font-semibold mb-4">You lost...</div>
                        )
                    ) : null}
                    <div className="mt-6">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
                            onClick={() => router.push("/find-game")}
                        >
                            Find a New Game
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Error Modal */}
            <Modal
                open={showErrorModal}
                onClose={() => setShowErrorModal(false)}
            >
                <div className="text-center">
                    <div className="text-xl font-bold text-red-400 mb-2">Error</div>
                    <div className="text-base text-gray-200">{error}</div>
                </div>
            </Modal>

            {/* Sound Toggle */}
            <button
                aria-label="Toggle sound"
                onClick={toggleSound}
                className="self-end mr-10 p-2 rounded-full bg-[#232323] hover:bg-[#333] transition"
                title={soundOn ? "Mute sounds" : "Enable sounds"}
            >
                {soundOn ? (
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 14h2l3 3V7l-3 3H5v4z" />
                        <path d="M15 9a3 3 0 010 6" />
                        <path d="M17.5 6.5a7 7 0 010 11" />
                    </svg>
                ) : (
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 14h2l3 3V7l-3 3H5v4z" />
                        <line x1="19" y1="5" x2="5" y2="19" stroke="red" strokeWidth="2" />
                    </svg>
                )}
            </button>

            {/* Game Status */}
            <div className="mb-4 text-center">
                {game?.state?.isOver ? (
                    isPlayer ? (
                        <>
                            <span className="text-yellow-300 font-bold">Game Over</span>
                            <div className="mt-2 text-base">
                                {game.winner === user.id ? (
                                    <span className="text-green-400 font-semibold">You won!</span>
                                ) : game.winner === null ? (
                                    <span className="text-yellow-300 font-semibold">Draw</span>
                                ) : (
                                    <span className="text-red-400 font-semibold">You lost...</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-yellow-300 font-bold">Spectating Game</span>
                            <div className="mt-2 text-base">
                                {game.winner === null ? (
                                    <span className="text-yellow-300 font-semibold">Draw</span>
                                ) : (
                                    <>
                                        <span className="text-green-400 font-semibold">
                                            {game?.blackPlayerUsername === undefined || game?.whitePlayerUsername === undefined
                                                ? "Winner: " + (game.winner === game.blackPlayer ? "Black" : "White")
                                                : `Winner: ${game.winner === game.blackPlayer ? game.blackPlayerUsername : game.whitePlayerUsername}`}
                                        </span>
                                        <br />
                                        <span className="text-red-400 font-semibold">
                                            {game?.blackPlayerUsername === undefined || game?.whitePlayerUsername === undefined
                                                ? "Loser: " + (game.winner === game.blackPlayer ? "White" : "Black")
                                                : `Loser: ${game.winner === game.blackPlayer ? game.whitePlayerUsername : game.blackPlayerUsername}`}
                                        </span>
                                    </>
                                )}
                            </div>
                        </>
                    )
                ) : isPlayer ? (
                    isMyTurn ? (
                        <span className="text-green-400 font-bold">YOUR TURN</span>
                    ) : (
                        <span className="text-gray-400">Opponent's turn</span>
                    )
                ) : (
                    <span className="text-yellow-300 font-bold">Spectating Game</span>
                )}
                {!isConnected && (
                    <div className="text-orange-400 mt-1">Disconnected. Attempting to reconnect...</div>
                )}
                {error && <div className="text-red-400 mt-1">{error}</div>}
            </div>

            {/* Board + Side Panel */}
            <div className="flex flex-row gap-6 w-full justify-center">
                {/* Board */}
                <div className="overflow-x-auto flex justify-center">
                    <div
                        style={{
                            background: "repeating-linear-gradient(135deg, #f9e4b7, #f9e4b7 40px, #f5d399 40px, #f5d399 80px)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            borderRadius: "12px",
                            display: "inline-block",
                            padding: "8px",
                            height: boardHeight,
                        }}
                    >
                        <table className="border-collapse mx-auto">
                            <tbody>
                                {Array.from({ length: boardSize }).map((_, rowIdx) => (
                                    <tr key={rowIdx}>
                                        {getRow(rowIdx).map((cell: number, colIdx: number) => {
                                            const idx = rowIdx * boardSize + colIdx;
                                            // Only highlight last move if the game is NOT over
                                            const isLastMove = !game?.state?.isOver && idx === lastMoveIdx;
                                            return (
                                                <td
                                                    key={colIdx}
                                                    className={`
                                                    w-8 h-8 border select-none text-center align-middle
                                                    ${cell === 0 && isMyTurn && !game?.state?.isOver && isConnected ? "hover:bg-amber-700/40 cursor-pointer" : ""}
                                                    ${cell === 3 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""}
                                                    ${isLastMove ? "bg-green-400/80" : ""}
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
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Side Panel */}
                <div
                    className="flex flex-col gap-4 min-w-[180px]"
                    style={{ height: boardHeight }}
                >
                    <div className="bg-[#181818] rounded-lg shadow p-3 mb-2">
                        <div className="font-semibold text-[#60a5fa] mb-1 text-center text-sm">ELO Preview</div>
                        {isPlayer ? (
                            game?.rated ? (
                                (() => {
                                    if (game?.state?.isOver && game?.eloChanges && user) {
                                        const change = game.eloChanges[user.id] ?? 0;
                                        return (
                                            <div className="text-center text-lg">
                                                <span className={change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-yellow-300"}>
                                                    {change > 0 ? "+" : ""}{change}
                                                </span>
                                            </div>
                                        );
                                    }
                                    // Use game.eloOutcomes for preview
                                    if (user && game.eloOutcomes && game.eloOutcomes[user.id]) {
                                        const preview = game.eloOutcomes[user.id];
                                        return (
                                            <div className="flex flex-col items-center text-xs text-gray-200">
                                                <div>
                                                    <span className="font-bold text-green-400">Win:</span>{" "}
                                                    <span className={preview.win >= 0 ? "text-green-400" : "text-red-400"}>
                                                        {preview.win > 0 ? "+" : ""}{preview.win}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-red-400">Loss:</span>{" "}
                                                    <span className={preview.loss >= 0 ? "text-green-400" : "text-red-400"}>
                                                        {preview.loss > 0 ? "+" : ""}{preview.loss}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="text-gray-400 text-xs text-center">Unable to calculate</div>
                                    );
                                })()
                            ) : (
                                <div className="text-gray-400 text-xs text-center">Unrated game</div>
                            )
                        ) : (
                            <div className="text-gray-400 text-xs text-center">Spectating: ELO preview unavailable</div>
                        )}
                    </div>

                    {/* Move History */}
                    <div className="bg-[#232323] rounded-lg shadow p-0 mt-2" style={{ height: "12rem" }}>
                        <div className="font-semibold text-[#60a5fa] mb-2 text-center text-sm">Move History</div>
                        <ol
                            className="text-xs text-gray-200 overflow-y-auto pr-2 custom-scrollbar"
                            style={{
                                height: "calc(12rem - 2.5rem)", // subtract header height and padding
                                minHeight: "3rem",
                                scrollbarWidth: "thin",
                                scrollbarColor: "#60a5fa #232323"
                            }}
                        >
                            {game?.state?.moveList?.length > 0 ? (
                                // Group moves into pairs: [black, white], [black, white], ...
                                Array.from({ length: Math.ceil(game.state.moveList.length / 2) }).map((_, idx) => {
                                    const blackMove = game.state.moveList[idx * 2];
                                    const whiteMove = game.state.moveList[idx * 2 + 1];
                                    return (
                                        <li key={idx} className="mb-1 flex items-center gap-2">
                                            <span className="font-bold">{idx + 1}.</span>
                                            <span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" className="inline align-middle mr-1">
                                                    <circle cx="12" cy="12" r="10" fill="#22272b" stroke="black" strokeWidth="2" />
                                                </svg>
                                                {blackMove !== undefined ? formatMove(blackMove) : "--"}
                                            </span>
                                            <span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" className="inline align-middle mr-1">
                                                    <circle cx="12" cy="12" r="10" fill="white" stroke="#888" strokeWidth="2" />
                                                </svg>
                                                {whiteMove !== undefined ? formatMove(whiteMove) : "--"}
                                            </span>
                                        </li>
                                    );
                                })
                            ) : (
                                <li className="text-gray-400">No moves yet.</li>
                            )}
                        </ol>
                    </div>
                    <style jsx global>{`
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: #60a5fa #232323;
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                            background: #232323;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #60a5fa;
                            border-radius: 4px;
                        }
                    `}
                    </style>

                    {/* Forfeit Button */}
                    <div className="flex justify-center w-full mt-4">
                        {typeof timeLeft === "number" && (
                            <span
                                className={`mr-2 px-3 py-1 rounded font-mono text-sm border border-gray-300`}
                                style={{
                                    background: isMyTurn && isPlayer ? "#fff" : "#e5e7eb", // <-- light gray if not your turn
                                    color: timeLeft < 60_000 ? "#dc2626" : "#111",
                                    fontWeight: 600,
                                    minWidth: game?.timing === "short" ? 60 : 90,
                                    textAlign: "center",
                                    borderColor: timeLeft < 60_000 ? "#dc2626" : "#e5e7eb"
                                }}
                                title={isMyTurn ? "Your time remaining" : "Opponent's turn"}
                            >
                                {formatTime(timeLeft)}
                            </span>
                        )}
                        {isPlayer && (
                            <button
                                onClick={handleForfeit}
                                disabled={game?.state?.isOver}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors shadow disabled:opacity-60"
                                style={{ minWidth: 120 }}
                            >
                                Forfeit
                            </button>
                        )}
                    </div>
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
                    <span className="ml-2 text-yellow-400 font-bold">[Spaces: {blackScore}]</span>
                    <span className="font-semibold">
                        {game?.playerUsernames && game?.players ? (
                            <Link
                                href={`/profile/${game.players[0]}`}
                                className="text-white hover:underline"
                            >
                                {game.playerUsernames[0]}
                            </Link>
                        ) : (
                            (game?.playerUsernames && game?.playerUsernames[0]) || "Black"
                        )}
                        {user && user.id === game?.players?.[0] && " (You)"}
                        {game?.players?.[0] ? (
                            <span className="text-xs text-gray-400 ml-2">
                                [ID: {game.players[0]}]
                            </span>
                        ) : null}
                    </span>
                </div>
                <div className="nomalos-player-row">
                    <svg className="nomalos-player-piece" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="white" stroke="#888" strokeWidth="2" />
                    </svg>
                    <span className="ml-2 text-yellow-400 font-bold">[Spaces: {whiteScore}]</span>
                    <span className="font-semibold">
                        {game?.playerUsernames && game?.players ? (
                            <Link
                                href={`/profile/${game.players[1]}`}
                                className="text-white hover:underline"
                            >
                                {game.playerUsernames[1]}
                            </Link>
                        ) : (
                            (game?.playerUsernames && game?.playerUsernames[1]) || "White"
                        )}
                        {user && user.id === game?.players?.[1] && " (You)"}
                        {game?.players?.[1] ? (
                            <span className="text-xs text-gray-400 ml-2">
                                [ID: {game.players[1]}]
                            </span>
                        ) : null}
                    </span>
                </div>
            </div>
        </div>
    );
}