import { Document, DocumentVersion } from '@prisma/client';

export type DocumentChunkMetadata = {
  loc?: {
    pageNumber?: number;
  };
};

export type DocumentWithVersions = Document & {
  versions: DocumentVersion[];
};
