// src/hooks/useInputControls.ts

import { useCameraStore } from '../state/useCameraStore'
import { screenToWorld, worldToScreen } from '../core/coordinate-utils'
import { useUiStore } from '../state/useUiStore'
import { useMapStore } from '../state/useMapStore'
import { AppConfig } from '../config/appConfig'

/**
 * Creates all the event handlers for map interaction, connecting them
 * to our state stores for player placement and other interactions.
 */
export function createInputHandlers(canvas: HTMLCanvasElement) {
  const { panBy, zoomTo } = useCameraStore.getState()

  let isPointerDown = false
  let lastPanPos = { x: 0, y: 0 }
  let clickStartPos = { x: 0, y: 0 }
  let lastPinchDist = 0

  const handleMouseDown = (e: MouseEvent) => {
    isPointerDown = true
    clickStartPos = { x: e.clientX, y: e.clientY }
    lastPanPos = { x: e.clientX, y: e.clientY }
    canvas.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e: MouseEvent) => {
    const camera = useCameraStore.getState()
    const { isPlacingPlayer, setMouseWorldPosition, setPlacementValidity } =
      useUiStore.getState()
    const { checkPlacementValidity } = useMapStore.getState()

    const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera)
    const roundedX = Math.round(worldX)
    const roundedY = Math.round(worldY)

    setMouseWorldPosition({ x: roundedX, y: roundedY })

    // If we're in placement mode, run a validity check on every move
    if (isPlacingPlayer) {
      const isValid = checkPlacementValidity(
        roundedX,
        roundedY,
        AppConfig.player.width,
        AppConfig.player.height
      )
      setPlacementValidity(isValid)
    }

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
        // --- This was a click, not a drag ---
        const camera = useCameraStore.getState()
        const {
          isPlacingPlayer,
          playerToPlace,
          isValidPlacement,
          endPlayerPlacement,
        } = useUiStore.getState()
        const { placePlayer } = useMapStore.getState()

        const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera)
        const roundedX = Math.round(worldX)
        const roundedY = Math.round(worldY)

        if (isPlacingPlayer && playerToPlace) {
          // Only place the player if the final position is valid
          if (isValidPlacement) {
            placePlayer(playerToPlace, roundedX, roundedY)
          }
          endPlayerPlacement()
        } else {
          console.log(`Click at: ${roundedX}, ${roundedY}`)
        }
      }
    }
    isPointerDown = false
    canvas.style.cursor = 'grab'
  }

  // Other handlers (handleMouseLeave, handleWheel, touch handlers) remain the same.
  const handleMouseLeave = () => {
    isPointerDown = false
    canvas.style.cursor = 'grab'
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const cameraBeforeZoom = useCameraStore.getState()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    const newScale = cameraBeforeZoom.scale * zoomFactor
    const focalPoint = { x: e.clientX, y: e.clientY }
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
      // Update placement validity when panning on mobile
      const { isPlacingPlayer, setPlacementValidity } = useUiStore.getState()
      if (isPlacingPlayer) {
        const camera = useCameraStore.getState()
        const { checkPlacementValidity } = useMapStore.getState()
        const [worldX, worldY] = screenToWorld(
          window.innerWidth / 2,
          window.innerHeight / 2,
          camera
        )
        const isValid = checkPlacementValidity(
          Math.round(worldX),
          Math.round(worldY),
          AppConfig.player.width,
          AppConfig.player.height
        )
        setPlacementValidity(isValid)
      }
    } else if (e.touches.length >= 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
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

        // Update placement validity when pinching to zoom
        const { isPlacingPlayer, setPlacementValidity } = useUiStore.getState()
        if (isPlacingPlayer) {
          const camera = useCameraStore.getState()
          const { checkPlacementValidity } = useMapStore.getState()
          const [centerX, centerY] = screenToWorld(
            window.innerWidth / 2,
            window.innerHeight / 2,
            camera
          )
          const isValid = checkPlacementValidity(
            Math.round(centerX),
            Math.round(centerY),
            AppConfig.player.width,
            AppConfig.player.height
          )
          setPlacementValidity(isValid)
        }
      }
      lastPinchDist = newDist
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      lastPanPos = { x: touch.clientX, y: touch.clientY }
    }
    if (e.touches.length < 2) {
      lastPinchDist = 0
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
    handleTouchEnd,
  }
}
