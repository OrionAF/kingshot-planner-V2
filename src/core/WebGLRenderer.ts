import { AppConfig } from '../config/appConfig'
import { useCameraStore } from '../state/useCameraStore'
import { useMapStore } from '../state/useMapStore'
import { useUiStore } from '../state/useUiStore'
import { screenToWorld } from './coordinate-utils' // Import screenToWorld
import {
  mapFragmentShaderSource,
  mapVertexShaderSource,
} from './webgl/map-shaders'
import { createProgramFromSources } from './webgl/webgl-utils'

type Matrix3 = number[]

function parseColor(colorString: string): [number, number, number] {
  if (colorString.startsWith('#')) {
    const r = parseInt(colorString.slice(1, 3), 16) / 255
    const g = parseInt(colorString.slice(3, 5), 16) / 255
    const b = parseInt(colorString.slice(5, 7), 16) / 255
    return [r, g, b]
  } else if (colorString.startsWith('rgb')) {
    return (
      (colorString.match(/\d+/g)?.map(Number) as [number, number, number]) || [
        0, 0, 0,
      ]
    ).map((c) => c / 255) as [number, number, number]
  }
  return [0, 0, 0]
}

type DrawableObject = {
  x: number
  y: number
  w: number
  h: number
  color?: string
}

export class WebGLRenderer {
  private gl: WebGLRenderingContext
  private mapProgram: WebGLProgram
  // ... attributes and most uniforms ...
  private worldPosAttrLocation: number
  private projectionUniformLocation: WebGLUniformLocation | null
  private fertileColorLocation: WebGLUniformLocation | null
  private plainsColorLocation: WebGLUniformLocation | null
  private badlandsColorLocation: WebGLUniformLocation | null
  private gridThicknessLocation: WebGLUniformLocation | null
  private gridDarknessLocation: WebGLUniformLocation | null
  private objectColorLocation: WebGLUniformLocation | null
  private isDrawingObjectLocation: WebGLUniformLocation | null
  private objectAlphaLocation: WebGLUniformLocation | null

  // ... buffers ...
  private objectBuffer: WebGLBuffer | null
  private mapPlaneBuffer: WebGLBuffer | null
  private derivativesSupported = false

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
    const derivativesExt = gl.getExtension('OES_standard_derivatives')
    if (derivativesExt) {
      this.derivativesSupported = true
    }

    this.mapProgram = createProgramFromSources(
      gl,
      mapVertexShaderSource,
      mapFragmentShaderSource,
      { USE_DERIVATIVES: this.derivativesSupported ? 1 : 0 }
    )

    // ... all location lookups remain the same ...
    this.worldPosAttrLocation = gl.getAttribLocation(
      this.mapProgram,
      'a_worldPosition'
    )
    this.projectionUniformLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_projection'
    )
    this.fertileColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_fertileColor'
    )
    this.plainsColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_plainsColor'
    )
    this.badlandsColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_badlandsColor'
    )
    this.gridThicknessLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_gridThickness'
    )
    this.gridDarknessLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_gridDarkness'
    )
    this.objectColorLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_objectColor'
    )
    this.isDrawingObjectLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_isDrawingObject'
    )
    this.objectAlphaLocation = gl.getUniformLocation(
      this.mapProgram,
      'u_objectAlpha'
    )

    this.objectBuffer = gl.createBuffer()
    this.mapPlaneBuffer = this.createMapPlaneBuffer()
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    console.log('WebGLRenderer Initialized!')
  }

  public renderFrame() {
    const gl = this.gl
    const camera = useCameraStore.getState()
    const { baseBuildings, players } = useMapStore.getState()
    const {
      isPlacingPlayer,
      playerToPlace,
      mouseWorldPosition,
      isValidPlacement,
    } = useUiStore.getState()

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0.06, 0.06, 0.06, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.mapProgram)

    const projectionMatrix = this.calculateProjectionMatrix(
      camera.x,
      camera.y,
      camera.scale
    )
    gl.uniformMatrix3fv(this.projectionUniformLocation, false, projectionMatrix)
    gl.uniform1f(this.gridThicknessLocation, AppConfig.webgl.gridThickness)
    gl.uniform1f(this.gridDarknessLocation, AppConfig.webgl.gridDarkness)
    this.drawMapPlane()

    gl.uniform1f(this.isDrawingObjectLocation, 1.0)
    for (const building of baseBuildings) {
      this.drawObject(building)
    }
    for (const player of players) {
      this.drawObject(player, 1.0)
    }

    // Check device type once
    const isDesktop = window.matchMedia('(min-width: 769px)').matches

    // --- RENDER DESKTOP GHOST (on hover) ---
    if (isPlacingPlayer && playerToPlace && mouseWorldPosition && isDesktop) {
      const ghostColor = isValidPlacement ? '#28a745' : '#dc3545'
      this.drawObject(
        {
          x: Math.round(mouseWorldPosition.x),
          y: Math.round(mouseWorldPosition.y),
          w: AppConfig.player.width,
          h: AppConfig.player.height,
          color: ghostColor,
        },
        0.6
      )
    }

    // --- RENDER MOBILE GHOST (at center) ---
    if (isPlacingPlayer && playerToPlace && !isDesktop) {
      const [centerX, centerY] = screenToWorld(
        gl.canvas.width / 2,
        gl.canvas.height / 2,
        camera
      )
      const ghostColor = isValidPlacement ? '#28a745' : '#dc3545'
      this.drawObject(
        {
          x: Math.round(centerX),
          y: Math.round(centerY),
          w: AppConfig.player.width,
          h: AppConfig.player.height,
          color: ghostColor,
        },
        0.6
      )
    }
  }

  // No changes needed below this line
  private drawObject(obj: DrawableObject, alpha = 1.0) {
    const gl = this.gl
    const { x, y, w, h, color } = obj
    if (!color) return
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
    ]
    gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(this.worldPosAttrLocation)
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0)
    const [r, g, b] = parseColor(color)
    gl.uniform3fv(this.objectColorLocation, [r, g, b])
    gl.uniform1f(this.objectAlphaLocation, alpha)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private drawMapPlane() {
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mapPlaneBuffer)
    gl.enableVertexAttribArray(this.worldPosAttrLocation)
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0)
    gl.uniform1f(this.isDrawingObjectLocation, 0.0)
    gl.uniform3fv(
      this.fertileColorLocation,
      parseColor(AppConfig.biomeColors.fertile)
    )
    gl.uniform3fv(
      this.plainsColorLocation,
      parseColor(AppConfig.biomeColors.plains)
    )
    gl.uniform3fv(
      this.badlandsColorLocation,
      parseColor(AppConfig.biomeColors.badlands)
    )
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private createMapPlaneBuffer(): WebGLBuffer | null {
    const gl = this.gl
    const N = AppConfig.N
    const positions = [0, 0, N, 0, 0, N, 0, N, N, 0, N, N]
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    return buffer
  }

  private calculateProjectionMatrix(
    camX: number,
    camY: number,
    camScale: number
  ): Matrix3 {
    const { tileW, tileH } = AppConfig
    const { width, height } = this.gl.canvas
    const clipX = 2.0 / width
    const clipY = -2.0 / height
    const a = (tileW / 2) * camScale * clipX
    const b = (tileH / 2) * camScale * clipY
    const c = (-tileW / 2) * camScale * clipX
    const d = (tileH / 2) * camScale * clipY
    const tx = camX * clipX - 1
    const ty = camY * clipY + 1
    return [a, b, 0, c, d, 0, tx, ty, 1]
  }
}
