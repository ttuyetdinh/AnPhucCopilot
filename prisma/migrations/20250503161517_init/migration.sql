/*
  Warnings:

  - A unique constraint covering the columns `[folder_id,group_id]` on the table `folder_group_permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "folder_group_permissions_folder_id_group_id_permission_key";

-- CreateIndex
CREATE UNIQUE INDEX "folder_group_permissions_folder_id_group_id_key" ON "folder_group_permissions"("folder_id", "group_id");
