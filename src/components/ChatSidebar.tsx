'use client';

import { Button, Listbox, ListboxItem } from '@heroui/react';
import { Conversation } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import {
  createConversation,
  deleteConversation,
  getConversations,
  updateConversationName,
} from '@/app/actions';

interface ChatSidebarProps {
  conversationId?: string;
}

export default function ChatSidebar({}: ChatSidebarProps) {
  const router = useRouter();
  const params = useParams() as { id: string };

  const { data, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const { mutateAsync: mutateCreateConversation } = useMutation({
    mutationFn: createConversation,
    onError: (error) => {
      console.error('Lỗi khi tạo cuộc hội thoại mới:', error);

      alert('Có lỗi xảy ra khi tạo cuộc hội thoại mới');
    },
  });

  const { mutateAsync: mutateUpdateConversationName } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateConversationName(id, name),
    onError: (error) => {
      console.error('Lỗi khi đổi tên cuộc hội thoại:', error);
      alert('Có lỗi xảy ra khi đổi tên cuộc hội thoại');
    },
  });

  const { mutateAsync: mutateDeleteConversation } = useMutation({
    mutationFn: deleteConversation,
    onError: (error) => {
      console.error('Lỗi khi xóa cuộc hội thoại:', error);
      alert('Có lỗi xảy ra khi xóa cuộc hội thoại');
    },
  });

  const getConversationName = (conversation: Conversation) => {
    return conversation.name.trim() !== ''
      ? conversation.name
      : 'Cuộc hội thoại mới';
  };

  const handleCreateConversation = async () => {
    const newConversation = await mutateCreateConversation('');
    router.push(`/conversations/${newConversation.id}`);
  };

  const handleRenameConversation = async (id: string) => {
    const newName = prompt('Nhập tên cuộc hội thoại mới');
    if (newName && newName.trim() !== '') {
      await mutateUpdateConversationName({ id, name: newName });
      await refetch();
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa cuộc hội thoại này?'
    );
    if (confirm) {
      await mutateDeleteConversation(id);

      if (params.id === id) {
        router.push('/');
      } else {
        await refetch();
      }
    }
  };

  return (
    <div className="flex w-64 flex-col space-y-4">
      <div className="flex-1">
        <Listbox
          items={data ?? []}
          className="p-0"
          onAction={(key) => router.push(`/conversations/${key}`)}
          emptyContent="Không có hội thoại"
        >
          {(item) => (
            <ListboxItem
              key={item.id}
              className={clsx(
                'px-3 py-2 group',
                item.id === params.id && 'bg-blue-500 text-white'
              )}
              classNames={{ title: 'flex' }}
              color={item.id === params.id ? 'primary' : 'default'}
            >
              <div className="flex-1">{getConversationName(item)}</div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className={clsx(
                    'cursor-pointer text-gray-400 hover:text-blue-600',
                    item.id === params.id && 'text-white hover:text-white'
                  )}
                  onClick={() => handleRenameConversation(item.id)}
                >
                  <PencilIcon size={11} />
                </button>
                <button
                  className={clsx(
                    'cursor-pointer text-gray-400 hover:text-red-600',
                    item.id === params.id && 'text-white hover:text-white'
                  )}
                  onClick={() => handleDeleteConversation(item.id)}
                >
                  <TrashIcon size={11} />
                </button>
              </div>
            </ListboxItem>
          )}
        </Listbox>
      </div>
      <Button color="primary" onPress={handleCreateConversation}>
        Tạo mới
      </Button>
    </div>
  );
}
