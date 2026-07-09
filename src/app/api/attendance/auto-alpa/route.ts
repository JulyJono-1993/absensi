import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { classId, date } = body;

  if (!classId) {
    return NextResponse.json({ error: "classId wajib diisi" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("auto_fill_alpa", {
    p_class_id: parseInt(classId),
    p_date: date || new Date().toISOString().split("T")[0],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, marked: data });
}
