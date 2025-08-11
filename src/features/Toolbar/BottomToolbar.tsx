// src/features/Toolbar/BottomToolbar.tsx

import { useCameraStore } from '../../state/useCameraStore';
import { AppConfig } from '../../config/appConfig';
import { useUiStore } from '../../state/useUiStore';
import { screenToWorld, worldToScreen } from '../../core/coordinate-utils';
import styles from './BottomToolbar.module.css';

export function BottomToolbar() {
  const scale = useCameraStore((state) => state.scale);
  const { zoomTo } = useCameraStore();
  const { togglePanel, openPanel, toggleMinimapVisibility, minimapVisible } =
    useUiStore();
  const zoomPct = Math.round(scale * 20);

  const isManagementActive =
    openPanel === 'management' ||
    openPanel === 'alliance' ||
    openPanel === 'player';
  const isToolsActive =
    openPanel === 'tools' ||
    openPanel === 'nav' ||
    openPanel === 'overwatch' ||
    openPanel === 'zoomPresets' ||
    openPanel === 'minimap';

  return (
    <div className={styles.bottomToolbar}>
      {/* ====== LEFT GROUP ====== */}
      <div className={`${styles.toolbarGroup} ${styles.left}`}>
        {/* DESKTOP-ONLY Left Buttons */}
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'alliance' ? styles.active : ''}`}
          title="Alliance Management"
          onClick={() => togglePanel('alliance')}
        >
          🏰
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'stats' ? styles.active : ''}`}
          title="Alliance Stats"
          onClick={() => togglePanel('stats')}
        >
          📊
        </button>

        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'build' ? styles.active : ''}`}
          title="Build Menu"
          onClick={() => togglePanel('build')}
        >
          🛠️
        </button>

        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'player' ? styles.active : ''}`}
          title="Player Management"
          onClick={() => togglePanel('player')}
        >
          👤
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'bookmarks' ? styles.active : ''}`}
          title="Bookmarks"
          onClick={() => togglePanel('bookmarks')}
        >
          📌
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'nav' ? styles.active : ''}`}
          title="Navigation"
          onClick={() => togglePanel('nav')}
        >
          🧭
        </button>

        {/* MOBILE-ONLY Left Buttons */}
        <button
          className={`${styles.toolbarButton} ${styles.mobileOnly} ${isManagementActive ? styles.active : ''}`}
          title="Management"
          onClick={() => togglePanel('management')}
        >
          🧰
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.mobileOnly} ${openPanel === 'bookmarks' ? styles.active : ''}`}
          title="Bookmarks"
          onClick={() => togglePanel('bookmarks')}
        >
          📌
        </button>
      </div>

      {/* ====== CENTER GROUP ====== */}
      <div className={`${styles.toolbarGroup} ${styles.center}`}>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Zoom Out"
          aria-label="Zoom Out"
          onClick={() => {
            const camBefore = useCameraStore.getState();
            const targetScale = Math.max(
              camBefore.scale * 0.9,
              AppConfig.camera.minScale,
            );
            if (targetScale === camBefore.scale) return; // no-op
            const focalScreenX = window.innerWidth / 2;
            const focalScreenY = window.innerHeight / 2;
            const [worldX, worldY] = screenToWorld(
              focalScreenX,
              focalScreenY,
              camBefore,
            );
            const [screenXAfter, screenYAfter] = worldToScreen(worldX, worldY);
            const newCamX = focalScreenX - screenXAfter * targetScale;
            const newCamY = focalScreenY - screenYAfter * targetScale;
            zoomTo({ x: newCamX, y: newCamY, scale: targetScale });
          }}
        >
          -
        </button>
        <div
          className={styles.zoomLevel}
          title="Tap to set zoom"
          aria-live="polite"
        >
          Zoom: {zoomPct}%
        </div>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Zoom In"
          aria-label="Zoom In"
          onClick={() => {
            const camBefore = useCameraStore.getState();
            const targetScale = Math.min(
              camBefore.scale * 1.1,
              AppConfig.camera.maxScale,
            );
            if (targetScale === camBefore.scale) return; // no-op
            const focalScreenX = window.innerWidth / 2;
            const focalScreenY = window.innerHeight / 2;
            const [worldX, worldY] = screenToWorld(
              focalScreenX,
              focalScreenY,
              camBefore,
            );
            const [screenXAfter, screenYAfter] = worldToScreen(worldX, worldY);
            const newCamX = focalScreenX - screenXAfter * targetScale;
            const newCamY = focalScreenY - screenYAfter * targetScale;
            zoomTo({ x: newCamX, y: newCamY, scale: targetScale });
          }}
        >
          +
        </button>
      </div>

      {/* ====== RIGHT GROUP ====== */}
      <div className={`${styles.toolbarGroup} ${styles.right}`}>
        {/* DESKTOP-ONLY Right Buttons */}
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Overwatch"
        >
          👁️
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Zoom Presets"
        >
          🎯
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${minimapVisible ? styles.active : ''}`}
          title="Toggle Minimap"
          onClick={() => toggleMinimapVisibility()}
        >
          🗺️
        </button>

        {/* MOBILE-ONLY Right Button */}
        <button
          className={`${styles.toolbarButton} ${styles.mobileOnly} ${isToolsActive ? styles.active : ''}`}
          title="Tools"
          onClick={() => togglePanel('tools')}
        >
          🔧
        </button>

        {/* Settings button is ALWAYS visible */}
        <button
          className={`${styles.toolbarButton} ${openPanel === 'settings' ? styles.active : ''}`}
          title="Settings"
          onClick={() => togglePanel('settings')}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}
