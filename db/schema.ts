import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// History table to store all Perplexity API queries and responses
export const history = sqliteTable("history", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Timestamp (stored as unix epoch milliseconds)
  timestamp: integer("timestamp").notNull(),

  // Request info
  command: text("command").notNull(), // search, research, academic, ask, code
  query: text("query").notNull(),
  model: text("model").notNull(),

  // Response info
  response: text("response").notNull(),
  citations: text("citations"), // JSON string of search results

  // Token usage
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),

  // Performance
  durationSeconds: real("duration_seconds"),
});

export type HistoryEntry = typeof history.$inferSelect;
export type NewHistoryEntry = typeof history.$inferInsert;
