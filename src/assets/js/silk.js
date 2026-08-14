/* ============================================
   Silk 丝绸效果 - 严格按照原版 shader 实现
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
  if (prefersReducedMotion) {
    document.body.style.background = '#0A1F1D';
    return;
  }

  function hexToNormalizedRGB(hex) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    ];
  }

  const vertexShader = `#version 300 es
    in vec2 position;
    out vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // 严格按照原版 fragment shader 实现
  const fragmentShader = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform vec2  iResolution;
    uniform float uTime;
    uniform vec3  uColor;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uRotation;
    uniform float uNoiseIntensity;

    const float e = 2.71828182845904523536;

    float noise(vec2 texCoord) {
      float G = e;
      vec2  r = (G * sin(G * texCoord));
      return fract(r.x * r.y * (1.0 + texCoord.x));
    }

    vec2 rotateUvs(vec2 uv, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      mat2  rot = mat2(c, -s, s, c);
      return rot * uv;
    }

    void main() {
      float aspect = iResolution.x / iResolution.y;
      vec2 uv = vUv;
      uv.x *= aspect;

      float rnd        = noise(gl_FragCoord.xy);
      vec2  suv        = rotateUvs(uv * uScale, uRotation);
      vec2  tex        = suv * uScale;
      float tOffset    = uSpeed * uTime;

      tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

      float pattern = 0.6 +
                      0.4 * sin(5.0 * (tex.x + tex.y +
                                       cos(3.0 * tex.x + 5.0 * tex.y) +
                                       0.02 * tOffset) +
                               sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

      vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
      col.a = 1.0;
      fragColor = col;
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
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
      console.error('Program error:', gl.getProgramInfoLog(program));
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
    canvas.id = 'silk-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-2;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false
    });

    if (!gl) {
      document.body.style.background = '#0A1F1D';
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

    // 深色主题参数：亮青色在深墨底上形成发光丝绸效果
    const config = {
      speed: 5,
      scale: 1,
      color: '#2DD4BF',   // teal-400 亮青，在深色底上呈现荧光波纹
      noiseIntensity: 1.2,
      rotation: 0
    };

    const uniforms = {
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uColor: gl.getUniformLocation(program, 'uColor'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uRotation: gl.getUniformLocation(program, 'uRotation'),
      uNoiseIntensity: gl.getUniformLocation(program, 'uNoiseIntensity')
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
      gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform1f(uniforms.uSpeed, config.speed);
      gl.uniform1f(uniforms.uScale, config.scale);
      gl.uniform1f(uniforms.uRotation, config.rotation);
      gl.uniform1f(uniforms.uNoiseIntensity, config.noiseIntensity);
      const c = hexToNormalizedRGB(config.color);
      gl.uniform3f(uniforms.uColor, c[0], c[1], c[2]);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    let raf = 0;
    let isVisible = true;
    const t0 = performance.now();
    let accumulatedTime = 0;
    let lastTime = 0;

    function loop(t) {
      if (lastTime === 0) lastTime = t;
      const delta = (t - lastTime) / 1000;
      lastTime = t;
      // 原版: uTime += 0.1 * delta
      accumulatedTime += 0.1 * delta;

      gl.clearColor(0.02, 0.08, 0.07, 1.0);  // 深色底：深墨青黑色
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      setUniforms(accumulatedTime);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (isVisible) {
        raf = requestAnimationFrame(loop);
      }
    }

    function handleVisibility() {
      isVisible = !document.hidden;
      if (isVisible && !raf) {
        lastTime = 0;
        raf = requestAnimationFrame(loop);
      } else if (!isVisible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
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
