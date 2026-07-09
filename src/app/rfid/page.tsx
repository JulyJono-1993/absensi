"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { Pagination } from "@/components/Pagination";

interface Student {
  id: number;
  name: string;
  nisn: string;
  classId: number;
  className: string;
  rfidUid: string | null;
}

interface ClassItem {
  id: number;
  name: string;
}

export default function RfidPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClassId, setFilterClassId] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [rfidInput, setRfidInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [toast, setToast] = useState({ show: false, message: "", description: "", type: "success" as "success" | "error" | "info" });
  const rfidInputRef = useRef<HTMLInputElement>(null);

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterClassId) params.set("classId", filterClassId);
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/students?${params.toString()}`);
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  }, [filterClassId, search]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(), 250);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [filterClassId, search]);

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedStudents = students.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openRegister = (s: Student) => {
    setSelected(s);
    setRfidInput(s.rfidUid || "");
    setModalOpen(true);
    setTimeout(() => rfidInputRef.current?.focus(), 100);
  };

  const submitRfid = async (rfid: string, student: Student) => {
    setSaving(true);
    const res = await fetch("/api/rfid/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, rfidUid: rfid || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok && data.success) {
      setToast({ show: true, message: "Berhasil", description: data.message, type: "success" });
      setModalOpen(false);
      fetchStudents();
    } else {
      setToast({ show: true, message: "Gagal", description: data.error || data.message || "Terjadi kesalahan", type: "error" });
    }
  };

  const onRfidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && selected) {
      e.preventDefault();
      submitRfid(rfidInput.trim(), selected);
    }
  };

  const registeredCount = students.filter((s) => s.rfidUid).length;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Registrasi RFID</h2>
        <p className="text-on-surface-variant text-sm">
          Hubungkan kartu RFID ke siswa. Filter per kelas atau cari berdasarkan nama / NISN.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-semibold text-on-surface-variant">Cari Nama / NISN</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik nama atau NISN..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl h-12 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              />
            </div>
          </div>
          <div className="space-y-1 md:w-56">
            <label className="text-sm font-semibold text-on-surface-variant">Filter Kelas</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant mt-3">
          {students.length} siswa • {registeredCount} terdaftar RFID
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">person_off</span>
          <h3 className="font-bold text-lg text-on-surface mb-2">Tidak Ada Siswa</h3>
          <p className="text-sm text-on-surface-variant">Sesuaikan filter atau tambah siswa di menu Master Siswa.</p>
        </div>
      ) : (
        <>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant w-16">No</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant">Nama</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant">NISN</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant">Kelas</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant">RFID</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pagedStudents.map((s, i) => (
                  <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4 text-sm text-on-surface-variant">{(page - 1) * pageSize + i + 1}</td>
                    <td className="p-4 text-sm font-medium text-on-surface">{s.name}</td>
                    <td className="p-4 text-sm text-outline font-mono">{s.nisn}</td>
                    <td className="p-4">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{s.className}</span>
                    </td>
                    <td className="p-4">
                      {s.rfidUid ? (
                        <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                          {s.rfidUid}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openRegister(s)}
                        className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors"
                        title={s.rfidUid ? "Ubah RFID" : "Daftarkan RFID"}
                      >
                        <span className="material-symbols-outlined text-lg">credit_card</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-outline-variant">
            {pagedStudents.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-on-surface truncate">{s.name}</p>
                  <p className="text-xs text-on-surface-variant">NISN: {s.nisn}</p>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">{s.className}</span>
                  {s.rfidUid && (
                    <p className="text-xs font-mono text-emerald-700 mt-1">{s.rfidUid}</p>
                  )}
                </div>
                <button
                  onClick={() => openRegister(s)}
                  className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined">credit_card</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={students.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
        </>
      )}

      {/* Register Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Registrasi RFID — ${selected?.name || ""}`}>
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Tempel kartu RFID pada reader, UID akan terisi otomatis lalu tekan Enter untuk menyimpan.
            Atau ketik UID secara manual.
          </p>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">UID RFID</label>
            <input
              ref={rfidInputRef}
              value={rfidInput}
              onChange={(e) => setRfidInput(e.target.value)}
              onKeyDown={onRfidKeyDown}
              placeholder="Tempel kartu atau ketik UID"
              autoFocus
              className="w-full border border-outline-variant rounded-xl h-12 px-4 font-mono focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
            />
            {selected?.rfidUid && (
              <p className="text-xs text-on-surface-variant mt-1">
                Saat ini: <span className="font-mono">{selected.rfidUid}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            {selected?.rfidUid && (
              <button
                onClick={() => submitRfid("", selected)}
                disabled={saving}
                className="flex-1 border border-rose-300 text-rose-600 font-semibold text-sm h-12 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                Hapus RFID
              </button>
            )}
            <button
              onClick={() => selected && submitRfid(rfidInput.trim(), selected)}
              disabled={saving || !rfidInput.trim()}
              className="flex-1 bg-primary text-on-primary font-semibold text-sm h-12 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
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
