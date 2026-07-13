import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats, getClasses, getClassTodayStats, getClassBreakdownToday } from "@/lib/api";

interface Stats {
  totalClasses: number;
  totalStudents: number;
  today: Record<string, number>;
  recentAttendance: Array<{
    date: string;
    className: string;
    status: string;
    studentName: string;
  }>;
}

const statusLabels: Record<string, string> = {
  H: "Hadir",
  A: "Alpa",
  I: "Izin",
  S: "Sakit",
  T: "Terlambat",
};

const statusColors: Record<string, string> = {
  H: "bg-emerald-100 text-emerald-700",
  A: "bg-rose-100 text-rose-700",
  I: "bg-amber-100 text-amber-700",
  S: "bg-sky-100 text-sky-700",
  T: "bg-purple-100 text-purple-700",
};

interface ClassOption {
  id: number;
  name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classStats, setClassStats] = useState<Record<string, number> | null>(null);
  const [classStatsLoading, setClassStatsLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<
    Array<{ classId: number; className: string; A: number; I: number; S: number; T: number }>
  >([]);

  useEffect(() => {
    getStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    getClasses()
      .then((data) => setClasses(data))
      .catch(() => setClasses([]));
    getClassBreakdownToday()
      .then((data) =>
        setBreakdown(
          data
            .map((c) => ({
              classId: c.classId,
              className: c.className,
              A: c.A,
              I: c.I,
              S: c.S,
              T: c.T,
            }))
            .filter((c) => c.A + c.I + c.S + c.T > 0)
            .sort((a, b) => b.A + b.I + b.S + b.T - (a.A + a.I + a.S + a.T))
        )
      )
      .catch(() => setBreakdown([]));
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setClassStats(null);
      return;
    }
    setClassStatsLoading(true);
    getClassTodayStats(selectedClassId)
      .then((data) => setClassStats(data))
      .catch(() => setClassStats({ H: 0, A: 0, I: 0, S: 0, T: 0 }))
      .finally(() => setClassStatsLoading(false));
  }, [selectedClassId]);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const activeToday =
    selectedClassId && classStats ? classStats : stats?.today || {};

  const statusValues = ["H", "A", "I", "S", "T"].map((key) => ({
    key,
    label: statusLabels[key],
    value: activeToday[key] || 0,
    color:
      key === "H"
        ? "#10b981"
        : key === "A"
        ? "#f43f5e"
        : key === "I"
        ? "#f59e0b"
        : key === "S"
        ? "#0ea5e9"
        : "#a855f7",
  }));
  const statusTotal = statusValues.reduce((sum, s) => sum + s.value, 0);

  const RADIUS = 60;
  const CIRC = 2 * Math.PI * RADIUS;
  let offsetAccum = 0;
  const donutSegments = statusValues.map((s) => {
    const fraction = statusTotal > 0 ? s.value / statusTotal : 0;
    const len = fraction * CIRC;
    const seg = {
      ...s,
      dash: `${len} ${CIRC - len}`,
      offset: -offsetAccum,
    };
    offsetAccum += len;
    return seg;
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Dashboard</h2>
        <p className="text-on-surface-variant text-sm">{today}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">school</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">{stats?.totalClasses || 0}</p>
              <p className="text-xs text-on-surface-variant">Total Kelas</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">groups</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">{stats?.totalStudents || 0}</p>
              <p className="text-xs text-on-surface-variant">Total Siswa</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">{(stats?.today?.H || 0) + (stats?.today?.T || 0)}</p>
              <p className="text-xs text-on-surface-variant">Hadir Hari Ini</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-600">cancel</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">
                {(stats?.today?.A || 0) + (stats?.today?.I || 0) + (stats?.today?.S || 0)}
              </p>
              <p className="text-xs text-on-surface-variant">Tidak Hadir Hari Ini</p>
            </div>
          </div>

          {/* Today Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">bar_chart</span>
                  Status Kehadiran Hari Ini
                </h3>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-xl h-10 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Semua Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {classStatsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-7 h-7 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative shrink-0">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r={RADIUS}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="18"
                    />
                    {donutSegments.map((s) =>
                      s.value > 0 ? (
                        <circle
                          key={s.key}
                          cx="80"
                          cy="80"
                          r={RADIUS}
                          fill="none"
                          stroke={s.color}
                          strokeWidth="18"
                          strokeDasharray={s.dash}
                          strokeDashoffset={s.offset}
                          strokeLinecap="butt"
                        />
                      ) : null
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-on-surface">{statusTotal}</span>
                    <span className="text-xs text-on-surface-variant">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full">
                  {donutSegments.map((s) => {
                    const pct = statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0;
                    return (
                      <div key={s.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-sm text-on-surface">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">{s.value}</span>
                          <span className="text-xs text-on-surface-variant w-9 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                Aksi Cepat
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  to="/attendance"
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-emerald-600">edit_note</span>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Entri Absensi</p>
                    <p className="text-xs text-on-surface-variant">Isi absensi siswa hari ini</p>
                  </div>
                </Link>
                <Link
                  to="/classes"
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Tambah Kelas</p>
                    <p className="text-xs text-on-surface-variant">Buat kelas baru</p>
                  </div>
                </Link>
                <Link
                  to="/students"
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-secondary">person_add</span>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Tambah / Import Siswa</p>
                    <p className="text-xs text-on-surface-variant">Tambah siswa satu per satu atau import CSV</p>
                  </div>
                </Link>
                <Link
                  to="/reports"
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-amber-600">assessment</span>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Lihat Laporan</p>
                    <p className="text-xs text-on-surface-variant">Laporan absensi dan kirim ke WA</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Per-Class Non-Attendance Chart */}
          {breakdown.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm mb-8">
              <h3 className="font-bold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">leaderboard</span>
                Kelas dengan Ketidakhadiran Tertinggi
              </h3>
              <p className="text-xs text-on-surface-variant mb-5">
                Rekap Alpa, Izin, Sakit, dan Terlambat per kelas hari ini.
              </p>
              <div className="space-y-4">
                {breakdown.map((c, i) => {
                  const total = c.A + c.I + c.S + c.T;
                  const maxTotal = breakdown[0].A + breakdown[0].I + breakdown[0].S + breakdown[0].T;
                  const scale = maxTotal > 0 ? total / maxTotal : 0;
                  const segments = [
                    { key: "A", value: c.A, color: "#f43f5e" },
                    { key: "I", value: c.I, color: "#f59e0b" },
                    { key: "S", value: c.S, color: "#0ea5e9" },
                    { key: "T", value: c.T, color: "#a855f7" },
                  ];
                  return (
                    <div key={c.classId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="material-symbols-outlined text-amber-500 text-base" title="Tertinggi">
                              emoji_events
                            </span>
                          )}
                          <span className="text-sm font-medium text-on-surface">{c.className}</span>
                        </div>
                        <span className="text-sm font-bold text-on-surface">{total}</span>
                      </div>
                      <div className="w-full h-4 rounded-full bg-surface-container-high overflow-hidden flex">
                        {segments.map((s) =>
                          s.value > 0 ? (
                            <div
                              key={s.key}
                              className="h-full transition-all"
                              style={{
                                width: `${(s.value / total) * scale * 100}%`,
                                backgroundColor: s.color,
                              }}
                              title={`${statusLabels[s.key]}: ${s.value}`}
                            />
                          ) : null
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-outline-variant/50">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-[#f43f5e]" />
                  <span>Alpa</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-[#f59e0b]" />
                  <span>Izin</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-[#0ea5e9]" />
                  <span>Sakit</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-[#a855f7]" />
                  <span>Terlambat</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {stats?.recentAttendance && stats.recentAttendance.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Aktivitas Terbaru
              </h3>
              <div className="space-y-3">
                {stats.recentAttendance.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${statusColors[r.status]}`}>
                        {r.status}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{r.studentName}</p>
                        <p className="text-xs text-on-surface-variant">{r.className}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">
                        {new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                      <span className={`text-xs font-medium ${statusColors[r.status]} px-2 py-0.5 rounded`}>
                        {statusLabels[r.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
