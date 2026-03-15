#!/usr/bin/env bun

import { getGroqChatStream, validateApiKey, type GroqConfig } from "./utils/groq";
import chalk from "chalk";

const VERSION = "1.0.0";

// --- CLI Help ---

function showHelp(): void {
  console.log(`
Usage: ask [OPTIONS] <prompt>
       echo "context" | ask [OPTIONS] <prompt>

Ask an AI question directly from the terminal.

Options:
  -h, --help                  Show this help message
  -v, --version               Show version number
      --model <model>         Model to use (default: openai/gpt-oss-20b)
      --temperature <number>  Sampling temperature 0-2 (default: 0.5)
      --max-tokens <number>   Max tokens in response (default: 8192)

Examples:
  ask "What is TypeScript?"
  ask --model openai/gpt-oss-20b "Explain async/await"
  ask --temperature 0.2 "Summarise this code"
  cat file.txt | ask "Explain this file"
  git diff | ask "Write a commit message for this diff"
`);
}

// --- Argument Parser ---

interface CliArgs {
  help: boolean;
  version: boolean;
  prompt: string | null;
  config: GroqConfig;
}

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {
    help: false,
    version: false,
    prompt: null,
    config: {},
  };

  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "-h" || arg === "--help") {
      result.help = true;
    } else if (arg === "-v" || arg === "--version") {
      result.version = true;
    } else if (arg === "--model") {
      const value = argv[++i];
      if (!value || value.startsWith("-")) {
        console.error(`Error: --model requires a value.\n\nExample: --model openai/gpt-oss-20b`);
        process.exit(1);
      }
      result.config.model = value;
    } else if (arg === "--temperature") {
      const raw = argv[++i];
      const num = parseFloat(raw ?? "");
      if (isNaN(num) || num < 0 || num > 2) {
        console.error(`Error: --temperature must be a number between 0 and 2.\n\nExample: --temperature 0.7`);
        process.exit(1);
      }
      result.config.temperature = num;
    } else if (arg === "--max-tokens") {
      const raw = argv[++i];
      const num = parseInt(raw ?? "", 10);
      if (isNaN(num) || num < 1) {
        console.error(`Error: --max-tokens must be a positive integer.\n\nExample: --max-tokens 4096`);
        process.exit(1);
      }
      result.config.maxTokens = num;
    } else if (arg?.startsWith("-")) {
      console.error(`Error: Unknown option "${arg}".\n\nRun 'ask --help' to see available options.`);
      process.exit(1);
    } else if (arg) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    result.prompt = positional.join(" ");
  }

  return result;
}

// --- Markdown Renderer ---

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, chalk.bold.blue("$1"))
    .replace(/^## (.+)$/gm, chalk.bold.cyan("$1"))
    .replace(/^# (.+)$/gm, chalk.bold.magenta("$1"))
    .replace(/\*\*(.+?)\*\*/g, chalk.bold("$1"))
    .replace(/\*(.+?)\*/g, chalk.italic("$1"))
    .replace(/`(.+?)`/g, chalk.yellow("$1"))
    .replace(/^- /gm, "  • ")
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
      chalk.bgGray.white(code.trim())
    );
}

// --- stdin Reader ---

async function getStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString().trim();
}

// --- Main ---

async function main(): Promise<void> {
  const args = parseArgs(Bun.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.version) {
    console.log(`ask v${VERSION}`);
    process.exit(0);
  }

  validateApiKey();

  const stdin = await getStdin();

  if (!args.prompt && !stdin) {
    console.error(
      "Error: No prompt provided.\n\n" +
      "Usage: ask <prompt>\n" +
      "       echo \"context\" | ask <prompt>\n\n" +
      "Run 'ask --help' for more information."
    );
    process.exit(1);
  }

  // Build the final message: prompt + optional stdin context
  const message = args.prompt
    ? stdin
      ? `${args.prompt}\n\n${stdin}`
      : args.prompt
    : stdin;

  let response = "";
  let lineCount = 0;

  try {
    const stream = await getGroqChatStream(message, args.config);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      // Stream raw content to terminal immediately
      process.stdout.write(content);
      response += content;
      lineCount += (content.match(/\n/g) || []).length;
    }
  } catch (err: unknown) {
    // Clear any partial streamed output before showing the error
    if (lineCount > 0) {
      process.stdout.write(`\x1b[${lineCount + 1}A\x1b[0J`);
    }

    const error = err as { status?: number; message?: string; code?: string };

    if (error.status === 401) {
      console.error(
        "Error: Invalid API key.\n\n" +
        "Your GROQ_API_KEY was rejected. Please check that it is correct.\n" +
        "Get a valid key at https://console.groq.com"
      );
    } else if (error.status === 429) {
      console.error(
        "Error: Rate limit exceeded.\n\n" +
        "You have hit the Groq API rate limit. Please wait a moment and try again."
      );
    } else if (error.status === 503 || error.status === 502) {
      console.error(
        "Error: Groq API is temporarily unavailable.\n\n" +
        "Please try again in a few moments."
      );
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error(
        "Error: Network connection failed.\n\n" +
        "Please check your internet connection and try again."
      );
    } else {
      console.error(
        `Error: ${error.message || "An unexpected error occurred."}\n\n` +
        "If this persists, check https://status.groq.com"
      );
    }

    process.exit(1);
  }

  // Clear streamed raw output and re-render with markdown
  process.stdout.write(`\x1b[${lineCount + 1}A\x1b[0J`);
  console.log(renderMarkdown(response));
}

main();
