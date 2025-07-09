import { create } from 'zustand'

export interface CameraState {
  x: number
  y: number
  scale: number
}

interface CameraActions {
  panBy: (dx: number, dy: number) => void
  // The new powerful action that can pan and zoom in one transaction
  zoomTo: (newCameraState: Partial<CameraState>) => void
}

// Define zoom limits to prevent zooming too far in or out
const MIN_ZOOM = 0.05
const MAX_ZOOM = 20

export const useCameraStore = create<CameraState & CameraActions>((set) => ({
  // === Initial State ===
  x: window.innerWidth / 2,
  y: window.innerHeight / 3,
  scale: 2,

  // === Actions ===
  panBy: (dx, dy) =>
    set((state) => ({
      x: state.x + dx,
      y: state.y + dy,
    })),

  zoomTo: (newCameraState) =>
    set((state) => {
      // Use the incoming scale, but clamp it between our min and max values
      const clampedScale = Math.max(
        MIN_ZOOM,
        Math.min(newCameraState.scale ?? state.scale, MAX_ZOOM)
      )

      return {
        ...state, // Keep existing properties from the current state
        ...newCameraState, // Overwrite with any new properties provided
        scale: clampedScale, // But always use the clamped scale
      }
    }),
}))
