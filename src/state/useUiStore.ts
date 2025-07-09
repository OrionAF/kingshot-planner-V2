import { create } from 'zustand'

// All possible panels that can be open
export type PanelId =
  | 'alliance'
  | 'build'
  | 'player'
  | 'bookmarks'
  | 'nav'
  | 'overwatch'
  | 'zoomPresets'
  | 'minimap'
  | 'settings'
  | 'management'
  | 'tools'
  | null

interface UiState {
  openPanel: PanelId
}

interface UiActions {
  togglePanel: (panelId: PanelId) => void
  switchPanel: (panelId: PanelId) => void // New action for clean switching
  closeAllPanels: () => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,

  togglePanel: (panelId) =>
    set((state) => ({
      // If the clicked panel is already open, close it. Otherwise, open it.
      openPanel: state.openPanel === panelId ? null : panelId,
    })),

  // New action to just open a specific panel, guaranteeing any other is closed.
  switchPanel: (panelId) => set(() => ({ openPanel: panelId })),

  closeAllPanels: () => set(() => ({ openPanel: null })),
}))
