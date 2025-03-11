/*
  Warnings:

  - Added the required column `file_name` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('system', 'user', 'assistant');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "MessageRole" NOT NULL;

-- DropEnum
DROP TYPE "Role";
