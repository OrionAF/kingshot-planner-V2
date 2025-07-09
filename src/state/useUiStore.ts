// src/state/useUiStore.ts
import { create } from 'zustand'
import { type OmitIdAndCoords } from '../types/map.types'

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
  isPlacingPlayer: boolean
  playerToPlace: OmitIdAndCoords | null
  mouseWorldPosition: { x: number; y: number } | null
  isValidPlacement: boolean // NEW: Holds the validity result
}

interface UiActions {
  togglePanel: (panelId: PanelId) => void
  switchPanel: (panelId: PanelId) => void
  closeAllPanels: () => void
  startPlayerPlacement: (playerData: OmitIdAndCoords) => void
  endPlayerPlacement: () => void
  setMouseWorldPosition: (pos: { x: number; y: number }) => void
  setPlacementValidity: (isValid: boolean) => void // NEW: Setter action
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,
  isPlacingPlayer: false,
  playerToPlace: null,
  mouseWorldPosition: null,
  isValidPlacement: true, // Default to true

  togglePanel: (panelId) =>
    set((state) => ({
      openPanel: state.openPanel === panelId ? null : panelId,
    })),

  switchPanel: (panelId) => set(() => ({ openPanel: panelId })),

  closeAllPanels: () => set(() => ({ openPanel: null })),

  startPlayerPlacement: (playerData) =>
    set(() => ({
      isPlacingPlayer: true,
      playerToPlace: playerData,
      isValidPlacement: true, // Reset on start
    })),

  endPlayerPlacement: () =>
    set(() => ({
      isPlacingPlayer: false,
      playerToPlace: null,
    })),

  setMouseWorldPosition: (pos) => set(() => ({ mouseWorldPosition: pos })),

  // New action to update our validity flag
  setPlacementValidity: (isValid) => set(() => ({ isValidPlacement: isValid })),
}))
