// src/core/webgl/map-shaders.ts

export const mapVertexShaderSource = /* glsl */ `
  attribute vec2 a_worldPosition;
  attribute vec2 a_texCoord; // <-- NEW: Texture coordinate attribute

  uniform mat3 u_projection;

  varying vec2 v_worldPosition;
  varying vec2 v_texCoord; // <-- NEW: Pass texCoord to fragment shader

  void main() {
    vec2 screenPosition = (u_projection * vec3(a_worldPosition, 1.0)).xy;
    gl_Position = vec4(screenPosition, 0.0, 1.0);

    v_worldPosition = a_worldPosition;
    v_texCoord = a_texCoord; // <-- Pass it through
  }
`;

export const mapFragmentShaderSource = /* glsl */ `
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
  precision mediump float;

  varying vec2 v_worldPosition;
  varying vec2 v_texCoord; // <-- NEW: Receive texCoord from vertex shader

  // --- Map Uniforms ---
  uniform vec3 u_fertileColor;
  uniform vec3 u_plainsColor;
  uniform vec3 u_badlandsColor;
  uniform float u_gridThickness;
  uniform float u_gridDarkness;

  // --- Object & Territory Uniforms ---
  uniform vec3 u_objectColor;
  uniform float u_objectAlpha;

  // --- Texture Uniforms ---
  uniform sampler2D u_textureSampler; // <-- NEW: The image texture
  uniform float u_isDrawingTexture;   // <-- NEW: Flag to enable texture mode

  // --- Mode Flags ---
  uniform float u_isDrawingObject;
  uniform float u_isDrawingTerritory;

  void main() {
    vec4 finalColor; // Use vec4 to handle alpha properly

    // The order of these checks is the render order (top-most first)
    if (u_isDrawingTexture > 0.5) {
      // Draw a textured object (building image)
      finalColor = texture2D(u_textureSampler, v_texCoord);
    } else if (u_isDrawingObject > 0.5) {
      // Draw a solid color object (player, ghost, selection)
      finalColor = vec4(u_objectColor, u_objectAlpha);
    } else if (u_isDrawingTerritory > 0.5) {
      // Draw semi-transparent territory
      finalColor = vec4(u_objectColor, u_objectAlpha);
    } else {
      // Draw the base map plane and grid
      vec3 mapColor;
      vec2 fertile_min = vec2(480.0, 480.0);
      vec2 fertile_max = vec2(719.0, 719.0);
      vec2 plains_min = vec2(320.0, 320.0);
      vec2 plains_max = vec2(879.0, 879.0);

      if (all(greaterThanEqual(v_worldPosition, fertile_min)) && all(lessThanEqual(v_worldPosition, fertile_max))) {
        mapColor = u_fertileColor;
      } else if (all(greaterThanEqual(v_worldPosition, plains_min)) && all(lessThanEqual(v_worldPosition, plains_max))) {
        mapColor = u_plainsColor;
      } else {
        mapColor = u_badlandsColor;
      }

      #if USE_DERIVATIVES
        vec2 one_pixel = fwidth(v_worldPosition) * u_gridThickness;
        vec2 grid = fract(v_worldPosition);
        float lineX = step(grid.x, one_pixel.x) + step(1.0 - grid.x, one_pixel.x);
        float lineY = step(grid.y, one_pixel.y) + step(1.0 - grid.y, one_pixel.y);
        float line = max(lineX, lineY);
        mapColor = mix(mapColor, mapColor * u_gridDarkness, line);
      #endif

      finalColor = vec4(mapColor, 1.0);
    }

    // Premultiply alpha for correct blending with the dark background
    gl_FragColor = vec4(finalColor.rgb * finalColor.a, finalColor.a);
  }
`;
