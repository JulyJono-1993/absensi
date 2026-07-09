import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("school_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json(
      { batas_jam_masuk: "07:00", school_name: "" },
      { status: 200 }
    );
  }

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

  let { data, error } = await supabaseAdmin
    .from("school_settings")
    .update(update)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    const insertResult = await supabaseAdmin
      .from("school_settings")
      .insert({ id: 1, ...update })
      .select()
      .single();

    if (insertResult.error) {
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
    }

    return NextResponse.json(insertResult.data);
  }

  return NextResponse.json(data);
}
