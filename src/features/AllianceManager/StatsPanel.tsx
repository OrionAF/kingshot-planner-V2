import { Panel } from '../../components/Panel/Panel';
import { useUiStore } from '../../state/useUiStore';
import { getAllianceStats } from '../../state/selectors/alliances';
import styles from './AlliancePanel.module.css';

export function StatsPanel() {
  const openPanel = useUiStore((s) => s.openPanel);
  // Selector function reads store internally (cached) so just call.
  const stats = getAllianceStats();
  const isOpen = openPanel === 'stats';
  return (
    <Panel
      className={`${styles.AllianceSidebarPanel} ${isOpen ? styles.open : ''}`}
    >
      <h4 className={styles.sectionTitle}>Alliance Stats</h4>
      <div style={{ fontSize: '0.8rem', opacity: 0.75, marginBottom: 8 }}>
        Basic counts (territory & buildings). More analytics later.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stats.map((s) => {
          const totalBuildings = Object.values(s.buildingCounts).reduce(
            (a, b) => a + b,
            0,
          );
          return (
            <div
              key={s.allianceId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 6px',
                borderRadius: 4,
              }}
            >
              <span>
                <strong># {s.allianceId}</strong>{' '}
                <span style={{ opacity: 0.7 }}>T:{s.territoryTileCount}</span>
              </span>
              <span style={{ fontFamily: 'monospace' }}>
                B:{totalBuildings}
              </span>
            </div>
          );
        })}
        {stats.length === 0 && (
          <div style={{ opacity: 0.6 }}>No alliances yet.</div>
        )}
      </div>
    </Panel>
  );
}
