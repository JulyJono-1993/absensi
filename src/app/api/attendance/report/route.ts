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

  // Get class info
  const classInfo = await db
    .select()
    .from(classes)
    .where(eq(classes.id, parseInt(classId)))
    .limit(1);

  if (classInfo.length === 0) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  // Get attendance with student names
  const records = await db
    .select({
      studentName: students.name,
      nisn: students.nisn,
      status: attendance.status,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .where(
      and(
        eq(attendance.classId, parseInt(classId)),
        eq(attendance.date, date)
      )
    )
    .orderBy(students.name);

  // Build WhatsApp message
  const className = classInfo[0].name;
  const waGroupLink = classInfo[0].waGroupLink;
  const formattedDate = new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusLabels: Record<string, string> = {
    H: "Hadir",
    A: "Alpa",
    I: "Izin",
    S: "Sakit",
    T: "Terlambat",
  };

  const grouped: Record<string, string[]> = {
    A: [],
    I: [],
    S: [],
    T: [],
  };

  let totalHadir = 0;
  let totalSiswa = records.length;

  for (const r of records) {
    if (r.status === "H") {
      totalHadir++;
    } else if (grouped[r.status]) {
      grouped[r.status].push(r.studentName);
    }
  }

  let message = `📋 *LAPORAN ABSENSI HARIAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `🏫 Kelas: *${className}*\n`;
  message += `📅 Tanggal: ${formattedDate}\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `✅ Hadir: ${totalHadir}/${totalSiswa} siswa\n\n`;

  const statusEmoji: Record<string, string> = {
    A: "❌",
    I: "📝",
    S: "🏥",
    T: "⏰",
  };

  for (const [key, names] of Object.entries(grouped)) {
    if (names.length > 0) {
      message += `${statusEmoji[key]} *${statusLabels[key]}* (${names.length}):\n`;
      names.forEach((name, i) => {
        message += `   ${i + 1}. ${name}\n`;
      });
      message += `\n`;
    }
  }

  if (Object.values(grouped).every((arr) => arr.length === 0)) {
    message += `🎉 *Semua siswa hadir!*\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `📊 _Dikirim via EduAttend_`;

  const encodedMessage = encodeURIComponent(message);
  let waUrl: string;
  
  if (waGroupLink) {
    // If group link is a phone number
    waUrl = `https://wa.me/?text=${encodedMessage}`;
  } else {
    waUrl = `https://wa.me/?text=${encodedMessage}`;
  }

  return NextResponse.json({
    message,
    waUrl,
    waGroupLink,
    summary: {
      className,
      date: formattedDate,
      total: totalSiswa,
      hadir: totalHadir,
      alpa: grouped.A.length,
      izin: grouped.I.length,
      sakit: grouped.S.length,
      terlambat: grouped.T.length,
    },
  });
}
