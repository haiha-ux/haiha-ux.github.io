// kind "pcb3d": GLB exported by `kicad-cli pcb export glb`, viewed with three.js (orbit, zoom, top/bottom/iso).
// props: src (glb URL, meshopt-compressed ok), fallback (still image URL), title?, note?
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ensureStyle, h, needStr, reducedMotion, themeColor } from "./_ui";

type View = "top" | "bottom" | "iso";

export async function mount(el: HTMLElement, props: Record<string, unknown>): Promise<() => void> {
  ensureStyle();
  const src = needStr(props, "src");
  const fallback = typeof props.fallback === "string" ? props.fallback : "";
  const title = typeof props.title === "string" ? props.title : "PCB 3D view";
  const note = typeof props.note === "string" ? props.note : "";
  const compact = props.compact === true; // a bare turning board for a card: no title, buttons or status line

  const status = h("div", { class: "dm-tip", role: "status", "aria-live": "polite" }, "Loading 3D board...");
  const bar = h("div", { style: "height:3px;background:color-mix(in srgb,var(--muted,#A39A8A) 30%,transparent);border-radius:2px;overflow:hidden" });
  const fill = h("div", { style: "height:100%;width:0;background:var(--accent,#D9AE55);transition:width .15s" });
  bar.append(fill);
  const stage = h("div", { style: compact ? `position:absolute;inset:0;overflow:hidden;background:var(--bg,#14120F)${fallback ? ` url(${fallback}) center/cover` : ""}` : "position:relative;width:100%;aspect-ratio:4/3;max-height:70vh;min-height:240px;border-radius:8px;overflow:hidden;background:var(--bg,#14120F)" });
  const buttons = h("div", { class: "dm-row", role: "group", "aria-label": "Camera view" });
  const root = compact ? h("div", { class: "dm dm--compact", style: "position:absolute;inset:0;padding:0;border:0;border-radius:0;background:none" }, stage) : h("div", { class: "dm" }, h("h3", {}, title), stage, bar, buttons, status);
  if (note) root.append(h("p", { class: "dm-note" }, note));
  el.append(root);

  let disposed = false;
  let cleanup = () => {};

  const showFallback = (why: string) => {
    stage.replaceChildren();
    if (fallback) stage.append(h("img", { src: fallback, alt: `${title}: still render`, style: "width:100%;height:100%;object-fit:contain" }));
    status.textContent = `3D view unavailable (${why}); showing a still render.`;
    bar.remove();
    buttons.remove();
  };

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: compact, powerPreference: "low-power" });
  } catch (e) {
    showFallback("WebGL is not available");
    return () => root.remove();
  }
  const bg = new THREE.Color(themeColor(el, "--bg"));
  renderer.setClearColor(bg, compact ? 0 : 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${title}. Drag to rotate, scroll to zoom, arrow keys rotate, plus and minus zoom.`);
  canvas.tabIndex = 0;
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
  stage.append(canvas);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xffeccc, 0x2a2118, 0.5));
  const key = new THREE.DirectionalLight(0xffd9a0, 2.2); // warm candle key light
  key.position.set(-1, 2, 1.2);
  const fillL = new THREE.DirectionalLight(0xa9bcc6, 0.6); // cool steel fill
  fillL.position.set(1.5, -1, -1);
  scene.add(key, fillL);

  const camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.001, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reducedMotion();
  controls.dampingFactor = 0.12;
  controls.screenSpacePanning = true;
  if (compact && !reducedMotion()) { controls.autoRotate = true; controls.autoRotateSpeed = 1.6; controls.enablePan = false; controls.enableZoom = false; }

  let needs = true;
  const request = () => { needs = true; };
  controls.addEventListener("change", request);

  const resize = () => {
    const w = stage.clientWidth, hgt = stage.clientHeight;
    if (!w || !hgt) return;
    renderer.setSize(w, hgt, false);
    camera.aspect = w / hgt;
    camera.updateProjectionMatrix();
    request();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  // camera presets, filled in once the board bounds are known
  const presets: Record<View, { pos: THREE.Vector3 }> = {
    top: { pos: new THREE.Vector3() },
    bottom: { pos: new THREE.Vector3() },
    iso: { pos: new THREE.Vector3() },
  };
  let anim: { t0: number; from: THREE.Vector3; to: THREE.Vector3 } | null = null;
  let current: View = "iso";
  const viewButtons: Record<string, HTMLButtonElement> = {};
  const setPressed = () => Object.entries(viewButtons).forEach(([k, b]) => b.setAttribute("aria-pressed", String(k === current)));
  const goto = (v: View) => {
    current = v;
    setPressed();
    const p = presets[v];
    const dist = camera.position.distanceTo(controls.target);
    const to = p.pos.clone().sub(controls.target).setLength(dist).add(controls.target);
    if (reducedMotion()) { camera.position.copy(to); anim = null; } else anim = { t0: performance.now(), from: camera.position.clone(), to };
    controls.update();
    request();
  };
  for (const [v, label] of [["top", "Top"], ["bottom", "Bottom"], ["iso", "Isometric"]] as [View, string][]) {
    const b = h("button", { type: "button", "aria-pressed": "false", onclick: () => goto(v) }, label);
    viewButtons[v] = b;
    buttons.append(b);
  }
  const reset = h("button", { type: "button", onclick: () => { fit(); goto("iso"); } }, "Reset");
  buttons.append(reset);

  let size = 1;
  let boardMm = "";
  const fit = () => {
    const d = (size / 2) / Math.tan((camera.fov * Math.PI) / 360) * 1.0;
    controls.target.copy(center);
    camera.position.copy(controls.target).add(new THREE.Vector3(0.55, 0.8, 0.9).setLength(d));
    controls.minDistance = d * 0.15;
    controls.maxDistance = d * 3;
    controls.update();
  };
  const center = new THREE.Vector3();

  // keyboard: arrows rotate, +/- zoom
  const onKey = (e: KeyboardEvent) => {
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    const step = 0.12;
    if (e.key === "ArrowLeft") sph.theta -= step;
    else if (e.key === "ArrowRight") sph.theta += step;
    else if (e.key === "ArrowUp") sph.phi = Math.max(0.05, sph.phi - step);
    else if (e.key === "ArrowDown") sph.phi = Math.min(Math.PI - 0.05, sph.phi + step);
    else if (e.key === "+" || e.key === "=") sph.radius *= 0.88;
    else if (e.key === "-") sph.radius *= 1.14;
    else return;
    e.preventDefault();
    camera.position.copy(controls.target).add(off.setFromSpherical(sph));
    controls.update();
    request();
  };
  canvas.addEventListener("keydown", onKey);

  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (anim) {
      const k = Math.min(1, (performance.now() - anim.t0) / 450);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(anim.from, anim.to, e);
      if (k >= 1) anim = null;
      request();
    }
    if (controls.update()) needs = true; // damping
    if (needs) { needs = false; renderer.render(scene, camera); }
  };

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  loader.load(
    src,
    (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      model.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (m && "metalness" in m && m.metalness > 0.9) m.roughness = Math.max(m.roughness, 0.35);
      });
      scene.add(model);
      const box = new THREE.Box3().setFromObject(model);
      const sz = box.getSize(new THREE.Vector3());
      box.getCenter(center);
      size = Math.max(sz.x, sz.z);
      // glTF from KiCad is in metres: x/z span the board, y is thickness
      boardMm = `${(sz.x * 1000).toFixed(1)} x ${(sz.z * 1000).toFixed(1)} mm`;
      const cx = center.x, cy = center.y, cz = center.z;
      const d = size * 2.2;
      presets.top.pos.set(cx, cy + d, cz + d * 0.002); // tiny offset: OrbitControls cannot sit exactly on the pole
      presets.bottom.pos.set(cx, cy - d, cz + d * 0.002);
      presets.iso.pos.set(cx + 0.55 * d, cy + 0.8 * d, cz + 0.9 * d);
      fit();
      goto("iso");
      fill.style.width = "100%";
      bar.style.display = "none";
      status.textContent = `Board ${boardMm}. Drag to rotate, scroll to zoom. Copper, soldermask and silkscreen only.`;
      canvas.dataset.ready = "1";
      resize();
    },
    (ev) => {
      if (ev.lengthComputable && ev.total) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        fill.style.width = pct + "%";
        status.textContent = `Loading 3D board... ${pct}%`;
      } else {
        fill.style.width = "60%";
      }
    },
    (err) => {
      if (disposed) return;
      cleanup();
      showFallback(err instanceof Error ? err.message : "load error");
    },
  );

  const onLost = (e: Event) => { e.preventDefault(); cleanup(); showFallback("WebGL context lost"); };
  canvas.addEventListener("webglcontextlost", onLost);
  resize();
  loop();

  cleanup = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    canvas.removeEventListener("keydown", onKey);
    canvas.removeEventListener("webglcontextlost", onLost);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    pm.dispose();
    renderer.dispose();
  };
  return () => {
    disposed = true;
    cleanup();
    root.remove();
  };
}
