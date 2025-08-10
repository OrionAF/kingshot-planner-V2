// Derived selectors & memoized computations (Phase 0)
import { useMapStore } from './useMapStore';
import { AppConfig } from '../config/appConfig';
import type { AllianceStats } from '../types/infrastructure.types';

// Simple cached computation; could be replaced with memo lib if needed
let lastHash = '';
let lastResult: AllianceStats[] = [];

export function getAllianceStats(): AllianceStats[] {
  const { alliances, userBuildings, claimedTerritory } = useMapStore.getState();
  const hash = `${alliances.length}|${userBuildings.length}|${claimedTerritory.size}`;
  if (hash === lastHash) return lastResult;

  const result: AllianceStats[] = alliances.map((a) => ({
    allianceId: a.id,
    territoryTileCount: claimedTerritory.get(a.id)?.size || 0,
    buildingCounts: {},
  }));
  const byAlliance = new Map(result.map((r) => [r.allianceId, r]));

  for (const b of userBuildings) {
    const def = AppConfig.BUILDING_CATALOG[b.type];
    const stats = byAlliance.get(b.allianceId);
    if (!def || !stats) continue;
    stats.buildingCounts[b.type] = (stats.buildingCounts[b.type] || 0) + 1;
  }

  lastHash = hash;
  lastResult = result;
  return result;
}

// (Persistence migration relocated to persistence.ts)
