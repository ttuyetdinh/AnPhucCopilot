'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { FolderPermission, Message } from '@prisma/client';

import { auth } from '@/utils/clerk';
import { prisma } from '@/utils/prisma';

async function getUserGroupIdsAndCheckPermission(
  userId: string,
  folderId: string | null = null,
  permission: FolderPermission = 'VIEW'
) {
  const { isAdmin } = await auth();

  const userGroups = await prisma.groupMember.findMany({
    where: { clerkId: userId },
    select: { groupId: true },
  });

  const userGroupIds = userGroups.map((group) => group.groupId);

  if (isAdmin) {
    return {
      userGroupIds,
      hasPermission: true,
      folder: folderId
        ? await prisma.folder.findUnique({
            where: { id: folderId },
            include: { groupPermissions: true },
          })
        : null,
    };
  }

  if (!folderId) {
    return { userGroupIds, hasPermission: false };
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { groupPermissions: true },
  });

  const hasPermission =
    folder?.isRoot ||
    folder?.groupPermissions.some(
      (perm) =>
        userGroupIds.includes(perm.groupId) && perm.permission === permission
    );

  return { userGroupIds, hasPermission: !!hasPermission, folder };
}

const folderWithGroupPermissions = {
  groupPermissions: {
    include: { group: true },
  },
};

export async function getRootFolder() {
  const { userId } = await auth();
  const { userGroupIds } = await getUserGroupIdsAndCheckPermission(userId!);

  return prisma.folder.findFirstOrThrow({
    where: { isRoot: true },
    include: {
      children: {
        where: {
          OR: [
            {
              groupPermissions: {
                some: {
                  groupId: { in: userGroupIds },
                  permission: 'VIEW',
                },
              },
            },
            { isRoot: true },
          ],
        },
        include: folderWithGroupPermissions,
      },
      ...folderWithGroupPermissions,
    },
  });
}

export async function getFolders(parentId: string) {
  const { userId, isAdmin } = await auth();
  const { userGroupIds } = await getUserGroupIdsAndCheckPermission(userId!);

  const baseQuery = {
    where: { parentId },
    orderBy: { createdAt: 'desc' as const },
    include: folderWithGroupPermissions,
  };

  if (isAdmin) {
    return prisma.folder.findMany(baseQuery);
  }

  return prisma.folder.findMany({
    ...baseQuery,
    where: {
      ...baseQuery.where,
      OR: [
        {
          groupPermissions: {
            some: {
              groupId: { in: userGroupIds },
              permission: 'VIEW',
            },
          },
        },
        { isRoot: true },
      ],
    },
  });
}

export async function getFolderById(id: string) {
  const { userId, isAdmin } = await auth();
  const { userGroupIds } = await getUserGroupIdsAndCheckPermission(userId!);

  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        where: isAdmin
          ? undefined
          : {
              OR: [
                {
                  groupPermissions: {
                    some: {
                      groupId: { in: userGroupIds },
                      permission: 'VIEW',
                    },
                  },
                },
                { isRoot: true },
              ],
            },
      },
      ...folderWithGroupPermissions,
    },
  });

  if (folder?.isRoot || isAdmin) return folder;

  const hasPermission = folder?.groupPermissions.some(
    (perm) => userGroupIds.includes(perm.groupId) && perm.permission === 'VIEW'
  );

  return hasPermission ? folder : null;
}

export async function createFolder(name: string, parentId: string) {
  const { userId, isAdmin } = await auth();

  if (isAdmin) {
    return prisma.folder.create({ data: { name, parentId } });
  }

  const { hasPermission } = await getUserGroupIdsAndCheckPermission(
    userId!,
    parentId,
    'CREATE'
  );

  if (!hasPermission) {
    throw new Error('Không có quyền tạo thư mục trong thư mục cha này');
  }

  return prisma.folder.create({ data: { name, parentId } });
}

export async function updateFolder(id: string, name: string, parentId: string) {
  const { userId, isAdmin } = await auth();

  if (isAdmin) {
    return prisma.folder.update({ data: { name, parentId }, where: { id } });
  }

  const { hasPermission: canEditFolder } =
    await getUserGroupIdsAndCheckPermission(userId!, id, 'EDIT');

  if (!canEditFolder) {
    throw new Error('Không có quyền chỉnh sửa thư mục này');
  }

  const folder = await prisma.folder.findUnique({ where: { id } });

  if (parentId !== folder?.parentId) {
    const { hasPermission: canCreateInParent } =
      await getUserGroupIdsAndCheckPermission(userId!, parentId, 'CREATE');

    if (!canCreateInParent) {
      throw new Error('Không có quyền di chuyển thư mục đến thư mục cha mới');
    }
  }

  return prisma.folder.update({ data: { name, parentId }, where: { id } });
}

export async function deleteFolder(id: string) {
  const { userId, isAdmin } = await auth();

  if (isAdmin) {
    return prisma.folder.delete({ where: { id, isRoot: false } });
  }

  const { hasPermission } = await getUserGroupIdsAndCheckPermission(
    userId!,
    id,
    'REMOVE'
  );

  if (!hasPermission) {
    throw new Error('Không có quyền xóa thư mục này');
  }

  return prisma.folder.delete({ where: { id, isRoot: false } });
}

export async function getDocuments(folderId: string) {
  const { userId, isAdmin } = await auth();

  const documentQuery = {
    where: { folderId },
    include: {
      versions: {
        orderBy: { version: 'desc' as const },
      },
    },
  };

  if (isAdmin) {
    return prisma.document.findMany(documentQuery);
  }

  const { hasPermission } = await getUserGroupIdsAndCheckPermission(
    userId!,
    folderId,
    'VIEW'
  );

  return hasPermission ? prisma.document.findMany(documentQuery) : [];
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
  permissions: FolderPermission[]
) {
  const existingPermissions = await prisma.folderGroupPermission.findMany({
    where: {
      folderId,
      groupId,
      permission: { in: permissions },
    },
  });

  if (existingPermissions.length > 0) {
    throw new Error('Nhóm đã có quyền trong thư mục này!');
  }

  const permissionPromises = permissions.map((permission) =>
    prisma.folderGroupPermission.create({
      data: {
        folderId,
        groupId,
        permission,
      },
    })
  );

  return Promise.all(permissionPromises);
}

export async function removeGroupFromFolder(folderId: string, groupId: string) {
  return prisma.folderGroupPermission.deleteMany({
    where: {
      folderId,
      groupId,
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
              permission: 'VIEW',
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
