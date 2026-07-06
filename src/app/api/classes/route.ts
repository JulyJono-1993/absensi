import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("classes").select("*").order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    waGroupLink: c.wa_group_link,
    createdAt: c.created_at,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, waGroupLink } = body;
  if (!name) return NextResponse.json({ error: "Nama kelas wajib diisi" }, { status: 400 });
  const { data, error } = await supabase.from("classes").insert({ name, wa_group_link: waGroupLink || null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, waGroupLink } = body;
  if (!id || !name) return NextResponse.json({ error: "ID dan nama kelas wajib diisi" }, { status: 400 });
  const { data, error } = await supabase.from("classes").update({ name, wa_group_link: waGroupLink || null }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
  const { error } = await supabase.from("classes").delete().eq("id", parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
