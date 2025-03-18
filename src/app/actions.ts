"use server";

import { prisma } from "@/utils/prisma";
import { Prisma } from "@prisma/client";

export async function getConversations() {
  return await prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getConversation(id: string) {
  return await prisma.conversation.findUnique({ where: { id } });
}

export async function createConversation(name: string) {
  return await prisma.conversation.create({
    data: { name },
  });
}

export async function updateConversation(id: string, name: string) {
  return await prisma.conversation.update({
    where: { id },
    data: { name },
  });
}

export async function deleteConversation(id: string) {
  return await prisma.conversation.delete({
    where: { id },
  });
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
  messages: Prisma.MessageUncheckedCreateInput[]
) {
  return await prisma.message.createMany({ data: messages });
}

export async function updateConversationSummary(
  conversationId: string,
  summary: string
) {
  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { summary },
  });

  await prisma.message.updateMany({
    where: { conversationId },
    data: { isInSummary: true },
  });

  return conversation;
}
