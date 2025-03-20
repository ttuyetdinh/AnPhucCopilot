"use server";

import { prisma } from "@/utils/prisma";
import { auth } from "@clerk/nextjs/server";
import { MessageRole } from "@prisma/client";

export async function getConversations() {
  const { userId } = await auth();

  return await prisma.conversation.findMany({
    where: { clerkId: userId! },
    orderBy: { createdAt: "desc" },
  });
}

export async function getConversation(id: string) {
  return await prisma.conversation.findUnique({ where: { id } });
}

export async function createConversation(name: string) {
  const { userId } = await auth();

  return await prisma.conversation.create({
    data: { name, clerkId: userId! },
  });
}

export async function updateConversationName(id: string, name: string) {
  return await prisma.conversation.update({
    where: { id },
    data: { name },
  });
}

export async function deleteConversation(id: string) {
  return await prisma.conversation.delete({ where: { id } });
}

export async function getMessages(conversationId: string) {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMessagesNotInSummary(conversationId: string) {
  return await prisma.message.findMany({
    where: { conversationId, isInSummary: false },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMessagesWithConversationId(
  messages: { role: MessageRole; content: string; conversationId: string }[]
) {
  return await prisma.message.createMany({ data: messages });
}

export async function updateConversationSummary(
  conversationId: string,
  summary: string
) {
  return await prisma.conversation.update({
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
