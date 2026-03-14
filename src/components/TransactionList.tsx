"use client";

import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import type { Transaction, Account } from "@/db/schema";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction?: () => void;
}

export default function TransactionList({
  transactions,
  accounts,
  onAddTransaction,
}: TransactionListProps) {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Recent Transactions
        </h2>
        {onAddTransaction && (
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {transactions.slice(0, 10).map((tx) => {
          const account = accountMap.get(tx.accountId);
          const isCredit = tx.type === "credit";

          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${getCategoryColor(tx.category)}15`,
                }}
              >
                {isCredit ? (
                  <ArrowDownLeft
                    className="h-5 w-5"
                    style={{ color: getCategoryColor(tx.category) }}
                  />
                ) : (
                  <ArrowUpRight
                    className="h-5 w-5"
                    style={{ color: getCategoryColor(tx.category) }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {tx.description}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {account?.name} &middot; {tx.category}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    isCredit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {isCredit ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(tx.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
