import { useState } from 'react'
import { Panel } from '../../components/Panel/Panel'
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'
import { PlayerItem } from './PlayerItem'
import styles from './PlayerPanel.module.css'

export function PlayerPanel() {
  const players = useMapStore((state) => state.players)
  const createPlayer = useMapStore((state) => state.createPlayer)
  const openPanel = useUiStore((state) => state.openPanel)

  // State for all form fields
  const [name, setName] = useState('')
  const [power, setPower] = useState('') // New Power field
  const [rallyCap, setRallyCap] = useState('') // Renamed for clarity
  const [tcLevel, setTcLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('#9400d3')

  const handleCreate = () => {
    if (!name.trim()) return alert('Player name cannot be empty.')
    // Call the createPlayer action with the CORRECT property names
    createPlayer({ name, power, rallyCap, tcLevel, notes, color })
    // Clear all fields
    setName('')
    setPower('')
    setRallyCap('')
    setTcLevel('')
    setNotes('')
  }

  const isOpen = openPanel === 'player'
  const panelClassName = `${styles.sidebarPanel} ${isOpen ? styles.open : ''}`

  return (
    <Panel className={panelClassName}>
      <div className={styles.playerListContainer}>
        <h4 className={styles.sectionTitle}>Players</h4>
        {players.map((player) => (
          <PlayerItem key={player.id} player={player} />
        ))}
      </div>

      <div className={styles.createPlayerContainer}>
        <h4 className={styles.sectionTitle}>Create Player</h4>
        <div className={styles.formGrid}>
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
        <button className={styles.primaryButton} onClick={handleCreate}>
          Create Player
        </button>
      </div>
    </Panel>
  )
}
