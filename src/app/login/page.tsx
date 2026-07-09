"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.push("/");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo("");

    try {
      console.log("[Login] Attempt login with:", identifier);
      setDebugInfo("Mencoba login...");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const result = await res.json();
      console.log("[Login] API response:", result);

      if (!res.ok || result.error) {
        console.error("[Login] Error:", result.error);
        setError(result.error || "Login gagal");
        setDebugInfo(`Error: ${result.error || "Login gagal"}`);
        setLoading(false);
        return;
      }

      console.log("[Login] Success");
      setDebugInfo("Login berhasil! Mengarahkan...");
      window.location.href = "/";
    } catch (err) {
      console.error("[Login] Exception:", err);
      setError("Terjadi kesalahan tidak terduga");
      setDebugInfo(`Exception: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleLogin} className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">EduAttend</h1>
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