"use client";

import { formatCurrency, getCategoryColor } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Transaction } from "@/db/schema";

interface SpendingChartProps {
  transactions: Transaction[];
}

export default function SpendingChart({ transactions }: SpendingChartProps) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === "debit" &&
      t.category !== "Transfer" &&
      d.getMonth() === thisMonth &&
      d.getFullYear() === thisYear
    );
  });

  const categoryTotals = monthlyExpenses.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: getCategoryColor(name),
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Spending by Category
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">This month</p>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          No expenses this month
        </div>
      ) : (
        <>
          <div className="mt-4 flex justify-center">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--tooltip-border)",
                      backgroundColor: "var(--tooltip-bg)",
                      color: "var(--tooltip-text)",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Total
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.name}
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.value)}
                </span>
                <span className="w-12 text-right text-xs text-slate-400 dark:text-slate-500">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
