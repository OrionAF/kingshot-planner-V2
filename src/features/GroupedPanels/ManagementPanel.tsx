import { Panel } from '../../components/Panel/Panel'
import { useUiStore } from '../../state/useUiStore'
import styles from './ManagementPanel.module.css'

export function ManagementPanel() {
  const { openPanel, togglePanel } = useUiStore()
  const isOpen = openPanel === 'management'

  const handleClick = (panelId: 'alliance' | 'build' | 'player') => {
    togglePanel(panelId)
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
        <button className={styles.button}>👤 Player Management</button>
      </div>
    </Panel>
  )
}
