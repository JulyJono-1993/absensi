"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast } from "@/components/Toast";

interface ClassItem {
  id: number;
  name: string;
}

interface ReportSummary {
  className: string;
  date: string;
  total: number;
  hadir: number;
  alpa: number;
  izin: number;
  sakit: number;
  terlambat: number;
}

interface ReportData {
  message: string;
  waUrl: string;
  waGroupLink: string | null;
  summary: ReportSummary;
}

export default function ReportsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", description: "", type: "success" as "success" | "error" | "info" });

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data);
    if (data.length > 0) setSelectedClassId(data[0].id.toString());
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchReport = async () => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);
    const res = await fetch(`/api/attendance/report?classId=${selectedClassId}&date=${selectedDate}`);
    const data = await res.json();
    if (data.summary) {
      setReport(data);
    } else {
      setReport(null);
      setToast({ show: true, message: "Tidak Ada Data", description: "Belum ada data absensi untuk tanggal dan kelas ini.", type: "info" });
    }
    setLoading(false);
  };

  const handleSendWA = () => {
    if (report?.waUrl) {
      window.open(report.waUrl, "_blank");
    }
  };

  const handleOpenGroup = async () => {
    if (!report?.waGroupLink) return;

    let copied = false;
    if (report?.message) {
      try {
        await navigator.clipboard.writeText(report.message);
        copied = true;
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = report.message;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copied = true;
      }
    }

    window.open(report.waGroupLink, "_blank");

    setToast({
      show: true,
      message: copied ? "Pesan disalin ke clipboard" : "Gagal menyalin pesan",
      description: copied
        ? "Buka grup WhatsApp lalu tekan Ctrl+V / tempel untuk mengirim laporan."
        : "Silakan salin pesan laporan secara manual.",
      type: copied ? "success" : "error",
    });
  };

  const handleCopyMessage = async () => {
    if (report?.message) {
      try {
        await navigator.clipboard.writeText(report.message);
        setToast({ show: true, message: "Disalin!", description: "Pesan berhasil disalin ke clipboard.", type: "success" });
      } catch {
        // Fallback for non-HTTPS
        const textarea = document.createElement("textarea");
        textarea.value = report.message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setToast({ show: true, message: "Disalin!", description: "Pesan berhasil disalin ke clipboard.", type: "success" });
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Laporan Absensi</h2>
        <p className="text-on-surface-variant text-sm">
          Lihat ringkasan absensi dan kirim laporan ke grup WhatsApp kelas.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
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
          <div className="flex-1 space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading || !selectedClassId}
            className="bg-primary text-on-primary font-semibold text-sm h-12 px-8 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined">search</span>
            {loading ? "Memuat..." : "Tampilkan Laporan"}
          </button>
        </div>
      </div>

      {report && report.summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 text-center">
              <p className="text-2xl font-bold text-on-surface">{report.summary.total}</p>
              <p className="text-xs text-on-surface-variant">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{report.summary.hadir}</p>
              <p className="text-xs text-emerald-600">Hadir</p>
            </div>
            <div className="bg-rose-50 rounded-xl border border-rose-200 p-4 text-center">
              <p className="text-2xl font-bold text-rose-700">{report.summary.alpa}</p>
              <p className="text-xs text-rose-600">Alpa</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{report.summary.izin}</p>
              <p className="text-xs text-amber-600">Izin</p>
            </div>
            <div className="bg-sky-50 rounded-xl border border-sky-200 p-4 text-center">
              <p className="text-2xl font-bold text-sky-700">{report.summary.sakit}</p>
              <p className="text-xs text-sky-600">Sakit</p>
            </div>
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{report.summary.terlambat}</p>
              <p className="text-xs text-purple-600">Terlambat</p>
            </div>
          </div>

          {/* Attendance Bar */}
          {report.summary.total > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 mb-6 shadow-sm">
              <h3 className="font-bold text-sm text-on-surface mb-3">Persentase Kehadiran</h3>
              <div className="w-full h-6 rounded-full bg-surface-container-high overflow-hidden flex">
                {report.summary.hadir > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(report.summary.hadir / report.summary.total) * 100}%` }}
                    title={`Hadir: ${report.summary.hadir}`}
                  />
                )}
                {report.summary.alpa > 0 && (
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${(report.summary.alpa / report.summary.total) * 100}%` }}
                    title={`Alpa: ${report.summary.alpa}`}
                  />
                )}
                {report.summary.izin > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${(report.summary.izin / report.summary.total) * 100}%` }}
                    title={`Izin: ${report.summary.izin}`}
                  />
                )}
                {report.summary.sakit > 0 && (
                  <div
                    className="h-full bg-sky-500 transition-all"
                    style={{ width: `${(report.summary.sakit / report.summary.total) * 100}%` }}
                    title={`Sakit: ${report.summary.sakit}`}
                  />
                )}
                {report.summary.terlambat > 0 && (
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${(report.summary.terlambat / report.summary.total) * 100}%` }}
                    title={`Terlambat: ${report.summary.terlambat}`}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Hadir ({Math.round((report.summary.hadir / report.summary.total) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-rose-500" />
                  <span>Alpa ({Math.round((report.summary.alpa / report.summary.total) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span>Izin ({Math.round((report.summary.izin / report.summary.total) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-sky-500" />
                  <span>Sakit ({Math.round((report.summary.sakit / report.summary.total) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-purple-500" />
                  <span>Terlambat ({Math.round((report.summary.terlambat / report.summary.total) * 100)}%)</span>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Message Preview */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[#25D366]">chat</span>
                Preview Pesan WhatsApp
              </h3>
              <button
                onClick={handleCopyMessage}
                className="text-sm text-primary hover:bg-primary/5 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
                Salin
              </button>
            </div>
            <div className="bg-[#e5ddd5] rounded-xl p-4">
              <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-md ml-auto shadow-sm">
                <pre className="text-xs whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {report.message}
                </pre>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {report.waGroupLink && (
              <button
                onClick={handleOpenGroup}
                className="bg-[#25D366] text-white font-semibold text-sm h-12 px-8 rounded-xl flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined">send</span>
                Kirim ke Grup WA
              </button>
            )}
            <button
              onClick={handleSendWA}
              className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm h-12 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">chat</span>
              Kirim Manual (Pilih Grup/Contact)
            </button>
            <button
              onClick={handleCopyMessage}
              className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm h-12 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">content_copy</span>
              Salin Pesan
            </button>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">assessment</span>
          <h3 className="font-bold text-lg text-on-surface mb-2">Pilih Kelas dan Tanggal</h3>
          <p className="text-sm text-on-surface-variant">
            Klik &quot;Tampilkan Laporan&quot; untuk melihat ringkasan absensi dan membuat pesan WhatsApp.
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
