import { useEffect, useRef, useState } from "react";
import { Toast } from "@/components/Toast";
import { getSettings, saveSettings, scanRfid } from "@/lib/api";

interface ScanResult {
  found: boolean;
  studentId?: number;
  name?: string;
  nisn?: string;
  className?: string;
  status?: string;
  statusLabel?: string;
  scanTime?: string;
  message?: string;
  alreadyScanned?: boolean;
}

interface ScanLog extends ScanResult {
  time: string;
  key: number;
}

export default function ScanPage() {
  const [buffer, setBuffer] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [log, setLog] = useState<ScanLog[]>([]);
  const [batas, setBatas] = useState("07:00");
  const [savingBatas, setSavingBatas] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" | "info" });
  const [fullscreen, setFullscreen] = useState(false);
  const [now, setNow] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const fsInputRef = useRef<HTMLInputElement>(null);
  const processing = useRef(false);

  useEffect(() => {
    getSettings()
      .then((d) => {
        if (d && d.batas_jam_masuk) setBatas(d.batas_jam_masuk);
      })
      .catch(() => {});
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    fsInputRef.current?.focus();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [fullscreen]);

  const process = async (rfid: string) => {
    if (processing.current) return;
    processing.current = true;
    try {
      const data = await scanRfid(rfid);
      setResult(data);
      setLog((prev) => [
        { ...data, time: new Date().toLocaleTimeString("id-ID"), key: Date.now() + Math.random() },
        ...prev,
      ].slice(0, 30));
    } catch {
      setToast({ show: true, message: "Gagal memproses scan", type: "error" });
    } finally {
      processing.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const rfid = buffer.trim();
      if (rfid) {
        process(rfid);
        setBuffer("");
      }
    }
  };

  const saveBatas = async () => {
    setSavingBatas(true);
    try {
      await saveSettings(batas, "");
      setToast({ show: true, message: "Batas jam masuk disimpan", type: "success" });
      const updated = await getSettings();
      if (updated && updated.batas_jam_masuk) setBatas(updated.batas_jam_masuk);
    } catch (err) {
      setToast({ show: true, message: `Gagal menyimpan: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" });
    } finally {
      setSavingBatas(false);
    }
  };

  const statusColor =
    result?.alreadyScanned
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : result?.status === "H"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : result?.status === "T"
      ? "bg-purple-50 border-purple-200 text-purple-700"
      : "bg-rose-50 border-rose-200 text-rose-700";

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Scan RFID</h2>
          <p className="text-on-surface-variant text-sm">
            Tempel kartu RFID pada reader. Siswa akan otomatis tercatat
            <strong> Masuk</strong> (sebelum batas) atau <strong>Terlambat</strong> (lewat batas).
          </p>
        </div>
        <button
          onClick={() => setFullscreen(true)}
          className="shrink-0 bg-primary text-on-primary font-semibold text-sm h-12 px-5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined">fullscreen</span>
          Layar Penuh
        </button>
      </div>

      {/* Scanner */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 md:p-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">rfid</span>
          <p className="text-sm text-on-surface-variant mb-4">Arahkan / tempel kartu RFID ke reader</p>
          <input
            ref={inputRef}
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputRef.current?.focus()}
            autoFocus
            placeholder="RFID akan terbaca otomatis..."
            className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl h-14 px-4 text-center font-mono text-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-8 rounded-2xl border p-6 ${statusColor}`}>
            {result.found ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-70">Nama Siswa</p>
                  <h3 className="text-2xl font-bold">{result.name}</h3>
                  <p className="text-sm font-mono opacity-80 mt-1">NISN: {result.nisn}</p>
                  <p className="text-sm mt-1">Kelas: {result.className}</p>
                </div>
                <div className="text-center md:text-right">
                  {result.alreadyScanned ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 font-bold text-lg">
                      <span className="material-symbols-outlined">info</span>
                      Sudah Absen
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 font-bold text-lg">
                      <span className="material-symbols-outlined">
                        {result.status === "H" ? "check_circle" : "schedule"}
                      </span>
                      {result.statusLabel}
                    </span>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {result.scanTime
                      ? new Date(result.scanTime).toLocaleTimeString("id-ID")
                      : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl">error</span>
                <p className="font-bold text-lg mt-2">RFID Belum Terdaftar</p>
                <p className="text-sm opacity-80">Daftarkan kartu melalui menu Registrasi RFID.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings: batas jam masuk */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 mt-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant">Batas Jam Masuk</label>
            <input
              type="time"
              value={batas}
              onChange={(e) => setBatas(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
          <button
            onClick={saveBatas}
            disabled={savingBatas}
            className="bg-primary text-on-primary font-semibold text-sm h-12 px-6 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined">save</span>
            {savingBatas ? "Menyimpan..." : "Simpan Batas"}
          </button>
          <p className="text-xs text-on-surface-variant sm:ml-auto max-w-xs">
            Siswa yang scan <strong>≤ batas</strong> dianggap Masuk, <strong>&gt; batas</strong> dianggap Terlambat.
          </p>
        </div>
      </div>

      {/* Session Log */}
      {log.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden mt-6 shadow-sm">
          <div className="px-5 py-3 border-b border-outline-variant font-semibold text-sm text-on-surface">
            Log Scan Sesi Ini
          </div>
          <div className="divide-y divide-outline-variant max-h-80 overflow-y-auto">
            {log.map((l) => (
              <div key={l.key} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-on-surface truncate">
                    {l.found ? l.name : "RFID tidak dikenal"}
                  </p>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {l.found ? `${l.className} • ${l.nisn}` : l.message}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {l.alreadyScanned ? (
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700">
                      Sudah Absen
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        l.status === "H"
                          ? "bg-emerald-100 text-emerald-700"
                          : l.status === "T"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {l.found ? l.statusLabel : "?"}
                    </span>
                  )}
                  <p className="text-xs text-on-surface-variant mt-1">{l.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        description=""
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />

      {/* Fullscreen display mode */}
      {fullscreen && (
        <div className="fixed inset-0 z-[300] bg-slate-900 text-white flex flex-col">
          <div className="flex items-center justify-between px-6 md:px-10 py-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-emerald-400">rfid</span>
              <div>
                <h1 className="text-lg md:text-2xl font-bold">Absensi RFID</h1>
                <p className="text-xs md:text-sm text-slate-300">
                  Tempel kartu RFID pada reader
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xl md:text-3xl font-bold tabular-nums">
                  {now.toLocaleTimeString("id-ID")}
                </p>
                <p className="text-xs md:text-sm text-slate-300 capitalize">
                  {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">fullscreen_exit</span>
                <span className="hidden md:inline text-sm font-semibold">Tutup</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 md:px-10 overflow-hidden">
            {result ? (
              <div
                className={`w-full max-w-4xl rounded-3xl p-8 md:p-14 text-center ${
                  result.alreadyScanned
                    ? "bg-amber-500/20 border-4 border-amber-400"
                    : result.status === "H"
                    ? "bg-emerald-500/20 border-4 border-emerald-400"
                    : result.status === "T"
                    ? "bg-purple-500/20 border-4 border-purple-400"
                    : "bg-rose-500/20 border-4 border-rose-400"
                }`}
              >
                {result.found ? (
                  <>
                    <p className="text-sm md:text-lg uppercase tracking-widest text-slate-200">
                      {result.alreadyScanned ? "Sudah Absen" : "Siswa"}
                    </p>
                    <h2 className="text-4xl md:text-7xl font-extrabold mt-3 leading-tight">
                      {result.name}
                    </h2>
                    <p className="text-lg md:text-2xl text-slate-200 mt-4 font-mono">
                      NISN: {result.nisn}
                    </p>
                    <p className="text-lg md:text-2xl text-slate-200 mt-1">
                      Kelas: {result.className}
                    </p>
                    <div className="mt-8 flex justify-center">
                      {result.alreadyScanned ? (
                        <span className="inline-flex items-center gap-3 px-6 md:px-10 py-3 md:py-4 rounded-2xl bg-white/20 text-xl md:text-3xl font-bold">
                          <span className="material-symbols-outlined text-3xl md:text-5xl">info</span>
                          Sudah Absen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-3 px-6 md:px-10 py-3 md:py-4 rounded-2xl bg-white/20 text-xl md:text-3xl font-bold">
                          <span className="material-symbols-outlined text-3xl md:text-5xl">
                            {result.status === "H" ? "check_circle" : "schedule"}
                          </span>
                          {result.statusLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm md:text-lg text-slate-300 mt-5">
                      {result.scanTime
                        ? new Date(result.scanTime).toLocaleTimeString("id-ID")
                        : ""}
                    </p>
                  </>
                ) : (
                  <div>
                    <span className="material-symbols-outlined text-6xl md:text-9xl">error</span>
                    <p className="text-2xl md:text-4xl font-bold mt-4">RFID Belum Terdaftar</p>
                    <p className="text-base md:text-xl text-slate-300 mt-2">
                      Daftarkan kartu melalui menu Registrasi RFID.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <span className="material-symbols-outlined text-8xl md:text-[12rem] text-emerald-400 animate-pulse">
                  contactless
                </span>
                <p className="text-2xl md:text-4xl font-bold mt-6">Siap Scan</p>
                <p className="text-base md:text-xl text-slate-300 mt-2">
                  Tempelkan kartu RFID untuk mencatat kehadiran
                </p>
              </div>
            )}
          </div>

          {/* Recent activity */}
          {log.length > 0 && (
            <div className="px-6 md:px-10 pb-6">
              <p className="text-xs md:text-sm text-slate-300 mb-2 font-semibold">
                Aktivitas Terbaru
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {log.slice(0, 8).map((l) => (
                  <div
                    key={l.key}
                    className={`shrink-0 rounded-xl px-4 py-3 text-sm min-w-[140px] ${
                      l.alreadyScanned
                        ? "bg-amber-500/20"
                        : l.status === "H"
                        ? "bg-emerald-500/20"
                        : l.status === "T"
                        ? "bg-purple-500/20"
                        : "bg-rose-500/20"
                    }`}
                  >
                    <p className="font-bold truncate">{l.found ? l.name : "Tidak dikenal"}</p>
                    <p className="text-xs text-slate-300">{l.time}</p>
                    <p className="text-xs mt-1 font-semibold">
                      {l.alreadyScanned ? "Sudah Absen" : l.found ? l.statusLabel : "?"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden input to capture RFID while in fullscreen */}
          <input
            ref={fsInputRef}
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 w-0 h-0"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
