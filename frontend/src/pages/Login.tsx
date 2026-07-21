import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.login({ email, password });
      setAccessToken(res.accessToken);
      setUser(res.user);
      navigate("/actors");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl p-8 border border-[var(--border-primary)] backdrop-blur-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">Welcome Back</h2>
          <p className="text-[var(--text-muted)]">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 text-red-400 border border-red-500/30 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-500/20 transition-colors mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Don't have an account? <Link to="/signup" className="text-purple-400 font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
