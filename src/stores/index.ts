import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type RootStoreState = {
  isAdmin: boolean;
};

type RootStoreActions = {
  setIsAdmin: (isAdmin: boolean) => void;
};

type RootStore = RootStoreState & RootStoreActions;

export const useRootStore = create<RootStore>()(
  persist(
    (set) => ({
      isAdmin: false,
      setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),
    }),
    { name: 'ANPHUC-COPILOT' }
  )
);
