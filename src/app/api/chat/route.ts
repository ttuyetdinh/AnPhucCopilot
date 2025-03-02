import { streamText } from "ai";
import { openai } from "@/utils/openai";

export const maxDuration = 300;

export async function POST(req: Request) {
    const { messages, intention } = await req.json();

    console.log(intention);

    const result = streamText({
        model: openai("gpt-4o"),
        messages,
    });

    return result.toDataStreamResponse();
}
