import { Panel } from '../../components/Panel/Panel'
import { useUiStore } from '../../state/useUiStore'
import styles from './ToolsPanel.module.css'

export function ToolsPanel() {
  const { openPanel, switchPanel } = useUiStore()
  const isOpen = openPanel === 'tools'

  const handleClick = (
    panelId: 'nav' | 'overwatch' | 'zoomPresets' | 'minimap'
  ) => {
    // Use the new, unambiguous switchPanel action
    switchPanel(panelId)
  }

  return (
    <Panel className={`${styles.toolsPanel} ${isOpen ? styles.open : ''}`}>
      <div className={styles.buttonList}>
        <button className={styles.button} onClick={() => handleClick('nav')}>
          🧭 Navigation
        </button>
        <button className={styles.button}>👁️ Overwatch</button>
        <button className={styles.button}>🎯 Zoom Presets</button>
        <button className={styles.button}>🗺️ Toggle Minimap</button>
      </div>
    </Panel>
  )
}
