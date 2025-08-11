// Unified persistence scaffold (Phase 0)
// This is intentionally minimal: we capture a subset of app state and write a single localStorage blob.
// Later phases will migrate existing per-slice persistence (map store) into this root and add migrations.
// Collects camera, map (alliances/players/userBuildings), ui prefs, overwatch, bookmarks, versionSeen.
// For now, map store still uses zustand persist; we overlay additional slices here for future consolidation.

import { useCameraStore } from './useCameraStore';
import { useUiStore } from './useUiStore';
import type {
  Bookmark,
  OverwatchSettings,
} from '../types/infrastructure.types';
import { useBookmarkStore } from './useBookmarkStore';
import { useOverwatchStore } from './useOverwatchStore';
import { useMapStore } from './useMapStore';
import { useMetaStore } from './useMetaStore';
import { PERSIST_VERSION } from './persistence';

// Unified persistence schema version (independent from per-slice map persistence)
export const UNIFIED_PERSIST_VERSION = 2;

interface UnifiedPersistV1 {
  v: 1;
  camera: { x: number; y: number; scale: number };
  ui: { openPanel: ReturnType<typeof useUiStore.getState>['openPanel'] };
  overwatch: OverwatchSettings;
  bookmarks: Bookmark[];
  lastSeenVersion?: string; // stored at root in v1
  map?: {
    alliances: ReturnType<typeof useMapStore.getState>['alliances'];
    players: ReturnType<typeof useMapStore.getState>['players'];
    userBuildings: ReturnType<typeof useMapStore.getState>['userBuildings'];
  };
}

interface UnifiedPersistV2 {
  v: 2;
  camera: { x: number; y: number; scale: number };
  ui: { openPanel: ReturnType<typeof useUiStore.getState>['openPanel'] };
  overwatch: OverwatchSettings;
  bookmarks: Bookmark[];
  map: {
    alliances: ReturnType<typeof useMapStore.getState>['alliances'];
    players: ReturnType<typeof useMapStore.getState>['players'];
    userBuildings: ReturnType<typeof useMapStore.getState>['userBuildings'];
  };
  meta: {
    lastSeenVersion?: string | null;
  };
}

type AnyUnifiedPersist = UnifiedPersistV1 | UnifiedPersistV2;

function migrateUnified(data: AnyUnifiedPersist): UnifiedPersistV2 | null {
  if (!data || typeof data !== 'object') return null;
  if (data.v === 2) return data as UnifiedPersistV2;
  if (data.v === 1) {
    // Promote optional map to required (empty arrays if absent) and wrap meta
    const v1 = data as UnifiedPersistV1;
    return {
      v: 2,
      camera: v1.camera,
      ui: v1.ui,
      overwatch: v1.overwatch,
      bookmarks: v1.bookmarks,
      map: {
        alliances: v1.map?.alliances || [],
        players: v1.map?.players || [],
        userBuildings: v1.map?.userBuildings || [],
      },
      meta: { lastSeenVersion: v1.lastSeenVersion },
    };
  }
  return null; // unknown future version
}

const KEY = 'kingshot-unified';
const LEGACY_KEYS = ['kingshot-unified-v1'];

export function loadUnifiedPersist(): void {
  if (typeof window === 'undefined') return;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      for (const legacy of LEGACY_KEYS) {
        const legacyRaw = localStorage.getItem(legacy);
        if (legacyRaw) {
          raw = legacyRaw; // adopt legacy payload
          break;
        }
      }
    }
    if (!raw) return;
    const parsed = JSON.parse(raw) as AnyUnifiedPersist;
    const migrated = migrateUnified(parsed);
    if (!migrated) return; // unknown schema
    // Hydrate basic slices
    useCameraStore.setState({ ...migrated.camera });
    useUiStore.setState((s) => ({ ...s, openPanel: migrated.ui.openPanel }));
    useMapStore.getState().hydrateMap({
      alliances: migrated.map.alliances,
      players: migrated.map.players,
      userBuildings: migrated.map.userBuildings,
    });
    // hydrate bookmarks (replace existing)
    try {
      useBookmarkStore.setState({ bookmarks: migrated.bookmarks || [] });
    } catch {}
    const meta = useMetaStore.getState();
    const incomingVersion = migrated.meta.lastSeenVersion || null;
    if (!meta.lastSeenVersion || meta.lastSeenVersion !== incomingVersion) {
      useMetaStore.setState({
        lastSeenVersion: incomingVersion,
        showPatchNotes: true,
      });
    }
    // If we migrated from v1 write back as v2 under new key
    if (migrated.v === 2) {
      try {
        localStorage.setItem(KEY, JSON.stringify(migrated));
      } catch {}
    }
  } catch {}
}

let saveQueued = false;
let disabled = false; // allow temporary disable (e.g., during full storage purge)
function scheduleSave() {
  if (disabled) return; // skip if disabled
  if (saveQueued) return;
  saveQueued = true;
  queueMicrotask(() => {
    saveQueued = false;
    if (disabled) return;
    if (typeof window === 'undefined') return;
    const cam = useCameraStore.getState();
    const ui = useUiStore.getState();
    const bookmarkState = useBookmarkStore.getState();
    const overwatchState = useOverwatchStore.getState();
    const mapState = useMapStore.getState();
    const meta = useMetaStore.getState();
    const payload: UnifiedPersistV2 = {
      v: UNIFIED_PERSIST_VERSION,
      camera: { x: cam.x, y: cam.y, scale: cam.scale },
      ui: { openPanel: ui.openPanel },
      overwatch: overwatchState.settings,
      bookmarks: bookmarkState.bookmarks,
      map: {
        alliances: mapState.alliances,
        players: mapState.players,
        userBuildings: mapState.userBuildings,
      },
      meta: {
        lastSeenVersion: meta.lastSeenVersion || PERSIST_VERSION.toString(),
      },
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {}
  });
}

// Wire basic listeners (could be replaced with event bus usage later)
export function initUnifiedPersistence() {
  loadUnifiedPersist();
  const unsubCam = useCameraStore.subscribe(scheduleSave);
  const unsubUi = useUiStore.subscribe(scheduleSave);
  const unsubBm = useBookmarkStore.subscribe(scheduleSave);
  const unsubOw = useOverwatchStore.subscribe(scheduleSave);
  const unsubMeta = useMetaStore.subscribe(scheduleSave);
  return () => {
    unsubCam();
    unsubUi();
    unsubBm();
    unsubOw();
    unsubMeta();
  };
}

// Allow other modules to temporarily disable unified persistence writes
export function disableUnifiedPersistence() {
  disabled = true;
}
