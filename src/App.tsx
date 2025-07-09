// src/App.tsx

import { BottomToolbar } from './features/Toolbar/BottomToolbar'
import { MapCanvas } from './features/Map/MapCanvas'
import { MapOverlay } from './features/Map/MapOverlay'
import { AlliancePanel } from './features/AllianceManager/AlliancePanel'
import { NavPanel } from './features/Navigation/NavPanel'
import { ManagementPanel } from './features/GroupedPanels/ManagementPanel'
import { ToolsPanel } from './features/GroupedPanels/ToolsPanel'
import { SettingsPanel } from './features/Settings/SettingsPanel'
import { PlayerPanel } from './features/PlayerManager/PlayerPanel'
import { EditPlayerModal } from './features/PlayerManager/EditPlayerModal'

function App() {
  return (
    <main>
      <MapCanvas />
      <MapOverlay />

      {/*
        This is the old, conflicting singleton ModalOverlay.
        It is now removed. The EditPlayerModal handles its own overlay.
      */}
      {/* <ModalOverlay />  <-- THIS LINE MUST BE DELETED */}

      {/* --- ALL UI PANELS --- */}
      <AlliancePanel />
      <NavPanel />
      <SettingsPanel />
      <PlayerPanel />
      <ManagementPanel />
      <ToolsPanel />
      <BottomToolbar />

      {/* This component will render the ModalOverlay via the portal when needed */}
      <EditPlayerModal />
    </main>
  )
}

export default App
