import { db } from "@/db";
import { recurringIncome } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const all = await db.select().from(recurringIncome);
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await db
    .insert(recurringIncome)
    .values({
      name: body.name,
      amount: body.amount,
      accountId: body.accountId,
      dayOfMonth: body.dayOfMonth,
      active: body.active ?? true,
    })
    .returning();
  return NextResponse.json(created[0], { status: 201 });
}
