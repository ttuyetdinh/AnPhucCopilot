import { PrismaClient, DocumentType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { getPrismaVectorStore } from "@/libs/db/vector-store";
import { getEmbeddingModel, splitPdfText } from "@/services/embeddings";

interface CreateDocumentParams {
    title?: string;
    content: string;
    documentType: DocumentType;
    fileName: string;
    db?: PrismaClient; // Optional for dependency injection
}

export async function createDocumentWithChunks(params: CreateDocumentParams): Promise<string> {
    const { title, content, documentType, fileName, db: injectedDb } = params;
    const db = injectedDb || new PrismaClient();
    const embeddingModel = getEmbeddingModel();

    try {
        const documentId = uuidv4();
        const chunkData = await splitPdfText(content, fileName);

        const preparedChunkData = chunkData.map((chunk) => ({
            id: uuidv4(),
            content: chunk.content,
            metadata: chunk.metadata ? JSON.stringify(chunk.metadata) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        const vectorStore = getPrismaVectorStore(db, embeddingModel);
        await vectorStore.addModels(
            await db.$transaction(async (prisma) => {
                await prisma.document.create({
                    data: {
                        id: documentId,
                        title,
                        content,
                        documentType,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        chunks: { create: preparedChunkData },
                    },
                });
                return preparedChunkData.map((chunk) => ({
                    ...chunk,
                    documentId,
                    metadata: chunk.metadata ? JSON.parse(chunk.metadata) : null,
                }));
            })
        );

        return "Document and chunks inserted successfully";
    } finally {
        if (!injectedDb) await db.$disconnect(); // Only disconnect if we created the client
    }
}
