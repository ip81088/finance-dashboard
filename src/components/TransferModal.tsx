"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import Modal from "./Modal";
import type { Account } from "@/db/schema";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: () => void;
  accounts: Account[];
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400";

export default function TransferModal({
  isOpen,
  onClose,
  onTransfer,
  accounts,
}: TransferModalProps) {
  const [fromAccountId, setFromAccountId] = useState(
    accounts[0]?.id?.toString() || ""
  );
  const [toAccountId, setToAccountId] = useState(
    accounts[1]?.id?.toString() || ""
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: parseInt(fromAccountId),
          toAccountId: parseInt(toAccountId),
          amount: parseFloat(amount),
          description: description || null,
        }),
      });
      setAmount("");
      setDescription("");
      onTransfer();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Money">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            From Account
          </label>
          <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCurrency(a.balance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            To Account
          </label>
          <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className={inputClass}>
            {accounts
              .filter((a) => a.id.toString() !== fromAccountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
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
            Note (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this transfer for?"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !amount ||
            !fromAccountId ||
            !toAccountId ||
            fromAccountId === toAccountId
          }
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Transferring..." : "Transfer"}
        </button>
      </form>
    </Modal>
  );
}
