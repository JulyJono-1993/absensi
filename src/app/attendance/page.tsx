"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast } from "@/components/Toast";

interface ClassItem {
  id: number;
  name: string;
}

interface AttendanceRecord {
  studentId: number;
  name: string;
  nisn: string;
  status: string;
}

const absentOptions = [
  { key: "A", label: "Alpa", color: "bg-rose-600", border: "border-rose-600" },
  { key: "I", label: "Izin", color: "bg-amber-600", border: "border-amber-600" },
  { key: "S", label: "Sakit", color: "bg-sky-600", border: "border-sky-600" },
  { key: "T", label: "Terlambat", color: "bg-purple-600", border: "border-purple-600" },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", description: "", type: "success" as "success" | "error" | "info" });

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data);
    if (data.length > 0 && !selectedClassId) {
      setSelectedClassId(data[0].id.toString());
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);
    const res = await fetch(`/api/attendance?classId=${selectedClassId}&date=${selectedDate}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setRecords(
        data.map((r: any) => ({
          studentId: r.studentId,
          name: r.name,
          nisn: r.nisn,
          status: r.status || "H",
        }))
      );
    } else {
      setRecords([]);
    }
    setLoading(false);
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchAttendance();
    }
  }, [selectedClassId, selectedDate, fetchAttendance]);

  const setStatus = (studentId: number, status: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        const currentAbsent = absentOptions.find((o) => o.key === r.status);
        if (currentAbsent && currentAbsent.key === status) {
          return { ...r, status: "H" };
        }
        return { ...r, status };
      })
    );
  };

  const handleSave = async () => {
    if (!selectedClassId || records.length === 0) return;
    setSaving(true);

    const absentRecords = records
      .filter((r) => r.status !== "H")
      .map((r) => ({
        studentId: r.studentId,
        status: r.status,
      }));

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: selectedClassId,
        date: selectedDate,
        records: absentRecords,
      }),
    });

    setSaving(false);

    if (res.ok) {
      const className = classes.find((c) => c.id.toString() === selectedClassId)?.name || "";
      setToast({
        show: true,
        message: "Data Berhasil Disimpan",
        description: `Absensi ${className} tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")} telah disimpan.`,
        type: "success",
      });
    } else {
      setToast({ show: true, message: "Gagal Menyimpan", description: "Terjadi kesalahan.", type: "error" });
    }
  };

  const handleSendWA = async () => {
    if (!selectedClassId) return;
    const res = await fetch(`/api/attendance/report?classId=${selectedClassId}&date=${selectedDate}`);
    const data = await res.json();
    if (data.waUrl) {
      window.open(data.waUrl, "_blank");
    }
  };

  const selectedClassName = classes.find((c) => c.id.toString() === selectedClassId)?.name || "";

  const isWeekend = (() => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 || day === 6;
  })();

  const absentCounts = records.reduce(
    (acc, r) => {
      if (r.status !== "H") {
        acc[r.status] = (acc[r.status] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Entri Absensi Harian</h2>
          <p className="text-sm text-on-surface-variant">
            Semua siswa dianggap <strong>Hadir</strong> secara default. Klik tombol di bawah untuk menandai siswa yang tidak hadir.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant px-1">Pilih Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant px-1">Pilih Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
      </div>

      {isWeekend ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">event_busy</span>
          <h3 className="font-bold text-lg text-on-surface mb-2">Sekolah Libur</h3>
          <p className="text-sm text-on-surface-variant">
            Tidak ada entri absensi pada hari Sabtu dan Minggu. Pilih tanggal hari kerja untuk mengisi absensi.
          </p>
        </div>
      ) : (
        <>
          {/* Absent Summary Bar */}
          {records.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 mb-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-semibold text-on-surface">Ringkasan:</span>
                {absentOptions.map((opt) => (
                  <div key={opt.key} className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${absentOptions.find((o) => o.key === opt.key)?.color}`}>
                      {opt.key}
                    </span>
                    <span className="text-sm text-on-surface">
                      {opt.label}: <strong>{absentCounts[opt.key] || 0}</strong>
                    </span>
                  </div>
                ))}
                <span className="text-sm text-on-surface-variant ml-auto">Total: {records.length} siswa</span>
                <span className="text-sm text-emerald-600 font-medium">
                  Hadir: {records.length - (absentCounts.A + absentCounts.I + absentCounts.S + absentCounts.T)}
                </span>
              </div>
            </div>
          )}

          {/* Student List */}
          {!selectedClassId ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">edit_note</span>
              <h3 className="font-bold text-lg text-on-surface mb-2">Pilih Kelas Terlebih Dahulu</h3>
              <p className="text-sm text-on-surface-variant">Pilih kelas dan tanggal di atas untuk mulai mengisi absensi.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : records.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">person_off</span>
              <h3 className="font-bold text-lg text-on-surface mb-2">Belum Ada Siswa di Kelas Ini</h3>
              <p className="text-sm text-on-surface-variant">
                Tambahkan siswa ke kelas {selectedClassName} melalui menu Master Siswa.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
                <div className="divide-y divide-outline-variant">
                  {records.map((r) => {
                    const activeAbsent = absentOptions.find((o) => o.key === r.status);
                    return (
                      <div key={r.studentId} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-on-surface truncate">{r.name}</p>
                          <p className="text-xs text-on-surface-variant font-mono">{r.nisn}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.status === "H" && (
                            <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
                              Hadir
                            </span>
                          )}
                          {absentOptions.map((opt) => {
                            const isActive = activeAbsent?.key === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => setStatus(r.studentId, opt.key)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  isActive
                                    ? `${opt.color} text-white ${opt.border}`
                                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-on-primary font-semibold text-sm h-12 px-8 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">save</span>
                    {saving ? "Menyimpan..." : "Simpan Absensi"}
                  </button>
                  <button
                    onClick={handleSendWA}
                    className="bg-[#25D366] text-white font-semibold text-sm h-12 px-8 rounded-xl flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined">send</span>
                    Kirim Laporan ke WA
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant italic">
                  <span className="material-symbols-outlined text-[16px] text-primary align-sub mr-1">info</span>
                  Hapus tanda jika siswa seharusnya Hadir. Simpan terlebih dahulu sebelum mengirim ke WA.
                </p>
              </div>
            </>
          )}
        </>
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
