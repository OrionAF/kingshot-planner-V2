import { BottomToolbar } from './features/Toolbar/BottomToolbar'
import { MapCanvas } from './features/Map/MapCanvas'
import { MapOverlay } from './features/Map/MapOverlay'
import { AlliancePanel } from './features/AllianceManager/AlliancePanel'
import { NavPanel } from './features/Navigation/NavPanel'

function App() {
  return (
    <main>
      <MapCanvas />
      <MapOverlay />
      <AlliancePanel />
      <NavPanel />
      <BottomToolbar />
    </main>
  )
}

export default App
