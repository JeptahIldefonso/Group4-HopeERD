'use client';

import React, { useEffect, useRef } from 'react';

// ============================================================================
// LIGHT ENTERPRISE TOPOGRAPHIC PRECISION CONFIGURATION
// Subtle pale gray-green elevation contours on off-white/light-gray background
// ============================================================================
export const TOPO_CONFIG = {
  // Density of contour elevation rings across screen (spacious, clear)
  lineDensity: 20.0,
  // Standard contour line width in physical screen pixels
  lineWidthPixels: 1.10,
  // Index contour line width (every 5th line slightly bolder)
  indexLineWidthPixels: 1.90,
  // Visibility: low opacity (~14-22%) for subtle, elegant background texture
  lineOpacity: 0.16,
  indexLineOpacity: 0.26,
  blurAmount: '0px',
  vignetteOpacity: 0.40,

  // Speed of gentle undulating terrain drift
  animationSpeed: 0.020,

  // Soft cursor interaction (gentle subtle glimmer, not an aggressive starburst)
  starSpikeLength: 0.055,
  starDiagSpikeLength: 0.035,
  starBrightness: 0.12,
  mouseLerp: 0.08,
  mouseFadeSpeed: 0.06,

  // Micro film grain to eliminate digital banding
  grainStrength: 0.003,

  // Color Palette: Light enterprise colors
  // Off-white / light-gray base with pale gray-green contours
  colors: {
    baseBg: [0.961, 0.965, 0.957], // #F5F6F4 Main page background
    surfaceSubtle: [0.941, 0.949, 0.937], // #F0F2EF Secondary surface
    surfaceSection: [0.914, 0.929, 0.914], // #E9EDE9 Subtle section background
    contourSage: [0.550, 0.620, 0.570], // Pale gray-green (#8CA092 muted stroke)
    indexHighlight: [0.380, 0.480, 0.420], // Index contour (#617A6B)
    // Subtle mouse glimmer
    starNucleus: [0.85, 0.92, 0.88],
    starHalo: [0.88, 0.94, 0.90],
    starSpike: [0.82, 0.90, 0.85],
    starDiag: [0.86, 0.92, 0.88],
  },
};

const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_mouse_intensity;

// 2D Simplex Noise for natural geographic elevation contours
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = st;
  uv.x *= aspect;

  vec2 mouse = u_mouse;
  mouse.x *= aspect;

  // Cartographic diagonal rotation (~26 degree slope)
  float angle = -0.45;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 p = rot * uv;

  float t = u_time * ${TOPO_CONFIG.animationSpeed.toFixed(4)};

  // Multi-octave domain warped noise creates authentic landform contours
  float n1 = snoise(p * 1.15 + vec2(t * 0.22, t * 0.09));
  float n2 = snoise(p * 2.30 - vec2(t * 0.16, n1 * 0.45));
  float n3 = snoise(p * 4.20 + vec2(n2 * 0.35, t * 0.11));

  // Pure natural elevation heightmap
  float elevation = (n1 * 0.52 + n2 * 0.32 + n3 * 0.16) * 0.5 + 0.5;

  // Topographic contour calculation
  float contourCoord = elevation * ${TOPO_CONFIG.lineDensity.toFixed(1)};
  float distFromCenter = abs(fract(contourCoord) - 0.5);

  // Index contour (every 5th line is slightly bolder)
  float indexCoord = contourCoord / 5.0;
  float indexDist = abs(fract(indexCoord) - 0.5);

  // Crisp, sharp contour lines anti-aliased over screen pixels (zero blur)
  #ifdef HAS_DERIVATIVES
    float fw = length(vec2(dFdx(contourCoord), dFdy(contourCoord)));
    float distInPixels = distFromCenter / max(fw, 0.0008);
    float halfLine = ${(TOPO_CONFIG.lineWidthPixels * 0.5).toFixed(2)};
    float line = 1.0 - smoothstep(max(halfLine - 0.5, 0.0), halfLine + 0.5, distInPixels);

    float indexFw = length(vec2(dFdx(indexCoord), dFdy(indexCoord)));
    float indexDistInPixels = indexDist / max(indexFw, 0.0004);
    float halfIndex = ${(TOPO_CONFIG.indexLineWidthPixels * 0.5).toFixed(2)};
    float indexLine = 1.0 - smoothstep(max(halfIndex - 0.5, 0.0), halfIndex + 0.5, indexDistInPixels);
  #else
    float line = 1.0 - smoothstep(0.002, 0.010, distFromCenter);
    float indexLine = 1.0 - smoothstep(0.003, 0.016, indexDist);
  #endif

  // Colors: Light enterprise base
  vec3 c_bg_base    = vec3(${TOPO_CONFIG.colors.baseBg.join(', ')});
  vec3 c_bg_subtle  = vec3(${TOPO_CONFIG.colors.surfaceSubtle.join(', ')});
  vec3 c_bg_section = vec3(${TOPO_CONFIG.colors.surfaceSection.join(', ')});
  vec3 c_sage       = vec3(${TOPO_CONFIG.colors.contourSage.join(', ')});
  vec3 c_hi         = vec3(${TOPO_CONFIG.colors.indexHighlight.join(', ')});

  vec3 c_star_nucleus = vec3(${TOPO_CONFIG.colors.starNucleus.join(', ')});
  vec3 c_star_halo    = vec3(${TOPO_CONFIG.colors.starHalo.join(', ')});
  vec3 c_star_spike   = vec3(${TOPO_CONFIG.colors.starSpike.join(', ')});
  vec3 c_star_diag    = vec3(${TOPO_CONFIG.colors.starDiag.join(', ')});

  // Gentle light elevation gradient
  vec3 col = mix(c_bg_base, c_bg_subtle, smoothstep(0.15, 0.75, elevation));
  col = mix(col, c_bg_section, smoothstep(0.40, 0.85, elevation) * 0.25);

  // Render subtle contour lines in pale gray-green
  col = mix(col, c_sage, line * ${TOPO_CONFIG.lineOpacity.toFixed(2)});
  col = mix(col, c_hi, indexLine * ${TOPO_CONFIG.indexLineOpacity.toFixed(2)});

  // Soft subtle cursor tracking
  vec2 toMouse = uv - mouse;
  float r = length(toMouse);

  float nucleus = exp(-r * 320.0);
  float halo = exp(-r * 55.0) * 0.35;

  float spikeLen = ${TOPO_CONFIG.starSpikeLength.toFixed(4)};
  float taperH = pow(max(0.0, 1.0 - abs(toMouse.x) / spikeLen), 2.2);
  float profileH = exp(-abs(toMouse.y) * 450.0);
  float spikeH = taperH * profileH;

  float taperV = pow(max(0.0, 1.0 - abs(toMouse.y) / spikeLen), 2.2);
  float profileV = exp(-abs(toMouse.x) * 450.0);
  float spikeV = taperV * profileV;

  vec2 diagMouse = mat2(0.7071, -0.7071, 0.7071, 0.7071) * toMouse;
  float diagLen = ${TOPO_CONFIG.starDiagSpikeLength.toFixed(4)};
  float taperD1 = pow(max(0.0, 1.0 - abs(diagMouse.x) / diagLen), 2.4);
  float profileD1 = exp(-abs(diagMouse.y) * 500.0);
  float spikeD1 = taperD1 * profileD1;

  float taperD2 = pow(max(0.0, 1.0 - abs(diagMouse.y) / diagLen), 2.4);
  float profileD2 = exp(-abs(diagMouse.x) * 500.0);
  float spikeD2 = taperD2 * profileD2;

  vec3 starCol = c_star_nucleus * nucleus
               + c_star_halo * halo * 0.50
               + c_star_spike * (spikeH + spikeV) * 0.60
               + c_star_diag * (spikeD1 + spikeD2) * 0.40;

  col += starCol * (${TOPO_CONFIG.starBrightness.toFixed(2)} * u_mouse_intensity);

  // Subtle film grain
  float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * ${TOPO_CONFIG.grainStrength.toFixed(4)};
  col += vec3(grain);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function TopographicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Accessibility: Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        mouse.intensity = 0;
        mouse.targetIntensity = 0;
      }
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    let gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) {
      gl = canvas.getContext('experimental-webgl', {
        alpha: false,
        antialias: false,
      }) as WebGLRenderingContext | null;
    }

    // 2D Canvas Fallback
    if (!gl) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#F5F6F4');
      grad.addColorStop(0.6, '#F0F2EF');
      grad.addColorStop(1, '#E9EDE9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('Shader compile error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const ext = gl.getExtension('OES_standard_derivatives');
    const prefix = ext
      ? '#define HAS_DERIVATIVES\n#extension GL_OES_standard_derivatives : enable\n'
      : '';

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, prefix + FRAGMENT_SHADER_SOURCE);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouseIntensity = gl.getUniformLocation(program, 'u_mouse_intensity');

    const mouse = {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5,
      intensity: 0,
      targetIntensity: 0,
    };
    let animationFrameId: number;
    let lastTime = 0;
    let accumulatedTime = 0;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      canvas.width = width;
      canvas.height = height;
      gl?.viewport(0, 0, width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isReducedMotion) return;
      mouse.targetX = e.clientX / window.innerWidth;
      mouse.targetY = 1.0 - e.clientY / window.innerHeight;
      mouse.targetIntensity = 1.0;
    };

    const handleMouseLeave = () => {
      mouse.targetIntensity = 0.0;
    };

    const handleMouseEnter = () => {
      if (isReducedMotion) return;
      mouse.targetIntensity = 1.0;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    handleResize();

    const render = (now: number) => {
      if (!gl) return;

      if (!isReducedMotion) {
        const delta = lastTime ? (now - lastTime) * 0.001 : 0.016;
        accumulatedTime += Math.min(delta, 0.1);
        lastTime = now;

        mouse.x += (mouse.targetX - mouse.x) * TOPO_CONFIG.mouseLerp;
        mouse.y += (mouse.targetY - mouse.y) * TOPO_CONFIG.mouseLerp;
        mouse.intensity +=
          (mouse.targetIntensity - mouse.intensity) *
          TOPO_CONFIG.mouseFadeSpeed;
      } else {
        accumulatedTime = 0.5;
        mouse.intensity = 0;
      }

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uTime, accumulatedTime);
      gl.uniform1f(uMouseIntensity, mouse.intensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      mediaQuery.removeEventListener('change', handleMotionChange);
      cancelAnimationFrame(animationFrameId);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden select-none bg-[#F5F6F4]"
      aria-hidden="true"
    >
      {/* Topographic WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="h-full w-full transform-gpu"
        style={{
          filter: TOPO_CONFIG.blurAmount !== '0px' ? `blur(${TOPO_CONFIG.blurAmount})` : undefined,
        }}
      />

      {/* Subtle radial soft vignette keeping the central authentication zone visually clean and calm */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, rgba(245, 246, 244, 0.88) 25%, rgba(245, 246, 244, 0.40) 85%)`,
        }}
      />
    </div>
  );
}
