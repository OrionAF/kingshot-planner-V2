// Persistence versioning & migration (Phase 0 finalize)
import type { Alliance, Player, UserBuilding } from '../types/map.types';

export const PERSIST_VERSION = 1; // bump when persisted schema evolves

export interface PersistedSliceV1 {
  version?: number; // optional for legacy
  alliances: Alliance[];
  players: Player[];
  userBuildings: UserBuilding[];
}

export type AnyPersistedSlice = PersistedSliceV1; // future union as versions grow

export function migratePersisted<State extends AnyPersistedSlice>(
  persistedState: State,
  _version: number,
): State {
  if (!persistedState) return persistedState;
  if (persistedState.version === undefined) {
    return { ...persistedState, version: 1 } as State;
  }
  return persistedState;
}
