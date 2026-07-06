import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";

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
    try {
      await db.insert(students).values({
        name: s.name.trim(),
        nisn: s.nisn.trim(),
        classId: parseInt(classId),
      });
      imported++;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        errors.push(`NISN ${s.nisn} sudah terdaftar`);
        skipped++;
      } else {
        errors.push(`Error untuk ${s.name}: ${msg}`);
        skipped++;
      }
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
