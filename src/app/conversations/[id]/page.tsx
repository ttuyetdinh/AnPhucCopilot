import { redirect } from 'next/navigation';

import { getConversationById, getMessages } from '@/app/actions';
import ChatWindow from '@/components/ChatWindow';

export const dynamic = 'force-dynamic';

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversation = await getConversationById(id);
  if (!conversation) {
    return redirect('/');
  }

  const messages = await getMessages(conversation.id);

  return (
    <ChatWindow
      conversationId={conversation.id}
      initialMessages={messages.map((message) => ({
        ...message,
        parts: message.parts as any[],
      }))}
    />
  );
}
