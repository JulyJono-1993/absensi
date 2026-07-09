"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { Pagination } from "@/components/Pagination";

interface ClassItem {
  id: number;
  name: string;
  waGroupLink: string | null;
  createdAt: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClassItem | null>(null);
  const [name, setName] = useState("");
  const [waGroupLink, setWaGroupLink] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", description: "", type: "success" as const });
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const openAdd = () => {
    setEditItem(null);
    setName("");
    setWaGroupLink("");
    setModalOpen(true);
  };

  const openEdit = (item: ClassItem) => {
    setEditItem(item);
    setName(item.name);
    setWaGroupLink(item.waGroupLink || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (editItem) {
      await fetch("/api/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editItem.id, name: name.trim(), waGroupLink: waGroupLink.trim() }),
      });
      setToast({ show: true, message: "Kelas Diperbarui", description: `${name} berhasil diperbarui.`, type: "success" });
    } else {
      await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), waGroupLink: waGroupLink.trim() }),
      });
      setToast({ show: true, message: "Kelas Ditambahkan", description: `${name} berhasil ditambahkan.`, type: "success" });
    }

    setModalOpen(false);
    fetchClasses();
  };

  const handleDelete = async (id: number, className: string) => {
    if (!confirm(`Yakin ingin menghapus kelas ${className}? Semua data siswa dan absensi di kelas ini akan terhapus.`)) return;

    await fetch(`/api/classes?id=${id}`, { method: "DELETE" });
    setToast({ show: true, message: "Kelas Dihapus", description: `${className} berhasil dihapus.`, type: "success" });
    fetchClasses();
  };

  const totalPages = Math.max(1, Math.ceil(classes.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedClasses = classes.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Master Kelas</h2>
          <p className="text-on-surface-variant text-sm">Kelola kelas dan link WA Group untuk pengiriman laporan.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-on-primary font-semibold text-sm h-12 px-6 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Kelas
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">school</span>
          <h3 className="font-bold text-lg text-on-surface mb-2">Belum Ada Kelas</h3>
          <p className="text-sm text-on-surface-variant mb-6">Tambahkan kelas pertama untuk mulai mengelola absensi.</p>
          <button
            onClick={openAdd}
            className="bg-primary text-on-primary font-semibold text-sm h-10 px-6 rounded-xl inline-flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Tambah Kelas
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">school</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{cls.name}</h3>
                    <p className="text-xs text-on-surface-variant">
                      Dibuat: {new Date(cls.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
              {cls.waGroupLink && (
                <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <a href={cls.waGroupLink} target="_blank" rel="noreferrer" className="text-xs truncate underline decoration-emerald-700/40 hover:decoration-emerald-700">
                    {cls.waGroupLink}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/50">
                <button
                  onClick={() => openEdit(cls)}
                  className="flex-1 text-sm font-medium text-primary hover:bg-primary/5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cls.id, cls.name)}
                  className="flex-1 text-sm font-medium text-error hover:bg-error/5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={classes.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Kelas" : "Tambah Kelas Baru"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Nama Kelas *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: XII MIPA 1"
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Link WA Group (Opsional)</label>
            <input
              type="text"
              value={waGroupLink}
              onChange={(e) => setWaGroupLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
            />
            <p className="text-xs text-on-surface-variant mt-1">Untuk mengirim laporan langsung ke grup WhatsApp kelas.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-outline-variant text-on-surface font-semibold text-sm h-12 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 bg-primary text-on-primary font-semibold text-sm h-12 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              {editItem ? "Simpan Perubahan" : "Tambah Kelas"}
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
