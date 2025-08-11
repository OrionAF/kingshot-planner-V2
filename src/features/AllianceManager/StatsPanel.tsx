import { Panel } from '../../components/Panel/Panel';
import { useUiStore } from '../../state/useUiStore';
import {
  getAllianceStats,
  getTerritoryDensity,
  getAllianceCategoryCounts,
} from '../../state/selectors/alliances';
import styles from './AlliancePanel.module.css';

export function StatsPanel() {
  const openPanel = useUiStore((s) => s.openPanel);
  // Selector function reads store internally (cached) so just call.
  const stats = getAllianceStats();
  const densities = getTerritoryDensity();
  const categories = getAllianceCategoryCounts();
  const byIdDensity = new Map(densities.map((d) => [d.allianceId, d]));
  const byIdCats = new Map(categories.map((c) => [c.allianceId, c]));
  const merged = stats
    .map((s) => {
      const dens = byIdDensity.get(s.allianceId);
      const cats = byIdCats.get(s.allianceId);
      const totalBuildings = Object.values(s.buildingCounts).reduce(
        (a, b) => a + b,
        0,
      );
      const density = dens ? dens.density : 0;
      const territory = dens ? dens.tiles : s.territoryTileCount;
      return {
        ...s,
        totalBuildings,
        density,
        territory,
        cats: cats?.categories || {},
      };
    })
    .sort((a, b) => b.territory - a.territory);
  const isOpen = openPanel === 'stats';
  return (
    <Panel
      className={`${styles.AllianceSidebarPanel} ${isOpen ? styles.open : ''}`}
    >
      <h4 className={styles.sectionTitle}>Alliance Stats</h4>
      <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 6 }}>
        Territory tiles (T), total buildings (B), density (D=B/T), and category
        split.
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          overflowY: 'auto',
        }}
      >
        {merged.map((m) => {
          const catEntries = Object.entries(m.cats).sort((a, b) => b[1] - a[1]);
          return (
            <div
              key={m.allianceId}
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 6px',
                borderRadius: 4,
                fontSize: 11,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span>
                  <strong>#{m.allianceId}</strong>{' '}
                  <span style={{ opacity: 0.7 }}>T:{m.territory}</span>{' '}
                  <span style={{ opacity: 0.7 }}>B:{m.totalBuildings}</span>
                </span>
                <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>
                  D:{m.density.toFixed(2)}
                </span>
              </div>
              {catEntries.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {catEntries.map(([cat, count]) => (
                    <span
                      key={cat}
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        padding: '2px 4px',
                        borderRadius: 3,
                      }}
                    >
                      {cat}:{count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {merged.length === 0 && (
          <div style={{ opacity: 0.6 }}>No alliances yet.</div>
        )}
      </div>
    </Panel>
  );
}
