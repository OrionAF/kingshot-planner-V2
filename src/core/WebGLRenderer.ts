// src/core/WebGLRenderer.ts

import { AppConfig } from '../config/appConfig';
import { useAssetStore } from '../state/useAssetStore';
import { useCameraStore } from '../state/useCameraStore';
import { useMapStore } from '../state/useMapStore';
import { useSelectionStore } from '../state/useSelectionStore';
import { useUiStore } from '../state/useUiStore';
import type { Alliance, BaseBuilding } from '../types/map.types';
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
    const camera = useCameraStore.getState();
    const { images } = useAssetStore.getState();
    const {
      baseBuildings,
      players,
      userBuildings,
      alliances,
      claimedTerritory,
    } = useMapStore.getState();
    const {
      isPlacingPlayer,
      playerToPlace,
      buildMode,
      mouseWorldPosition,
      isValidPlacement,
    } = useUiStore.getState();
    const { selection } = useSelectionStore.getState();
    if (images.size === 0) return;
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
    gl.uniform1f(this.gridThicknessLocation, AppConfig.webgl.gridThickness);
    gl.uniform1f(this.gridDarknessLocation, AppConfig.webgl.gridDarkness);
    this.drawMapPlane();
    claimedTerritory.forEach((tiles, allianceId) => {
      const alliance = alliances.find((a) => a.id === allianceId);
      if (alliance && tiles.size > 0) {
        this.drawTerritory(alliance, tiles);
      }
    });
    gl.uniform1f(this.isDrawingObjectLocation, 1.0);
    for (const building of baseBuildings) {
      if (!building.imgKey) {
        this.drawObject(building);
      }
    }
    for (const building of userBuildings) {
      this.drawObject(building);
    }
    for (const player of players) {
      this.drawObject(player, 1.0);
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
    const spriteProjectionMatrix = this.calculateSpriteProjectionMatrix();
    gl.uniformMatrix3fv(
      this.projectionUniformLocation,
      false,
      spriteProjectionMatrix,
    );
    for (const building of baseBuildings) {
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
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;
    const isPlacingSomething =
      isPlacingPlayer || !!buildMode.selectedBuildingType;
    if (isPlacingSomething) {
      const flickerPeriod = AppConfig.interactions.GHOST_FLICKER_PERIOD_MS;
      const sineValue =
        (Math.sin((time / flickerPeriod) * (2 * Math.PI)) + 1) / 2;
      const minAlpha = 0.3;
      const maxAlpha = 0.8;
      const flickerAlpha = minAlpha + (maxAlpha - minAlpha) * sineValue;
      let w = 0,
        h = 0,
        coverage = 0;
      let ghostBaseColor = '#ffffff';
      let ghostPosition = { x: 0, y: 0 };
      const ghostColor = isValidPlacement ? undefined : '#dc3545';
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
            flickerAlpha * 0.3,
          );
        }
        this.drawObject(
          { ...ghostPosition, w, h, color: ghostColor ?? ghostBaseColor },
          flickerAlpha,
        );
      }
    }
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
    const zoomT = Math.max(
      0,
      Math.min(
        1,
        (camera.scale - AppConfig.camera.minScale) /
          (AppConfig.camera.maxScale - AppConfig.camera.minScale),
      ),
    );
    const dynamicScale = imgScl + (imgSclFar - imgScl) * (1 - zoomT);
    const spritePixelW = imgRndW * AppConfig.tileW * dynamicScale;
    const spritePixelH = imgRndH * AppConfig.tileH * dynamicScale;
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
    const [r, g, b] = parseColor(AppConfig.selectionColor);
    gl.uniform3fv(this.objectColorLocation, [r, g, b]);
    gl.uniform1f(this.objectAlphaLocation, 1.0);
    gl.drawArrays(gl.LINES, 0, positions.length / 2);
  }
  private drawTerritory(alliance: Alliance, tiles: Set<string>) {
    const gl = this.gl;
    gl.uniform1f(this.isDrawingObjectLocation, 0.0);
    gl.uniform1f(this.isDrawingTerritoryLocation, 1.0);
    const [r, g, b] = parseColor(alliance.color);
    gl.uniform3fv(this.objectColorLocation, [r, g, b]);
    gl.uniform1f(this.objectAlphaLocation, 0.25);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.territoryBuffer);
    gl.enableVertexAttribArray(this.worldPosAttrLocation);
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0);
    const positions: number[] = [];
    tiles.forEach((coordStr) => {
      const [x, y] = coordStr.split(',').map(Number);
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
    gl.uniform1f(this.isDrawingTerritoryLocation, 0.0);
  }
  private drawObject(obj: DrawableObject, alpha = 1.0) {
    const gl = this.gl;
    const { x, y, w, h, color } = obj;
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
      parseColor(AppConfig.biomeColors.fertile),
    );
    gl.uniform3fv(
      this.plainsColorLocation,
      parseColor(AppConfig.biomeColors.plains),
    );
    gl.uniform3fv(
      this.badlandsColorLocation,
      parseColor(AppConfig.biomeColors.badlands),
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
}
