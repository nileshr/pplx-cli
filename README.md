# pplx-cli

A powerful Command Line Interface (CLI) for Perplexity AI, built with [Bun](https://bun.sh).

Interact with Perplexity's advanced AI models directly from your terminal for web searches, deep research, academic queries, and coding assistance.

## Features

- 🔍 **Web Search**: Real-time web searching with citations.
- 🔬 **Deep Research**: Comprehensive answers for complex topics.
- 🎓 **Academic Search**: Focus on scholarly and peer-reviewed sources.
- 💻 **Coding Assistant**: specialized mode for programming queries.
- ⚡ **Fast**: Built on the ultra-fast Bun runtime.
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
   *(Note: This project uses native Bun APIs, so dependencies are minimal.)*

3. **Configure your API Key**:
   Set the `PERPLEXITY_API_KEY` environment variable. You can do this temporarily in your shell or add it to your profile (`.zshrc`, `.bashrc`, etc.).

   ```bash
   export PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxxxxxxxxxxxxxx"
   ```

## Usage

Run the CLI using `bun run index.ts`:

```bash
bun run index.ts <command> [options] "<query>"
```

### Commands

| Command | Description |
|---------|-------------|
| `search` | General web search. Good for quick answers. |
| `research` | Deep research on a topic. Uses reasoning models. |
| `academic` | Searches academic papers and scholarly sources. |
| `ask` | Ask a general question (similar to search). |
| `code` | Get coding help with context from technical documentation. |
| `help` | Show the help menu. |

### Options

| Option | Description | Values |
|--------|-------------|--------|
| `--model` | Specify the Perplexity model to use. | `sonar` (default), `sonar-pro`, `sonar-deep`, `sonar-reasoning` |
| `--recent` | Filter search results by time. | `day`, `week`, `month`, `year` |

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

**Using Options:**
```bash
# Search for tech news from the last week
bun run index.ts search --recent week "latest smartphone releases"

# Use the reasoning model for a logic puzzle
bun run index.ts ask --model sonar-reasoning "Solve this logic puzzle: ..."
```

## Troubleshooting

- **"PERPLEXITY_API_KEY environment variable not set"**: Make sure you have exported your API key as shown in the Setup section.
- **Permission denied**: Ensure `index.ts` has execution permissions (`chmod +x index.ts`) if you try to run it directly, or just use `bun run index.ts`.