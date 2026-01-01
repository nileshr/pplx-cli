# pplx-cli

A powerful Command Line Interface (CLI) for Perplexity AI, built with [Bun](https://bun.sh).

Interact with Perplexity's advanced AI models directly from your terminal for web searches, deep research, academic queries, and coding assistance.

## Features

- 🔍 **Web Search**: Real-time web searching with citations.
- 🔬 **Deep Research**: Comprehensive answers for complex topics.
- 🎓 **Academic Search**: Focus on scholarly and peer-reviewed sources.
- 💻 **Coding Assistant**: specialized mode for programming queries.
- 📜 **History**: Local history tracking of all your queries.
- ⚡ **Fast**: Built on the ultra-fast Bun runtime with SQLite integration.
- 🛠 **Customizable**: Support for different models (`sonar`, `sonar-pro`, etc.) and recency filters.

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
   Set the `PERPLEXITY_API_KEY` environment variable. You can do this temporarily in your shell or add it to your profile (`.zshrc`, `.bashrc`, etc.).

   ```bash
   export PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxxxxxxxxxxxxxx"
   ```

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
