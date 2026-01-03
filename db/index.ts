import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Get the data directory - use ~/.pplx-cli for compiled binary compatibility
function getDataDir(): string {
  // Allow override via environment variable
  if (process.env.PPLX_DATA_DIR) {
    return process.env.PPLX_DATA_DIR;
  }

  // Use ~/.pplx-cli as the default data directory
  return join(homedir(), ".pplx-cli");
}

const DATA_DIR = getDataDir();
const DB_PATH = join(DATA_DIR, "history.db");

// Ensure the data directory exists (sync to avoid issues with top-level await in binary)
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

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

// Export the data directory path for use by history module
export function getHistoryDir(): string {
  const historyDir = join(DATA_DIR, "history");
  if (!existsSync(historyDir)) {
    mkdirSync(historyDir, { recursive: true });
  }
  return historyDir;
}
