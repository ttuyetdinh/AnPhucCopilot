import { create } from "zustand";
import { persist } from "zustand/middleware";

type ConversationStoreState = {
  currentConversationId?: string;
};

type ConversationStoreActions = {
  setCurrentConversationId: (id?: string) => void;
};

type ConversationStore = ConversationStoreState & ConversationStoreActions;

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set) => ({
      currentConversationId: undefined,
      setCurrentConversationId: (id) => set({ currentConversationId: id }),
    }),
    { name: "ANPHUC-COPILOT-CONVERSATIONS" }
  )
);
