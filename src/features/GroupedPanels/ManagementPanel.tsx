import { Panel } from '../../components/Panel/Panel'
import { useUiStore } from '../../state/useUiStore'
import styles from './ManagementPanel.module.css'

export function ManagementPanel() {
  const { openPanel, switchPanel } = useUiStore()
  const isOpen = openPanel === 'management'

  const handleClick = (panelId: 'alliance' | 'build' | 'player') => {
    // Use the new, unambiguous switchPanel action
    switchPanel(panelId)
  }

  return (
    <Panel className={`${styles.managementPanel} ${isOpen ? styles.open : ''}`}>
      <div className={styles.buttonList}>
        <button
          className={styles.button}
          onClick={() => handleClick('alliance')}
        >
          🏰 Alliance Management
        </button>
        <button className={styles.button}>🛠️ Build Menu</button>
        <button className={styles.button} onClick={() => handleClick('player')}>
          👤 Player Management
        </button>
      </div>
    </Panel>
  )
}
