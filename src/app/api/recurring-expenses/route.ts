import { db } from "@/db";
import { recurringExpenses } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const all = await db.select().from(recurringExpenses);
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await db
    .insert(recurringExpenses)
    .values({
      name: body.name,
      amount: body.amount,
      accountId: body.accountId,
      category: body.category || "Bills & Utilities",
      dayOfMonth: body.dayOfMonth,
      active: body.active ?? true,
    })
    .returning();
  return NextResponse.json(created[0], { status: 201 });
}
