import { AppConfig } from '../config/appConfig'
import { type CameraState } from '../state/useCameraStore'

export function screenToWorld(
  sx: number,
  sy: number,
  camera: CameraState
): [number, number] {
  const tileW_half = AppConfig.tileW / 2
  const tileH_half = AppConfig.tileH / 2

  const lx = (sx - camera.x) / camera.scale
  const ly = (sy - camera.y) / camera.scale

  const u = lx / tileW_half
  const v = ly / tileH_half

  const worldX = (u + v) / 2
  const worldY = (v - u) / 2

  return [worldX, worldY]
}

export function worldToScreen(x: number, y: number): [number, number] {
  const screenX = (x - y) * (AppConfig.tileW / 2)
  const screenY = (x + y) * (AppConfig.tileH / 2)
  return [screenX, screenY]
}
