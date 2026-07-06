import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, students, attendance } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  // Count classes
  const classCount = await db.select({ count: sql<number>`count(*)::int` }).from(classes);

  // Count students
  const studentCount = await db.select({ count: sql<number>`count(*)::int` }).from(students);

  // Today's attendance
  const todayAttendance = await db
    .select({
      status: attendance.status,
      count: sql<number>`count(*)::int`,
    })
    .from(attendance)
    .where(eq(attendance.date, today))
    .groupBy(attendance.status);

  const statusCounts: Record<string, number> = { H: 0, A: 0, I: 0, S: 0, T: 0 };
  for (const row of todayAttendance) {
    statusCounts[row.status] = row.count;
  }

  // Recent attendance (last 7 entries)
  const recentAttendance = await db
    .select({
      date: attendance.date,
      className: classes.name,
      status: attendance.status,
      studentName: students.name,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .innerJoin(classes, eq(attendance.classId, classes.id))
    .orderBy(sql`${attendance.date} DESC, ${attendance.createdAt} DESC`)
    .limit(10);

  return NextResponse.json({
    totalClasses: classCount[0].count,
    totalStudents: studentCount[0].count,
    today: statusCounts,
    recentAttendance,
  });
}
