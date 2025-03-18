import { create } from "zustand";
import { persist } from "zustand/middleware";

type RootStoreState = {};

type RootStoreActions = {};

type RootStore = RootStoreState & RootStoreActions;

export const useRootStore = create<RootStore>()(
  persist(() => ({}), { name: "ANPHUC-COPILOT" })
);
