"use client";

import {
  createConversation,
  deleteConversation,
  getConversations,
  updateConversation,
} from "@/app/actions";
import { useConversationStore } from "@/stores";
import { Conversation } from "@prisma/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatSidebar() {
  const router = useRouter();
  const params = useParams() as { id: string };

  const { currentConversationId, setCurrentConversationId } =
    useConversationStore();

  const { isLoading, data, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const { mutateAsync: mutateCreateConversation } = useMutation({
    mutationFn: createConversation,
  });

  const { mutateAsync: mutateUpdateConversation } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateConversation(id, name),
  });

  const { mutateAsync: mutateDeleteConversation } = useMutation({
    mutationFn: deleteConversation,
  });

  const conversations = data ?? [];

  useEffect(() => {
    if (isLoading) return;

    if (data && data.length === 0) {
      mutateCreateConversation("").then(async (conversation) => {
        setCurrentConversationId(conversation.id);
        await refetch();
      });
    }
  }, [data, isLoading, mutateCreateConversation, refetch]);

  useEffect(() => {
    if (isLoading) return;

    if (currentConversationId && params.id !== currentConversationId) {
      router.push(`/conversations/${currentConversationId}`);
    }
  }, [currentConversationId, params.id, router, isLoading]);

  const getConversationName = (conversation: Conversation) => {
    return conversation.name !== "" ? conversation.name : "Chat mới";
  };

  const handleCreateConversation = async () => {
    const newConversation = await mutateCreateConversation("");
    setCurrentConversationId(newConversation.id);

    await refetch();
  };

  const handleRenameConversation = async (id: string) => {
    const newName = prompt("Nhập tên cuộc hội thoại mới");
    if (newName && newName.trim() !== "") {
      await mutateUpdateConversation({ id, name: newName });
      await refetch();
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const confirm = window.confirm(
      "Bạn có chắc chắn muốn xóa cuộc hội thoại này?"
    );
    if (confirm) {
      if (currentConversationId === id) {
        if (conversations.length !== 0) {
          setCurrentConversationId(conversations[0].id);
        } else {
          setCurrentConversationId(undefined);
        }
      }

      await mutateDeleteConversation(id);
      await refetch();
    }
  };

  return (
    <div className="w-64 border-r pr-4 flex flex-col gap-4">
      <button
        className="border w-full px-2 py-2"
        onClick={handleCreateConversation}
      >
        Tạo mới
      </button>
      <div className="flex flex-col gap-2">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="flex border-b">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setCurrentConversationId(conversation.id)}
            >
              {getConversationName(conversation)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRenameConversation(conversation.id)}
                className="text-blue-500 cursor-pointer"
              >
                Đổi tên
              </button>
              <button
                onClick={() => handleDeleteConversation(conversation.id)}
                className="text-red-500 cursor-pointer"
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
