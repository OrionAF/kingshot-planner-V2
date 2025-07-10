// src/state/useUiStore.ts

import { create } from 'zustand'
import {
  type OmitIdAndCoords,
  type Player,
  type BuildingType,
} from '../types/map.types' // Import BuildingType
import { useMapStore } from './useMapStore'
import { useCameraStore } from './useCameraStore'
import { screenToWorld } from '../core/coordinate-utils'
import { AppConfig } from '../config/appConfig'

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

interface BuildModeState {
  activeAllianceId: number | null
  selectedBuildingType: BuildingType | null
}

interface UiState {
  openPanel: PanelId
  isPlacingPlayer: boolean
  playerToPlace: OmitIdAndCoords | null
  mouseWorldPosition: { x: number; y: number } | null
  isValidPlacement: boolean
  editingPlayer: Player | null
  buildMode: BuildModeState
}

interface UiActions {
  togglePanel: (panelId: PanelId) => void
  switchPanel: (panelId: PanelId) => void
  closeAllPanels: () => void
  startPlayerPlacement: (playerData: OmitIdAndCoords) => void
  endPlayerPlacement: () => void
  setMouseWorldPosition: (pos: { x: number; y: number }) => void
  setPlacementValidity: (isValid: boolean) => void
  startEditingPlayer: (player: Player) => void
  endEditingPlayer: () => void
  setActiveAllianceId: (id: number | null) => void
  setSelectedBuildingType: (type: BuildingType | null) => void
}

export const useUiStore = create<UiState & UiActions>((set, get) => ({
  // === State ===
  openPanel: null,
  isPlacingPlayer: false,
  playerToPlace: null,
  mouseWorldPosition: null,
  isValidPlacement: true,
  editingPlayer: null,
  buildMode: {
    activeAllianceId: null,
    selectedBuildingType: null,
  },

  // === Actions ===
  togglePanel: (panelId) =>
    set((state) => ({
      openPanel: state.openPanel === panelId ? null : panelId,
    })),
  switchPanel: (panelId) => set(() => ({ openPanel: panelId })),
  closeAllPanels: () => set(() => ({ openPanel: null })),

  startPlayerPlacement: (playerData) => {
    // FIX: Check initial placement validity immediately
    const isDesktop = window.matchMedia('(min-width: 769px)').matches
    let initialValidity = true

    if (!isDesktop) {
      // On mobile, check the center of the screen
      const camera = useCameraStore.getState()
      const { checkPlacementValidity } = useMapStore.getState()
      const [worldX, worldY] = screenToWorld(
        window.innerWidth / 2,
        window.innerHeight / 2,
        camera
      )
      initialValidity = checkPlacementValidity(
        Math.round(worldX),
        Math.round(worldY),
        AppConfig.player.width,
        AppConfig.player.height
      )
    }

    set(() => ({
      isPlacingPlayer: true,
      playerToPlace: playerData,
      isValidPlacement: initialValidity,
    }))
  },
  endPlayerPlacement: () =>
    set((state) => {
      // Also ensure we exit build mode if a player placement is ended.
      if (state.buildMode.selectedBuildingType) {
        return {
          isPlacingPlayer: false,
          playerToPlace: null,
          buildMode: { ...state.buildMode, selectedBuildingType: null },
        }
      }
      return { isPlacingPlayer: false, playerToPlace: null }
    }),

  setMouseWorldPosition: (pos) => set(() => ({ mouseWorldPosition: pos })),
  setPlacementValidity: (isValid) => set(() => ({ isValidPlacement: isValid })),
  startEditingPlayer: (player) => set(() => ({ editingPlayer: player })),
  endEditingPlayer: () => set(() => ({ editingPlayer: null })),

  // NEW build mode actions
  setActiveAllianceId: (id) =>
    set((state) => ({
      buildMode: { ...state.buildMode, activeAllianceId: id },
    })),

  setSelectedBuildingType: (type) =>
    set((state) => {
      // If the same building type is clicked again, deselect it.
      const newType =
        state.buildMode.selectedBuildingType === type ? null : type
      return {
        buildMode: { ...state.buildMode, selectedBuildingType: newType },
      }
    }),
}))
