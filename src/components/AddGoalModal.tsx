"use client";

import { useState } from "react";
import Modal from "./Modal";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400";

export default function AddGoalModal({
  isOpen,
  onClose,
  onAdd,
}: AddGoalModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("savings");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          deadline: deadline || null,
        }),
      });
      setName("");
      setType("savings");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");
      onAdd();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Financial Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Goal Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Vacation Fund"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Goal Type
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="debt_payoff">Debt Payoff</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Target Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              placeholder="10,000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Current Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Target Date (Optional)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name || !targetAmount}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Goal"}
        </button>
      </form>
    </Modal>
  );
}
