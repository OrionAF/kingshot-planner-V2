// src/features/PlayerManager/EditPlayerModal.tsx
import { useEffect, useState } from 'react'
import { ModalOverlay } from '../../components/Modal/ModalOverlay'
import { Panel } from '../../components/Panel/Panel'
import { useUiStore } from '../../state/useUiStore'
import { useMapStore } from '../../state/useMapStore'
import styles from './PlayerPanel.module.css'

export function EditPlayerModal() {
  const { editingPlayer, endEditingPlayer } = useUiStore()
  const { updatePlayer } = useMapStore()

  // Local state for the form fields
  const [name, setName] = useState('')
  const [power, setPower] = useState('')
  const [rallyCap, setRallyCap] = useState('')
  const [tcLevel, setTcLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('#9400d3')

  // When the modal opens, populate the form with the player's data
  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name)
      setPower(editingPlayer.power)
      setRallyCap(editingPlayer.rallyCap)
      setTcLevel(editingPlayer.tcLevel)
      setNotes(editingPlayer.notes)
      setColor(editingPlayer.color)
    }
  }, [editingPlayer])

  const handleSaveChanges = () => {
    if (!editingPlayer) return
    updatePlayer(editingPlayer.id, {
      name,
      power,
      rallyCap,
      tcLevel,
      notes,
      color,
    })
    endEditingPlayer()
  }

  if (!editingPlayer) return null

  return (
    // Pass the closing function to the overlay's new `onClose` prop
    <ModalOverlay onClose={endEditingPlayer}>
      <Panel className={styles.modalPanel}>
        <h4 className={styles.sectionTitle}>Edit Player</h4>
        <div className={styles.formGrid}>
          <label htmlFor="editPlayerName">Name:</label>
          <input
            id="editPlayerName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="editPlayerPower">Power:</label>
          <input
            id="editPlayerPower"
            type="text"
            value={power}
            onChange={(e) => setPower(e.target.value)}
          />

          <label htmlFor="editPlayerRallyCap">Rally Cap:</label>
          <input
            id="editPlayerRallyCap"
            type="text"
            value={rallyCap}
            onChange={(e) => setRallyCap(e.target.value)}
          />

          <label htmlFor="editPlayerTcLevel">TC Level:</label>
          <input
            id="editPlayerTcLevel"
            type="text"
            value={tcLevel}
            onChange={(e) => setTcLevel(e.target.value)}
          />

          <label htmlFor="editPlayerNotes">Notes:</label>
          <textarea
            id="editPlayerNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <label htmlFor="editPlayerColor">Color:</label>
          <input
            id="editPlayerColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.secondaryButton} onClick={endEditingPlayer}>
            Cancel
          </button>
          <button className={styles.primaryButton} onClick={handleSaveChanges}>
            Save Changes
          </button>
        </div>
      </Panel>
    </ModalOverlay>
  )
}
