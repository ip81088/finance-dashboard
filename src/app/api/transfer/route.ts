import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { fromAccountId, toAccountId, amount, description } = body;

  if (!fromAccountId || !toAccountId || !amount) {
    return NextResponse.json(
      { error: "fromAccountId, toAccountId, and amount are required" },
      { status: 400 }
    );
  }

  if (fromAccountId === toAccountId) {
    return NextResponse.json(
      { error: "Cannot transfer to the same account" },
      { status: 400 }
    );
  }

  const fromAccount = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, fromAccountId));
  const toAccount = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, toAccountId));

  if (fromAccount.length === 0 || toAccount.length === 0) {
    return NextResponse.json(
      { error: "One or both accounts not found" },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // Debit from source
  await db
    .update(accounts)
    .set({
      balance: fromAccount[0].balance - amount,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, fromAccountId));

  await db.insert(transactions).values({
    accountId: fromAccountId,
    amount,
    type: "debit",
    category: "Transfer",
    description: description || `Transfer to ${toAccount[0].name}`,
    date: today,
  });

  // Credit to destination
  await db
    .update(accounts)
    .set({
      balance: toAccount[0].balance + amount,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, toAccountId));

  await db.insert(transactions).values({
    accountId: toAccountId,
    amount,
    type: "credit",
    category: "Transfer",
    description: description || `Transfer from ${fromAccount[0].name}`,
    date: today,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
