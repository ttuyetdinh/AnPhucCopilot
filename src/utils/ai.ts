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

const RELEVANT_SIMILARITY_THRESHOLD = 0.6;

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
      const accessableDocumentIds = await prisma.document.findMany({
        // where: {
        //   folder: {},
        // },
        select: { id: true },
      });
      if (accessableDocumentIds.length === 0) {
        return 'No <Relevant Information> is found.';
      }

      const documentIds = accessableDocumentIds.map((doc) => doc.id);

      const searchResults = (
        await vectorStore.similaritySearchWithScore(question, 10, {
          // documentId: { // currently not working because documentId is not consistent with document_id in DB
          //   in: documentIds,
          // },
        })
      )
        .filter(([_, score]) => score >= RELEVANT_SIMILARITY_THRESHOLD)
        .map(([chunk]) => chunk);

      console.log('Relevant information:', searchResults.length);

      if (searchResults.length === 0) {
        return 'No <Relevant Information> is found.';
      }

      const chunks = await prisma.documentChunk.findMany({
        where: {
          id: {
            in: searchResults.map((result) => result.metadata.id),
          },
        },
        include: { document: true },
      });

      const relevantChunks = chunks.map((chunk) => ({
        content: chunk.content,
        metadata: {
          documentName: chunk.document.fileName,
          documentId: chunk.documentId,
          pageNumber: (chunk.metadata as DocumentChunkMetadata).loc?.pageNumber,
        },
      }));

      const formattedOutput = formatKnowledgeOutput(
        relevantChunks,
        'Relevant Information'
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
      const accessableDocumentIds = await prisma.document.findMany({
        // where: {
        //   folder: {},
        // },
        select: { id: true },
      });
      if (accessableDocumentIds.length === 0) {
        return 'No <Other Information> is found.';
      }

      // Get search results with optimized initial limit
      const searchResults = (
        await vectorStore.similaritySearchWithScore(question, 15, {
          // documentId: { // currently not working because documentId is not consistent with document_id in DB
          //   in: documentIds,
          // },
        })
      )
        .filter(([_, score]) => score < RELEVANT_SIMILARITY_THRESHOLD)
        .slice(0, 5) // Limit to top 5 suggestions
        .map(([chunk]) => chunk);

      console.log('Other Information:', searchResults.length);

      if (searchResults.length === 0) {
        return 'No <Other Information> is found.';
      }

      // Retrieve document chunks with metadata
      const chunks = await prisma.documentChunk.findMany({
        where: {
          id: {
            in: searchResults.map((result) => result.metadata.id),
          },
        },
        include: { document: true },
      });

      const suggestionChunks = chunks.map((chunk) => ({
        content: chunk.content,
        metadata: {
          documentName: chunk.document.fileName,
          documentId: chunk.documentId,
          pageNumber: (chunk.metadata as DocumentChunkMetadata).loc?.pageNumber,
        },
      }));

      console.log('other information:', suggestionChunks.length);

      const formattedOutput = formatKnowledgeOutput(
        suggestionChunks,
        'Other Information'
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
  informationChunks: KnowledgeChunk[],
  informationName: string
): string => {
  const sections: string[] = [];

  // Format relevant information section
  if (informationChunks.length > 0) {
    const formattedInformation = informationChunks
      .map(
        (chunk) =>
          `<cite documentId="${chunk.metadata.documentId}" documentName="${chunk.metadata.documentName}" page="${chunk.metadata.pageNumber}" />` +
          `\n ${chunk.content} \n` +
          '-----------------------------------'
      )
      .join('\n\n');

    sections.push(
      `<${informationName}>\n` +
        formattedInformation +
        `\n</${informationName}>`
    );
  }

  return sections.join('\n\n') || `No <${informationName}/> found.`;
};

interface KnowledgeChunk {
  content: string;
  metadata: {
    documentName: string;
    documentId: string;
    pageNumber?: number;
  };
}
