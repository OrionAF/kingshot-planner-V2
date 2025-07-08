import { AppConfig } from '../../config/appConfig'
import { useCameraStore } from '../../state/useCameraStore'
import styles from './MapOverlay.module.css'

export function MapOverlay() {
  // Subscribe to the camera's x and y state.
  // Whenever x or y changes, this component will automatically re-render.
  const cameraX = useCameraStore((state) => state.x)
  const cameraY = useCameraStore((state) => state.y)

  // For now, we will calculate the world coordinates here. Later, this
  // logic could be moved into a more centralized helper function.
  const [worldX, worldY] = screenToWorld(
    window.innerWidth / 2,
    window.innerHeight / 2,
    { x: cameraX, y: cameraY }
  )

  return (
    <div className={styles.overlayContainer}>
      <div className={`${styles.overlayItem} ${styles.versionDisplay}`}>
        v{AppConfig.CURRENT_VERSION}
      </div>
      <div className={`${styles.overlayItem} ${styles.centerTile}`}>
        Center: X{Math.round(worldX)} Y{Math.round(worldY)}
      </div>
    </div>
  )
}

// This is a temporary copy of the screenToWorld logic. We will
// centralize this later to avoid duplication.
function screenToWorld(
  sx: number,
  sy: number,
  camera: { x: number; y: number }
): [number, number] {
  // Temporarily use the AppConfig for tile size, assuming a fixed scale of 1 for simplicity.
  // A more robust solution will read the scale from the store too.
  // This is simplified and will have inaccuracies when zoomed. We will fix this.

  const { scale } = useCameraStore.getState() // Get current scale

  const tileW_half = AppConfig.tileW / 2
  const tileH_half = AppConfig.tileH / 2

  const lx = (sx - camera.x) / scale
  const ly = (sy - camera.y) / scale

  const u = lx / tileW_half
  const v = ly / tileH_half

  return [(u + v) / 2, (v - u) / 2]
}
