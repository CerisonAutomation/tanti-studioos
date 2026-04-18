// Global UI state using Zustand
import { create } from 'zustand'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Active module
  activeModule: string
  setActiveModule: (module: string) => void
  
  // Command palette
  commandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  
  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  
  // Modal states
  modals: Record<string, boolean>
  openModal: (name: string) => void
  closeModal: (name: string) => void
  
  // Toast/notification queue
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
  
  // Selected items (for bulk actions)
  selectedItems: string[]
  toggleSelectItem: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Active module
  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),
  
  // Command palette
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  
  // Theme
  theme: 'light',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
  setTheme: (theme) => set({ theme }),
  
  // Modals
  modals: {},
  openModal: (name) => set((s) => ({ modals: { ...s.modals, [name]: true } })),
  closeModal: (name) => set((s) => ({ modals: { ...s.modals, [name]: false } })),
  
  // Toasts
  toasts: [],
  addToast: (message, type = 'info') => set((s) => ({
    toasts: [...s.toasts, { id: Date.now().toString(), message, type }]
  })),
  removeToast: (id) => set((s) => ({
    toasts: s.toasts.filter((t) => t.id !== id)
  })),
  
  // Selection
  selectedItems: [],
  toggleSelectItem: (id) => set((s) => ({
    selectedItems: s.selectedItems.includes(id)
      ? s.selectedItems.filter((i) => i !== id)
      : [...s.selectedItems, id]
  })),
  selectAll: (ids) => set({ selectedItems: ids }),
  clearSelection: () => set({ selectedItems: [] }),
}))