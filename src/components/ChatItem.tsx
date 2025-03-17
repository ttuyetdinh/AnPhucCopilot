import { Message } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatItemProps {
  message: Message;
}

export function ChatItem({ message }: ChatItemProps) {
  return (
    <div className="flex flex-col border-b">
      {message.role === "user" ? "Bạn: " : "AI: "}
      <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
    </div>
  );
}
