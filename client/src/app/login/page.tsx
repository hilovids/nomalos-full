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
        document.title = "Login | Nomalos";
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-[#181818] rounded-lg shadow-lg p-8 flex flex-col items-center max-w-md w-full">
                    <button
                        className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 mt-4 font-semibold transition-colors"
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            setUser(null);
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-[#181818] rounded-lg shadow-lg p-8 flex flex-col items-center max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-[#60a5fa]">Login / Register</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
                    <input
                        className="border border-[#333] bg-[#232323] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#60a5fa] transition"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <input
                        className="border border-[#333] bg-[#232323] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#60a5fa] transition"
                        placeholder="Password (Optional)"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-semibold transition-colors"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login / Register"}
                    </button>
                    {error && <div className="text-red-400 text-center">{error}</div>}
                </form>
            </div>
            <div className="bg-[#181818] rounded-lg shadow p-4 mt-4 max-w-md w-full text-gray-300 text-sm text-center">
                Only a username is required to play Nomalos, meaning you can log in to an account provided you have the username. However if you want to secure your account, you can set a password by logging in with a password.
                <br /><br />
                <span className="text-red-400 font-semibold">Warning:</span> There is currently no way to recover lost passwords.
            </div>
        </div>
    );
}