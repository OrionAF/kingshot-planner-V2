import { useEffect, useRef } from 'react'
import styles from './MapCanvas.module.css'

// This defines the props (properties) our component can accept.
// For now, it doesn't need any.
interface MapCanvasProps {}

export function MapCanvas({}: MapCanvasProps) {
  // Create a ref. It's like a box that will hold our canvas element
  // once it's created. We start it with `null` (empty).
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // This `useEffect` hook runs after the component is added to the page.
  // It will run again if the browser window is resized.
  useEffect(() => {
    const canvas = canvasRef.current
    // If the canvas element doesn't exist yet, do nothing.
    if (!canvas) {
      return
    }

    const resizeCanvas = () => {
      // Set the canvas's internal drawing resolution to match its
      // display size on the screen. This is crucial for sharp graphics.
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // We will add drawing logic here later!
      console.log(`Canvas resized to: ${canvas.width} x ${canvas.height}`)
    }

    // Run it once immediately to set the initial size.
    resizeCanvas()

    // Tell the browser to run our resizeCanvas function whenever
    // the window is resized.
    window.addEventListener('resize', resizeCanvas)

    // This is a "cleanup" function. React runs this when the
    // component is removed, preventing memory leaks.
    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, []) // The empty array `[]` means this setup code runs only once.

  return <canvas ref={canvasRef} className={styles.canvas} id="map" />
}
