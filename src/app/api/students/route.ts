import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  let query = supabase.from("students").select("*, classes(name)").order("name", { ascending: true });
  if (classId) {
    query = query.eq("class_id", parseInt(classId));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    nisn: s.nisn,
    classId: s.class_id,
    className: s.classes?.[0]?.name || "",
    createdAt: s.created_at,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, nisn, classId } = body;

  if (!name || !nisn || !classId) {
    return NextResponse.json({ error: "Nama, NISN, dan Kelas wajib diisi" }, { status: 400 });
  }

  const { data, error } = await supabase.from("students").insert({ name, nisn, class_id: parseInt(classId) }).select().single();
  if (error) {
    if (error.code === "23505" || error.message.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "NISN sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
  }

  const { error } = await supabase.from("students").delete().eq("id", parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
