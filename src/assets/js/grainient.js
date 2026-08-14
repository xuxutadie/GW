/* ============================================
   Grainient 颗粒渐变流动背景 - 原生 WebGL 实现
   高对比度版本，确保效果可见
   ============================================ */

(function() {
  'use strict';

  function supportsWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      return !!window.WebGL2RenderingContext && !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !supportsWebGL2()) {
    // 降级：CSS渐变保底
    document.body.style.background = 'linear-gradient(135deg, #0F766E 0%, #14B8A6 35%, #5EEAD4 65%, #CCFBF1 100%)';
    document.body.style.backgroundAttachment = 'fixed';
    return;
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ];
  }

  const vertexShader = `#version 300 es
    in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // 高对比度版本 - 不输出alpha，直接输出不透明颜色
  const fragmentShader = `#version 300 es
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uTimeSpeed;
    uniform float uWarpStrength;
    uniform float uWarpFrequency;
    uniform float uWarpSpeed;
    uniform float uWarpAmplitude;
    uniform float uRotationAmount;
    uniform float uNoiseScale;
    uniform float uGrainAmount;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uZoom;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    out vec4 fragColor;

    #define S(a,b,t) smoothstep(a,b,t)

    mat2 Rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
      return fract(sin(p) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float n = mix(
        mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y);
      return 0.5 + 0.5 * n;
    }

    void main() {
      float t = iTime * uTimeSpeed;
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      float ratio = iResolution.x / iResolution.y;
      vec2 tuv = uv - 0.5;
      tuv /= max(uZoom, 0.001);

      float degree = noise(vec2(t * 0.15, tuv.x * tuv.y) * uNoiseScale);
      float yBackup = tuv.y;
      tuv.y *= 1.0 / ratio;
      tuv *= Rot((degree - 0.5) * uRotationAmount);
      tuv.y = yBackup;

      float frequency = uWarpFrequency;
      float ws = max(uWarpStrength, 0.001);
      float amplitude = uWarpAmplitude / ws;
      float warpTime = t * uWarpSpeed;
      tuv.x += sin(tuv.y * frequency + warpTime) / amplitude;
      tuv.y += sin(tuv.x * (frequency * 1.3) + warpTime * 0.7) / (amplitude * 0.6);

      // 三色渐变 - 斜向混合
      float blend = (tuv.x + tuv.y) * 0.5 + 0.5;
      vec3 col;
      if (blend < 0.5) {
        col = mix(uColor3, uColor2, blend * 2.0);
      } else {
        col = mix(uColor2, uColor1, (blend - 0.5) * 2.0);
      }

      // 添加流动光带
      float light = sin(tuv.x * 3.0 + t * 0.8) * 0.5 + 0.5;
      light *= sin(tuv.y * 2.5 - t * 0.6) * 0.5 + 0.5;
      col = mix(col, uColor1, light * 0.3);

      // 颗粒感
      float grain = fract(sin(dot(uv * 2.0 + vec2(iTime * 0.02), vec2(12.9898, 78.233))) * 43758.5453);
      col += (grain - 0.5) * uGrainAmount;

      // 对比度和饱和度
      col = (col - 0.5) * uContrast + 0.5;
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);
      col = clamp(col, 0.0, 1.0);

      // 完全不透明输出
      fragColor = vec4(col, 1.0);
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
    canvas.id = 'grainient-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-2;';
    document.body.insertBefore(canvas, document.body.firstChild);

    // 保底纯色背景，防止WebGL失败时白底
    document.body.style.background = '#0F766E';

    const gl = canvas.getContext('webgl2', {
      alpha: false,  // 关键：不使用alpha通道，直接输出不透明颜色
      antialias: false,
      depth: false,
      stencil: false
    });

    if (!gl) {
      console.warn('WebGL2 not supported, using CSS gradient fallback');
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    const vao = createTriangle(gl);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // 高对比度青绿色配色
    const config = {
      color1: '#F0FDFA',      // 近白亮部 teal-50
      color2: '#14B8A6',      // 品牌主色 teal-500
      color3: '#134E4A',      // 深暗部 teal-900
      timeSpeed: 0.3,
      warpStrength: 0.9,
      warpFrequency: 2.0,
      warpSpeed: 0.7,
      warpAmplitude: 25.0,
      rotationAmount: 3.0,
      noiseScale: 1.0,
      grainAmount: 0.04,
      contrast: 1.4,
      saturation: 1.2,
      zoom: 0.8
    };

    const uniforms = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uTimeSpeed: gl.getUniformLocation(program, 'uTimeSpeed'),
      uWarpStrength: gl.getUniformLocation(program, 'uWarpStrength'),
      uWarpFrequency: gl.getUniformLocation(program, 'uWarpFrequency'),
      uWarpSpeed: gl.getUniformLocation(program, 'uWarpSpeed'),
      uWarpAmplitude: gl.getUniformLocation(program, 'uWarpAmplitude'),
      uRotationAmount: gl.getUniformLocation(program, 'uRotationAmount'),
      uNoiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
      uGrainAmount: gl.getUniformLocation(program, 'uGrainAmount'),
      uContrast: gl.getUniformLocation(program, 'uContrast'),
      uSaturation: gl.getUniformLocation(program, 'uSaturation'),
      uZoom: gl.getUniformLocation(program, 'uZoom'),
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

    function setUniforms(time) {
      gl.uniform1f(uniforms.iTime, time);
      gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTimeSpeed, config.timeSpeed);
      gl.uniform1f(uniforms.uWarpStrength, config.warpStrength);
      gl.uniform1f(uniforms.uWarpFrequency, config.warpFrequency);
      gl.uniform1f(uniforms.uWarpSpeed, config.warpSpeed);
      gl.uniform1f(uniforms.uWarpAmplitude, config.warpAmplitude);
      gl.uniform1f(uniforms.uRotationAmount, config.rotationAmount);
      gl.uniform1f(uniforms.uNoiseScale, config.noiseScale);
      gl.uniform1f(uniforms.uGrainAmount, config.grainAmount);
      gl.uniform1f(uniforms.uContrast, config.contrast);
      gl.uniform1f(uniforms.uSaturation, config.saturation);
      gl.uniform1f(uniforms.uZoom, config.zoom);

      const c1 = hexToRgb(config.color1);
      gl.uniform3f(uniforms.uColor1, c1[0], c1[1], c1[2]);
      const c2 = hexToRgb(config.color2);
      gl.uniform3f(uniforms.uColor2, c2[0], c2[1], c2[2]);
      const c3 = hexToRgb(config.color3);
      gl.uniform3f(uniforms.uColor3, c3[0], c3[1], c3[2]);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    let raf = 0;
    let isVisible = true;
    const t0 = performance.now();

    function loop(t) {
      const time = (t - t0) * 0.001;

      gl.clearColor(0.06, 0.3, 0.29, 1.0);  // teal-800 深青底色
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      setUniforms(time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (isVisible) {
        raf = requestAnimationFrame(loop);
      }
    }

    function handleVisibility() {
      isVisible = !document.hidden;
      if (isVisible && !raf) {
        raf = requestAnimationFrame(loop);
      } else if (!isVisible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    raf = requestAnimationFrame(loop);
    console.log('Grainient background initialized (high-contrast mode)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
