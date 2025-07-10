// src/features/Navigation/NavPanel.tsx

import { useState } from 'react'
import { Panel } from '../../components/Panel/Panel'
import { useCameraStore } from '../../state/useCameraStore'
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'
import styles from './NavPanel.module.css'

type ActiveTab = 'goTo' | 'landmarks'

export function NavPanel() {
  const openPanel = useUiStore((state) => state.openPanel)
  const baseBuildings = useMapStore((state) => state.baseBuildings)
  // FIX: Get the panTo action directly
  const { panTo } = useCameraStore.getState()

  const [activeTab, setActiveTab] = useState<ActiveTab>('goTo')
  const [xInput, setXInput] = useState('600')
  const [yInput, setYInput] = useState('600')

  const landmarks = baseBuildings.filter(
    (b) =>
      b.displayName.includes("King's Castle") ||
      b.displayName.includes('Fortress')
  )

  const handleGoTo = (x: number, y: number) => {
    // FIX: Simplified logic. Just call panTo with world coordinates.
    panTo(x, y)
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
