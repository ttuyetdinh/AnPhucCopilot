import {
  Conversation as PrismaConversation,
  Document as PrismaDocument,
  Message as PrismaMessage,
} from "@prisma/client";

export type Conversation = PrismaConversation & {
  messages: Message[];
};

export type Message = PrismaMessage & {
  conversation: Conversation;
};

export type Document = PrismaDocument & {};
