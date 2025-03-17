import { getConversation, getMessages } from "@/app/actions";
import ChatWindow from "@/components/ChatWindow";
import { redirect } from "next/navigation";

export default async function Conversations({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversation = await getConversation(id);
  if (!conversation) {
    redirect("/");
  }

  const messages = await getMessages(id);

  return <ChatWindow conversation={conversation} messages={messages} />;
}
