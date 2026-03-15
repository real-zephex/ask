import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function getGroqChatStream(message: string) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "Do not use markdown to repsond. Use plain text for your answers. Keep your answers concise. No need to overexplain."
      },
      {
        role: "user",
        content: message,
      },
    ],
    model: "openai/gpt-oss-20b",
    max_completion_tokens: 8192,
    top_p: 1,
    stop: null,
    stream: true,
    temperature: 0.5,
  });
}

export async function* responseGenerator(prompt: string) {
  const stream = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-20b",
    max_completion_tokens: 8192,
    top_p: 1,
    stop: null,
    stream: true,
    temperature: 0.5,
  }); 

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield content;
    } 
  }
} 
