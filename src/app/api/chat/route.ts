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
import { calculateTokens, getRelevantInformation, openai } from '@/utils/ai';

// PROMPT FOR CHAT
const SYSTEM_PROMPT = `You are An Phúc assistant, an AI helper of An Phúc clinic. Follow these guidelines:

1. INFORMATION VERIFICATION:
- ALWAYS use tool calls to retrieve the knowledge base before answering any questions.
- Refrain from creating or imagining information or giving suggestions without reference from tool result.

2. RESPONSE GUIDELINES (FOLLOW STRICTLY):
- Provide precise, concise, clear, and polite answers in professional tone.
- Present information in a structured and understandable way.
- ONLY and ALWAYS use information from tool calls to answer.
- ALWAYS cite your sources for every piece of information using citation format. Example: "The company has multiple offices <cite documentId="123" page="1" /> and over 1000 employees <cite documentId="456" page="2" />".
- ALWAYS respond in the same language that the user uses in their question (e.g. if they ask in Vietnamese, respond in Vietnamese; if in English, respond in English).

3. PROCESSING TOOLS OUTPUT:
- Priority to use <Relevant Information> to answer the question 
- Optionally, use <Other Information> to provide information that may be useful to the user.

4. PRIORITIES:
- Information accuracy is the highest priority.
- Source citation is mandatory for all information provided.
- Seek clarification if the question is unclear.`;

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
    maxSteps: 5,
    tools: { getRelevantInformation },
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
        try {
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
        } catch (error) {
          console.error('Error updating conversation summary:', error);
        }
      }
    },
  });

  return result.toDataStreamResponse();
}
