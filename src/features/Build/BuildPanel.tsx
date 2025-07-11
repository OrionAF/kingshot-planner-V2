// src/features/Build/BuildPanel.tsx
import { Panel } from '../../components/Panel/Panel';
import { AppConfig } from '../../config/appConfig';
import { useMapStore } from '../../state/useMapStore';
import { useUiStore } from '../../state/useUiStore';
import styles from './BuildPanel.module.css';
import { type BuildingType } from '../../types/map.types';
import { useMemo } from 'react';

export function BuildPanel() {
  // Select state slices for re-rendering
  const openPanel = useUiStore((state) => state.openPanel);
  const { activeAllianceId, selectedBuildingType } = useUiStore(
    (state) => state.buildMode,
  );
  const alliances = useMapStore((state) => state.alliances);
  const userBuildings = useMapStore((state) => state.userBuildings);

  // Select actions, which do not cause re-renders
  const { setActiveAllianceId, setSelectedBuildingType } =
    useUiStore.getState();

  const handleBuildingSelect = (type: BuildingType) => {
    // Action now handles toggling logic internally
    setSelectedBuildingType(type);
  };

  // Memoize the calculation of building counts so it only runs when buildings change
  const buildingCounts = useMemo(() => {
    return userBuildings.reduce(
      (acc, b) => {
        const key = `${b.allianceId}-${b.type}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [userBuildings]);

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
                  activeAllianceId === alliance.id ? styles.selected : ''
                }`}
                onClick={() => setActiveAllianceId(alliance.id)}
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
      <div className={styles.section}>
        <h4
          className={styles.sectionTitle}
          style={{ opacity: activeAllianceId ? 1 : 0.5 }}
        >
          2. Select a Building
        </h4>
        <div className={styles.buildingList}>
          {Object.entries(AppConfig.BUILDING_CATALOG).map(([type, def]) => {
            const isSelected = selectedBuildingType === type;
            const currentCount =
              buildingCounts[`${activeAllianceId}-${type}`] || 0;
            const limit = def.limit ?? Infinity;

            // This is the key logic fix. The button is disabled if no alliance is
            // selected OR if the building limit has been reached.
            const isAtLimit = currentCount >= limit;
            const isDisabled = !activeAllianceId || isAtLimit;

            let title = '';
            if (!activeAllianceId) {
              title = 'Please select an alliance first.';
            } else if (isAtLimit) {
              title = `Limit of ${limit} reached for this alliance.`;
            }

            return (
              <button
                key={type}
                className={`${styles.buildingItem} ${
                  isSelected ? styles.selected : ''
                }`}
                onClick={() => handleBuildingSelect(type as BuildingType)}
                disabled={isDisabled}
                title={title}
              >
                <span>{def.name}</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>
                  ({currentCount} / {limit === Infinity ? '∞' : limit})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
