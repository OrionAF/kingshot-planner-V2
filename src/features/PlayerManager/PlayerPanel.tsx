import { useState } from 'react'
import { Panel } from '../../components/Panel/Panel'
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'
import { PlayerItem } from './PlayerItem'
import styles from './PlayerPanel.module.css'

export function PlayerPanel() {
  const players = useMapStore((state) => state.players)
  const uiStore = useUiStore()

  // State for all form fields
  const [name, setName] = useState('')
  const [power, setPower] = useState('')
  const [rallyCap, setRallyCap] = useState('')
  const [tcLevel, setTcLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('#9400d3')

  // Renamed to reflect its new purpose
  const handleStartPlacement = () => {
    if (!name.trim()) return alert('Player name cannot be empty.')

    // 1. Activate placement mode with the form data
    uiStore.startPlayerPlacement({
      name,
      power,
      rallyCap,
      tcLevel,
      notes,
      color,
    })

    // 2. Close the panel to give the user a clear view of the map
    uiStore.closeAllPanels()

    // 3. Clear fields for the next time the panel is opened
    setName('')
    setPower('')
    setRallyCap('')
    setTcLevel('')
    setNotes('')
  }

  const isOpen = uiStore.openPanel === 'player'
  const panelClassName = `${styles.sidebarPanel} ${isOpen ? styles.open : ''}`

  return (
    <Panel className={panelClassName}>
      <div className={styles.playerListContainer}>
        <h4 className={styles.sectionTitle}>Players</h4>
        {players.length > 0 ? (
          players.map((player) => (
            <PlayerItem key={player.id} player={player} />
          ))
        ) : (
          <p className={styles.noPlayersText}>No players have been placed.</p>
        )}
      </div>

      <div className={styles.createPlayerContainer}>
        <h4 className={styles.sectionTitle}>Create Player</h4>
        <div className={styles.formGrid}>
          {/* ... all your form inputs remain the same ... */}
          <label htmlFor="playerName">Name:</label>
          <input
            id="playerName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="playerPower">Power:</label>
          <input
            id="playerPower"
            type="text"
            value={power}
            onChange={(e) => setPower(e.target.value)}
          />

          <label htmlFor="playerRallyCap">Rally Cap:</label>
          <input
            id="playerRallyCap"
            type="text"
            value={rallyCap}
            onChange={(e) => setRallyCap(e.target.value)}
          />

          <label htmlFor="playerTcLevel">TC Level:</label>
          <input
            id="playerTcLevel"
            type="text"
            value={tcLevel}
            onChange={(e) => setTcLevel(e.target.value)}
          />

          <label htmlFor="playerNotes">Notes:</label>
          <textarea
            id="playerNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <label htmlFor="playerColor">Color:</label>
          <input
            id="playerColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <button className={styles.primaryButton} onClick={handleStartPlacement}>
          Place on Map
        </button>
      </div>
    </Panel>
  )
}
