"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import NetWorthCard from "@/components/NetWorthCard";
import StatCards from "@/components/StatCards";
import AccountsOverview from "@/components/AccountsOverview";
import TransactionList from "@/components/TransactionList";
import SpendingChart from "@/components/SpendingChart";
import GoalsTracker from "@/components/GoalsTracker";
import AddAccountModal from "@/components/AddAccountModal";
import AddTransactionModal from "@/components/AddTransactionModal";
import AddGoalModal from "@/components/AddGoalModal";
import TransferModal from "@/components/TransferModal";
import RecurringIncome from "@/components/RecurringIncome";
import RecurringExpenses from "@/components/RecurringExpenses";
import ThemeToggle from "@/components/ThemeToggle";
import type { Account, Transaction, Goal, RecurringIncome as RecurringIncomeType, RecurringExpense } from "@/db/schema";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringIncomeType[]>([]);
  const [recurringExpenseItems, setRecurringExpenseItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Delete this account? All linked transactions will also be deleted.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleEditAccount = async (id: number, data: Partial<Account>) => {
    await fetch(`/api/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchData();
  };

  const fetchData = useCallback(async () => {
    try {
      // Process any due recurring items first
      await Promise.all([
        fetch("/api/recurring-income/process", { method: "POST" }),
        fetch("/api/recurring-expenses/process", { method: "POST" }),
      ]);

      const [accountsRes, transactionsRes, goalsRes, recurringRes, recurringExpRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/transactions?limit=50"),
        fetch("/api/goals"),
        fetch("/api/recurring-income"),
        fetch("/api/recurring-expenses"),
      ]);
      const [accountsData, transactionsData, goalsData, recurringData, recurringExpData] = await Promise.all([
        accountsRes.json(),
        transactionsRes.json(),
        goalsRes.json(),
        recurringRes.json(),
        recurringExpRes.json(),
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
      setGoals(goalsData);
      setRecurringItems(recurringData);
      setRecurringExpenseItems(recurringExpData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading your finances...
          </p>
        </div>
      </div>
    );
  }

  const tabLabels: Record<string, string> = {
    dashboard: "Dashboard",
    income: "Monthly Income",
    expenses: "Monthly Expenses",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "accounts":
        return (
          <div className="space-y-6">
            <NetWorthCard accounts={accounts} />
            <AccountsOverview
              accounts={accounts}
              onAddAccount={() => setShowAddAccount(true)}
              onDeleteAccount={handleDeleteAccount}
              onEditAccount={handleEditAccount}
            />
          </div>
        );
      case "transactions":
        return (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <TransactionList
                transactions={transactions}
                accounts={accounts}
                onAddTransaction={() => setShowAddTransaction(true)}
              />
            </div>
            <div className="lg:col-span-2">
              <SpendingChart transactions={transactions} />
            </div>
          </div>
        );
      case "goals":
        return (
          <GoalsTracker
            goals={goals}
            onAddGoal={() => setShowAddGoal(true)}
          />
        );
      case "income":
        return (
          <RecurringIncome
            items={recurringItems}
            accounts={accounts}
            onUpdate={fetchData}
          />
        );
      case "expenses":
        return (
          <RecurringExpenses
            items={recurringExpenseItems}
            accounts={accounts}
            onUpdate={fetchData}
          />
        );
      default:
        return (
          <div className="space-y-6">
            <NetWorthCard accounts={accounts} />

            <div className="grid gap-4 lg:grid-cols-3">
              <RecurringIncome
                items={recurringItems}
                accounts={accounts}
                readOnly
              />
              <RecurringExpenses
                items={recurringExpenseItems}
                accounts={accounts}
                readOnly
              />
              <StatCards transactions={transactions} />
            </div>

            <AccountsOverview accounts={accounts} />

            <SpendingChart transactions={transactions} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-60"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 px-8 py-4 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {tabLabels[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                IP
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">{renderContent()}</div>
      </main>

      <AddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAdd={fetchData}
      />
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onAdd={fetchData}
        accounts={accounts}
      />
      <AddGoalModal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onAdd={fetchData}
      />
      <TransferModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        onTransfer={fetchData}
        accounts={accounts}
      />
    </div>
  );
}
