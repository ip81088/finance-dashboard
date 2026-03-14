"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Account } from "@/db/schema";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  accounts: Account[];
  defaultType?: "credit" | "debit";
}

const categories = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Income",
  "Transfer",
  "Education",
  "Travel",
  "Personal Care",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400";

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
  accounts,
  defaultType = "debit",
}: AddTransactionModalProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">(defaultType);
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(accountId),
          amount: parseFloat(amount),
          type,
          category,
          description,
          date,
        }),
      });
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      onAdd();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={defaultType === "credit" ? "Add Funds" : "Send Money"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Account
          </label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.institution})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("debit")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                type === "debit"
                  ? "bg-rose-50 text-rose-600 ring-2 ring-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:ring-rose-800"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("credit")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                type === "credit"
                  ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-800"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Category
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this for?"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !amount || !accountId}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Transaction"}
        </button>
      </form>
    </Modal>
  );
}
