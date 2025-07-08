import { AppConfig } from '../config/appConfig'
import { useCameraStore } from '../state/useCameraStore'
import {
  mapFragmentShaderSource,
  mapVertexShaderSource,
} from './webgl/map-shaders'
import { createProgramFromSources } from './webgl/webgl-utils'

type Matrix3 = number[]

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

  // A new property to track if the advanced feature is supported.
  private derivativesSupported = false

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl

    // === 1. Check for extension support (THE CRITICAL STEP) ===
    const derivativesExt = gl.getExtension('OES_standard_derivatives')
    if (derivativesExt) {
      this.derivativesSupported = true
      console.log('Anti-aliasing (OES_standard_derivatives) is supported.')
    } else {
      console.warn(
        'Anti-aliasing (OES_standard_derivatives) is not supported. Grid may have visual artifacts at low zoom.'
      )
    }

    // === 2. Compile shaders and create program, passing our define ===
    this.mapProgram = createProgramFromSources(
      gl,
      mapVertexShaderSource,
      mapFragmentShaderSource,
      // We pass a "define" to our shader based on browser support.
      // This will add "#define USE_DERIVATIVES 1" to the top of our shader code.
      { USE_DERIVATIVES: this.derivativesSupported ? 1 : 0 }
    )

    // === 3. Look up attribute and uniform locations (no change here) ===
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

    // === 4. Create the geometry (no change here) ===
    const N = AppConfig.N
    const positions = [0, 0, N, 0, 0, N, 0, N, N, 0, N, N]
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    console.log('WebGLRenderer Initialized!')
  }

  // renderFrame() and calculateProjectionMatrix() have NO CHANGES from the last version.
  public renderFrame() {
    const gl = this.gl
    const camera = useCameraStore.getState()

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0.06, 0.06, 0.06, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.mapProgram)

    gl.uniform3fv(this.fertileColorLocation, [109 / 255, 159 / 255, 62 / 255])
    gl.uniform3fv(this.plainsColorLocation, [158 / 255, 180 / 255, 103 / 255])
    gl.uniform3fv(this.badlandsColorLocation, [191 / 255, 208 / 255, 152 / 255])
    gl.uniform1f(this.gridThicknessLocation, AppConfig.webgl.gridThickness)
    gl.uniform1f(this.gridDarknessLocation, AppConfig.webgl.gridDarkness)

    gl.enableVertexAttribArray(this.worldPosAttrLocation)
    gl.vertexAttribPointer(this.worldPosAttrLocation, 2, gl.FLOAT, false, 0, 0)

    const projectionMatrix = this.calculateProjectionMatrix(
      camera.x,
      camera.y,
      camera.scale
    )
    gl.uniformMatrix3fv(this.projectionUniformLocation, false, projectionMatrix)

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
