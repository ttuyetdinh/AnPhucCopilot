'use server';

import { Message } from '@prisma/client';

import { auth } from '@/utils/clerk';
import { prisma } from '@/utils/prisma';

export async function getFolders(parentId: string) {
  return prisma.folder.findMany({
    where: { parentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRootFolder() {
  return prisma.folder.findFirstOrThrow({
    where: { isRoot: true },
  });
}

export async function getFolderById(id: string) {
  return prisma.folder.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
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
  return prisma.folder.delete({ where: { id } });
}

export async function getDocuments(folderId: string) {
  return prisma.document.findMany({
    where: { folderId },
    include: {
      versions: {
        orderBy: { version: 'desc' },
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
