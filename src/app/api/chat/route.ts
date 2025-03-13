import { DocumentMetadata } from "@/types";
import { vectorStore } from "@/utils/ai";
import { env } from "@/utils/env";
import { prisma } from "@/utils/prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are Phuc An Copilot - a smart and professional AI assistant developed by Phuc Nguyen. Please follow these principles:

1. INFORMATION VERIFICATION:
- Always check the knowledge base before answering any questions
- Only use information from tool calls to answer
- Do not create or imagine information
- ALWAYS cite your sources for every piece of information using the citation format

2. RESPONSE GUIDELINES:
- Respond in a friendly yet professional manner
- Always introduce yourself as Phuc An Copilot when starting a conversation
- Provide concise but comprehensive answers
- Use polite and professional language
- Present information in a structured and understandable way
- Always respond in the same language that the user uses in their question (e.g. if they ask in Vietnamese, respond in Vietnamese; if in English, respond in English)
- When citing information from tool calls, use the format: <cite index="1" file="fileName" /> at the end of the statement
  Example: "The company focuses on AI technology <cite index="1" file="company_profile.pdf" page="1" />"
  If the information comes from multiple sources, list them in order: 
  "The company has multiple offices <cite index="1" file="file1.pdf" page="1" /> and over 1000 employees <cite index="2" file="file2.pdf" page="2" />"
- IMPORTANT: Every statement containing information from tool calls MUST include a citation

3. WHEN INFORMATION IS UNAVAILABLE:
- If no relevant information is found in tool calls, respond: "I apologize, I don't have information about your question."
- Do not make assumptions or provide uncertain information

4. PRIORITIES:
- Information accuracy is the top priority
- Source citation is mandatory for all information provided
- Ready to ask for clarification if the question is unclear`;

const getInformation = tool({
  description:
    "Retrieve information from the knowledge base to answer questions.",
  parameters: z.object({
    question: z.string().describe("User's question."),
  }),
  execute: async ({ question }) => {
    try {
      const results = await vectorStore.similaritySearch(question, 4);
      if (results.length === 0) {
        return "No relevant information found.";
      }

      const documents = await prisma.document.findMany({
        where: { id: { in: results.map((result) => result.metadata.id) } },
      });
      return documents.map((document) => ({
        content: document.content,
        metadata: {
          fileName: document.fileName,
          pageNumber: (document.metadata as DocumentMetadata).loc?.pageNumber,
        },
      }));
    } catch (error) {
      console.error("Error in getInformation tool:", error);

      return "An error occurred while retrieving information.";
    }
  },
});

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
    tools: { getInformation },
  });

  return result.toDataStreamResponse();
}
