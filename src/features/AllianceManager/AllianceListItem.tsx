import { type Alliance } from '../../types/map.types';
import styles from './AllianceListItem.module.css';

interface Props {
  alliance: Alliance;
  selected?: boolean;
  onSelect?: (id: number) => void;
  showTagRight?: boolean; // if true render tag on right side instead of merged prefix
}

export function AllianceListItem({
  alliance,
  selected,
  onSelect,
  showTagRight,
}: Props) {
  return (
    <button
      type="button"
      className={`${styles.itemButton} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect?.(alliance.id)}
      title={alliance.name}
    >
      <span
        className={styles.colorBar}
        style={{ background: alliance.color }}
      />
      {/* Tag on left when showTagRight is false */}
      {!showTagRight && <span className={styles.tag}>{alliance.tag}</span>}
      <span className={styles.name}>{alliance.name}</span>
      {showTagRight && <span className={styles.tag}>{alliance.tag}</span>}
    </button>
  );
}
