import { useEffect, useRef } from 'react';

export function useAnimationLoop(callback: (time: number) => void) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let frameId: number;

    const loop = (time: number) => {
      callbackRef.current(time);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);
}
