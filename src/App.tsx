import { BottomToolbar } from './features/Toolbar/BottomToolbar'
import { MapCanvas } from './features/Map/MapCanvas'
import { MapOverlay } from './features/Map/MapOverlay'
import { AlliancePanel } from './features/AllianceManager/AlliancePanel'
import { NavPanel } from './features/Navigation/NavPanel'
import { ManagementPanel } from './features/GroupedPanels/ManagementPanel'
import { ToolsPanel } from './features/GroupedPanels/ToolsPanel'
import { SettingsPanel } from './features/Settings/SettingsPanel'
import { ModalOverlay } from './components/Modal/ModalOverlay'

function App() {
  return (
    <main>
      <MapCanvas />
      <MapOverlay />
      <ModalOverlay />
      {/* --- ALL UI PANELS --- */}
      <AlliancePanel />
      <NavPanel />
      <SettingsPanel />
      <ManagementPanel />
      <ToolsPanel />
      <BottomToolbar />
    </main>
  )
}

export default App
