import { env } from "@/utils/env";
import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const vectorStore = PrismaVectorStore.withModel<Document>(prisma).create(
  new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: env.OPENAI_API_KEY,
    configuration: { baseURL: env.OPENAI_BASE_URL },
  }),
  {
    prisma: Prisma,
    tableName: "Document",
    vectorColumnName: "vector",
    columns: {
      id: PrismaVectorStore.IdColumn,
      content: PrismaVectorStore.ContentColumn,
    },
  }
);
