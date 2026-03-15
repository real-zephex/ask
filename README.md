# ai_chat_cli

A command-line interface for interactive AI conversations powered by the [Groq API](https://groq.com). Stream AI responses with markdown formatting directly to your terminal.

## Features

- ⚡ Real-time streaming AI responses
- 🎨 Markdown-to-terminal rendering with colors
- 📥 stdin piping support for context injection
- 🔧 Easy setup with single command
- 📦 Builds to a standalone executable

## Prerequisites

- [Bun](https://bun.com) v1.3.10 or later
- A Groq API key (get one at [console.groq.com](https://console.groq.com))

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
bash install.sh
ask "What is Bun?"
```

This installs Bun (if needed) and creates a standalone `ask` binary in `/usr/local/bin`.

### Option 2: Manual Setup

1. Install dependencies:
```bash
bun install
```

2. Set your API key:
```bash
echo "GROQ_API_KEY=your_api_key_here" > .env.local
```

3. Run:
```bash
bun run index.ts "What is TypeScript?"
```

## Usage

### Basic
```bash
ask "Your question here"
```

### With piped input
```bash
echo "Relevant context" | ask "Tell me more"
```

### After installation
```bash
# List available commands
ctrl+p

# Run with arguments
ask "What is Bun?"

# With piped input
cat file.txt | ask "Summarize this"
```

## Configuration

Set the `GROQ_API_KEY` environment variable in `.env.local`:
```bash
GROQ_API_KEY=your_api_key_here
```

The file is automatically loaded by Bun and ignored by git.

## Project Structure

```
ai_chat_cli/
├── index.ts              # Main CLI entry point
├── test.tsx              # Experimental React TUI interface
├── utils/
│   ├── groq.ts          # Groq API integration
│   └── generator.ts     # ReadableStream wrapper
├── package.json          # Dependencies
├── install.sh            # Setup script
└── .env.local            # API key (not committed)
```

## Alternative: React-based TUI

An experimental terminal UI using React is available:

```bash
bun run test.tsx
```

Exit with the Esc key.

## Building

Create a standalone executable:

```bash
bun build ./index.ts --compile --outfile ask
sudo mv ask /usr/local/bin  # Add to PATH (optional)
```

Or use the automated install script:
```bash
bash install.sh
```

## Development

Built with:
- **TypeScript** - Type-safe development
- **Bun** - Fast JavaScript runtime
- **Groq SDK** - AI API integration
- **Chalk** - Terminal styling
- **React & Ink** - TUI components (experimental)

This project was created using `bun init` in bun v1.3.10.
