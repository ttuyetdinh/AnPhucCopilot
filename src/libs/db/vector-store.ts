import { PrismaClient, Prisma } from "@prisma/client";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";

export function getPrismaVectorStore(db: PrismaClient, embeddingModel: OpenAIEmbeddings) {
    return PrismaVectorStore.withModel<Prisma.ChunkGetPayload<{}>>(db).create(embeddingModel, {
        prisma: Prisma,
        tableName: "Chunk",
        vectorColumnName: "embedding",
        columns: {
            id: PrismaVectorStore.IdColumn,
            content: PrismaVectorStore.ContentColumn,
            metadata: true,
        },
    });
}
