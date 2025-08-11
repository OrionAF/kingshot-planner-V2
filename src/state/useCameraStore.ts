// src/state/useCameraStore.ts

import { create } from 'zustand';
import { worldToScreen } from '../core/coordinate-utils';
import { AppConfig } from '../config/appConfig';

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

interface CameraActions {
  panBy: (dx: number, dy: number) => void;
  zoomTo: (newCameraState: Partial<CameraState>) => void;
  panTo: (worldX: number, worldY: number) => void; // FIX: Add the new action
  focusOn: (worldX: number, worldY: number, opts?: { scale?: number }) => void;
}

const MIN_ZOOM = AppConfig.camera.minScale;
const MAX_ZOOM = AppConfig.camera.maxScale;

// --- Optimized manual persistence (debounced) ---
const CAM_STORAGE_KEY = 'kingshot-camera-v1';
const CAM_VERSION = 1;
interface PersistedCameraV1 {
  v: number; // version
  x: number;
  y: number;
  scale: number;
  lastVisitedVersion?: string; // reserved for future gating
}

function loadInitialCamera(): { x: number; y: number; scale: number } {
  if (typeof window === 'undefined') {
    return {
      x: 0,
      y: 0,
      scale: 2,
    };
  }
  try {
    const raw = localStorage.getItem(CAM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedCameraV1;
      if (parsed && parsed.v === CAM_VERSION) {
        return {
          x: parsed.x,
          y: parsed.y,
          scale: Math.max(MIN_ZOOM, Math.min(parsed.scale, MAX_ZOOM)),
        };
      }
    }
  } catch (e) {
    // ignore corrupt storage
  }
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 3,
    scale: 2,
  };
}

let saveTimer: number | null = null;
let lastSaved: { x: number; y: number; scale: number } | null = null;
function scheduleSave(state: CameraState) {
  if (typeof window === 'undefined') return;
  // Shallow change detection
  if (
    lastSaved &&
    lastSaved.x === state.x &&
    lastSaved.y === state.y &&
    lastSaved.scale === state.scale
  ) {
    return;
  }
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const payload: PersistedCameraV1 = {
      v: CAM_VERSION,
      x: state.x,
      y: state.y,
      scale: state.scale,
    };
    try {
      // Prefer idle callback to minimize contention; fallback to direct write
      const writer = () => {
        localStorage.setItem(CAM_STORAGE_KEY, JSON.stringify(payload));
        lastSaved = { x: state.x, y: state.y, scale: state.scale };
      };
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(writer, { timeout: 200 });
      } else {
        writer();
      }
    } catch (_) {
      // Swallow quota / privacy errors silently
    }
  }, 250); // debounce interval (ms)
}

export const useCameraStore = create<CameraState & CameraActions>()((set) => ({
  ...loadInitialCamera(),

  panBy: (dx, dy) =>
    set((state) => {
      const next = { x: state.x + dx, y: state.y + dy };
      const merged = { ...state, ...next };
      scheduleSave(merged);
      return merged;
    }),

  zoomTo: (newCameraState) =>
    set((state) => {
      const clampedScale = Math.max(
        MIN_ZOOM,
        Math.min(newCameraState.scale ?? state.scale, MAX_ZOOM),
      );
      const merged = { ...state, ...newCameraState, scale: clampedScale };
      scheduleSave(merged);
      return merged;
    }),

  panTo: (worldX, worldY) =>
    set((state) => {
      const [targetScreenX, targetScreenY] = worldToScreen(worldX, worldY);
      const next = {
        x:
          (typeof window !== 'undefined' ? window.innerWidth : 0) / 2 -
          targetScreenX * state.scale,
        y:
          (typeof window !== 'undefined' ? window.innerHeight : 0) / 2 -
          targetScreenY * state.scale,
      };
      const merged = { ...state, ...next };
      scheduleSave(merged);
      return merged;
    }),
  focusOn: (worldX, worldY, opts) => {
    if (opts?.scale != null) {
      useCameraStore.getState().zoomTo({ scale: opts.scale });
    }
    useCameraStore.getState().panTo(worldX, worldY);
  },
}));

// Camera state now persisted manually with a debounced writer to reduce jank risk.
