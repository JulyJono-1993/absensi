import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, students, classes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId dan date wajib diisi" }, { status: 400 });
  }

  // Get all students in class
  const studentList = await db
    .select()
    .from(students)
    .where(eq(students.classId, parseInt(classId)))
    .orderBy(students.name);

  // Get existing attendance for this date
  const existingAttendance = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.classId, parseInt(classId)),
        eq(attendance.date, date)
      )
    );

  const attendanceMap = new Map(existingAttendance.map((a) => [a.studentId, a.status]));

  const result = studentList.map((s) => ({
    studentId: s.id,
    name: s.name,
    nisn: s.nisn,
    status: attendanceMap.get(s.id) || "H", // default Hadir
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { classId, date, records } = body;

  if (!classId || !date || !records || !Array.isArray(records)) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  // Delete existing attendance for this class and date
  await db.delete(attendance).where(
    and(
      eq(attendance.classId, parseInt(classId)),
      eq(attendance.date, date)
    )
  );

  // Insert new records
  if (records.length > 0) {
    const values = records.map((r: { studentId: number; status: string }) => ({
      studentId: r.studentId,
      classId: parseInt(classId),
      date,
      status: r.status,
    }));

    await db.insert(attendance).values(values);
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

  await db.delete(attendance).where(
    and(
      eq(attendance.classId, parseInt(classId)),
      eq(attendance.date, date)
    )
  );

  return NextResponse.json({ success: true });
}
