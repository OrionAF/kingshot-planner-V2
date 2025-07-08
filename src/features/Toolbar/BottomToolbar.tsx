import { useCameraStore } from '../../state/useCameraStore'
import { useUiStore } from '../../state/useUiStore'
import styles from './BottomToolbar.module.css'

export function BottomToolbar() {
  const scale = useCameraStore((state) => state.scale)
  const { togglePanel } = useUiStore()

  const zoomPct = Math.round(scale * 20)

  return (
    <div className={styles.bottomToolbar}>
      {/* Left Group */}
      <div className={styles.toolbarGroup}>
        <button
          className={styles.toolbarButton}
          title="Alliance Management"
          onClick={() => togglePanel('alliance')}
        >
          🏰
        </button>
        <button className={styles.toolbarButton} title="Build Menu">
          🛠️
        </button>
        <button className={styles.toolbarButton} title="Player Management">
          👤
        </button>
        <button className={styles.toolbarButton} title="Pinned Landmarks">
          📌
        </button>
        <button
          className={styles.toolbarButton}
          title="Navigation"
          onClick={() => togglePanel('nav')}
        >
          🧭
        </button>
      </div>

      {/* Center Group */}
      <div className={styles.toolbarGroup}>
        <button className={styles.toolbarButton} title="Zoom Out">
          -
        </button>
        <span className={styles.zoomLevel}>Zoom: {zoomPct}%</span>
        <button className={styles.toolbarButton} title="Zoom In">
          +
        </button>
      </div>

      {/* Right Group */}
      <div className={styles.toolbarGroup}>
        <button className={styles.toolbarButton} title="Overwatch">
          👁️
        </button>
        <button className={styles.toolbarButton} title="Zoom Presets">
          🎯
        </button>
        <button className={styles.toolbarButton} title="Toggle Minimap">
          🗺️
        </button>
        <button className={styles.toolbarButton} title="Settings">
          ⚙️
        </button>
      </div>
    </div>
  )
}
