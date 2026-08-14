/* ============================================
   液态金属流动动态背景 - 原生 WebGL 实现
   配色：品牌青绿色系
   ============================================ */

(function() {
  'use strict';

  // 检测支持性
  function supportsWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      return !!window.WebGL2RenderingContext && !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !supportsWebGL2()) return;

  // 十六进制转 RGB [0-1]
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ];
  }

  // 顶点着色器
  const vertexShader = `#version 300 es
    in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // 片元着色器 - 液态金属效果
  const fragmentShader = `#version 300 es
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uDetail;
    uniform float uGlow;
    uniform float uCoreSize;
    uniform float uSwirl;
    uniform float uFold;
    uniform float uBlackPoint;
    uniform float uBrightness;
    uniform float uGrain;
    uniform float uGrainIntensity;
    uniform float uOpacity;
    uniform vec2 uMouse;
    uniform float uMouseStrength;
    uniform float uEnableMouse;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    out vec4 fragColor;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      float time = iTime * uSpeed;
      vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;

      vec2 drift = vec2(0.0);
      if (uEnableMouse > 0.5) {
        drift = (uMouse - 0.5) * uMouseStrength * 2.0;
      }
      p += drift;

      vec2 i = p;
      float c = 0.0;
      float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
      float d = length(p);
      float rot = d + time + p.x * uSwirl;

      float cosRot = cos(rot);
      mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
      float glowCore = uGlow * uCoreSize;

      for (float n = 0.0; n < 8.0; n++) {
        if (n >= uDetail) break;
        p *= warp;
        float t = r - time / (n + 3.0);
        i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
        c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
      }

      c /= 6.0;

      float intensity = max(c - uBlackPoint, 0.0) * uBrightness;
      float g = clamp(intensity, 0.0, 1.0);

      float mid = 0.45;
      vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));
      col = mix(col, uColor3, smoothstep(mid, 1.0, g));

      float a = g;
      if (uGrain > 0.5) {
        float gr = hash(gl_FragCoord.xy + iTime);
        a += (gr - 0.5) * uGrainIntensity;
      }
      a = clamp(a, 0.0, 1.0) * uOpacity;
      fragColor = vec4(col * a, a);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function createTriangle(gl) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    return vao;
  }

  function init() {
    const canvas = document.createElement('canvas');
    canvas.id = 'molten-metal-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });

    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    const vao = createTriangle(gl);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // 品牌青绿色系配色 - 液态金属效果
    const config = {
      color1: '#0F766E',      // 深色 teal-700 阴影色
      color2: '#2DD4BF',      // 中色 teal-400 流动丝
      color3: '#CCFBF1',      // 亮色 teal-100 高光核心
      speed: 0.25,
      scale: 3.5,
      detail: 4,
      glow: 1.4,
      coreSize: 0.08,
      swirl: 0.8,
      fold: -0.18,
      blackPoint: 0.15,
      brightness: 1.1,
      grain: true,
      grainIntensity: 0.04,
      opacity: 0.5,
      mouseInteraction: true,
      mouseStrength: 0.2
    };

    const uniforms = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uDetail: gl.getUniformLocation(program, 'uDetail'),
      uGlow: gl.getUniformLocation(program, 'uGlow'),
      uCoreSize: gl.getUniformLocation(program, 'uCoreSize'),
      uSwirl: gl.getUniformLocation(program, 'uSwirl'),
      uFold: gl.getUniformLocation(program, 'uFold'),
      uBlackPoint: gl.getUniformLocation(program, 'uBlackPoint'),
      uBrightness: gl.getUniformLocation(program, 'uBrightness'),
      uGrain: gl.getUniformLocation(program, 'uGrain'),
      uGrainIntensity: gl.getUniformLocation(program, 'uGrainIntensity'),
      uOpacity: gl.getUniformLocation(program, 'uOpacity'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uMouseStrength: gl.getUniformLocation(program, 'uMouseStrength'),
      uEnableMouse: gl.getUniformLocation(program, 'uEnableMouse'),
      uColor1: gl.getUniformLocation(program, 'uColor1'),
      uColor2: gl.getUniformLocation(program, 'uColor2'),
      uColor3: gl.getUniformLocation(program, 'uColor3')
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    function handleMouseMove(e) {
      targetMouse = [
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight
      ];
    }

    function handleMouseLeave() {
      targetMouse = [0.5, 0.5];
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    resize();

    let raf = 0;
    let isVisible = true;
    const t0 = performance.now();

    function loop(t) {
      const time = (t - t0) * 0.001;

      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform1f(uniforms.iTime, time);
      gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uSpeed, config.speed);
      gl.uniform1f(uniforms.uScale, config.scale);
      gl.uniform1f(uniforms.uDetail, config.detail);
      gl.uniform1f(uniforms.uGlow, config.glow);
      gl.uniform1f(uniforms.uCoreSize, Math.max(config.coreSize, 0.001));
      gl.uniform1f(uniforms.uSwirl, config.swirl);
      gl.uniform1f(uniforms.uFold, config.fold);
      gl.uniform1f(uniforms.uBlackPoint, config.blackPoint);
      gl.uniform1f(uniforms.uBrightness, config.brightness);
      gl.uniform1f(uniforms.uGrain, config.grain ? 1.0 : 0.0);
      gl.uniform1f(uniforms.uGrainIntensity, config.grainIntensity);
      gl.uniform1f(uniforms.uOpacity, config.opacity);
      gl.uniform2f(uniforms.uMouse, currentMouse[0], currentMouse[1]);
      gl.uniform1f(uniforms.uMouseStrength, config.mouseStrength);
      gl.uniform1f(uniforms.uEnableMouse, config.mouseInteraction ? 1.0 : 0.0);

      const c1 = hexToRgb(config.color1);
      gl.uniform3f(uniforms.uColor1, c1[0], c1[1], c1[2]);
      const c2 = hexToRgb(config.color2);
      gl.uniform3f(uniforms.uColor2, c2[0], c2[1], c2[2]);
      const c3 = hexToRgb(config.color3);
      gl.uniform3f(uniforms.uColor3, c3[0], c3[1], c3[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (isVisible) {
        raf = requestAnimationFrame(loop);
      }
    }

    function handleVisibility() {
      isVisible = !document.hidden;
      if (isVisible && !raf) {
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    raf = requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
