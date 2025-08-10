// src/config/appConfig.ts

export interface BuildingDefinition {
  /** Display name */
  name: string;
  /** Footprint width (tiles) */
  w: number;
  /** Footprint height (tiles) */
  h: number;
  /** Square coverage size (tiles) used for territory influence */
  coverage: number;
  /** Placement biome / rule constraint */
  rule: 'any' | 'claimed' | 'territory' | 'fertile' | 'plains' | 'badlands';
  /** Maximum allowed per alliance (Infinity if omitted) */
  limit?: number;
  /** High-level category used for filtering (Overwatch, minimap legend, etc.) */
  category?:
    | 'infrastructure'
    | 'hq'
    | 'trap'
    | 'prestige'
    | 'tower'
    | 'statue'
    | 'special'
    | 'other';
  /** Arbitrary tags ( biome, rarity, strategic, etc. ) */
  tags?: string[];
}

export const AppConfig = {
  CURRENT_VERSION: '0.0.1.0',
  enableDevMode: true,
  N: 1200,
  tileW: 10,
  tileH: 10,
  strokeW: 0.3,
  brdCol: '#000',
  textColor: '#fff',
  textColorAlt: 'rgba(0, 0, 0, 0.65)',
  maxPct: 250,
  selectionColor: '#ff0',
  pingColor: '#fff',
  pingDuration: 500,
  baseScale: 0.4,
  camera: {
    minScale: 0.05,
    maxScale: 20,
  },
  player: {
    width: 2,
    height: 2,
  },

  // --- NEW CONFIG SECTION ---
  interactions: {
    GHOST_FLICKER_PERIOD_MS: 1000, // Time in milliseconds for one full pulse
  },

  BUILDING_CATALOG: {
    alliance_tower: {
      name: 'Alliance Tower',
      w: 1,
      h: 1,
      coverage: 7,
      rule: 'territory',
      limit: 9999,
      category: 'tower',
      tags: ['territory', 'influence'],
    },
    hq_badlands: {
      name: 'Badlands HQ',
      w: 3,
      h: 3,
      coverage: 15,
      rule: 'badlands',
      limit: 1,
      category: 'hq',
      tags: ['biome:badlands'],
    },
    hq_plains: {
      name: 'Plains HQ',
      w: 3,
      h: 3,
      coverage: 15,
      rule: 'plains',
      limit: 1,
      category: 'hq',
      tags: ['biome:plains'],
    },
    pitfall: {
      name: 'Pitfall Trap',
      w: 3,
      h: 3,
      coverage: 0,
      rule: 'claimed',
      limit: 1,
      category: 'trap',
      tags: ['defense'],
    },
    statue1: {
      name: 'Prestige Statue 1',
      w: 2,
      h: 2,
      coverage: 0,
      rule: 'claimed',
      limit: 1,
      category: 'statue',
      tags: ['prestige'],
    },
    statue2: {
      name: 'Prestige Statue 2',
      w: 2,
      h: 2,
      coverage: 0,
      rule: 'claimed',
      limit: 1,
      category: 'statue',
      tags: ['prestige'],
    },
    statue3: {
      name: 'Prestige Statue 3',
      w: 2,
      h: 2,
      coverage: 0,
      rule: 'claimed',
      limit: 1,
      category: 'statue',
      tags: ['prestige'],
    },
  } satisfies Record<string, BuildingDefinition>,

  infoBannerThreshold: 50,
  imageBreakpoints: {
    highZoom: 80,
    midZoom: 25,
    lowZoom: 10,
    imageRenderThreshold: 4.5,
  },
  biomeColors: {
    fertile: 'rgb(109, 159, 62)',
    plains: 'rgb(158, 180, 103)',
    badlands: 'rgb(191, 208, 152)',
    ruins: 'rgb(120, 108, 92)',
    forbidden: 'rgb(80, 80, 80)',
    unoccupiable: 'rgb(30, 30, 30)',
  },
  biomeRegions: {
    fertile: { x1: 450, y1: 450, x2: 749, y2: 749 },
    plains: { x1: 300, y1: 300, x2: 899, y2: 899 },
    badlands: { x1: 0, y1: 0, x2: 1199, y2: 1199 },
  },
  ALLIANCE_RSS_STYLES: {
    wood: {
      dpName: 'Wood',
      fillCol: 'rgba(139,69,19,1)',
      brdCol: 'rgba(111,55,15,1)',
    },
    food: {
      dpName: 'Food',
      fillCol: 'rgba(255,165,0,1)',
      brdCol: 'rgba(204,132,0,1)',
    },
    stone: {
      dpName: 'Stone',
      fillCol: 'rgba(128,128,128,1)',
      brdCol: 'rgba(102,102,102,1)',
    },
    iron: {
      dpName: 'Iron',
      fillCol: 'rgba(192,192,192,1)',
      brdCol: 'rgba(153,153,153,1)',
    },
  },
  minimap: {
    width: 350,
    height: 300,
    padding: 5,
    bgColor: 'rgba(40,40,40,0.8)',
    viewportfillCol: 'rgba(255, 255, 255, 0.2)',
    viewportbrdCol: 'rgba(255, 255, 255, 0.85)',
    kingCastleColor: 'rgba(255,215,0,0.9)',
    fortressColor: 'rgba(178,34,34,1)',
    sanctuaryColor: 'rgba(65,105,225,1)',
    buildersGuildOutpostColor: 'rgba(0, 206, 209, 1)',
    foragerGroveOutpostColor: 'rgba(50, 205, 50, 1)',
    harvestAltarOutpostColor: 'rgba(255, 0, 255, 1)',
    scholarsTowerOutpostColor: 'rgba(138, 43, 226, 1)',
    arsenalOutpostColor: 'rgba(255, 0, 0, 1)',
    armoryOutpostColor: 'rgba(0, 128, 128, 1)',
    drillCampOutpostColor: 'rgba(135, 206, 235, 1)',
    frontierLodgeOutpostColor: 'rgba(128, 128, 0, 1)',
    zoomFactorMin: 1.2,
    zoomFactorMax: 15.0,
    mainMapZoomThresholdForMinimapZoom: 0.03,
  },
  webgl: {
    gridThickness: 1,
    gridDarkness: 0.95,
  },
  // Curated distinct alliance color palette (used for auto-assignment / fallback)
  ALLIANCE_COLOR_PALETTE: [
    '#e6194b', // vivid red
    '#3cb44b', // bright green
    '#0082c8', // bright blue
    '#f58231', // vivid orange
    '#911eb4', // vivid purple
    '#46f0f0', // cyan
    '#f032e6', // magenta
    '#d2f53c', // bright lime
    '#fabebe', // light pink
    '#aa6e28', // brown
    '#800000', // maroon
    '#000080', // navy
    '#ff7f50', // coral
    '#ff4500', // orange-red
    '#ff1493', // deep pink
    '#ff69b4', // hot pink
    '#ba55d3', // medium orchid
    '#4b0082', // indigo
    '#6a5acd', // slate blue
    '#4169e1', // royal blue
    '#1e90ff', // dodger blue
    '#00bfff', // deep sky blue
    '#00ced1', // dark turquoise
    '#20b2aa', // light sea green
    '#40e0d0', // turquoise
    '#00ff7f', // spring green
    '#7fff00', // chartreuse
    '#adff2f', // green yellow
    '#ffd700', // gold
    '#ff8c00', // dark orange
    '#ff6347', // tomato
    '#dc143c', // crimson
    '#b22222', // firebrick
    '#8b0000', // dark red
    '#9932cc', // dark orchid
    '#8a2be2', // blue violet
    '#9370db', // medium purple
    '#ff00ff', // fuchsia
    '#ffb6c1', // light pink
    '#ffdab9', // peach puff
    '#f0e68c', // khaki
  ],
  allianceColorConstraints: {
    minColorDistance: 0.28, // Euclidean RGB distance (0-1) required vs existing & biomes
    minLuminanceDiff: 0.12, // Minimum luminance separation vs biome fills
    maxAttempts: 14, // Attempts to adjust before falling back to unused palette entry
  },
};
