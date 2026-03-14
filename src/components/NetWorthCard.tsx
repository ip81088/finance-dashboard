"use client";

import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Account } from "@/db/schema";

interface NetWorthCardProps {
  accounts: Account[];
}

export default function NetWorthCard({ accounts }: NetWorthCardProps) {
  const totalAssets = accounts
    .filter((a) => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalDebts = accounts
    .filter((a) => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const totalCreditLimit = accounts
    .filter((a) => a.balance < 0)
    .reduce((sum, a) => sum + (a.creditLimit || 0), 0);

  const netWorth = totalAssets - totalDebts;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white shadow-lg">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />

      <div className="relative">
        <p className="text-sm font-medium text-indigo-200">Net Worth</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(netWorth)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-medium text-indigo-200">
                Total Assets
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(totalAssets)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-300" />
              <span className="text-xs font-medium text-indigo-200">
                Total Debts
              </span>
            </div>
            {totalCreditLimit > 0 ? (
              <p className="mt-1 text-lg font-semibold" dir="ltr">
                {`\u200E${formatCurrency(totalDebts)}\u200E / \u200E${formatCurrency(totalCreditLimit)}`}
              </p>
            ) : (
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(totalDebts)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
