// Simple namespaced monotonic ID generator to avoid collisions and reuse.
// Each domain (alliance, building, player) has its own counter. Counters only ever move forward.
interface Counters {
  alliance: number;
  building: number;
  player: number;
  bookmark: number;
}
const counters: Counters = { alliance: 1, building: 1, player: 1, bookmark: 1 };

export function generateId(namespace: keyof Counters): number {
  return counters[namespace]++;
}

// Seed counters by ensuring next value exceeds provided min (per namespace)
export function seedIdCounters(
  seeds: Partial<Record<keyof Counters, number>>,
): void {
  for (const key of Object.keys(seeds) as (keyof Counters)[]) {
    const val = seeds[key];
    if (Number.isFinite(val) && (val as number) > counters[key]) {
      counters[key] = Math.floor(val as number);
    }
  }
}

// Expose for diagnostics/testing
export function peekCounters(): Counters {
  return { ...counters };
}
