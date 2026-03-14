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

  // Items for the selected day
  const selectedDayItems = selectedDay ? itemsByDay.get(selectedDay) || [] : [];

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

      {/* Selected day detail panel */}
      {selectedDay && (
        <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {ordinal(selectedDay)} of each month
          </h4>
          {selectedDayItems.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No items scheduled on this day
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    item.active
                      ? "border-slate-100 dark:border-slate-800"
                      : "border-slate-100 opacity-50 dark:border-slate-800"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {item.accountName}
                      {item.category ? ` · ${item.category}` : ""}
                      {item.lastProcessed ? ` · Last: ${item.lastProcessed}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${colors.amount}`}>
                      {colors.prefix}{formatCurrency(item.amount)}
                    </span>
                    {onToggleItem && (
                      <button
                        onClick={() => onToggleItem(item.id)}
                        className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                          item.active
                            ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        }`}
                      >
                        {item.active ? "Pause" : "Resume"}
                      </button>
                    )}
                    {onEditItem && (
                      <button
                        onClick={() => onEditItem(item.id)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    )}
                    {onDeleteItem && (
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
