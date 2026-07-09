import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true });
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true });

  const { data: todayAttendance } = await supabase.from("attendance").select("class_id, status").eq("date", today);

  const classIds = [...new Set((todayAttendance || []).map((r: any) => r.class_id))];

  const studentsPerClass: Record<number, number> = {};
  const perClass: Record<number, { rows: number; H: number; A: number; I: number; S: number; T: number }> = {};

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
    if (!perClass[cid]) perClass[cid] = { rows: 0, H: 0, A: 0, I: 0, S: 0, T: 0 };
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
    const pc = perClass[cid] || { rows: 0, H: 0, A: 0, I: 0, S: 0, T: 0 };
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

  const { data: recentAttendance } = await supabase.from("attendance").select("date, status, created_at, students(name), classes(name)").order("date", { ascending: false }).limit(10);

  const mapped = (recentAttendance || []).map((r: any) => ({
    date: r.date,
    className: r.classes?.[0]?.name || "",
    status: r.status,
    studentName: r.students?.[0]?.name || "",
  }));

  return NextResponse.json({
    totalClasses: classCount || 0,
    totalStudents: studentCount || 0,
    today: statusCounts,
    recentAttendance: mapped,
  });
}
