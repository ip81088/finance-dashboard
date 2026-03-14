import { db } from "@/db";
import { goals } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const allGoals = await db.select().from(goals);
  return NextResponse.json(allGoals);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newGoal = await db
    .insert(goals)
    .values({
      name: body.name,
      type: body.type,
      targetAmount: body.targetAmount,
      currentAmount: body.currentAmount || 0,
      deadline: body.deadline || null,
      accountId: body.accountId || null,
    })
    .returning();
  return NextResponse.json(newGoal[0], { status: 201 });
}
