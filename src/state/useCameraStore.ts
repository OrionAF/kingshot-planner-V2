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
  // Helper: clamp camera so projected map bounding box roughly covers viewport (AABB approximation over diamond)
  _clamp(next: CameraState) {
    const N = AppConfig.N;
    // Project corners (0,0) (N,0) (0,N) (N,N)
    const corners: [number, number][] = [
      worldToScreen(0, 0),
      worldToScreen(N, 0),
      worldToScreen(0, N),
      worldToScreen(N, N),
    ];
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const [cx, cy] of corners) {
      const sx = cx * next.scale + next.x;
      const sy = cy * next.scale + next.y;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
    }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
    // If map smaller than viewport in a dimension, center it
    if (maxX - minX < vw) {
      const mid = (minX + maxX) / 2;
      next.x += vw / 2 - mid;
      minX = next.x + (minX - (next.x - (vw / 2 - mid))); // recompute not strictly needed
      maxX = next.x + (maxX - (next.x - (vw / 2 - mid)));
    } else {
      if (minX > 0) next.x -= minX; // shift left
      if (maxX < vw) next.x += vw - maxX; // shift right
    }
    if (maxY - minY < vh) {
      const mid = (minY + maxY) / 2;
      next.y += vh / 2 - mid;
    } else {
      if (minY > 0) next.y -= minY;
      if (maxY < vh) next.y += vh - maxY;
    }
    return next;
  },

  panBy: (dx, dy) =>
    set((state) => {
      const next = {
        ...state,
        x: state.x + dx,
        y: state.y + dy,
      } as CameraState;
      const clamped = (useCameraStore.getState() as any)._clamp(next);
      scheduleSave(clamped);
      return clamped;
    }),

  zoomTo: (newCameraState) =>
    set((state) => {
      const clampedScale = Math.max(
        MIN_ZOOM,
        Math.min(newCameraState.scale ?? state.scale, MAX_ZOOM),
      );
      const next = {
        ...state,
        ...newCameraState,
        scale: clampedScale,
      } as CameraState;
      const clamped = (useCameraStore.getState() as any)._clamp(next);
      scheduleSave(clamped);
      return clamped;
    }),

  panTo: (worldX, worldY) =>
    set((state) => {
      const [targetScreenX, targetScreenY] = worldToScreen(worldX, worldY);
      const next = {
        ...state,
        x:
          (typeof window !== 'undefined' ? window.innerWidth : 0) / 2 -
          targetScreenX * state.scale,
        y:
          (typeof window !== 'undefined' ? window.innerHeight : 0) / 2 -
          targetScreenY * state.scale,
      } as CameraState;
      const clamped = (useCameraStore.getState() as any)._clamp(next);
      scheduleSave(clamped);
      return clamped;
    }),
  focusOn: (worldX, worldY, opts) => {
    if (opts?.scale != null) {
      useCameraStore.getState().zoomTo({ scale: opts.scale });
    }
    useCameraStore.getState().panTo(worldX, worldY);
  },
}));

// Camera state now persisted manually with a debounced writer to reduce jank risk.
