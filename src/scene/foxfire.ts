// The hero scene: nine tails of foxfire over a sign dial, projects as flames. Loaded on demand (three.js is a separate chunk).
// Pointer pulls the embers in, tails sway with mouse speed, hover flares a flame and draws its trade, dragging turns the
// constellation, a click flies the camera to the flame before the project page opens.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, BufferGeometry, Float32BufferAttribute, BufferAttribute,
  LineBasicMaterial, Line, LineLoop, LineSegments, Points, ShaderMaterial, AdditiveBlending, Vector3, Color,
} from 'three';
import {
  TAILS, FOV, FOX_LINES, DIAL, dialPoint, tailPoint, layoutOrbs, orbPos, camDist, type OrbIn, type Orb, type V3,
} from '../lib/foxsky';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const GOLD = new Color('#d9ae55'), STEEL = new Color('#9db2bc');
const TRAIL = 56, EMBERS = 240;

const POINT_VS = /* glsl */ `
  uniform float uK; uniform float uTime; uniform float uPx;
  attribute float aSize; attribute float aLit; attribute float aSeed; attribute float aHover;
  varying float vLit; varying float vSeed; varying float vHover;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float flick = 0.88 + 0.12 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 40.0);
    gl_PointSize = aSize * (1.0 + aHover * 0.9) * flick * uK * uPx / -mv.z;
    gl_Position = projectionMatrix * mv;
    vLit = aLit; vSeed = aSeed; vHover = aHover;
  }`;
const POINT_FS = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor; varying float vLit; varying float vSeed; varying float vHover;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;
    float core = smoothstep(0.38, 0.0, d); float halo = pow(max(0.0, 1.0 - d), 2.2);
    vec3 col = mix(uColor, vec3(1.0, 0.94, 0.74), core * (0.6 + vHover * 0.4));
    float a = (halo * 0.75 + core) * vLit;
    gl_FragColor = vec4(col * a, a);
  }`;
const EMBER_VS = /* glsl */ `
  uniform float uK; uniform float uTime; uniform float uPx; uniform vec3 uPointer; uniform float uGather; uniform float uIntro;
  attribute float aSize; attribute float aSeed; attribute vec3 aBase;
  varying float vLit; varying float vSeed; varying float vHover;
  void main() {
    float cyc = fract(uTime * (0.015 + aSeed * 0.02) + aSeed * 7.0);
    vec3 p = aBase; p.y += cyc * 1.3; p.x += sin(uTime * 0.5 + aSeed * 30.0) * 0.12;
    vec3 to = uPointer - p; float dist = length(to.xy);
    float pull = uGather * smoothstep(1.8, 0.0, dist);
    p.xy += normalize(to.xy + 0.0001) * pull * min(dist, 0.9) * 0.85;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * (1.0 + pull * 1.4) * uK * uPx / -mv.z;
    gl_Position = projectionMatrix * mv;
    vLit = smoothstep(0.0, 0.12, cyc) * smoothstep(1.0, 0.6, cyc) * (0.35 + pull * 0.9) * uIntro; vSeed = aSeed; vHover = pull;
  }`;

function pointsMat(vs: string, extra: Record<string, { value: unknown }> = {}) {
  return new ShaderMaterial({
    vertexShader: vs, fragmentShader: POINT_FS, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uK: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uColor: { value: GOLD.clone() }, ...extra },
  });
}

export function mount(host: HTMLElement) {
  const orbIn: OrbIn[] = JSON.parse(host.dataset.orbs || '[]');
  const orbs: Orb[] = layoutOrbs(orbIn);
  const lis = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.sky__li').forEach((li) => lis.set(li.dataset.slug!, li));
  const labelEls = [...host.querySelectorAll<HTMLElement>('.sky__label')];

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch { host.classList.add('is-still'); return; }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'sky__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 2, 0.1, 80);
  const root = new Group();
  scene.add(root);

  // --- static lines: sign dial, fox head
  const lineMat = (c: Color, o: number) => new LineBasicMaterial({ color: c, transparent: true, opacity: o, blending: AdditiveBlending, depthWrite: false });
  const ring = new LineLoop(new BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, i) => new Vector3(...dialPoint((i / 128) * Math.PI * 2)))), lineMat(STEEL, 0.5));
  const innerRing = new LineLoop(new BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, i) => new Vector3(...dialPoint((i / 128) * Math.PI * 2, 0.62)))), lineMat(STEEL, 0.2));
  const tickPts: Vector3[] = [];
  for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * Math.PI * 2; tickPts.push(new Vector3(...dialPoint(a, 0.93)), new Vector3(...dialPoint(a, 1))); }
  const ticks = new LineSegments(new BufferGeometry().setFromPoints(tickPts), lineMat(STEEL, 0.6));
  const foxPts: Vector3[] = []; FOX_LINES.forEach(([a, b]) => foxPts.push(new Vector3(...a), new Vector3(...b)));
  const fox = new LineSegments(new BufferGeometry().setFromPoints(foxPts), lineMat(GOLD, 0.9));
  root.add(ring, innerRing, ticks, fox);

  // --- tails: line + glowing trail
  const tailLines = TAILS.map((t) => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(48 * 3), 3));
    const l = new Line(g, lineMat(GOLD, t.main ? 0.85 : 0.38));
    root.add(l);
    return l;
  });
  const trailN = TAILS.length * TRAIL;
  const trailGeo = new BufferGeometry();
  trailGeo.setAttribute('position', new BufferAttribute(new Float32Array(trailN * 3), 3));
  const tSize = new Float32Array(trailN), tLit = new Float32Array(trailN), tSeed = new Float32Array(trailN), tHover = new Float32Array(trailN);
  TAILS.forEach((t, k) => { for (let i = 0; i < TRAIL; i++) { const n = k * TRAIL + i, u = i / (TRAIL - 1); tSize[n] = (t.main ? 0.085 : 0.05) * (1 - 0.5 * u) + 0.02; tSeed[n] = ((n * 97) % 101) / 101; } });
  trailGeo.setAttribute('aSize', new BufferAttribute(tSize, 1)); trailGeo.setAttribute('aLit', new BufferAttribute(tLit, 1));
  trailGeo.setAttribute('aSeed', new BufferAttribute(tSeed, 1)); trailGeo.setAttribute('aHover', new BufferAttribute(tHover, 1));
  const trailMat = pointsMat(POINT_VS);
  const trail = new Points(trailGeo, trailMat); trail.frustumCulled = false; root.add(trail);

  // --- project flames
  const oN = orbs.length;
  const oGeo = new BufferGeometry();
  oGeo.setAttribute('position', new BufferAttribute(new Float32Array(oN * 3), 3));
  const oSize = new Float32Array(oN), oLit = new Float32Array(oN), oSeed = new Float32Array(oN), oHover = new Float32Array(oN);
  orbs.forEach((o, i) => { oSize[i] = o.featured ? 0.42 : 0.3; oSeed[i] = ((i * 53) % 29) / 29; });
  oGeo.setAttribute('aSize', new BufferAttribute(oSize, 1)); oGeo.setAttribute('aLit', new BufferAttribute(oLit, 1));
  oGeo.setAttribute('aSeed', new BufferAttribute(oSeed, 1)); oGeo.setAttribute('aHover', new BufferAttribute(oHover, 1));
  const orbMat = pointsMat(POINT_VS);
  const orbPoints = new Points(oGeo, orbMat); orbPoints.frustumCulled = false; root.add(orbPoints);

  // --- tail tips without a project: a small ember
  const bare = TAILS.filter((t) => !orbs.some((o) => o.body === t.body));

  // --- embers that the pointer gathers
  const eGeo = new BufferGeometry();
  const eBase = new Float32Array(EMBERS * 3), eSize = new Float32Array(EMBERS), eSeed = new Float32Array(EMBERS);
  for (let i = 0; i < EMBERS; i++) {
    const r = (n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    eBase[i * 3] = (r(1) - 0.5) * 7.4; eBase[i * 3 + 1] = -2 + r(2) * 3.2; eBase[i * 3 + 2] = (r(3) - 0.5) * 2.4;
    eSize[i] = 0.05 + r(4) * 0.09; eSeed[i] = r(5);
  }
  eGeo.setAttribute('position', new BufferAttribute(new Float32Array(EMBERS * 3), 3));
  eGeo.setAttribute('aBase', new BufferAttribute(eBase, 3)); eGeo.setAttribute('aSize', new BufferAttribute(eSize, 1)); eGeo.setAttribute('aSeed', new BufferAttribute(eSeed, 1));
  const eMat = new ShaderMaterial({
    vertexShader: EMBER_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uK: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uColor: { value: new Color('#e8c474') }, uPointer: { value: new Vector3() }, uGather: { value: 0 }, uIntro: { value: 0 } },
  });
  const embers = new Points(eGeo, eMat); embers.frustumCulled = false; root.add(embers);

  // --- hover links: from the flame under the pointer to the others of its trade
  const linkGeo = new BufferGeometry();
  linkGeo.setAttribute('position', new BufferAttribute(new Float32Array(12 * 2 * 3), 3));
  const linkMat = lineMat(GOLD, 0);
  const links = new LineSegments(linkGeo, linkMat); links.frustumCulled = false; root.add(links);

  // --- state
  const st = {
    t: 0, intro: 0, paused: false, visible: true, w: 1, h: 1, aspect: 2,
    yaw: 0, pitch: 0, yawV: 0, pitchV: 0, dragging: false, lastX: 0, lastY: 0, moved: 0,
    px: 0, py: 0, ppx: 0, ppy: 0, inside: false, gather: 0, pointerLocal: new Vector3(),
    sway: TAILS.map(() => 0), swayV: TAILS.map(() => 0),
    hover: -1, hoverAmt: orbs.map(() => 0), off: orbs.map(() => [0, 0, 0] as V3),
    fly: null as null | { t0: number; from: Vector3; to: Vector3; href: string },
  };
  const orbPosNow: Vector3[] = orbs.map(() => new Vector3());
  const tmp = new Vector3();

  function resize() {
    const r = host.getBoundingClientRect();
    st.w = Math.max(1, Math.round(r.width)); st.h = Math.max(1, Math.round(r.height)); st.aspect = st.w / st.h;
    renderer.setSize(st.w, st.h, false);
    camera.aspect = st.aspect; camera.updateProjectionMatrix();
    const K = (st.h * dpr) / (2 * Math.tan((FOV / 2) * (Math.PI / 180)));
    for (const m of [trailMat, orbMat, eMat]) { m.uniforms.uK.value = K / dpr; m.uniforms.uPx.value = dpr; }
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  // --- pointer
  const setPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    st.px = ((e.clientX - r.left) / r.width) * 2 - 1; st.py = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  host.addEventListener('pointermove', (e) => {
    setPointer(e); st.inside = true;
    if (st.dragging) {
      const dx = e.clientX - st.lastX, dy = e.clientY - st.lastY; st.moved += Math.abs(dx) + Math.abs(dy);
      st.yawV = dx * 0.0042; st.pitchV = dy * 0.0028; st.yaw = clamp(st.yaw + st.yawV, -0.9, 0.9); st.pitch = clamp(st.pitch + st.pitchV, -0.4, 0.4);
      st.lastX = e.clientX; st.lastY = e.clientY;
    }
  });
  host.addEventListener('pointerleave', () => { st.inside = false; });
  host.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    st.dragging = true; st.lastX = e.clientX; st.lastY = e.clientY; st.moved = 0; setPointer(e);
    host.setPointerCapture?.(e.pointerId); host.classList.add('is-drag');
  });
  const endDrag = () => { st.dragging = false; host.classList.remove('is-drag'); };
  host.addEventListener('pointerup', endDrag); host.addEventListener('pointercancel', endDrag);

  // --- anchors: hover, focus, click
  orbs.forEach((o, i) => {
    const li = lis.get(o.slug); const a = li?.querySelector('a'); if (!a) return;
    const on = () => { st.hover = i; }, off = () => { if (st.hover === i) st.hover = -1; };
    a.addEventListener('pointerenter', on); a.addEventListener('pointerleave', off); a.addEventListener('focus', on); a.addEventListener('blur', off);
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const from = camera.position.clone();
      root.updateMatrixWorld(); const w = orbPosNow[i].clone().applyMatrix4(root.matrixWorld);
      st.fly = { t0: st.t, from, to: w, href: a.href };
      setTimeout(() => { if (st.fly) location.href = a.href; }, 900);
    });
  });
  window.addEventListener('pageshow', () => { st.fly = null; });

  // --- pause control
  const pauseBtn = host.querySelector<HTMLButtonElement>('.sky__pause');
  if (pauseBtn) {
    pauseBtn.hidden = false;
    pauseBtn.addEventListener('click', () => {
      st.paused = !st.paused; pauseBtn.setAttribute('aria-pressed', String(st.paused)); pauseBtn.textContent = st.paused ? 'Resume motion' : 'Pause motion';
    });
  }
  new IntersectionObserver(([en]) => { st.visible = en.isIntersecting; }, { threshold: 0 }).observe(host);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop = true; host.classList.remove('is-live'); host.classList.add('is-still'); canvas.remove(); });

  let stop = false, last = performance.now(), first = true;
  const lookAt = new Vector3();

  function frame(now: number) {
    if (stop) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!st.visible || document.hidden) return;
    if (!st.paused) { st.t += dt; st.intro = clamp(st.intro + dt / 3.4); }
    const t = st.t, I = st.intro;

    // pointer world position on the z=0 plane, in root space
    const base = camDist(st.aspect), th = Math.tan((FOV / 2) * (Math.PI / 180));
    const wx = st.px * base * th * st.aspect, wy = st.py * base * th;
    root.rotation.y = st.yaw + Math.sin(t * 0.11) * 0.07; root.rotation.x = -st.pitch + Math.sin(t * 0.08) * 0.03;
    root.updateMatrixWorld();
    st.pointerLocal.set(wx, wy, 0); root.worldToLocal(st.pointerLocal);
    const vx = st.px - st.ppx, vy = st.py - st.ppy; st.ppx = st.px; st.ppy = st.py;
    if (!st.dragging) { st.yaw += (0 - st.yaw) * 0.006 + st.yawV; st.pitch += (0 - st.pitch) * 0.01 + st.pitchV; st.yawV *= 0.92; st.pitchV *= 0.92; }
    st.gather += ((st.inside && !st.dragging ? 1 : 0) - st.gather) * 0.08;

    // tail sway: pointer speed pushes tails near it, springs bring them back, with a stagger per tail
    TAILS.forEach((tl, k) => {
      const tip = tailPoint(tl, 0.8, st.sway[k]);
      const near = Math.exp(-(((tip[0] - st.pointerLocal.x) ** 2 + (tip[1] - st.pointerLocal.y) ** 2) / 4.5)) * (st.inside ? 1 : 0);
      const stiff = 14 + k * 1.6;
      st.swayV[k] += (-stiff * st.sway[k] - 3.2 * st.swayV[k] + vx * 260 * near * Math.cos(tl.theta)) * dt;
      st.sway[k] = clamp(st.sway[k] + st.swayV[k] * dt, -1.1, 1.1);
    });

    // tails
    TAILS.forEach((tl, k) => {
      const p = clamp((I * 1.35 - k * 0.06) / 0.55);
      const attr = tailLines[k].geometry.getAttribute('position') as BufferAttribute;
      for (let i = 0; i < 48; i++) { const q = tailPoint(tl, i / 47, st.sway[k]); attr.setXYZ(i, q[0], q[1], q[2]); }
      attr.needsUpdate = true; tailLines[k].geometry.setDrawRange(0, Math.max(0, Math.floor(48 * p)));
      for (let i = 0; i < TRAIL; i++) {
        const n = k * TRAIL + i, u = i / (TRAIL - 1), q = tailPoint(tl, u, st.sway[k]);
        (trailGeo.getAttribute('position') as BufferAttribute).setXYZ(n, q[0], q[1], q[2]);
        tLit[n] = smooth(u - 0.02, u, p) * (tl.main ? 0.5 : 0.2) * (1 - 0.35 * u);
      }
    });
    (trailGeo.getAttribute('position') as BufferAttribute).needsUpdate = true; (trailGeo.getAttribute('aLit') as BufferAttribute).needsUpdate = true;

    // flames
    const hoveredOrb = st.hover >= 0 ? orbs[st.hover] : null;
    orbs.forEach((o, i) => {
      const ti = TAILS.findIndex((x) => x.body === o.body);
      const p = clamp((I * 1.35 - ti * 0.06) / 0.55);
      const target = hoveredOrb && hoveredOrb === o ? 1 : 0;
      st.hoverAmt[i] += (target - st.hoverAmt[i]) * 0.16;
      const pos = orbPos(o, st.sway[ti]);
      // pull towards the pointer
      const dx = st.pointerLocal.x - pos[0], dy = st.pointerLocal.y - pos[1], d = Math.hypot(dx, dy);
      const w = st.gather * smooth(1.6, 0, d) * 0.28;
      const wantX = dx * w, wantY = dy * w;
      st.off[i][0] += (wantX - st.off[i][0]) * 0.1; st.off[i][1] += (wantY - st.off[i][1]) * 0.1;
      orbPosNow[i].set(pos[0] + st.off[i][0], pos[1] + st.off[i][1], pos[2]);
      oGeo.getAttribute('position').setXYZ(i, orbPosNow[i].x, orbPosNow[i].y, orbPosNow[i].z);
      oLit[i] = smooth(o.u - 0.04, o.u + 0.02, p) * (0.9 + st.hoverAmt[i] * 0.6);
      oHover[i] = st.hoverAmt[i];
    });
    oGeo.getAttribute('position').needsUpdate = true; oGeo.getAttribute('aLit').needsUpdate = true; oGeo.getAttribute('aHover').needsUpdate = true;

    // links to the trade of the hovered flame
    const linkAttr = linkGeo.getAttribute('position') as BufferAttribute;
    let ln = 0;
    if (hoveredOrb) orbs.forEach((o, i) => { if (i !== st.hover && o.domain === hoveredOrb.domain && ln < 12) { const a = orbPosNow[st.hover], b = orbPosNow[i]; linkAttr.setXYZ(ln * 2, a.x, a.y, a.z); linkAttr.setXYZ(ln * 2 + 1, b.x, b.y, b.z); ln++; } });
    linkAttr.needsUpdate = true; linkGeo.setDrawRange(0, ln * 2);
    linkMat.opacity += ((hoveredOrb ? 0.7 : 0) - linkMat.opacity) * 0.14;

    // camera: drift, pointer parallax, or the click flight
    camera.position.set(Math.sin(t * 0.12) * 0.32 + st.px * 0.22, Math.sin(t * 0.09) * 0.16 + st.py * 0.12, base);
    lookAt.set(0, 0, 0);
    if (st.fly) {
      const k = ease(clamp((st.t - st.fly.t0) / 0.7));
      tmp.copy(st.fly.to).add(new Vector3(0, 0, 2.1));
      camera.position.lerpVectors(st.fly.from, tmp, k); lookAt.copy(st.fly.to).multiplyScalar(k);
      if (st.paused) st.t += dt;
    }
    camera.lookAt(lookAt);

    for (const m of [trailMat, orbMat, eMat]) m.uniforms.uTime.value = t;
    eMat.uniforms.uPointer.value.copy(st.pointerLocal); eMat.uniforms.uGather.value = st.gather; eMat.uniforms.uIntro.value = smooth(0.05, 0.5, I);
    ring.material.opacity = 0.5 * smooth(0, 0.3, I); innerRing.material.opacity = 0.2 * smooth(0, 0.3, I); ticks.material.opacity = 0.6 * smooth(0, 0.3, I); fox.material.opacity = 0.9 * smooth(0.3, 0.7, I);
    renderer.render(scene, camera);

    // DOM anchors follow the flames
    camera.updateMatrixWorld(); root.updateMatrixWorld();
    orbs.forEach((o, i) => {
      const li = lis.get(o.slug); if (!li) return;
      tmp.copy(orbPosNow[i]).applyMatrix4(root.matrixWorld).project(camera);
      li.style.transform = `translate(${((tmp.x + 1) / 2) * st.w}px, ${((1 - tmp.y) / 2 * st.h)}px)`;
    });
    labelEls.forEach((el) => {
      const tl = TAILS.find((x) => x.body === el.dataset.body)!; const k = TAILS.indexOf(tl);
      const q = tailPoint(tl, 1.0, st.sway[k]); tmp.set(q[0], q[1], q[2]).applyMatrix4(root.matrixWorld).project(camera);
      el.style.transform = `translate(${((tmp.x + 1) / 2) * st.w}px, ${((1 - tmp.y) / 2) * st.h}px)`;
      el.style.opacity = String(smooth(0.55, 0.9, I));
    });
    // bare tips
    if (first) { first = false; host.classList.add('is-live'); }
  }
  void bare;
  requestAnimationFrame(frame);
}
