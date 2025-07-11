/**
 * Creates and compiles a shader from source.
 * @param gl The WebGL rendering context.
 * @param type The type of shader (VERTEX_SHADER or FRAGMENT_SHADER).
 * @param source The GLSL source code for the shader.
 * @returns The compiled shader.
 */
function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  throw new Error('Failed to compile shader.');
}

/**
 * Creates a WebGL program from vertex and fragment shaders.
 * @param gl The WebGL rendering context.
 * @param vertexShader The compiled vertex shader.
 * @param fragmentShader The compiled fragment shader.
 * @returns The linked WebGL program.
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create program');
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }
  console.error('Program linking error:', gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  throw new Error('Failed to link program.');
}

/**
 * A helper to create a program, with support for preprocessor defines.
 * @param gl The WebGL rendering context.
 * @param vsSource The vertex shader source.
 * @param fsSource The fragment shader source.
 * @param defines An object of keys to prepend as #define statements.
 */
export function createProgramFromSources(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string,
  defines: { [key: string]: string | number } = {},
): WebGLProgram {
  const defineStr = Object.entries(defines)
    .map(([key, value]) => `#define ${key} ${value}`)
    .join('\n');

  const finalVsSource = `${defineStr}\n${vsSource}`;
  const finalFsSource = `${defineStr}\n${fsSource}`;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, finalVsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, finalFsSource);

  return createProgram(gl, vertexShader, fragmentShader);
}
