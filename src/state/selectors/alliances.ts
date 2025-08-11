// Alliance-related derived selectors
import { useMapStore } from '../useMapStore';
import { AppConfig } from '../../config/appConfig';
import type { AllianceStats } from '../../types/infrastructure.types';

let lastHashStats = '';
let lastAllianceStats: AllianceStats[] = [];
export function getAllianceStats(): AllianceStats[] {
  const { alliances, userBuildings, claimedTerritory } = useMapStore.getState();
  const hash = `${alliances.length}|${userBuildings.length}|${claimedTerritory.size}`;
  if (hash === lastHashStats) return lastAllianceStats;
  const result: AllianceStats[] = alliances.map((a) => ({
    allianceId: a.id,
    territoryTileCount: claimedTerritory.get(a.id)?.size || 0,
    buildingCounts: {},
  }));
  const byAlliance = new Map(result.map((r) => [r.allianceId, r]));
  for (const b of userBuildings) {
    const stats = byAlliance.get(b.allianceId);
    if (!stats) continue;
    stats.buildingCounts[b.type] = (stats.buildingCounts[b.type] || 0) + 1;
  }
  lastHashStats = hash;
  lastAllianceStats = result;
  return result;
}

// Territory density (buildings per claimed tile)
let lastHashDensity = '';
let lastDensity: {
  allianceId: number;
  tiles: number;
  buildings: number;
  density: number;
}[] = [];
export function getTerritoryDensity() {
  const { alliances, userBuildings, claimedTerritory } = useMapStore.getState();
  const hash = `${alliances.length}|${userBuildings.length}|${claimedTerritory.size}`;
  if (hash === lastHashDensity) return lastDensity;
  const counts = new Map<number, number>();
  for (const b of userBuildings)
    counts.set(b.allianceId, (counts.get(b.allianceId) || 0) + 1);
  const out = alliances.map((a) => {
    const tiles = claimedTerritory.get(a.id)?.size || 0;
    const buildings = counts.get(a.id) || 0;
    return {
      allianceId: a.id,
      tiles,
      buildings,
      density: tiles > 0 ? buildings / tiles : 0,
    };
  });
  lastHashDensity = hash;
  lastDensity = out;
  return out;
}

// Per-alliance category counts
let lastHashCategories = '';
let lastCategoryCounts: {
  allianceId: number;
  categories: Record<string, number>;
}[] = [];
export function getAllianceCategoryCounts() {
  const { alliances, userBuildings } = useMapStore.getState();
  const hash = `${alliances.length}|${userBuildings.length}`;
  if (hash === lastHashCategories) return lastCategoryCounts;
  const out = alliances.map((a) => ({
    allianceId: a.id,
    categories: {} as Record<string, number>,
  }));
  const byAlliance = new Map(out.map((o) => [o.allianceId, o]));
  for (const b of userBuildings) {
    const def = AppConfig.BUILDING_CATALOG[b.type];
    const cat = def.category || 'uncategorized';
    const rec = byAlliance.get(b.allianceId);
    if (!rec) continue;
    rec.categories[cat] = (rec.categories[cat] || 0) + 1;
  }
  lastHashCategories = hash;
  lastCategoryCounts = out;
  return out;
}
