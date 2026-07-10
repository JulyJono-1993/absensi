import { useEffect, useRef, useState } from "react";
import { Toast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import {
  getAttendanceBackup,
  restoreAttendanceBackup,
  deleteAttendanceBackup,
  todayLocal,
  AttendanceBackupFile,
  AttendanceBackupRow,
} from "@/lib/api";

export default function BackupPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [fileRows, setFileRows] = useState<AttendanceBackupRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    description: "",
    type: "success" as "success" | "error" | "info",
  });

  const showToast = (
    message: string,
    description: string,
    type: "success" | "error" | "info"
  ) => setToast({ show: true, message, description, type });

  /* ----------------------------- Backup ----------------------------- */
  const handlePreviewBackup = async () => {
    setLoading(true);
    setPreviewCount(null);
    try {
      const rows = await getAttendanceBackup(
        startDate || undefined,
        endDate || undefined
      );
      setPreviewCount(rows.length);
    } catch (err) {
      showToast(
        "Gagal memuat",
        err instanceof Error ? err.message : "Terjadi kesalahan.",
        "error"
      );
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const rows = await getAttendanceBackup(
        startDate || undefined,
        endDate || undefined
      );

      const file: AttendanceBackupFile = {
        app: "EduAttend",
        type: "attendance-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        range: { start: startDate || null, end: endDate || null },
        records: rows,
      };

      const blob = new Blob([JSON.stringify(file, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const label = startDate && endDate ? `${startDate}_${endDate}` : todayLocal();
      a.href = url;
      a.download = `backup-kehadiran-${label}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast(
        "Backup berhasil diunduh",
        `${rows.length} baris riwayat kehadiran disimpan ke file JSON.`,
        "success"
      );
    } catch (err) {
      showToast(
        "Gagal mengunduh",
        err instanceof Error ? err.message : "Terjadi kesalahan.",
        "error"
      );
    }
    setLoading(false);
  };

  /* ----------------------------- Restore ----------------------------- */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AttendanceBackupFile;
      const records = Array.isArray(parsed?.records)
        ? parsed.records
        : Array.isArray((parsed as any)?.data)
        ? (parsed as any).data
        : [];

      if (records.length === 0) {
        setFileRows(null);
        showToast(
          "File tidak valid",
          "Tidak ditemukan data riwayat (field 'records') di dalam file.",
          "error"
        );
        return;
      }

      const valid = records.filter(
        (r: AttendanceBackupRow) => r && r.nisn && r.date && r.status
      );
      setFileRows(valid);
      showToast(
        "File siap dipulihkan",
        `${valid.length} baris valid dari ${records.length} baris akan direstore.`,
        "info"
      );
    } catch {
      setFileRows(null);
      showToast(
        "File tidak valid",
        "Pastikan file merupakan JSON backup yang benar.",
        "error"
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRestore = async () => {
    if (!fileRows || fileRows.length === 0) return;
    setBusy(true);
    try {
      const res = await restoreAttendanceBackup(fileRows);
      showToast(
        "Restore selesai",
        `${res.restored} baris dipulihkan.${
          res.skipped > 0 ? ` ${res.skipped} baris dilewati (NISN tidak ditemukan).` : ""
        }`,
        "success"
      );
      setFileRows(null);
      setFileName("");
    } catch (err) {
      showToast(
        "Gagal restore",
        err instanceof Error ? err.message : "Terjadi kesalahan.",
        "error"
      );
    }
    setBusy(false);
  };

  /* ----------------------------- Hapus ----------------------------- */
  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await deleteAttendanceBackup(
        startDate || undefined,
        endDate || undefined
      );
      showToast(
        "Riwayat dihapus",
        `${res.deleted} baris riwayat kehadiran telah dihapus.`,
        "success"
      );
      setPreviewCount(null);
      setConfirmDelete(false);
    } catch (err) {
      showToast(
        "Gagal menghapus",
        err instanceof Error ? err.message : "Terjadi kesalahan.",
        "error"
      );
    }
    setBusy(false);
  };

  const deleteLabel =
    startDate && endDate
      ? `tanggal ${startDate} s.d. ${endDate}`
      : startDate
      ? `mulai ${startDate}`
      : endDate
      ? `sampai ${endDate}`
      : "SELURUH riwayat kehadiran";

  useEffect(() => {
    setPreviewCount(null);
  }, [startDate, endDate]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Backup &amp; Restore Kehadiran
        </h2>
        <p className="text-on-surface-variant text-sm">
          Kelola ruang database dengan mencadangkan, memulihkan, dan menghapus
          riwayat kehadiran. Data siswa &amp; kelas tidak terpengaruh.
        </p>
      </div>

      {/* Rentang tanggal (dipakai backup & hapus) */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-on-surface-variant mt-3">
          Kosongkan keduanya untuk memproses <strong>seluruh</strong> riwayat.
          Rentang ini berlaku untuk tombol <em>Backup</em> dan <em>Hapus</em>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-3xl text-primary">download</span>
            <h3 className="text-lg font-bold text-on-surface">Backup</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-4 flex-1">
            Unduh seluruh riwayat kehadiran (sesuai rentang) ke file JSON sebagai
            cadangan lokal.
          </p>
          <button
            onClick={handlePreviewBackup}
            disabled={loading}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined">visibility</span>
            {loading ? "Memuat..." : "Cek Jumlah Data"}
          </button>
          {previewCount !== null && (
            <p className="text-xs text-on-surface-variant mt-2 text-center">
              Ditemukan <strong>{previewCount}</strong> baris riwayat.
            </p>
          )}
          <button
            onClick={handleDownload}
            disabled={loading}
            className="mt-3 bg-primary text-on-primary font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined">save_alt</span>
            Unduh Backup (JSON)
          </button>
        </div>

        {/* Restore */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-3xl text-primary">upload</span>
            <h3 className="text-lg font-bold text-on-surface">Restore</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-4 flex-1">
            Pilih file backup JSON untuk mengembalikan riwayat. Data dicocokkan
            via NISN dan dipasang kembali ke siswa yang sesuai (upsert per hari).
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">attach_file</span>
            Pilih File Backup
          </button>
          {fileName && (
            <p className="text-xs text-on-surface-variant mt-2 truncate">
              File: {fileName}
              {fileRows && ` (${fileRows.length} baris valid)`}
            </p>
          )}
          <button
            onClick={handleRestore}
            disabled={busy || !fileRows || fileRows.length === 0}
            className="mt-3 bg-primary text-on-primary font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined">restore</span>
            {busy ? "Memulihkan..." : "Pulihkan Data"}
          </button>
        </div>

        {/* Hapus */}
        <div className="bg-surface-container-lowest rounded-2xl border border-rose-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-3xl text-rose-600">delete_forever</span>
            <h3 className="text-lg font-bold text-on-surface">Hapus Riwayat</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-4 flex-1">
            Hapus riwayat kehadiran untuk mengosongkan database. Gunakan setelah
            melakukan backup.
          </p>
          <button
            onClick={() => setConfirmDelete(true)}
            className="bg-rose-600 text-white font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined">delete</span>
            Hapus Riwayat
          </button>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Konfirmasi Hapus Riwayat"
      >
        <p className="text-sm text-on-surface mb-4">
          Anda akan menghapus <strong>{deleteLabel}</strong>. Tindakan ini tidak
          dapat dibatalkan. Pastikan Anda sudah membuat backup terlebih dahulu.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={() => setConfirmDelete(false)}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm h-11 px-6 rounded-xl hover:bg-surface-container transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="bg-rose-600 text-white font-semibold text-sm h-11 px-6 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {busy ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </Modal>

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
