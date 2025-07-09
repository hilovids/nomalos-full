'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import Link from "next/link";
import { FaCheck, FaClock, FaFlag, FaUserMinus, FaUserPlus, FaVolumeMute, FaVolumeUp } from "react-icons/fa";

function PlayerBanner({
    game, user, isMyTurn, timeLeft, formatTime, blackScore, whiteScore
}: {
    game: any; user: any; isMyTurn: boolean; timeLeft: number | null; formatTime: (ms: number) => string;
    blackScore: number; whiteScore: number;
}) {
    if (!game) return null;
    const blackId = game.players?.[0];
    const whiteId = game.players?.[1];
    const blackName = game.playerUsernames?.[0] || "Black";
    const whiteName = game.playerUsernames?.[1] || "White";
    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto mt-4 mb-3 px-4">
            <div className="bg-[#181818] rounded-lg shadow px-3 py-2 w-full flex flex-col items-center">
                {/* Names row */}
                <div className="relative flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="#22272b" stroke="black" strokeWidth="2" />
                        </svg>
                        <Link href={`/profile/${blackId}`} className="font-semibold text-white hover:underline truncate max-w-[6rem]">{blackName}</Link>
                        {/* "You" badge for black, right before the center line */}
                        {user && user.id === blackId && (
                            <span className="ml-1 mr-2 text-xs bg-green-700 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                                You
                            </span>
                        )}
                    </div>
                    {/* Centered vertical line */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-px h-6 bg-gray-500 opacity-60 mx-2" />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* "You" badge for white, just after the center line */}
                        {user && user.id === whiteId && (
                            <span className="mr-1 ml-2 text-xs bg-green-700 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                                You
                            </span>
                        )}
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="white" stroke="#888" strokeWidth="2" />
                        </svg>
                        <Link href={`/profile/${whiteId}`} className="font-semibold text-white hover:underline truncate max-w-[6rem]">{whiteName}</Link>
                    </div>
                </div>
                {/* Scores and timer row */}
                <div className="flex items-center justify-between w-full px-6 mt-2 text-yellow-400 font-semibold text-sm">
                    <span>Black: {blackScore}</span>
                    {typeof timeLeft === "number" && !game?.state?.isOver && (
                        <span className="px-3 py-1 rounded font-mono text-sm bg-white text-black font-bold border border-yellow-400 mx-2">
                            {formatTime(timeLeft)}
                        </span>
                    )}
                    <span>White: {whiteScore}</span>
                </div>
            </div>
        </div>
    );
}

function BoardWithHeaders({ boardSize, spaces, handleCellClick, isMyTurn, game, lastMoveIdx, isConnected }: any) {
    // Column headers: A, B, C, ...
    const colHeaders = Array.from({ length: boardSize }, (_, i) => String.fromCharCode(65 + i));
    // Responsive cell size: 25px on mobile, 40px on desktop
    const cellSize = typeof window !== "undefined" && window.innerWidth < 640 ? 25 : 40;

    return (
        <div className="relative flex flex-col items-center">
            {/* Column headers */}
            <div className="flex ml-[8vw] sm:ml-[26px]">
                <div className="w-0 h-0" /> {/* empty corner */}
                {colHeaders.map((c, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-center text-xs text-gray-400 select-none"
                        style={{
                            width: cellSize,
                            minWidth: cellSize,
                            maxWidth: cellSize,
                            height: 24,
                        }}
                    >
                        {c}
                    </div>
                ))}
            </div>
            <div className="flex">
                {/* Row headers */}
                <div className="flex flex-col">
                    {Array.from({ length: boardSize }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-center text-xs text-gray-400 select-none"
                            style={{
                                height: cellSize,
                                minHeight: cellSize + 1,
                                maxHeight: cellSize + 1,
                                width: 24,
                            }}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
                {/* Board */}
                <div
                    className=""
                    style={{
                        background: "repeating-linear-gradient(135deg, #f9e4b7, #f9e4b7 37.5px, #f5d399 37.5px, #f5d399 75px)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        borderRadius: "12px",
                        display: "inline-block",
                        padding: "8px",
                        maxWidth: "100%",
                        backgroundPosition: "center center"
                    }}
                >
                    <table className="border-collapse mx-auto" style={{ tableLayout: "fixed" }}>
                        <tbody>
                            {Array.from({ length: boardSize }).map((_, rowIdx) => (
                                <tr key={rowIdx}>
                                    {Array.from({ length: boardSize }).map((_, colIdx) => {
                                        const idx = rowIdx * boardSize + colIdx;
                                        const cell = spaces[idx];
                                        const isLastMove = !game?.state?.isOver && idx === lastMoveIdx;
                                        return (
                                            <td
                                                key={colIdx}
                                                className={`
                                                    border select-none text-center align-middle
                                                    ${cell === 0 && isMyTurn && !game?.state?.isOver && isConnected ? "hover:bg-amber-700/40 cursor-pointer" : ""}
                                                    ${cell === 3 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""}
                                                    ${isLastMove ? "bg-green-400/80" : ""}
                                                `}
                                                style={{
                                                    width: cellSize,
                                                    minWidth: cellSize,
                                                    maxWidth: cellSize,
                                                    height: cellSize,
                                                    minHeight: cellSize,
                                                    maxHeight: cellSize,
                                                    padding: 0,
                                                    verticalAlign: "middle",
                                                    borderColor: "#633f2559"
                                                }}
                                                onClick={() => cell === 0 ? handleCellClick(rowIdx, colIdx) : undefined}
                                            >
                                                {cell === 1 ? (
                                                    <svg width={cellSize - 4} height={cellSize - 4} viewBox="0 0 24 24" style={{ display: "inline-block" }}>
                                                        <circle cx="12" cy="12" r="10" fill="#22272b" stroke="black" strokeWidth="2" />
                                                    </svg>
                                                ) : cell === 2 ? (
                                                    <svg width={cellSize - 4} height={cellSize - 4} viewBox="0 0 24 24" style={{ display: "inline-block" }}>
                                                        <circle cx="12" cy="12" r="10" fill="white" stroke="#888" strokeWidth="2" />
                                                    </svg>
                                                ) : cell === 3 ? (
                                                    <span style={{ fontSize: cellSize * 0.7, fontWeight: "bold" }}>✕</span>
                                                ) : (
                                                    // Invisible SVG to keep cell size
                                                    <svg width={cellSize - 4} height={cellSize - 4} viewBox="0 0 24 24" style={{ visibility: "hidden", display: "inline-block" }}>
                                                        <circle cx="12" cy="12" r="10" />
                                                    </svg>
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
        </div>
    );
}

function EloPreview({ game, user }: { game: any; user: any }) {
    if (!game) return null;
    return (
        <div className="bg-[#181818] rounded-lg shadow p-3 mb-2 max-w-xs w-full mx-auto">
            <div className="font-semibold text-yellow-400 mb-1 text-center text-sm">ELO Preview</div>
            {user && (user.id === game.blackPlayer || user.id === game.whitePlayer) ? (
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
    );
}

function MoveHistory({ game, formatMove }: { game: any; formatMove: (move: any) => string }) {
    return (
        <div className="bg-[#181818] rounded-lg shadow p-2 max-w-xs mx-auto" style={{ height: "12rem" }}>
            <div className="font-semibold text-yellow-400 mb-2 text-center text-sm">Move History</div>
            <ol
                className="text-xs text-gray-200 overflow-y-auto pr-2 custom-scrollbar"
                style={{
                    height: "calc(12rem - 2.5rem)",
                    minHeight: "3rem",
                    scrollbarWidth: "thin",
                    scrollbarColor: "#fdca33 #232323"
                }}
            >
                {game?.state?.moveList?.length > 0 ? (
                    Array.from({ length: Math.ceil(game.state.moveList.length / 2) }).map((_, idx) => {
                        const blackMove = game.state.moveList[idx * 2];
                        const whiteMove = game.state.moveList[idx * 2 + 1];
                        return (
                            <li key={idx} className="mb-1 flex items-center justify-center gap-2">
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
            <style jsx global>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #fdca33 #232323;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    background: #232323;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #fdca33;
                    border-radius: 4px;
                }
            `}
            </style>
        </div>
    );
}

function AddFriendButton({
    profileId,
    loggedInUserId,
    token,
    isFriend,
    pendingRequest,
    incomingRequest,
    onAdd,
    onRemove,
    onCancel,
    onAccept,
    disabled,
}: {
    profileId: string;
    loggedInUserId: string | null;
    token: string | null;
    isFriend: boolean;
    pendingRequest: boolean;
    incomingRequest: boolean;
    onAdd: () => void;
    onRemove: () => void;
    onCancel: () => void;
    onAccept: () => void;
    disabled?: boolean;
}) {
    const [hover, setHover] = useState(false);

    if (!loggedInUserId || loggedInUserId === profileId) return null;

    if (isFriend) {
        return (
            <button
                className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow flex items-center justify-center"
                title="Remove Friend"
                aria-label="Remove Friend"
                onClick={onRemove}
                disabled={disabled}
                style={{ width: 36, height: 36 }}
            >
                <FaUserMinus className="w-5 h-5" />
            </button>
        );
    }

    if (pendingRequest) {
        return (
            <button
                className="p-2 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white shadow flex items-center justify-center"
                title={hover ? "Cancel Friend Request" : "Pending Friend Request"}
                aria-label="Cancel Friend Request"
                onClick={onCancel}
                disabled={disabled}
                style={{ width: 36, height: 36 }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {hover ? <FaUserMinus className="w-5 h-5" /> : <FaClock className="w-5 h-5" />}
            </button>
        );
    }

    if (incomingRequest) {
        return (
            <button
                className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white shadow flex items-center justify-center"
                title="Accept Friend Request"
                aria-label="Accept Friend Request"
                onClick={onAccept}
                disabled={disabled}
                style={{ width: 36, height: 36 }}
            >
                <FaCheck className="w-5 h-5" />
            </button>
        );
    }

    // Default: Add Friend
    return (
        <button
            className="p-2 rounded-full bg-[#3fae49] hover:bg-[#2e8c36] text-white shadow flex items-center justify-center"
            title="Add Friend"
            aria-label="Add Friend"
            onClick={onAdd}
            disabled={disabled}
            style={{ width: 36, height: 36 }}
        >
            <FaUserPlus className="w-5 h-5" />
        </button>
    );
}

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
    const [screenIsMobile, setScreenIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < 640 : false
    );
    const [isFriend, setIsFriend] = useState(false);
    const [friendLoading, setFriendLoading] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(false);
    const [incomingRequest, setIncomingRequest] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

    const [soundOn, setSoundOn] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("soundOn");
            return stored === null ? true : stored === "true";
        }
        return true;
    });

    useEffect(() => {
        setToken(localStorage.getItem("token"));
        let loggedInId = "";
        try {
            const userObj = JSON.parse(localStorage.getItem("user") || "{}");
            if (userObj && userObj.id) {
                loggedInId = userObj.id;
            }
        } catch { }
        setLoggedInUserId(loggedInId);
    }, []);

    const startCooldown = () => {
        setCooldown(true);
        setTimeout(() => setCooldown(false), 1500);
    };

    const refreshFriendStatus = useCallback(() => {
        if (!game || !loggedInUserId || !token) return;
        const opponentId = game.players?.find((id: string) => id !== loggedInUserId);
        if (!opponentId) return;

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/list`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const friends = data.friends || [];
                setIsFriend(friends.some((f: any) => String(f._id) === String(opponentId)));
            });

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/requests`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const outgoing = data.outgoing || [];
                const incoming = data.incoming || [];
                setPendingRequest(outgoing.some((req: any) => String(req.recipient) === String(opponentId)));
                setIncomingRequest(incoming.some((req: any) => String(req.requester) === String(opponentId)));
            });
    }, [game, loggedInUserId, token]);

    useEffect(() => {
        refreshFriendStatus();
    }, [refreshFriendStatus]);

    const handleAddFriend = async () => {
        if (!token || friendLoading || cooldown || !game) return;
        const opponentId = game.players?.find((id: string) => id !== loggedInUserId);
        if (!opponentId) return;
        setFriendLoading(true);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                recipient: opponentId,
            }),
        });
        setFriendLoading(false);
        startCooldown();
        refreshFriendStatus();
    };

    const handleCancelRequest = async () => {
        if (!token || friendLoading || cooldown || !game) return;
        const opponentId = game.players?.find((id: string) => id !== loggedInUserId);
        if (!opponentId) return;
        setFriendLoading(true);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/cancel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                recipient: opponentId,
            }),
        });
        setFriendLoading(false);
        startCooldown();
        refreshFriendStatus();
    };

    const handleAcceptRequest = async () => {
        if (!token || !game) return;
        const opponentId = game.players?.find((id: string) => id !== loggedInUserId);
        if (!opponentId) return;
        setFriendLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/requests`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const incoming = data.incoming || [];
        const request = incoming.find((req: any) => req.requester === opponentId);
        if (request) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/accept`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    requestId: request._id,
                }),
            });
        }
        setFriendLoading(false);
        refreshFriendStatus();
    };

    const handleRemoveFriend = async () => {
        if (!token || !loggedInUserId || !game) return;
        const opponentId = game.players?.find((id: string) => id !== loggedInUserId);
        if (!opponentId) return;
        setFriendLoading(true);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/remove`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: loggedInUserId, friendId: opponentId }),
        });
        setFriendLoading(false);
        refreshFriendStatus();
    };

    useEffect(() => {
        function handleResize() {
            setScreenIsMobile(window.innerWidth < 640);
        }
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
        <div className="min-h-screen bg-[#232323] flex flex-col items-center">
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
                    <div className="text-2xl font-bold text-yellow-400 mb-2">Game Over</div>
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
                    {/* Final Score */}
                    <div className="text-gray-200 text-base font-semibold mb-4">
                        Final Score: <span className="text-yellow-400">Black {blackScore}</span> - <span className="text-yellow-400">White {whiteScore}</span>
                    </div>
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

            {/* Player Banner */}
            <PlayerBanner
                game={game}
                user={user}
                isMyTurn={isMyTurn}
                timeLeft={timeLeft}
                formatTime={formatTime}
                blackScore={blackScore}
                whiteScore={whiteScore}
            />

            {/* Board with headers */}
            <div className="w-full flex justify-center mb-2">
                <div className="max-w-[98vw] sm:max-w-[600px] w-full px-2">
                    <BoardWithHeaders
                        boardSize={boardSize}
                        spaces={spaces}
                        handleCellClick={handleCellClick}
                        isMyTurn={isMyTurn}
                        game={game}
                        lastMoveIdx={lastMoveIdx}
                        isConnected={isConnected}
                    />
                </div>
            </div>

            <div className="flex flex-row flex-wrap gap-4 max-w-2xl justify-center mt-2 mb-20">
                {/* Left column: ELO + Actions */}
                <div className="flex flex-col items-center gap-3 max-w-xs min-w-[180px]">
                    <EloPreview game={game} user={user} />
                    {isPlayer && !game?.state?.isOver && (
                        <button
                            onClick={handleForfeit}
                            disabled={game?.state?.isOver}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors shadow disabled:opacity-60 w-full"
                        >
                            Forfeit
                        </button>
                    )}

                    <div className="flex flex-row gap-2 justify-center w-auto">
                        <button
                            aria-label="Toggle sound"
                            onClick={toggleSound}
                            className={`p-2 rounded-full ${soundOn ? "bg-blue-400 hover:bg-blue-500" : "bg-blue-300 hover:bg-blue-400"} text-white shadow flex items-center justify-center transition`}
                            title={soundOn ? "Mute sounds" : "Enable sounds"}
                            style={{ width: 36, height: 36 }}
                        >
                            {soundOn ? (
                                <FaVolumeUp className="w-5 h-5" />
                            ) : (
                                <span className="relative inline-block w-5 h-5">
                                    <FaVolumeUp className="w-5 h-5" />
                                    {/* Red slash overlay */}
                                    <svg
                                        className="absolute left-0 top-0 w-5 h-5 pointer-events-none"
                                        viewBox="0 0 20 20"
                                        style={{ opacity: soundOn ? 0 : 1 }}
                                    >
                                        <line
                                            x1="17"
                                            y1="17"
                                            x2="3"
                                            y2="3"
                                            stroke="red"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>)}
                        </button>
                        {isPlayer && (<>
                            <AddFriendButton
                                profileId={game?.players?.find((id: string) => id !== loggedInUserId) || ""}
                                loggedInUserId={loggedInUserId}
                                token={token}
                                isFriend={isFriend}
                                pendingRequest={pendingRequest}
                                incomingRequest={incomingRequest}
                                onAdd={handleAddFriend}
                                onRemove={handleRemoveFriend}
                                onCancel={handleCancelRequest}
                                onAccept={handleAcceptRequest}
                                disabled={friendLoading || cooldown}
                            />
                            <button
                                aria-label="Report player"
                                className="p-2 rounded-full bg-red-500 hover:bg-red-700 text-white shadow flex items-center justify-center"
                                title="Report Player"
                                style={{ width: 36, height: 36 }}
                            >
                                <FaFlag className="w-5 h-5" />
                            </button>
                        </>
                        )}
                    </div>
                </div>
                {/* Middle column: Move History */}
                <div className="max-w-xs min-w-[240px]">
                    <MoveHistory game={game} formatMove={formatMove} />
                </div>
            </div>

            {/* Error/Status */}
            <div className="w-full max-w-xs mx-auto mt-2 text-center">
                {!isConnected && (
                    <div className="text-orange-400 mt-1">Disconnected. Attempting to reconnect...</div>
                )}
                {error && <div className="text-red-400 mt-1">{error}</div>}
            </div>
        </div>
    );
}