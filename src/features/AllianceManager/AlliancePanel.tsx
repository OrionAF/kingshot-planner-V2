import { useState } from 'react';
import { Panel } from '../../components/Panel/Panel';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import { AllianceListItem } from './AllianceListItem';
import styles from './AlliancePanel.module.css';

export function AlliancePanel() {
  const alliances = useMapStore((state) => state.alliances);
  const createAlliance = useMapStore((state) => state.createAlliance);
  const openPanel = useUiStore((state) => state.openPanel);

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  // Color now auto-assigned; maintain no local color state

  const handleCreate = () => {
    if (!name.trim() || !tag.trim()) {
      alert('Alliance Name and Tag cannot be empty.');
      return;
    }
    // Provide a placeholder color (will be auto-adjusted in store)
    createAlliance({ name, tag, color: '#000000' });
    setName('');
    setTag('');
  };

  const isOpen = openPanel === 'alliance';
  const panelClassName = `${styles.sidebarPanel} ${isOpen ? styles.open : ''}`;

  return (
    <Panel className={panelClassName}>
      <div className={styles.allianceListContainer}>
        <h4 className={styles.sectionTitle}>Alliances</h4>
        {alliances.map((alliance) => (
          <AllianceListItem
            key={alliance.id}
            alliance={alliance}
            showTagRight
          />
        ))}
      </div>

      <div className={styles.createAllianceContainer}>
        <h4 className={styles.sectionTitle}>Create Alliance</h4>
        <div className={styles.formGrid}>
          <label htmlFor="allianceName">Name:</label>
          <input
            id="allianceName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <label htmlFor="allianceTag">Tag:</label>
          <input
            id="allianceTag"
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            maxLength={3}
          />
          <span
            style={{
              gridColumn: '1 / span 2',
              fontSize: '0.8rem',
              opacity: 0.8,
            }}
          >
            Color is assigned automatically to avoid clashes.
          </span>
        </div>
        <button className={styles.primaryButton} onClick={handleCreate}>
          Create Alliance
        </button>
      </div>
    </Panel>
  );
}
