import { responseGenerator } from './groq';

export const Generator = async ({ message } : {message: string}) => {
  const stream = new ReadableStream<string>({
    async start(controller) {
      const ac = new AbortController();
      const { signal } = ac;

      try {
        for await (const chunk of responseGenerator(message)) {
          if (signal.aborted) break;
          if (chunk.length > 0) {
            controller.enqueue(chunk);
          }
        }
        controller.close();
      } catch (error) {
        if (!signal.aborted) {
          console.error("Stream Error:", error);
          controller.enqueue("We ran into an issue.\n")
        }
      }
    },
  })
  return stream;
}
