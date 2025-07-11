// src/App.tsx

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
import { BuildPanel } from './features/Build/BuildPanel'; // 1. IMPORT THE NEW PANEL

function App() {
  return (
    <main>
      <MapCanvas />
      <MapOverlay />
      {/* --- ALL UI PANELS --- */}
      <AlliancePanel />
      <NavPanel />
      <SettingsPanel />
      <PlayerPanel />
      <BuildPanel /> {/* 2. ADD THE BUILD PANEL */}
      <ManagementPanel />
      <ToolsPanel />
      <BottomToolbar />
      <EditPlayerModal />
    </main>
  );
}

export default App;
