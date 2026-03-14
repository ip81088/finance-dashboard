import { db } from "@/db";
import { accounts } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const allAccounts = await db.select().from(accounts);
  return NextResponse.json(allAccounts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newAccount = await db
    .insert(accounts)
    .values({
      name: body.name,
      type: body.type,
      balance: body.balance || 0,
      institution: body.institution || null,
      accountNumber: body.accountNumber || null,
      creditLimit: body.creditLimit ?? null,
      color: body.color || "#6366f1",
    })
    .returning();
  return NextResponse.json(newAccount[0], { status: 201 });
}
