"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DayPicker as RDayPicker } from "react-day-picker";
import { setDate } from "date-fns";
import Modal from "./Modal";
import RecurringCalendar from "./RecurringCalendar";
import type { RecurringExpense, Account, Transaction } from "@/db/schema";

interface RecurringExpensesProps {
  items: RecurringExpense[];
  accounts: Account[];
  transactions?: Transaction[];
  onUpdate?: () => void;
  readOnly?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400";

const categories = [
  "Bills & Utilities",
  "Rent",
  "Investments",
  "Insurance",
  "Subscriptions",
  "Education",
  "Other",
];

export default function RecurringExpenses({
  items,
  accounts,
  transactions = [],
  onUpdate,
  readOnly = false,
}: RecurringExpensesProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || "");
  const [category, setCategory] = useState("Bills & Utilities");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDay, setEditDay] = useState("");

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/recurring-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount),
          accountId: parseInt(accountId),
          category,
          dayOfMonth: parseInt(dayOfMonth),
        }),
      });
      setName("");
      setAmount("");
      setCategory("Bills & Utilities");
      setDayOfMonth("1");
      setShowAdd(false);
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditId(item.id);
    setEditName(item.name);
    setEditAmount(item.amount.toString());
    setEditAccountId(item.accountId.toString());
    setEditCategory(item.category);
    setEditDay(item.dayOfMonth.toString());
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setLoading(true);
    try {
      await fetch(`/api/recurring-expenses/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          amount: parseFloat(editAmount),
          accountId: parseInt(editAccountId),
          category: editCategory,
          dayOfMonth: parseInt(editDay),
        }),
      });
      setShowEdit(false);
      setEditId(null);
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await fetch(`/api/recurring-expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    onUpdate?.();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/recurring-expenses/${id}`, { method: "DELETE" });
    onUpdate?.();
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  if (readOnly) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // All debit transactions this month (includes both processed recurring and one-time)
    const monthlyDebits = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === "debit" && t.category !== "Transfer" && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const totalFromTransactions = monthlyDebits.reduce((sum, t) => sum + t.amount, 0);

    // Recurring that haven't been processed yet this month (pending)
    const currentMonthKey = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}`;
    const pendingRecurring = items.filter((i) => i.active && i.lastProcessed !== currentMonthKey);
    const pendingAmount = pendingRecurring.reduce((sum, i) => sum + i.amount, 0);

    const total = totalFromTransactions + pendingAmount;

    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-lg bg-rose-50 p-1.5 dark:bg-rose-950">
            <Receipt className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Monthly Expenses
          </p>
        </div>
        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
          -{formatCurrency(total)}
        </p>
        <div className="mt-2 space-y-0.5">
          {monthlyDebits.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {formatCurrency(totalFromTransactions)} spent ({monthlyDebits.length} transaction{monthlyDebits.length !== 1 ? "s" : ""})
            </p>
          )}
          {pendingRecurring.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {formatCurrency(pendingAmount)} pending ({pendingRecurring.length} upcoming)
            </p>
          )}
        </div>
      </div>
    );
  }

  const calendarItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    amount: item.amount,
    dayOfMonth: item.dayOfMonth,
    active: item.active,
    accountName: accountMap.get(item.accountId)?.name,
    category: item.category,
    lastProcessed: item.lastProcessed,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Monthly Expenses
          </h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <Receipt className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No recurring expenses set up yet
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
          >
            Add your first expense
          </button>
        </div>
      ) : (
        <RecurringCalendar
          items={calendarItems}
          variant="expense"
          selectedDay={selectedDay}
          onDayClick={handleDayClick}
          onEditItem={startEdit}
          onToggleItem={handleToggle}
          onDeleteItem={handleDelete}
        />
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Recurring Expense">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Rent, Netflix" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Deduct From</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Day of Month</label>
            <DayPickerField value={parseInt(dayOfMonth)} onChange={(d) => setDayOfMonth(d.toString())} variant="expense" />
          </div>
          <button
            type="submit"
            disabled={loading || !name || !amount}
            className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setEditId(null); }} title="Edit Recurring Expense">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
            <input type="number" step="0.01" min="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Deduct From</label>
            <select value={editAccountId} onChange={(e) => setEditAccountId(e.target.value)} className={inputClass}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Day of Month</label>
            <DayPickerField value={parseInt(editDay)} onChange={(d) => setEditDay(d.toString())} variant="expense" />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
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

function DayPickerField({ value, onChange, variant }: { value: number; onChange: (day: number) => void; variant: "income" | "expense" }) {
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const selectedDate = setDate(pickerMonth, value);

  const accentColors = variant === "income"
    ? { selected: "bg-emerald-600 text-white rounded-lg", today: "bg-emerald-50 dark:bg-emerald-950 rounded-lg" }
    : { selected: "bg-rose-600 text-white rounded-lg", today: "bg-rose-50 dark:bg-rose-950 rounded-lg" };

  return (
    <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
      <RDayPicker
        mode="single"
        month={pickerMonth}
        onMonthChange={setPickerMonth}
        hideNavigation
        selected={selectedDate}
        onSelect={(date) => {
          if (date) onChange(date.getDate());
        }}
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_caption: "flex justify-center mb-2",
          caption_label: "text-xs font-semibold text-slate-700 dark:text-slate-300",
          weekdays: "grid grid-cols-7",
          weekday: "text-[10px] font-medium text-slate-400 dark:text-slate-500 text-center",
          week: "grid grid-cols-7",
          weeks: "grid",
          day: "flex h-8 items-center justify-center",
          day_button: "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
          selected: accentColors.selected,
          today: accentColors.today,
          outside: "text-slate-300 dark:text-slate-700",
        }}
        components={{
          MonthCaption: ({ calendarMonth }) => {
            const label = calendarMonth.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            return (
              <div className="mb-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
                  className="rounded-lg p-0.5 text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                <button
                  type="button"
                  onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                  className="rounded-lg p-0.5 text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          },
        }}
      />
    </div>
  );
}
