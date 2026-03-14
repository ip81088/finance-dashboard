import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await db
    .update(goals)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(goals.id, parseInt(id)))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await db
    .delete(goals)
    .where(eq(goals.id, parseInt(id)))
    .returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
