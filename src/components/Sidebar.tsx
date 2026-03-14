"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  CalendarClock,
  Receipt,
  Settings,
  ChevronLeft,
  DollarSign,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Wallet },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "goals", label: "Goals", icon: Target },
  { id: "income", label: "Monthly Income", icon: CalendarClock },
  { id: "expenses", label: "Monthly Expenses", icon: Receipt },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggle,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col bg-slate-900 text-white transition-all duration-300 dark:bg-slate-950 dark:border-r dark:border-slate-800",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
          <DollarSign className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">FinanceHub</span>
        )}
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/50 p-3">
        <button
          onClick={() => {}}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 shadow-lg transition-colors hover:text-white"
      >
        <ChevronLeft
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
