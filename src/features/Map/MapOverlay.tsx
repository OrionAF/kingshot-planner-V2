// Clean reimplementation with stable imperative pinned marker layer.

import { AppConfig } from '../../config/appConfig';
import { getPlacementReasonColor } from '../../constants/placementColors';
import { useCameraStore } from '../../state/useCameraStore';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import { screenToWorld, worldToScreen } from '../../core/coordinate-utils';
import { useEffect } from 'react';
import styles from './MapOverlay.module.css';
import { useBookmarkStore } from '../../state/useBookmarkStore';
import type { Bookmark } from '../../types/infrastructure.types';

export function MapOverlay() {
  const camera = useCameraStore((s) => s); // stable composite
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

  const [worldX, worldY] = screenToWorld(
    window.innerWidth / 2,
    window.innerHeight / 2,
    camera,
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
    exitPlacementMode();
  };

  const handleCancelPlacement = () => exitPlacementMode();

  // Imperative pinned markers (avoid React render loops)
  useEffect(() => {
    if (isPlacingSomething) return; // hide while placing
    const overlayRoot = document.querySelector('.' + styles.overlayContainer);
    if (!overlayRoot) return;
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      pointerEvents: 'none',
      zIndex: '2',
    });
    overlayRoot.appendChild(container);
    let rafPending = false;
    const render = () => {
      rafPending = false;
      const { x, y, scale, focusOn } = useCameraStore.getState() as any;
      const pinned = (
        useBookmarkStore.getState().bookmarks as Bookmark[]
      ).filter((b) => b.pinned);
      const keep = new Set(pinned.map((b) => b.id));
      container.querySelectorAll('[data-bid]').forEach((node) => {
        const id = (node as HTMLElement).dataset.bid!;
        if (!keep.has(id)) node.remove();
      });
      pinned.forEach((b) => {
        let el = container.querySelector<HTMLDivElement>(
          `[data-bid="${b.id}"]`,
        );
        if (!el) {
          el = document.createElement('div');
          el.dataset.bid = b.id;
          el.style.position = 'absolute';
          el.style.transform = 'translate(-50%, -100%)';
          el.style.background = 'rgba(20,25,30,0.85)';
          el.style.border = '1px solid #4d5860';
          el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
          el.style.padding = '2px 6px 3px';
          el.style.borderRadius = '6px';
          el.style.fontSize = '11px';
          el.style.fontWeight = '600';
          el.style.color = '#f7fbff';
          el.style.letterSpacing = '0.3px';
          el.style.pointerEvents = 'auto';
          el.style.cursor = 'pointer';
          el.style.userSelect = 'none';
          el.style.maxWidth = '160px';
          el.style.whiteSpace = 'nowrap';
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            focusOn(b.x, b.y, { scale });
          });
          container.appendChild(el);
        }
        const [sxBase, syBase] = worldToScreen(b.x, b.y);
        el.style.left = `${sxBase * scale + x}px`;
        el.style.top = `${syBase * scale + y}px`;
        el.textContent = `★ ${b.label || b.x + ',' + b.y}`;
        el.title = `Go to (${b.x},${b.y})`;
      });
    };
    const schedule = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(render);
    };
    const unsubCam = useCameraStore.subscribe(schedule);
    const unsubBm = useBookmarkStore.subscribe(schedule);
    schedule();
    return () => {
      unsubCam();
      unsubBm();
      container.remove();
    };
  }, [isPlacingSomething]);

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
        <div className={styles.placementHud}>
          <div className={styles.placementCoords}>
            X{Math.round(worldX)} Y{Math.round(worldY)}
          </div>
          {lastPlacementResult && !lastPlacementResult.valid && (
            <div
              className={styles.placementReason}
              style={{
                color: getPlacementReasonColor(lastPlacementResult.reasonCode),
              }}
            >
              {lastPlacementResult.reasonCode || 'Invalid'}
            </div>
          )}
          <div className={styles.placementActions}>
            <button
              className={styles.confirmBtn}
              onClick={handleConfirmPlacement}
              disabled={!isValidPlacement}
            >
              Place
            </button>
            <button
              className={styles.cancelBtn}
              onClick={handleCancelPlacement}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
