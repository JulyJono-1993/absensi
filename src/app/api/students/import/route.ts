import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { students: studentList, classId } = body;

  if (!studentList || !Array.isArray(studentList) || !classId) {
    return NextResponse.json({ error: "Data siswa dan kelas wajib diisi" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of studentList) {
    if (!s.name || !s.nisn) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from("students").insert({ name: s.name.trim(), nisn: s.nisn.trim(), class_id: parseInt(classId) });
    if (error) {
      if (error.code === "23505" || error.message.toLowerCase().includes("unique")) {
        errors.push(`NISN ${s.nisn} sudah terdaftar`);
        skipped++;
      } else {
        errors.push(`Error untuk ${s.name}: ${error.message}`);
        skipped++;
      }
    } else {
      imported++;
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
