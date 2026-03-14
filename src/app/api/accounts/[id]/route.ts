import { db } from "@/db";
import { accounts, transactions, goals, recurringIncome, recurringExpenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, parseInt(id)));
  if (account.length === 0) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json(account[0]);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await db
    .update(accounts)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(accounts.id, parseInt(id)))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = parseInt(id);
  // Delete related records first
  db.delete(transactions).where(eq(transactions.accountId, accountId)).run();
  db.delete(goals).where(eq(goals.accountId, accountId)).run();
  db.delete(recurringIncome).where(eq(recurringIncome.accountId, accountId)).run();
  db.delete(recurringExpenses).where(eq(recurringExpenses.accountId, accountId)).run();
  const deleted = await db
    .delete(accounts)
    .where(eq(accounts.id, accountId))
    .returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
