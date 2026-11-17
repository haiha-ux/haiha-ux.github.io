// The hero scene: a fox in profile with nine tails of foxfire over a turning brass dial of 12 signs; projects are flames
// along the tails. Everything glows through one bloom pass. Loaded on demand (three.js is a separate chunk).
// Pointer pulls the embers in, tails lick with mouse speed, hover flares a flame and shows its trade, dragging turns the
// constellation, a click flies the camera to the flame before the project page opens.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, BufferGeometry, BufferAttribute, LineBasicMaterial, Line, AnimationMixer, SkinnedMesh,
  Quaternion, type Bone,
  Points, LineSegments, ShaderMaterial, AdditiveBlending, Vector2, Vector3, Color,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  TAILS, FOV, FOX, BASE, DIAL, tailPoint, layoutOrbs, orbPos, camDist, viewShift, type OrbIn, type Orb, type V3,
} from '../lib/foxsky';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const GOLD = new Color('#d9ae55'), BRASS = new Color('#c4954a'), STEEL = new Color('#9db2bc'), FIRE = new Color('#f0c872');
const SAMPLES = 150, STRANDS = 7, SPARKS = 36, FLY_MS = 800;

const POINT_VS = /* glsl */ `
  uniform float uK; uniform float uTime; uniform float uPx;
  attribute float aSize; attribute float aLit; attribute float aSeed; attribute float aHover;
  varying float vLit; varying float vHover;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float flick = 0.86 + 0.14 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 40.0);
    gl_PointSize = aSize * (1.0 + aHover * 1.1) * flick * uK * uPx / -mv.z;
    gl_Position = projectionMatrix * mv;
    vLit = aLit; vHover = aHover;
  }`;
const POINT_FS = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor; uniform float uAlpha; varying float vLit; varying float vHover;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;
    float core = smoothstep(0.34, 0.0, d); float halo = pow(max(0.0, 1.0 - d), 1.8);
    vec3 col = mix(uColor, vec3(1.0, 0.95, 0.78), core * (0.55 + vHover * 0.45));
    float a = (halo * 0.8 + core) * vLit * uAlpha;
    gl_FragColor = vec4(col * a, a);
  }`;
// the dial: a sweep of light travels round the ring like the needle of a gauge
const DIAL_VS = /* glsl */ `
  uniform float uK; uniform float uTime; uniform float uPx;
  attribute float aSize; attribute float aLit; attribute float aAng;
  varying float vLit; varying float vHover;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float sweep = pow(0.5 + 0.5 * cos(aAng - uTime * 0.7), 5.0);
    gl_PointSize = aSize * (1.0 + sweep * 0.5) * uK * uPx / -mv.z;
    gl_Position = projectionMatrix * mv;
    vLit = aLit * (0.4 + 0.9 * sweep); vHover = sweep * 0.4;
  }`;
// the fox: hot gold facets (face normal from screen derivatives, so the low poly shows), a fresnel rim and a pulse climbing the body
const FOX_VS = /* glsl */ `
  #include <skinning_pars_vertex>
  varying vec3 vV; varying vec3 vO;
  void main() {
    #include <beginnormal_vertex>
    #include <begin_vertex>
    #include <skinbase_vertex>
    #include <skinning_vertex>
    vO = position;
    vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const FOX_FS = /* glsl */ `
  uniform float uTime; uniform float uAlpha; varying vec3 vV; varying vec3 vO;
  void main() {
    vec3 v = normalize(vV);
    vec3 fn = normalize(cross(dFdx(vV), dFdy(vV)));
    if (dot(fn, v) < 0.0) fn = -fn;
    float rim = pow(1.0 - clamp(dot(fn, v), 0.0, 1.0), 2.4);
    vec3 L = normalize(vec3(-0.45, 0.75, 0.55));
    float dif = max(dot(fn, L), 0.0);
    float spec = pow(max(dot(reflect(-L, fn), v), 0.0), 20.0);
    float pulse = 0.5 + 0.5 * sin(vO.y * 0.11 + vO.z * 0.045 - uTime * 1.7);
    vec3 col = vec3(0.07, 0.045, 0.02) + vec3(0.62, 0.42, 0.14) * dif * 0.42 + vec3(1.0, 0.8, 0.42) * spec * 0.6
      + vec3(0.9, 0.66, 0.24) * rim * 0.7 + vec3(0.8, 0.55, 0.18) * 0.1 * pulse;
    gl_FragColor = vec4(col * uAlpha, 1.0);
  }`;
const WIRE_FS = /* glsl */ `
  uniform float uAlpha; varying vec3 vV; varying vec3 vO;
  void main() { float a = 0.26 * uAlpha; gl_FragColor = vec4(vec3(0.95, 0.72, 0.3) * a, a); }`;
const EMBER_VS = /* glsl */ `
  uniform float uK; uniform float uTime; uniform float uPx; uniform vec3 uPointer; uniform float uGather; uniform float uIntro; uniform vec2 uSpan;
  attribute float aSize; attribute float aSeed; attribute vec3 aBase;
  varying float vLit; varying float vHover;
  void main() {
    float f = fract(aBase.y + uTime * (0.014 + aSeed * 0.02));
    vec3 p = vec3(aBase.x * uSpan.x, (f - 0.5) * uSpan.y, aBase.z * 3.0);
    p.x += sin(uTime * 0.45 + aSeed * 30.0 + f * 6.0) * 0.22;
    vec3 to = uPointer - p; float dist = length(to.xy);
    float pull = uGather * smoothstep(3.2, 0.0, dist);
    p.xy += normalize(to.xy + 0.0001) * pull * min(dist, 1.6) * 0.95;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * (1.0 + pull * 1.8) * uK * uPx / -mv.z;
    gl_Position = projectionMatrix * mv;
    vLit = smoothstep(0.0, 0.08, f) * smoothstep(1.0, 0.65, f) * (0.3 + pull * 1.1) * uIntro; vHover = pull;
  }`;

type Uni = Record<string, { value: unknown }>;
function mat(vs: string, color: Color, extra: Uni = {}) {
  return new ShaderMaterial({
    vertexShader: vs, fragmentShader: POINT_FS, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uK: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uAlpha: { value: 1 }, uColor: { value: color.clone() }, ...extra },
  });
}
const attr = (g: BufferGeometry, name: string, arr: Float32Array, n = 1) => { const a = new BufferAttribute(arr, n); g.setAttribute(name, a); return a; };
const rnd = (i: number, n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };

export function mount(host: HTMLElement) {
  const orbIn: OrbIn[] = JSON.parse(host.dataset.orbs || '[]');
  const orbs: Orb[] = layoutOrbs(orbIn);
  const lis = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.sky__li').forEach((li) => lis.set(li.dataset.slug!, li));
  const labelEls = [...host.querySelectorAll<HTMLElement>('.sky__label')];
  const zone = host.closest<HTMLElement>('.hero') ?? host;
  const small = matchMedia('(max-width: 639px), (pointer: coarse)').matches;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch { host.classList.add('is-still'); return; }
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  const bg = new Color(getComputedStyle(zone).backgroundColor || '#14120f');
  renderer.setClearColor(bg, 1);
  const canvas = renderer.domElement;
  canvas.className = 'sky__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);

  const scene = new Scene();
  scene.background = bg;
  const camera = new PerspectiveCamera(FOV, 2, 0.1, 120);
  const root = new Group();
  scene.add(root);

  // --- brass dial under the fox: three rings, 72 ticks, 12 sign spokes and nodes, all as glowing dots on a flat ring
  const dialPts: number[] = [], dialSize: number[] = [], dialLit: number[] = [], dialAng: number[] = [];
  const addDial = (x: number, y: number, size: number, lit: number) => { dialPts.push(x, y, 0); dialSize.push(size); dialLit.push(lit); dialAng.push(Math.atan2(y, x)); };
  const ring = (r: number, step: number, size: number, lit: number) => { const n = Math.round((Math.PI * 2 * r) / step); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; addDial(Math.cos(a) * r, Math.sin(a) * r, size, lit); } };
  ring(DIAL.r, 0.06, 0.08, 1.0); ring(DIAL.r * 0.9, 0.08, 0.05, 0.6); ring(DIAL.r * 0.58, 0.09, 0.045, 0.5);
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, big = i % 6 === 0; for (let j = 0; j < (big ? 6 : 2); j++) { const r = DIAL.r * (1.0 - 0.1 * (j / 5) - (big ? 0 : 0.0)); const rr = big ? r : DIAL.r * (1 - 0.04 * j); addDial(Math.cos(a) * rr, Math.sin(a) * rr, big ? 0.05 : 0.035, big ? 0.9 : 0.5); } }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    for (let r = DIAL.r * 0.58; r < DIAL.r * 0.9; r += 0.14) addDial(Math.cos(a) * r, Math.sin(a) * r, 0.035, 0.4);
    const m = a + Math.PI / 12; addDial(Math.cos(m) * DIAL.r * 0.76, Math.sin(m) * DIAL.r * 0.76, 0.2, 0.95);
  }
  const dialGeo = new BufferGeometry();
  attr(dialGeo, 'position', new Float32Array(dialPts), 3); attr(dialGeo, 'aSize', new Float32Array(dialSize)); attr(dialGeo, 'aLit', new Float32Array(dialLit)); attr(dialGeo, 'aAng', new Float32Array(dialAng));
  const dialMat = mat(DIAL_VS, BRASS, { uAlpha: { value: 0 } });
  const dialPoints = new Points(dialGeo, dialMat); dialPoints.frustumCulled = false;
  const dialSpin = new Group(), dialTilt = new Group();
  dialSpin.add(dialPoints); dialTilt.add(dialSpin); dialTilt.position.set(DIAL.cx, DIAL.cy, -0.4); dialTilt.rotation.x = -DIAL.tilt;
  root.add(dialTilt);

  // --- the fox: Khronos "Fox" glb (model PixelMannen CC0, rig and animation tomkranis CC BY 4.0); the slow Survey cycle plays,
  // the head follows the pointer, and the nine tails of foxfire grow from the tail bone
  const foxGroup = new Group();
  foxGroup.scale.setScalar(FOX.scale); foxGroup.rotation.y = FOX.yaw; foxGroup.position.set(FOX.x, FOX.y, FOX.z);
  root.add(foxGroup);
  const foxU = { uTime: { value: 0 }, uAlpha: { value: 0 } };
  const foxMat = new ShaderMaterial({ vertexShader: FOX_VS, fragmentShader: FOX_FS, uniforms: foxU, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const wireMat = new ShaderMaterial({ vertexShader: FOX_VS, fragmentShader: WIRE_FS, uniforms: foxU, wireframe: true, transparent: true, depthWrite: false, blending: AdditiveBlending });
  let mixer: AnimationMixer | null = null; let head: Bone | null = null, tail1: Bone | null = null, tail2: Bone | null = null;
  new GLTFLoader().load('/fox.glb', (g) => {
    const mesh = g.scene.getObjectByProperty('isSkinnedMesh', true) as SkinnedMesh;
    mesh.material = foxMat; mesh.frustumCulled = false;
    const wm = new SkinnedMesh(mesh.geometry, wireMat); wm.bind(mesh.skeleton, mesh.bindMatrix); wm.frustumCulled = false;
    mesh.matrix.decompose(wm.position, wm.quaternion, wm.scale); mesh.parent!.add(wm);
    foxGroup.add(g.scene);
    head = g.scene.getObjectByName('b_Head_05') as Bone; tail1 = g.scene.getObjectByName('b_Tail01_012') as Bone; tail2 = g.scene.getObjectByName('b_Tail02_013') as Bone;
    mixer = new AnimationMixer(g.scene);
    const act = mixer.clipAction(g.animations.find((c) => c.name === 'Survey') ?? g.animations[0]); act.timeScale = 0.55; act.play();
    mixer.update(1.0);
    headBase.copy(head.quaternion);
    headAnimated = act.getClip().tracks.some((tr) => tr.name.startsWith('b_Head_05.quaternion'));
  }, undefined, () => { /* no fox, the tails and dial still play */ });
  const headDir = new Vector3(Math.sin(FOX.yaw), 0, Math.cos(FOX.yaw)), UP = new Vector3(0, 1, 0), pitchAxis = new Vector3().crossVectors(headDir, UP).normalize();
  const baseNow: V3 = [...BASE], pq = new Quaternion(), qw = new Quaternion(), qy = new Quaternion(), qp = new Quaternion();
  // the head offset is a target angle (never summed into the bone across frames): pose + offset, rebuilt every frame
  let headYaw = 0, headPitch = 0, headAnimated = false; const headBase = new Quaternion();
  const YAW_MAX = Math.PI * 40 / 180, PITCH_MAX = Math.PI * 20 / 180;
  const wrapPi = (a: number) => a - Math.PI * 2 * Math.floor((a + Math.PI) / (Math.PI * 2));

  // --- tails: dotted strands that lick like flames, with a pulse running outwards
  const tN = TAILS.length * STRANDS * SAMPLES;
  const tGeo = new BufferGeometry(); const tPos = new Float32Array(tN * 3), tSize = new Float32Array(tN), tLit = new Float32Array(tN), tSeed = new Float32Array(tN);
  const tPosA = attr(tGeo, 'position', tPos, 3); attr(tGeo, 'aSize', tSize); const tLitA = attr(tGeo, 'aLit', tLit); attr(tGeo, 'aSeed', tSeed); attr(tGeo, 'aHover', new Float32Array(tN));
  TAILS.forEach((t, k) => { for (let s = 0; s < STRANDS; s++) for (let i = 0; i < SAMPLES; i++) {
    const n = (k * STRANDS + s) * SAMPLES + i, u = i / (SAMPLES - 1);
    tSize[n] = (s === 3 ? (t.main ? 0.17 : 0.11) : (t.main ? 0.1 : 0.065)) * (1 - 0.4 * u) + 0.012; tSeed[n] = rnd(n, 2);
  } });
  const tMat = mat(POINT_VS, GOLD); const tPoints = new Points(tGeo, tMat); tPoints.frustumCulled = false; root.add(tPoints);
  // sparks lifting off the tails
  const spN = TAILS.length * SPARKS, spGeo = new BufferGeometry(); const spPos = new Float32Array(spN * 3), spLit = new Float32Array(spN);
  const spPosA = attr(spGeo, 'position', spPos, 3); attr(spGeo, 'aSize', Float32Array.from({ length: spN }, (_, i) => 0.04 + rnd(i, 11) * 0.07)); const spLitA = attr(spGeo, 'aLit', spLit);
  attr(spGeo, 'aSeed', Float32Array.from({ length: spN }, (_, i) => rnd(i, 12))); attr(spGeo, 'aHover', new Float32Array(spN));
  const spMat = mat(POINT_VS, FIRE); const sparks = new Points(spGeo, spMat); sparks.frustumCulled = false; root.add(sparks);
  const spine = TAILS.map((t) => {
    const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(48 * 3), 3));
    const l = new Line(g, new LineBasicMaterial({ color: GOLD, transparent: true, opacity: t.main ? 0.7 : 0.3, blending: AdditiveBlending, depthWrite: false }));
    l.frustumCulled = false; root.add(l); return l;
  });

  // --- project flames
  const oN = orbs.length;
  const oGeo = new BufferGeometry(); const oPosA = attr(oGeo, 'position', new Float32Array(oN * 3), 3);
  const oSize = new Float32Array(oN), oLit = new Float32Array(oN), oSeed = new Float32Array(oN), oHover = new Float32Array(oN);
  orbs.forEach((o, i) => { oSize[i] = o.featured ? 0.5 : 0.36; oSeed[i] = ((i * 53) % 29) / 29; });
  attr(oGeo, 'aSize', oSize); const oLitA = attr(oGeo, 'aLit', oLit); attr(oGeo, 'aSeed', oSeed); const oHoverA = attr(oGeo, 'aHover', oHover);
  const oMat = mat(POINT_VS, FIRE); const oPoints = new Points(oGeo, oMat); oPoints.frustumCulled = false; root.add(oPoints);

  // --- embers the pointer gathers
  const EMBERS = small ? 800 : 3000;
  const eGeo = new BufferGeometry();
  const eBase = new Float32Array(EMBERS * 3), eSize = new Float32Array(EMBERS), eSeed = new Float32Array(EMBERS);
  for (let i = 0; i < EMBERS; i++) { eBase[i * 3] = rnd(i, 1) - 0.5; eBase[i * 3 + 1] = rnd(i, 2); eBase[i * 3 + 2] = rnd(i, 3) - 0.5; eSize[i] = 0.03 + Math.pow(rnd(i, 4), 4) * 0.2; eSeed[i] = rnd(i, 5); }
  attr(eGeo, 'position', new Float32Array(EMBERS * 3), 3); attr(eGeo, 'aBase', eBase, 3); attr(eGeo, 'aSize', eSize); attr(eGeo, 'aSeed', eSeed);
  const eMat = new ShaderMaterial({
    vertexShader: EMBER_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uK: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uAlpha: { value: 1 }, uColor: { value: new Color('#e8b85c') }, uPointer: { value: new Vector3() }, uGather: { value: 0 }, uIntro: { value: 0 }, uSpan: { value: [10, 6] } },
  });
  const embers = new Points(eGeo, eMat); embers.frustumCulled = false; scene.add(embers);

  // --- links from the hovered flame to the others of its trade
  const linkGeo = new BufferGeometry(); const linkA = attr(linkGeo, 'position', new Float32Array(12 * 2 * 3), 3);
  const linkMat = new LineBasicMaterial({ color: FIRE, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  const links = new LineSegments(linkGeo, linkMat); links.frustumCulled = false; root.add(links);

  // --- bloom
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.8, 0.5, 0.35);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // --- state
  const st = {
    t: 0, intro: 0, paused: false, visible: true, w: 1, h: 1, aspect: 2,
    yaw: 0, pitch: 0, yawV: 0, pitchV: 0, dragging: false, lastX: 0, lastY: 0,
    px: 0, py: 0, ppx: 0, ppy: 0, inside: false, gather: 0, pointerLocal: new Vector3(),
    sway: TAILS.map(() => 0), swayV: TAILS.map(() => 0),
    hover: -1, hoverAmt: orbs.map(() => 0), off: orbs.map(() => [0, 0, 0] as V3),
    fly: null as null | { t0: number; from: Vector3; to: Vector3 },
  };
  const orbPosNow: Vector3[] = orbs.map(() => new Vector3());
  const tmp = new Vector3(), world = new Vector3();
  const tailU = Array.from({ length: SAMPLES }, (_, i) => i / (SAMPLES - 1));
  const matList = [spMat,  tMat, oMat, eMat, dialMat];

  function resize() {
    const r = host.getBoundingClientRect();
    st.w = Math.max(1, Math.round(r.width)); st.h = Math.max(1, Math.round(r.height)); st.aspect = st.w / st.h;
    renderer.setSize(st.w, st.h, false); composer.setSize(st.w, st.h);
    bloom.resolution.set(Math.round(st.w / 2), Math.round(st.h / 2));
    camera.aspect = st.aspect; camera.updateProjectionMatrix();
    const [sx, sy] = viewShift(st.aspect); root.position.set(sx, sy, 0);
    const th = Math.tan((FOV / 2) * (Math.PI / 180)), visH = 2 * camDist(st.aspect) * th;
    eMat.uniforms.uSpan.value = [visH * st.aspect * 1.2, visH * 1.25];
    const K = st.h / (2 * th);
    for (const m of matList) { m.uniforms.uK.value = K; m.uniforms.uPx.value = dpr; }
  }

  // --- pointer: the whole hero listens, the canvas takes the drag
  const setPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    st.px = ((e.clientX - r.left) / r.width) * 2 - 1; st.py = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  zone.addEventListener('pointermove', (e) => {
    setPointer(e); st.inside = e.pointerType !== 'touch' || st.dragging;
    if (st.dragging) {
      const dx = e.clientX - st.lastX, dy = e.clientY - st.lastY;
      st.yawV = dx * 0.0042; st.pitchV = dy * 0.0028; st.yaw = clamp(st.yaw + st.yawV, -0.9, 0.9); st.pitch = clamp(st.pitch + st.pitchV, -0.4, 0.4);
      st.lastX = e.clientX; st.lastY = e.clientY;
    }
  });
  zone.addEventListener('pointerleave', () => { st.inside = false; });
  host.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    st.dragging = true; st.lastX = e.clientX; st.lastY = e.clientY; setPointer(e); st.inside = true;
    host.setPointerCapture?.(e.pointerId); host.classList.add('is-drag');
  });
  const endDrag = () => { st.dragging = false; host.classList.remove('is-drag'); };
  host.addEventListener('pointerup', endDrag); host.addEventListener('pointercancel', endDrag);

  // --- anchors: hover, focus, click (the click flies the camera to the flame, then the page opens)
  orbs.forEach((o, i) => {
    const a = lis.get(o.slug)?.querySelector('a'); if (!a) return;
    const on = () => { st.hover = i; }, off = () => { if (st.hover === i) st.hover = -1; };
    a.addEventListener('pointerenter', on); a.addEventListener('pointerleave', off); a.addEventListener('focus', on); a.addEventListener('blur', off);
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      root.updateMatrixWorld(); const w = orbPosNow[i].clone().applyMatrix4(root.matrixWorld);
      st.fly = { t0: performance.now(), from: camera.position.clone(), to: w };
      setTimeout(() => { location.href = a.href; }, FLY_MS + 40);
    });
  });
  window.addEventListener('pageshow', () => { st.fly = null; });

  const pauseBtn = host.querySelector<HTMLButtonElement>('.sky__pause');
  if (pauseBtn) {
    pauseBtn.hidden = false;
    pauseBtn.addEventListener('click', () => {
      st.paused = !st.paused; pauseBtn.setAttribute('aria-pressed', String(st.paused)); pauseBtn.textContent = st.paused ? 'Resume motion' : 'Pause motion';
    });
  }
  new IntersectionObserver(([en]) => { st.visible = en.isIntersecting; }, { threshold: 0 }).observe(host);
  let stop = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop = true; host.classList.remove('is-live'); host.classList.add('is-still'); canvas.remove(); });

  function draw(dt: number) {
    const I = st.intro, t = st.t;
    const base = camDist(st.aspect), th = Math.tan((FOV / 2) * (Math.PI / 180));
    const wx = st.px * base * th * st.aspect, wy = st.py * base * th;
    root.rotation.y = st.yaw + Math.sin(t * 0.11) * 0.07; root.rotation.x = -st.pitch + Math.sin(t * 0.08) * 0.03;
    root.updateMatrixWorld();
    world.set(wx - root.position.x, wy - root.position.y, 0); st.pointerLocal.copy(world);
    const vx = st.px - st.ppx; st.ppx = st.px; st.ppy = st.py;
    if (!st.dragging) { st.yaw += (0 - st.yaw) * 0.006 + st.yawV; st.pitch += (0 - st.pitch) * 0.01 + st.pitchV; st.yawV *= 0.92; st.pitchV *= 0.92; }
    st.gather += ((st.inside && !st.dragging ? 1 : 0) - st.gather) * 0.08;
    dialSpin.rotation.z = t * 0.06;

    // fox: animation, head turned towards the pointer within limits, tail stub shrunk so the foxfire tails grow from it
    if (mixer) {
      mixer.update(dt);
      const hb = head!; root.updateMatrixWorld(true);
      if (headAnimated) headBase.copy(hb.quaternion); else hb.quaternion.copy(headBase);
      const hn = hb.getWorldPosition(new Vector3()).project(camera);
      const ok = st.inside && Number.isFinite(hn.x + hn.y) && hn.z < 1;
      const wantY = ok ? clamp((st.px - hn.x) * 0.9, -YAW_MAX, YAW_MAX) : 0, wantP = ok ? clamp((st.py - hn.y) * 0.7, -PITCH_MAX, PITCH_MAX) : 0;
      headYaw = clamp(headYaw + wrapPi(wantY - headYaw) * 0.07, -YAW_MAX, YAW_MAX); headPitch = clamp(headPitch + wrapPi(wantP - headPitch) * 0.07, -PITCH_MAX, PITCH_MAX);
      hb.parent!.getWorldQuaternion(pq);
      qy.setFromAxisAngle(UP, headYaw); qp.setFromAxisAngle(pitchAxis, headPitch); qw.copy(qy).multiply(qp);
      hb.quaternion.premultiply(pq.clone().invert().multiply(qw).multiply(pq));
      tail2!.scale.setScalar(0.02);
      foxGroup.updateMatrixWorld(true);
      tail1!.getWorldPosition(tmp); root.worldToLocal(tmp); baseNow[0] = tmp.x; baseNow[1] = tmp.y; baseNow[2] = tmp.z;
    }
    foxU.uTime.value = t; foxU.uAlpha.value = smooth(0, 0.3, I);

    // tail sway: pointer speed pushes the tails near it, springs bring them back, staggered per tail
    TAILS.forEach((tl, k) => {
      const tip = tailPoint(tl, 0.85, st.sway[k], t, baseNow);
      const near = Math.exp(-(((tip[0] - st.pointerLocal.x) ** 2 + (tip[1] - st.pointerLocal.y) ** 2) / 7)) * (st.inside ? 1 : 0);
      const stiff = 12 + k * 1.4;
      st.swayV[k] += (-stiff * st.sway[k] - 2.6 * st.swayV[k] + vx * 300 * near) * dt;
      st.sway[k] = clamp(st.sway[k] + st.swayV[k] * dt, -1.4, 1.4);
    });

    // tails: three strands round a spine, a pulse running to the tip
    TAILS.forEach((tl, k) => {
      const p = clamp((I * 1.4 - k * 0.07) / 0.55), sp = spine[k].geometry.getAttribute('position') as BufferAttribute;
      const mult = tl.main ? 1.3 : 0.7;
      for (let i = 0; i < 48; i++) { const q = tailPoint(tl, i / 47, st.sway[k], t, baseNow); sp.setXYZ(i, q[0], q[1], q[2]); }
      sp.needsUpdate = true; spine[k].geometry.setDrawRange(0, Math.max(0, Math.floor(48 * p)));
      for (let i = 0; i < SAMPLES; i++) {
        const u = tailU[i], q = tailPoint(tl, u, st.sway[k], t, baseNow), q2 = tailPoint(tl, Math.min(1, u + 0.02), st.sway[k], t, baseNow);
        let nx = -(q2[1] - q[1]), ny = q2[0] - q[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        const wd = (0.05 + 0.3 * Math.sin(Math.PI * Math.min(1, u * 1.1))) * (tl.main ? 1 : 0.8);
        const pulse = 0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin(u * 15 - t * 3.2 + tl.phase), 3);
        const lit = smooth(u - 0.02, u, p) * mult * pulse * (1 - 0.3 * u);
        for (let s = 0; s < STRANDS; s++) {
          const n = (k * STRANDS + s) * SAMPLES + i, o = ((s - 3) / 3) * wd;
          tPos[n * 3] = q[0] + nx * o; tPos[n * 3 + 1] = q[1] + ny * o; tPos[n * 3 + 2] = q[2]; tLit[n] = lit * (s === 3 ? 1 : 0.55);
        }
      }
    });
    tPosA.needsUpdate = true; tLitA.needsUpdate = true;
    TAILS.forEach((tl, k) => {
      const p = clamp((I * 1.4 - k * 0.07) / 0.55);
      for (let j = 0; j < SPARKS; j++) {
        const n = k * SPARKS + j, sd = rnd(n, 21), life = (sd + t * (0.07 + rnd(n, 22) * 0.08)) % 1, u = 0.15 + 0.85 * ((sd * 7.3) % 1) * Math.min(1, life * 1.6);
        const q = tailPoint(tl, Math.min(1, u), st.sway[k], t, baseNow), rise = life * life * (1.2 + rnd(n, 23));
        spPos[n * 3] = q[0] + (rnd(n, 24) - 0.5) * 0.5 * life; spPos[n * 3 + 1] = q[1] + rise; spPos[n * 3 + 2] = q[2];
        spLit[n] = smooth(0, 0.1, life) * smooth(1, 0.55, life) * (tl.main ? 1.1 : 0.55) * smooth(u - 0.05, u, p);
      }
    });
    spPosA.needsUpdate = true; spLitA.needsUpdate = true;

    // flames
    const hoveredOrb = st.hover >= 0 ? orbs[st.hover] : null;
    orbs.forEach((o, i) => {
      const ti = TAILS.findIndex((x) => x.body === o.body);
      const p = clamp((I * 1.4 - ti * 0.07) / 0.55);
      st.hoverAmt[i] += ((hoveredOrb === o ? 1 : 0) - st.hoverAmt[i]) * 0.18;
      const pos = orbPos(o, st.sway[ti], t, baseNow);
      const dx = st.pointerLocal.x - pos[0], dy = st.pointerLocal.y - pos[1], d = Math.hypot(dx, dy);
      const w = st.gather * smooth(2.0, 0, d) * 0.3;
      st.off[i][0] += (dx * w - st.off[i][0]) * 0.1; st.off[i][1] += (dy * w - st.off[i][1]) * 0.1;
      orbPosNow[i].set(pos[0] + st.off[i][0], pos[1] + st.off[i][1], pos[2]);
      oPosA.setXYZ(i, orbPosNow[i].x, orbPosNow[i].y, orbPosNow[i].z);
      oLit[i] = smooth(o.u - 0.04, o.u + 0.02, p) * (0.95 + st.hoverAmt[i] * 0.9);
      oHover[i] = st.hoverAmt[i];
    });
    oPosA.needsUpdate = true; oLitA.needsUpdate = true; oHoverA.needsUpdate = true;

    let ln = 0;
    if (hoveredOrb) orbs.forEach((o, i) => { if (i !== st.hover && o.domain === hoveredOrb.domain && ln < 12) { const a = orbPosNow[st.hover], b = orbPosNow[i]; linkA.setXYZ(ln * 2, a.x, a.y, a.z); linkA.setXYZ(ln * 2 + 1, b.x, b.y, b.z); ln++; } });
    linkA.needsUpdate = true; linkGeo.setDrawRange(0, ln * 2);
    linkMat.opacity += ((hoveredOrb ? 0.8 : 0) - linkMat.opacity) * 0.14;

    // camera: drift, pointer parallax, or the click flight
    camera.position.set(Math.sin(t * 0.12) * 0.3 + st.px * 0.3, Math.sin(t * 0.09) * 0.16 + st.py * 0.16, base);
    const lookAt = tmp.set(0, 0, 0);
    if (st.fly) {
      const k = ease(clamp((performance.now() - st.fly.t0) / FLY_MS));
      camera.position.lerpVectors(st.fly.from, new Vector3(st.fly.to.x, st.fly.to.y, st.fly.to.z + 2.3), k);
      lookAt.copy(st.fly.to).multiplyScalar(k);
    }
    camera.lookAt(lookAt);

    for (const m of matList) m.uniforms.uTime.value = t;
    eMat.uniforms.uPointer.value.set(wx, wy, 0); eMat.uniforms.uGather.value = st.gather; eMat.uniforms.uIntro.value = smooth(0.05, 0.5, I);
    dialMat.uniforms.uAlpha.value = smooth(0, 0.35, I);
    composer.render();

    // DOM anchors follow the flames and tail labels
    camera.updateMatrixWorld(); root.updateMatrixWorld();
    orbs.forEach((o, i) => {
      const li = lis.get(o.slug); if (!li) return;
      tmp.copy(orbPosNow[i]).applyMatrix4(root.matrixWorld).project(camera);
      const sx = ((tmp.x + 1) / 2) * st.w, sy = ((1 - tmp.y) / 2) * st.h;
      li.style.transform = `translate(${sx}px, ${sy}px)`;
      li.classList.toggle('is-left', sx > st.w * 0.78); li.classList.toggle('is-right', sx < st.w * 0.22); li.classList.toggle('is-low', sy < 96);
    });
    labelEls.forEach((el) => {
      const k = TAILS.findIndex((x) => x.body === el.dataset.body), q = tailPoint(TAILS[k], 1.0, st.sway[k], t, baseNow);
      tmp.set(q[0], q[1], q[2]).applyMatrix4(root.matrixWorld).project(camera);
      el.style.transform = `translate(${((tmp.x + 1) / 2) * st.w}px, ${((1 - tmp.y) / 2) * st.h}px)`;
      el.style.opacity = String(smooth(0.55, 0.9, I));
    });
  }

  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  let last = performance.now(), first = true;
  function frame(now: number) {
    if (stop) return;
    requestAnimationFrame(frame);
    const raw = (now - last) / 1000; last = now;
    if (!st.visible || document.hidden) return;
    if (first) { first = false; host.classList.add('is-live'); }
    const dt = Math.min(0.05, raw);
    if (!st.paused) { st.t += dt; st.intro = clamp(st.intro + Math.min(0.25, raw) / 3.6); }
    draw(dt);
  }
  requestAnimationFrame(frame);
}

