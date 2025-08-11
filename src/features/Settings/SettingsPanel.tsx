// src/features/Settings/SettingsPanel.tsx

import { useRef } from 'react';
import { Panel } from '../../components/Panel/Panel';
import { AppConfig } from '../../config/appConfig';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import { type PlanFile } from '../../types/map.types'; // <-- Import the shared type
import styles from './SettingsPanel.module.css';

export function SettingsPanel() {
  const openPanel = useUiStore((state) => state.openPanel);
  // Get a non-reactive reference to the importPlan action
  const { importPlan } = useMapStore.getState();
  const clearPlan = () => {
    // Multi-step confirmations (triple)
    if (
      !window.confirm(
        'Step 1: This will ERASE all alliances & buildings. Continue?',
      )
    )
      return;
    if (!window.confirm('Step 2: This cannot be undone. Proceed?')) return;
    if (!window.confirm('Step 3: There is NO undo. Still proceed?')) return;
    const final = prompt(
      'FINAL STEP: Type CLEAR PLAN to confirm deletion:',
      '',
    );
    if (final !== 'CLEAR PLAN') {
      alert('Phrase mismatch. Aborted.');
      return;
    }
    const mapStore = useMapStore.getState();
    // Wipe relevant arrays
    mapStore.hydrateMap({ alliances: [], players: [], userBuildings: [] });
    alert('Build plan cleared.');
  };

  const clearStorage = () => {
    // Quadruple confirmation for full localStorage purge
    if (
      !window.confirm(
        'Step 1: This will clear ALL saved planner data in this browser. Continue?',
      )
    )
      return;
    if (
      !window.confirm(
        'Step 2: This also removes camera settings & bookmarks. Proceed?',
      )
    )
      return;
    if (!window.confirm('Step 3: There is NO undo. Still proceed?')) return;
    const phrase = prompt('FINAL STEP: Type ERASE STORAGE to confirm:', '');
    if (phrase !== 'ERASE STORAGE') {
      alert('Phrase mismatch. Aborted.');
      return;
    }
    try {
      localStorage.clear();
      alert('Local storage cleared. Reloading...');
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to clear storage (see console).');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // We get the latest state directly here to ensure the export is always fresh
    const latestState = useMapStore.getState();
    const planData: PlanFile = {
      version: AppConfig.CURRENT_VERSION, // Use dynamic version
      alliances: latestState.alliances,
      players: latestState.players,
      userBuildings: latestState.userBuildings,
    };
    const jsonString = JSON.stringify(planData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Create a more descriptive filename
    a.download = `kingshot-plan-v${AppConfig.CURRENT_VERSION}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string')
          throw new Error('File could not be read');
        const data = JSON.parse(result) as PlanFile;

        // Loosened version check to accept any file that has the required data arrays
        if (data && Array.isArray(data.alliances)) {
          if (
            window.confirm(
              'This will overwrite your current plan. Are you sure?',
            )
          ) {
            const planToImport = {
              alliances: data.alliances ?? [],
              players: data.players ?? [],
              userBuildings: data.userBuildings ?? [],
            };
            importPlan(planToImport);
            alert('Plan imported successfully!');
          }
        } else {
          throw new Error('Invalid or unsupported plan file format.');
        }
      } catch (error) {
        console.error(error);
        alert(
          `Error importing plan: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isOpen = openPanel === 'settings';
  const panelClassName = `${styles.settingsPanel} ${isOpen ? styles.open : ''}`;

  return (
    <Panel className={panelClassName}>
      <h4 className={styles.sectionTitle}>Build Plan</h4>
      <div className={styles.buttonGroup}>
        <button className={styles.button} onClick={handleImportClick}>
          Import
        </button>
        <button className={styles.button} onClick={handleExport}>
          Export
        </button>
      </div>
      <h4 className={styles.sectionTitle} style={{ marginTop: 18 }}>
        Danger Zone
      </h4>
      <div className={styles.dangerGroup}>
        <button
          className={`${styles.button} ${styles.danger}`}
          onClick={clearPlan}
        >
          Clear Build Plan
        </button>
        <button
          className={`${styles.button} ${styles.danger}`}
          onClick={clearStorage}
        >
          Clear Browser Storage
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileSelected}
      />
    </Panel>
  );
}
