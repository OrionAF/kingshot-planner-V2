import { useState } from 'react';
import { Panel } from '../../components/Panel/Panel'; // Our reusable panel
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import { AllianceItem } from './AllianceItem';
import styles from './AlliancePanel.module.css';

export function AlliancePanel() {
  // Get state and actions from our stores
  const alliances = useMapStore((state) => state.alliances);
  const createAlliance = useMapStore((state) => state.createAlliance);
  const openPanel = useUiStore((state) => state.openPanel);

  // Local state for the input fields
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [color, setColor] = useState('#d6662b');

  const handleCreate = () => {
    if (!name.trim() || !tag.trim()) {
      alert('Alliance Name and Tag cannot be empty.');
      return;
    }
    // Call the action from our store
    createAlliance({ name, tag, color });
    // Clear the form fields
    setName('');
    setTag('');
  };

  const isOpen = openPanel === 'alliance';
  // Combine base style with 'open' style if needed
  const panelClassName = `${styles.sidebarPanel} ${isOpen ? styles.open : ''}`;

  return (
    <Panel className={panelClassName}>
      <div className={styles.allianceListContainer}>
        <h4 className={styles.sectionTitle}>Alliances</h4>
        {alliances.map((alliance) => (
          <AllianceItem key={alliance.id} alliance={alliance} />
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
          <label htmlFor="allianceColor">Color:</label>
          <input
            id="allianceColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <button className={styles.primaryButton} onClick={handleCreate}>
          Create Alliance
        </button>
      </div>
    </Panel>
  );
}
