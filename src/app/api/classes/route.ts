import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(classes).orderBy(classes.name);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, waGroupLink } = body;

  if (!name) {
    return NextResponse.json({ error: "Nama kelas wajib diisi" }, { status: 400 });
  }

  const result = await db.insert(classes).values({
    name,
    waGroupLink: waGroupLink || null,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, waGroupLink } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "ID dan nama kelas wajib diisi" }, { status: 400 });
  }

  const result = await db.update(classes)
    .set({ name, waGroupLink: waGroupLink || null })
    .where(eq(classes.id, id))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
  }

  await db.delete(classes).where(eq(classes.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
