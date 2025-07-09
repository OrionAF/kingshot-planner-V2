import { create } from 'zustand'

interface UiState {
  openPanel: PanelId
}

// All possible panels that can be open
type PanelId =
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

interface UiActions {
  togglePanel: (panelId: PanelId) => void
  closeAllPanels: () => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,

  togglePanel: (panelId) =>
    set((state) => ({
      openPanel: state.openPanel === panelId ? null : panelId,
    })),

  closeAllPanels: () => set(() => ({ openPanel: null })),
}))
