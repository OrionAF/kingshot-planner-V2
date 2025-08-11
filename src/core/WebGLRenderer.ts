// src/core/WebGLRenderer.ts

import { AppConfig, Config } from '../config/appConfig';
import { useAssetStore } from '../state/useAssetStore';
import { useCameraStore } from '../state/useCameraStore';
import { useMapStore } from '../state/useMapStore';
import { useSelectionStore } from '../state/useSelectionStore';
import { useUiStore } from '../state/useUiStore';
import { usePerfStore } from '../state/usePerfStore';
import { useOverwatchStore } from '../state/useOverwatchStore';
import type { Alliance, BaseBuilding } from '../types/map.types';
import { layerManager } from './layers';
import { screenToWorld, worldToScreen } from './coordinate-utils';
import {
  mapFragmentShaderSource,
  mapVertexShaderSource,
} from './webgl/map-shaders';
import { createProgramFromSources } from './webgl/webgl-utils';

type Matrix3 = number[];
type DrawableObject = {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  brdCol?: string; // optional border color
};

function parseColor(colorString: string): [number, number, number] {
  if (colorString.startsWith('#')) {
    const r = parseInt(colorString.slice(1, 3), 16) / 255;
    const g = parseInt(colorString.slice(3, 5), 16) / 255;
    const b = parseInt(colorString.slice(5, 7), 16) / 255;
    return [r, g, b];
  } else if (colorString.startsWith('rgb')) {
    const parts = colorString.match(/\d+/g);
    if (parts) {
      return (parts.map(Number) as [number, number, number]).map(
        (c) => c / 255,
      ) as [number, number, number];
    }
  }
  return [0, 0, 0];
}

export class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private mapProgram: WebGLProgram;
  private worldPosAttrLocation: number;
  private texCoordAttrLocation: number;
  private projectionUniformLocation: WebGLUniformLocation | null;
  private fertileColorLocation: WebGLUniformLocation | null;
  private plainsColorLocation: WebGLUniformLocation | null;
  private badlandsColorLocation: WebGLUniformLocation | null;
  private gridThicknessLocation: WebGLUniformLocation | null;
  private gridDarknessLocation: WebGLUniformLocation | null;
  private objectColorLocation: WebGLUniformLocation | null;
  private objectAlphaLocation: WebGLUniformLocation | null;
  private textureSamplerLocation: WebGLUniformLocation | null;
  private isDrawingObjectLocation: WebGLUniformLocation | null;
  private isDrawingTerritoryLocation: WebGLUniformLocation | null;
  private isDrawingTextureLocation: WebGLUniformLocation | null;
  private objectBuffer: WebGLBuffer | null;
  private territoryBuffer: WebGLBuffer | null;
  private mapPlaneBuffer: WebGLBuffer | null;
  private textureBuffer: WebGLBuffer | null;
  private textures = new Map<string, WebGLTexture>();
  private derivativesSupported = false;
  // Cache derived territory shades (fill + border) keyed by original alliance color string
  private territoryColorCache = new Map<
    string,
    { fill: [number, number, number]; border: [number, number, number] }
  >();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const derivativesExt = gl.getExtension('OES_standard_derivatives');
    if (derivativesExt) {
      this.derivativesSupported = true;
    }
    this.mapProgram = createProgramFromSources(
      gl,
      mapVertexShaderSource,
      mapFragmentShaderSource,
      { USE_DERIVATIVES: this.derivativesSupported ? 1 : 0 },
    );
    this.worldPosAttrLocation = gl.getAttribLocation(
      this.mapProgram,
      'a_worldPosition',
    );
    this.texCoordAttrLocation = gl.getAttribLocation(
      this.mapProgram,
      'a_texCoord',
    );
    this.projectionUniformLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_projection',
    );
    this.fertileColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_fertileColor',
    );
    this.plainsColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_plainsColor',
    );
    this.badlandsColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_badlandsColor',
    );
    this.gridThicknessLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_gridThickness',
    );
    this.gridDarknessLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_gridDarkness',
    );
    this.objectColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_objectColor',
    );
    this.objectAlphaLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_objectAlpha',
    );
    this.textureSamplerLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_textureSampler',
    );
    this.isDrawingObjectLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_isDrawingObject',
    );
    this.isDrawingTerritoryLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_isDrawingTerritory',
    );
    this.isDrawingTextureLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_isDrawingTexture',
    );
    this.objectBuffer = gl.createBuffer();
    this.territoryBuffer = gl.createBuffer();
    this.textureBuffer = gl.createBuffer();
    this.mapPlaneBuffer = this.createMapPlaneBuffer();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (import.meta.env.DEV) {
      console.log('WebGLRenderer Initialized!');
    }
  }

  public renderFrame(time = 0) {
    const gl = this.gl;
    const perfState = usePerfStore.getState();
    const perfEnabled = perfState.enabled;
    let frameStart = 0;
    if (perfEnabled) frameStart = performance.now();
    let msTerritory = 0;
    let msObjects = 0;
    let msSprites = 0;
    let msGhost = 0;
    const camera = useCameraStore.getState();
    const { images } = useAssetStore.getState();
    const {
      baseBuildings,
      players,
      userBuildings,
      alliances,
      claimedTerritory,
      globallyClaimedTiles,
    } = useMapStore.getState();
    const { settings: overwatch } = useOverwatchStore.getState();
    const {
      isPlacingPlayer,
      playerToPlace,
      buildMode,
      mouseWorldPosition,
      isValidPlacement,
      lastPlacementResult,
    } = useUiStore.getState();
    const { selection } = useSelectionStore.getState();
    // Always render base map and non-textured primitives. Skip only the sprite pass when images are not ready
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.06, 0.06, 0.06, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.mapProgram);
    const worldProjectionMatrix = this.calculateWorldProjectionMatrix(
      camera.x,
      camera.y,
      camera.scale,
    );
    gl.uniformMatrix3fv(
      this.projectionUniformLocation,
      false,
      worldProjectionMatrix,
    );
    gl.uniform1f(
      this.gridThicknessLocation,
      Config.rendering.webgl.gridThickness,
    );
    gl.uniform1f(
      this.gridDarknessLocation,
      Config.rendering.webgl.gridDarkness,
    );
    this.drawMapPlane();
    // Invoke external registered layers (e.g., overlays/dev) between base map and built-in passes
    layerManager.draw(time);
    if (perfEnabled) {
      const t0 = performance.now();
      claimedTerritory.forEach((tiles, allianceId) => {
        const alliance = alliances.find((a) => a.id === allianceId);
        if (alliance && tiles.size > 0) {
          this.drawTerritory(alliance, tiles, globallyClaimedTiles);
        }
      });
      msTerritory = performance.now() - t0;
    } else {
      claimedTerritory.forEach((tiles, allianceId) => {
        const alliance = alliances.find((a) => a.id === allianceId);
        if (alliance && tiles.size > 0) {
          this.drawTerritory(alliance, tiles, globallyClaimedTiles);
        }
      });
    }
    gl.uniform1f(this.isDrawingObjectLocation, 1.0);
    // Viewport culling: compute visible world bounds using ALL 4 screen corners
    const [tlx, tly] = screenToWorld(0, 0, camera);
    const [trx, try_] = screenToWorld(gl.canvas.width, 0, camera);
    const [blx, bly] = screenToWorld(0, gl.canvas.height, camera);
    const [brx, bry] = screenToWorld(gl.canvas.width, gl.canvas.height, camera);
    const pad = 2; // tile margin to avoid edge popping
    const minX = Math.floor(Math.min(tlx, trx, blx, brx)) - pad;
    const maxX = Math.ceil(Math.max(tlx, trx, blx, brx)) + pad;
    const minY = Math.floor(Math.min(tly, try_, bly, bry)) - pad;
    const maxY = Math.ceil(Math.max(tly, try_, bly, bry)) + pad;
    const inView = (o: { x: number; y: number; w: number; h: number }) =>
      !(
        o.x > maxX ||
        o.x + o.w - 1 < minX ||
        o.y > maxY ||
        o.y + o.h - 1 < minY
      );

    if (perfEnabled) {
      const t0 = performance.now();
      for (const building of baseBuildings) {
        if (inView(building)) this.drawObject(building);
      }
      for (const building of userBuildings) {
        // Overwatch category filtering (user placed buildings)
        const def = AppConfig.BUILDING_CATALOG[building.type];
        const cat = def?.category;
        if (cat && overwatch[cat] === false) continue;
        if (inView(building)) this.drawObject(building);
      }
      for (const player of players) {
        if (inView(player)) this.drawObject(player, 1.0);
      }
      msObjects = performance.now() - t0;
    } else {
      for (const building of baseBuildings) {
        if (inView(building)) this.drawObject(building);
      }
      for (const building of userBuildings) {
        const def = AppConfig.BUILDING_CATALOG[building.type];
        const cat = def?.category;
        if (cat && overwatch[cat] === false) continue;
        if (inView(building)) this.drawObject(building);
      }
      for (const player of players) {
        if (inView(player)) this.drawObject(player, 1.0);
      }
    }
    if (selection) {
      switch (selection.type) {
        case 'baseBuilding':
        case 'userBuilding':
        case 'player':
          this.drawHighlight(selection.data);
          break;
        case 'tile':
          this.drawHighlight({ ...selection.data, w: 1, h: 1 });
          break;
      }
    }
    if (images.size > 0) {
      if (perfEnabled) {
        const t0 = performance.now();
        const spriteProjectionMatrix = this.calculateSpriteProjectionMatrix();
        gl.uniformMatrix3fv(
          this.projectionUniformLocation,
          false,
          spriteProjectionMatrix,
        );
        for (const building of baseBuildings) {
          if (!inView(building)) continue;
          const image = building.imgKey ? images.get(building.imgKey) : null;
          if (image && building.anchorTile) {
            this.drawImageAsSprite(camera, image, building);
          }
        }
        gl.uniformMatrix3fv(
          this.projectionUniformLocation,
          false,
          worldProjectionMatrix,
        );
        msSprites = performance.now() - t0;
      } else {
        const spriteProjectionMatrix = this.calculateSpriteProjectionMatrix();
        gl.uniformMatrix3fv(
          this.projectionUniformLocation,
          false,
          spriteProjectionMatrix,
        );
        for (const building of baseBuildings) {
          if (!inView(building)) continue;
          const image = building.imgKey ? images.get(building.imgKey) : null;
          if (image && building.anchorTile) {
            this.drawImageAsSprite(camera, image, building);
          }
        }
        gl.uniformMatrix3fv(
          this.projectionUniformLocation,
          false,
          worldProjectionMatrix,
        );
      }
    }
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;
    const isPlacingSomething =
      isPlacingPlayer || !!buildMode.selectedBuildingType;
    if (isPlacingSomething) {
      let ghostStart = 0;
      if (perfEnabled) ghostStart = performance.now();
      const flickerPeriod = Config.interaction.ghost.GHOST_FLICKER_PERIOD_MS;
      const tri = 1 - Math.abs(((time / flickerPeriod) % 2) - 1);
      const eased = 0.5 - 0.5 * Math.cos(tri * Math.PI);
      const minAlpha = 0.35;
      const maxAlpha = 0.75;
      const animatedAlpha = minAlpha + (maxAlpha - minAlpha) * eased;
      let w = 0,
        h = 0,
        coverage = 0;
      let ghostBaseColor = '#ffffff';
      let ghostPosition = { x: 0, y: 0 };
      const failureCode = lastPlacementResult?.reasonCode;
      const reasonColorMap: Record<string, string> = {
        OUT_OF_BOUNDS: '#dc3545',
        COLLIDES_BASE: '#dc3545',
        COLLIDES_USER: '#dc3545',
        COLLIDES_PLAYER: '#dc3545',
        TERRITORY_REQUIRED: '#dc3545',
        BIOME_MISMATCH: '#dc3545',
        LIMIT_REACHED: '#dc3545',
        TERRITORY_RULE_UNMET: '#dc3545',
        FOREIGN_TERRITORY: '#dc3545',
      };
      const invalidColor =
        (failureCode && reasonColorMap[failureCode]) || '#dc3545';
      const ghostColor = isValidPlacement ? undefined : invalidColor;
      if (isPlacingPlayer && playerToPlace) {
        w = AppConfig.player.width;
        h = AppConfig.player.height;
        ghostBaseColor = playerToPlace.color;
      } else if (buildMode.selectedBuildingType && buildMode.activeAllianceId) {
        const def = AppConfig.BUILDING_CATALOG[buildMode.selectedBuildingType];
        const alliance = alliances.find(
          (a) => a.id === buildMode.activeAllianceId,
        );
        w = def.w;
        h = def.h;
        coverage = def.coverage;
        ghostBaseColor = alliance?.color ?? '#ffffff';
      }
      if (w > 0) {
        if (isDesktop && mouseWorldPosition) {
          ghostPosition = {
            x: Math.round(mouseWorldPosition.x),
            y: Math.round(mouseWorldPosition.y),
          };
        } else {
          const [centerX, centerY] = screenToWorld(
            gl.canvas.width / 2,
            gl.canvas.height / 2,
            camera,
          );
          ghostPosition = { x: Math.round(centerX), y: Math.round(centerY) };
        }
        const bodyAlpha = isValidPlacement ? animatedAlpha : 0.6; // constant when invalid
        const coverageAlpha = isValidPlacement ? animatedAlpha * 0.3 : 0.25;
        if (coverage > 0) {
          const radius = Math.floor(coverage / 2);
          this.drawObject(
            {
              x: ghostPosition.x + Math.floor(w / 2) - radius,
              y: ghostPosition.y + Math.floor(h / 2) - radius,
              w: coverage,
              h: coverage,
              color: ghostColor ?? ghostBaseColor,
            },
            coverageAlpha,
          );
        }
        this.drawObject(
          { ...ghostPosition, w, h, color: ghostColor ?? ghostBaseColor },
          bodyAlpha,
        );
        if (!isValidPlacement && failureCode) {
          const outlineAlpha = 0.65; // stable outline alpha to avoid perceived color cycling
          const gl = this.gl;
          gl.uniform1f(this.isDrawingObjectLocation, 1.0);
          gl.uniform1f(this.isDrawingTerritoryLocation, 0.0);
          const positions = [
            ghostPosition.x,
            ghostPosition.y,
            ghostPosition.x + w,
            ghostPosition.y,
            ghostPosition.x + w,
            ghostPosition.y,
            ghostPosition.x + w,
            ghostPosition.y + h,
            ghostPosition.x + w,
            ghostPosition.y + h,
            ghostPosition.x,
            ghostPosition.y + h,
            ghostPosition.x,
            ghostPosition.y + h,
            ghostPosition.x,
            ghostPosition.y,
          ];
          gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.DYNAMIC_DRAW,
          );
          gl.enableVertexAttribArray(this.worldPosAttrLocation);
          gl.vertexAttribPointer(
            this.worldPosAttrLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0,
          );
          gl.uniform3fv(this.objectColorLocation, [1, 1, 1]);
          gl.uniform1f(this.objectAlphaLocation, outlineAlpha);
          gl.drawArrays(gl.LINES, 0, positions.length / 2);
        }
      }
      if (perfEnabled) msGhost = performance.now() - ghostStart;
    }
    if (perfEnabled) {
      const total = performance.now() - frameStart;
      usePerfStore.getState().record({
        lastFrameMs: total,
        phases: {
          territory: msTerritory,
          objects: msObjects,
          sprites: msSprites,
          ghost: msGhost,
        },
      });
    }
  }

  public dispose() {
    const gl = this.gl;
    if (this.objectBuffer) gl.deleteBuffer(this.objectBuffer);
    if (this.territoryBuffer) gl.deleteBuffer(this.territoryBuffer);
    if (this.textureBuffer) gl.deleteBuffer(this.textureBuffer);
    if (this.mapPlaneBuffer) gl.deleteBuffer(this.mapPlaneBuffer);
    this.textures.forEach((tex) => gl.deleteTexture(tex));
    this.textures.clear();
    // Programs are typically deleted on context loss; guard for safety
    if (this.mapProgram) gl.deleteProgram(this.mapProgram);
  }

  private drawImageAsSprite(
    camera: { x: number; y: number; scale: number },
    image: HTMLImageElement,
    building: BaseBuilding,
  ) {
    const gl = this.gl;
    const {
      anchorTile,
      imgRndW = 1,
      imgRndH = 1,
      imgScl = 1,
      imgSclFar = 1,
    } = building;
    if (!anchorTile) return;
    const [screenAnchorX, screenAnchorY] = worldToScreen(
      anchorTile.x,
      anchorTile.y,
    );
    const transformedAnchorX = screenAnchorX * camera.scale + camera.x;
    const transformedAnchorY = screenAnchorY * camera.scale + camera.y;
    // Hold sprite scale at imgScl until a threshold (default: AppConfig.baseScale),
    // then increase towards imgSclFar as we zoom out below that threshold.
    const holdUntilScale = Config.interaction.baseScale; // e.g., 100% zoom if percent = scale*20
    const startScale = AppConfig.camera.minScale;
    const clampedScale = Math.max(
      startScale,
      Math.min(camera.scale, holdUntilScale),
    );
    const t = (clampedScale - startScale) / (holdUntilScale - startScale); // 0 at min, 1 at hold
    const dynamicScaleUnclamped = imgSclFar + (imgScl - imgSclFar) * t;
    const dynamicScale = Math.max(imgScl, dynamicScaleUnclamped);
    // Make sprites scale with camera zoom so they stay proportional to tiles
    const spritePixelW =
      imgRndW * AppConfig.tileW * dynamicScale * camera.scale;
    const spritePixelH =
      imgRndH * AppConfig.tileH * dynamicScale * camera.scale;
    const halfW = spritePixelW / 2;
    const halfH = spritePixelH / 2;
    const positions = [
      transformedAnchorX - halfW,
      transformedAnchorY - halfH,
      transformedAnchorX + halfW,
      transformedAnchorY - halfH,
      transformedAnchorX - halfW,
      transformedAnchorY + halfH,
      transformedAnchorX - halfW,
      transformedAnchorY + halfH,
      transformedAnchorX + halfW,
      transformedAnchorY - halfH,
      transformedAnchorX + halfW,
      transformedAnchorY + halfH,
    ];
    const texture = this.createAndCacheTexture(image.src, image);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1f(this.isDrawingTextureLocation, 1.0);
    gl.uniform1f(this.isDrawingObjectLocation, 0.0);
    gl.uniform1f(this.isDrawingTerritoryLocation, 0.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(positions),
      gl.DYNAMIC_DRAW,
    );
    gl.enableVertexAttribArray(this.worldPosAttrLocation);
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
      ]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(this.texCoordAttrLocation);
    gl.vertexAttribPointer(this.texCoordAttrLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(this.textureSamplerLocation, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.uniform1f(this.isDrawingTextureLocation, 0.0);
  }

  private createAndCacheTexture(
    key: string,
    image: HTMLImageElement,
  ): WebGLTexture | null {
    if (this.textures.has(key)) {
      return this.textures.get(key) ?? null;
    }
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (texture) {
      this.textures.set(key, texture);
    }
    return texture;
  }
  private drawHighlight(obj: { x: number; y: number; w: number; h: number }) {
    const gl = this.gl;
    const { x, y, w, h } = obj;
    gl.uniform1f(this.isDrawingObjectLocation, 1.0);
    gl.uniform1f(this.isDrawingTerritoryLocation, 0.0);
    const positions = [
      x,
      y,
      x + w,
      y,
      x + w,
      y,
      x + w,
      y + h,
      x + w,
      y + h,
      x,
      y + h,
      x,
      y + h,
      x,
      y,
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(positions),
      gl.DYNAMIC_DRAW,
    );
    gl.enableVertexAttribArray(this.worldPosAttrLocation);
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0);
    const [r, g, b] = parseColor(Config.ui.colors.selection);
    gl.uniform3fv(this.objectColorLocation, [r, g, b]);
    gl.uniform1f(this.objectAlphaLocation, 1.0);
    gl.drawArrays(gl.LINES, 0, positions.length / 2);
  }
  private drawTerritory(
    alliance: Alliance,
    tiles: Set<string>,
    globallyClaimedTiles: Map<string, number>,
  ) {
    const gl = this.gl;
    gl.uniform1f(this.isDrawingObjectLocation, 0.0);
    gl.uniform1f(this.isDrawingTerritoryLocation, 1.0);
    const shades = this.getTerritoryShades(alliance.color);
    const [fr, fg, fb] = shades.fill;
    gl.uniform3fv(this.objectColorLocation, [fr, fg, fb]); // fill shade
    gl.uniform1f(this.objectAlphaLocation, 0.25);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.territoryBuffer);
    gl.enableVertexAttribArray(this.worldPosAttrLocation);
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0);
    const positions: number[] = [];
    // Viewport culling for territory tiles
    const camera = useCameraStore.getState();
    const [tlx, tly] = screenToWorld(0, 0, camera);
    const [trx, try_] = screenToWorld(gl.canvas.width, 0, camera);
    const [blx, bly] = screenToWorld(0, gl.canvas.height, camera);
    const [brx, bry] = screenToWorld(gl.canvas.width, gl.canvas.height, camera);
    const pad = 2;
    const minX = Math.floor(Math.min(tlx, trx, blx, brx)) - pad;
    const maxX = Math.ceil(Math.max(tlx, trx, blx, brx)) + pad;
    const minY = Math.floor(Math.min(tly, try_, bly, bry)) - pad;
    const maxY = Math.ceil(Math.max(tly, try_, bly, bry)) + pad;
    tiles.forEach((coordStr) => {
      const [x, y] = coordStr.split(',').map(Number);
      if (x > maxX || x + 1 < minX || y > maxY || y + 1 < minY) return;
      positions.push(x, y, x + 1, y, x, y + 1);
      positions.push(x, y + 1, x + 1, y, x + 1, y + 1);
    });
    if (positions.length > 0) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.DYNAMIC_DRAW,
      );
      gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
    }
    // Border pass (quad strips for outer perimeter and inter-alliance edges)
    gl.uniform1f(this.isDrawingTerritoryLocation, 0.0);
    gl.uniform1f(this.isDrawingObjectLocation, 1.0);
    const borderCfg = AppConfig.territory.border;
    const quadPositions: number[] = [];
    const inset = borderCfg.insetPrimary;
    const thickness = borderCfg.thickness;
    const avoidDouble = borderCfg.avoidDoubleDraw;
    tiles.forEach((coordStr) => {
      const [x, y] = coordStr.split(',').map(Number);
      const upKey = `${x},${y - 1}`;
      const downKey = `${x},${y + 1}`;
      const leftKey = `${x - 1},${y}`;
      const rightKey = `${x + 1},${y}`;
      const upOwner = globallyClaimedTiles.get(upKey);
      const downOwner = globallyClaimedTiles.get(downKey);
      const leftOwner = globallyClaimedTiles.get(leftKey);
      const rightOwner = globallyClaimedTiles.get(rightKey);

      // Helper to decide if we draw shared edge (avoid duplicates to prevent color dominance)
      const shouldDraw = (neighborOwner: number | undefined | null) => {
        if (neighborOwner === alliance.id) return false; // internal edge
        if (neighborOwner == null) return true; // boundary of unclaimed
        if (!avoidDouble) return true;
        return alliance.id < (neighborOwner as number); // deterministic tie-breaker
      };

      // Top edge quad (horizontal band)
      if (shouldDraw(upOwner)) {
        const y1 = y + inset;
        const y2 = Math.min(y + 1, y1 + thickness);
        quadPositions.push(
          x,
          y1,
          x + 1,
          y1,
          x,
          y2,
          x,
          y2,
          x + 1,
          y1,
          x + 1,
          y2,
        );
      }
      // Bottom edge
      if (shouldDraw(downOwner)) {
        const y2 = y + 1 - inset;
        const y1 = Math.max(y, y2 - thickness);
        quadPositions.push(
          x,
          y1,
          x + 1,
          y1,
          x,
          y2,
          x,
          y2,
          x + 1,
          y1,
          x + 1,
          y2,
        );
      }
      // Left edge (vertical band)
      if (shouldDraw(leftOwner)) {
        const x1 = x + inset;
        const x2 = Math.min(x + 1, x1 + thickness);
        quadPositions.push(
          x1,
          y,
          x2,
          y,
          x1,
          y + 1,
          x1,
          y + 1,
          x2,
          y,
          x2,
          y + 1,
        );
      }
      // Right edge
      if (shouldDraw(rightOwner)) {
        const x2 = x + 1 - inset;
        const x1 = Math.max(x, x2 - thickness);
        quadPositions.push(
          x1,
          y,
          x2,
          y,
          x1,
          y + 1,
          x1,
          y + 1,
          x2,
          y,
          x2,
          y + 1,
        );
      }
    });
    if (quadPositions.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(quadPositions),
        gl.DYNAMIC_DRAW,
      );
      gl.enableVertexAttribArray(this.worldPosAttrLocation);
      gl.vertexAttribPointer(
        this.worldPosAttrLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );
      const [br, bg, bb] = shades.border;
      const borderAlpha = 0.85; // single pass alpha
      gl.uniform3fv(this.objectColorLocation, [br, bg, bb]);
      gl.uniform1f(this.objectAlphaLocation, borderAlpha);
      gl.drawArrays(gl.TRIANGLES, 0, quadPositions.length / 2);
    }
  }
  private drawObject(obj: DrawableObject, alpha = 1.0) {
    const gl = this.gl;
    const { x, y, w, h, color, brdCol } = obj;
    if (!color) return;
    gl.uniform1f(this.isDrawingTerritoryLocation, 0.0);
    gl.uniform1f(this.isDrawingObjectLocation, 1.0);
    const positions = [
      x,
      y,
      x + w,
      y,
      x,
      y + h,
      x,
      y + h,
      x + w,
      y,
      x + w,
      y + h,
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(positions),
      gl.DYNAMIC_DRAW,
    );
    gl.enableVertexAttribArray(this.worldPosAttrLocation);
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0);
    const [r, g, b] = parseColor(color);
    gl.uniform3fv(this.objectColorLocation, [r, g, b]);
    gl.uniform1f(this.objectAlphaLocation, alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // Optional border stroke if provided
    if (brdCol) {
      const [br, bg, bb] = parseColor(brdCol);
      const linePos = [
        x,
        y,
        x + w,
        y,
        x + w,
        y,
        x + w,
        y + h,
        x + w,
        y + h,
        x,
        y + h,
        x,
        y + h,
        x,
        y,
      ];
      gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(linePos),
        gl.DYNAMIC_DRAW,
      );
      gl.enableVertexAttribArray(this.worldPosAttrLocation);
      gl.vertexAttribPointer(
        this.worldPosAttrLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );
      gl.uniform3fv(this.objectColorLocation, [br, bg, bb]);
      gl.uniform1f(this.objectAlphaLocation, Math.min(1, alpha + 0.25));
      gl.drawArrays(gl.LINES, 0, linePos.length / 2);
    }
  }

  private drawMapPlane() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mapPlaneBuffer);
    gl.enableVertexAttribArray(this.worldPosAttrLocation);
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(this.isDrawingObjectLocation, 0.0);
    gl.uniform1f(this.isDrawingTerritoryLocation, 0.0);
    gl.uniform3fv(
      this.fertileColorLocation,
      parseColor(Config.rendering.biomes.colors.fertile),
    );
    gl.uniform3fv(
      this.plainsColorLocation,
      parseColor(Config.rendering.biomes.colors.plains),
    );
    gl.uniform3fv(
      this.badlandsColorLocation,
      parseColor(Config.rendering.biomes.colors.badlands),
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private createMapPlaneBuffer(): WebGLBuffer | null {
    const gl = this.gl;
    const N = AppConfig.N;
    const positions = [0, 0, N, 0, 0, N, 0, N, N, 0, N, N];
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return buffer;
  }
  private calculateWorldProjectionMatrix(
    camX: number,
    camY: number,
    camScale: number,
  ): Matrix3 {
    const { tileW, tileH } = AppConfig;
    const { width, height } = this.gl.canvas;
    const clipX = 2.0 / width;
    const clipY = -2.0 / height;

    // THE FIX: Negate the Y-components of the projection matrix to align
    // with our "Y-UP" world-to-screen utility function.
    const a = (tileW / 2) * camScale * clipX;
    const b = -(tileH / 2) * camScale * clipY;
    const c = (-tileW / 2) * camScale * clipX;
    const d = -(tileH / 2) * camScale * clipY;

    const tx = camX * clipX - 1.0;
    const ty = camY * clipY + 1.0;

    return [a, b, 0, c, d, 0, tx, ty, 1];
  }

  private calculateSpriteProjectionMatrix(): Matrix3 {
    const { width, height } = this.gl.canvas;
    const clipX = 2.0 / width;
    const clipY = -2.0 / height;
    return [clipX, 0, 0, 0, clipY, 0, -1.0, 1.0, 1];
  }

  // --- Territory color shade derivation (hue-preserving) ---
  private getTerritoryShades(color: string) {
    const cached = this.territoryColorCache.get(color);
    if (cached) return cached;
    const baseRGB = parseColor(color);
    const biomeRGBs = Object.values(AppConfig.biomeColors).map(parseColor);

    const lum = (c: [number, number, number]) =>
      0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const dist = (a: [number, number, number], b: [number, number, number]) =>
      Math.sqrt(
        (a[0] - b[0]) * (a[0] - b[0]) +
          (a[1] - b[1]) * (a[1] - b[1]) +
          (a[2] - b[2]) * (a[2] - b[2]),
      );

    const [h, s0, l0] = this.rgbToHsl(baseRGB);
    const baseLum = lum(baseRGB);
    let s = s0;
    let l = l0;

    // Ensure minimum saturation so colors (esp. yellows) don't wash into plains
    if (s < 0.25) s = 0.25;

    // Special handling for yellowish hues to distinguish from plains (approx 45-70 deg)
    if (h >= 45 && h <= 70) {
      if (l > 0.6) l = 0.55; // pull slightly darker
      if (s < 0.5) s = 0.5; // enrich saturation
    }

    // Measure closeness to any biome color
    let minLumDiff = Infinity;
    let minDistance = Infinity;
    for (const b of biomeRGBs) {
      minLumDiff = Math.min(minLumDiff, Math.abs(baseLum - lum(b)));
      minDistance = Math.min(minDistance, dist(baseRGB, b));
    }

    const LUM_THRESHOLD = 0.12;
    const DIST_THRESHOLD = 0.28;
    if (minLumDiff < LUM_THRESHOLD || minDistance < DIST_THRESHOLD) {
      // Adjust lightness while preserving hue
      if (baseLum > 0.5) {
        l *= 0.65; // darken
      } else {
        l = l + (1 - l) * 0.4; // lighten
      }
      // Slight saturation boost to avoid blending
      s = Math.min(1, s * 1.1);
    }

    // Build fill shade
    const fillRGB = this.hslToRgb([h, s, l]);

    // Derive border shade: push lightness in opposite direction for clear edge
    let borderL = l;
    if (l >= 0.5) {
      borderL = Math.max(0, l - 0.18);
    } else {
      borderL = Math.min(1, l + 0.18);
    }
    let borderS = Math.min(1, s * 1.05);
    const borderRGB = this.hslToRgb([h, borderS, borderL]);

    const shades = { fill: fillRGB, border: borderRGB } as const;
    this.territoryColorCache.set(color, shades);
    return shades;
  }

  private rgbToHsl([r, g, b]: [number, number, number]): [
    number,
    number,
    number,
  ] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const l = (max + min) / 2;
    const d = max - min;
    let s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return [h, s, l];
  }

  private hslToRgb([h, s, l]: [number, number, number]): [
    number,
    number,
    number,
  ] {
    const C = (1 - Math.abs(2 * l - 1)) * s;
    const Hp = h / 60;
    const X = C * (1 - Math.abs((Hp % 2) - 1));
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (Hp >= 0 && Hp < 1) {
      r1 = C;
      g1 = X;
    } else if (Hp >= 1 && Hp < 2) {
      r1 = X;
      g1 = C;
    } else if (Hp >= 2 && Hp < 3) {
      g1 = C;
      b1 = X;
    } else if (Hp >= 3 && Hp < 4) {
      g1 = X;
      b1 = C;
    } else if (Hp >= 4 && Hp < 5) {
      r1 = X;
      b1 = C;
    } else if (Hp >= 5 && Hp < 6) {
      r1 = C;
      b1 = X;
    }
    const m = l - C / 2;
    return [r1 + m, g1 + m, b1 + m];
  }
}
