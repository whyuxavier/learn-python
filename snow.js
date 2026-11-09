/* Піксельний сніг для головної сторінки (темна тема).
   Перенесено на чистий WebGL2 з компонента PixelSnow бібліотеки React Bits
   (https://reactbits.dev, автор — David Haz). Без React і залежностей.
   window.PixelSnow.mount(контейнер, налаштування) → { wake(), destroy() } */
(() => {
'use strict';
const SPRITES = [
  ['@'],
  ['.x.', 'x@x', '.x.'],
  ['..x..', 'x.o.x', '.o@o.', 'x.o.x', '..x..'],
  ['...x...', '.x.o.x.', '..ooo..', 'xoo@oox', '..ooo..', '.x.o.x.', '...x...'],
  ['....x....', '.x..o..x.', '..o.o.o..', '...ooo...', 'xooo@ooox', '...ooo...', '..o.o.o..', '.x..o..x.', '....x....'],
  ['x...x', '.o.o.', '..@..', '.o.o.', 'x...x'],
  ['x..x..x', '.o.o.o.', '..ooo..', 'xoo@oox', '..ooo..', '.o.o.o.', 'x..x..x'],
  ['x...x...x', '.o..o..o.', '..o.o.o..', '...ooo...', 'xooo@ooox', '...ooo...', '..o.o.o..', '.o..o..o.', 'x...x...x']
];
const CELL = 9, LEVELS = 5, SLOTS = 8, MAX_FLAKES = 3000;
const LEVEL_WEIGHTS = [0.46, 0.27, 0.15, 0.08, 0.04];
const LEVEL_FALL = [16, 24, 34, 48, 66];
const LEVEL_LIGHT = [0.42, 0.58, 0.76, 0.92, 1];
const INTRO_SECONDS = 1.4;

const QUAD = `#version 300 es
in vec2 aPosition;
void main(){gl_Position=vec4(aPosition,0.0,1.0);}`;

const FLAKE_V = `#version 300 es
in vec2 aCorner;
in vec4 aFlake;
uniform vec2 uGrid;
uniform vec4 uSizes;
uniform float uLargest;
flat out ivec2 vOrigin;
flat out ivec2 vCell;
flat out int vSize;
flat out float vLight;
void main(){
  int index=int(aFlake.z+0.5);
  int slot=index;
  int level=slot<${LEVELS}?slot:slot-3;
  float size=level==0?1.0:(level==1?uSizes.x:(level==2?uSizes.y:(level==3?uSizes.z:uLargest)));
  vec2 origin=floor(aFlake.xy)-floor(size*0.5);
  origin.y=uGrid.y-origin.y-size;
  vec2 corner=origin+(aCorner*0.5+0.5)*size;
  gl_Position=vec4(corner/uGrid*2.0-1.0,0.0,1.0);
  vOrigin=ivec2(origin);
  vCell=ivec2(slot*${CELL},0);
  vSize=int(size);
  vLight=aFlake.w;
}`;

const FLAKE_F = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uAtlas;
flat in ivec2 vOrigin;
flat in ivec2 vCell;
flat in int vSize;
flat in float vLight;
out vec4 outColor;
void main(){
  ivec2 local=ivec2(gl_FragCoord.xy)-vOrigin;
  if(local.x<0||local.y<0||local.x>=vSize||local.y>=vSize)discard;
  vec4 texel=texelFetch(uAtlas,vCell+local,0);
  if(texel.r<0.5)discard;
  outColor=vec4(vLight,texel.g*vLight,0.0,1.0);
}`;

const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main(){
  vec2 uv=gl_FragCoord.xy/uTarget;
  vec4 sum=texture(uSource,uv)*4.0;
  sum+=texture(uSource,uv-uTexel);
  sum+=texture(uSource,uv+uTexel);
  sum+=texture(uSource,uv+vec2(uTexel.x,-uTexel.y));
  sum+=texture(uSource,uv-vec2(uTexel.x,-uTexel.y));
  outColor=sum/8.0;
}`;

const UP = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main(){
  vec2 uv=gl_FragCoord.xy/uTarget;
  vec2 h=uTexel*0.5;
  vec4 sum=texture(uSource,uv+vec2(-h.x*2.0,0.0));
  sum+=texture(uSource,uv+vec2(h.x*2.0,0.0));
  sum+=texture(uSource,uv+vec2(0.0,-h.y*2.0));
  sum+=texture(uSource,uv+vec2(0.0,h.y*2.0));
  sum+=texture(uSource,uv+vec2(-h.x,h.y))*2.0;
  sum+=texture(uSource,uv+h)*2.0;
  sum+=texture(uSource,uv+vec2(h.x,-h.y))*2.0;
  sum+=texture(uSource,uv-h)*2.0;
  outColor=(sum/12.0+texture(uBase,uv))*0.5;
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uSnow;
uniform sampler2D uGlowMap;
uniform vec2 uResolution;
uniform vec2 uGrid;
uniform float uPixel;
uniform vec3 uColor;
uniform float uBrightness;
uniform float uGlow;
uniform float uFade;
uniform float uOpacity;
out vec4 outColor;
float smootherstep(float edge,float x){
  float t=clamp(x/max(edge,0.0001),0.0,1.0);
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  ivec2 cell=ivec2(floor(gl_FragCoord.xy/uPixel));
  vec4 snow=texelFetch(uSnow,clamp(cell,ivec2(0),ivec2(uGrid)-1),0);
  vec2 glow=texture(uGlowMap,gl_FragCoord.xy/(uGrid*uPixel)).rg;
  float edge=uFade*0.5;
  float mask=smootherstep(edge,uv.x)*smootherstep(edge,1.0-uv.x)*smootherstep(edge,uv.y)*smootherstep(edge,1.0-uv.y);
  mask*=uOpacity;
  float body=clamp(snow.r*uBrightness,0.0,1.0);
  float core=clamp(snow.g*uBrightness,0.0,1.0);
  float halo=clamp(glow.r*uGlow*uBrightness,0.0,1.0);
  vec3 color=uColor*(body*0.82+core*0.18)+uColor*halo*0.55;
  color=1.0-exp(-color*1.6);
  color*=mask;
  outColor=vec4(color,max(color.r,max(color.g,color.b)));
}`;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const seeded = seed => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const compile = (gl, type, src) => {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src); gl.compileShader(sh);
  if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
  gl.deleteShader(sh); return null;
};
const link = (gl, vs, fs, attrs) => {
  const v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs), p = gl.createProgram();
  if (!v || !f || !p) return null;
  gl.attachShader(p, v); gl.attachShader(p, f);
  attrs.forEach((n, i) => gl.bindAttribLocation(p, i, n));
  gl.linkProgram(p); gl.deleteShader(v); gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return null; }
  const uniforms = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); if (info) uniforms[info.name] = gl.getUniformLocation(p, info.name); }
  return { program: p, uniforms };
};
const buildAtlas = () => {
  const width = CELL * SLOTS, height = CELL, data = new Uint8Array(width * height * 4);
  SPRITES.forEach((rows, level) => rows.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      const m = line[x]; if (m === '.') continue;
      const o = (y * width + level * CELL + x) * 4;
      data[o] = 255; data[o + 1] = m === '@' ? 255 : m === 'o' ? 128 : 0; data[o + 3] = 255;
    }
  }));
  return { data, width, height };
};

function mount(container, opts) {
  const s = Object.assign({
    color: '#ffffff', density: 0.5, speed: 1, wind: 0.25, sway: 0.5, flakeSize: 1, pixelSize: 3,
    depth: 0.6, brightness: 1, glow: 0.8, twinkle: 0.35, mouseInteraction: true, intro: true,
    fade: 0, opacity: 1, dpr: 0
  }, opts || {});
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  container.appendChild(canvas);
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) { canvas.remove(); return null; }
  const programs = {
    flake: link(gl, FLAKE_V, FLAKE_F, ['aCorner', 'aFlake']),
    down: link(gl, QUAD, DOWN, ['aPosition']),
    up: link(gl, QUAD, UP, ['aPosition']),
    composite: link(gl, QUAD, COMPOSITE, ['aPosition'])
  };
  if (Object.values(programs).some(p => !p)) { canvas.remove(); return null; }

  const atlas = buildAtlas(), atlasTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const quadBuffer = gl.createBuffer(), quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const cornerBuffer = gl.createBuffer(), instanceBuffer = gl.createBuffer(), flakeVao = gl.createVertexArray();
  gl.bindVertexArray(flakeVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.bindVertexArray(null);

  const createTarget = filter => {
    const t = { texture: gl.createTexture(), framebuffer: gl.createFramebuffer(), width: 0, height: 0 };
    gl.bindTexture(gl.TEXTURE_2D, t.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const sizeTarget = (t, w, h) => {
    if (t.width === w && t.height === h) return;
    t.width = w; t.height = h;
    gl.bindTexture(gl.TEXTURE_2D, t.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.texture, 0);
  };
  const snow = createTarget(gl.NEAREST);
  const down = [createTarget(gl.LINEAR), createTarget(gl.LINEAR), createTarget(gl.LINEAR)];
  const up = [createTarget(gl.LINEAR), createTarget(gl.LINEAR)];

  const toRgb = v => {
    const m = /^#?([0-9a-f]{6})$/i.exec(v);
    if (!m) return [1, 1, 1];
    const n = parseInt(m[1], 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  };
  const rgb = toRgb(s.color);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rng = seeded(4271), flakes = [];
  const view = { width: 1, height: 1, ratio: 1, pixel: 1, gridWidth: 1, gridHeight: 1 };
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false, time: 0 };
  const state = { time: 0, intro: s.intro && !reduce ? 0 : 1, push: 0 };
  const instances = new Float32Array(MAX_FLAKES * 4);
  let raf = 0, last = 0, visible = true, dead = false;

  const pickLevel = r => {
    const shift = s.flakeSize - 1;
    const w = LEVEL_WEIGHTS.map((x, l) => x * Math.pow(2.2, shift * (l - 1.5)));
    const sum = w.reduce((a, b) => a + b, 0);
    let total = 0;
    for (let l = 0; l < LEVELS; l++) { total += w[l] / sum; if (r <= total) return l; }
    return LEVELS - 1;
  };
  const spawn = (f, top) => {
    f.level = pickLevel(rng());
    f.x = rng() * (view.width + 40) - 20;
    f.y = top ? -10 - rng() * 30 : rng() * view.height;
    f.vx = 0; f.vy = LEVEL_FALL[f.level];
    f.phase = rng() * Math.PI * 2; f.rate = 0.6 + rng() * 0.9;
    f.sparkle = rng() * 100; f.drift = 0.7 + rng() * 0.6;
    f.alt = rng() < 0.5; f.reveal = rng();
  };
  const populate = () => {
    const target = Math.round(clamp(view.width * view.height * s.density / 1100, 0, MAX_FLAKES));
    while (flakes.length < target) { const f = {}; spawn(f, false); flakes.push(f); }
    if (flakes.length > target) flakes.length = target;
  };
  const simulate = dt => {
    const windSpeed = s.wind * 46, radius = 120, margin = 24;
    const pushing = state.push > 0.001 && pointer.inside;
    const ease = 1 - Math.exp(-dt * 2.2);
    for (const f of flakes) {
      const level = f.level;
      const parallax = 1 - s.depth * (1 - (level + 1) / LEVELS) * 0.75;
      const swing = Math.sin(state.time * f.rate + f.phase) * s.sway * (6 + level * 7);
      f.vx += ((windSpeed * parallax + swing) * f.drift - f.vx) * ease;
      f.vy += (LEVEL_FALL[level] * parallax * s.speed * f.drift - f.vy) * ease;
      if (pushing) {
        const dx = f.x - pointer.x, dy = f.y - pointer.y, d = Math.hypot(dx, dy);
        if (d < radius && d > 0.001) {
          const near = 1 - d / radius;
          const repel = near * near * near * state.push * 1500 * dt, carry = near * near * state.push * dt * 5;
          f.vx += dx / d * repel + pointer.vx * carry;
          f.vy += dy / d * repel + pointer.vy * carry;
        }
      }
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.y > view.height + margin) { spawn(f, true); f.reveal = -1; }
      if (f.x < -margin) f.x += view.width + margin * 2;
      else if (f.x > view.width + margin) f.x -= view.width + margin * 2;
    }
  };
  const run = (p, target, w, h) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, w, h); gl.useProgram(p.program); gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const bindTex = (p, name, unit, tex) => {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(p.uniforms[name], unit);
  };
  const sizes = SPRITES.map(r => r.length);
  const render = () => {
    sizeTarget(snow, view.gridWidth, view.gridHeight);
    let count = 0;
    const sweep = state.intro * 1.75;
    for (const f of flakes) {
      const level = f.level;
      const depthLight = 1 - s.depth * (1 - LEVEL_LIGHT[level]);
      const spark = Math.pow(Math.max(0, Math.sin(state.time * 0.9 + f.sparkle)), 60) * s.twinkle;
      const reveal = f.reveal < 0 || state.intro >= 1 ? 1 : clamp((sweep - f.y / view.height - f.reveal * 0.25) / 0.35, 0, 1);
      if (reveal <= 0) continue;
      const o = count * 4;
      instances[o] = f.x / view.pixel;
      instances[o + 1] = f.y / view.pixel;
      instances[o + 2] = level >= 2 && f.alt ? level + 3 : level;
      instances[o + 3] = Math.min(1, depthLight * (0.85 + spark * 0.6)) * reveal * reveal;
      count++;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, snow.framebuffer);
    gl.viewport(0, 0, snow.width, snow.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (count) {
      const p = programs.flake;
      gl.useProgram(p.program);
      gl.uniform2f(p.uniforms.uGrid, snow.width, snow.height);
      gl.uniform4f(p.uniforms.uSizes, sizes[1], sizes[2], sizes[3], 0);
      gl.uniform1f(p.uniforms.uLargest, sizes[4]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlasTexture); gl.uniform1i(p.uniforms.uAtlas, 0);
      gl.enable(gl.BLEND); gl.blendEquation(gl.MAX);
      gl.bindVertexArray(flakeVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, count * 4), gl.DYNAMIC_DRAW);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.blendEquation(gl.FUNC_ADD); gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(quadVao);
    let src = snow;
    for (let l = 0; l < down.length; l++) {
      const t = down[l];
      sizeTarget(t, Math.max(1, Math.ceil(src.width / 2)), Math.max(1, Math.ceil(src.height / 2)));
      gl.useProgram(programs.down.program);
      gl.uniform2f(programs.down.uniforms.uTexel, 1 / src.width, 1 / src.height);
      gl.uniform2f(programs.down.uniforms.uTarget, t.width, t.height);
      bindTex(programs.down, 'uSource', 0, src.texture);
      run(programs.down, t, t.width, t.height);
      src = t;
    }
    for (let l = up.length - 1; l >= 0; l--) {
      const from = l === up.length - 1 ? down[down.length - 1] : up[l + 1], t = up[l];
      sizeTarget(t, down[l].width, down[l].height);
      gl.useProgram(programs.up.program);
      gl.uniform2f(programs.up.uniforms.uTexel, 1 / from.width, 1 / from.height);
      gl.uniform2f(programs.up.uniforms.uTarget, t.width, t.height);
      bindTex(programs.up, 'uSource', 0, from.texture);
      bindTex(programs.up, 'uBase', 1, down[l].texture);
      run(programs.up, t, t.width, t.height);
    }
    const c = programs.composite, u = c.uniforms;
    gl.useProgram(c.program);
    gl.uniform2f(u.uResolution, canvas.width, canvas.height);
    gl.uniform2f(u.uGrid, snow.width, snow.height);
    gl.uniform1f(u.uPixel, view.pixel * view.ratio);
    gl.uniform3fv(u.uColor, rgb);
    gl.uniform1f(u.uBrightness, s.brightness);
    gl.uniform1f(u.uGlow, s.glow);
    gl.uniform1f(u.uFade, s.fade);
    gl.uniform1f(u.uOpacity, s.opacity);
    bindTex(c, 'uSnow', 0, snow.texture);
    bindTex(c, 'uGlowMap', 1, up[0].texture);
    run(c, null, canvas.width, canvas.height);
  };
  const frame = now => {
    raf = 0;
    if (dead || !visible || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    const goal = s.mouseInteraction && pointer.inside && !reduce ? 1 : 0;
    state.push += (goal - state.push) * (1 - Math.exp(-dt * (goal ? 6 : 3)));
    pointer.vx *= Math.exp(-dt * 6); pointer.vy *= Math.exp(-dt * 6);
    populate();
    if (!reduce) { state.time += dt; simulate(dt); }
    render();
    if (!reduce) raf = requestAnimationFrame(frame); else last = 0;
  };
  const wake = () => { if (!raf && !dead && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  const resize = () => {
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = width; view.height = height; view.ratio = ratio;
    view.pixel = Math.max(1, Math.round(s.pixelSize * ratio)) / ratio;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    view.gridWidth = Math.max(1, Math.ceil(width / view.pixel));
    view.gridHeight = Math.max(1, Math.ceil(height / view.pixel));
    populate(); render(); wake();
  };
  const onMove = e => {
    const r = container.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (pointer.inside && pointer.time) {
      const el = Math.max(1, now - pointer.time) / 1000;
      pointer.vx = clamp((x - pointer.x) / el, -3000, 3000);
      pointer.vy = clamp((y - pointer.y) / el, -3000, 3000);
    }
    pointer.x = x; pointer.y = y; pointer.time = now;
    pointer.inside = e.pointerType !== 'touch' && x >= 0 && y >= 0 && x <= r.width && y <= r.height;
    wake();
  };
  const onLeave = () => { pointer.inside = false; wake(); };
  const onVis = () => { last = 0; wake(); };
  const ro = new ResizeObserver(resize); ro.observe(container);
  const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible) { last = 0; wake(); } });
  io.observe(container);
  addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVis);
  resize();

  return {
    wake() { last = 0; resize(); },
    destroy() {
      dead = true; cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      canvas.remove();
    }
  };
}
window.PixelSnow = { mount };
})();
