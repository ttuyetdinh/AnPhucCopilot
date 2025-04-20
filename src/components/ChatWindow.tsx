'use client';

import { Message as SDKMessage, useChat } from '@ai-sdk/react';
import { ScrollShadow } from '@heroui/scroll-shadow';
import TextareaAutosize from 'react-textarea-autosize';

import { useScrollToBottom } from '@/hooks/useScrollToBottom';

import { ChatItem } from './ChatItem';
import ChatSidebar from './ChatSidebar';

interface ChatWindowProps {
  conversationId?: string;
  initialMessages?: SDKMessage[];
}

export default function ChatWindow({
  conversationId,
  initialMessages,
}: ChatWindowProps) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    id: conversationId,
    initialMessages,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody({ id, messages }) {
      return {
        id,
        message: messages[messages.length - 1],
      };
    },
    maxSteps: 3,
  });

  const { ref: messagesEndRef, scrollToBottom } = useScrollToBottom(messages, {
    autoScroll: true,
    smooth: true,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e);
    setTimeout(scrollToBottom, 100);
  };

  const renderEmptyChat = () => (
    <div className="flex justify-center h-full items-center text-gray-500 text-lg">
      Chào bạn, tôi có thể giúp gì cho bạn?
    </div>
  );

  return (
    <div className="flex space-x-4 flex-1">
      <ChatSidebar conversationId={conversationId} />
      <div className="flex-1 bg-white rounded-xl flex flex-col">
        {conversationId ? (
          <>
            <ScrollShadow
              ref={messagesEndRef}
              size={20}
              className="flex-1 flex flex-col space-y-4 p-4 max-h-[calc(100vh-240px)] overflow-y-auto"
            >
              {messages.length > 0
                ? messages.map((message) => (
                    <ChatItem key={message.id} message={message} />
                  ))
                : renderEmptyChat()}
            </ScrollShadow>
            <form onSubmit={handleFormSubmit} className="p-4">
              <TextareaAutosize
                name="prompt"
                value={input}
                onChange={handleInputChange}
                className="p-4 rounded-xl border focus:outline-none focus:border-primary-500 w-full"
                placeholder="Nhập tin nhắn..."
                minRows={2}
                maxRows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
              />
            </form>
          </>
        ) : (
          renderEmptyChat()
        )}
      </div>
    </div>
  );
}
