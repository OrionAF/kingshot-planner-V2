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
    bear_trap: {
      name: 'Bear Trap',
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
    // Target world coverage at main map's MAX zoom.
    // Accepts either:
    // - a fraction in [0,1], e.g. 0.25 for 25%
    // - a percentage in (1,100], e.g. 25 for 25%
    // When fractionMode === 'area', the value represents area coverage; it is converted to linear via sqrt.
    // When the main map is fully zoomed out, minimap shows 100% of world. Interpolates per easing.
    maxWorldFractionAtMaxZoom: 0.25,
    // Interpretation of maxWorldFractionAtMaxZoom: 'linear' (width/height fraction) or 'area' (surface coverage)
    fractionMode: 'linear' as 'linear' | 'area',
    // Target logical width (in css px) the minimap content is designed for before scaling to panel.
    logicalTargetWidth: 240,
    // Supersample factor for biome raster (higher = sharper, more cost).
    supersample: 2,
    // Drag-follow easing factor (0..1) when panning main map via minimap drag.
    followPanFactor: 0.4,
    // Wheel zoom step multipliers applied to main map when wheel over minimap.
    wheelZoomStepIn: 1.05,
    wheelZoomStepOut: 0.95,
    // Easing configuration for minimap world fraction interpolation.
    easing: {
      // Supported: 'linear', 'easeOutQuad', 'easeInOutCubic', 'log', 'power'
      mode: 'easeOutQuad' as
        | 'linear'
        | 'easeOutQuad'
        | 'easeInOutCubic'
        | 'log'
        | 'power',
      // For 'log' mode: larger base exaggerates low-end detail.
      logBase: 5,
      // For 'power' mode: exponent >1 biases toward low zoom detail.
      exponent: 1.5,
    },
    // Drag activation thresholds to prevent accidental pans while just moving cursor.
    drag: {
      startDistancePx: 8, // movement required before drag engages
      startDelayMs: 40, // minimum hold time before drag can engage
      clickMaxDistancePx: 6, // still considered click if under this total movement
    },
    layout: {
      // mode: 'auto' => (mapW, mapH) = (round(screenW/autoDivisor), round(screenH/autoDivisor))
      // mode: 'fixed' => uses logicalTargetWidth with height derived from world aspect
      mode: 'auto' as 'auto' | 'fixed',
      autoDivisor: 5.5,
      // Internal pixel density multiplier (1 = CSS pixels, 2 = render at 2x then downscale for sharpness)
      pixelDensity:
        typeof window !== 'undefined' && window.devicePixelRatio
          ? Math.min(2, window.devicePixelRatio)
          : 1,
    },
  },
  webgl: {
    gridThickness: 1,
    gridDarkness: 0.95,
  },
  territory: {
    border: {
      insetPrimary: 0,
      thickness: 0.03, // thickness in tile units for quad borders
      avoidDoubleDraw: false, // when true only lower-id alliance draws shared edge
    },
  },
  // Curated distinct alliance color palette (used for auto-assignment / fallback)
  ALLIANCE_COLOR_PALETTE: [
    '#d6685c',
    '#f25d0d',
    '#d6be5c',
    '#91d926',
    '#1fad8a',
    '#19a8e6',
    '#a675f0',
    '#9129a3',
    '#e08e85',
    '#d6875c',
    '#c2a60a',
    '#87d65c',
    '#2972a3',
    '#5a29a3',
    '#c45cd6',
    '#f20d46',
    '#c2540a',
    '#c4d65c',
    '#3bf20d',
    '#2688d9',
    '#d385e0',
    '#e0b285',
    '#97b814',
    '#14b856',
    '#295aa3',
    '#f066ff',
    '#a37829',
    '#29a360',
    '#85a5e0',
    '#c20ac2',
    '#0df280',
    '#0a38c2',
    '#f20dc4',
    '#26d991',
    '#0d46f2',
    '#b81497',
    '#52e0b6',
    '#8589e0',
    '#ff66d9',
    '#1919e6',
    '#f20da2',
    '#8566ff',
    '#a32978',
    '#d65cab',
    '#e085b7',
    '#cc0070',
    '#ff0073',
    '#a32954',
    '#d65c87',
    '#c20a4a',
  ],
  allianceColorConstraints: {
    minColorDistance: 0.28, // Euclidean RGB distance (0-1) required vs existing & biomes
    minLuminanceDiff: 0.12, // Minimum luminance separation vs biome fills
    maxAttempts: 14, // Attempts to adjust before falling back to unused palette entry
  },
};

/**
 * Segmented configuration groups (Phase 0 theming/config refactor baseline).
 * These wrap existing AppConfig properties without breaking legacy references.
 * Future work can migrate call sites from AppConfig.* to Config.* granular paths.
 */
export const Config = {
  ui: {
    colors: {
      textPrimary: AppConfig.textColor,
      textAlt: AppConfig.textColorAlt,
      selection: AppConfig.selectionColor,
      ping: AppConfig.pingColor,
    },
  },
  interaction: {
    baseScale: AppConfig.baseScale,
    camera: AppConfig.camera,
    ghost: AppConfig.interactions, // ghost placement animation settings
  },
  rendering: {
    tile: { w: AppConfig.tileW, h: AppConfig.tileH },
    webgl: AppConfig.webgl,
    territory: AppConfig.territory,
    biomes: {
      colors: AppConfig.biomeColors,
      regions: AppConfig.biomeRegions,
    },
  },
  data: {
    buildingCatalog: AppConfig.BUILDING_CATALOG,
    alliancePalette: AppConfig.ALLIANCE_COLOR_PALETTE,
  },
  perf: {
    enableDevMode: AppConfig.enableDevMode,
  },
};
