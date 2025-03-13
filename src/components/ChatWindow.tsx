"use client";

import { Message, useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatItem({ message }: { message: Message }) {
  return (
    <div className="flex flex-col border-b">
      {message.role === "user" ? "Bạn: " : "AI: "}
      <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
    </div>
  );
}

export default function ChatWindow() {
  const { status, messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 3,
  });

  const isDisabled = status === "submitted" || status === "streaming";

  return (
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
      <form onSubmit={handleSubmit} className="flex flex-col mt-8 space-y-2">
        <textarea
          name="prompt"
          value={input}
          onChange={handleInputChange}
          className="border p-4"
          placeholder="Nhập tin nhắn..."
          rows={3}
          disabled={isDisabled}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 cursor-pointer"
            disabled={isDisabled}
          >
            {status === "submitted" && "Đang gửi..."}
            {status === "streaming" && "Đang trả lời..."}
            {status === "error" && "Thử lại"}
            {status === "ready" && "Gửi"}
          </button>
        </div>
      </form>
    </>
  );
}
