import { env } from "@/utils/env";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  return result.toDataStreamResponse();
}
