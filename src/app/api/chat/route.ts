import { env } from "@/utils/env";
import { ChatOpenAI } from "@langchain/openai";
import { LangChainAdapter } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey: env.OPENAI_API_KEY,
    configuration: { baseURL: env.OPENAI_BASE_URL },
  });

  const stream = await model.stream(messages);

  return LangChainAdapter.toDataStreamResponse(stream);
}
