import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("school_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { batas_jam_masuk, school_name } = body;

  const update: Record<string, unknown> = {};
  if (batas_jam_masuk) update.batas_jam_masuk = batas_jam_masuk;
  if (school_name !== undefined) update.school_name = school_name;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("school_settings")
    .update(update)
    .eq("id", 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
