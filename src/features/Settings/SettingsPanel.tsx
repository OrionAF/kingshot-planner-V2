import { useRef } from 'react'
import { Panel } from '../../components/Panel/Panel'
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'
import { type Alliance } from '../../types/map.types'
import styles from './SettingsPanel.module.css'

// Define the shape of our save file
interface PlanFile {
  version: number
  alliances: Alliance[]
  // We will add buildings and players here later
}

export function SettingsPanel() {
  // Get state and actions from stores
  const openPanel = useUiStore((state) => state.openPanel)
  const { alliances, importPlan } = useMapStore.getState()

  // Create a ref to hold our hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null)

  // === Event Handlers ===

  const handleExport = () => {
    const planData: PlanFile = {
      version: 1,
      alliances: alliances,
    }

    const jsonString = JSON.stringify(planData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create a hidden link element to trigger the download
    const a = document.createElement('a')
    a.href = url
    a.download = `kingshot-plan-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    // When the visible "Import" button is clicked, we trigger a click
    // on our hidden file input element.
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

        // Very basic validation
        if (data && data.version === 1 && Array.isArray(data.alliances)) {
          if (
            window.confirm(
              'This will overwrite your current plan. Are you sure?'
            )
          ) {
            importPlan(data)
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

    // Reset file input to allow importing the same file again
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
      {/* This is a hidden element that handles file selection */}
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
