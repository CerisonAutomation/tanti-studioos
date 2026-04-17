import { create } from "zustand";

export type ActiveModule =
  | "dashboard"
  | "clients"
  | "projects"
  | "quotes"
  | "inbox"
  | "floorplan"
  | "mood-board"
  | "procurement"
  | "expenses"
  | "knowledge-base"
  | "ai-design"
  | "settings"
  | "agents";

interface AppState {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  aiChatOpen: boolean;
  setAiChatOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: "dashboard",
  setActiveModule: (module) => set({ activeModule: module }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedClientId: null,
  setSelectedClientId: (id) => set({ selectedClientId: id }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  aiChatOpen: false,
  setAiChatOpen: (open) => set({ aiChatOpen: open }),
}));
