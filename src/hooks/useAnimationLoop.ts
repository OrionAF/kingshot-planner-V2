import { useEffect, useRef } from 'react';

// The hook takes one argument: a "callback" function that will be
// executed on every single animation frame.
export function useAnimationLoop(callback: (time: number) => void) {
  // We use a ref to hold the callback function. This ensures that
  // even if the component re-renders with a new callback, our loop
  // always has the latest version without needing to restart.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // This is the core animation loop logic.
  useEffect(() => {
    let frameId: number;

    const loop = (time: number) => {
      // On each frame, call the latest version of the callback
      // that our component has provided.
      callbackRef.current(time);

      // Request the next animation frame, creating the loop.
      frameId = requestAnimationFrame(loop);
    };

    // Start the loop.
    frameId = requestAnimationFrame(loop);

    // The "cleanup" function that runs when the component is removed.
    // This is crucial to stop the loop and prevent memory leaks.
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []); // The empty array `[]` ensures this setup runs only once.
}
