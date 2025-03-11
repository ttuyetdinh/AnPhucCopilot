import { vectorStore } from "@/utils/ai";
import { env } from "@/utils/env";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a helpful assistant. Check your knowledge base before answering any questions.
Only respond to questions using information from tool calls.
If no relevant information is found in the tool calls, respond, "Xin lỗi, tôi không có thông tin về câu hỏi của bạn."`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      getInformation: tool({
        description:
          "Get information from your knowledge base to answer questions.",
        parameters: z.object({
          question: z.string().describe("The user's question."),
        }),
        execute: async ({ question }) => {
          const results = await vectorStore.similaritySearchWithScore(
            question,
            4
          );
          if (results.length === 0) {
            return "No relevant information found.";
          }

          return results.map((result) => result[0].pageContent).join("\n");
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
