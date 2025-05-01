import { Message as SDKMessage } from '@ai-sdk/react';
import clsx from 'clsx';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface ChatItemProps {
  message: SDKMessage;
  onOpenPDFViewer: (documentId: string) => void;
}

export function ChatItem({ message, onOpenPDFViewer }: ChatItemProps) {
  return (
    <div
      className={clsx(
        'flex flex-col space-y-1 max-w-2xl',
        message.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div
        className={clsx(
          'bg-primary-500 text-white px-3 py-2.5 rounded-xl prose prose-invert prose-p:m-0 max-w-none',
          message.role === 'user' ? 'bg-primary-500' : 'bg-gray-500'
        )}
      >
        {message.role === 'assistant' ? (
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              cite: ({ id, page }: any) => (
                <sup
                  className="text-xs bg-primary-600 rounded px-1 cursor-pointer"
                  title={`Tài liệu: ${id}, Trang: ${page}`}
                  onClick={() => onOpenPDFViewer(id)}
                >
                  [{page}]
                </sup>
              ),
            }}
          >
            {message.content}
          </Markdown>
        ) : (
          message.content
        )}
      </div>
      <div className="text-sm text-gray-500">
        {message.createdAt?.toLocaleString('vi-VN')}
      </div>
    </div>
  );
}
