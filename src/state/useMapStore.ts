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
import { globalEventBus } from '../types/infrastructure.types';
import type { PlacementResult } from '../types/infrastructure.types';
import { generateId, seedIdCounter } from '../utils/idGenerator';

import { PERSIST_VERSION, migratePersisted } from './persistence';

// --- Color utility helpers for alliance auto-color assignment ---
function normalizeHex(hex: string): string {
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return '#' + hex.toLowerCase();
}

function parseColorToRgb01(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return [r, g, b];
  } else if (color.startsWith('rgb')) {
    const parts = color.match(/\d+/g);
    if (parts) {
      const [r, g, b] = parts.map(Number);
      return [r / 255, g / 255, b / 255];
    }
  }
  return [0, 0, 0];
}

function rgb01ToHex([r, g, b]: [number, number, number]): string {
  const to = (v: number) => {
    const n = Math.round(Math.min(1, Math.max(0, v)) * 255);
    return n.toString(16).padStart(2, '0');
  };
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function getBiomeForTile(x: number, y: number): string {
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
  /**
   * Cached per-alliance building counts for fast limit validation.
   * Map<allianceId, Record<BuildingType, count>>
   */
  buildingCounts: Map<number, Record<BuildingType, number>>;
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
  ) => import('../types/infrastructure.types').PlacementResult;
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
      buildingCounts: new Map(),
      // Helper to get or init a counts record
      _initCountsRecord(allianceId: number) {
        const { buildingCounts } = get();
        let rec = buildingCounts.get(allianceId);
        if (!rec) {
          rec = {} as Record<BuildingType, number>;
          buildingCounts.set(allianceId, rec);
        }
        return rec;
      },
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
        globalEventBus.emit('territory:recalculated', undefined);
      },
      createAlliance: (newAllianceData) =>
        set((state) => {
          // Color collision mitigation: ensure new alliance color is distinct from existing allies and biome palette
          const biomeColors = Object.values(AppConfig.biomeColors).map((c) =>
            parseColorToRgb01(c),
          );
          const existing = state.alliances.map((a) =>
            parseColorToRgb01(a.color),
          );
          const desired = parseColorToRgb01(newAllianceData.color);
          const { minColorDistance, minLuminanceDiff, maxAttempts } =
            AppConfig.allianceColorConstraints;

          const lum = (c: [number, number, number]) =>
            0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
          const dist = (
            a: [number, number, number],
            b: [number, number, number],
          ) =>
            Math.sqrt(
              (a[0] - b[0]) * (a[0] - b[0]) +
                (a[1] - b[1]) * (a[1] - b[1]) +
                (a[2] - b[2]) * (a[2] - b[2]),
            );

          function passes(c: [number, number, number]) {
            // Distinct from existing alliance colors
            if (existing.some((e) => dist(e, c) < minColorDistance))
              return false;
            // Distinct enough from biomes (either distance or luminance separation)
            if (
              biomeColors.some(
                (b) =>
                  dist(b, c) < minColorDistance &&
                  Math.abs(lum(b) - lum(c)) < minLuminanceDiff,
              )
            )
              return false;
            return true;
          }

          // Try desired first; if clash, attempt adjustments, then fallback to palette.
          let finalRgb = desired;
          if (!passes(finalRgb)) {
            // Small HSL nudges around hue & lightness
            const toHsl = (rgb: [number, number, number]) => {
              const [r, g, b] = rgb;
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const d = max - min;
              let h = 0;
              const l = (max + min) / 2;
              let s = 0;
              if (d !== 0) {
                s = d / (1 - Math.abs(2 * l - 1));
                switch (max) {
                  case r:
                    h = ((g - b) / d) % 6;
                    break;
                  case g:
                    h = (b - r) / d + 2;
                    break;
                  default:
                    h = (r - g) / d + 4;
                }
                h *= 60;
                if (h < 0) h += 360;
              }
              return [h, s, l] as [number, number, number];
            };
            const toRgb = (hsl: [number, number, number]) => {
              let [h, s, l] = hsl;
              const C = (1 - Math.abs(2 * l - 1)) * s;
              const Hp = h / 60;
              const X = C * (1 - Math.abs((Hp % 2) - 1));
              let r1 = 0,
                g1 = 0,
                b1 = 0;
              if (Hp >= 0 && Hp < 1) {
                r1 = C;
                g1 = X;
              } else if (Hp >= 1 && Hp < 2) {
                r1 = X;
                g1 = C;
              } else if (Hp >= 2 && Hp < 3) {
                g1 = C;
                b1 = X;
              } else if (Hp >= 3 && Hp < 4) {
                g1 = X;
                b1 = C;
              } else if (Hp >= 4 && Hp < 5) {
                r1 = X;
                b1 = C;
              } else if (Hp >= 5 && Hp < 6) {
                r1 = C;
                b1 = X;
              }
              const m = l - C / 2;
              return [r1 + m, g1 + m, b1 + m] as [number, number, number];
            };
            const baseHsl = toHsl(finalRgb);
            let attempt = 0;
            while (attempt < maxAttempts) {
              const hueJitter = (attempt + 1) * 11; // spread around color wheel
              const lShift =
                (attempt % 2 === 0 ? -1 : 1) * 0.04 * (attempt + 1);
              let h = (baseHsl[0] + hueJitter) % 360;
              let s = Math.min(1, baseHsl[1] * (1 + 0.02 * attempt));
              let l = Math.min(0.85, Math.max(0.15, baseHsl[2] + lShift));
              const candidate = toRgb([h, s, l]);
              if (passes(candidate)) {
                finalRgb = candidate;
                break;
              }
              attempt++;
            }
            if (!passes(finalRgb)) {
              // Fallback to next unused palette color
              const palette = AppConfig.ALLIANCE_COLOR_PALETTE;
              const usedHex = new Set(
                state.alliances.map((a) => normalizeHex(a.color)),
              );
              for (const hex of palette) {
                if (!usedHex.has(normalizeHex(hex))) {
                  const cand = parseColorToRgb01(hex);
                  if (passes(cand)) {
                    finalRgb = cand;
                    break;
                  }
                }
              }
            }
          }
          const finalHex = rgb01ToHex(finalRgb);
          const newAlliance = {
            id: generateId(),
            ...newAllianceData,
            color: finalHex,
          };
          state.claimedTerritory.set(newAlliance.id, new Set());
          const updated = { alliances: [...state.alliances, newAlliance] };
          queueMicrotask(() =>
            globalEventBus.emit('alliances:changed', undefined),
          );
          return updated;
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
        set((state) => {
          const updatedCounts = new Map(state.buildingCounts);
          let rec = updatedCounts.get(allianceId);
          if (!rec) {
            rec = {} as Record<BuildingType, number>;
            updatedCounts.set(allianceId, rec);
          }
          rec[type] = (rec[type] || 0) + 1;
          return {
            userBuildings: [...state.userBuildings, newBuilding],
            buildingCounts: updatedCounts,
          };
        });
        recalculateTerritory();
        globalEventBus.emit('alliances:changed', undefined);
      },

      deleteBuilding: (id) => {
        set((state) => {
          const target = state.userBuildings.find((ub) => ub.id === id);
          const updatedCounts = target
            ? (() => {
                const map = new Map(state.buildingCounts);
                const rec =
                  map.get(target.allianceId) ||
                  ({} as Record<BuildingType, number>);
                if (rec[target.type])
                  rec[target.type] = Math.max(0, rec[target.type] - 1);
                map.set(target.allianceId, rec);
                return map;
              })()
            : state.buildingCounts;
          return {
            userBuildings: state.userBuildings.filter((b) => b.id !== id),
            buildingCounts: updatedCounts,
          };
        });
        get().recalculateTerritory();
        globalEventBus.emit('alliances:changed', undefined);
      },

      importPlan: (data) => {
        set(() => {
          const alliances = data.alliances ?? [];
          const userBuildings = data.userBuildings ?? [];
          const counts = new Map<number, Record<BuildingType, number>>();
          for (const b of userBuildings) {
            let rec = counts.get(b.allianceId);
            if (!rec) {
              rec = {} as Record<BuildingType, number>;
              counts.set(b.allianceId, rec);
            }
            rec[b.type] = (rec[b.type] || 0) + 1;
          }
          return {
            alliances,
            players: data.players ?? [],
            userBuildings,
            buildingCounts: counts,
          };
        });
        get().recalculateTerritory();
        globalEventBus.emit('alliances:changed', undefined);
      },

      checkPlacementValidity: (() => {
        // Simple last-call memo to avoid recomputing when mouse stops briefly
        let lastKey: string | null = null;
        let lastResult: PlacementResult | null = null;
        return (x, y, type, allianceId = null) => {
          const key = `${x}|${y}|${type}|${allianceId ?? -1}`;
          if (key === lastKey && lastResult) return lastResult;

          const {
            buildingMap,
            players,
            userBuildings,
            claimedTerritory,
            globallyClaimedTiles,
          } = get();
          const N = AppConfig.N;
          let w = 0,
            h = 0,
            rule: BuildingDefinition['rule'] = 'any';
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

          // Fast rectangle bounds check (instead of per-tile)
          if (x < 0 || y < 0 || x + w > N || y + h > N) {
            lastKey = key;
            lastResult = {
              valid: false,
              reasonCode: 'OUT_OF_BOUNDS',
              message: 'Outside map bounds.',
            };
            return lastResult;
          }

          const biome = getBiomeForTile(x, y);
          if (
            (rule === 'fertile' && biome !== 'fertile') ||
            (rule === 'plains' && biome !== 'plains') ||
            (rule === 'badlands' && biome !== 'badlands')
          ) {
            lastKey = key;
            lastResult = {
              valid: false,
              reasonCode: 'BIOME_MISMATCH',
              message: `Requires ${rule} biome.`,
            };
            return lastResult;
          }

          const allianceTiles =
            claimedTerritory.get(allianceId ?? -1) ?? new Set<string>();

          // Bounding-box collision with user buildings (O(B))
          for (const b of userBuildings) {
            if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) {
              lastKey = key;
              lastResult = {
                valid: false,
                reasonCode: 'COLLIDES_USER',
                message: 'Overlaps your existing building.',
              };
              return lastResult;
            }
          }

          // Bounding-box collision with players (O(P))
          for (const p of players) {
            if (x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y) {
              lastKey = key;
              lastResult = {
                valid: false,
                reasonCode: 'COLLIDES_PLAYER',
                message: 'Overlaps a player.',
              };
              return lastResult;
            }
          }

          // Single tile pass for base-map collision + territory related checks
          const needsClaimCheck = rule === 'claimed';
          const checkForeign = allianceId != null && type !== 'player';
          for (let dy = 0; dy < h; dy++) {
            const rowY = y + dy;
            for (let dx = 0; dx < w; dx++) {
              const colX = x + dx;
              const coordStr = `${colX},${rowY}`;
              if (buildingMap.has(coordStr)) {
                lastKey = key;
                lastResult = {
                  valid: false,
                  reasonCode: 'COLLIDES_BASE',
                  message: 'Overlaps base map structure.',
                };
                return lastResult;
              }
              if (checkForeign) {
                const owner = globallyClaimedTiles.get(coordStr);
                if (owner != null && owner !== allianceId) {
                  lastKey = key;
                  lastResult = {
                    valid: false,
                    reasonCode: 'FOREIGN_TERRITORY',
                    message: "Tile is within another alliance's territory.",
                  };
                  return lastResult;
                }
              }
              if (needsClaimCheck && !allianceTiles.has(coordStr)) {
                lastKey = key;
                lastResult = {
                  valid: false,
                  reasonCode: 'TERRITORY_REQUIRED',
                  message: 'Tile not within claimed territory.',
                };
                return lastResult;
              }
            }
          }

          if (rule === 'territory' && def) {
            const ok = isTerritoryRuleMet(x, y, def, allianceTiles);
            if (!ok) {
              lastKey = key;
              lastResult = {
                valid: false,
                reasonCode: 'TERRITORY_RULE_UNMET',
                message:
                  'Must border or be within coverage of alliance territory.',
              };
              return lastResult;
            }
          }

          if (def && allianceId != null && typeof def.limit === 'number') {
            const { buildingCounts } = get();
            const currentCount =
              buildingCounts.get(allianceId)?.[type as BuildingType] || 0;
            const remaining = (def.limit ?? Infinity) - currentCount;
            if (remaining <= 0) {
              lastKey = key;
              lastResult = {
                valid: false,
                reasonCode: 'LIMIT_REACHED',
                message: `Limit (${def.limit}) reached for ${def.name}.`,
              };
              return lastResult;
            }
            lastKey = key;
            lastResult = { valid: true, message: `${remaining} remaining` };
            return lastResult;
          }
          lastKey = key;
          lastResult = { valid: true };
          return lastResult;
        };
      })(),
    }),
    {
      name: 'kingshot-plan-storage',
      version: PERSIST_VERSION,
      migrate: (persisted, version) =>
        migratePersisted(persisted as any, version),
      partialize: (state) => ({
        version: PERSIST_VERSION,
        alliances: state.alliances,
        players: state.players,
        userBuildings: state.userBuildings,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            if (import.meta.env.DEV) {
              console.log('Plan loaded from browser storage.');
            }
            state.recalculateTerritory();
            // Rebuild buildingCounts cache from persisted userBuildings
            const counts = new Map<number, Record<BuildingType, number>>();
            for (const b of state.userBuildings) {
              let rec = counts.get(b.allianceId);
              if (!rec) {
                rec = {} as Record<BuildingType, number>;
                counts.set(b.allianceId, rec);
              }
              rec[b.type] = (rec[b.type] || 0) + 1;
            }
            state.buildingCounts = counts;
            // Seed ID counter to avoid collisions after reload
            const maxPlayerId = state.players.reduce(
              (max, p) => Math.max(max, p.id),
              0,
            );
            const maxBuildingId = state.userBuildings.reduce(
              (max, b) => Math.max(max, b.id),
              0,
            );
            const next = Math.max(maxPlayerId, maxBuildingId) + 1;
            seedIdCounter(next);
          }
        };
      },
    },
  ),
);
