-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('General', 'Specialized', 'Internal', 'UserUploaded');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentType" "DocumentType" NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDocument" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),

    CONSTRAINT "TestDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "documentId" ON "Chunk"("documentId");

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
