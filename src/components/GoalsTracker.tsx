"use client";

import { formatCurrency } from "@/lib/utils";
import { Target, Plus, Calendar, TrendingUp, PiggyBank, CreditCard } from "lucide-react";
import type { Goal } from "@/db/schema";

interface GoalsTrackerProps {
  goals: Goal[];
  onAddGoal?: () => void;
}

const typeConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  savings: { icon: PiggyBank, color: "#10b981", bg: "#10b98115" },
  investment: { icon: TrendingUp, color: "#6366f1", bg: "#6366f115" },
  debt_payoff: { icon: CreditCard, color: "#ef4444", bg: "#ef444415" },
};

export default function GoalsTracker({ goals, onAddGoal }: GoalsTrackerProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Financial Goals
          </h2>
        </div>
        {onAddGoal && (
          <button
            onClick={onAddGoal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = Math.min(
            (goal.currentAmount / goal.targetAmount) * 100,
            100
          );
          const config = typeConfig[goal.type] || typeConfig.savings;
          const Icon = config.icon;
          const remaining = goal.targetAmount - goal.currentAmount;

          let daysLeft = null;
          if (goal.deadline) {
            const deadlineDate = new Date(goal.deadline);
            const today = new Date();
            daysLeft = Math.ceil(
              (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
          }

          return (
            <div
              key={goal.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: config.color }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {goal.name}
                    </p>
                    <p className="text-xs capitalize text-slate-400 dark:text-slate-500">
                      {goal.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    of {formatCurrency(goal.targetAmount)}
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-medium" style={{ color: config.color }}>
                    {progress.toFixed(0)}% complete
                  </span>
                  {remaining > 0 && (
                    <span className="text-slate-400 dark:text-slate-500">
                      {formatCurrency(remaining)} remaining
                    </span>
                  )}
                </div>

                {daysLeft !== null && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {daysLeft > 0
                        ? `${daysLeft} days left`
                        : "Deadline passed"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
