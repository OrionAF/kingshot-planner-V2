// src/state/useMapStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  y: number,
  def: BuildingDefinition,
  allianceTiles: Set<string>,
): boolean {
  for (let i = 0; i < def.w; i++) {
    for (let j = 0; j < def.h; j++) {
      if (allianceTiles.has(`${x + i},${y + j}`)) {
        return true;
      }
    }
  }

  if (def.coverage > 0) {
    const radius = Math.floor(def.coverage / 2);
    const centerX = x + Math.floor(def.w / 2);
    const centerY = y + Math.floor(def.h / 2);
    const startX = centerX - radius;
    const startY = centerY - radius;
    const endX = startX + def.coverage;
    const endY = startY + def.coverage;

    for (let i = startX; i < endX; i++) {
      for (let j = startY; j < endY; j++) {
        if (i === startX || i === endX - 1 || j === startY || j === endY - 1) {
          const neighbors = [
            [i + 1, j],
            [i - 1, j],
            [i, j + 1],
            [i, j - 1], // Orthogonal
            [i + 1, j + 1],
            [i - 1, j - 1],
            [i + 1, j - 1],
            [i - 1, j + 1], // Diagonal
          ];
          for (const [nx, ny] of neighbors) {
            if (allianceTiles.has(`${nx},${ny}`)) {
              return true;
            }
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
  interface Prototype {
    w: number;
    h: number;
    dpName?: string;
    ruins?: number;
    imgKey: string;
    imgScl: number;
    imgSclFar: number;
    imgRndW: number;
    imgRndH: number;
    fillCol: string;
    brdCol: string;
  }
  interface RawBuildingInstance {
    id: string;
    prototype?: string;
    dpName?: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
    imgKey?: string;
    imgScl?: number;
    imgSclFar?: number;
    imgRndW?: number;
    imgRndH?: number;
    anchorTile?: { x: number; y: number };
    fillCol?: string;
    brdCol?: string;
  }

  const prototypes = (baseMapData as any).prototypes as Record<
    string,
    Prototype
  >;
  const allBuildings: BaseBuilding[] = [];
  const buildingMap = new Map<string, BaseBuilding>();

  for (const b of baseMapData.defaultBuildings as RawBuildingInstance[]) {
    const prototypeData = b.prototype ? prototypes[b.prototype] : {};
    const mergedData = { ...prototypeData, ...b };

    const building: BaseBuilding = {
      id: mergedData.id,
      dpName: mergedData.dpName || 'Unnamed Building',
      x: mergedData.x,
      y: mergedData.y,
      w: mergedData.w || 1,
      h: mergedData.h || 1,
      color: mergedData.fillCol || 'transparent',
      brdCol: mergedData.brdCol,
      imgKey: mergedData.imgKey,
      imgScl: mergedData.imgScl,
      imgSclFar: mergedData.imgSclFar,
      imgRndW: mergedData.imgRndW,
      imgRndH: mergedData.imgRndH,
      anchorTile: mergedData.anchorTile,
    };
    allBuildings.push(building);

    for (let dx = 0; dx < building.w; dx++) {
      for (let dy = 0; dy < building.h; dy++) {
        buildingMap.set(`${building.x + dx},${building.y + dy}`, building);
      }
    }
  }

  for (const rss of baseMapData.allianceRssBuildings as any[]) {
    const style =
      AppConfig.ALLIANCE_RSS_STYLES[
        rss.type as keyof typeof AppConfig.ALLIANCE_RSS_STYLES
      ];
    const building: BaseBuilding = {
      id: `${rss.type}-${rss.x}-${rss.y}`,
      dpName: style.dpName,
      x: rss.x,
      y: rss.y,
      w: 2,
      h: 2,
      color: style.fillCol,
      brdCol: style.brdCol,
    };
    allBuildings.push(building);
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        buildingMap.set(`${rss.x + dx},${rss.y + dy}`, building);
      }
    }
  }

  return { buildings: allBuildings, map: buildingMap };
}

const initialMapData = processBaseMapData();

export const useMapStore = create<MapState & MapActions>()(
  persist(
    (set, get) => ({
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
        const { recalculateTerritory } = get();
        const definition = AppConfig.BUILDING_CATALOG[type];
        const alliance = get().alliances.find((a) => a.id === allianceId);
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
        set((state) => ({
          userBuildings: [...state.userBuildings, newBuilding],
        }));
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

        const allianceTiles =
          claimedTerritory.get(allianceId ?? -1) ?? new Set();

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
    }),
    {
      name: 'kingshot-plan-storage',
      partialize: (state) => ({
        alliances: state.alliances,
        players: state.players,
        userBuildings: state.userBuildings,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            console.log('Plan loaded from browser storage.');
            state.recalculateTerritory();
          }
        };
      },
    },
  ),
);
