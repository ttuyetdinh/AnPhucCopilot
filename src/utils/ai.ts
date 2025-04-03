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
      const accessableDocumentIds = await prisma.document.findMany({
        // where: {
        //   folder: {},
        // },
        select: { id: true },
      });
      if (accessableDocumentIds.length === 0) {
        return 'No documents available in the knowledge base.';
      }

      const documentIds = accessableDocumentIds.map((doc) => doc.id);

      const results = await vectorStore.similaritySearchWithScore(question, 6, {
        document_id: { in: documentIds },
      } as any);

      if (results.length === 0) {
        return 'No relevant information found.';
      }

      const SIMILARITY_THRESHOLD = 0.5; // 50%

      const filledResults = results
        .filter(([_, score]) => score >= SIMILARITY_THRESHOLD)
        .map(([chunk]) => chunk);

      if (filledResults.length === 0) {
        return 'Found information was not relevant enough to your question.';
      }

      const chunkIds = filledResults.map((result) => result.metadata.id);

      const chunks = await prisma.documentChunk.findMany({
        where: {
          id: { in: chunkIds },
        },
        include: { document: true },
      });

      return chunks.map((chunk) => ({
        content: chunk.content,
        metadata: {
          documentId: chunk.documentId,
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
