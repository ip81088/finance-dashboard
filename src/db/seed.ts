import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { accounts, transactions, goals } from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "sqlite.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  db.delete(transactions).run();
  db.delete(goals).run();
  db.delete(accounts).run();

  // Create accounts
  const accountData = [
    {
      name: "Main Checking",
      type: "main" as const,
      balance: 4892.5,
      institution: "Wells Fargo",
      accountNumber: "4521",
      color: "#3b82f6",
    },
    {
      name: "High-Yield Savings",
      type: "savings" as const,
      balance: 15340.0,
      institution: "Marcus",
      accountNumber: "8834",
      color: "#10b981",
    },
    {
      name: "Investment Portfolio",
      type: "investment" as const,
      balance: 52180.75,
      institution: "Vanguard",
      accountNumber: "7712",
      color: "#8b5cf6",
    },
    {
      name: "Chase Sapphire",
      type: "debt" as const,
      balance: -2450.3,
      institution: "Chase",
      accountNumber: "9901",
      color: "#ef4444",
    },
    {
      name: "Student Loan",
      type: "debt" as const,
      balance: -18500.0,
      institution: "SoFi",
      accountNumber: "3356",
      color: "#f97316",
    },
    {
      name: "Emergency Fund",
      type: "savings" as const,
      balance: 10000.0,
      institution: "Ally",
      accountNumber: "6678",
      color: "#14b8a6",
    },
    {
      name: "Roth IRA",
      type: "investment" as const,
      balance: 28750.0,
      institution: "Fidelity",
      accountNumber: "2245",
      color: "#6366f1",
    },
  ];

  const insertedAccounts = db.insert(accounts).values(accountData).returning().all();
  console.log(`Created ${insertedAccounts.length} accounts`);

  // Create transactions (last 30 days)
  const now = new Date();
  const txData = [
    { accountId: 1, amount: 3500, type: "credit" as const, category: "Income", description: "Salary Deposit", daysAgo: 1 },
    { accountId: 1, amount: 85.5, type: "debit" as const, category: "Food & Dining", description: "Whole Foods Market", daysAgo: 1 },
    { accountId: 1, amount: 12.99, type: "debit" as const, category: "Entertainment", description: "Netflix Subscription", daysAgo: 2 },
    { accountId: 1, amount: 45.0, type: "debit" as const, category: "Transportation", description: "Gas Station", daysAgo: 2 },
    { accountId: 4, amount: 234.5, type: "debit" as const, category: "Shopping", description: "Amazon Purchase", daysAgo: 3 },
    { accountId: 1, amount: 150.0, type: "debit" as const, category: "Bills & Utilities", description: "Electric Bill", daysAgo: 3 },
    { accountId: 1, amount: 62.3, type: "debit" as const, category: "Food & Dining", description: "DoorDash Order", daysAgo: 4 },
    { accountId: 4, amount: 89.99, type: "debit" as const, category: "Shopping", description: "Target", daysAgo: 5 },
    { accountId: 1, amount: 200.0, type: "debit" as const, category: "Healthcare", description: "Doctor Visit Copay", daysAgo: 5 },
    { accountId: 1, amount: 35.0, type: "debit" as const, category: "Entertainment", description: "Movie Tickets", daysAgo: 6 },
    { accountId: 2, amount: 500.0, type: "credit" as const, category: "Transfer", description: "Savings Transfer", daysAgo: 7 },
    { accountId: 1, amount: 500.0, type: "debit" as const, category: "Transfer", description: "Transfer to Savings", daysAgo: 7 },
    { accountId: 1, amount: 3500, type: "credit" as const, category: "Income", description: "Salary Deposit", daysAgo: 15 },
    { accountId: 1, amount: 1200.0, type: "debit" as const, category: "Bills & Utilities", description: "Rent Payment", daysAgo: 15 },
    { accountId: 1, amount: 78.45, type: "debit" as const, category: "Food & Dining", description: "Trader Joe's", daysAgo: 16 },
    { accountId: 4, amount: 156.0, type: "debit" as const, category: "Shopping", description: "Best Buy", daysAgo: 17 },
    { accountId: 1, amount: 55.0, type: "debit" as const, category: "Transportation", description: "Uber Rides", daysAgo: 18 },
    { accountId: 1, amount: 120.0, type: "debit" as const, category: "Personal Care", description: "Hair Salon", daysAgo: 19 },
    { accountId: 1, amount: 42.0, type: "debit" as const, category: "Food & Dining", description: "Chipotle", daysAgo: 20 },
    { accountId: 7, amount: 500.0, type: "credit" as const, category: "Investment", description: "Monthly IRA Contribution", daysAgo: 20 },
    { accountId: 3, amount: 1250.0, type: "credit" as const, category: "Investment", description: "Stock Dividends", daysAgo: 22 },
    { accountId: 5, amount: 350.0, type: "debit" as const, category: "Bills & Utilities", description: "Student Loan Payment", daysAgo: 25 },
    { accountId: 1, amount: 250.0, type: "credit" as const, category: "Income", description: "Freelance Payment", daysAgo: 26 },
    { accountId: 1, amount: 95.0, type: "debit" as const, category: "Entertainment", description: "Concert Tickets", daysAgo: 27 },
    { accountId: 1, amount: 180.0, type: "debit" as const, category: "Food & Dining", description: "Restaurant Dinner", daysAgo: 28 },
  ];

  const transactionValues = txData.map((tx) => {
    const date = new Date(now);
    date.setDate(date.getDate() - tx.daysAgo);
    return {
      accountId: tx.accountId,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      date: date.toISOString().split("T")[0],
    };
  });

  db.insert(transactions).values(transactionValues).run();
  console.log(`Created ${transactionValues.length} transactions`);

  // Create goals
  const goalData = [
    {
      name: "Emergency Fund",
      type: "savings" as const,
      targetAmount: 15000,
      currentAmount: 10000,
      deadline: "2026-06-30",
      accountId: 6,
    },
    {
      name: "Vacation Fund",
      type: "savings" as const,
      targetAmount: 5000,
      currentAmount: 2300,
      deadline: "2026-08-15",
    },
    {
      name: "Pay Off Credit Card",
      type: "debt_payoff" as const,
      targetAmount: 2450.3,
      currentAmount: 1200,
      deadline: "2026-04-30",
    },
    {
      name: "House Down Payment",
      type: "savings" as const,
      targetAmount: 60000,
      currentAmount: 15340,
      deadline: "2027-12-31",
    },
    {
      name: "Max Out Roth IRA",
      type: "investment" as const,
      targetAmount: 7000,
      currentAmount: 4500,
      deadline: "2026-12-31",
      accountId: 7,
    },
  ];

  db.insert(goals).values(goalData).run();
  console.log(`Created ${goalData.length} goals`);

  console.log("Seed complete!");
  sqlite.close();
}

seed().catch(console.error);
