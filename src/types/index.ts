import {
  Document,
  DocumentVersion,
  Folder,
  FolderGroupPermission,
  FolderPermission,
  Group,
  GroupMember,
} from '@prisma/client';

export type DocumentChunkMetadata = {
  loc?: { pageNumber?: number };
};

export type DocumentWithVersions = Document & {
  versions: DocumentVersion[];
};

export type GroupWithMembers = Group & { members: GroupMember[] };

export type FolderWithGroupPermissions = Folder & {
  groupPermissions: (FolderGroupPermission & { group: Group })[];
  inheritedPermissionLevel?: FolderPermission;
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

export type FullTextSearchChunk = {
  id: string;
  content: string;
  documentId: string;
  rank: number;
};
