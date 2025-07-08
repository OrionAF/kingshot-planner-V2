import { create } from 'zustand'

type PanelId = 'alliance' | 'nav' | null

interface UiState {
  openPanel: PanelId
}

interface UiActions {
  togglePanel: (panelId: 'alliance' | 'nav') => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,
  togglePanel: (panelId) =>
    set((state) => ({
      openPanel: state.openPanel === panelId ? null : panelId,
    })),
}))
