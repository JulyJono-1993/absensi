import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rfid = searchParams.get("rfid");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!rfid) {
    return NextResponse.json({ error: "rfid wajib diisi" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("record_rfid_scan", {
    p_rfid_uid: rfid,
    p_date: date,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
