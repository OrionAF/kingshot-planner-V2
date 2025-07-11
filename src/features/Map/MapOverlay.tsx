// src/features/Map/MapOverlay.tsx

import { AppConfig } from '../../config/appConfig';
import { useCameraStore } from '../../state/useCameraStore';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import { screenToWorld } from '../../core/coordinate-utils';
import styles from './MapOverlay.module.css';

export function MapOverlay() {
  const cameraState = useCameraStore((state) => ({
    x: state.x,
    y: state.y,
    scale: state.scale,
  }));
  const {
    buildMode,
    isPlacingPlayer,
    playerToPlace,
    endPlayerPlacement,
    setSelectedBuildingType,
    isValidPlacement,
  } = useUiStore();
  const { placePlayer, placeBuilding } = useMapStore();

  const isPlacingSomething =
    isPlacingPlayer || !!buildMode.selectedBuildingType;

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
    handleCancelPlacement();
  };

  const handleCancelPlacement = () => {
    endPlayerPlacement();
    setSelectedBuildingType(null);
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
        </>
      )}
    </div>
  );
}
