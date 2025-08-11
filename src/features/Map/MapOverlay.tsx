// Clean reimplementation with stable imperative pinned marker layer.

import { AppConfig } from '../../config/appConfig';
import { getPlacementReasonColor } from '../../constants/placementColors';
import { useCameraStore } from '../../state/useCameraStore';
import { useMapStore, getBiomeForTile } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import {
  screenToWorld,
  worldToScreen,
  snapWorldToTile,
} from '../../core/coordinate-utils';
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
  const mousePos = useUiStore((s) => s.mouseWorldPosition);
  const {
    placePlayer,
    placeBuilding,
    players,
    userBuildings,
    buildingMap,
    alliances,
    globallyClaimedTiles,
  } = useMapStore();

  const isPlacingSomething =
    isPlacingPlayer || !!buildMode.selectedBuildingType;

  const [worldX, worldY] = screenToWorld(
    window.innerWidth / 2,
    window.innerHeight / 2,
    camera,
  );

  const handleConfirmPlacement = () => {
    if (isValidPlacement) {
      const [roundedX, roundedY] = snapWorldToTile(worldX, worldY);
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
                borderLeftColor: getPlacementReasonColor(
                  lastPlacementResult.reasonCode,
                ),
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

      {!isPlacingSomething &&
        mousePos &&
        (() => {
          const { x: hx, y: hy } = mousePos;
          // hit detection (players -> userBuildings -> base building)
          const player = players.find(
            (p) => hx >= p.x && hx < p.x + p.w && hy >= p.y && hy < p.y + p.h,
          );
          const ubuild = !player
            ? userBuildings.find(
                (b) =>
                  hx >= b.x && hx < b.x + b.w && hy >= b.y && hy < b.y + b.h,
              )
            : null;
          const bbuild =
            !player && !ubuild ? buildingMap.get(`${hx},${hy}`) : null;

          const biome = getBiomeForTile(hx, hy);
          const claimAid = globallyClaimedTiles.get(`${hx},${hy}`);
          const claimAlliance = claimAid
            ? alliances.find((a) => a.id === claimAid)
            : undefined;

          const cap = (s: string) =>
            s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
          let title = `Tile ${hx},${hy}`;
          const parts: string[] = [];
          if (player) {
            title = `Player: ${player.name}`;
            parts.push(`${player.w}x${player.h}`);
            parts.push(`${player.x},${player.y}`);
          } else if (ubuild) {
            const def = AppConfig.BUILDING_CATALOG[ubuild.type];
            const an = alliances.find((a) => a.id === ubuild.allianceId);
            const aLabel = an
              ? an.tag || an.name
              : `Alliance ${ubuild.allianceId}`;
            title = `${def?.name ?? ubuild.type} — ${aLabel}`;
            parts.push(`${ubuild.w}x${ubuild.h}`);
            parts.push(`${ubuild.x},${ubuild.y}`);
          } else if (bbuild) {
            title = `${bbuild.dpName}`;
            parts.push(`${bbuild.w}x${bbuild.h}`);
            parts.push(`${bbuild.x},${bbuild.y}`);
          }

          const claimLine = claimAlliance
            ? `Claimed by ${claimAlliance.tag || claimAlliance.name}`
            : 'Unclaimed';

          parts.push(cap(biome));

          // Claim appears for resource base buildings and empty tiles only
          let showClaim = false;
          if (bbuild) {
            const rssSet = new Set(['wood', 'food', 'stone', 'iron']);
            showClaim = !!(bbuild.proto && rssSet.has(bbuild.proto));
          } else if (!ubuild && !player) {
            showClaim = true; // empty tile
          }
          if (showClaim) parts.push(claimLine);

          return (
            <div className={styles.hoverInfo}>
              <div style={{ fontWeight: 700 }}>{title}</div>
              <div>{parts.join(' - ')}</div>
            </div>
          );
        })()}
    </div>
  );
}
