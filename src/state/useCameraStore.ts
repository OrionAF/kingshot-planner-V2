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
}

const MIN_ZOOM = AppConfig.camera.minScale;
const MAX_ZOOM = AppConfig.camera.maxScale;

export const useCameraStore = create<CameraState & CameraActions>((set) => ({
  x: window.innerWidth / 2,
  y: window.innerHeight / 3,
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
        x: window.innerWidth / 2 - targetScreenX * state.scale,
        y: window.innerHeight / 2 - targetScreenY * state.scale,
      };
    }),
}));
