"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast } from "@/components/Toast";

interface ClassItem {
  id: number;
  name: string;
}

interface DailyData {
  type: "daily";
  date: string;
  students: { name: string; nisn: string; status: string }[];
}

interface WeeklyData {
  type: "weekly";
  startDate: string;
  endDate: string;
  days: string[];
  students: { name: string; nisn: string; statuses: string[] }[];
}

interface MonthlyData {
  type: "monthly";
  month: string;
  daysInMonth: number;
  statusKeys: string[];
  statusLabels: Record<string, string>;
  students: { name: string; nisn: string; summary: Record<string, number>; percentage: number }[];
}

type PrintData = DailyData | WeeklyData | MonthlyData | null;

const statusStyle: Record<string, string> = {
  H: "bg-emerald-50 text-emerald-700 border-emerald-200",
  A: "bg-rose-50 text-rose-700 border-rose-200",
  I: "bg-amber-50 text-amber-700 border-amber-200",
  S: "bg-sky-50 text-sky-700 border-sky-200",
  T: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function PrintPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<PrintData>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", description: "", type: "success" as "success" | "error" | "info" });

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data);
    if (data.length > 0 && !selectedClassId) {
      setSelectedClassId(data[0].id.toString());
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchReport = async () => {
    if (!selectedClassId) return;
    setLoading(true);

    const params = new URLSearchParams({
      classId: selectedClassId,
      period,
    });
    if (period === "daily" || period === "weekly") {
      params.set("date", date);
    } else {
      params.set("month", month);
    }

    try {
      const res = await fetch(`/api/attendance/print?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setToast({ show: true, message: "Gagal Memuat", description: json.error || "Terjadi kesalahan.", type: "error" });
      }
    } catch {
      setToast({ show: true, message: "Gagal Memuat", description: "Periksa koneksi internet.", type: "error" });
    }

    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  };

  const formatMonth = (monthStr: string) => {
    const [y, m] = monthStr.split("-");
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  };

  const className = classes.find((c) => c.id.toString() === selectedClassId)?.name || "";

  const isWeekend = (() => {
    if (!date) return false;
    const [y, m, d] = date.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 || day === 6;
  })();

  const isDailyWeekend = period === "daily" && isWeekend;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Cetak Rekap Absensi</h2>
        <p className="text-sm text-on-surface-variant">
          Pilih kelas dan periode untuk melihat rekap harian, mingguan, atau bulanan.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant">Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            >
              <option value="">Pilih Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant">Periode</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "daily" | "weekly" | "monthly")}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          {(period === "daily" || period === "weekly") && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-on-surface-variant">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              />
            </div>
          )}
          {period === "monthly" && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-on-surface-variant">Bulan</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              disabled={loading || !selectedClassId}
              className="flex-1 bg-primary text-on-primary font-semibold text-sm h-12 px-6 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Memuat..." : "Tampilkan"}
            </button>
            <button
              onClick={handlePrint}
              disabled={!data}
              className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm h-12 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              Cetak
            </button>
          </div>
        </div>
      </div>

      {isDailyWeekend ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">event_busy</span>
          <h3 className="font-bold text-lg text-on-surface mb-2">Sekolah Libur</h3>
          <p className="text-sm text-on-surface-variant">
            Tidak ada rekap absensi pada hari Sabtu dan Minggu. Pilih tanggal hari kerja untuk mencetak.
          </p>
        </div>
      ) : data && (
        <div id="print-area" className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-outline-variant bg-surface-container-lowest/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Rekap Absensi</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Kelas: {className}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-on-surface">
                  {data.type === "daily" && formatDate(data.date)}
                  {data.type === "weekly" && `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`}
                  {data.type === "monthly" && formatMonth(data.month)}
                </p>
                <p className="text-xs text-on-surface-variant capitalize">{data.type === "daily" ? "Harian" : data.type === "weekly" ? "Mingguan" : "Bulanan"}</p>
              </div>
            </div>
          </div>

          {/* Daily Table */}
          {data.type === "daily" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-3 text-xs font-semibold text-on-surface-variant w-12">No</th>
                    <th className="p-3 text-xs font-semibold text-on-surface-variant">Nama Siswa</th>
                    <th className="p-3 text-xs font-semibold text-on-surface-variant text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {data.students.map((s, idx) => (
                    <tr key={s.nisn} className="hover:bg-surface-container-low/50">
                      <td className="p-3 text-xs text-on-surface-variant">{idx + 1}</td>
                      <td className="p-3 text-sm font-medium text-on-surface">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{s.nisn}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${statusStyle[s.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                          {s.status === "H" ? "Hadir" : s.status === "A" ? "Alpa" : s.status === "I" ? "Izin" : s.status === "S" ? "Sakit" : "Terlambat"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Weekly Table */}
          {data.type === "weekly" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-2 text-xs font-semibold text-on-surface-variant border-r border-outline-variant w-10">No</th>
                    <th className="p-2 text-xs font-semibold text-on-surface-variant border-r border-outline-variant">Nama</th>
                    {data.days.map((d) => (
                      <th key={d} className="p-2 text-xs font-semibold text-on-surface-variant text-center min-w-[52px]">
                        <div>{new Date(d).toLocaleDateString("id-ID", { weekday: "short" })}</div>
                        <div className="text-[10px] text-on-surface-variant font-normal">{formatDate(d)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {data.students.map((s, idx) => (
                    <tr key={s.nisn} className="hover:bg-surface-container-low/50">
                      <td className="p-2 text-xs text-on-surface-variant border-r border-outline-variant">{idx + 1}</td>
                      <td className="p-2 text-xs font-medium text-on-surface border-r border-outline-variant">
                        <div className="truncate max-w-[140px]">{s.name}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{s.nisn}</div>
                      </td>
                      {s.statuses.map((st, i) => (
                        <td key={i} className="p-2 text-center border-r border-outline-variant last:border-0">
                          <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold border ${statusStyle[st] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                            {st}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Monthly Summary Table */}
          {data.type === "monthly" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-3 text-xs font-semibold text-on-surface-variant w-12">No</th>
                    <th className="p-3 text-xs font-semibold text-on-surface-variant">Nama Siswa</th>
                    {data.statusKeys.map((key) => (
                      <th key={key} className="p-3 text-xs font-semibold text-on-surface-variant text-center">{key}</th>
                    ))}
                    <th className="p-3 text-xs font-semibold text-on-surface-variant text-center">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {data.students.map((s, idx) => (
                    <tr key={s.nisn} className="hover:bg-surface-container-low/50">
                      <td className="p-3 text-xs text-on-surface-variant">{idx + 1}</td>
                      <td className="p-3 text-sm font-medium text-on-surface">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{s.nisn}</div>
                      </td>
                      {data.statusKeys.map((key) => (
                        <td key={key} className="p-3 text-center text-sm font-medium text-on-surface">
                          {s.summary[key] || 0}
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer summary */}
          <div className="p-4 bg-surface-container-lowest/60 border-t border-outline-variant text-[10px] text-on-surface-variant text-right">
            Dicetak pada: {new Date().toLocaleString("id-ID")}
          </div>
        </div>
      )}

      {!data && !isDailyWeekend && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">print</span>
          <h3 className="font-bold text-lg text-on-surface mb-2">Pilih Kelas dan Periode</h3>
          <p className="text-sm text-on-surface-variant">
            Klik "Tampilkan" untuk melihat rekap absensi, lalu "Cetak" untuk mencetak.
          </p>
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        description={toast.description}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  );
}
