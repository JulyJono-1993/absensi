import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId dan date wajib diisi" }, { status: 400 });
  }

  const { data: classInfo, error: classError } = await supabase.from("classes").select("*").eq("id", parseInt(classId)).single();
  if (classError || !classInfo) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  const { data: records, error: attError } = await supabase.rpc("get_attendance", {
    p_class_id: parseInt(classId),
    p_date: date,
  });
  if (attError) return NextResponse.json({ error: attError.message }, { status: 500 });

  const { count: totalSiswa, error: countError } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("class_id", parseInt(classId));
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const className = classInfo.name;
  const waGroupLink = classInfo.wa_group_link || null;
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

  const total = totalSiswa || 0;
  let totalHadir = 0;

  for (const r of records) {
    const status = (r as any).status;
    if (status === "H") {
      totalHadir++;
    } else if (grouped[status]) {
      grouped[status].push((r as any).name || "");
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
  const waUrl = `https://wa.me/?text=${encodedMessage}`;

  return NextResponse.json({
    message,
    waUrl,
    waGroupLink,
    summary: {
      className,
      date: formattedDate,
      total,
      hadir: totalHadir,
      alpa: grouped.A.length,
      izin: grouped.I.length,
      sakit: grouped.S.length,
      terlambat: grouped.T.length,
    },
  });
}
