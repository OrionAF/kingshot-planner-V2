import { create } from 'zustand'

type PanelId = 'alliance' | 'nav' | 'settings' | null

interface UiState {
  openPanel: PanelId
}

interface UiActions {
  togglePanel: (panelId: 'alliance' | 'nav' | 'settings') => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,
  togglePanel: (panelId) =>
    set((state) => ({
      openPanel: state.openPanel === panelId ? null : panelId,
    })),
}))
