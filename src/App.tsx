// src/App.tsx

import { useEffect } from 'react';
import { BottomToolbar } from './features/Toolbar/BottomToolbar';
import { MapCanvas } from './features/Map/MapCanvas';
import { MapOverlay } from './features/Map/MapOverlay';
import { AlliancePanel } from './features/AllianceManager/AlliancePanel';
import { NavPanel } from './features/Navigation/NavPanel';
import { ManagementPanel } from './features/GroupedPanels/ManagementPanel';
import { ToolsPanel } from './features/GroupedPanels/ToolsPanel';
import { SettingsPanel } from './features/Settings/SettingsPanel';
import { PlayerPanel } from './features/PlayerManager/PlayerPanel';
import { EditPlayerModal } from './features/PlayerManager/EditPlayerModal';
import { BuildPanel } from './features/Build/BuildPanel';
import { useAssetStore } from './state/useAssetStore';
import { usePerfStore } from './state/usePerfStore';

function PerfOverlay() {
  const { enabled, lastFrameMs, fps, avgFps, timings } = usePerfStore();
  if (!enabled) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        background: 'rgba(0,0,0,0.65)',
        padding: '6px 10px',
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#e8e8e8',
        lineHeight: 1.3,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div>
        <strong>Perf (F8)</strong>
      </div>
      <div>
        FPS: {fps.toFixed(1)} (avg {avgFps.toFixed(1)})
      </div>
      <div>Frame: {lastFrameMs.toFixed(2)} ms</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          gap: '2px 8px',
          marginTop: 4,
        }}
      >
        <span>territory</span>
        <span>{timings.territory.toFixed(2)}</span>
        <span>objects</span>
        <span>{timings.objects.toFixed(2)}</span>
        <span>sprites</span>
        <span>{timings.sprites.toFixed(2)}</span>
        <span>ghost</span>
        <span>{timings.ghost.toFixed(2)}</span>
        <span>other</span>
        <span>{timings.other.toFixed(2)}</span>
      </div>
    </div>
  );
}

function App() {
  // Trigger asset loading on startup
  const { isLoading, error } = useAssetStore();
  useEffect(() => {
    useAssetStore.getState().loadAssets();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        usePerfStore.getState().toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <main>
      {isLoading && <div className="loading-overlay">Loading assets…</div>}
      {error && <div className="error-overlay">{error}</div>}
      <MapCanvas />
      <MapOverlay />
      {/* --- ALL UI PANELS --- */}
      <AlliancePanel />
      <NavPanel />
      <SettingsPanel />
      <PlayerPanel />
      <BuildPanel />
      <ManagementPanel />
      <ToolsPanel />
      <BottomToolbar />
      <EditPlayerModal />
      <PerfOverlay />
    </main>
  );
}

export default App;
