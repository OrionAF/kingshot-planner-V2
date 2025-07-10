// src/features/Map/MapCanvas.tsx

import { useEffect, useRef } from 'react'
import { useAnimationLoop } from '../../hooks/useAnimationLoop'
import { createInputHandlers } from '../../hooks/useInputControls'
import styles from './MapCanvas.module.css'
import { WebGLRenderer } from '../../core/WebGLRenderer'

type Renderer = WebGLRenderer

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)

  // Custom hook that runs the provided callback on every animation frame.
  useAnimationLoop(() => {
    rendererRef.current?.renderFrame()
  })

  // This effect runs once when the component mounts to set up the canvas and listeners.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('webgl', { antialias: true })
    if (!context) {
      console.error('This browser does not support WebGL.')
      return
    }

    // Initialize our WebGL renderer with the context.
    rendererRef.current = new WebGLRenderer(context)

    // Create all our event handler functions, passing in the canvas element.
    const {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleMouseLeave,
      handleWheel,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleKeyDown,
      handleContextMenu, // Get the new right-click handler
    } = createInputHandlers(canvas)

    // --- Attach all event listeners ---
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove) // Listen on window for dragging off-canvas
    window.addEventListener('mouseup', handleMouseUp) // Listen on window for releasing off-canvas
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('wheel', handleWheel, { passive: false }) // passive:false to allow preventDefault
    canvas.addEventListener('contextmenu', handleContextMenu) // Attach the right-click listener
    window.addEventListener('keydown', handleKeyDown) // Attach the keyboard listener to the window

    // Touch Listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    // --- Canvas Resize Handler ---
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // We can also notify the renderer of the resize if needed in the future
    }
    resizeCanvas() // Initial resize
    window.addEventListener('resize', resizeCanvas)

    // --- Cleanup Function ---
    // This function runs when the component is unmounted to prevent memory leaks.
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyDown)

      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)

      window.removeEventListener('resize', resizeCanvas)
    }
  }, []) // The empty dependency array ensures this effect runs only once.

  return <canvas ref={canvasRef} className={styles.canvas} id="map" />
}
