import { AppConfig } from '../config/appConfig'
import { useCameraStore } from '../state/useCameraStore'
import { useMapStore } from '../state/useMapStore' // We now need map data
import { type BaseBuilding } from '../types/map.types' // And the building type
import {
  mapFragmentShaderSource,
  mapVertexShaderSource,
} from './webgl/map-shaders'
import { createProgramFromSources } from './webgl/webgl-utils'

type Matrix3 = number[]

// A small helper to parse colors like 'rgb(r,g,b)' into [r,g,b] arrays
function parseRgb(rgbString: string): [number, number, number] {
  return (
    (rgbString.match(/\d+/g)?.map(Number) as [number, number, number]) || [
      0, 0, 0,
    ]
  )
}

export class WebGLRenderer {
  private gl: WebGLRenderingContext
  private mapProgram: WebGLProgram

  private worldPosAttrLocation: number
  private projectionUniformLocation: WebGLUniformLocation | null
  private fertileColorLocation: WebGLUniformLocation | null
  private plainsColorLocation: WebGLUniformLocation | null
  private badlandsColorLocation: WebGLUniformLocation | null
  private gridThicknessLocation: WebGLUniformLocation | null
  private gridDarknessLocation: WebGLUniformLocation | null

  // New uniform locations for object drawing
  private objectColorLocation: WebGLUniformLocation | null
  private isDrawingObjectLocation: WebGLUniformLocation | null

  // A single, reusable buffer for drawing all our buildings
  private objectBuffer: WebGLBuffer | null

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
      {
        USE_DERIVATIVES: this.derivativesSupported ? 1 : 0,
      }
    )

    this.worldPosAttrLocation = gl.getAttribLocation(
      this.mapProgram,
      'a_worldPosition'
    )

    // --- Look up ALL uniform locations ---
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

    // Create one buffer that we can reuse for all objects.
    this.objectBuffer = gl.createBuffer()

    console.log('WebGLRenderer Initialized!')
  }

  public renderFrame() {
    const gl = this.gl
    const camera = useCameraStore.getState()
    const { baseBuildings } = useMapStore.getState() // Get building data

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

    // === Draw Base Map ===
    // We'll create a dedicated plane for the map background now.
    this.drawMapPlane()

    // === Draw Buildings ===
    gl.uniform1f(this.isDrawingObjectLocation, 1.0) // Turn "Object Mode" ON
    for (const building of baseBuildings) {
      this.drawBuilding(building)
    }
  }

  private drawMapPlane() {
    const gl = this.gl
    const N = AppConfig.N
    const positions = [0, 0, N, 0, 0, N, 0, N, N, 0, N, N]

    // For drawing the map, bind a dedicated map buffer (good practice).
    const mapBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, mapBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    gl.enableVertexAttribArray(this.worldPosAttrLocation)
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0)

    // Set map uniforms
    gl.uniform1f(this.isDrawingObjectLocation, 0.0) // Turn "Object Mode" OFF
    gl.uniform3fv(this.fertileColorLocation, [109 / 255, 159 / 255, 62 / 255])
    gl.uniform3fv(this.plainsColorLocation, [158 / 255, 180 / 255, 103 / 255])
    gl.uniform3fv(this.badlandsColorLocation, [191 / 255, 208 / 255, 152 / 255])

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private drawBuilding(b: BaseBuilding) {
    const gl = this.gl
    const { x, y, w, h } = b

    // Generate the vertices for this building's diamond shape.
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

    // Use our single, reusable object buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer)
    // Put the geometry data for the CURRENT building into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)

    // Set up the attribute pointer again for this buffer
    gl.enableVertexAttribArray(this.worldPosAttrLocation)
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0)

    // Set the color uniform for this specific building
    const [r, g, b_color] = parseRgb(b.fillColor)
    gl.uniform3fv(this.objectColorLocation, [r / 255, g / 255, b_color / 255])

    // Draw the building
    gl.drawArrays(gl.TRIANGLES, 0, 6)
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
