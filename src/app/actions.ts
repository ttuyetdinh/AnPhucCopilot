'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { FolderPermission, Message } from '@prisma/client';

import { auth } from '@/utils/clerk';
import { prisma } from '@/utils/prisma';

const folderWithGroupPermissions = {
  groupPermissions: {
    include: { group: true },
  },
};

export const getIsAdmin = async () => {
  const { isAdmin } = await auth();
  return isAdmin;
};

export async function getRootFolder() {
  return prisma.folder.findFirstOrThrow({
    where: { isRoot: true },
    include: {
      children: {
        include: folderWithGroupPermissions,
      },
      ...folderWithGroupPermissions,
    },
  });
}

export async function getSubFoldersOfFolder(currentFolderId: string) {
  // Check if current folder is existing
  const currentFolder = await prisma.folder.findUnique({
    where: { id: currentFolderId },
    include: {
      groupPermissions: {
        include: { group: true },
      },
    },
  });

  if (!currentFolder) {
    return [];
  }

  const { userId, isAdmin } = await auth();

  // Admin users can access all folders
  if (isAdmin) {
    return prisma.folder.findMany({
      where: { parentId: currentFolderId },
      orderBy: { createdAt: 'desc' as const },
      include: folderWithGroupPermissions,
    });
  }

  // Regular users need explicit permissions
  const userGroups = await prisma.groupMember.findMany({
    where: { clerkId: userId! },
    select: { groupId: true },
  });
  const userGroupIds = userGroups.map((group) => group.groupId);

  const conditions = [];
  // Condition 1: Folders with explicit permissions for the user's groups
  conditions.push({
    groupPermissions: {
      some: {
        groupId: { in: userGroupIds },
        permission: {
          in: [FolderPermission.FULL_ACCESS, FolderPermission.READ_ONLY],
        },
      },
    },
  });
  // Condition 2: Check for inheritance from parent
  const parentPermissionLevel = await getParentPermission(
    currentFolder.id,
    userGroupIds
  );

  // Only include inherited folders if parent has permissions
  if (parentPermissionLevel) {
    conditions.push({
      isPermissionInherited: true,
    });
  }

  // Find all folders that match the OR conditions
  const folders = await prisma.folder.findMany({
    where: {
      parentId: currentFolderId,
      OR: conditions,
    },
    orderBy: { createdAt: 'desc' as const },
    include: folderWithGroupPermissions,
  });

  // Set the inherited permission level for each folder
  return Promise.all(
    folders.map(async (folder) => {
      // If folder inherits permissions, add the effective parent permission level
      if (folder.isPermissionInherited) {
        return {
          ...folder,
          inheritedPermissionLevel: parentPermissionLevel || undefined,
        };
      }

      // For folders with their own permissions (not inherited), calculate their own effective permission
      const directPermissionLevel = getHighestPermissionLevel(
        folder.groupPermissions,
        userGroupIds
      );

      return {
        ...folder,
        inheritedPermissionLevel: directPermissionLevel || undefined, // Using undefined instead of null
      };
    })
  );
}

export async function getFolderById(id: string) {
  const { userId, isAdmin } = await auth();

  // Admin can access everything
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      parent: true,
      ...folderWithGroupPermissions,
    },
  });

  if (!folder) {
    return null;
  }

  // For admin users, no need to calculate permissions
  if (isAdmin) {
    return folder;
  }

  // Get user groups for permission checking
  const userGroups = await prisma.groupMember.findMany({
    where: { clerkId: userId! },
    select: { groupId: true },
  });
  const userGroupIds = userGroups.map((group) => group.groupId);

  // Check direct permissions first
  const directPermission = getHighestPermissionLevel(
    folder.groupPermissions,
    userGroupIds
  );

  // If folder doesn't inherit permissions or has direct permissions, return that permission
  if (!folder.isPermissionInherited || directPermission) {
    return {
      ...folder,
      inheritedPermissionLevel: directPermission || undefined,
    };
  }

  // If folder inherits permissions and has no direct permissions, check parent
  if (folder.parentId) {
    // Get parent's effective permission
    const parentFolder = await prisma.folder.findUnique({
      where: { id: folder.parentId },
      include: {
        groupPermissions: {
          include: { group: true },
        },
      },
    });
    if (parentFolder) {
      const parentPermission = await getParentPermission(
        parentFolder.id,
        userGroupIds
      );

      return {
        ...folder,
        inheritedPermissionLevel: parentPermission || undefined,
      };
    }
  }

  // Default case: no permissions found
  return {
    ...folder,
    // Using undefined instead of null
    inheritedPermissionLevel: undefined,
  };
}

export async function createFolder(
  name: string,
  parentId: string,
  isPermissionInherited: boolean = true
) {
  return prisma.folder.create({
    data: {
      name,
      parentId,
      isPermissionInherited,
    },
  });
}

export async function updateFolder(
  id: string,
  name: string,
  parentId: string,
  isPermissionInherited: boolean = true
) {
  return prisma.folder.update({
    data: {
      name,
      parentId,
      isPermissionInherited,
    },
    where: { id },
  });
}

export async function deleteFolder(id: string) {
  return prisma.folder.delete({ where: { id, isRoot: false } });
}

export async function getDocuments(folderId: string) {
  return prisma.document.findMany({
    where: { folderId },
    include: {
      versions: {
        orderBy: { version: 'desc' as const },
      },
      folder: {
        include: folderWithGroupPermissions,
      },
    },
  });
}

export async function getConversations() {
  const { userId } = await auth();

  return prisma.conversation.findMany({
    where: { clerkId: userId! },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getConversationById(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function createConversation(name: string) {
  const { userId } = await auth();

  return prisma.conversation.create({
    data: { name, clerkId: userId! },
  });
}

export async function updateConversationName(id: string, name: string) {
  return prisma.conversation.update({
    where: { id },
    data: { name },
  });
}

export async function deleteConversation(id: string) {
  return prisma.conversation.delete({ where: { id } });
}

export async function getMessages(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getMessagesNotInSummary(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId, isInSummary: false },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addMessagesWithConversationId(
  messages: Pick<Message, 'role' | 'content' | 'conversationId'>[]
) {
  return prisma.message.createMany({ data: messages });
}

export async function updateConversationSummary(
  conversationId: string,
  summary: string
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      summary,
      messages: {
        updateMany: {
          where: { conversationId },
          data: { isInSummary: true },
        },
      },
    },
  });
}

export async function getGroups() {
  return prisma.group.findMany({
    include: { members: true },
  });
}

export async function getGroupById(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
}

export async function createGroup(
  name: string,
  description: string,
  clerkIds: string[]
) {
  return prisma.group.create({
    data: {
      name,
      description,
      members: { create: clerkIds.map((clerkId) => ({ clerkId })) },
    },
  });
}

export async function updateGroup(
  groupId: string,
  name: string,
  description: string,
  clerkIds: string[]
) {
  return prisma.group.update({
    where: { id: groupId },
    data: {
      name,
      description,
      members: {
        create: clerkIds.map((clerkId) => ({ clerkId })),
        deleteMany: { clerkId: { notIn: clerkIds } },
      },
    },
  });
}

export async function deleteGroup(groupId: string) {
  return prisma.group.delete({ where: { id: groupId } });
}

export async function getClerkUsers() {
  const client = await clerkClient();
  const list = await client.users.getUserList();

  return list.data.map((user) => ({
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
  }));
}

export async function addGroupToFolder(
  folderId: string,
  groupId: string,
  permission: FolderPermission
) {
  return prisma.folderGroupPermission.upsert({
    where: {
      folderId_groupId: {
        folderId,
        groupId,
      },
    },
    update: { permission },
    create: {
      folderId,
      groupId,
      permission,
    },
  });
}

export async function removeGroupFromFolder(folderId: string, groupId: string) {
  return prisma.folderGroupPermission.delete({
    where: {
      folderId_groupId: {
        folderId,
        groupId,
      },
    },
  });
}

export async function getAccessibleDocumentIds() {
  const { userId, isAdmin } = await auth();

  if (isAdmin) {
    const documents = await prisma.document.findMany({
      select: { id: true },
    });
    return documents.map((doc) => doc.id);
  }

  const userGroups = await prisma.groupMember.findMany({
    where: { clerkId: userId! },
    select: { groupId: true },
  });
  const userGroupIds = userGroups.map((group) => group.groupId);

  const accessibleFolders = await prisma.folder.findMany({
    where: {
      OR: [
        { isRoot: true },
        {
          groupPermissions: {
            some: {
              groupId: { in: userGroupIds },
              permission: {
                in: [FolderPermission.FULL_ACCESS, FolderPermission.READ_ONLY],
              },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  const folderIds = accessibleFolders.map((folder) => folder.id);

  const documents = await prisma.document.findMany({
    where: {
      folderId: { in: folderIds },
    },
    select: { id: true },
  });

  return documents.map((doc) => doc.id);
}

export async function getDocumentById(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: {
      versions: {
        orderBy: { version: 'desc' as const },
      },
    },
  });
}

// Helper function to check if any ancestor folder has permissions for the user's groups
// Returns the highest permission level found in the ancestry chain, or null if no permissions
async function getParentPermission(
  folderId: string,
  userGroupIds: string[]
): Promise<FolderPermission | null> {
  // Get the folder with its permissions
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
  const directPermission = getHighestPermissionLevel(
    folder.groupPermissions,
    userGroupIds
  );

  if (directPermission) {
    return directPermission;
  }

  // If no direct permission and the folder has a parent, check parent recursively (if this folder inherits permissions)
  if (folder.parentId && folder.isPermissionInherited) {
    // Only check parent if this folder has inheritance enabled
    return getParentPermission(folder.parentId, userGroupIds);
  }

  // No permissions found in the ancestry chain
  return null;
}

// Helper function to get the highest permission level from a set of group permissions
function getHighestPermissionLevel(
  groupPermissions: any[],
  userGroupIds: string[]
): FolderPermission | null {
  let highestPermission: FolderPermission | null = null;

  for (const permission of groupPermissions) {
    // Check if this permission applies to one of the user's groups
    if (userGroupIds.includes(permission.groupId)) {
      if (permission.permission === FolderPermission.FULL_ACCESS) {
        // Full access is the highest level, return immediately
        return FolderPermission.FULL_ACCESS;
      } else if (permission.permission === FolderPermission.READ_ONLY) {
        // Only set READ_ONLY if we haven't found any permission yet
        highestPermission = FolderPermission.READ_ONLY;
      }
    }
  }

  return highestPermission;
}
