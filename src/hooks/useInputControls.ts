import { useCameraStore } from '../state/useCameraStore'
import { useSelectionStore } from '../state/useSelectionStore'
import { type CanvasRenderer } from '../core/CanvasRenderer'
import { useMapStore } from '../state/useMapStore'

/**
 * This is no longer a traditional "hook" that uses useEffect. It's now a
 * helper function that generates the event handler functions for our canvas.
 * This gives the component more control over when to attach them.
 */
export function createInputHandlers(
  rendererRef: React.RefObject<CanvasRenderer | null>
) {
  // Get actions from our stores.
  const { panBy, setScale } = useCameraStore.getState()
  const { setSelection } = useSelectionStore.getState()

  // Keep track of drag state.
  let isDragging = false
  let lastPos = { x: 0, y: 0 }
  let clickStartPos = { x: 0, y: 0 }

  // --- Define the event handlers ---

  const handleMouseDown = (e: MouseEvent) => {
    clickStartPos = { x: e.clientX, y: e.clientY }
    isDragging = true
    lastPos = { x: e.clientX, y: e.clientY }
    // We now have to get the canvas element from the event itself.
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - lastPos.x
    const dy = e.clientY - lastPos.y
    panBy(dx, dy)
    lastPos = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = (e: MouseEvent) => {
    const dist = Math.hypot(
      e.clientX - clickStartPos.x,
      e.clientY - clickStartPos.y
    )

    if (dist < 5) {
      const renderer = rendererRef.current
      const camera = useCameraStore.getState()
      const { buildingMap } = useMapStore.getState()

      if (renderer) {
        const [worldX, worldY] = renderer.screenToWorld(
          e.clientX,
          e.clientY,
          camera
        )
        const tileX = Math.round(worldX)
        const tileY = Math.round(worldY)

        // First, check if there's a building at the clicked coordinate.
        const clickedBuilding = buildingMap.get(`${tileX},${tileY}`)

        if (clickedBuilding) {
          // If we found a building, select it!
          setSelection({ type: 'building', data: clickedBuilding })
        } else {
          // Otherwise, just select the single tile.
          setSelection({ type: 'tile', data: { x: tileX, y: tileY } })
        }
      }
    }

    isDragging = false
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.cursor = 'grab'
    }
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const currentScale = useCameraStore.getState().scale
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    setScale(currentScale * zoomFactor)
  }

  // Return all the functions so the component can use them.
  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  }
}
