'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/api/user/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            window.location.href = "/";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (user) {
        return (
            <div className="max-w-xs mx-auto mt-20 text-center">
                <h2 className="text-xl mb-4">Welcome, {user.username}!</h2>
                <div className="mb-2">Wins: {user.combinedStats?.gamesWon ?? 0}</div>
                <div className="mb-2">Losses: {user.combinedStats?.gamesLost ?? 0}</div>
                <div className="mb-2">Draws: {user.combinedStats?.gamesDrawn ?? 0}</div>
                <button
                    className="bg-red-600 text-white rounded p-2 mt-4"
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setUser(null);
                    }}
                >
                    Log out
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleLogin} className="flex flex-col gap-4 max-w-xs mx-auto mt-20">
            <input
                className="border p-2 rounded"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
            <input
                className="border p-2 rounded"
                placeholder="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <button className="bg-blue-600 text-white rounded p-2" disabled={loading}>
                {loading ? "Logging in..." : "Login / Register"}
            </button>
            {error && <div className="text-red-600">{error}</div>}
        </form>
    );
}