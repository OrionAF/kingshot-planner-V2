// Central mapping of placement failure reason codes to colors
// Keeps UI (overlay text) and WebGL ghost tint consistent.
export const PLACEMENT_REASON_COLOR: Record<string, string> = {
  OUT_OF_BOUNDS: '#dc3545',
  COLLIDES_BASE: '#dc3545',
  COLLIDES_USER: '#d9534f',
  COLLIDES_PLAYER: '#ff6b6b',
  TERRITORY_REQUIRED: '#ff9800',
  BIOME_MISMATCH: '#ffb347',
  LIMIT_REACHED: '#9c27b0',
  TERRITORY_RULE_UNMET: '#ff7043',
  FOREIGN_TERRITORY: '#ff1744',
};

export function getPlacementReasonColor(code: string | undefined): string {
  if (!code) return '#dc3545';
  return PLACEMENT_REASON_COLOR[code] || '#dc3545';
}
