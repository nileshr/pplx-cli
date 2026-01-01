#!/usr/bin/env bun
import { env } from "bun";
import { initializeDatabase } from "./db";
import {
  saveHistory,
  getRecentHistoryWithHashes,
  clearHistory,
  getHistoryByHash,
  getMarkdownContent,
  getMarkdownFilePath,
  generateHash,
} from "./history";
import pkg from "./package.json";

// Perplexity API configuration
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// Available Perplexity models
const MODELS = {
  sonar: "sonar", // Lightweight search
  "sonar-pro": "sonar-pro", // Advanced search
  "sonar-deep": "sonar-deep-research", // Exhaustive research
  "sonar-reasoning": "sonar-reasoning-pro", // Premier reasoning
} as const;

type ModelKey = keyof typeof MODELS;

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: "day" | "week" | "month" | "year";
  search_mode?: "academic" | "sec" | "web";
}

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  search_results?: Array<{
    title: string;
    url: string;
    date?: string;
  }>;
}

// Parse options from args
function parseOptions(args: string[]): {
  query: string;
  model?: ModelKey;
  recent?: "day" | "week" | "month" | "year";
} {
  let model: ModelKey | undefined;
  let recent: "day" | "week" | "month" | "year" | undefined;
  const queryParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--model" && nextArg) {
      const m = nextArg.toLowerCase() as ModelKey;
      if (m in MODELS) model = m;
      i++; // Skip next arg since we consumed it
    } else if (arg === "--recent" && nextArg) {
      const r = nextArg.toLowerCase();
      if (["day", "week", "month", "year"].includes(r)) {
        recent = r as "day" | "week" | "month" | "year";
      }
      i++; // Skip next arg since we consumed it
    } else if (arg) {
      queryParts.push(arg);
    }
  }

  return {
    query: queryParts.join(" ").replace(/^["']|["']$/g, ""),
    model,
    recent,
  };
}

// Make API request to Perplexity
async function callPerplexityAPI(
  apiKey: string,
  request: PerplexityRequest,
): Promise<{ success: boolean; data?: PerplexityResponse; error?: string }> {
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error (${response.status}): ${errorText}`,
      };
    }

    const data = (await response.json()) as PerplexityResponse;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Format citations from search results
function formatCitations(
  searchResults?: PerplexityResponse["search_results"],
): string {
  if (!searchResults || searchResults.length === 0) return "";

  const citations = searchResults
    .slice(0, 5)
    .map((result, idx) => `[${idx + 1}] ${result.title}\n    ${result.url}`)
    .join("\n");

  return `\n\n📚 **Sources:**\n${citations}`;
}

async function runRequest(
  apiKey: string,
  request: PerplexityRequest,
  label: string,
  command: string,
  query: string,
) {
  console.log(`\n⏳ ${label}...`);
  const start = performance.now();

  const result = await callPerplexityAPI(apiKey, request);
  const end = performance.now();
  const durationSeconds = (end - start) / 1000;
  const duration = durationSeconds.toFixed(2);

  if (result.success && result.data) {
    const content = result.data.choices[0]?.message?.content || "No response";
    const citations = formatCitations(result.data.search_results);
    const tokens = result.data.usage;

    console.log("\n" + "=".repeat(50));
    console.log(content);
    console.log("=".repeat(50));
    if (citations) console.log(citations);

    console.log(
      `\n📊 Stats: ${tokens.total_tokens} tokens (${tokens.prompt_tokens} prompt + ${tokens.completion_tokens} completion) | ⏱️  ${duration}s`,
    );

    // Save to history
    try {
      await saveHistory({
        query,
        command,
        model: request.model,
        response: content,
        citations: result.data.search_results,
        promptTokens: tokens.prompt_tokens,
        completionTokens: tokens.completion_tokens,
        totalTokens: tokens.total_tokens,
        durationSeconds: parseFloat(duration), // Ensure it's a number
      });
      console.log("📁 Saved to history");
    } catch (historyError) {
      console.error("⚠️  Failed to save history:", historyError);
    }
  } else {
    console.error(`\n❌ Error: ${result.error}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Perplexity CLI - AI Search & Research v${pkg.version}

Usage:
  pplx <command> [options] [query]

Commands:
  search <query>          Search the web
  research <topic>        Deep research
  academic <query>        Search academic sources
  ask <question>          Ask a general question
  code <question>         Get coding help
  history                 View recent queries (shows hash for each entry)
  history view <hash>     View full markdown of a specific query
  clear-history           Clear all history
  help                    Show this help message

Options:
  -v, --version           Show version number
  -h, --help              Show this help message
  --model <model>         Select model (sonar, sonar-pro, sonar-deep, sonar-reasoning)
  --recent <filter>       Filter by recency (day, week, month, year)

Examples:
  pplx search "latest ai news" --recent week
  pplx research "quantum computing advances" --model sonar-deep
  pplx code "how to center a div"
  pplx history view 1     View history entry with hash '1'
`);
}

async function main() {
  // Initialize the database
  initializeDatabase();

  const args = process.argv.slice(2);
  const apiKey = env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;

  // Check for version flag
  if (args.includes("-v") || args.includes("--version")) {
    console.log(`pplx-cli v${pkg.version}`);
    process.exit(0);
  }

  // Check for help flag
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  if (!apiKey) {
    console.error("❌ Error: PERPLEXITY_API_KEY environment variable not set.");
    console.error(
      "Get your API key from: https://www.perplexity.ai/settings/api",
    );
    process.exit(1);
  }

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = args[0]?.toLowerCase() ?? "";
  const restArgs = args.slice(1);

  // Parse options for the command
  const { query, model, recent } = parseOptions(restArgs);

  // If command is not one of the specific ones, treat the whole args as a search query
  if (
    ![
      "search",
      "research",
      "academic",
      "ask",
      "code",
      "help",
      "history",
      "clear-history",
    ].includes(command)
  ) {
    // Re-parse including the first arg as part of the query
    const opts = parseOptions(args);
    await runRequest(
      apiKey,
      {
        model: MODELS[opts.model || "sonar"],
        messages: [
          {
            role: "system",
            content:
              "Be precise and helpful. Provide comprehensive answers with sources.",
          },
          { role: "user", content: opts.query },
        ],
        max_tokens: 2048,
        temperature: 0.2,
        search_recency_filter: opts.recent,
      },
      "Searching",
      "search",
      opts.query,
    );
    return;
  }

  if (command === "help") {
    printHelp();
    return;
  }

  // Handle history command
  if (command === "history") {
    // Check for subcommand: pplx history view <hash>
    const subCommand = restArgs[0]?.toLowerCase();

    if (subCommand === "view") {
      const hash = restArgs[1];
      if (!hash) {
        console.error(
          "❌ Error: Please provide a hash. Usage: pplx history view <hash>",
        );
        process.exit(1);
      }

      const entry = await getHistoryByHash(hash);
      if (!entry) {
        console.error(`❌ Error: No history entry found with hash '${hash}'`);
        process.exit(1);
      }

      const markdown = getMarkdownContent(entry);
      if (markdown) {
        console.log(markdown);
      } else {
        // Fallback: display from database
        console.log(`# ${entry.query}\n`);
        console.log(
          `> **Query executed on ${new Date(entry.timestamp).toLocaleString()}**\n`,
        );
        console.log("---\n");
        console.log("## 💬 Response\n");
        console.log(entry.response);
        console.log("\n---");
        console.log(`\n📊 Model: ${entry.model} | Command: ${entry.command}`);
      }
      return;
    }

    // Default: list recent history
    const entries = await getRecentHistoryWithHashes(10);
    if (entries.length === 0) {
      console.log(
        "\n📭 No history found. Start making queries to build your history!",
      );
      return;
    }

    console.log("\n📜 Recent Queries:\n");
    for (const entry of entries) {
      const date = new Date(entry.timestamp).toLocaleString();
      const filepath = getMarkdownFilePath(entry);
      console.log(`  📌 [${entry.hash}] [${entry.command}] ${entry.query}`);
      console.log(
        `     🕐 ${date} | 🔤 ${entry.totalTokens} tokens | ⏱️  ${entry.durationSeconds}s`,
      );
      if (filepath) {
        console.log(`     📄 ${filepath}`);
      }
      console.log();
    }
    console.log(
      "💡 Tip: Use 'pplx history view <hash>' to view full details\n",
    );
    return;
  }

  if (command === "clear-history") {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "⚠️  Are you sure you want to clear all history? (y/N) ",
      async (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          await clearHistory();
          console.log("🗑️  History cleared.");
        } else {
          console.log("❌ Operation cancelled.");
        }
        rl.close();
        process.exit(0); // Exit after readline close
      },
    );
    return;
  }

  if (!query) {
    console.error(`❌ Error: Please provide a query for '${command}'.`);
    process.exit(1);
  }

  switch (command) {
    case "search":
    case "ask":
      await runRequest(
        apiKey,
        {
          model: MODELS[model || "sonar"],
          messages: [
            {
              role: "system",
              content:
                "Be precise and helpful. Provide comprehensive answers with sources.",
            },
            { role: "user", content: query },
          ],
          max_tokens: 2048,
          temperature: 0.2,
          search_recency_filter: recent,
        },
        command === "ask" ? "Thinking" : "Searching",
        command,
        query,
      );
      break;

    case "research":
      await runRequest(
        apiKey,
        {
          model: MODELS[model || "sonar-deep"],
          messages: [
            {
              role: "system",
              content:
                "Be precise and helpful. Provide comprehensive answers with sources.",
            },
            { role: "user", content: query },
          ],
          max_tokens: 2048,
          temperature: 0.2,
          search_recency_filter: recent,
        },
        "Deep Researching",
        "research",
        query,
      );
      break;

    case "academic":
      await runRequest(
        apiKey,
        {
          model: MODELS[model || "sonar-pro"],
          messages: [
            {
              role: "system",
              content:
                "You are a research assistant. Focus on peer-reviewed academic sources and scholarly publications. Cite your sources properly.",
            },
            { role: "user", content: query },
          ],
          max_tokens: 2048,
          temperature: 0.1,
          search_mode: "academic",
          search_recency_filter: recent,
        },
        "Academic Search",
        "academic",
        query,
      );
      break;

    case "code":
      await runRequest(
        apiKey,
        {
          model: MODELS[model || "sonar-pro"],
          messages: [
            {
              role: "system",
              content:
                "You are an expert programmer. Provide clear, working code examples with explanations. Reference documentation and best practices.",
            },
            { role: "user", content: `Coding question: ${query}` },
          ],
          max_tokens: 4096,
          temperature: 0.2,
          search_domain_filter: [
            "stackoverflow.com",
            "github.com",
            "developer.mozilla.org",
            "docs.python.org",
            "nodejs.org",
            "typescriptlang.org",
          ],
        },
        "Generating Code",
        "code",
        query,
      );
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
