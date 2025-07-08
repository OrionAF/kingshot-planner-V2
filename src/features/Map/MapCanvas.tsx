import { useEffect, useRef } from 'react'
import { CanvasRenderer } from '../../core/CanvasRenderer'
import { useAnimationLoop } from '../../hooks/useAnimationLoop'
import { createInputHandlers } from '../../hooks/useInputControls' // Renamed function
import styles from './MapCanvas.module.css'

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)

  // This is now just for animation.
  useAnimationLoop(() => {
    rendererRef.current?.renderFrame()
  })

  // This `useEffect` is now the single place for all canvas-related setup.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // 1. Create the renderer.
    rendererRef.current = new CanvasRenderer(context)

    // 2. Create the input handlers, passing the renderer ref.
    const { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel } =
      createInputHandlers(rendererRef)

    // 3. Attach all the listeners.
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp) // Attach to canvas
    canvas.addEventListener('wheel', handleWheel)

    // 4. Handle resize.
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 5. Cleanup function to remove ALL listeners.
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, []) // This effect runs only once, which is correct.

  return <canvas ref={canvasRef} className={styles.canvas} id="map" />
}
