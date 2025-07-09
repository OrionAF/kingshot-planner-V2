export const AppConfig = {
  CURRENT_VERSION: '0.0.0.1',
  enableDevMode: false,
  N: 1200,
  tileW: 10,
  tileH: 10,
  strokeW: 0.3,
  borderColor: '#000',
  textColor: '#fff',
  textColorAlt: 'rgba(0, 0, 0, 0.65)',
  maxPct: 250,
  selectionColor: '#ff0',
  pingColor: '#fff',
  pingDuration: 500,
  baseScale: 5,

  // Add this new section for player configuration
  player: {
    width: 2,
    height: 2,
  },

  infoBannerThreshold: 50, // How many tiles away from center to show info banner
  imageBreakpoints: {
    highZoom: 80, // % zoom level to use base imageScale
    midZoom: 25, // % zoom level to use imageScaleBreakpoint_1
    lowZoom: 10, // % zoom level to use imageScaleBreakpoint_2
    imageRenderThreshold: 4.5, // % zoom level to start rendering images
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
    fertile: { x1: 480, y1: 480, x2: 719, y2: 719 },
    plains: { x1: 320, y1: 320, x2: 879, y2: 879 },
    badlands: { x1: 0, y1: 0, x2: 1199, y2: 1199 },
  },
  ALLIANCE_RSS_STYLES: {
    wood: {
      displayName: 'Wood',
      fillColor: 'rgba(139,69,19,1)',
      borderColor: 'rgba(111,55,15,1)',
    },
    food: {
      displayName: 'Food',
      fillColor: 'rgba(255,165,0,1)',
      borderColor: 'rgba(204,132,0,1)',
    },
    stone: {
      displayName: 'Stone',
      fillColor: 'rgba(128,128,128,1)',
      borderColor: 'rgba(102,102,102,1)',
    },
    iron: {
      displayName: 'Iron',
      fillColor: 'rgba(192,192,192,1)',
      borderColor: 'rgba(153,153,153,1)',
    },
  },
  minimap: {
    width: 350,
    height: 300,
    padding: 5,
    bgColor: 'rgba(40,40,40,0.8)',
    viewportFillColor: 'rgba(255, 255, 255, 0.2)',
    viewportBorderColor: 'rgba(255, 255, 255, 0.85)',
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
    gridThickness: 1, // A value of 1.0 is ~1 pixel. >1 is thicker, <1 is thinner.
    gridDarkness: 0.95, // 1.0 is invisible, 0.0 is black. 0.9 is a good default.
  },
}
