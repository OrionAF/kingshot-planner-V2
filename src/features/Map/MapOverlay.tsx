// src/features/Map/MapOverlay.tsx

import { AppConfig } from '../../config/appConfig'
import { useCameraStore } from '../../state/useCameraStore'
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'
import { screenToWorld } from '../../core/coordinate-utils' // Correctly import your utility
import styles from './MapOverlay.module.css'

export function MapOverlay() {
  // Select the entire state object. This is often more performant than
  // multiple individual selectors if you need more than one value.
  const cameraState = useCameraStore()
  const {
    isPlacingPlayer,
    playerToPlace,
    endPlayerPlacement,
    isValidPlacement,
  } = useUiStore()
  const { placePlayer } = useMapStore()

  const [worldX, worldY] = screenToWorld(
    window.innerWidth / 2,
    window.innerHeight / 2,
    cameraState // Pass the state object that matches the function's type
  )

  const handleConfirmPlacement = () => {
    if (playerToPlace && isValidPlacement) {
      placePlayer(playerToPlace, Math.round(worldX), Math.round(worldY))
    }
    endPlayerPlacement()
  }

  const handleCancelPlacement = () => {
    endPlayerPlacement()
  }

  return (
    <div className={styles.overlayContainer}>
      {/* --- Standard Overlay Items --- */}
      {!isPlacingPlayer && (
        <>
          <div className={`${styles.overlayItem} ${styles.versionDisplay}`}>
            v{AppConfig.CURRENT_VERSION}
          </div>
          <div className={`${styles.overlayItem} ${styles.centerTile}`}>
            Center: X{Math.round(worldX)} Y{Math.round(worldY)}
          </div>
        </>
      )}

      {/* --- Mobile Placement UI --- */}
      {isPlacingPlayer && (
        <>
          <div className={styles.crosshair}>+</div>
          <div className={styles.placementControls}>
            <button
              className={`${styles.button} ${styles.cancel}`}
              onClick={handleCancelPlacement}
            >
              Cancel
            </button>
            <button
              className={`${styles.button} ${styles.confirm}`}
              onClick={handleConfirmPlacement}
              disabled={!isValidPlacement}
            >
              Confirm Placement
            </button>
          </div>
        </>
      )}
    </div>
  )
}
