import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId dan date wajib diisi" }, { status: 400 });
  }

  const { data: studentList, error: stuError } = await supabase.from("students").select("*").eq("class_id", parseInt(classId)).order("name", { ascending: true });
  if (stuError) return NextResponse.json({ error: stuError.message }, { status: 500 });

  const { data: existingAttendance, error: attError } = await supabase.from("attendance").select("*").eq("class_id", parseInt(classId)).eq("date", date);
  if (attError) return NextResponse.json({ error: attError.message }, { status: 500 });

  const attendanceMap = new Map((existingAttendance || []).map((a: any) => [a.student_id, a.status]));

  const result = (studentList || []).map((s: any) => ({
    studentId: s.id,
    name: s.name,
    nisn: s.nisn,
    status: attendanceMap.get(s.id) || "H",
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { classId, date, records } = body;

  if (!classId || !date || !records || !Array.isArray(records)) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const classIdNum = parseInt(classId);
  const { error: deleteError } = await supabase.from("attendance").delete().eq("class_id", classIdNum).eq("date", date);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (records.length > 0) {
    const values = records.map((r: { studentId: number; status: string }) => ({
      student_id: r.studentId,
      class_id: classIdNum,
      date,
      status: r.status,
    }));
    const { error: insertError } = await supabase.from("attendance").insert(values);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId dan date wajib diisi" }, { status: 400 });
  }

  const { error } = await supabase.from("attendance").delete().eq("class_id", parseInt(classId)).eq("date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
