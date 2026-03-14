"use client";

import {
  Send,
  Plus,
  ArrowLeftRight,
  Receipt,
} from "lucide-react";

interface QuickActionsProps {
  onSendMoney: () => void;
  onAddFunds: () => void;
  onTransfer: () => void;
  onNewTransaction: () => void;
}

export default function QuickActions({
  onSendMoney,
  onAddFunds,
  onTransfer,
  onNewTransaction,
}: QuickActionsProps) {
  const actions = [
    {
      label: "Send Money",
      icon: Send,
      onClick: onSendMoney,
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      label: "Add Funds",
      icon: Plus,
      onClick: onAddFunds,
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      label: "Transfer",
      icon: ArrowLeftRight,
      onClick: onTransfer,
      color: "bg-violet-500 hover:bg-violet-600",
    },
    {
      label: "New Transaction",
      icon: Receipt,
      onClick: onNewTransaction,
      color: "bg-amber-500 hover:bg-amber-600",
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex items-center gap-2 rounded-xl ${action.color} px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md`}
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
