"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import Modal from "./Modal";
import type { Account } from "@/db/schema";

interface AccountsOverviewProps {
  accounts: Account[];
  onAddAccount?: () => void;
  onDeleteAccount?: (id: number) => void;
  onEditAccount?: (id: number, data: Partial<Account>) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  main: Wallet,
  savings: PiggyBank,
  investment: TrendingUp,
  debt: CreditCard,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400";

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

export default function AccountsOverview({
  accounts,
  onAddAccount,
  onDeleteAccount,
  onEditAccount,
}: AccountsOverviewProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("main");
  const [editBalance, setEditBalance] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);

  const startEdit = (account: Account) => {
    setEditId(account.id);
    setEditName(account.name);
    setEditType(account.type);
    setEditBalance(account.balance.toString());
    setEditInstitution(account.institution || "");
    setEditAccountNumber(account.accountNumber || "");
    setEditCreditLimit(account.creditLimit?.toString() || "");
    setEditColor(account.color);
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !onEditAccount) return;
    setLoading(true);
    try {
      await onEditAccount(editId, {
        name: editName,
        type: editType as Account["type"],
        balance: parseFloat(editBalance) || 0,
        institution: editInstitution || null,
        accountNumber: editAccountNumber || null,
        creditLimit: editType === "debt" && editCreditLimit ? parseFloat(editCreditLimit) : null,
        color: editColor,
      });
      setShowEdit(false);
      setEditId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Accounts
        </h2>
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {accounts.map((account) => {
          const Icon = typeIcons[account.type] || Wallet;
          const isDebt = account.balance < 0;

          return (
            <div
              key={account.id}
              className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${account.color}15` }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: account.color }}
                  />
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {account.type}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {account.name}
                </p>
                <p
                  className={`mt-1 text-xl font-bold ${
                    isDebt
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {formatCurrency(Math.abs(account.balance))}
                  {isDebt && (
                    <span className="ml-1 text-xs font-medium text-rose-400 dark:text-rose-500">
                      owed
                    </span>
                  )}
                </p>
                {account.type === "debt" && account.creditLimit && (
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    of {formatCurrency(account.creditLimit)} limit
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3 dark:border-slate-800">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {account.institution}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ****{account.accountNumber}
                  </span>
                  {onEditAccount && (
                    <button
                      onClick={() => startEdit(account)}
                      className="rounded-lg p-1 text-slate-300 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                      title="Edit account"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onDeleteAccount && (
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="rounded-lg p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                      title="Delete account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setEditId(null); }} title="Edit Account">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Name
            </label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Type
            </label>
            <select value={editType} onChange={(e) => setEditType(e.target.value)} className={inputClass}>
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
            <input type="number" step="0.01" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} className={inputClass} />
          </div>

          {editType === "debt" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Credit Limit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editCreditLimit}
                onChange={(e) => setEditCreditLimit(e.target.value)}
                placeholder="e.g., 35000"
                className={inputClass}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Institution
              </label>
              <input type="text" value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Last 4 Digits
              </label>
              <input type="text" maxLength={4} value={editAccountNumber} onChange={(e) => setEditAccountNumber(e.target.value)} className={inputClass} />
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
                  onClick={() => setEditColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    editColor === c ? "scale-110 ring-2 ring-offset-2 dark:ring-offset-slate-900" : ""
                  }`}
                  style={{ backgroundColor: c, outlineColor: editColor === c ? c : undefined }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !editName}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Save
            </button>
            <button
              type="button"
              onClick={() => { setShowEdit(false); setEditId(null); }}
              className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
