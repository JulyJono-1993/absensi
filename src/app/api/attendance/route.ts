import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId dan date wajib diisi" }, { status: 400 });
  }

  const { data, error: attError } = await supabase.rpc("get_attendance", {
    p_class_id: parseInt(classId),
    p_date: date,
  });
  if (attError) return NextResponse.json({ error: attError.message }, { status: 500 });

  const result = (data || []).map((r: any) => ({
    studentId: r.student_id,
    name: r.name,
    nisn: r.nisn,
    status: r.status || "A",
    scanTime: r.scan_time,
    scanMethod: r.scan_method,
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

  if (records.length > 0) {
    const values = records.map((r: { studentId: number; status: string }) => ({
      student_id: r.studentId,
      class_id: classIdNum,
      date,
      status: r.status,
      scan_method: "manual",
    }));
    const { error: upsertError } = await supabase
      .from("attendance")
      .upsert(values, { onConflict: "student_id,date" });
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
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
