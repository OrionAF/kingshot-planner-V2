// src/features/Settings/SettingsPanel.tsx

import { useRef } from 'react'
import { Panel } from '../../components/Panel/Panel'
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'
import { type Alliance, type Player } from '../../types/map.types' // Import Player
import styles from './SettingsPanel.module.css'

interface PlanFile {
  version: number
  alliances: Alliance[]
  players: Player[] // FIX: Add players to the plan format
}

export function SettingsPanel() {
  const openPanel = useUiStore((state) => state.openPanel)
  // FIX: Get players from the store for export
  const { alliances, players, importPlan } = useMapStore.getState()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const planData: PlanFile = {
      version: 1.1, // Bump version for the new format
      alliances,
      players, // FIX: Include players in the exported data
    }

    const jsonString = JSON.stringify(planData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kingshot-plan-v1.1-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const result = event.target?.result
        const data = JSON.parse(result as string) as PlanFile

        // FIX: Update validation to check for the new format and handle old format gracefully
        if (
          data &&
          (data.version === 1 || data.version === 1.1) &&
          Array.isArray(data.alliances)
        ) {
          if (
            window.confirm(
              'This will overwrite your current plan. Are you sure?'
            )
          ) {
            // Ensure players is an array, even if importing an old file
            const planToImport = {
              alliances: data.alliances,
              players: data.players ?? [],
            }
            importPlan(planToImport)
            alert('Plan imported successfully!')
          }
        } else {
          throw new Error('Invalid or unsupported plan file format.')
        }
      } catch (error) {
        console.error(error)
        alert(
          `Error importing plan: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const isOpen = openPanel === 'settings'
  const panelClassName = `${styles.settingsPanel} ${isOpen ? styles.open : ''}`

  return (
    <Panel className={panelClassName}>
      <h4 className={styles.sectionTitle}>Build Plan</h4>
      <div className={styles.buttonGroup}>
        <button className={styles.button} onClick={handleImportClick}>
          Import
        </button>
        <button className={styles.button} onClick={handleExport}>
          Export
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileSelected}
      />
    </Panel>
  )
}
