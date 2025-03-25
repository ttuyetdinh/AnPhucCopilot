-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('system', 'user', 'assistant');

-- CreateEnum
CREATE TYPE "FolderPermission" AS ENUM ('CREATE', 'VIEW', 'EDIT', 'REMOVE');

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "clerk_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "parts" JSONB NOT NULL DEFAULT '[]',
    "isInSummary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "conversation_id" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_permissions" (
    "id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "permission" "FolderPermission" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_group_permissions" (
    "id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "permission" "FolderPermission" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_group_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "folder_id" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "minio_key" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "vector" vector(1536),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "document_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_clerk_id_key" ON "group_members"("group_id", "clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_folders_name_key" ON "document_folders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "folder_permissions_folder_id_clerk_id_key" ON "folder_permissions"("folder_id", "clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "folder_group_permissions_folder_id_group_id_key" ON "folder_group_permissions"("folder_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_minio_key_key" ON "document_versions"("minio_key");

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "document_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_permissions" ADD CONSTRAINT "folder_permissions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "document_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_group_permissions" ADD CONSTRAINT "folder_group_permissions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "document_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_group_permissions" ADD CONSTRAINT "folder_group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "document_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
