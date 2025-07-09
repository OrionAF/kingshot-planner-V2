import { useCameraStore } from '../../state/useCameraStore'
import { useUiStore } from '../../state/useUiStore'
import styles from './BottomToolbar.module.css'

export function BottomToolbar() {
  const scale = useCameraStore((state) => state.scale)
  const { togglePanel, openPanel } = useUiStore()
  const zoomPct = Math.round(scale * 20)

  // This is the new, better logic for the mobile highlight.
  // The management group button is active if its own panel OR any child panel is open.
  const isManagementActive =
    openPanel === 'management' ||
    openPanel === 'alliance' ||
    openPanel === 'player' // We will add 'build' here later

  return (
    <div className={styles.bottomToolbar}>
      {/* ====== LEFT GROUP ====== */}
      <div className={`${styles.toolbarGroup} ${styles.left}`}>
        {/* DESKTOP-ONLY Buttons */}
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'alliance' ? styles.active : ''}`}
          title="Alliance Management"
          onClick={() => togglePanel('alliance')}
        >
          🏰
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Build Menu"
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
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Pinned Landmarks"
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

        {/* MOBILE-ONLY Buttons */}
        <button
          className={`${styles.toolbarButton} ${styles.mobileOnly} ${isManagementActive ? styles.active : ''}`}
          title="Management"
          onClick={() => togglePanel('management')}
        >
          🧰
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.mobileOnly}`}
          title="Pinned Landmarks"
        >
          📌
        </button>
      </div>

      {/* ====== CENTER GROUP ====== */}
      <div className={`${styles.toolbarGroup} ${styles.center}`}>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Zoom Out"
        >
          -
        </button>
        <div className={styles.zoomLevel} title="Tap to set zoom">
          Zoom: {zoomPct}%
        </div>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* ====== RIGHT GROUP ====== */}
      <div className={`${styles.toolbarGroup} ${styles.right}`}>
        {/* This follows the same logic as the management button, but for the tools */}
        <button
          className={`${styles.toolbarButton} ${styles.mobileOnly} ${openPanel === 'tools' || openPanel === 'nav' || openPanel === 'settings' ? styles.active : ''}`}
          title="Tools"
          onClick={() => togglePanel('tools')}
        >
          🔧
        </button>

        {/* For desktop, keep settings separate */}
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly} ${openPanel === 'settings' ? styles.active : ''}`}
          title="Settings"
          onClick={() => togglePanel('settings')}
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}
