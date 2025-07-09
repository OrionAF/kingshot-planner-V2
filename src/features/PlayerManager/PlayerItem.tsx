// src/features/PlayerManager/PlayerItem.tsx

import { type Player } from '../../types/map.types'
import styles from './PlayerItem.module.css' // Using this component's specific CSS
import { useMapStore } from '../../state/useMapStore'
import { useUiStore } from '../../state/useUiStore'

interface PlayerItemProps {
  player: Player
}

export function PlayerItem({ player }: PlayerItemProps) {
  const { deletePlayer } = useMapStore()
  const { startEditingPlayer } = useUiStore()

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${player.name}?`)) {
      deletePlayer(player.id)
    }
  }

  return (
    <div
      className={styles.playerItem}
      style={{ borderLeftColor: player.color }}
    >
      <div
        className={styles.colorSwatch}
        style={{ backgroundColor: player.color }}
      />
      <div className={styles.info}>
        <div className={styles.name}>{player.name}</div>
        <div className={styles.power}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span>Power: {player.power || 'N/A'}</span>
            <span>TC: {player.tcLevel || 'N/A'}</span>
          </div>
        </div>
        <div className={styles.power}>Rally: {player.rallyCap || 'N/A'}</div>
      </div>
      <div className={styles.controls}>
        <button onClick={() => startEditingPlayer(player)}>Edit</button>
        <button className={styles.danger} onClick={handleDelete}>
          Del
        </button>
      </div>
    </div>
  )
}
