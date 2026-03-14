import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const dbPath = process.env.DATABASE_PATH || join(process.cwd(), "sqlite.db");
console.log(`Initializing database at: ${dbPath}`);

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create migrations tracking table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Check if this is a pre-tracking database (has tables but no migration records)
const migrationCount = db.prepare("SELECT COUNT(*) as cnt FROM _migrations").get().cnt;
const existingTables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations'")
  .all()
  .map((r) => r.name);

// Read migration files
const migrationsDir = join(process.cwd(), "drizzle");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

// If tables exist but no migrations are tracked, detect which migrations were already applied
if (existingTables.length > 0 && migrationCount === 0) {
  console.log("Detected pre-tracking database. Determining already-applied migrations...");
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    // Check if any CREATE TABLE in this migration references a table that already exists
    const createMatches = sql.matchAll(/CREATE TABLE [`"]?(\w+)[`"]?/gi);
    let alreadyApplied = false;
    for (const match of createMatches) {
      if (existingTables.includes(match[1])) {
        alreadyApplied = true;
        break;
      }
    }
    if (alreadyApplied) {
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
      console.log(`Marked as already applied: ${file}`);
    }
  }
}

// Now apply any unapplied migrations
const applied = new Set(
  db.prepare("SELECT name FROM _migrations").all().map((r) => r.name)
);

let newCount = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`Skipping (already applied): ${file}`);
    continue;
  }
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  // Drizzle uses "--> statement-breakpoint" to separate statements
  const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    db.exec(stmt);
  }
  db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  console.log(`Applied migration: ${file}`);
  newCount++;
}

if (newCount === 0) {
  console.log("Database up to date, no new migrations.");
} else {
  console.log(`Applied ${newCount} new migration(s).`);
}

db.close();
