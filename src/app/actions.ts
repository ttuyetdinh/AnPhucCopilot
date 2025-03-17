"use server";

import { prisma } from "@/utils/prisma";

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
