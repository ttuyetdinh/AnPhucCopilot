/*
  Warnings:

  - You are about to drop the `folder_permissions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[folder_id,group_id,permission]` on the table `folder_group_permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "folder_permissions" DROP CONSTRAINT "folder_permissions_folder_id_fkey";

-- DropIndex
DROP INDEX "folder_group_permissions_folder_id_group_id_key";

-- DropTable
DROP TABLE "folder_permissions";

-- CreateIndex
CREATE UNIQUE INDEX "folder_group_permissions_folder_id_group_id_permission_key" ON "folder_group_permissions"("folder_id", "group_id", "permission");
