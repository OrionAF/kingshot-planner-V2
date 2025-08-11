// src/state/usePerfStore.ts
// Lightweight performance instrumentation store (disabled by default)
// Collects per-frame timings for major render phases when enabled.

import { create } from 'zustand';

interface PhaseTimings {
  territory: number;
  objects: number;
  sprites: number;
  ghost: number;
  other: number; // total - sum(phases)
}

interface PerfState {
  enabled: boolean;
  lastFrameMs: number;
  fps: number;
  avgFps: number;
  timings: PhaseTimings;
  _frameHistory: number[]; // for rolling FPS average
}

interface PerfActions {
  toggle: () => void;
  record: (data: {
    lastFrameMs: number;
    phases: Omit<PhaseTimings, 'other'>;
  }) => void;
}

export const usePerfStore = create<PerfState & PerfActions>((set, get) => ({
  enabled: false,
  lastFrameMs: 0,
  fps: 0,
  avgFps: 0,
  timings: { territory: 0, objects: 0, sprites: 0, ghost: 0, other: 0 },
  _frameHistory: [],

  toggle: () => set((s) => ({ enabled: !s.enabled })),
  record: ({ lastFrameMs, phases }) => {
    const prev = get();
    const fps = lastFrameMs > 0 ? 1000 / lastFrameMs : 0;
    const history = [...prev._frameHistory, fps];
    if (history.length > 60) history.shift();
    const avgFps = history.reduce((a, b) => a + b, 0) / history.length || 0;
    const other = Math.max(
      0,
      lastFrameMs -
        (phases.territory + phases.objects + phases.sprites + phases.ghost),
    );
    set({
      lastFrameMs,
      fps,
      avgFps,
      timings: { ...phases, other },
      _frameHistory: history,
    });
  },
}));

// Helper for conditional instrumentation inside hot loops
export function withPhase<T>(
  enabled: boolean,
  fn: () => T,
): { result: T; ms: number } {
  if (!enabled) return { result: fn(), ms: 0 };
  const t0 = performance.now();
  const result = fn();
  return { result, ms: performance.now() - t0 };
}
