// Phase 0 foundational shared types & enums

export interface Bookmark {
  id: string; // stable uuid or generated id
  x: number;
  y: number;
  label: string;
  pinned: boolean;
  createdAt: number;
}

export interface OverwatchSettings {
  // category -> visible
  [category: string]: boolean;
}

export interface AllianceStats {
  allianceId: number;
  territoryTileCount: number;
  buildingCounts: Record<string, number>; // type -> count
}

export interface PlacementResult {
  valid: boolean;
  reasonCode?:
    | 'OUT_OF_BOUNDS'
    | 'COLLIDES_BASE'
    | 'COLLIDES_USER'
    | 'COLLIDES_PLAYER'
    | 'TERRITORY_REQUIRED'
    | 'BIOME_MISMATCH'
    | 'LIMIT_REACHED'
    | 'TERRITORY_RULE_UNMET'
    | 'FOREIGN_TERRITORY';
  message?: string;
}

// Render layering to allow deterministic draw order & feature expansion
export const RenderLayer = {
  BASE_MAP: 0,
  TERRITORY: 1,
  OBJECTS: 2,
  SPRITES: 3,
  OVERLAYS: 4,
  DEV: 5,
} as const;
export type RenderLayer = (typeof RenderLayer)[keyof typeof RenderLayer];

// Lightweight event bus for cross-store notifications
export type AppEventMap = {
  'territory:recalculated': void;
  'alliances:changed': void;
  'bookmarks:changed': void;
  'overwatch:changed': void;
};

export type AppEventKey = keyof AppEventMap;
export type AppEventListener<K extends AppEventKey> = (
  payload: AppEventMap[K],
) => void;

export class EventBus {
  private listeners: Partial<
    Record<AppEventKey, Set<(...args: any[]) => void>>
  > = {};

  on<K extends AppEventKey>(key: K, fn: AppEventListener<K>) {
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key]!.add(fn as any);
    return () => this.off(key, fn);
  }
  off<K extends AppEventKey>(key: K, fn: AppEventListener<K>) {
    this.listeners[key]?.delete(fn as any);
  }
  emit<K extends AppEventKey>(key: K, payload: AppEventMap[K]) {
    const set = this.listeners[key];
    if (!set) return;
    set.forEach((fn) => {
      try {
        (fn as AppEventListener<K>)(payload);
      } catch (e) {
        console.error('[EventBus]', key, e);
      }
    });
  }
}

export const globalEventBus = new EventBus();
