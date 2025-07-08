import { type Alliance } from '../../types/map.types'
import styles from './AllianceItem.module.css'

interface AllianceItemProps {
  alliance: Alliance
}

export function AllianceItem({ alliance }: AllianceItemProps) {
  return (
    <div
      className={styles.allianceItem}
      style={{ borderLeftColor: alliance.color }}
    >
      <div className={styles.summary}>
        <div
          className={styles.colorSwatch}
          style={{ backgroundColor: alliance.color }}
        />
        <div className={styles.name}>{alliance.name}</div>
        <div className={styles.tag}>{alliance.tag}</div>
        {/* We will add controls like "Select" and "Edit" later */}
      </div>
      {/* We will add the expandable details section later */}
    </div>
  )
}
