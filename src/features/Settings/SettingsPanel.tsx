// src/features/Settings/SettingsPanel.tsx

import { useRef, useState } from 'react';
import { Panel } from '../../components/Panel/Panel';
import { AppConfig } from '../../config/appConfig';
import { useMapStore } from '../../state/useMapStore';
import { useBookmarkStore } from '../../state/useBookmarkStore';
import { useUiStore } from '../../state/useUiStore';
import { type PlanFile } from '../../types/map.types'; // <-- Import the shared type
import { disableUnifiedPersistence } from '../../state/unifiedPersist';
import styles from './SettingsPanel.module.css';

export function SettingsPanel() {
  const openPanel = useUiStore((state) => state.openPanel);
  // Get a non-reactive reference to the importPlan action
  const { importPlan } = useMapStore.getState();
  const clearPlan = () => {
    const summary = [
      'CLEAR BUILD PLAN SUMMARY:',
      '',
      'This action will REMOVE:',
      '  • Alliances',
      '  • Players',
      '  • User buildings (your placed structures)',
      '',
      'This action will KEEP:',
      '  • Bookmarks',
      '  • Camera position & zoom',
      '  • UI panel state',
      '  • Overwatch / navigation settings',
      '  • Meta flags (patch notes, version)',
      '',
      'There is NO undo.',
    ].join('\n');
    if (!window.confirm(summary + '\n\nProceed?')) return;
    const final = prompt('Type CLEAR PLAN to confirm:', '');
    if (final !== 'CLEAR PLAN') return alert('Phrase mismatch. Aborted.');
    const mapStore = useMapStore.getState();
    mapStore.hydrateMap({ alliances: [], players: [], userBuildings: [] });
    alert('Build plan cleared.');
  };

  const clearStorage = () => {
    const summary = [
      'CLEAR BROWSER STORAGE SUMMARY:',
      '',
      'This action will REMOVE:',
      '  • Bookmarks',
      '  • Camera position & zoom (reset to defaults on reload)',
      '  • UI open panel state',
      '  • Overwatch / navigation settings',
      '  • Meta flags (patch notes viewed status, version seen)',
      '',
      'This action will KEEP:',
      '  • Alliances',
      '  • Players',
      '  • User buildings',
      '',
      'There is NO undo.',
    ].join('\n');
    if (!window.confirm(summary + '\n\nProceed?')) return;
    const phrase = prompt('Type ERASE STORAGE to confirm:', '');
    if (phrase !== 'ERASE STORAGE') return alert('Phrase mismatch. Aborted.');
    try {
      disableUnifiedPersistence();
      const mapState = useMapStore.getState();
      const planSnapshot = {
        alliances: mapState.alliances.map((a) => ({ ...a })),
        players: mapState.players.map((p) => ({ ...p })),
        userBuildings: mapState.userBuildings.map((b) => ({ ...b })),
      };
      useBookmarkStore.getState().clearAll();
      localStorage.clear();
      useMapStore.getState().hydrateMap(planSnapshot);
      alert('Browser storage cleared (build plan retained). Reloading...');
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
            // Ignore legacy bookmarks if present (backward compatibility)
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
  // minimap layer UI moved to child component

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
      <h4 className={styles.sectionTitle} style={{ marginTop: 18 }}>
        Minimap Layers
      </h4>
      <MinimapLayersSection />
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

// --- Hierarchical Minimap Layers (aligned children + chevron spacer) ---
function MinimapLayersSection() {
  const layers = useUiStore((s) => s.minimapLayers);
  const toggle = useUiStore((s) => s.toggleMinimapLayer);
  const setLayer = useUiStore((s) => s.setMinimapLayer);

  const [open, setOpen] = useState<{ [k: string]: boolean }>({
    alliances: true,
    mapBuildings: true,
    fortresses: true,
    sanctuaries: true,
    outposts: true,
    resources: true,
  });

  const colors = {
    bg: '#2f343a',
    border: '#3a4047',
    text: '#e3e6ea',
  };

  const s = {
    container: {
      border: `1px solid ${colors.border}`,
      borderRadius: 6,
      padding: 4,
      background: colors.bg,
      maxHeight: 340,
      overflowY: 'auto' as const,
      color: colors.text,
      fontSize: 13,
      lineHeight: 1.2,
    },
    divider: {
      height: 1,
      background: colors.border,
      margin: '6px 0',
      opacity: 0.7,
    },
    headerRow: {
      display: 'grid',
      gridTemplateColumns: '14px 18px 1fr', // chevron • checkbox • label
      alignItems: 'center',
      gap: 6,
      padding: '2px 4px',
      borderRadius: 4,
      cursor: 'pointer',
      fontWeight: 600 as const,
      userSelect: 'none' as const,
    },
    chevron: { width: 14, textAlign: 'center' as const },
    cbWrap: {
      width: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cb: {
      transform: 'scale(1.25)',
      transformOrigin: 'left center',
      cursor: 'pointer',
    },
    indent: (px: number) => ({
      marginLeft: px,
      paddingLeft: 8,
      borderLeft: `1px solid ${colors.border}`,
    }),
    itemRow: (padForChevron = false) => ({
      display: 'grid',
      gridTemplateColumns: padForChevron ? '14px 18px 1fr' : '18px 1fr',
      alignItems: 'center',
      gap: 6,
      padding: '2px 4px',
      borderRadius: 4,
      cursor: 'pointer',
    }),
    grid: (min = 140) => ({
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
      gap: 4,
      padding: '2px 0',
    }),
  };

  const Header = ({
    id,
    label,
    masterKey,
  }: {
    id: keyof typeof open;
    label: string;
    masterKey?: keyof typeof layers;
  }) => {
    const isOpen = !!open[id];
    return (
      <div
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        style={s.headerRow as React.CSSProperties}
        onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => ({ ...o, [id]: !o[id] }));
          }
        }}
      >
        <span style={s.chevron}>{isOpen ? '▾' : '▸'}</span>
        {masterKey ? (
          <div style={s.cbWrap as React.CSSProperties}>
            <input
              type="checkbox"
              style={s.cb as React.CSSProperties}
              checked={!!layers[masterKey]}
              onClick={(e) => {
                e.stopPropagation();
                toggle(masterKey);
              }}
              readOnly
            />
          </div>
        ) : (
          <span />
        )}
        <span>{label}</span>
      </div>
    );
  };

  const RowToggle = ({
    k,
    label,
    padForChevron = false,
    bold = false,
  }: {
    k: keyof typeof layers;
    label: string;
    padForChevron?: boolean;
    bold?: boolean;
  }) => (
    <label style={s.itemRow(padForChevron) as React.CSSProperties}>
      {padForChevron && <span style={s.chevron} />}{' '}
      {/* align under label column */}
      <div style={s.cbWrap as React.CSSProperties}>
        <input
          type="checkbox"
          style={s.cb as React.CSSProperties}
          checked={!!layers[k]}
          onChange={() => toggle(k)}
        />
      </div>
      <span style={bold ? { fontWeight: 600 } : undefined}>{label}</span>
    </label>
  );

  // Child section (header + body directly beneath)
  const ChildSection = ({
    openKey,
    masterKey,
    label,
    children,
  }: {
    openKey: keyof typeof open;
    masterKey: keyof typeof layers;
    label: string;
    children: React.ReactNode;
  }) => (
    <>
      <Header id={openKey} label={label} masterKey={masterKey} />
      {open[openKey] && layers[masterKey] && (
        <div style={{ ...s.indent(12), marginTop: 4 }}>{children}</div>
      )}
    </>
  );

  return (
    <div style={s.container as React.CSSProperties}>
      {/* Alliances */}
      <Header id="alliances" label="Alliances" masterKey="alliancesGroup" />
      {open.alliances && layers.alliancesGroup && (
        <div style={{ ...s.indent(12), marginTop: 4 }}>
          <div style={s.grid(130)}>
            {/* padForChevron aligns these with the category labels, not under the parent's checkbox */}
            <RowToggle
              padForChevron
              k="allianceBuildings"
              label="Alliance Buildings"
            />
            <RowToggle
              padForChevron
              k="allianceTerritory"
              label="Alliance Territory"
            />
          </div>
        </div>
      )}

      <div style={s.divider} />

      {/* Players */}
      <div style={{ ...s.headerRow, gridTemplateColumns: '14px 18px 1fr' }}>
        <span style={s.chevron} /> {/* align with headers */}
        <div style={s.cbWrap as React.CSSProperties}>
          <input
            type="checkbox"
            style={s.cb as React.CSSProperties}
            checked={!!layers.playersGroup}
            onChange={() => {
              const newVal = !layers.playersGroup;
              toggle('playersGroup');
              if (layers.players !== newVal) setLayer('players', newVal);
            }}
          />
        </div>
        <span>Players</span>
      </div>

      <div style={s.divider} />

      {/* Map Buildings */}
      <Header
        id="mapBuildings"
        label="Map Buildings"
        masterKey="mapBuildingsGroup"
      />
      {open.mapBuildings && layers.mapBuildingsGroup && (
        <div style={{ ...s.indent(12), marginTop: 4 }}>
          {/* King's Castle: padForChevron so it's aligned with Fortresses/Sanctuaries/Outposts labels */}
          <RowToggle padForChevron bold k="kingCastle" label="King's Castle" />

          <ChildSection
            openKey="fortresses"
            masterKey="fortresses"
            label="Fortresses"
          >
            <div style={s.grid(120)}>
              {(
                [
                  'fortress_1',
                  'fortress_2',
                  'fortress_3',
                  'fortress_4',
                ] as const
              ).map((fk) => (
                <RowToggle
                  key={fk}
                  padForChevron
                  k={fk}
                  label={fk.replace('fortress_', 'Fortress ')}
                />
              ))}
            </div>
          </ChildSection>

          <ChildSection
            openKey="sanctuaries"
            masterKey="sanctuaries"
            label="Sanctuaries"
          >
            <div style={s.grid(120)}>
              {Array.from(
                { length: 12 },
                (_, i) => `sanctuary_${i + 1}` as const,
              ).map((sk) => (
                <RowToggle
                  key={sk}
                  padForChevron
                  k={sk as keyof typeof layers}
                  label={sk.replace('sanctuary_', 'Sanctuary ')}
                />
              ))}
            </div>
          </ChildSection>

          <ChildSection
            openKey="outposts"
            masterKey="outposts"
            label="Outposts"
          >
            <div style={s.grid(180)}>
              <RowToggle
                padForChevron
                k="lv1_builder"
                label="Builder's Guild Lv.1"
              />
              <RowToggle
                padForChevron
                k="lv3_builder"
                label="Builder's Guild Lv.3"
              />
              <RowToggle
                padForChevron
                k="lv1_scholar"
                label="Scholar's Tower Lv.1"
              />
              <RowToggle
                padForChevron
                k="lv3_scholar"
                label="Scholar's Tower Lv.3"
              />
              <RowToggle
                padForChevron
                k="lv1_forager"
                label="Forager Grove Lv.1"
              />
              <RowToggle
                padForChevron
                k="lv1_harvest"
                label="Harvest Altar Lv.1"
              />
              <RowToggle padForChevron k="lv2_armory" label="Armory Lv.2" />
              <RowToggle padForChevron k="lv4_armory" label="Armory Lv.4" />
              <RowToggle padForChevron k="lv2_arsenal" label="Arsenal Lv.2" />
              <RowToggle padForChevron k="lv4_arsenal" label="Arsenal Lv.4" />
              <RowToggle
                padForChevron
                k="lv2_drillCamp"
                label="Drill Camp Lv.2"
              />
              <RowToggle
                padForChevron
                k="lv3_frontierLodge"
                label="Frontier Lodge Lv.3"
              />
            </div>
          </ChildSection>
        </div>
      )}

      <div style={s.divider} />

      {/* Resources */}
      <Header
        id="resources"
        label="Resource Buildings"
        masterKey="resourcesGroup"
      />
      {open.resources && layers.resourcesGroup && (
        <div style={{ ...s.indent(12), marginTop: 4 }}>
          <div style={s.grid(110)}>
            <RowToggle padForChevron k="rss_food" label="Food" />
            <RowToggle padForChevron k="rss_wood" label="Wood" />
            <RowToggle padForChevron k="rss_stone" label="Stone" />
            <RowToggle padForChevron k="rss_iron" label="Iron" />
          </div>
        </div>
      )}
    </div>
  );
}
