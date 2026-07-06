import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, classes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  let query;
  if (classId) {
    query = db
      .select({
        id: students.id,
        name: students.name,
        nisn: students.nisn,
        classId: students.classId,
        className: classes.name,
        createdAt: students.createdAt,
      })
      .from(students)
      .innerJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.classId, parseInt(classId)))
      .orderBy(students.name);
  } else {
    query = db
      .select({
        id: students.id,
        name: students.name,
        nisn: students.nisn,
        classId: students.classId,
        className: classes.name,
        createdAt: students.createdAt,
      })
      .from(students)
      .innerJoin(classes, eq(students.classId, classes.id))
      .orderBy(students.name);
  }

  const result = await query;
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, nisn, classId } = body;

  if (!name || !nisn || !classId) {
    return NextResponse.json({ error: "Nama, NISN, dan Kelas wajib diisi" }, { status: 400 });
  }

  try {
    const result = await db.insert(students).values({
      name,
      nisn,
      classId: parseInt(classId),
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "NISN sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
  }

  await db.delete(students).where(eq(students.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
