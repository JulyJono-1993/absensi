import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { Pagination } from "@/components/Pagination";
import {
  getStudents,
  getClasses,
  createStudent,
  importStudents,
  deleteStudent,
} from "@/lib/api";

interface Student {
  id: number;
  name: string;
  nisn: string;
  classId: number;
  className: string;
}

interface ClassItem {
  id: number;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClassId, setFilterClassId] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [nisn, setNisn] = useState("");
  const [classId, setClassId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [importClassId, setImportClassId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [toast, setToast] = useState({ show: false, message: "", description: "", type: "success" as "success" | "error" | "info" });

  const fetchStudents = useCallback(async () => {
    const data = await getStudents(filterClassId || undefined);
    setStudents(data);
    setLoading(false);
  }, [filterClassId]);

  const fetchClasses = useCallback(async () => {
    const data = await getClasses();
    setClasses(data);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [filterClassId]);

  const handleAdd = async () => {
    if (!name.trim() || !nisn.trim() || !classId) return;

    try {
      await createStudent(name.trim(), nisn.trim(), classId);
      setToast({ show: true, message: "Siswa Ditambahkan", description: `${name} berhasil ditambahkan.`, type: "success" });
      setAddModalOpen(false);
      setName("");
      setNisn("");
      setClassId("");
      fetchStudents();
    } catch (err) {
      setToast({ show: true, message: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", type: "error" });
    }
  };

  const handleImport = async () => {
    if (!csvText.trim() || !importClassId) return;

    const lines = csvText.trim().split("\n");
    const studentList = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return { name: parts[0], nisn: parts[1] };
      })
      .filter((s) => s.name && s.nisn);

    if (studentList.length === 0) {
      setToast({ show: true, message: "Format Salah", description: "Pastikan format: Nama,NISN (satu per baris)", type: "error" });
      return;
    }

    try {
      const data = await importStudents(studentList, importClassId);
      setToast({
        show: true,
        message: "Import Selesai",
        description: `${data.imported} berhasil, ${data.skipped} dilewati.`,
        type: data.imported > 0 ? "success" : "info",
      });
      setImportModalOpen(false);
      setCsvText("");
      setImportClassId("");
      fetchStudents();
    } catch (err) {
      setToast({ show: true, message: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", type: "error" });
    }
  };

  const handleDelete = async (id: number, studentName: string) => {
    if (!confirm(`Yakin ingin menghapus siswa ${studentName}?`)) return;

    try {
      await deleteStudent(id);
      setToast({ show: true, message: "Siswa Dihapus", description: `${studentName} berhasil dihapus.`, type: "success" });
      fetchStudents();
    } catch (err) {
      setToast({ show: true, message: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", type: "error" });
    }
  };

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedStudents = students.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Master Siswa</h2>
          <p className="text-on-surface-variant text-sm">Kelola data siswa, tambah manual atau import dari CSV.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setImportModalOpen(true); setImportClassId(classes[0]?.id?.toString() || ""); }}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm h-12 px-5 rounded-xl flex items-center gap-2 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Import CSV
          </button>
          <button
            onClick={() => { setAddModalOpen(true); setClassId(classes[0]?.id?.toString() || ""); }}
            className="bg-primary text-on-primary font-semibold text-sm h-12 px-6 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            <span className="material-symbols-outlined">person_add</span>
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-outline">filter_alt</span>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="border border-outline-variant rounded-xl h-10 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="text-sm text-on-surface-variant">{students.length} siswa</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">person</span>
          <h3 className="font-bold text-lg text-on-surface mb-2">Belum Ada Siswa</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            {classes.length === 0
              ? "Tambahkan kelas terlebih dahulu di menu Master Kelas."
              : "Tambahkan siswa satu per satu atau import dari CSV."}
          </p>
        </div>
      ) : (
        <>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant w-16">No</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant">Nama Siswa</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant">NISN</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-variant border-b border-outline-variant">Kelas</th>
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
                      <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {s.className}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="text-error hover:bg-error/5 p-2 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-outline-variant">
            {pagedStudents.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-on-surface">{s.name}</p>
                  <p className="text-xs text-on-surface-variant">NISN: {s.nisn}</p>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
                    {s.className}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="text-error hover:bg-error/5 p-2 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
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

      {/* Add Student Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Tambah Siswa Baru">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Nama Siswa *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap siswa"
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">NISN *</label>
            <input
              type="text"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              placeholder="Nomor Induk Siswa Nasional"
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Kelas *</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
            >
              <option value="">Pilih Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setAddModalOpen(false)}
              className="flex-1 border border-outline-variant text-on-surface font-semibold text-sm h-12 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !nisn.trim() || !classId}
              className="flex-1 bg-primary text-on-primary font-semibold text-sm h-12 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              Tambah Siswa
            </button>
          </div>
        </div>
      </Modal>

      {/* Import CSV Modal */}
      <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import Siswa dari CSV">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Kelas Tujuan *</label>
            <select
              value={importClassId}
              onChange={(e) => setImportClassId(e.target.value)}
              className="w-full border border-outline-variant rounded-xl h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm"
            >
              <option value="">Pilih Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Data Siswa (CSV) *</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"Achmad Dhani,1234567890\nBudi Santoso,1234567891\nCitra Kirana,1234567892"}
              rows={8}
              className="w-full border border-outline-variant rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-sm font-mono"
            />
            <p className="text-xs text-on-surface-variant mt-1">
              Format: <code className="bg-surface-container-high px-1 rounded">Nama,NISN</code> — satu siswa per baris.
              Bisa juga copy-paste dari spreadsheet.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setImportModalOpen(false)}
              className="flex-1 border border-outline-variant text-on-surface font-semibold text-sm h-12 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={!csvText.trim() || !importClassId}
              className="flex-1 bg-primary text-on-primary font-semibold text-sm h-12 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              Import Data
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
