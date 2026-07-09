import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, rfidUid } = body;

  if (!studentId) {
    return NextResponse.json({ error: "studentId wajib diisi" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("register_rfid", {
    p_student_id: parseInt(studentId),
    p_rfid_uid: rfidUid || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
