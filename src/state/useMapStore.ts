// src/state/useMapStore.ts

import { create } from 'zustand';
import {
  type BaseBuilding,
  type Alliance,
  type Player,
  type OmitIdAndCoords,
  type UserBuilding,
  type BuildingType,
} from '../types/map.types';
import baseMapData from '../assets/baseMap.json';
import { AppConfig, type BuildingDefinition } from '../config/appConfig';
import { generateId } from '../utils/idGenerator';

// ... (getBiomeForTile is unchanged)
function getBiomeForTile(x: number, y: number): string {
  const { fertile, plains } = AppConfig.biomeRegions;
  if (x >= fertile.x1 && x <= fertile.x2 && y >= fertile.y1 && y <= fertile.y2)
    return 'fertile';
  if (x >= plains.x1 && x <= plains.x2 && y >= plains.y1 && y <= plains.y2)
    return 'plains';
  return 'badlands';
}

function isTerritoryRuleMet(
  x: number,
  y: number, // FIX: The function needed the Y parameter
  def: BuildingDefinition,
  allianceTiles: Set<string>,
): boolean {
  // Check if footprint itself is on friendly territory
  for (let i = 0; i < def.w; i++) {
    for (let j = 0; j < def.h; j++) {
      if (allianceTiles.has(`${x + i},${y + j}`)) {
        // Use y + j
        return true;
      }
    }
  }

  // If not, check if the coverage area connects to friendly territory
  if (def.coverage > 0) {
    const radius = Math.floor(def.coverage / 2);
    const centerX = x + Math.floor(def.w / 2);
    const centerY = y + Math.floor(def.h / 2); // FIX: Use y here
    const startX = centerX - radius;
    const startY = centerY - radius;
    const endX = startX + def.coverage;
    const endY = startY + def.coverage;

    for (let i = startX; i < endX; i++) {
      for (let j = startY; j < endY; j++) {
        if (i === startX || i === endX - 1 || j === startY || j === endY - 1) {
          if (
            allianceTiles.has(`${i + 1},${j}`) ||
            allianceTiles.has(`${i - 1},${j}`) ||
            allianceTiles.has(`${i},${j + 1}`) ||
            allianceTiles.has(`${i},${j - 1}`)
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

interface MapState {
  baseBuildings: BaseBuilding[];
  buildingMap: Map<string, BaseBuilding>;
  alliances: Alliance[];
  players: Player[];
  userBuildings: UserBuilding[];
  claimedTerritory: Map<number, Set<string>>;
  globallyClaimedTiles: Map<string, number>;
}

interface MapActions {
  createAlliance: (newAllianceData: Omit<Alliance, 'id'>) => void;
  placePlayer: (data: OmitIdAndCoords, x: number, y: number) => void;
  updatePlayer: (id: number, updatedData: Partial<OmitIdAndCoords>) => void;
  deletePlayer: (id: number) => void;
  placeBuilding: (
    type: BuildingType,
    x: number,
    y: number,
    allianceId: number,
  ) => void;
  deleteBuilding: (id: number) => void;
  importPlan: (data: {
    alliances: Alliance[];
    players: Player[];
    userBuildings: UserBuilding[];
  }) => void;
  checkPlacementValidity: (
    x: number,
    y: number,
    type: BuildingType | 'player',
    allianceId?: number | null,
  ) => boolean;
  recalculateTerritory: () => void;
}
function processBaseMapData(): {
  buildings: BaseBuilding[];
  map: Map<string, BaseBuilding>;
} {
  interface RawBuilding {
    x: number;
    y: number;
    w: number;
    h: number;
    displayName: string;
    fillColor: string;
    borderColor?: string;
  }
  const allBuildings: BaseBuilding[] = [];
  const buildingMap = new Map<string, BaseBuilding>();
  for (const b of baseMapData.defaultBuildings as RawBuilding[]) {
    const buildingWithId: BaseBuilding = {
      ...(b as any),
      id: `${b.x},${b.y}`,
      color: b.fillColor,
    };
    allBuildings.push(buildingWithId);
    for (let dx = 0; dx < b.w; dx++) {
      for (let dy = 0; dy < b.h; dy++) {
        buildingMap.set(`${b.x + dx},${b.y + dy}`, buildingWithId);
      }
    }
  }
  return { buildings: allBuildings, map: buildingMap };
}

const initialMapData = processBaseMapData();
export const useMapStore = create<MapState & MapActions>((set, get) => ({
  baseBuildings: initialMapData.buildings,
  buildingMap: initialMapData.map,
  alliances: [],
  players: [],
  userBuildings: [],
  claimedTerritory: new Map(),
  globallyClaimedTiles: new Map(),
  recalculateTerritory: () => {
    const { userBuildings, alliances } = get();
    const newClaimedTerritory = new Map<number, Set<string>>();
    const newGloballyClaimedTiles = new Map<string, number>();

    alliances.forEach((a) => newClaimedTerritory.set(a.id, new Set()));

    for (const b of userBuildings) {
      const def = AppConfig.BUILDING_CATALOG[b.type];
      if (!def || def.coverage <= 0) continue;

      const allianceTerritory = newClaimedTerritory.get(b.allianceId);
      if (!allianceTerritory) continue;

      const radius = Math.floor(def.coverage / 2);
      const centerX = b.x + Math.floor(def.w / 2);
      const centerY = b.y + Math.floor(def.h / 2);

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const tileX = centerX + dx;
          const tileY = centerY + dy;
          const coordStr = `${tileX},${tileY}`;

          // TODO: Prevent claiming on Ruins/Forbidden tiles later
          if (!newGloballyClaimedTiles.has(coordStr)) {
            newGloballyClaimedTiles.set(coordStr, b.allianceId);
            allianceTerritory.add(coordStr);
          }
        }
      }
    }
    set({
      claimedTerritory: newClaimedTerritory,
      globallyClaimedTiles: newGloballyClaimedTiles,
    });
  },
  createAlliance: (newAllianceData) =>
    set((state) => {
      const newAlliance = { id: generateId(), ...newAllianceData };
      state.claimedTerritory.set(newAlliance.id, new Set());
      return { alliances: [...state.alliances, newAlliance] };
    }),

  placePlayer: (data, x, y) =>
    set((state) => {
      const newPlayer: Player = {
        ...data,
        id: generateId(),
        x,
        y,
        w: AppConfig.player.width,
        h: AppConfig.player.height,
      };
      return { players: [...state.players, newPlayer] };
    }),

  updatePlayer: (id, updatedData) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, ...updatedData } : p,
      ),
    })),

  deletePlayer: (id) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

  placeBuilding: (type, x, y, allianceId) => {
    const { alliances, recalculateTerritory } = get();
    const definition = AppConfig.BUILDING_CATALOG[type];
    const alliance = alliances.find((a) => a.id === allianceId);
    if (!definition || !alliance) return;

    const newBuilding: UserBuilding = {
      id: generateId(),
      type,
      x,
      y,
      allianceId,
      w: definition.w,
      h: definition.h,
      color: alliance.color,
    };
    set((state) => ({ userBuildings: [...state.userBuildings, newBuilding] }));
    recalculateTerritory();
  },

  deleteBuilding: (id) => {
    set((state) => ({
      userBuildings: state.userBuildings.filter((b) => b.id !== id),
    }));
    get().recalculateTerritory();
  },

  importPlan: (data) => {
    set(() => ({
      alliances: data.alliances ?? [],
      players: data.players ?? [],
      userBuildings: data.userBuildings ?? [],
    }));
    get().recalculateTerritory();
  },

  checkPlacementValidity: (x, y, type, allianceId = null) => {
    const { buildingMap, players, userBuildings, claimedTerritory } = get();
    const N = AppConfig.N;

    // Get object dimensions and rules
    let w = 0,
      h = 0,
      rule = 'any';
    let def: BuildingDefinition | null = null;

    if (type === 'player') {
      w = AppConfig.player.width;
      h = AppConfig.player.height;
    } else {
      def = AppConfig.BUILDING_CATALOG[type];
      w = def.w;
      h = def.h;
      rule = def.rule;
    }

    const biome = getBiomeForTile(x, y);
    if (
      (rule === 'fertile' && biome !== 'fertile') ||
      (rule === 'plains' && biome !== 'plains') ||
      (rule === 'badlands' && biome !== 'badlands')
    ) {
      return false;
    }

    const allianceTiles = claimedTerritory.get(allianceId ?? -1) ?? new Set();

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const checkX = x + i;
        const checkY = y + j;
        const coordStr = `${checkX},${checkY}`;

        if (checkX < 0 || checkX >= N || checkY < 0 || checkY >= N)
          return false;
        if (buildingMap.has(coordStr)) return false;

        for (const b of userBuildings) {
          if (
            checkX >= b.x &&
            checkX < b.x + b.w &&
            checkY >= b.y &&
            checkY < b.y + b.h
          )
            return false;
        }

        for (const p of players) {
          if (
            checkX >= p.x &&
            checkX < p.x + p.w &&
            checkY >= p.y &&
            checkY < p.y + p.h
          )
            return false;
        }

        if (rule === 'claimed' && !allianceTiles.has(coordStr)) {
          return false;
        }
      }
    }

    if (rule === 'territory' && def) {
      return isTerritoryRuleMet(x, y, def, allianceTiles);
    }

    return true;
  },
}));
