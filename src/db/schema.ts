import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["main", "savings", "investment", "debt"] }).notNull(),
  balance: real("balance").notNull().default(0),
  institution: text("institution"),
  accountNumber: text("account_number"),
  creditLimit: real("credit_limit"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  amount: real("amount").notNull(),
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["savings", "investment", "debt_payoff"] }).notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  deadline: text("deadline"),
  accountId: integer("account_id").references(() => accounts.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const recurringIncome = sqliteTable("recurring_income", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  dayOfMonth: integer("day_of_month").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastProcessed: text("last_processed"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type RecurringIncome = typeof recurringIncome.$inferSelect;
export type NewRecurringIncome = typeof recurringIncome.$inferInsert;

export const recurringExpenses = sqliteTable("recurring_expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  category: text("category").notNull().default("Bills & Utilities"),
  dayOfMonth: integer("day_of_month").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastProcessed: text("last_processed"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type NewRecurringExpense = typeof recurringExpenses.$inferInsert;
