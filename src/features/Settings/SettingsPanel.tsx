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
  // Get a non-reactive reference to the store's state for exporting
  const { alliances, players, userBuildings, importPlan } =
    useMapStore.getState();

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
