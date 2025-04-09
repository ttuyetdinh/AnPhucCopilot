import { Document, DocumentVersion } from '@prisma/client';

export type DocumentChunkMetadata = {
  loc?: { pageNumber?: number };
};

export type DocumentWithVersions = Document & {
  versions: DocumentVersion[];
};

export type KnowledgeChunk = {
  content: string;
  metadata: {
    documentName?: string;
    documentId: string;
    pageNumber?: number;
  };
};

export type RankingChunk = {
  id: string;
  score: number;
};

export type RankingChunksWithWeight = {
  chunks: RankingChunk[];
  weight: number;
};

export type fullTextSearchChunk = {
  id: string;
  content: string;
  documentId: string;
  rank: number;
};
