import { DocumentType } from "@prisma/client";

export enum Intention {
    LOCAL = "LOCAL",
    MEDICAL = "MEDICAL",
}

export interface DocumentInput {
    title?: string;
    content: string;
    documentType: DocumentType;
}

export interface ChunkInput {
    content: string;
    metadata?: Record<string, any>;
}
