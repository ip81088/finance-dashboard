"use client";

import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import type { Transaction } from "@/db/schema";

interface StatCardsProps {
  transactions: Transaction[];
}

export default function StatCards({ transactions }: StatCardsProps) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === "credit" && t.category !== "Transfer")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter((t) => t.type === "debit" && t.category !== "Transfer")
    .reduce((sum, t) => sum + t.amount, 0);

  const net = monthlyIncome - monthlyExpenses;
  const isPositive = net >= 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${isPositive ? "bg-emerald-50 dark:bg-emerald-950" : "bg-rose-50 dark:bg-rose-950"}`}>
          <TrendingUp className={`h-4 w-4 ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`} />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Net This Month
        </p>
      </div>
      <p className={`text-2xl font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
        {isPositive ? "+" : "-"}{formatCurrency(Math.abs(net))}
      </p>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {monthlyTransactions.length} transaction{monthlyTransactions.length !== 1 ? "s" : ""} this month
      </p>
    </div>
  );
}
