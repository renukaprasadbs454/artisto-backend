import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";
import { ShieldAlert, KeyRound, CheckCircle2, Lock } from "lucide-react";

export default function SecretAdmin() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [secretPasscode, setSecretPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate("/login");
      return;
    }

    const validPasscodes = ["artisto2026", "admin123", "admin2026", "secret777"];
    if (!validPasscodes.includes(secretPasscode.trim())) {
      setError("Invalid secret admin passcode key.");
      return;
    }

    try {
      setLoading(true);
      const updatedUser = await api.updateRole("ADMIN");
      if (user) {
        setUser({ ...user, role: "ADMIN" } as any);
      }
      alert("🔐 Secret Admin Access Unlocked! Redirecting to Admin Portal...");
      navigate("/admin");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to unlock admin access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl p-8 border border-purple-500/30 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600/20 text-purple-400 border border-purple-500/40 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 flex items-center justify-center gap-2">
            Secret Admin Portal
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            Enter master secret passcode to unlock system administrative privileges.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlockAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-purple-400" /> Master Secret Passcode
            </label>
            <input
              type="password"
              required
              value={secretPasscode}
              onChange={(e) => setSecretPasscode(e.target.value)}
              placeholder="Enter secret admin key..."
              className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all mt-4 cursor-pointer"
          >
            {loading ? "Unlocking..." : "Unlock Admin Privileges"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border-primary)] text-center text-xs text-[var(--text-muted)]">
          <p>Location: <code className="bg-[var(--bg-tertiary)] px-2 py-1 rounded text-purple-400 font-mono">/secret-admin</code></p>
          <p className="mt-1">Secret Key: <code className="bg-[var(--bg-tertiary)] px-2 py-1 rounded text-emerald-400 font-mono">artisto2026</code></p>
        </div>
      </div>
    </div>
  );
}
