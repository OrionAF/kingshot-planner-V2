// src/features/Map/MapOverlay.tsx

import { AppConfig } from '../../config/appConfig';
import { getPlacementReasonColor } from '../../constants/placementColors';
import { useCameraStore } from '../../state/useCameraStore';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import { screenToWorld } from '../../core/coordinate-utils';
import styles from './MapOverlay.module.css';

export function MapOverlay() {
  // FIX: Select the state object directly or individual primitives.
  // We'll select the whole state object here for simplicity as the camera values change together.
  const cameraState = useCameraStore((state) => state);

  const {
    buildMode,
    isPlacingPlayer,
    playerToPlace,
    exitPlacementMode,
    isValidPlacement,
    lastPlacementResult,
  } = useUiStore();
  const { placePlayer, placeBuilding } = useMapStore();

  const isPlacingSomething =
    isPlacingPlayer || !!buildMode.selectedBuildingType;

  // This calculation is now safe because cameraState is a stable reference
  const [worldX, worldY] = screenToWorld(
    window.innerWidth / 2,
    window.innerHeight / 2,
    cameraState,
  );

  const handleConfirmPlacement = () => {
    if (isValidPlacement) {
      const roundedX = Math.round(worldX);
      const roundedY = Math.round(worldY);

      if (isPlacingPlayer && playerToPlace) {
        placePlayer(playerToPlace, roundedX, roundedY);
      } else if (buildMode.selectedBuildingType && buildMode.activeAllianceId) {
        placeBuilding(
          buildMode.selectedBuildingType,
          roundedX,
          roundedY,
          buildMode.activeAllianceId,
        );
      }
    }
    // Always exit placement mode after a confirm action
    exitPlacementMode();
  };

  const handleCancelPlacement = () => {
    exitPlacementMode();
  };

  return (
    <div className={styles.overlayContainer}>
      {!isPlacingSomething && (
        <>
          <div className={`${styles.overlayItem} ${styles.versionDisplay}`}>
            v{AppConfig.CURRENT_VERSION}
          </div>
          <div className={`${styles.overlayItem} ${styles.centerTile}`}>
            Center: X{Math.round(worldX)} Y{Math.round(worldY)}
          </div>
        </>
      )}

      {isPlacingSomething && (
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
          {!isValidPlacement && lastPlacementResult?.reasonCode && (
            <div
              className={styles.placementFeedback}
              style={{
                borderColor: getPlacementReasonColor(
                  lastPlacementResult.reasonCode,
                ),
                color: getPlacementReasonColor(lastPlacementResult.reasonCode),
              }}
            >
              <strong>Blocked:</strong>{' '}
              {lastPlacementResult.message || lastPlacementResult.reasonCode}
            </div>
          )}
          {isValidPlacement &&
            lastPlacementResult?.message?.includes('remaining') && (
              <div className={styles.placementInfo}>
                {lastPlacementResult.message}
              </div>
            )}
        </>
      )}
    </div>
  );
}
