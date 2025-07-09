import { useCameraStore } from '../state/useCameraStore'
import { screenToWorld, worldToScreen } from '../core/coordinate-utils'

/**
 * Creates all the event handlers for map interaction, now with
 * advanced zoom-to-cursor for mouse and zoom-to-pinch-center for touch.
 */
export function createInputHandlers() {
  // We only need our new powerful action here.
  const { panBy, zoomTo } = useCameraStore.getState()

  let isPointerDown = false
  let lastPanPos = { x: 0, y: 0 }
  let clickStartPos = { x: 0, y: 0 }
  let lastPinchDist = 0

  // === MOUSE HANDLERS ===

  const handleMouseDown = (e: MouseEvent) => {
    isPointerDown = true
    clickStartPos = { x: e.clientX, y: e.clientY }
    lastPanPos = { x: e.clientX, y: e.clientY }
    if (e.currentTarget instanceof HTMLElement)
      e.currentTarget.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isPointerDown) return
    panBy(e.clientX - lastPanPos.x, e.clientY - lastPanPos.y)
    lastPanPos = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = (e: MouseEvent) => {
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
    if (e.currentTarget instanceof HTMLElement)
      e.currentTarget.style.cursor = 'grab'
  }

  const handleMouseLeave = (e: MouseEvent) => {
    isPointerDown = false
    if (e.currentTarget instanceof HTMLElement)
      e.currentTarget.style.cursor = 'grab'
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const cameraBeforeZoom = useCameraStore.getState()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    const newScale = cameraBeforeZoom.scale * zoomFactor

    // Use the mouse position (e.clientX, e.clientY) as the focal point.
    const focalPoint = { x: e.clientX, y: e.clientY }

    // 1. Find which world coordinate is under the focal point right now.
    const [worldX, worldY] = screenToWorld(
      focalPoint.x,
      focalPoint.y,
      cameraBeforeZoom
    )

    // 2. Find where that world coordinate will appear on screen AFTER we zoom.
    const [screenXAfter, screenYAfter] = worldToScreen(worldX, worldY)

    // 3. Pan the camera to move that new screen point back to the focal point.
    const newCamX = focalPoint.x - screenXAfter * newScale
    const newCamY = focalPoint.y - screenYAfter * newScale

    zoomTo({ x: newCamX, y: newCamY, scale: newScale })
  }

  // === TOUCH HANDLERS (Now with Pinch-to-Center-Zoom) ===

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      lastPanPos = { x: touch.clientX, y: touch.clientY }
    } else if (e.touches.length >= 2) {
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
      const touch = e.touches[0]
      const dx = touch.clientX - lastPanPos.x
      const dy = touch.clientY - lastPanPos.y
      panBy(dx, dy)
      lastPanPos = { x: touch.clientX, y: touch.clientY }
    } else if (e.touches.length >= 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      // Use the center point between the two fingers as the focal point
      const focalPoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      }

      const cameraBeforeZoom = useCameraStore.getState()
      const newDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      )

      if (lastPinchDist > 0) {
        const zoomFactor = newDist / lastPinchDist
        const newScale = cameraBeforeZoom.scale * zoomFactor

        const [worldX, worldY] = screenToWorld(
          focalPoint.x,
          focalPoint.y,
          cameraBeforeZoom
        )
        const [screenXAfter, screenYAfter] = worldToScreen(worldX, worldY)

        const newCamX = focalPoint.x - screenXAfter * newScale
        const newCamY = focalPoint.y - screenYAfter * newScale

        zoomTo({ x: newCamX, y: newCamY, scale: newScale })
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
