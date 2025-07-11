// src/features/Build/BuildPanel.tsx
import { Panel } from '../../components/Panel/Panel';
import { AppConfig } from '../../config/appConfig';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import styles from './BuildPanel.module.css';

export function BuildPanel() {
  const openPanel = useUiStore((state) => state.openPanel);
  const alliances = useMapStore((state) => state.alliances);
  const { buildMode, setActiveAllianceId, setSelectedBuildingType } =
    useUiStore();

  const buildingCatalog = AppConfig.BUILDING_CATALOG;

  const handleAllianceSelect = (id: number) => {
    setActiveAllianceId(buildMode.activeAllianceId === id ? null : id);
  };

  const handleBuildingSelect = (
    type: keyof typeof AppConfig.BUILDING_CATALOG,
  ) => {
    setSelectedBuildingType(type);
  };

  const isOpen = openPanel === 'build';
  const panelClassName = `${styles.buildPanel} ${isOpen ? styles.open : ''}`;

  return (
    <Panel className={panelClassName}>
      {/* --- Alliance Selection Section --- */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>1. Select an Alliance</h4>
        <div className={styles.allianceList}>
          {alliances.length > 0 ? (
            alliances.map((alliance) => (
              <button
                key={alliance.id}
                className={`${styles.allianceItem} ${
                  buildMode.activeAllianceId === alliance.id
                    ? styles.selected
                    : ''
                }`}
                onClick={() => handleAllianceSelect(alliance.id)}
                style={{ borderLeft: `5px solid ${alliance.color}` }}
              >
                <span>{`[${alliance.tag}] ${alliance.name}`}</span>
              </button>
            ))
          ) : (
            <div className={styles.placeholder}>Create an alliance first.</div>
          )}
        </div>
      </div>

      {/* --- Building Selection Section --- */}
      {buildMode.activeAllianceId && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>2. Select a Building</h4>
          <div className={styles.buildingList}>
            {Object.entries(buildingCatalog).map(([type, def]) => (
              <button
                key={type}
                className={`${styles.buildingItem} ${
                  buildMode.selectedBuildingType === type ? styles.selected : ''
                }`}
                onClick={() =>
                  handleBuildingSelect(
                    type as keyof typeof AppConfig.BUILDING_CATALOG,
                  )
                }
              >
                <span>{def.name}</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>
                  {def.w}x{def.h}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
