'use client';

import { Conversation } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import {
  createConversation,
  deleteConversation,
  getConversations,
  updateConversationName,
} from '@/app/actions';

export default function ChatSidebar() {
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
    return conversation.name.trim() !== '' ? conversation.name : 'Chat mới';
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
    <div className="flex w-64 flex-col gap-4 border-r pr-4">
      <button
        className="w-full border px-2 py-2"
        onClick={handleCreateConversation}
      >
        Tạo mới
      </button>
      <div className="flex flex-col gap-2">
        {data?.map((conversation) => (
          <div key={conversation.id} className="flex border-b">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => router.push(`/conversations/${conversation.id}`)}
            >
              {getConversationName(conversation)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRenameConversation(conversation.id)}
                className="cursor-pointer text-blue-500"
              >
                Đổi tên
              </button>
              <button
                onClick={() => handleDeleteConversation(conversation.id)}
                className="cursor-pointer text-red-500"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
