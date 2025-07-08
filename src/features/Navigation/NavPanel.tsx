import { useState } from 'react'
import { Panel } from '../../components/Panel/Panel'
import { useCameraStore } from '../../state/useCameraStore'
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'
import styles from './NavPanel.module.css'
import { AppConfig } from '../../config/appConfig' // We need this for tile sizes

type ActiveTab = 'goTo' | 'landmarks'

// This is the correct place for this helper function for now,
// as it is only used by this component.
function worldToScreen(x: number, y: number): [number, number] {
  const screenX = (x - y) * (AppConfig.tileW / 2)
  const screenY = (x + y) * (AppConfig.tileH / 2)
  return [screenX, screenY]
}

export function NavPanel() {
  // === Global State Connections ===
  const openPanel = useUiStore((state) => state.openPanel)
  const baseBuildings = useMapStore((state) => state.baseBuildings)
  // Get the correct action from the camera store
  const { panTo } = useCameraStore.getState()

  // === Internal Component State ===
  const [activeTab, setActiveTab] = useState<ActiveTab>('goTo')
  const [xInput, setXInput] = useState('600') // Default to castle
  const [yInput, setYInput] = useState('600') // Default to castle

  const landmarks = baseBuildings.filter(
    (b) =>
      b.displayName.includes("King's Castle") ||
      b.displayName.includes('Fortress')
  )

  // === Event Handlers ===
  const handleGoTo = (x: number, y: number) => {
    // At the moment of the click, get the LATEST state from the store.
    const latestScale = useCameraStore.getState().scale

    const [targetScreenX, targetScreenY] = worldToScreen(x, y)

    const newCameraX = window.innerWidth / 2 - targetScreenX * latestScale
    const newCameraY = window.innerHeight / 2 - targetScreenY * latestScale

    // Call the panTo action with the correctly calculated coordinates.
    panTo(newCameraX, newCameraY)
  }

  const isOpen = openPanel === 'nav'
  const panelClassName = `${styles.navPanel} ${isOpen ? styles.open : ''}`

  return (
    <Panel className={panelClassName}>
      <div className={styles.tabButtons}>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'goTo' ? styles.active : ''
          }`}
          onClick={() => setActiveTab('goTo')}
        >
          Go To
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'landmarks' ? styles.active : ''
          }`}
          onClick={() => setActiveTab('landmarks')}
        >
          Landmarks
        </button>
      </div>

      {/* Go To Tab Content */}
      {activeTab === 'goTo' && (
        <div className={styles.tabContent}>
          <div className={styles.goToForm}>
            <span>X:</span>
            <input
              type="number"
              value={xInput}
              onChange={(e) => setXInput(e.target.value)}
            />
            <span>Y:</span>
            <input
              type="number"
              value={yInput}
              onChange={(e) => setYInput(e.target.value)}
            />
            <button
              className={styles.goButton}
              onClick={() => handleGoTo(Number(xInput), Number(yInput))}
            >
              Go
            </button>
          </div>
        </div>
      )}

      {/* Landmarks Tab Content */}
      {activeTab === 'landmarks' && (
        <div className={`${styles.tabContent} ${styles.landmarkList}`}>
          {landmarks.map((b) => (
            <div key={b.id} className={styles.landmarkItem}>
              <span>{b.displayName}</span>
              <button
                className={styles.goButton}
                onClick={() => handleGoTo(b.x, b.y)}
              >
                Go
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
