import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function Signup() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        username,
        email,
        password,
        displayName: fullName,
        role: "BUYER"
      });

      setAccessToken(res.accessToken);
      setUser(res.user);
      navigate("/actors");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl p-8 border border-[var(--border-primary)] backdrop-blur-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">Join Artisto</h2>
          <p className="text-[var(--text-muted)]">Create an account to start creating and hiring</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 text-red-400 border border-red-500/30 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="e.g. john-doe"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 chars"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Confirm</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-500/20 transition-colors mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account? <Link to="/login" className="text-purple-400 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
