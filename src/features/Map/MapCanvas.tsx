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

  useAnimationLoop(() => {
    rendererRef.current?.renderFrame()
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('webgl', { antialias: true })
    if (!context) {
      console.error('This browser does not support WebGL.')
      return
    }

    rendererRef.current = new WebGLRenderer(context)

    const {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleMouseLeave,
      handleWheel,
      handleTouchStart,
      handleTouchMove,
    } = createInputHandlers(canvas) // Pass it here

    // Attach Mouse listeners
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp) // Listen on window for release
    canvas.addEventListener('mouseleave', handleMouseLeave) // Add this
    canvas.addEventListener('wheel', handleWheel)

    // Attach Touch listeners
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchmove', handleTouchMove)

    // No touchend needed anymore

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      // Cleanup
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave) // Add this
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} id="map" />
}
