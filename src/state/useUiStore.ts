// src/state/useUiStore.ts
import { create } from 'zustand'
import { type OmitIdAndCoords, type Player } from '../types/map.types' // Import Player type

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
  isValidPlacement: boolean
  editingPlayer: Player | null // NEW: Holds the full player object being edited
}

interface UiActions {
  togglePanel: (panelId: PanelId) => void
  switchPanel: (panelId: PanelId) => void
  closeAllPanels: () => void
  startPlayerPlacement: (playerData: OmitIdAndCoords) => void
  endPlayerPlacement: () => void
  setMouseWorldPosition: (pos: { x: number; y: number }) => void
  setPlacementValidity: (isValid: boolean) => void
  startEditingPlayer: (player: Player) => void // NEW: Action to open modal
  endEditingPlayer: () => void // NEW: Action to close modal
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,
  isPlacingPlayer: false,
  playerToPlace: null,
  mouseWorldPosition: null,
  isValidPlacement: true,
  editingPlayer: null, // Default to closed

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
      isValidPlacement: true,
    })),

  endPlayerPlacement: () =>
    set(() => ({ isPlacingPlayer: false, playerToPlace: null })),

  setMouseWorldPosition: (pos) => set(() => ({ mouseWorldPosition: pos })),

  setPlacementValidity: (isValid) => set(() => ({ isValidPlacement: isValid })),

  // New actions for the edit modal
  startEditingPlayer: (player) => set(() => ({ editingPlayer: player })),
  endEditingPlayer: () => set(() => ({ editingPlayer: null })),
}))
