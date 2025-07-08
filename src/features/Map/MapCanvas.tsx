import { useEffect, useRef } from 'react'
import { useAnimationLoop } from '../../hooks/useAnimationLoop'
import { createInputHandlers } from '../../hooks/useInputControls'
import styles from './MapCanvas.module.css'
import { WebGLRenderer } from '../../core/WebGLRenderer'

// We can clean this up now since we aren't using the CanvasRenderer for now.
type Renderer = WebGLRenderer

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)

  useAnimationLoop(() => {
    rendererRef.current?.renderFrame()
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('webgl')
    if (!context) {
      console.error('This browser does not support WebGL.')
      return
    }

    rendererRef.current = new WebGLRenderer(context)

    // Input handlers are now self-sufficient
    const { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel } =
      createInputHandlers()

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel)

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} id="map" />
}
