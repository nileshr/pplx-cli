import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";
import { mkdir } from "fs/promises";
import { dirname } from "path";

// Database file path
const DB_PATH = new URL("../data/pplx-history.db", import.meta.url).pathname;

// Ensure the data directory exists
await mkdir(dirname(DB_PATH), { recursive: true });

// Initialize SQLite database with Bun's native SQLite
const sqlite = new Database(DB_PATH, { create: true });

// Enable WAL mode for better performance
sqlite.exec("PRAGMA journal_mode = WAL");

// Create the database instance with schema
export const db = drizzle(sqlite, { schema });

// Initialize the database schema
export function initializeDatabase() {
  // Create table if not exists using raw SQL
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      command TEXT NOT NULL,
      query TEXT NOT NULL,
      model TEXT NOT NULL,
      response TEXT NOT NULL,
      citations TEXT,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      total_tokens INTEGER,
      duration_seconds REAL
    )
  `);

  // Create index on timestamp for faster queries
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC)
  `);
}

// Export for direct access if needed
export { sqlite };
