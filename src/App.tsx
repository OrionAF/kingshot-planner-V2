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
import { useAssetStore } from './state/useAssetStore'; // <-- 1. Import the asset store

function App() {
  // 2. Trigger asset loading on application startup
  useEffect(() => {
    useAssetStore.getState().loadAssets();
  }, []);

  return (
    <main>
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
    </main>
  );
}

export default App;
