import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { login } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo("");

    try {
      setDebugInfo("Mencoba login...");
      const result = await login(identifier, password);

      if (result.error) {
        setError(result.error);
        setDebugInfo(`Error: ${result.error}`);
        setLoading(false);
        return;
      }

      setDebugInfo("Login berhasil! Mengarahkan...");
      navigate("/", { replace: true });
    } catch (err) {
      setError("Terjadi kesalahan tidak terduga");
      setDebugInfo(`Exception: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleLogin} className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img
              src="https://res.cloudinary.com/ds7peyxlk/image/upload/v1773720510/skatim_d5mjir.png"
              alt="SMK Negeri Rawajitu Timur"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">SMK Negeri Rawajitu Timur</h1>
          <p className="text-sm text-on-surface-variant mt-1">Masuk untuk mengelola absensi</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {debugInfo && !error && (
          <div className="bg-info-container text-on-info-container px-4 py-3 rounded-xl mb-4 text-sm">
            {debugInfo}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Email atau Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@edulearn.com / admin01"
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-semibold text-sm h-12 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 active:scale-95 shadow-md"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </div>

        <p className="text-xs text-on-surface-variant text-center mt-6">
          Akses ditentukan oleh Supabase Auth.
          <br />
          Buat user baru di panel Supabase jika diperlukan.
        </p>
        <p className="text-xs text-on-surface-variant text-center mt-4">
          Built with ❤️ by JulyJono using Vibe Coding
        </p>
      </form>
    </div>
  );
}
