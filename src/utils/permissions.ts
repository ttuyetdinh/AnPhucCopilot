import { FolderPermission } from '@prisma/client';

import { prisma } from './prisma';

/**
 * Helper function to get the highest permission level from a set of group permissions
 */
export function getHighestPermissionLevel(groupPermissions: any[], userGroupIds: string[]): FolderPermission | null {
  let highestPermission: FolderPermission | null = null;

  for (const permission of groupPermissions) {
    if (userGroupIds.includes(permission.groupId)) {
      if (permission.permission === FolderPermission.FULL_ACCESS) {
        return FolderPermission.FULL_ACCESS;
      } else if (permission.permission === FolderPermission.READ_ONLY) {
        highestPermission = FolderPermission.READ_ONLY;
      }
    }
  }

  return highestPermission;
}

/**
 * Helper function to check if any ancestor folder has permissions for the user's groups
 * Returns the highest permission level found in the ancestry chain, or null if no permissions
 */
export async function getParentPermission(folderId: string, userGroupIds: string[]): Promise<FolderPermission | null> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      groupPermissions: {
        include: { group: true },
      },
    },
  });

  if (!folder) {
    return null;
  }

  // Check if the current folder has direct permissions for the user's groups
  const directPermission = getHighestPermissionLevel(folder.groupPermissions, userGroupIds);

  if (directPermission) {
    return directPermission;
  }

  // If no direct permission and the folder has a parent, check parent recursively (if this folder inherits permissions)
  if (folder.parentId && folder.isPermissionInherited) {
    // Only check parent if this folder has inheritance enabled
    return getParentPermission(folder.parentId, userGroupIds);
  }

  return null;
}

/**
 * Helper function to calculate folder permissions considering inheritance
 */
export async function calculateFolderPermissions(
  folderId: string,
  userGroupIds: string[]
): Promise<FolderPermission | null> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      groupPermissions: {
        include: { group: true },
      },
    },
  });

  if (!folder) {
    return null;
  }

  // Check direct permissions
  const directPermission = getHighestPermissionLevel(folder.groupPermissions, userGroupIds);

  // If folder doesn't inherit permissions or has direct permissions, return that permission
  if (!folder.isPermissionInherited || directPermission) {
    return directPermission || null;
  }

  // If folder inherits permissions and has no direct permissions, check parent
  if (folder.parentId) {
    return getParentPermission(folder.parentId, userGroupIds);
  }

  return null;
}

/**
 * Helper function to check if user has access to any parent folder
 */
export async function hasParentAccess(folderId: string, userGroupIds: string[]): Promise<boolean> {
  const permissions = await calculateFolderPermissions(folderId, userGroupIds);
  return permissions !== null;
}

/**
 * Helper function to get accessible folder IDs for a user
 */
export async function getAccessibleFolderIds(userGroupIds: string[]): Promise<string[]> {
  const directAccessFolders = await prisma.folder.findMany({
    where: {
      groupPermissions: {
        some: {
          groupId: { in: userGroupIds },
          permission: {
            in: [FolderPermission.FULL_ACCESS, FolderPermission.READ_ONLY],
          },
        },
      },
    },
    select: { id: true },
  });

  const inheritanceFolders = await prisma.folder.findMany({
    where: {
      isPermissionInherited: true,
    },
    select: { id: true, parentId: true },
  });

  const accessibleIds = new Set(directAccessFolders.map((f) => f.id));

  for (const folder of inheritanceFolders) {
    if (folder.parentId && (await hasParentAccess(folder.parentId, userGroupIds))) {
      accessibleIds.add(folder.id);
    }
  }

  return Array.from(accessibleIds);
}

/**
 * Helper function to get user group IDs for a given user
 */
export async function getUserGroupIds(userId: string): Promise<string[]> {
  const userGroups = await prisma.groupMember.findMany({
    where: { clerkId: userId },
    select: { groupId: true },
  });

  return userGroups.map((group) => group.groupId);
}
