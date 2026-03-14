"use client";

import { useState } from "react";
import Modal from "./Modal";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400";

export default function AddAccountModal({
  isOpen,
  onClose,
  onAdd,
}: AddAccountModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("main");
  const [balance, setBalance] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);

  const colors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#ef4444",
    "#f97316",
    "#14b8a6",
    "#6366f1",
    "#ec4899",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          balance: parseFloat(balance) || 0,
          institution: institution || null,
          accountNumber: accountNumber || null,
          creditLimit: creditLimit ? parseFloat(creditLimit) : null,
          color,
        }),
      });
      setName("");
      setType("main");
      setBalance("");
      setCreditLimit("");
      setInstitution("");
      setAccountNumber("");
      setColor("#6366f1");
      onAdd();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Account Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Main Checking"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Account Type
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            <option value="main">Main</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="debt">Debt</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Current Balance
          </label>
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Credit Limit
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            placeholder="e.g., 35000"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Institution
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., Chase"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Last 4 Digits
            </label>
            <input
              type="text"
              maxLength={4}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="1234"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Color
          </label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition-transform ${
                  color === c ? "scale-110 ring-2 ring-offset-2 dark:ring-offset-slate-900" : ""
                }`}
                style={{ backgroundColor: c, outlineColor: color === c ? c : undefined }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Account"}
        </button>
      </form>
    </Modal>
  );
}
