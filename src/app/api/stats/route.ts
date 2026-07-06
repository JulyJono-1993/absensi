import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true });
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true });

  const { data: todayAttendance } = await supabase.from("attendance").select("status").eq("date", today);

  const statusCounts: Record<string, number> = { H: 0, A: 0, I: 0, S: 0, T: 0 };
  for (const row of todayAttendance || []) {
    statusCounts[row.status] = row.status in statusCounts ? (statusCounts[row.status] + 1) : 1;
  }

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
