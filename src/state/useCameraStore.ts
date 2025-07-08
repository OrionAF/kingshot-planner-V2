import { create } from 'zustand'

interface CameraState {
  x: number
  y: number
  scale: number
}

interface CameraActions {
  panBy: (dx: number, dy: number) => void
  panTo: (x: number, y: number) => void // We will use this action
  setScale: (newScale: number) => void
}

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

  // This is the direct action we will call from our component
  panTo: (x, y) => set(() => ({ x, y })),

  setScale: (newScale) => set(() => ({ scale: newScale })),
}))
