// src/state/useUiStore.ts

import { create } from 'zustand';
import {
  type OmitIdAndCoords,
  type Player,
  type BuildingType,
} from '../types/map.types';
import { useMapStore } from './useMapStore';
import { useCameraStore } from './useCameraStore';
import { screenToWorld } from '../core/coordinate-utils';

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
  | 'stats'
  | 'tools'
  | null;

interface BuildModeState {
  activeAllianceId: number | null;
  selectedBuildingType: BuildingType | null;
}

interface UiState {
  openPanel: PanelId;
  isPlacingPlayer: boolean;
  playerToPlace: OmitIdAndCoords | null;
  mouseWorldPosition: { x: number; y: number } | null;
  isValidPlacement: boolean; // retained for quick checks
  lastPlacementResult?: import('../types/infrastructure.types').PlacementResult; // detailed info
  editingPlayer: Player | null;
  buildMode: BuildModeState;
}

interface UiActions {
  togglePanel: (panelId: PanelId) => void;
  switchPanel: (panelId: PanelId) => void;
  closeAllPanels: () => void;
  startPlayerPlacement: (playerData: OmitIdAndCoords) => void;
  endPlayerPlacement: () => void;
  exitPlacementMode: () => void;
  setMouseWorldPosition: (pos: { x: number; y: number }) => void;
  setPlacementValidity: (
    res: import('../types/infrastructure.types').PlacementResult,
  ) => void;
  startEditingPlayer: (player: Player) => void;
  endEditingPlayer: () => void;
  setActiveAllianceId: (id: number | null) => void;
  setSelectedBuildingType: (type: BuildingType | null) => void;
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,
  isPlacingPlayer: false,
  playerToPlace: null,
  mouseWorldPosition: null,
  isValidPlacement: true,
  lastPlacementResult: { valid: true },
  editingPlayer: null,
  buildMode: {
    activeAllianceId: null,
    selectedBuildingType: null,
  },

  togglePanel: (panelId) =>
    set((state) => ({
      openPanel: state.openPanel === panelId ? null : panelId,
    })),
  switchPanel: (panelId) => set(() => ({ openPanel: panelId })),
  closeAllPanels: () => set(() => ({ openPanel: null })),

  startPlayerPlacement: (playerData) => {
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;
    let initialResult: import('../types/infrastructure.types').PlacementResult =
      { valid: true };

    if (!isDesktop) {
      const camera = useCameraStore.getState();
      const { checkPlacementValidity } = useMapStore.getState();
      const [worldX, worldY] = screenToWorld(
        window.innerWidth / 2,
        window.innerHeight / 2,
        camera,
      );
      // FIX: Correctly call the validity check for a player
      initialResult = checkPlacementValidity(
        Math.round(worldX),
        Math.round(worldY),
        'player',
      );
    }

    set(() => ({
      isPlacingPlayer: true,
      playerToPlace: playerData,
      isValidPlacement: initialResult.valid,
      lastPlacementResult: initialResult,
      buildMode: {
        activeAllianceId: null,
        selectedBuildingType: null,
      },
    }));
  },
  endPlayerPlacement: () =>
    set(() => ({
      isPlacingPlayer: false,
      playerToPlace: null,
    })),

  exitPlacementMode: () => {
    set((state) => ({
      isPlacingPlayer: false,
      playerToPlace: null,
      buildMode: {
        ...state.buildMode,
        selectedBuildingType: null,
      },
    }));
  },

  setMouseWorldPosition: (pos) => set(() => ({ mouseWorldPosition: pos })),
  setPlacementValidity: (res) =>
    set(() => ({ isValidPlacement: res.valid, lastPlacementResult: res })),
  startEditingPlayer: (player) => set(() => ({ editingPlayer: player })),
  endEditingPlayer: () => set(() => ({ editingPlayer: null })),

  setActiveAllianceId: (id) =>
    set((state) => {
      const shouldClearBuilding =
        state.buildMode.activeAllianceId === id ||
        (id !== null && state.buildMode.activeAllianceId !== id);

      return {
        buildMode: {
          activeAllianceId: state.buildMode.activeAllianceId === id ? null : id,
          selectedBuildingType: shouldClearBuilding
            ? null
            : state.buildMode.selectedBuildingType,
        },
      };
    }),

  setSelectedBuildingType: (type) =>
    set((state) => {
      const newType =
        state.buildMode.selectedBuildingType === type ? null : type;

      if (!state.buildMode.activeAllianceId) return state;

      return {
        buildMode: { ...state.buildMode, selectedBuildingType: newType },
        isPlacingPlayer: false,
        playerToPlace: null,
      };
    }),
}));
