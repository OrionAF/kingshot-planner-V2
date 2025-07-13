// src/core/coordinate-utils.ts

import { AppConfig } from '../config/appConfig';
import { type CameraState } from '../state/useCameraStore';

export function screenToWorld(
  sx: number,
  sy: number,
  camera: CameraState,
): [number, number] {
  const tileW_half = AppConfig.tileW / 2;
  const tileH_half = AppConfig.tileH / 2;

  const lx = (sx - camera.x) / camera.scale;
  const ly = (sy - camera.y) / camera.scale;

  // This is the correct mathematical inverse of the new worldToScreen function.
  const u = lx / tileW_half;
  const v = -ly / tileH_half; // <-- This minus sign is crucial for the inverse.

  const worldX = (u + v) / 2;
  const worldY = (v - u) / 2;

  return [worldX, worldY];
}

export function worldToScreen(x: number, y: number): [number, number] {
  const screenX = (x - y) * (AppConfig.tileW / 2);
  // THE CORRECT FIX: Negating the entire y-component of the projection
  // ensures that a higher world Y results in a smaller screen Y,
  // moving the object UP the screen and placing (0,0) at the bottom vertex.
  const screenY = -((x + y) * (AppConfig.tileH / 2));
  return [screenX, screenY];
}
