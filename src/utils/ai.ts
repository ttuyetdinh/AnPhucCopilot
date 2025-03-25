import { createOpenAI } from '@ai-sdk/openai';
import { Message as SDKMessage } from '@ai-sdk/react';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { DocumentChunk, Prisma } from '@prisma/client';
import { tool } from 'ai';
import { GPTTokens, supportModelType } from 'gpt-tokens';
import { z } from 'zod';

import { DocumentChunkMetadata } from '@/types';

import { env } from './env';
import { prisma } from './prisma';

export const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
});

export const vectorStore = PrismaVectorStore.withModel<DocumentChunk>(
  prisma
).create(
  new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: env.OPENAI_API_KEY,
    configuration: { baseURL: env.OPENAI_BASE_URL },
  }),
  {
    prisma: Prisma,
    tableName: 'document_chunks' as any,
    vectorColumnName: 'vector',
    columns: {
      id: PrismaVectorStore.IdColumn,
      content: PrismaVectorStore.ContentColumn,
    },
  }
);

export const getInformation = tool({
  description:
    'Retrieve information from the knowledge base to answer questions.',
  parameters: z.object({
    question: z.string().describe("User's question."),
  }),
  execute: async ({ question }) => {
    try {
      const results = await vectorStore.similaritySearchWithScore(question, 5, {
        // TODO: Filters ...
      });
      if (results.length === 0) {
        return 'No relevant information found.';
      }

      const SIMILARITY_THRESHOLD = 0.5; // 50%

      const filledResults = results
        .filter(([_, score]) => score >= SIMILARITY_THRESHOLD)
        .map(([chunk]) => chunk);

      const chunks = await prisma.documentChunk.findMany({
        where: {
          id: {
            in: filledResults.map((result) => result.metadata.id),
          },
        },
        include: { document: true },
      });
      return chunks.map((chunk) => ({
        content: chunk.content,
        metadata: {
          fileName: chunk.document.fileName,
          pageNumber: (chunk.metadata as DocumentChunkMetadata).loc?.pageNumber,
        },
      }));
    } catch (error) {
      console.error('Error in getInformation tool:', error);

      return 'An error occurred while retrieving information.';
    }
  },
});

export const calculateTokens = (
  modelName: supportModelType,
  messages: Pick<SDKMessage, 'role' | 'content'>[]
) => {
  const gptTokens = new GPTTokens({
    model: modelName,
    messages: messages.map((message) => ({
      role: message.role as 'system' | 'user' | 'assistant',
      content: message.content,
    })),
  });

  return gptTokens.promptUsedTokens;
};
