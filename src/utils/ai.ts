import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DocumentChunk, Prisma } from "@prisma/client";
import { env } from "./env";
import { prisma } from "./prisma";

export const vectorStore = PrismaVectorStore.withModel<DocumentChunk>(
  prisma
).create(
  new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: env.OPENAI_API_KEY,
    configuration: { baseURL: env.OPENAI_BASE_URL },
  }),
  {
    prisma: Prisma,
    tableName: "document_chunks" as any,
    vectorColumnName: "vector",
    columns: {
      id: PrismaVectorStore.IdColumn,
      content: PrismaVectorStore.ContentColumn,
    },
  }
);
