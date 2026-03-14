import { db } from "@/db";
import { recurringExpenses, transactions, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  const allRecurring = await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.active, true));

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let processed = 0;

  for (const expense of allRecurring) {
    if (expense.lastProcessed === currentMonth) {
      continue;
    }

    // Only process on the exact day (or last day of month if dayOfMonth exceeds month length)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const effectiveDay = Math.min(expense.dayOfMonth, daysInMonth);
    if (now.getDate() !== effectiveDay) {
      continue;
    }

    const txDate = `${currentMonth}-${String(effectiveDay).padStart(2, "0")}`;
    await db.insert(transactions).values({
      accountId: expense.accountId,
      amount: expense.amount,
      type: "debit",
      category: expense.category,
      description: expense.name,
      date: txDate,
    });

    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, expense.accountId));

    if (account.length > 0) {
      await db
        .update(accounts)
        .set({
          balance: account[0].balance - expense.amount,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, expense.accountId));
    }

    await db
      .update(recurringExpenses)
      .set({ lastProcessed: currentMonth, updatedAt: new Date() })
      .where(eq(recurringExpenses.id, expense.id));

    processed++;
  }

  return NextResponse.json({ processed, month: currentMonth });
}
