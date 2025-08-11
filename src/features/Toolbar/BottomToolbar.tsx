// src/features/Toolbar/BottomToolbar.tsx

import { useCameraStore } from '../../state/useCameraStore';
import { AppConfig } from '../../config/appConfig';
import { useUiStore } from '../../state/useUiStore';
import styles from './BottomToolbar.module.css';

export function BottomToolbar() {
  const scale = useCameraStore((state) => state.scale);
  const { zoomTo } = useCameraStore();
  const { togglePanel, openPanel } = useUiStore();
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
            const s = Math.max(scale * 0.9, AppConfig.camera.minScale);
            zoomTo({ scale: s });
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
            const s = Math.min(scale * 1.1, AppConfig.camera.maxScale);
            zoomTo({ scale: s });
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
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Toggle Minimap"
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
