// src/state/useCameraStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
}

const MIN_ZOOM = AppConfig.camera.minScale;
const MAX_ZOOM = AppConfig.camera.maxScale;

export const useCameraStore = create<CameraState & CameraActions>()(
  persist(
    (set) => ({
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
      y: typeof window !== 'undefined' ? window.innerHeight / 3 : 0,
      scale: 2,

      panBy: (dx, dy) =>
        set((state) => ({
          x: state.x + dx,
          y: state.y + dy,
        })),

      zoomTo: (newCameraState) =>
        set((state) => {
          const clampedScale = Math.max(
            MIN_ZOOM,
            Math.min(newCameraState.scale ?? state.scale, MAX_ZOOM),
          );
          return {
            ...state,
            ...newCameraState,
            scale: clampedScale,
          };
        }),

      panTo: (worldX, worldY) =>
        set((state) => {
          const [targetScreenX, targetScreenY] = worldToScreen(worldX, worldY);
          return {
            x:
              (typeof window !== 'undefined' ? window.innerWidth : 0) / 2 -
              targetScreenX * state.scale,
            y:
              (typeof window !== 'undefined' ? window.innerHeight : 0) / 2 -
              targetScreenY * state.scale,
          };
        }),
    }),
    {
      name: 'kingshot-camera',
      partialize: (state) => ({ x: state.x, y: state.y, scale: state.scale }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Clamp any out-of-range persisted scales using the store's own action
            const s = Math.max(MIN_ZOOM, Math.min(state.scale, MAX_ZOOM));
            if (s !== state.scale) {
              // Use action so it re-applies derived calculations if needed
              useCameraStore.getState().zoomTo({ scale: s });
            }
          }
        };
      },
    },
  ),
);
