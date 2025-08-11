// src/state/useUiStore.ts

import { create } from 'zustand';
import {
  type OmitIdAndCoords,
  type Player,
  type BuildingType,
} from '../types/map.types';
import { useMapStore } from './useMapStore';
import { useCameraStore } from './useCameraStore';
import { screenToWorld, snapWorldToTile } from '../core/coordinate-utils';

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
  minimapVisible: boolean;
  isPlacingPlayer: boolean;
  playerToPlace: OmitIdAndCoords | null;
  mouseWorldPosition: { x: number; y: number } | null;
  isValidPlacement: boolean; // retained for quick checks
  lastPlacementResult?: import('../types/infrastructure.types').PlacementResult; // detailed info
  editingPlayer: Player | null;
  buildMode: BuildModeState;
  minimapLayers: {
    // Group visibility toggles
    alliancesGroup: boolean; // master show/hide for alliance-related overlays
    mapBuildingsGroup: boolean; // master show/hide for static map buildings
    playersGroup: boolean; // master show/hide for players
    resourcesGroup: boolean; // master show/hide for alliance resource nodes
    // Alliance sub toggles
    allianceBuildings: boolean;
    allianceTerritory: boolean;
    // Players
    players: boolean;
    // Map Buildings high-level categories
    kingCastle: boolean;
    fortresses: boolean; // enables all fortresses when individual ones are also on
    sanctuaries: boolean; // enables all sanctuaries when individual ones are also on
    outposts: boolean; // enables all outposts when individual type toggles are also on
    // Individual Fortress toggles
    fortress_1: boolean;
    fortress_2: boolean;
    fortress_3: boolean;
    fortress_4: boolean;
    // Individual Sanctuary toggles
    sanctuary_1: boolean;
    sanctuary_2: boolean;
    sanctuary_3: boolean;
    sanctuary_4: boolean;
    sanctuary_5: boolean;
    sanctuary_6: boolean;
    sanctuary_7: boolean;
    sanctuary_8: boolean;
    sanctuary_9: boolean;
    sanctuary_10: boolean;
    sanctuary_11: boolean;
    sanctuary_12: boolean;
    // Outpost type toggles (by prototype / level)
    lv1_builder: boolean;
    lv3_builder: boolean;
    lv1_scholar: boolean;
    lv3_scholar: boolean;
    lv1_forager: boolean;
    lv1_harvest: boolean;
    lv2_armory: boolean;
    lv4_armory: boolean;
    lv2_arsenal: boolean;
    lv4_arsenal: boolean;
    lv2_drillCamp: boolean;
    lv3_frontierLodge: boolean;
    // Resource types
    rss_food: boolean;
    rss_wood: boolean;
    rss_stone: boolean;
    rss_iron: boolean;
  };
}

interface UiActions {
  togglePanel: (panelId: PanelId) => void;
  switchPanel: (panelId: PanelId) => void;
  closeAllPanels: () => void;
  toggleMinimapVisibility: () => void;
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
  toggleMinimapLayer: (key: keyof UiState['minimapLayers']) => void;
  setMinimapLayer: (
    key: keyof UiState['minimapLayers'],
    value: boolean,
  ) => void;
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  openPanel: null,
  minimapVisible: true,
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
  minimapLayers: {
    alliancesGroup: true,
    mapBuildingsGroup: true,
    playersGroup: true,
    resourcesGroup: true,
    allianceBuildings: true,
    allianceTerritory: true,
    players: true,
    kingCastle: true,
    fortresses: true,
    sanctuaries: true,
    outposts: true,
    fortress_1: true,
    fortress_2: true,
    fortress_3: true,
    fortress_4: true,
    sanctuary_1: true,
    sanctuary_2: true,
    sanctuary_3: true,
    sanctuary_4: true,
    sanctuary_5: true,
    sanctuary_6: true,
    sanctuary_7: true,
    sanctuary_8: true,
    sanctuary_9: true,
    sanctuary_10: true,
    sanctuary_11: true,
    sanctuary_12: true,
    lv1_builder: true,
    lv3_builder: true,
    lv1_scholar: true,
    lv3_scholar: true,
    lv1_forager: true,
    lv1_harvest: true,
    lv2_armory: true,
    lv4_armory: true,
    lv2_arsenal: true,
    lv4_arsenal: true,
    lv2_drillCamp: true,
    lv3_frontierLodge: true,
    rss_food: true,
    rss_wood: true,
    rss_stone: true,
    rss_iron: true,
  },

  togglePanel: (panelId) =>
    set((state) => ({
      openPanel: state.openPanel === panelId ? null : panelId,
    })),
  switchPanel: (panelId) => set(() => ({ openPanel: panelId })),
  closeAllPanels: () => set(() => ({ openPanel: null })),

  toggleMinimapVisibility: () =>
    set((state) => ({ minimapVisible: !state.minimapVisible })),

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
      const [tx, ty] = snapWorldToTile(worldX, worldY);
      initialResult = checkPlacementValidity(tx, ty, 'player');
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
  toggleMinimapLayer: (key) =>
    set((state) => ({
      minimapLayers: {
        ...state.minimapLayers,
        [key]: !state.minimapLayers[key],
      },
    })),
  setMinimapLayer: (key, value) =>
    set((state) => ({
      minimapLayers: { ...state.minimapLayers, [key]: value },
    })),
}));
