import { db } from "@/db";
import { recurringIncome, transactions, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  const allRecurring = await db
    .select()
    .from(recurringIncome)
    .where(eq(recurringIncome.active, true));

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let processed = 0;

  for (const income of allRecurring) {
    // Skip if already processed this month
    if (income.lastProcessed === currentMonth) {
      continue;
    }

    // Only process on the exact day (or last day of month if dayOfMonth exceeds month length)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const effectiveDay = Math.min(income.dayOfMonth, daysInMonth);
    if (now.getDate() !== effectiveDay) {
      continue;
    }

    // Create the transaction
    const txDate = `${currentMonth}-${String(effectiveDay).padStart(2, "0")}`;
    await db.insert(transactions).values({
      accountId: income.accountId,
      amount: income.amount,
      type: "credit",
      category: "Income",
      description: income.name,
      date: txDate,
    });

    // Update account balance
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, income.accountId));

    if (account.length > 0) {
      await db
        .update(accounts)
        .set({
          balance: account[0].balance + income.amount,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, income.accountId));
    }

    // Mark as processed for this month
    await db
      .update(recurringIncome)
      .set({ lastProcessed: currentMonth, updatedAt: new Date() })
      .where(eq(recurringIncome.id, income.id));

    processed++;
  }

  return NextResponse.json({ processed, month: currentMonth });
}
