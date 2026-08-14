/* ============================================
   光纤隧道动态背景 - 原生 WebGL 实现
   配色：品牌青绿色系
   ============================================ */

(function() {
  'use strict';

  // 检测是否支持 WebGL2
  function supportsWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      return !!window.WebGL2RenderingContext && !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  // 检测是否开启减少动效
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

  // 片元着色器 - 光纤隧道效果
  const fragmentShader = `#version 300 es
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uSpeed;
    uniform float uFlowDir;
    uniform float uPulseSpeed;
    uniform float uPulseLength;
    uniform float uPulseBlend;
    uniform float uPulseWidth;
    uniform float uCableCount;
    uniform float uThickness;
    uniform float uRimWidth;
    uniform float uWaviness;
    uniform float uSway;
    uniform float uSize;
    uniform vec2 uCenter;
    uniform vec2 uMouseOffset;
    uniform float uGlow;
    uniform float uFadeNear;
    uniform float uFadeFar;
    uniform float uBrightness;
    uniform float uColorVariance;
    uniform float uOpacity;
    uniform vec3 uCableColor;
    uniform vec3 uPulseColor;
    uniform vec3 uTunnelColor;
    uniform float uTunnelOpacity;
    uniform float uGrain;
    uniform float uGrainIntensity;
    out vec4 fragColor;

    void mainImage(out vec4 o, in vec2 fragCoord) {
      float size = uSize * 2.0;
      float flowDir = uFlowDir;
      float speedBase = uSpeed * 4.0 * flowDir;
      float waviness = uWaviness * 0.15;
      float rotationOsc = uSway * 0.5;
      float baseThick = uThickness * 0.35 + 0.05;
      float borderWeight = uRimWidth * 0.15 + 0.01;
      float cablesCount = floor(uCableCount);

      vec2 res = iResolution.xy;
      vec2 uv = (fragCoord - 0.5 * res) / min(res.y, res.x);
      uv -= (uCenter + uMouseOffset);
      uv /= (size + 0.0001);

      float r = length(uv);
      float angle = atan(uv.y, uv.x);
      float depth = -log(r + 0.0001);

      float swing = sin(iTime * (uSpeed * 0.5 + 0.1)) * rotationOsc;
      float waveOffset = sin(depth * 1.2 + iTime * speedBase * 0.25) * waviness;

      float angleNormalized = (angle / 6.2831853) + 0.5;
      float finalAngle = fract(angleNormalized + waveOffset + swing);

      float cableID = floor(finalAngle * cablesCount);
      float gvX = (fract(finalAngle * cablesCount) - 0.5);

      float rand = fract(sin(cableID * 12.9898) * 43758.5453);
      float randSpeed = (0.4 + rand * 0.6) * speedBase * uPulseSpeed;
      float cableThick = baseThick * (0.6 + rand * 0.4);

      vec3 cableCol = uCableColor;
      cableCol *= 1.0 + (rand - 0.5) * 0.4 * uColorVariance;
      cableCol = mix(cableCol, uPulseColor, rand * 0.25 * uColorVariance);

      float scroll = depth + (iTime * randSpeed);
      float pulseFact = fract(scroll);

      float distToCore = abs(gvX);
      float wireMask = smoothstep(cableThick, cableThick - 0.05, distToCore);
      float rimGlow = smoothstep(borderWeight, 0.0, abs(distToCore - cableThick));

      float pulseThick = cableThick * uPulseWidth;
      float pulseMask = smoothstep(pulseThick, pulseThick - 0.05 * uPulseWidth, distToCore);

      float pulseDist = abs(pulseFact - 0.5);
      float pulseTotal = uPulseLength;
      float pulseCore = pulseTotal * (1.0 - uPulseBlend);
      float pulseLo = min(pulseCore, pulseTotal - max(fwidth(scroll), 1e-4));
      float dataPulse = 1.0 - smoothstep(pulseLo, pulseTotal, pulseDist);

      float aBody = wireMask * uTunnelOpacity;
      float aRim = rimGlow;
      float aPulse = clamp(dataPulse * pulseMask, 0.0, 1.0);

      vec3 fiberCol = uTunnelColor * aBody
        + cableCol * aRim * 1.3 * uGlow
        + uPulseColor * dataPulse * 3.0 * pulseMask;

      float distFade = smoothstep(0.0, uFadeNear, r) * smoothstep(uFadeFar, uFadeFar - 0.9, r);
      float inten = clamp(aBody + aRim + aPulse, 0.0, 1.0) * distFade;

      vec3 finalCol = fiberCol * uBrightness;
      float alpha = clamp(inten, 0.0, 1.0) * uOpacity;
      vec3 outRgb = finalCol * alpha;

      if (uGrain > 0.5) {
        float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
        outRgb = clamp(outRgb + gv, 0.0, 1.0);
        alpha = clamp(alpha + gv, 0.0, 1.0);
      }

      o = vec4(outRgb, alpha);
    }

    void main() {
      vec4 o = vec4(0.0);
      mainImage(o, gl_FragCoord.xy);
      fragColor = o;
    }
  `;

  // 编译着色器
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

  // 创建程序
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

  // 创建全屏三角形
  function createTriangle(gl) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    return vao;
  }

  // 初始化
  function init() {
    const canvas = document.createElement('canvas');
    canvas.id = 'light-tunnel-canvas';
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

    // 品牌青绿色系配色
    const config = {
      cableColor: '#14B8A6',      // 品牌主色 teal-500
      pulseColor: '#06B6D4',      // 脉冲色 cyan-500
      tunnelColor: '#0D9488',     // 深色 teal-600
      tunnelOpacity: 0,
      speed: 0.08,
      flowDirection: 'outward',
      pulseSpeed: 1.8,
      pulseLength: 0.28,
      pulseBlend: 1,
      pulseWidth: 1,
      cableCount: 24,
      thickness: 0.32,
      rimWidth: 0.18,
      waviness: 0.25,
      sway: 0.4,
      size: 1.2,
      centerX: 0.0,
      centerY: 0.0,
      glow: 0.8,
      fadeNear: 0.3,
      fadeFar: 2.5,
      brightness: 0.7,
      colorVariance: true,
      grain: true,
      grainIntensity: 0.03,
      opacity: 0.6,
      mouseInteraction: true,
      mouseStrength: 0.08
    };

    // 获取 uniform 位置
    const uniforms = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
      uFlowDir: gl.getUniformLocation(program, 'uFlowDir'),
      uPulseSpeed: gl.getUniformLocation(program, 'uPulseSpeed'),
      uPulseLength: gl.getUniformLocation(program, 'uPulseLength'),
      uPulseBlend: gl.getUniformLocation(program, 'uPulseBlend'),
      uPulseWidth: gl.getUniformLocation(program, 'uPulseWidth'),
      uCableCount: gl.getUniformLocation(program, 'uCableCount'),
      uThickness: gl.getUniformLocation(program, 'uThickness'),
      uRimWidth: gl.getUniformLocation(program, 'uRimWidth'),
      uWaviness: gl.getUniformLocation(program, 'uWaviness'),
      uSway: gl.getUniformLocation(program, 'uSway'),
      uSize: gl.getUniformLocation(program, 'uSize'),
      uCenter: gl.getUniformLocation(program, 'uCenter'),
      uMouseOffset: gl.getUniformLocation(program, 'uMouseOffset'),
      uGlow: gl.getUniformLocation(program, 'uGlow'),
      uFadeNear: gl.getUniformLocation(program, 'uFadeNear'),
      uFadeFar: gl.getUniformLocation(program, 'uFadeFar'),
      uBrightness: gl.getUniformLocation(program, 'uBrightness'),
      uColorVariance: gl.getUniformLocation(program, 'uColorVariance'),
      uOpacity: gl.getUniformLocation(program, 'uOpacity'),
      uCableColor: gl.getUniformLocation(program, 'uCableColor'),
      uPulseColor: gl.getUniformLocation(program, 'uPulseColor'),
      uTunnelColor: gl.getUniformLocation(program, 'uTunnelColor'),
      uTunnelOpacity: gl.getUniformLocation(program, 'uTunnelOpacity'),
      uGrain: gl.getUniformLocation(program, 'uGrain'),
      uGrainIntensity: gl.getUniformLocation(program, 'uGrainIntensity')
    };

    // 设置尺寸
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

    // 鼠标交互
    let currentMouse = [0, 0];
    let targetMouse = [0, 0];

    function handleMouseMove(e) {
      targetMouse = [
        (e.clientX / window.innerWidth - 0.5) * 2,
        (0.5 - e.clientY / window.innerHeight) * 2
      ];
    }

    function handleMouseLeave() {
      targetMouse = [0, 0];
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // 动画循环
    let raf = 0;
    let isVisible = true;
    const t0 = performance.now();

    function loop(t) {
      const time = (t - t0) * 0.001;

      // 鼠标平滑跟随
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform1f(uniforms.iTime, time);
      gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uSpeed, config.speed);
      gl.uniform1f(uniforms.uFlowDir, config.flowDirection === 'outward' ? -1.0 : 1.0);
      gl.uniform1f(uniforms.uPulseSpeed, config.pulseSpeed);
      gl.uniform1f(uniforms.uPulseLength, config.pulseLength);
      gl.uniform1f(uniforms.uPulseBlend, config.pulseBlend);
      gl.uniform1f(uniforms.uPulseWidth, config.pulseWidth);
      gl.uniform1f(uniforms.uCableCount, config.cableCount);
      gl.uniform1f(uniforms.uThickness, config.thickness);
      gl.uniform1f(uniforms.uRimWidth, config.rimWidth);
      gl.uniform1f(uniforms.uWaviness, config.waviness);
      gl.uniform1f(uniforms.uSway, config.sway);
      gl.uniform1f(uniforms.uSize, config.size);
      gl.uniform2f(uniforms.uCenter, config.centerX, config.centerY);
      gl.uniform2f(uniforms.uMouseOffset,
        currentMouse[0] * config.mouseStrength,
        currentMouse[1] * config.mouseStrength
      );
      gl.uniform1f(uniforms.uGlow, config.glow);
      gl.uniform1f(uniforms.uFadeNear, config.fadeNear);
      gl.uniform1f(uniforms.uFadeFar, config.fadeFar);
      gl.uniform1f(uniforms.uBrightness, config.brightness);
      gl.uniform1f(uniforms.uColorVariance, config.colorVariance ? 1.0 : 0.0);
      gl.uniform1f(uniforms.uOpacity, config.opacity);

      const cable = hexToRgb(config.cableColor);
      gl.uniform3f(uniforms.uCableColor, cable[0], cable[1], cable[2]);
      const pulse = hexToRgb(config.pulseColor);
      gl.uniform3f(uniforms.uPulseColor, pulse[0], pulse[1], pulse[2]);
      const tunnel = hexToRgb(config.tunnelColor);
      gl.uniform3f(uniforms.uTunnelColor, tunnel[0], tunnel[1], tunnel[2]);
      gl.uniform1f(uniforms.uTunnelOpacity, config.tunnelOpacity);
      gl.uniform1f(uniforms.uGrain, config.grain ? 1.0 : 0.0);
      gl.uniform1f(uniforms.uGrainIntensity, config.grainIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (isVisible) {
        raf = requestAnimationFrame(loop);
      }
    }

    // 页面可见性检测
    function handleVisibility() {
      isVisible = !document.hidden;
      if (isVisible && !raf) {
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    raf = requestAnimationFrame(loop);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
