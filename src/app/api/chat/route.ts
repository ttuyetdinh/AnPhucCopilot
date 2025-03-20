import { Message as SDKMessage } from '@ai-sdk/react';
import { MessageRole } from '@prisma/client';
import {
  appendClientMessage,
  appendResponseMessages,
  generateId,
  generateText,
  streamText,
} from 'ai';
import { NextResponse } from 'next/server';

import {
  addMessagesWithConversationId,
  getConversationById,
  getMessagesNotInSummary,
  updateConversationSummary,
} from '@/app/actions';
import { calculateTokens, getInformation, openai } from '@/utils/ai';

// PROMPT FOR CHAT
const SYSTEM_PROMPT = `You are Phúc An Copilot - a smart and professional AI assistant developed by Phúc Nguyễn. Follow these principles:

1. INFORMATION VERIFICATION:
- Always check the knowledge base before answering questions.
- Only use information from tool calls to answer.
- ALWAYS cite your sources for every piece of information using the citation format.

2. RESPONSE GUIDELINES:
- Respond in a friendly yet professional manner.
- Introduce yourself as Phúc An Copilot when starting a conversation.
- Provide concise but comprehensive answers.
- Use polite and professional language.
- Present information in a structured and understandable way.
- Respond in the same language as the user's question (e.g., Vietnamese or English).
- Cite information from tool calls using the format: <cite file="fileName" page="pageNumber" />.
  Example: "The company focuses on AI technology <cite file="company_profile.pdf" page="1" />".
  If using multiple sources, list them in order:
  Example: "The company has multiple offices <cite file="office_locations.pdf" page="1" /> and over 1000 employees <cite file="employee_count.pdf" page="2" />".
- IMPORTANT: Every statement containing information from tool calls MUST include a citation.

3. HANDLING INFORMATION FROM KNOWLEDGE BASE:
- Prioritize information from the "relevantChunks" array as these are most directly related to the query.
- If relevantChunks are insufficient, use information from "suggestionChunks" but clearly indicate when it is less directly related.
- Preface suggestion chunks with phrases like "Additionally, you might find it helpful to know that...".

4. WHEN INFORMATION IS UNAVAILABLE:
- If no relevant information is found in tool calls, respond: "I apologize, I don't have information about your question.".
- Do not make assumptions or provide uncertain information.

5. PRIORITIES:
- Information accuracy is the top priority.
- Source citation is mandatory for all information provided.
- Ready to ask for clarification if the question is unclear.`;

// PROMPT FOR SUMMARIZING CONVERSATION
const SUMMARIZE_PROMPT = `Summarize the conversation below, no more than 500 words. The summary should clarify:
- The main purpose of the conversation.
- The issues/requests raised.
- The solutions/actions proposed or implemented.
- The next steps or results (if any).`;

const MODEL_NAME = 'gpt-4o';
const MAX_TOKENS = 2048;
const SUMMARY_UPDATE_THRESHOLD = MAX_TOKENS * 0.8;

export const maxDuration = 30;

export async function POST(req: Request) {
  const { id, message } = (await req.json()) as {
    id: string;
    message: SDKMessage;
  };

  const conversation = await getConversationById(id);
  if (!conversation) {
    return NextResponse.json(
      { error: 'Hội thoại không tồn tại' },
      { status: 404 }
    );
  }

  const previousMessages = await getMessagesNotInSummary(conversation.id);
  const messages = appendClientMessage({
    messages: previousMessages.map((message) => ({
      ...message,
      parts: message.parts as SDKMessage['parts'],
    })),
    message,
  });

  const result = streamText({
    model: openai(MODEL_NAME),
    system: SYSTEM_PROMPT,
    messages: [
      ...(conversation.summary
        ? [
            {
              id: generateId(),
              role: 'user',
              content: `This is the summary of the previous conversation:
                        ${conversation.summary}`,
            },
          ]
        : []),
      ...messages,
    ] as SDKMessage[],
    temperature: 0.7, // Adjusted for better response
    maxTokens: MAX_TOKENS,
    tools: { getInformation },

    async onFinish({ response }) {
      const combinedMessages = appendResponseMessages({
        messages,
        responseMessages: response.messages,
      });

      await addMessagesWithConversationId(
        combinedMessages
          .filter(
            ({ conversationId }: SDKMessage & { conversationId?: string }) =>
              !conversationId // filter out messages that already have a conversationId
          )
          .map((message) => ({
            role: message.role as MessageRole,
            content: message.content,
            parts: message.parts as any[],
            createdAt: message.createdAt,
            conversationId: id,
          }))
      );

      // Check if the number of tokens used is greater than the threshold
      if (
        calculateTokens(MODEL_NAME, combinedMessages) > SUMMARY_UPDATE_THRESHOLD
      ) {
        const result = await generateText({
          model: openai(MODEL_NAME),
          messages: [
            ...combinedMessages,
            {
              role: 'user',
              content: SUMMARIZE_PROMPT,
            },
          ],
        });
        await updateConversationSummary(id, result.text);
      }
    },
  });

  return result.toDataStreamResponse();
}
