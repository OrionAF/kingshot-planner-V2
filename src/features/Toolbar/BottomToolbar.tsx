import { useCameraStore } from '../../state/useCameraStore'
import { useUiStore } from '../../state/useUiStore'
import styles from './BottomToolbar.module.css'

export function BottomToolbar() {
  const scale = useCameraStore((state) => state.scale)
  // Get both the action and the state from the UI store
  const { togglePanel, openPanel } = useUiStore()
  const zoomPct = Math.round(scale * 20)

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
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Build Menu"
        >
          🛠️
        </button>
        <button
          className={`${styles.toolbarButton} ${styles.desktopOnly}`}
          title="Player Management"
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

        {/* MOBILE-ONLY Left Buttons */}
        <button
          className={`${styles.toolbarButton} ${styles.mobileOnly} ${openPanel === 'management' ? styles.active : ''}`}
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
          className={`${styles.toolbarButton} ${styles.mobileOnly} ${openPanel === 'tools' ? styles.active : ''}`}
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
  )
}
