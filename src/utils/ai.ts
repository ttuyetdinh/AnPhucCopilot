import { createOpenAI } from '@ai-sdk/openai';
import { Message as SDKMessage } from '@ai-sdk/react';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { DocumentChunk, Prisma } from '@prisma/client';
import { tool } from 'ai';
import { GPTTokens, supportModelType } from 'gpt-tokens';
import { z } from 'zod';

import { getAccessibleDocumentIds } from '@/app/actions';
import { DocumentChunkMetadata } from '@/types';

import { env } from './env';
import { prisma } from './prisma';

// PROMPT FOR RELEVANT INFORMATION
const RELEVANT_INFORMATION_PROMPT = `Retrieve relevant information from the knowledge base to answer questions.
Always priority to use this tool.`;

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

export const getRelevantInformation = tool({
  description: RELEVANT_INFORMATION_PROMPT,
  parameters: z.object({
    question: z.string().describe("User's question."),
  }),
  execute: async ({ question }) => {
    try {
      const accessableDocuments = await getAccessibleDocumentIds();
      if (!accessableDocuments) {
        return 'No <Relevant Information> is found.';
      }

      const results = await vectorStore.similaritySearchWithScore(
        question,
        10,
        { document_id: { in: accessableDocuments } } as any
      );

      const chunks = await prisma.documentChunk.findMany({
        where: { id: { in: results.map(([chunk]) => chunk.metadata.id) } },
        include: { document: true },
      });

      return chunks
        .map((chunk) => {
          const { content, documentId, metadata } = chunk;
          const { loc } = metadata as DocumentChunkMetadata;

          return `<cite documentId="${documentId}" page="${loc?.pageNumber ?? 1}" />
${content}
--- END OF CITE ---`;
        })
        .join('\n\n');
    } catch (error) {
      console.error('Error in getInformation tool:', error);
      return 'An error occurred while retrieving relevant information.';
    }
  },
});
