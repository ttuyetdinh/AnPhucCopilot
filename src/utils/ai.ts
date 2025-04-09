import { createOpenAI } from '@ai-sdk/openai';
import { Message as SDKMessage } from '@ai-sdk/react';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { DocumentChunk, Prisma } from '@prisma/client';
import { tool } from 'ai';
import { GPTTokens, supportModelType } from 'gpt-tokens';
import { z } from 'zod';

import { DocumentChunkMetadata, KnowledgeChunk, RankingChunk } from '@/types';

import { env } from './env';
import { fullTextSearch } from './fullTextSearch';
import { prisma } from './prisma';
import { reRankingChunk } from './reranking';

const RELEVANT_SCORE_THRESHOLD = 0.57;

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

export const getRelevantInformation = tool({
  description: `Retrieve relevant information from the knowledge base to answer questions. 
    Always priority to use this tool.`,
  parameters: z.object({
    question: z.string().describe("User's question."),
  }),
  execute: async ({ question }) => {
    try {
      const accessableDocumentIds = (
        await prisma.document.findMany({
          // where: {
          //   folder: {},
          // },
          select: { id: true },
        })
      ).map((doc) => doc.id);

      if (accessableDocumentIds.length === 0) {
        return 'No <Relevant Information> found.';
      }

      const vectorChunks: RankingChunk[] = (
        await vectorStore.similaritySearchWithScore(question, 10, {
          document_id: {
            in: accessableDocumentIds,
          },
        } as any)
      ).map(([chunk, score]) => ({
        id: chunk.metadata.id,
        score,
      }));

      const fullTextChunks: RankingChunk[] = (await fullTextSearch(question))
        .slice(0, 10)
        .map((chunk) => ({
          id: chunk.id,
          score: chunk.rank,
        }));

      const filteredChunks = reRankingChunk(
        { chunks: vectorChunks, weight: 0.7 },
        { chunks: fullTextChunks, weight: 0.3 }
      ).filter((chunk) => chunk.score >= RELEVANT_SCORE_THRESHOLD);

      const relevantChunks = (
        await prisma.documentChunk.findMany({
          where: {
            id: {
              in: filteredChunks.map((result) => result.id),
            },
          },
          include: { document: true },
        })
      ).map(
        (chunk): KnowledgeChunk => ({
          content: chunk.content,
          metadata: {
            documentId: chunk.documentId,
            pageNumber:
              (chunk.metadata as DocumentChunkMetadata).loc?.pageNumber ?? 0,
          },
        })
      );

      const formattedOutput = formatKnowledgeOutput(
        'Relevant Information',
        relevantChunks
      );

      return formattedOutput;
    } catch (error) {
      console.error('Error in getInformation tool:', error);
      return 'An error occurred while retrieving relevant information.';
    }
  },
});

export const getOtherInformation = tool({
  description: `Retrieve supplementary information that may be helpful for the user based on their question. 
              Use this tool if no <Relevant Information> is found or when additional context is needed.`,
  parameters: z.object({
    question: z.string().describe("User's question."),
  }),
  execute: async ({ question }) => {
    try {
      const accessableDocumentIds = (
        await prisma.document.findMany({
          // where: {
          //   folder: {},
          // },
          select: { id: true },
        })
      ).map((doc) => doc.id);

      if (accessableDocumentIds.length === 0) {
        console.log('No accessable documents found.');
        return 'No <Other Information> is found.';
      }

      // Get search results with optimized initial limit
      const vectorChunkIds = (
        await vectorStore.similaritySearchWithScore(question, 15, {
          document_id: {
            in: accessableDocumentIds,
          },
        } as any)
      ).map(
        ([chunk, score]): RankingChunk => ({
          id: chunk.metadata.id,
          score,
        })
      );

      console.log('Other Information: vectorChunkIds:', vectorChunkIds.length);
      console.log(vectorChunkIds);

      const fullTextChunkIds = (await fullTextSearch(question, { limit: 15 }))
        .slice(0, 15)
        .map(
          (chunk): RankingChunk => ({
            id: chunk.id,
            score: chunk.rank,
          })
        );

      console.log(
        'Other Information: fullTextChunkIds:',
        fullTextChunkIds.length
      );
      console.log(fullTextChunkIds);

      const filteredChunkIds = reRankingChunk(
        { chunks: vectorChunkIds, weight: 0.7 },
        { chunks: fullTextChunkIds, weight: 0.3 }
      )
        .filter((chunk) => chunk.score < RELEVANT_SCORE_THRESHOLD)
        .slice(0, 5); // Limit to top 5 suggestions

      const suggestionChunks = (
        await prisma.documentChunk.findMany({
          where: {
            id: {
              in: filteredChunkIds.map((result) => result.id),
            },
          },
          include: { document: true },
        })
      ).map(
        (chunk): KnowledgeChunk => ({
          content: chunk.content,
          metadata: {
            documentId: chunk.documentId,
            pageNumber:
              (chunk.metadata as DocumentChunkMetadata).loc?.pageNumber ?? 0,
          },
        })
      );

      const formattedOutput = formatKnowledgeOutput(
        'Other Information',
        suggestionChunks
      );

      return formattedOutput;
    } catch (error) {
      console.error('Error in getSuggestionInformation tool:', error);
      return 'An error occurred while retrieving suggestion information.';
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

const formatKnowledgeOutput = (
  informationName: string,
  informationChunks: KnowledgeChunk[]
): string => {
  if (!informationChunks.length) {
    return `No <${informationName} /> found.`;
  }

  const formattedInformation = informationChunks
    .map(
      (chunk) =>
        `<cite documentId="${chunk.metadata.documentId}" page="${chunk.metadata.pageNumber}" />
${chunk.content}
-----------------------------------`
    )
    .join('\n\n');

  return `<${informationName}>
${formattedInformation}
</${informationName}>`;
};
