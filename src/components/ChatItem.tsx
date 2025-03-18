import { Message as SDKMessage } from "@ai-sdk/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatItemProps {
  message: SDKMessage;
}

export function ChatItem({ message }: ChatItemProps) {
  return (
    <div className="flex flex-col border-b">
      {message.role === "user" ? "Bạn: " : "AI: "}
      <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
    </div>
  );
}
