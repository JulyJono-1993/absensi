import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const period = searchParams.get("period");
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  if (!classId || !period) {
    return NextResponse.json({ error: "classId dan period wajib diisi" }, { status: 400 });
  }

  const { data: studentList, error: stuError } = await supabase
    .from("students")
    .select("*")
    .eq("class_id", parseInt(classId))
    .order("name", { ascending: true });

  if (stuError) return NextResponse.json({ error: stuError.message }, { status: 500 });

  if (period === "daily") {
    if (!date) return NextResponse.json({ error: "date wajib diisi" }, { status: 400 });
    const { data: attendanceList } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", parseInt(classId))
      .eq("date", date);

    const attendanceMap = new Map((attendanceList || []).map((a: any) => [a.student_id, a.status]));
    const students = studentList.map((s: any) => ({
      name: s.name,
      nisn: s.nisn,
      status: attendanceMap.get(s.id) || "H",
    }));

    return NextResponse.json({
      type: "daily",
      date,
      students,
    });
  }

  if (period === "weekly") {
    if (!date) return NextResponse.json({ error: "date wajib diisi" }, { status: 400 });
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

    const attendanceMap = new Map((attendanceList || []).map((a: any) => [`${a.student_id}|${a.date}`, a.status]));

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d.toISOString().split("T")[0]);
    }

    const students = studentList.map((s: any) => {
      const statuses = days.map((d) => attendanceMap.get(`${s.id}|${d}`) || "H");
      return {
        name: s.name,
        nisn: s.nisn,
        statuses,
      };
    });

    return NextResponse.json({
      type: "weekly",
      startDate: days[0],
      endDate: days[6],
      days,
      students,
    });
  }

  if (period === "monthly") {
    if (!month) return NextResponse.json({ error: "month wajib diisi (YYYY-MM)" }, { status: 400 });
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

    const attendanceMap = new Map((attendanceList || []).map((a: any) => [`${a.student_id}|${a.date}`, a.status]));

    const daysInMonth = endDate.getDate();
    const days: string[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const mm = String(mon).padStart(2, "0");
      const dd = String(i).padStart(2, "0");
      days.push(`${year}-${mm}-${dd}`);
    }

    const statusLabels: Record<string, string> = { H: "Hadir", A: "Alpa", I: "izin", S: "Sakit", T: "Terlambat" };
    const statusKeys = ["H", "A", "I", "S", "T"];

    const students = studentList.map((s: any) => {
      const summary: Record<string, number> = { H: 0, A: 0, I: 0, S: 0, T: 0 };
      for (const d of days) {
        const key = attendanceMap.get(`${s.id}|${d}`) || "H";
        summary[key] = (summary[key] || 0) + 1;
      }
      const totalPresent = summary.H;
      const percentage = daysInMonth > 0 ? Math.round((totalPresent / daysInMonth) * 100) : 0;

      return {
        name: s.name,
        nisn: s.nisn,
        summary,
        percentage,
      };
    });

    return NextResponse.json({
      type: "monthly",
      month,
      daysInMonth,
      statusKeys,
      statusLabels,
      students,
    });
  }

  if (period === "semester") {
    if (!date) return NextResponse.json({ error: "date wajib diisi" }, { status: 400 });
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

    const attendanceMap = new Map((attendanceList || []).map((a: any) => [`${a.student_id}|${a.date}`, a.status]));

    const days: string[] = [];
    const cur = new Date(year, startMonth, 1);
    while (cur <= last) {
      days.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    const totalDays = days.length;

    const statusLabels: Record<string, string> = { H: "Hadir", A: "Alpa", I: "Izin", S: "Sakit", T: "Terlambat" };
    const statusKeys = ["H", "A", "I", "S", "T"];

    const students = studentList.map((s: any) => {
      const summary: Record<string, number> = { H: 0, A: 0, I: 0, S: 0, T: 0 };
      for (const d of days) {
        const key = attendanceMap.get(`${s.id}|${d}`) || "H";
        summary[key] = (summary[key] || 0) + 1;
      }
      const totalPresent = summary.H;
      const percentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

      return {
        name: s.name,
        nisn: s.nisn,
        summary,
        percentage,
      };
    });

    return NextResponse.json({
      type: "semester",
      semester,
      year,
      startDate: startStr,
      endDate: endStr,
      totalDays,
      statusKeys,
      statusLabels,
      students,
    });
  }

  return NextResponse.json({ error: "Period tidak valid" }, { status: 400 });
}
