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
`;

// === Fragment Shader (Modified with Conditional Logic) ===
export const mapFragmentShaderSource = /* glsl */ `
  // ... (extension and precision lines are unchanged) ...
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
  precision mediump float;

  varying vec2 v_worldPosition;

  // Biome colors
  uniform vec3 u_fertileColor;
  uniform vec3 u_plainsColor;
  uniform vec3 u_badlandsColor;

  // === NEW UNIFORMS ===
  // This will be the solid color for drawing objects like buildings
  uniform vec3 u_objectColor;
  // This will be our "switch" between modes. 1.0 for object, 0.0 for map.
  uniform float u_isDrawingObject;

  // Grid uniforms (no change)
  uniform float u_gridThickness;
  uniform float u_gridDarkness;

  void main() {
    vec3 finalColor;

    // === NEW CONDITIONAL LOGIC ===
    // If the "switch" is on (1.0), just use the object color directly.
    if (u_isDrawingObject == 1.0) {
      finalColor = u_objectColor;
    }
    // Otherwise, run all the biome and grid logic from before.
    else {
      vec2 fertile_min = vec2(480.0, 480.0);
      vec2 fertile_max = vec2(719.0, 719.0);
      vec2 plains_min = vec2(320.0, 320.0);
      vec2 plains_max = vec2(879.0, 879.0);

      if (all(greaterThanEqual(v_worldPosition, fertile_min)) && all(lessThanEqual(v_worldPosition, fertile_max))) {
        finalColor = u_fertileColor;
      } else if (all(greaterThanEqual(v_worldPosition, plains_min)) && all(lessThanEqual(v_worldPosition, plains_max))) {
        finalColor = u_plainsColor;
      } else {
        finalColor = u_badlandsColor;
      }

      vec2 one_pixel = fwidth(v_worldPosition) * u_gridThickness;
      vec2 grid = fract(v_worldPosition);
      float lineX = step(grid.x, one_pixel.x) + step(1.0 - grid.x, one_pixel.x);
      float lineY = step(grid.y, one_pixel.y) + step(1.0 - grid.y, one_pixel.y);
      float line = max(lineX, lineY);
      finalColor = mix(finalColor, finalColor * u_gridDarkness, line);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
