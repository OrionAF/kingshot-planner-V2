// === Vertex Shader (Unchanged) ===
export const mapVertexShaderSource = /* glsl */ `
  attribute vec2 a_worldPosition;
  uniform mat3 u_projection;
  varying vec2 v_worldPosition;

  void main() {
    vec2 screenPosition = (u_projection * vec3(a_worldPosition, 1.0)).xy;
    gl_Position = vec4(screenPosition, 0.0, 1.0);
    v_worldPosition = a_worldPosition;
  }
`

// === Fragment Shader (Modified with Conditional Logic) ===
export const mapFragmentShaderSource = /* glsl */ `
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif

  precision mediump float;

  varying vec2 v_worldPosition;

  uniform vec3 u_fertileColor;
  uniform vec3 u_plainsColor;
  uniform vec3 u_badlandsColor;

  uniform float u_gridThickness;
  uniform float u_gridDarkness;

  void main() {
    vec2 fertile_min = vec2(480.0, 480.0);
    vec2 fertile_max = vec2(719.0, 719.0);
    vec2 plains_min = vec2(320.0, 320.0);
    vec2 plains_max = vec2(879.0, 879.0);

    vec3 finalColor;

    if (all(greaterThanEqual(v_worldPosition, fertile_min)) && all(lessThanEqual(v_worldPosition, fertile_max))) {
      finalColor = u_fertileColor;
    } else if (all(greaterThanEqual(v_worldPosition, plains_min)) && all(lessThanEqual(v_worldPosition, plains_max))) {
      finalColor = u_plainsColor;
    } else {
      finalColor = u_badlandsColor;
    }

    // === CONDITIONAL GRID LOGIC ===

    #if USE_DERIVATIVES == 1
      // === CONFIGURABLE GRID LOGIC ===
      vec2 one_pixel = fwidth(v_worldPosition) * u_gridThickness; // Use thickness
      vec2 grid = fract(v_worldPosition);
      float lineX = step(grid.x, one_pixel.x) + step(1.0 - grid.x, one_pixel.x);
      float lineY = step(grid.y, one_pixel.y) + step(1.0 - grid.y, one_pixel.y);
      float line = max(lineX, lineY);
      finalColor = mix(finalColor, finalColor * u_gridDarkness, line); // Use darkness
    #else
      // Simple, aliased grid for browsers that don't support the extension.
      vec2 grid = fract(v_worldPosition);
      if (grid.x < 0.05 || grid.x > 0.95 || grid.y < 0.05 || grid.y > 0.95) {
        finalColor *= 0.9;
      }
    #endif

    gl_FragColor = vec4(finalColor, 1.0);
  }
`
