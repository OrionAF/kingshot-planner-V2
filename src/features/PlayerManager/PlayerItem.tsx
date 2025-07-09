import { type Player } from '../../types/map.types'
import styles from './PlayerItem.module.css'

interface PlayerItemProps {
  player: Player
}

export function PlayerItem({ player }: PlayerItemProps) {
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
          {/* Display Power and TC Level */}
          <span>Power: {player.power || 'N/A'}</span>
          <span style={{ marginLeft: '10px' }}>
            TC: {player.tcLevel || 'N/A'}
          </span>
        </div>
        {/* Display Rally Cap on a new line */}
        <div className={styles.power}>Rally: {player.rallyCap || 'N/A'}</div>
      </div>
      {/* We will add controls later */}
    </div>
  )
}
