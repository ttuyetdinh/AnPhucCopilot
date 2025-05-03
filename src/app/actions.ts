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

export async function getFolders(parentId: string) {
  return prisma.folder.findMany({
    where: { parentId },
    orderBy: { createdAt: 'desc' as const },
    include: folderWithGroupPermissions,
  });
}

export async function getFolderById(id: string) {
  return prisma.folder.findUnique({
    where: { id },
    include: {
      parent: true,
      ...folderWithGroupPermissions,
    },
  });
}

export async function createFolder(name: string, parentId: string) {
  return prisma.folder.create({ data: { name, parentId } });
}

export async function updateFolder(id: string, name: string, parentId: string) {
  return prisma.folder.update({ data: { name, parentId }, where: { id } });
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
