#!/usr/bin/env bun

import { getGroqChatStream } from "./utils/groq";
import chalk from "chalk";

const args = Bun.argv.slice(2);
if (!args || args.length === 0) {
  console.error("You need to pass a prompt.");
  process.exit(0);
}

async function getStdin(): Promise<string> {
  if (process.stdin.isTTY) return ""; // no pipe, skip
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString().trim();
}

const message = args.join(" ");

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

async function main(message: string) {
  let response = "";
  let lineCount = 0;
  const stdin = await getStdin();

  const stream = await getGroqChatStream(stdin ? `${message}\n\n${stdin}` : message);
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    response += content;
    lineCount += (content.match(/\n/g) || []).length;
  }

  process.stdout.write(`\x1b[${lineCount + 1}A\x1b[0J`);
  console.log(renderMarkdown(response));
}
main(message);
