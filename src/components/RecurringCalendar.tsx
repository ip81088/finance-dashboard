"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { setDate, lastDayOfMonth, getDate } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CalendarItem {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
  accountName?: string;
  category?: string;
  lastProcessed?: string | null;
}

interface RecurringCalendarProps {
  items: CalendarItem[];
  onDayClick?: (day: number) => void;
  selectedDay?: number | null;
  variant: "income" | "expense";
  onEditItem?: (id: number) => void;
  onToggleItem?: (id: number) => void;
  onDeleteItem?: (id: number) => void;
}

export default function RecurringCalendar({
  items,
  onDayClick,
  selectedDay,
  variant,
  onEditItem,
  onToggleItem,
  onDeleteItem,
}: RecurringCalendarProps) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const daysInMonth = getDate(lastDayOfMonth(viewMonth));

  // Group items by effective day for this month
  const itemsByDay = new Map<number, CalendarItem[]>();
  for (const item of items) {
    const day = Math.min(item.dayOfMonth, daysInMonth);
    if (!itemsByDay.has(day)) itemsByDay.set(day, []);
    itemsByDay.get(day)!.push(item);
  }

  // Build list of dates that have items, for dot rendering
  const datesWithItems: Date[] = [];
  for (const [day] of itemsByDay) {
    const d = setDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1), day);
    datesWithItems.push(d);
  }

  const colorMap = {
    income: {
      dot: "bg-emerald-500",
      selectedBg: "bg-emerald-50 dark:bg-emerald-950",
      selectedBorder: "border-emerald-300 dark:border-emerald-700",
      badge: "text-emerald-600 dark:text-emerald-400",
      amount: "text-emerald-600 dark:text-emerald-400",
      prefix: "+",
      accent: "text-emerald-600",
    },
    expense: {
      dot: "bg-rose-500",
      selectedBg: "bg-rose-50 dark:bg-rose-950",
      selectedBorder: "border-rose-300 dark:border-rose-700",
      badge: "text-rose-600 dark:text-rose-400",
      amount: "text-rose-600 dark:text-rose-400",
      prefix: "-",
      accent: "text-rose-600",
    },
  };

  const colors = colorMap[variant];

  // Sorted days that have items
  const sortedDays = Array.from(itemsByDay.keys()).sort((a, b) => a - b);

  // For past/today styling
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === viewMonth.getFullYear() && now.getMonth() === viewMonth.getMonth();
  const isPastMonth = viewMonth.getFullYear() < now.getFullYear() || (viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() < now.getMonth());
  const today = now.getDate();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // The currently "selected" date for react-day-picker
  const selectedDate = selectedDay
    ? new Date(viewMonth.getFullYear(), viewMonth.getMonth(), selectedDay)
    : undefined;

  return (
    <div className="flex gap-4 items-start">
      <div className="inline-block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <DayPicker
          mode="single"
          month={viewMonth}
          onMonthChange={setViewMonth}
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              const day = getDate(date);
              onDayClick?.(day);
            }
          }}
          hideNavigation
          modifiers={{
            hasItems: datesWithItems,
          }}
          classNames={{
            root: "",
            months: "",
            month: "",
            month_caption: "flex justify-center mb-3",
            caption_label: "text-sm font-semibold text-slate-900 dark:text-slate-100",
            weekdays: "grid grid-cols-7 mb-1",
            weekday: "py-1 text-xs font-medium text-slate-400 dark:text-slate-500 text-center",
            week: "grid grid-cols-7",
            weeks: "grid",
            day: "relative flex h-12 items-center justify-center",
            day_button: "relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-sm transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50",
            selected: `${colors.selectedBg} border ${colors.selectedBorder} rounded-lg`,
            today: "bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-900 dark:text-slate-100",
            outside: "text-slate-300 dark:text-slate-700",
            disabled: "text-slate-300 dark:text-slate-700",
          }}
          components={{
            MonthCaption: ({ calendarMonth }) => {
              const label = calendarMonth.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
              return (
                <div className="mb-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    className="rounded-lg p-1 text-slate-900 transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    className="rounded-lg p-1 text-slate-900 transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            },
            DayButton: ({ day, ...props }) => {
              const dayNum = getDate(day.date);
              const dayMonth = day.date.getMonth();
              const viewingMonth = viewMonth.getMonth();
              const dayItems = dayMonth === viewingMonth ? (itemsByDay.get(dayNum) || []) : [];
              const hasItems = dayItems.length > 0;

              return (
                <button {...props}>
                  <span className={hasItems ? `font-semibold ${colors.badge}` : ""}>
                    {dayNum}
                  </span>
                  {hasItems && (
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {dayItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.active ? colors.dot : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            },
          }}
        />
      </div>

      {/* Month summary panel — always visible */}
      <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {viewMonth.toLocaleDateString("en-US", { month: "long" })} Summary
        </h4>
        {sortedDays.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No items this month
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {sortedDays.map((day) => {
              const dayItems = itemsByDay.get(day)!;
              const isPast = isPastMonth || (isCurrentMonth && day < today);
              const isToday = isCurrentMonth && day === today;

              return (
                <div key={day}>
                  <div className={`flex items-center gap-2 px-2 py-1 ${isToday ? "rounded-lg bg-slate-100 dark:bg-slate-800" : ""}`}>
                    <span className={`text-xs font-semibold w-8 ${isPast ? "text-slate-400 dark:text-slate-500" : isToday ? "text-slate-900 dark:text-slate-100" : colors.badge}`}>
                      {ordinal(day)}
                    </span>
                    <div className="flex-1 space-y-1">
                      {dayItems.map((item) => {
                        const wasProcessed = item.lastProcessed === currentMonthStr && isPast;

                        return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                            !item.active
                              ? "border-slate-100 opacity-50 dark:border-slate-800"
                              : isPast
                                ? "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30"
                                : "border-slate-100 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${item.active ? colors.dot : "bg-slate-300 dark:bg-slate-600"}`} />
                            <div>
                              <p className={`text-sm font-medium ${isPast ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"}`}>
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {item.accountName}
                                {item.category ? ` · ${item.category}` : ""}
                                {wasProcessed && " · Processed"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold ${isPast ? "text-slate-400 dark:text-slate-500" : colors.amount}`}>
                              {colors.prefix}{formatCurrency(item.amount)}
                            </span>
                            {!isPast && onToggleItem && (
                              <button
                                onClick={() => onToggleItem(item.id)}
                                className={`rounded-lg px-1.5 py-0.5 text-xs font-medium transition-colors ${
                                  item.active
                                    ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                }`}
                              >
                                {item.active ? "Pause" : "Resume"}
                              </button>
                            )}
                            {!isPast && onEditItem && (
                              <button
                                onClick={() => onEditItem(item.id)}
                                className="rounded-lg px-1.5 py-0.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Edit
                              </button>
                            )}
                            {!isPast && onDeleteItem && (
                              <button
                                onClick={() => onDeleteItem(item.id)}
                                className="rounded-lg px-1.5 py-0.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
