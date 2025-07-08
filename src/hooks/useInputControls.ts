import { useCameraStore } from '../state/useCameraStore'
import { screenToWorld } from '../core/coordinate-utils'

export function createInputHandlers() {
  const { panBy, setScale } = useCameraStore.getState()

  let isDragging = false
  let lastPos = { x: 0, y: 0 }
  let clickStartPos = { x: 0, y: 0 }

  const handleMouseDown = (e: MouseEvent) => {
    clickStartPos = { x: e.clientX, y: e.clientY }
    isDragging = true
    lastPos = { x: e.clientX, y: e.clientY }
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
      const camera = useCameraStore.getState()
      // Call the utility function directly. No renderer needed!
      const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera)

      // (Selection logic is temporarily disabled as we don't draw it in WebGL yet)
      console.log(
        `WebGL Click at: ${Math.round(worldX)}, ${Math.round(worldY)}`
      )
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

  return { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel }
}
