import { supabase } from "./supabase";

/* Tanggal hari ini dalam timezone lokal (bukan UTC) agar scan di pagi hari
   tidak salah menghitung sebagai hari sebelumnya. */
export function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* Cek apakah tanggal (YYYY-MM-DD) jatuh pada Sabtu/Minggu */
function isWeekendStr(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

/* ----------------------------- Stats ----------------------------- */
export interface Stats {
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

export async function getStats(): Promise<Stats> {
  const today = todayLocal();

  const { count: classCount } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true });
  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("class_id, status")
    .eq("date", today);

  const classIds = [
    ...new Set((todayAttendance || []).map((r: any) => r.class_id)),
  ];

  const studentsPerClass: Record<number, number> = {};
  const perClass: Record<
    number,
    { rows: number; H: number; A: number; I: number; S: number; T: number }
  > = {};

  if (classIds.length > 0) {
    const { data: studentsByClass } = await supabase
      .from("students")
      .select("class_id")
      .in("class_id", classIds);
    for (const s of studentsByClass || []) {
      studentsPerClass[s.class_id] = (studentsPerClass[s.class_id] || 0) + 1;
    }
  }

  for (const r of todayAttendance || []) {
    const cid = r.class_id;
    if (!perClass[cid])
      perClass[cid] = { rows: 0, H: 0, A: 0, I: 0, S: 0, T: 0 };
    perClass[cid].rows += 1;
    if (r.status in perClass[cid]) {
      (perClass[cid] as any)[r.status] += 1;
    }
  }

  let totalHadir = 0;
  let totalAlpa = 0;
  let totalIzin = 0;
  let totalSakit = 0;
  let totalTerlambat = 0;

  for (const cid of classIds) {
    const totalInClass = studentsPerClass[cid] || 0;
    const pc =
      perClass[cid] || { rows: 0, H: 0, A: 0, I: 0, S: 0, T: 0 };
    totalHadir += pc.H;
    totalAlpa += pc.A + (totalInClass - pc.rows);
    totalIzin += pc.I;
    totalSakit += pc.S;
    totalTerlambat += pc.T;
  }

  const statusCounts: Record<string, number> = {
    H: totalHadir,
    A: totalAlpa,
    I: totalIzin,
    S: totalSakit,
    T: totalTerlambat,
  };

  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("date, status, created_at, students(name), classes(name)")
    .order("date", { ascending: false })
    .limit(10);

  const mapped = (recentAttendance || []).map((r: any) => ({
    date: r.date,
    className: r.classes?.[0]?.name || "",
    status: r.status,
    studentName: r.students?.[0]?.name || "",
  }));

  return {
    totalClasses: classCount || 0,
    totalStudents: studentCount || 0,
    today: statusCounts,
    recentAttendance: mapped,
  };
}

/* ----------------------------- Classes ----------------------------- */
export interface ClassItem {
  id: number;
  name: string;
  waGroupLink: string | null;
  createdAt: string;
}

export async function getClasses(): Promise<ClassItem[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    waGroupLink: c.wa_group_link,
    createdAt: c.created_at,
  }));
}

export async function createClass(name: string, waGroupLink: string) {
  const { data, error } = await supabase
    .from("classes")
    .insert({ name, wa_group_link: waGroupLink || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateClass(
  id: number,
  name: string,
  waGroupLink: string
) {
  const { data, error } = await supabase
    .from("classes")
    .update({ name, wa_group_link: waGroupLink || null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteClass(id: number) {
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ----------------------------- Students ----------------------------- */
export interface Student {
  id: number;
  name: string;
  nisn: string;
  classId: number;
  className: string;
  rfidUid: string | null;
  createdAt: string;
}

export async function getStudents(
  classId?: string,
  q?: string
): Promise<Student[]> {
  let query = supabase
    .from("students")
    .select("*, classes(name)")
    .order("name", { ascending: true });
  if (classId) query = query.eq("class_id", parseInt(classId));
  if (q) query = query.or(`name.ilike.%${q}%,nisn.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    nisn: s.nisn,
    classId: s.class_id,
    className: s.classes?.[0]?.name || "",
    rfidUid: s.rfid_uid || null,
    createdAt: s.created_at,
  }));
}

export async function createStudent(
  name: string,
  nisn: string,
  classId: string
) {
  const { data, error } = await supabase
    .from("students")
    .insert({ name, nisn, class_id: parseInt(classId) })
    .select()
    .single();
  if (error) {
    if (
      error.code === "23505" ||
      error.message.toLowerCase().includes("unique")
    ) {
      throw new Error("NISN sudah terdaftar");
    }
    throw new Error(error.message);
  }
  return data;
}

export async function deleteStudent(id: number) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function importStudents(
  studentList: { name: string; nisn: string }[],
  classId: string
) {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of studentList) {
    if (!s.name || !s.nisn) {
      skipped++;
      continue;
    }
    const { error } = await supabase
      .from("students")
      .insert({
        name: s.name.trim(),
        nisn: s.nisn.trim(),
        class_id: parseInt(classId),
      });
    if (error) {
      if (
        error.code === "23505" ||
        error.message.toLowerCase().includes("unique")
      ) {
        errors.push(`NISN ${s.nisn} sudah terdaftar`);
        skipped++;
      } else {
        errors.push(`Error untuk ${s.name}: ${error.message}`);
        skipped++;
      }
    } else {
      imported++;
    }
  }

  return { imported, skipped, errors };
}

/* ----------------------------- Attendance ----------------------------- */
export interface AttendanceRecord {
  studentId: number;
  name: string;
  nisn: string;
  status: string;
  scanTime?: string;
  scanMethod?: string;
}

export async function getAttendance(
  classId: string,
  date: string
): Promise<AttendanceRecord[]> {
  const classIdNum = parseInt(classId);

  // Ambil daftar siswa langsung dari tabel students agar nama selalu tampil
  const { data: studentList, error: stuError } = await supabase
    .from("students")
    .select("id, name, nisn")
    .eq("class_id", classIdNum)
    .order("name", { ascending: true });
  if (stuError) throw new Error(stuError.message);

  // Ambil record absensi untuk tanggal terkait
  const { data: attendanceList, error: attError } = await supabase
    .from("attendance")
    .select("student_id, status, scan_time, scan_method")
    .eq("class_id", classIdNum)
    .eq("date", date);
  if (attError) throw new Error(attError.message);

  const attMap = new Map(
    (attendanceList || []).map((a: any) => [a.student_id, a])
  );

  return (studentList || []).map((s: any) => {
    const a = attMap.get(s.id);
    return {
      studentId: s.id,
      name: s.name,
      nisn: s.nisn,
      status: a?.status || "A",
      scanTime: a?.scan_time,
      scanMethod: a?.scan_method,
    };
  });
}

export async function saveAttendance(
  classId: string,
  date: string,
  records: { studentId: number; status: string }[]
) {
  const classIdNum = parseInt(classId);

  if (records.length > 0) {
    const values = records.map((r) => ({
      student_id: r.studentId,
      class_id: classIdNum,
      date,
      status: r.status,
      scan_method: "manual",
    }));
    const { error } = await supabase
      .from("attendance")
      .upsert(values, { onConflict: "student_id,date" });
    if (error) throw new Error(error.message);
  }

  return { success: true, count: records.length };
}

export async function deleteAttendance(classId: string, date: string) {
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("class_id", parseInt(classId))
    .eq("date", date);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function autoAlpa(classId: string, date: string) {
  const { data, error } = await supabase.rpc("auto_fill_alpa", {
    p_class_id: parseInt(classId),
    p_date: date || todayLocal(),
  });
  if (error) throw new Error(error.message);
  return { success: true, marked: data };
}

/* ----------------- Backup / Restore / Hapus ----------------- */
export interface AttendanceBackupRow {
  nisn: string;
  studentName: string;
  className: string;
  date: string;
  status: string;
  scanTime: string | null;
  scanMethod: string | null;
}

export interface AttendanceBackupFile {
  app: string;
  type: string;
  version: number;
  exportedAt: string;
  range: { start: string | null; end: string | null };
  records: AttendanceBackupRow[];
}

function pickRel<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : null;
  return (v as T) ?? null;
}

export async function getAttendanceBackup(
  startDate?: string,
  endDate?: string
): Promise<AttendanceBackupRow[]> {
  let query = supabase
    .from("attendance")
    .select("date, status, scan_time, scan_method, students(name, nisn), classes(name)")
    .order("date", { ascending: false });

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((r: any) => {
    const stu = pickRel<any>(r.students);
    const cls = pickRel<any>(r.classes);
    return {
      nisn: stu?.nisn || "",
      studentName: stu?.name || "",
      className: cls?.name || "",
      date: r.date,
      status: r.status,
      scanTime: r.scan_time || null,
      scanMethod: r.scan_method || null,
    };
  });
}

export async function deleteAttendanceBackup(
  startDate?: string,
  endDate?: string
): Promise<{ deleted: number }> {
  let query = supabase.from("attendance").delete({ count: "exact" });
  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return { deleted: count || 0 };
}

export async function restoreAttendanceBackup(
  rows: AttendanceBackupRow[]
): Promise<{ restored: number; skipped: number }> {
  const valid = (rows || []).filter((r) => r && r.nisn && r.date && r.status);
  if (valid.length === 0) return { restored: 0, skipped: rows?.length || 0 };

  const nisns = [...new Set(valid.map((r) => r.nisn))];
  const { data: students, error: stuError } = await supabase
    .from("students")
    .select("id, nisn, class_id")
    .in("nisn", nisns);
  if (stuError) throw new Error(stuError.message);

  const map = new Map((students || []).map((s: any) => [s.nisn, s]));

  const values: any[] = [];
  for (const r of valid) {
    const s = map.get(r.nisn);
    if (!s) continue;
    values.push({
      student_id: s.id,
      class_id: s.class_id,
      date: r.date,
      status: r.status,
      scan_time: r.scanTime || null,
      scan_method: r.scanMethod || "manual",
    });
  }

  const skipped = valid.length - values.length;

  if (values.length > 0) {
    const { error } = await supabase
      .from("attendance")
      .upsert(values, { onConflict: "student_id,date" });
    if (error) throw new Error(error.message);
  }

  return { restored: values.length, skipped };
}

/* ----------------------------- RFID ----------------------------- */
export async function registerRfid(
  studentId: number,
  rfidUid: string | null
) {
  const { data, error } = await supabase.rpc("register_rfid", {
    p_student_id: studentId,
    p_rfid_uid: rfidUid || null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function scanRfid(rfid: string, date?: string) {
  const { data, error } = await supabase.rpc("record_rfid_scan", {
    p_rfid_uid: rfid,
    p_date: date || todayLocal(),
  });
  if (error) throw new Error(error.message);
  return data;
}

/* ----------------------------- Settings ----------------------------- */
export async function getSettings() {
  const { data, error } = await supabase
    .from("school_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return { batas_jam_masuk: "07:00", school_name: "" };
  }

  return data;
}

export async function saveSettings(
  batas_jam_masuk: string,
  school_name: string
) {
  const update: Record<string, unknown> = {};
  if (batas_jam_masuk) update.batas_jam_masuk = batas_jam_masuk;
  if (school_name !== undefined) update.school_name = school_name;

  if (Object.keys(update).length === 0) {
    throw new Error("Tidak ada data yang diubah");
  }

  const { data, error } = await supabase
    .from("school_settings")
    .update(update)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    const insertResult = await supabase
      .from("school_settings")
      .insert({ id: 1, ...update })
      .select()
      .single();

    if (insertResult.error) {
      throw new Error(insertResult.error.message);
    }

    return insertResult.data;
  }

  return data;
}

/* ----------------------------- Report ----------------------------- */
export interface ReportSummary {
  className: string;
  date: string;
  total: number;
  hadir: number;
  alpa: number;
  izin: number;
  sakit: number;
  terlambat: number;
}

export interface ReportData {
  message: string;
  waUrl: string;
  waGroupLink: string | null;
  summary: ReportSummary;
}

export async function getReport(
  classId: string,
  date: string
): Promise<ReportData> {
  const { data: classInfo, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", parseInt(classId))
    .single();
  if (classError || !classInfo) {
    throw new Error("Kelas tidak ditemukan");
  }

  const classIdNum = parseInt(classId);

  const { data: studentList, error: stuError } = await supabase
    .from("students")
    .select("id, name, nisn")
    .eq("class_id", classIdNum)
    .order("name", { ascending: true });
  if (stuError) throw new Error(stuError.message);

  const { data: attendanceList, error: attError } = await supabase
    .from("attendance")
    .select("student_id, status")
    .eq("class_id", classIdNum)
    .eq("date", date);
  if (attError) throw new Error(attError.message);

  const attMap = new Map(
    (attendanceList || []).map((a: any) => [a.student_id, a.status])
  );

  const records = (studentList || []).map((s: any) => ({
    name: s.name,
    nisn: s.nisn,
    status: attMap.get(s.id) || "A",
  }));

  const totalSiswa = studentList?.length || 0;

  const className = classInfo.name;
  const waGroupLink = classInfo.wa_group_link || null;
  const formattedDate = new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusLabels: Record<string, string> = {
    H: "Hadir",
    A: "Alpa",
    I: "Izin",
    S: "Sakit",
    T: "Terlambat",
  };

  const grouped: Record<string, string[]> = { A: [], I: [], S: [], T: [] };

  const total = totalSiswa || 0;
  let totalHadir = 0;

  for (const r of records as any[]) {
    const status = (r as any).status;
    if (status === "H") {
      totalHadir++;
    } else if (grouped[status]) {
      grouped[status].push((r as any).name || "");
    }
  }

  let message = `📋 *LAPORAN ABSENSI HARIAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `🏫 Kelas: *${className}*\n`;
  message += `📅 Tanggal: ${formattedDate}\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `✅ Hadir: ${totalHadir}/${totalSiswa} siswa\n\n`;

  const statusEmoji: Record<string, string> = {
    A: "❌",
    I: "📝",
    S: "🏥",
    T: "⏰",
  };

  for (const [key, names] of Object.entries(grouped)) {
    if (names.length > 0) {
      message += `${statusEmoji[key]} *${statusLabels[key]}* (${names.length}):\n`;
      names.forEach((name, i) => {
        message += `   ${i + 1}. ${name}\n`;
      });
      message += `\n`;
    }
  }

  if (Object.values(grouped).every((arr) => arr.length === 0)) {
    message += `🎉 *Semua siswa hadir!*\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `📊 _Dikirim via EduAttend_`;

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/?text=${encodedMessage}`;

  return {
    message,
    waUrl,
    waGroupLink,
    summary: {
      className,
      date: formattedDate,
      total,
      hadir: totalHadir,
      alpa: grouped.A.length,
      izin: grouped.I.length,
      sakit: grouped.S.length,
      terlambat: grouped.T.length,
    },
  };
}

/* ----------------------------- Print ----------------------------- */
export type PrintData =
  | {
      type: "daily";
      date: string;
      students: { name: string; nisn: string; status: string }[];
    }
  | {
      type: "weekly";
      startDate: string;
      endDate: string;
      days: string[];
      students: { name: string; nisn: string; statuses: string[] }[];
    }
  | {
      type: "monthly";
      month: string;
      daysInMonth: number;
      statusKeys: string[];
      statusLabels: Record<string, string>;
      students: {
        name: string;
        nisn: string;
        summary: Record<string, number>;
        percentage: number;
      }[];
    }
  | {
      type: "semester";
      semester: number;
      year: number;
      startDate: string;
      endDate: string;
      totalDays: number;
      statusKeys: string[];
      statusLabels: Record<string, string>;
      students: {
        name: string;
        nisn: string;
        summary: Record<string, number>;
        percentage: number;
      }[];
    }
  | null;

export async function getPrintData(
  classId: string,
  period: "daily" | "weekly" | "monthly" | "semester",
  date: string,
  month: string
): Promise<PrintData> {
  if (!classId || !period) {
    throw new Error("classId dan period wajib diisi");
  }

  const { data: studentList, error: stuError } = await supabase
    .from("students")
    .select("*")
    .eq("class_id", parseInt(classId))
    .order("name", { ascending: true });

  if (stuError) throw new Error(stuError.message);

  if (period === "daily") {
    if (!date) throw new Error("date wajib diisi");
    const { data: attendanceList } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", parseInt(classId))
      .eq("date", date);

    const attendanceMap = new Map(
      (attendanceList || []).map((a: any) => [a.student_id, a.status])
    );
    const students = studentList.map((s: any) => ({
      name: s.name,
      nisn: s.nisn,
      status: attendanceMap.get(s.id) || "A",
    }));

    return { type: "daily", date, students };
  }

  if (period === "weekly") {
    if (!date) throw new Error("date wajib diisi");
    const target = new Date(date);
    const day = target.getDay();
    const diff = target.getDate() - day + (day === 0 ? -6 : 1);
    const startDate = new Date(target.setDate(diff));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const { data: attendanceList } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", parseInt(classId))
      .gte("date", startStr)
      .lte("date", endStr);

    const attendanceMap = new Map(
      (attendanceList || []).map((a: any) => [
        `${a.student_id}|${a.date}`,
        a.status,
      ])
    );

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      if (!isWeekendStr(ds)) days.push(ds);
    }

    const students = studentList.map((s: any) => {
      const statuses = days.map(
        (d) => attendanceMap.get(`${s.id}|${d}`) || "A"
      );
      return { name: s.name, nisn: s.nisn, statuses };
    });

    return {
      type: "weekly",
      startDate: days[0],
      endDate: days[days.length - 1],
      days,
      students,
    };
  }

  if (period === "monthly") {
    if (!month) throw new Error("month wajib diisi (YYYY-MM)");
    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0);
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const { data: attendanceList } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", parseInt(classId))
      .gte("date", startStr)
      .lte("date", endStr);

    const attendanceMap = new Map(
      (attendanceList || []).map((a: any) => [
        `${a.student_id}|${a.date}`,
        a.status,
      ])
    );

    const daysInMonth = endDate.getDate();
    const days: string[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const mm = String(mon).padStart(2, "0");
      const dd = String(i).padStart(2, "0");
      const ds = `${year}-${mm}-${dd}`;
      if (!isWeekendStr(ds)) days.push(ds);
    }
    const schoolDays = days.length;

    const statusLabels: Record<string, string> = {
      H: "Hadir",
      A: "Alpa",
      I: "Izin",
      S: "Sakit",
      T: "Terlambat",
    };
    const statusKeys = ["H", "A", "I", "S", "T"];

    const students = studentList.map((s: any) => {
      const summary: Record<string, number> = {
        H: 0,
        A: 0,
        I: 0,
        S: 0,
        T: 0,
      };
      for (const d of days) {
        const key = attendanceMap.get(`${s.id}|${d}`) || "A";
        summary[key] = (summary[key] || 0) + 1;
      }
      const totalPresent = summary.H + summary.T;
      const percentage =
        schoolDays > 0 ? Math.round((totalPresent / schoolDays) * 100) : 0;

      return {
        name: s.name,
        nisn: s.nisn,
        summary,
        percentage,
      };
    });

    return {
      type: "monthly",
      month,
      daysInMonth,
      statusKeys,
      statusLabels,
      students,
    };
  }

  if (period === "semester") {
    if (!date) throw new Error("date wajib diisi");
    const target = new Date(date);
    const year = target.getFullYear();
    const semester = target.getMonth() < 6 ? 1 : 2;
    const startMonth = semester === 1 ? 0 : 6;

    const startStr = `${year}-${String(startMonth + 1).padStart(2, "0")}-01`;
    const last = new Date(year, startMonth + 6, 0);
    const endStr = last.toISOString().split("T")[0];

    const { data: attendanceList } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", parseInt(classId))
      .gte("date", startStr)
      .lte("date", endStr);

    const attendanceMap = new Map(
      (attendanceList || []).map((a: any) => [
        `${a.student_id}|${a.date}`,
        a.status,
      ])
    );

    const days: string[] = [];
    const cur = new Date(year, startMonth, 1);
    while (cur <= last) {
      const ds = cur.toISOString().split("T")[0];
      if (!isWeekendStr(ds)) days.push(ds);
      cur.setDate(cur.getDate() + 1);
    }
    const totalDays = days.length;

    const statusLabels: Record<string, string> = {
      H: "Hadir",
      A: "Alpa",
      I: "Izin",
      S: "Sakit",
      T: "Terlambat",
    };
    const statusKeys = ["H", "A", "I", "S", "T"];

    const students = studentList.map((s: any) => {
      const summary: Record<string, number> = {
        H: 0,
        A: 0,
        I: 0,
        S: 0,
        T: 0,
      };
      for (const d of days) {
        const key = attendanceMap.get(`${s.id}|${d}`) || "A";
        summary[key] = (summary[key] || 0) + 1;
      }
      const totalPresent = summary.H + summary.T;
      const percentage =
        totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

      return {
        name: s.name,
        nisn: s.nisn,
        summary,
        percentage,
      };
    });

    return {
      type: "semester",
      semester,
      year,
      startDate: startStr,
      endDate: endStr,
      totalDays,
      statusKeys,
      statusLabels,
      students,
    };
  }

  throw new Error("Period tidak valid");
}
