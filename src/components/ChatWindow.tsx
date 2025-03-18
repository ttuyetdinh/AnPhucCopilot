"use client";

import { Message as SDKMessage, useChat } from "@ai-sdk/react";
import { ChatItem } from "./ChatItem";
import ChatSidebar from "./ChatSidebar";

interface ChatWindowProps {
  conversationId?: string;
  initialMessages?: SDKMessage[];
}

export default function ChatWindow({
  conversationId,
  initialMessages,
}: ChatWindowProps) {
  const { status, messages, input, handleInputChange, handleSubmit } = useChat({
    id: conversationId,
    initialMessages,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody({ id, messages }) {
      return {
        id,
        message: messages[messages.length - 1], // Get the last message
      };
    },
    maxSteps: 3,
  });

  return (
    <div className="flex h-full space-x-4">
      <ChatSidebar />
      <div className="flex-1">
        {conversationId ? (
          <>
            <div className="flex flex-col space-y-4 border p-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <ChatItem key={message.id} message={message} />
                ))
              ) : (
                <div className="flex flex-col border-b">
                  Chào bạn, tôi có thể giúp gì cho bạn?
                </div>
              )}
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col mt-8 space-y-2"
            >
              <textarea
                name="prompt"
                value={input}
                onChange={handleInputChange}
                className="border p-4"
                placeholder="Nhập tin nhắn..."
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 cursor-pointer"
                >
                  {status === "submitted" && "Đang gửi..."}
                  {status === "streaming" && "Đang trả lời..."}
                  {status === "error" && "Thử lại"}
                  {status === "ready" && "Gửi"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col space-y-4 border p-4">
            <div className="flex flex-col border-b">Tạo cuộc hội thoại mới</div>
          </div>
        )}
      </div>
    </div>
  );
}
