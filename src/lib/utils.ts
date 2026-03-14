import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
  }).format(amount).trim();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getAccountTypeIcon(type: string): string {
  switch (type) {
    case "main":
      return "Wallet";
    case "savings":
      return "PiggyBank";
    case "investment":
      return "TrendingUp";
    case "debt":
      return "CreditCard";
    default:
      return "DollarSign";
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Food & Dining": "#f97316",
    Shopping: "#8b5cf6",
    Transportation: "#3b82f6",
    Entertainment: "#ec4899",
    "Bills & Utilities": "#ef4444",
    Healthcare: "#14b8a6",
    Income: "#10b981",
    Transfer: "#6366f1",
    Education: "#f59e0b",
    Travel: "#06b6d4",
    "Personal Care": "#d946ef",
    Other: "#64748b",
  };
  return colors[category] || "#64748b";
}
