import { useState } from 'react';
import { Panel } from '../../components/Panel/Panel';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import { AllianceListItem } from './AllianceListItem';
import styles from './AlliancePanel.module.css';

export function AlliancePanel() {
  const alliances = useMapStore((state) => state.alliances);
  const updateAlliance = useMapStore((s) => s.updateAlliance);
  const deleteAlliance = useMapStore((s) => s.deleteAlliance);
  const reassignAllianceColor = useMapStore((s) => s.reassignAllianceColor);
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
  const panelClassName = `${styles.AllianceSidebarPanel} ${isOpen ? styles.open : ''}`;

  return (
    <Panel className={panelClassName}>
      <div className={styles.allianceListContainer}>
        <h4 className={styles.sectionTitle}>Alliances</h4>
        <div className={styles.allianceList}>
          {alliances.map((alliance) => (
            <div key={alliance.id} className={styles.allianceRow}>
              <AllianceListItem
                alliance={alliance}
                showTagRight={false}
                embedded
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  title="Edit name/tag"
                  onClick={() => {
                    const newName = prompt('New name', alliance.name)?.trim();
                    if (!newName || newName === alliance.name) return;
                    const newTag = prompt('New tag', alliance.tag)?.trim();
                    if (!newTag || newTag === alliance.tag) return;
                    updateAlliance(alliance.id, { name: newName, tag: newTag });
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  title="Reassign color"
                  onClick={() => reassignAllianceColor(alliance.id)}
                >
                  Color
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.danger}`}
                  title="Delete alliance"
                  onClick={() => {
                    if (!confirm('Step 1: Delete alliance and its buildings?'))
                      return;
                    if (!confirm('Step 2: This cannot be undone. Proceed?'))
                      return;
                    const finalType = prompt(
                      'FINAL STEP: Type the alliance TAG (exact) to confirm deletion:',
                      '',
                    )?.trim();
                    if (finalType !== alliance.tag) {
                      alert('Tag mismatch. Deletion cancelled.');
                      return;
                    }
                    deleteAlliance(alliance.id);
                    // Territory recalculation handled in store after deletion (ensure ordering of first-claim remains by insertion order of surviving buildings)
                  }}
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
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
// (Removed inline miniBtnStyle; using CSS module classes instead.)
