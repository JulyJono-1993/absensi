import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "@/lib/api";

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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
              <p className="text-2xl font-bold text-on-surface">{stats?.today?.H || 0}</p>
              <p className="text-xs text-on-surface-variant">Hadir Hari Ini</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-600">cancel</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">
                {(stats?.today?.A || 0) + (stats?.today?.I || 0) + (stats?.today?.S || 0) + (stats?.today?.T || 0)}
              </p>
              <p className="text-xs text-on-surface-variant">Tidak Hadir Hari Ini</p>
            </div>
          </div>

          {/* Today Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bar_chart</span>
                Status Kehadiran Hari Ini
              </h3>
              <div className="space-y-3">
                {["H", "A", "I", "S", "T"].map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColors[key]}`}>
                        {key}
                      </span>
                      <span className="text-sm text-on-surface">{statusLabels[key]}</span>
                    </div>
                    <span className="font-bold text-on-surface">{stats?.today?.[key] || 0}</span>
                  </div>
                ))}
              </div>
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
