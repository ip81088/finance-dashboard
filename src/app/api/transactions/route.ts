import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const accountId = searchParams.get("accountId");

  let query = db.select().from(transactions).orderBy(desc(transactions.date));

  if (accountId) {
    query = query.where(eq(transactions.accountId, parseInt(accountId))) as typeof query;
  }

  const allTransactions = await query.limit(limit);
  return NextResponse.json(allTransactions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newTransaction = await db
    .insert(transactions)
    .values({
      accountId: body.accountId,
      amount: body.amount,
      type: body.type,
      category: body.category,
      description: body.description || null,
      date: body.date,
    })
    .returning();

  // Update account balance
  const account = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, body.accountId));

  if (account.length > 0) {
    const balanceChange = body.type === "credit" ? body.amount : -body.amount;
    await db
      .update(accounts)
      .set({
        balance: account[0].balance + balanceChange,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, body.accountId));
  }

  return NextResponse.json(newTransaction[0], { status: 201 });
}
