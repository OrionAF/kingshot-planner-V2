// src/core/CanvasRenderer.ts

import { useSelectionStore } from '../state/useSelectionStore'
import { AppConfig } from '../config/appConfig'
import { useCameraStore } from '../state/useCameraStore'
import { useMapStore } from '../state/useMapStore'
import { type BaseBuilding } from '../types/map.types'

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D

  constructor(context: CanvasRenderingContext2D) {
    this.ctx = context
    console.log('CanvasRenderer Initialized!')
  }

  // =================================================================
  // == The Main Render Function ==
  // =================================================================

  /**
   * The main render function, called on every animation frame.
   * It calculates the visible area and draws only the tiles within it.
   */
  public renderFrame() {
    const { width, height } = this.ctx.canvas

    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.fillStyle = '#111'
    this.ctx.fillRect(0, 0, width, height)

    // Get the current, live camera state from our global store.
    const camera = useCameraStore.getState()

    // Apply the camera's view transformation
    this.ctx.setTransform(camera.scale, 0, 0, camera.scale, camera.x, camera.y)

    // --- Calculate which tiles are visible ---
    const [tl_x, tl_y] = this.screenToWorld(0, 0, camera)
    const [tr_x, tr_y] = this.screenToWorld(width, 0, camera)
    const [bl_x, bl_y] = this.screenToWorld(0, height, camera)
    const [br_x, br_y] = this.screenToWorld(width, height, camera)

    // Find the min/max bounds of the visible coordinates, with a little padding.
    const minX = Math.min(tl_x, tr_x, bl_x, br_x) - 1
    const maxX = Math.max(tl_x, tr_x, bl_x, br_x) + 1
    const minY = Math.min(tl_y, tr_y, bl_y, br_y) - 1
    const maxY = Math.max(tl_y, tr_y, bl_y, br_y) + 1

    // --- Draw the visible tiles ---
    for (let x = Math.floor(minX); x <= maxX; x++) {
      for (let y = Math.floor(minY); y <= maxY; y++) {
        // Make sure we don't try to draw tiles outside the map's actual bounds
        if (x < 0 || x >= AppConfig.N || y < 0 || y >= AppConfig.N) {
          continue
        }
        this.drawTile(x, y)
      }
    }

    // === NEW BLOCK START ===
    // --- Draw the buildings ---
    const { baseBuildings } = useMapStore.getState()

    // Filter to only draw buildings that are currently in the camera's view
    for (const building of baseBuildings) {
      if (
        building.x > maxX ||
        building.x + building.w - 1 < minX ||
        building.y > maxY ||
        building.y + building.h - 1 < minY
      ) {
        continue // Skip buildings that are off-screen
      }
      this.drawBuilding(building)
    }
    // === NEW BLOCK END ===

    // --- Draw the selection highlight ---
    const { selection } = useSelectionStore.getState()

    if (selection) {
      this.ctx.strokeStyle = AppConfig.selectionColor
      this.ctx.lineWidth = 0.5

      // Check the TYPE of selection
      if (selection.type === 'building') {
        // If it's a building, reuse our existing drawBuilding logic,
        // but tell it not to fill the shape, only draw the border.
        this.drawBuilding(selection.data, true) // Pass 'true' to indicate it's a highlight
      } else if (selection.type === 'tile') {
        // If it's just a tile, draw the simple single-tile highlight.
        const { x, y } = selection.data
        const [screenX, screenY] = this.worldToScreen(x, y)

        this.ctx.beginPath()
        this.ctx.moveTo(screenX, screenY - AppConfig.tileH / 2)
        this.ctx.lineTo(screenX + AppConfig.tileW / 2, screenY)
        this.ctx.lineTo(screenX, screenY + AppConfig.tileH / 2)
        this.ctx.lineTo(screenX - AppConfig.tileW / 2, screenY)
        this.ctx.closePath()
        this.ctx.stroke()
      }
    }
  }

  // =================================================================
  // == Coordinate and Drawing Helper Methods ==
  // =================================================================

  /**
   * Draws a single isometric tile on the canvas.
   */
  private drawTile(x: number, y: number) {
    const [screenX, screenY] = this.worldToScreen(x, y)

    this.ctx.beginPath()
    this.ctx.moveTo(screenX, screenY - AppConfig.tileH / 2)
    this.ctx.lineTo(screenX + AppConfig.tileW / 2, screenY)
    this.ctx.lineTo(screenX, screenY + AppConfig.tileH / 2)
    this.ctx.lineTo(screenX - AppConfig.tileW / 2, screenY)
    this.ctx.closePath()

    this.ctx.fillStyle = AppConfig.biomeColors[this.getBiomeForTile(x, y)]
    this.ctx.fill()
  }

  /**
   * Draws the footprint of a building.
   */
  private drawBuilding(b: BaseBuilding, isHighlight = false) {
    const { x: x0, y: y0, w, h } = b
    const { tileW, tileH } = AppConfig

    // 1. Calculate the screen center points of the four CORNER TILES.
    const [topLeftTile_sx, topLeftTile_sy] = this.worldToScreen(x0, y0)
    const [topRightTile_sx, topRightTile_sy] = this.worldToScreen(
      x0 + w - 1,
      y0
    )
    const [bottomLeftTile_sx, bottomLeftTile_sy] = this.worldToScreen(
      x0,
      y0 + h - 1
    )
    const [bottomRightTile_sx, bottomRightTile_sy] = this.worldToScreen(
      x0 + w - 1,
      y0 + h - 1
    )

    // 2. Use the centers of the corner tiles to find the true outer vertices
    //    of the entire building's diamond footprint.
    const topVertex_sy = topLeftTile_sy - tileH / 2
    const rightVertex_sx = topRightTile_sx + tileW / 2
    const bottomVertex_sy = bottomRightTile_sy + tileH / 2
    const leftVertex_sx = bottomLeftTile_sx - tileW / 2

    // 3. Draw the final shape by connecting these four extreme points.
    this.ctx.beginPath()
    this.ctx.moveTo(topLeftTile_sx, topVertex_sy)
    this.ctx.lineTo(rightVertex_sx, topRightTile_sy)
    this.ctx.lineTo(bottomRightTile_sx, bottomVertex_sy)
    this.ctx.lineTo(leftVertex_sx, bottomLeftTile_sy)
    this.ctx.closePath()

    if (isHighlight) {
      this.ctx.lineWidth = 0.7
      this.ctx.strokeStyle = AppConfig.selectionColor
      this.ctx.stroke()
    } else {
      // FIX: Use 'color' instead of 'fillColor'
      this.ctx.fillStyle = b.color
      this.ctx.strokeStyle = b.borderColor ?? AppConfig.borderColor // Use default if borderColor is missing
      this.ctx.lineWidth = 0.3
      this.ctx.fill()
      this.ctx.stroke()
    }
  }

  /**
   * Translates a screen pixel coordinate (sx, sy) into a map coordinate.
   * We will pass the camera state into this method.
   */
  public screenToWorld(
    sx: number,
    sy: number,
    camera: { x: number; y: number; scale: number }
  ): [number, number] {
    const tileW_half = AppConfig.tileW / 2
    const tileH_half = AppConfig.tileH / 2
    const lx = (sx - camera.x) / camera.scale
    const ly = (sy - camera.y) / camera.scale
    const u = lx / tileW_half
    const v = ly / tileH_half
    const worldX = (u + v) / 2
    const worldY = (v - u) / 2
    return [worldX, worldY]
  }

  private worldToScreen(x: number, y: number): [number, number] {
    const screenX = (x - y) * (AppConfig.tileW / 2)
    const screenY = (x + y) * (AppConfig.tileH / 2)
    return [screenX, screenY]
  }

  private getBiomeForTile(
    x: number,
    y: number
  ): keyof typeof AppConfig.biomeColors {
    const { fertile, plains } = AppConfig.biomeRegions
    if (
      x >= fertile.x1 &&
      x <= fertile.x2 &&
      y >= fertile.y1 &&
      y <= fertile.y2
    ) {
      return 'fertile'
    }
    if (x >= plains.x1 && x <= plains.x2 && y >= plains.y1 && y <= plains.y2) {
      return 'plains'
    }
    return 'badlands'
  }
}
