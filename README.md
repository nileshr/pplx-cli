# pplx-cli

A simple and powerful Command Line Interface (CLI) for the Perplexity API, built with [Bun](https://bun.sh).

Designed to be easily invoked by both humans and AI agents, `pplx-cli` allows you to access Perplexity's advanced AI models directly from your terminal or scripts for web searches, deep research, academic queries, and coding assistance.

## Features

- 🔍 **Web Search**: Real-time web searching with citations.
- 🔬 **Deep Research**: Comprehensive answers for complex topics.
- 🎓 **Academic Search**: Focus on scholarly and peer-reviewed sources.
- 💻 **Coding Assistant**: specialized mode for programming queries.
- 📜 **History**: Local history tracking of all your queries.
- ⚡ **Fast**: Built on the ultra-fast Bun runtime with SQLite integration.
- 🛠 **Customizable**: Support for different models (`sonar`, `sonar-pro`, etc.) and recency filters.
- 🤖 **Agent-Ready**: Output is formatted for easy parsing, making it an ideal tool for AI agents.

## Agent Integration

If you are using this CLI within an AI agent ecosystem (like a coding assistant or an autonomous agent), you can provide the following instructions to help the agent utilize `pplx-cli` effectively.

### Example `AGENTS.md`

Create an `AGENTS.md` file in your project root with content similar to this:

```markdown
# Perplexity CLI (pplx) Tool Instructions

This project includes the \`pplx\` CLI tool for performing web searches and deep research.

## Capability
The `pplx` tool allows you to search the web, perform deep research, and find code examples using the Perplexity API.

## Usage
Execute the tool using the command line:

pplx <command> "<query>"

## Commands
- \`pplx search "query"\`: Standard web search. Use for quick answers and general info.
- \`pplx research "query"\`: Deep research. Use for complex topics requiring reasoning and comprehensive details.
- \`pplx code "query"\`: Code search. Use for finding libraries, syntax, or debugging help.
- \`pplx academic "query"\`: Academic search. Use for finding papers and scholarly articles.

## Best Practices for Agents
1. **Prefer \`research\`**: When asked to "investigate", "research", or "find out details" about a broad topic, always use the \`research\` command.
2. **Use Quotes**: Always wrap your query in double quotes.
3. **Check Output**: The tool writes the full answer to stdout. You can capture this output to answer the user's question.
4. Use `pplx help` for more info
```

## Prerequisites

- [Bun](https://bun.sh) runtime installed.
- A **Perplexity API Key**. You can get one from the [Perplexity Settings](https://www.perplexity.ai/settings/api).

## Setup

1. **Clone the repository** (if applicable) or navigate to the project directory:

   ```bash
   cd pplx-cli
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Configure your API Key**:

   **Option A**: Add to your shell profile (`.zshrc`, `.bash_profile`, etc.):

   ```bash
   # Add to ~/.zshrc
   export PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxxxxxxxxxxxxxx"
   source ~/.zshrc
   ```

   **Option B**: Create a `.env` file in the data directory (fallback):

   ```bash
   echo 'PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx' > ~/.pplx-cli/.env
   ```

   The CLI checks the shell environment first, then falls back to `~/.pplx-cli/.env`.

## Build Standalone Binary

You can compile the CLI into a single, standalone executable that includes the SQLite database engine. This allows you to run the tool without needing to install Bun on other machines (same architecture).

```bash
bun run build
```

This will create a `pplx` executable in the current directory. You can move this to your `PATH` for easy access:

```bash
# Move to a directory in your PATH, e.g., /usr/local/bin
mv pplx /usr/local/bin/
```

Then you can run it simply as:

```bash
pplx search "Hello world"
```

## Usage

Run the CLI using `bun run index.ts` (or the built `pplx` binary):

```bash
bun run index.ts <command> [options] "<query>"
```

### Commands

| Command    | Description                                                |
| ---------- | ---------------------------------------------------------- |
| `search`   | General web search. Good for quick answers.                |
| `research` | Deep research on a topic. Uses reasoning models.           |
| `academic` | Searches academic papers and scholarly sources.            |
| `ask`      | Ask a general question (similar to search).                |
| `code`     | Get coding help with context from technical documentation. |
| `history`  | View your recent query history.                            |
| `help`     | Show the help menu.                                        |

### Options

| Option     | Description                          | Values                                                          |
| ---------- | ------------------------------------ | --------------------------------------------------------------- |
| `--model`  | Specify the Perplexity model to use. | `sonar` (default), `sonar-pro`, `sonar-deep`, `sonar-reasoning` |
| `--recent` | Filter search results by time.       | `day`, `week`, `month`, `year`                                  |

## Examples

**Basic Search:**

```bash
bun run index.ts search "What is the capital of France?"
```

**Deep Research:**

```bash
bun run index.ts research "Impact of AI on healthcare in the next decade"
```

**Academic Search:**

```bash
bun run index.ts academic "Quantum entanglement experiments 2024"
```

**Coding Help:**

```bash
bun run index.ts code "How to implement a binary search tree in TypeScript?"
```

**View History:**

```bash
bun run index.ts history
```

**Using Options:**

```bash
# Search for tech news from the last week
bun run index.ts search --recent week "latest smartphone releases"

# Use the reasoning model for a logic puzzle
bun run index.ts ask --model sonar-reasoning "Solve this logic puzzle: ..."
```

## History Storage

All your queries are automatically saved locally in `~/.pplx-cli/`:

1. **SQLite Database** (`~/.pplx-cli/history.db`): Stores structured query data for fast retrieval
2. **Markdown Files** (`~/.pplx-cli/history/`): Detailed markdown files for each query with full responses and citations

You can customize the storage location by setting the `PPLX_DATA_DIR` environment variable.

### Schema

The history table includes:

- Query text and command type
- Model used
- Full response and citations (as JSON)
- Token usage statistics
- Duration

## Troubleshooting

- **"PERPLEXITY_API_KEY environment variable not set"**: Make sure you have exported your API key as shown in the Setup section.
- **Permission denied**: Ensure `index.ts` has execution permissions (`chmod +x index.ts`) if you try to run it directly, or just use `bun run index.ts`.
