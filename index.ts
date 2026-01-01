#!/usr/bin/env bun
import { env } from "bun";

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
    if (args[i] === "--model" && args[i + 1]) {
      const m = args[++i].toLowerCase() as ModelKey;
      if (m in MODELS) model = m;
    } else if (args[i] === "--recent" && args[i + 1]) {
      const r = args[++i].toLowerCase();
      if (["day", "week", "month", "year"].includes(r)) {
        recent = r as "day" | "week" | "month" | "year";
      }
    } else {
      queryParts.push(args[i]);
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

async function runRequest(apiKey: string, request: PerplexityRequest, label: string) {
    console.log(`\n⏳ ${label}...`);
    const start = performance.now();
    
    const result = await callPerplexityAPI(apiKey, request);
    const end = performance.now();
    const duration = ((end - start) / 1000).toFixed(2);

    if (result.success && result.data) {
        const content = result.data.choices[0]?.message?.content || "No response";
        const citations = formatCitations(result.data.search_results);
        const tokens = result.data.usage;

        console.log("\n" + "=".repeat(50));
        console.log(content);
        console.log("=".repeat(50));
        if (citations) console.log(citations);
        
        console.log(`\n📊 Stats: ${tokens.total_tokens} tokens (${tokens.prompt_tokens} prompt + ${tokens.completion_tokens} completion) | ⏱️  ${duration}s`);
    } else {
        console.error(`\n❌ Error: ${result.error}`);
        process.exit(1);
    }
}

async function main() {
  const args = process.argv.slice(2);
  const apiKey = env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.error("❌ Error: PERPLEXITY_API_KEY environment variable not set.");
    console.error("Get your API key from: https://www.perplexity.ai/settings/api");
    process.exit(1);
  }

  if (args.length === 0) {
    console.log(`
Perplexity CLI - AI Search & Research

Usage:
  pplx search <query>     Search the web
  pplx research <topic>   Deep research
  pplx academic <query>   Search academic sources
  pplx ask <question>     Ask a general question
  pplx code <question>    Get coding help

Options:
  --model <sonar|sonar-pro|sonar-deep|sonar-reasoning>
  --recent <day|week|month|year>
`);
    process.exit(0);
  }

  const command = args[0].toLowerCase();
  const restArgs = args.slice(1);
  
  // Parse options for the command
  const { query, model, recent } = parseOptions(restArgs);

  // If command is not one of the specific ones, treat the whole args as a search query
  if (!["search", "research", "academic", "ask", "code", "help"].includes(command)) {
      // Re-parse including the first arg as part of the query
      const opts = parseOptions(args);
      await runRequest(apiKey, {
        model: MODELS[opts.model || "sonar"],
        messages: [
            { role: "system", content: "Be precise and helpful. Provide comprehensive answers with sources." },
            { role: "user", content: opts.query }
        ],
        max_tokens: 2048,
        temperature: 0.2,
        search_recency_filter: opts.recent
      }, "Searching");
      return;
  }

  if (command === "help") {
     console.log(`
Perplexity CLI - AI Search & Research

Usage:
  pplx search <query>     Search the web
  pplx research <topic>   Deep research
  pplx academic <query>   Search academic sources
  pplx ask <question>     Ask a general question
  pplx code <question>    Get coding help

Options:
  --model <sonar|sonar-pro|sonar-deep|sonar-reasoning>
  --recent <day|week|month|year>
`);
    return;
  }

  if (!query) {
    console.error(`❌ Error: Please provide a query for '${command}'.`);
    process.exit(1);
  }

  switch (command) {
    case "search":
    case "ask":
      await runRequest(apiKey, {
        model: MODELS[model || "sonar"],
        messages: [
            { role: "system", content: "Be precise and helpful. Provide comprehensive answers with sources." },
            { role: "user", content: query }
        ],
        max_tokens: 2048,
        temperature: 0.2,
        search_recency_filter: recent
      }, command === "ask" ? "Thinking" : "Searching");
      break;

    case "research":
      await runRequest(apiKey, {
        model: MODELS[model || "sonar-deep"],
        messages: [
            { role: "system", content: "Be precise and helpful. Provide comprehensive answers with sources." },
            { role: "user", content: query }
        ],
        max_tokens: 2048,
        temperature: 0.2,
        search_recency_filter: recent
      }, "Deep Researching");
      break;

    case "academic":
        await runRequest(apiKey, {
            model: MODELS[model || "sonar-pro"],
            messages: [
                { role: "system", content: "You are a research assistant. Focus on peer-reviewed academic sources and scholarly publications. Cite your sources properly." },
                { role: "user", content: query }
            ],
            max_tokens: 2048,
            temperature: 0.1,
            search_mode: "academic",
            search_recency_filter: recent
        }, "Academic Search");
        break;

    case "code":
        await runRequest(apiKey, {
            model: MODELS[model || "sonar-pro"],
            messages: [
                { role: "system", content: "You are an expert programmer. Provide clear, working code examples with explanations. Reference documentation and best practices." },
                { role: "user", content: `Coding question: ${query}` }
            ],
            max_tokens: 4096,
            temperature: 0.2,
            search_domain_filter: ["stackoverflow.com", "github.com", "developer.mozilla.org", "docs.python.org", "nodejs.org", "typescriptlang.org"]
        }, "Generating Code");
        break;
  }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
