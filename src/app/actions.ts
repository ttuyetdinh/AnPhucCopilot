'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { FolderPermission, Message } from '@prisma/client';

import { FolderWithUserPermissions } from '@/types';
import { auth } from '@/utils/clerk';
import {
  calculateFolderPermissions,
  getAccessibleFolderIds,
  getHighestPermissionLevel,
  getParentPermission,
  getUserGroupIds,
} from '@/utils/permissions';
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

export async function getRootFolder(): Promise<FolderWithUserPermissions> {
  const folder = await prisma.folder.findFirstOrThrow({
    where: { isRoot: true },
    include: {
      children: {
        include: folderWithGroupPermissions,
      },
      ...folderWithGroupPermissions,
    },
  });
  return {
    ...folder,
    userPermissions: null,
  };
}

export async function getSubFoldersOfFolder(
  currentFolderId: string,
  userPermissions: string | null,
  isRootFolder: boolean = false
): Promise<FolderWithUserPermissions[]> {
  if (!userPermissions && !isRootFolder) {
    return [];
  }

  const { userId, isAdmin } = await auth();

  // Admin users can access all folders
  if (isAdmin) {
    const folders = await prisma.folder.findMany({
      where: { parentId: currentFolderId },
      orderBy: { createdAt: 'desc' as const },
      include: folderWithGroupPermissions,
    });

    return folders.map((folder) => ({
      ...folder,
      userPermissions: FolderPermission.FULL_ACCESS,
    }));
  }
  // Regular users need explicit permissions
  const userGroupIds = await getUserGroupIds(userId!);

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
  conditions.push({ isPermissionInherited: !!userPermissions });

  // Find all folders that match the OR conditions
  const subFolders = await prisma.folder.findMany({
    where: {
      parentId: currentFolderId,
      OR: conditions,
    },
    orderBy: { createdAt: 'desc' as const },
    include: folderWithGroupPermissions,
  });

  // Set the inherited permission level for each folder
  const subFoldersWithPermissions = subFolders.map((folder) => {
    // If folder inherits permissions, add the effective parent permission level
    if (folder.isPermissionInherited && !isRootFolder) {
      return {
        ...folder,
        userPermissions: userPermissions as FolderPermission | null,
      };
    }
    // For folders with their own permissions (not inherited), calculate their own effective permission
    const directPermissionLevel = getHighestPermissionLevel(folder.groupPermissions, userGroupIds);
    console.log(folder.name, directPermissionLevel, 'asdsadsad');
    return {
      ...folder,
      userPermissions: directPermissionLevel ?? null,
    };
  });

  console.log(subFoldersWithPermissions, 'subFoldersWithPermissions');

  return subFoldersWithPermissions;
}

export async function getFolderById(id: string): Promise<FolderWithUserPermissions | null> {
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
    return {
      ...folder,
      userPermissions: FolderPermission.FULL_ACCESS,
    };
  }

  // Get user groups for permission checking
  const userGroupIds = await getUserGroupIds(userId!);

  // Check direct permissions first
  const directPermission = getHighestPermissionLevel(folder.groupPermissions, userGroupIds);

  // If folder doesn't inherit permissions or has direct permissions, return that permission
  if (!folder.isPermissionInherited || directPermission) {
    return {
      ...folder,
      userPermissions: directPermission || null,
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
      const parentPermission = await getParentPermission(parentFolder.id, userGroupIds);

      return {
        ...folder,
        userPermissions: parentPermission || null,
      };
    }
  }

  // Default case: no permissions found
  return {
    ...folder,
    // Using undefined instead of null
    userPermissions: null,
  };
}

export async function createFolder(name: string, parentId: string, isPermissionInherited: boolean = true) {
  return prisma.folder.create({
    data: {
      name,
      parentId,
      isPermissionInherited,
    },
  });
}

export async function updateFolder(id: string, name: string, parentId: string, isPermissionInherited: boolean = true) {
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

export async function addMessagesWithConversationId(messages: Pick<Message, 'role' | 'content' | 'conversationId'>[]) {
  return prisma.message.createMany({ data: messages });
}

export async function updateConversationSummary(conversationId: string, summary: string) {
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

export async function createGroup(name: string, description: string, clerkIds: string[]) {
  return prisma.group.create({
    data: {
      name,
      description,
      members: { create: clerkIds.map((clerkId) => ({ clerkId })) },
    },
  });
}

export async function updateGroup(groupId: string, name: string, description: string, clerkIds: string[]) {
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

export async function addGroupToFolder(folderId: string, groupId: string, permission: FolderPermission) {
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
  const userGroupIds = await getUserGroupIds(userId!);

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

export async function searchDocuments(searchTerm: string) {
  const { userId, isAdmin } = await auth();

  if (!searchTerm.trim()) {
    return [];
  }

  const cleanSearchTerm = searchTerm.trim();

  if (isAdmin) {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          {
            fileName: {
              contains: cleanSearchTerm,
              mode: 'insensitive',
            },
          },
          {
            folder: {
              name: {
                contains: cleanSearchTerm,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        versions: {
          orderBy: { version: 'desc' as const },
          take: 1,
        },
        folder: {
          include: {
            groupPermissions: {
              include: { group: true },
            },
          },
        },
      },
      orderBy: [
        {
          fileName: 'asc',
        },
      ],
    });

    return documents.map((doc) => ({
      ...doc,
      userPermissions: FolderPermission.FULL_ACCESS,
    }));
  }
  // Get user groups for permission checking
  const userGroupIds = await getUserGroupIds(userId!);

  // Get all documents matching the search term (including folder names)
  const allDocuments = await prisma.document.findMany({
    where: {
      OR: [
        {
          fileName: {
            contains: cleanSearchTerm,
            mode: 'insensitive',
          },
        },
        {
          folder: {
            name: {
              contains: cleanSearchTerm,
              mode: 'insensitive',
            },
          },
        },
      ],
    },
    include: {
      versions: {
        orderBy: { version: 'desc' as const },
        take: 1,
      },
      folder: {
        include: {
          groupPermissions: {
            include: { group: true },
          },
        },
      },
    },
    orderBy: [
      // Prioritize exact matches
      {
        fileName: 'asc',
      },
    ],
  });

  // Filter documents based on folder permissions
  const accessibleDocuments = [];

  for (const document of allDocuments) {
    const folder = document.folder; // Check if user has access to the folder containing this document
    const userPermissions = await calculateFolderPermissions(folder.id, userGroupIds);

    if (userPermissions) {
      accessibleDocuments.push({
        ...document,
        userPermissions,
      });
    }
  }

  return accessibleDocuments;
}

export async function getRecentDocuments(limit: number = 10) {
  const { userId, isAdmin } = await auth();

  // Admin can access all recent documents
  if (isAdmin) {
    const documents = await prisma.document.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { version: 'desc' as const },
          take: 1,
        },
        folder: {
          include: {
            groupPermissions: {
              include: { group: true },
            },
          },
        },
      },
    });

    return documents.map((doc) => ({
      ...doc,
      userPermissions: FolderPermission.FULL_ACCESS,
    }));
  }
  // Get user groups for permission checking
  const userGroupIds = await getUserGroupIds(userId!);

  // Get accessible folder IDs first
  const accessibleFolderIds = await getAccessibleFolderIds(userGroupIds);

  // Get recent documents from accessible folders
  const documents = await prisma.document.findMany({
    where: {
      folderId: { in: accessibleFolderIds },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      versions: {
        orderBy: { version: 'desc' as const },
        take: 1,
      },
      folder: {
        include: {
          groupPermissions: {
            include: { group: true },
          },
        },
      },
    },
  });

  // Calculate permissions for each document
  const documentsWithPermissions = [];
  for (const document of documents) {
    const userPermissions = await calculateFolderPermissions(document.folderId, userGroupIds);
    if (userPermissions) {
      documentsWithPermissions.push({
        ...document,
        userPermissions,
      });
    }
  }
  return documentsWithPermissions;
}
