"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Account, Transaction } from "@/db/schema";

interface NetWorthChartProps {
  accounts: Account[];
  transactions: Transaction[];
}

export default function NetWorthChart({ accounts, transactions }: NetWorthChartProps) {
  const data = useMemo(() => {
    const now = new Date();
    const currentNetWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

    // Build list of the last 12 months (inclusive of current)
    const months: { key: string; label: string; year: number; month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }

    // Calculate net change per month from transactions (credit adds, debit subtracts)
    const monthlyNet = new Map<string, number>();
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const current = monthlyNet.get(key) ?? 0;
      monthlyNet.set(key, current + (t.type === "credit" ? t.amount : -t.amount));
    }

    // Work backwards from current net worth to reconstruct historical values
    // Start from the current month and subtract future changes to get past values
    const result: { month: string; netWorth: number }[] = [];
    let runningTotal = currentNetWorth;

    for (let i = months.length - 1; i >= 0; i--) {
      result.unshift({
        month: months[i].label,
        netWorth: Math.round(runningTotal * 100) / 100,
      });
      // Subtract this month's net change to get the value at end of previous month
      const change = monthlyNet.get(months[i].key) ?? 0;
      runningTotal -= change;
    }

    return result;
  }, [accounts, transactions]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Net Worth
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Last 12 months</p>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          No data yet
        </div>
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-slate-200)"
                className="dark:opacity-20"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--color-slate-400)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--color-slate-400)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₪${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Net Worth"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--tooltip-border)",
                  backgroundColor: "var(--tooltip-bg)",
                  color: "var(--tooltip-text)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "13px",
                }}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                name="Net Worth"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#6366f1" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
