// src/core/webgl/map-shaders.ts

export const mapVertexShaderSource = /* glsl */ `
  attribute vec2 a_worldPosition;
  uniform mat3 u_projection;
  varying vec2 v_worldPosition;

  void main() {
    // Project the isometric world coordinates to screen space.
    // The Z component is unused in our 2D projection, so it's 1.0.
    vec2 screenPosition = (u_projection * vec3(a_worldPosition, 1.0)).xy;

    // Final position for the vertex in clip space.
    gl_Position = vec4(screenPosition, 0.0, 1.0);

    // Pass the original world position to the fragment shader.
    v_worldPosition = a_worldPosition;
  }
`;

export const mapFragmentShaderSource = /* glsl */ `
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
  precision mediump float;

  varying vec2 v_worldPosition;

  // Uniforms for map plane rendering
  uniform vec3 u_fertileColor;
  uniform vec3 u_plainsColor;
  uniform vec3 u_badlandsColor;
  uniform float u_gridThickness;
  uniform float u_gridDarkness;

  // Uniforms for drawing objects and territory
  uniform vec3 u_objectColor;
  uniform float u_objectAlpha;
  uniform float u_isDrawingObject;
  uniform float u_isDrawingTerritory; // <-- NEW UNIFORM

  void main() {
    vec3 finalColor;
    float finalAlpha = 1.0;

    // Use a chain of if/else to determine what to draw.
    // This is more robust than separate if statements.
    if (u_isDrawingObject > 0.5) {
      // We are drawing a solid object (like a building or player).
      finalColor = u_objectColor;
      finalAlpha = u_objectAlpha;
    } else if (u_isDrawingTerritory > 0.5) {
      // We are drawing semi-transparent territory.
      finalColor = u_objectColor;
      finalAlpha = u_objectAlpha;
    } else {
      // We are drawing the base map plane and grid.
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

      // Grid line calculation
      #if USE_DERIVATIVES
        vec2 one_pixel = fwidth(v_worldPosition) * u_gridThickness;
        vec2 grid = fract(v_worldPosition);
        float lineX = step(grid.x, one_pixel.x) + step(1.0 - grid.x, one_pixel.x);
        float lineY = step(grid.y, one_pixel.y) + step(1.0 - grid.y, one_pixel.y);
        float line = max(lineX, lineY);
        finalColor = mix(finalColor, finalColor * u_gridDarkness, line);
      #endif
    }

    // Set the final color and alpha. Alpha blending must be enabled on the context.
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;
