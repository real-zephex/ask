import Groq from "groq-sdk";
import type { Message } from "../db";

export interface GroqConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_MODEL = "openai/gpt-oss-20b";
const DEFAULT_TEMPERATURE = 0.5;
const DEFAULT_MAX_TOKENS = 8192;

export function validateApiKey(): void {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error(
      "Error: GROQ_API_KEY environment variable is not set.\n\n" +
      "To fix this:\n" +
      "  1. Get a free API key at https://console.groq.com\n" +
      "  2. Add it to your .env.local file:\n" +
      "       echo 'GROQ_API_KEY=your_key_here' > .env.local\n" +
      "  Or export it directly:\n" +
      "       export GROQ_API_KEY=your_key_here"
    );
    process.exit(1);
  }
}

export async function getGroqChatStream(message: string, config: GroqConfig = {}, history: Message[] = []) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
  });

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Do not use markdown to respond. Use plain text for your answers. Keep your answers concise. No need to overexplain.",
    },
    ...history.map(msg => ({
      role: msg.response_from === "assistant" ? "assistant" as const : "user" as const,
      content: msg.content,
    })),
    {
      role: "user",
      content: message,
    },
  ];

  return groq.chat.completions.create({
    messages,
    model: config.model ?? DEFAULT_MODEL,
    max_completion_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
    top_p: 1,
    stop: null,
    stream: true,
    temperature: config.temperature ?? DEFAULT_TEMPERATURE,
  });
}
