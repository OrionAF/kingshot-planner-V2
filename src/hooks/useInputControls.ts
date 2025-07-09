import { useCameraStore } from '../state/useCameraStore'
import { screenToWorld } from '../core/coordinate-utils'

/**
 * This factory function creates all the event handlers needed for map interaction.
 * It now supports MOUSE (pan, wheel zoom) and TOUCH (pan, pinch zoom).
 */
export function createInputHandlers() {
  const { panBy, setScale } = useCameraStore.getState()

  // State tracking variables
  let isPointerDown = false
  let lastPanPos = { x: 0, y: 0 }
  let clickStartPos = { x: 0, y: 0 }
  let lastPinchDist = 0

  // === MOUSE EVENT HANDLERS ===

  const handleMouseDown = (e: MouseEvent) => {
    isPointerDown = true
    clickStartPos = { x: e.clientX, y: e.clientY }
    lastPanPos = { x: e.clientX, y: e.clientY }
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isPointerDown) return
    const dx = e.clientX - lastPanPos.x
    const dy = e.clientY - lastPanPos.y
    panBy(dx, dy)
    lastPanPos = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = (e: MouseEvent) => {
    // Only trigger a click if the mouse was actually down
    if (isPointerDown) {
      const dist = Math.hypot(
        e.clientX - clickStartPos.x,
        e.clientY - clickStartPos.y
      )
      if (dist < 5) {
        const camera = useCameraStore.getState()
        const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera)
        console.log(`Click at: ${Math.round(worldX)}, ${Math.round(worldY)}`)
      }
    }
    isPointerDown = false
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = (e: MouseEvent) => {
    isPointerDown = false
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

  // === TOUCH EVENT HANDLERS (New Simplified Logic) ===

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      // Handle start of one-finger pan
      const touch = e.touches[0]
      lastPanPos = { x: touch.clientX, y: touch.clientY }
    } else if (e.touches.length >= 2) {
      // Handle start of two-finger pinch
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      lastPinchDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      )
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      // Is a pan
      const touch = e.touches[0]
      const dx = touch.clientX - lastPanPos.x
      const dy = touch.clientY - lastPanPos.y
      panBy(dx, dy)
      lastPanPos = { x: touch.clientX, y: touch.clientY }
    } else if (e.touches.length >= 2) {
      // Is a pinch-zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const newDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      )

      if (lastPinchDist > 0) {
        // Avoid division by zero on the first frame
        const currentScale = useCameraStore.getState().scale
        const zoomFactor = newDist / lastPinchDist
        setScale(currentScale * zoomFactor)
      }

      lastPinchDist = newDist
    }
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
  }
}
