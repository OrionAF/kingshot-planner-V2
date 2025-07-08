import { BottomToolbar } from './features/Toolbar/BottomToolbar'
import { MapCanvas } from './features/Map/MapCanvas'
import { MapOverlay } from './features/Map/MapOverlay'
import { AlliancePanel } from './features/AllianceManager/AlliancePanel'
import { NavPanel } from './features/Navigation/NavPanel'
import { SettingsPanel } from './features/Settings/SettingsPanel'

function App() {
  return (
    <main>
      <MapCanvas />
      <MapOverlay />
      <AlliancePanel />
      <NavPanel />
      <SettingsPanel /> {/* Add this */}
      <BottomToolbar />
    </main>
  )
}

export default App
