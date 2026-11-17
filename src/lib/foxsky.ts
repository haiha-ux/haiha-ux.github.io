// Geometry of the nine-tailed fox scene, shared by the build-time anchors (Sky.astro) and the live three.js scene.
// A 3D fox looks left towards the words; nine tails of foxfire fan out from its tail bone. The nine bodies in sky.json decide
// which slot of the fan each tail takes, and the longitude sets that tail's length, curl and depth. Symbols for fun, not science.
import sky from '../data/sky.json';

export type V3 = [number, number, number];
export type Body = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
const NINE: Body[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

/** The three bright tails are the three trades; the other six hold the remaining projects and ornament. */
export const MAIN_TAILS: Record<string, Body> = { 'edge-ai': 'sun', 'robot-learning': 'jupiter', pcb: 'neptune' };
/** Where the tails start when the fox stands at rest; the live scene replaces it with the tail bone's position. */
export const BASE: V3 = [2.1, 0.3, -0.6];
/** The fox glb (Khronos glTF Sample Assets) is ~155 long and ~79 tall; scale and yaw put it left-facing, three-quarter view, on the dial. */
export const FOX = { scale: 0.056, yaw: -1.0, x: -1.3, y: -2.0, z: 0 };
export const FOV = 40;
/** The brass dial under the fox: 12 signs, a flat ring that the scene tilts towards the viewer and turns. */
export const DIAL = { cx: -0.95, cy: -1.8, r: 3.9, tilt: 1.3 };


export type Tail = { body: Body; slot: number; theta: number; len: number; curl: number; depth: number; phase: number; main: boolean };

const lon = (b: Body) => (sky as Record<string, number>)[b];

export const TAILS: Tail[] = [...NINE]
  .sort((a, b) => lon(a) - lon(b))
  .map((body, slot) => {
    const rad = (lon(body) * Math.PI) / 180;
    return {
      body,
      slot,
      theta: ((-22 + slot * 18) * Math.PI) / 180,
      len: 4.0 + 1.0 * (0.5 + 0.5 * Math.sin(rad)),
      curl: Math.sin(rad * 2),
      depth: Math.cos(rad) * 1.1,
      phase: rad * 3,
      main: Object.values(MAIN_TAILS).includes(body),
    };
  });

export const tailOf = (b: Body) => TAILS.find((t) => t.body === b)!;

/** Point on a tail, u in 0..1 from the rump. `sway` pushes the tip sideways (pointer speed); `time` makes the tail lick like a flame. */
export function tailPoint(t: Tail, u: number, sway = 0, time = 0, base: V3 = BASE): V3 {
  const dx = Math.cos(t.theta), dy = Math.sin(t.theta), nx = -dy, ny = dx;
  const k = 0.2 + 0.1 * t.curl;
  const wave = 0.07 * t.len * u * Math.sin(5.2 * u - time * 0.75 + t.phase);
  const side = k * t.len * u * u + wave + sway * u * u * 0.8;
  return [base[0] + dx * t.len * u + nx * side, base[1] + dy * t.len * u + ny * side, base[2] + t.depth * u];
}

export type OrbIn = { slug: string; title: string; domain: string; body: Body; metric: string; featured: boolean; order: number };
export type Orb = OrbIn & { u: number; off: number; zoff: number };

/** Projects sit along the tail of their planet, ordered by `order`, tips outermost. */
export function layoutOrbs(list: OrbIn[]): Orb[] {
  const out: Orb[] = [];
  for (const t of TAILS) {
    const mine = list.filter((p) => p.body === t.body).sort((a, b) => a.order - b.order);
    mine.forEach((p, i) => {
      const n = mine.length;
      const u = n === 1 ? 0.95 : 0.34 + (0.64 * i) / (n - 1);
      out.push({ ...p, u, off: n === 1 ? 0 : (i % 2 ? 1 : -1) * 0.12, zoff: ((i * 37) % 7) * 0.05 - 0.15 });
    });
  }
  return out;
}

export function orbPos(o: Orb, sway = 0, time = 0, base: V3 = BASE): V3 {
  const t = tailOf(o.body);
  const p = tailPoint(t, o.u, sway, time, base);
  const nx = -Math.sin(t.theta), ny = Math.cos(t.theta);
  return [p[0] + nx * o.off, p[1] + ny * o.off, p[2] + o.zoff];
}

/** Bounding box of everything that must stay in frame, measured from the geometry itself (fox, nine tails with their sway, dial). */
const BOX = (() => {
  let x0 = -4.6, x1 = 3.0, y0 = -2.3, y1 = 4.0;
  const add = (x: number, y: number) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  for (const t of TAILS) for (let i = 0; i <= 20; i++) for (const sw of [-0.5, 0, 0.5]) { const q = tailPoint(t, i / 20, sw, 0); add(q[0], q[1]); }
  // the near edge of the tilted ring comes towards the camera and is magnified, so allow for it
  const ry = DIAL.r * Math.cos(DIAL.tilt) * 1.45;
  add(DIAL.cx - DIAL.r * 1.12, DIAL.cy - ry); add(DIAL.cx + DIAL.r * 1.12, DIAL.cy + ry);
  return { x0: x0 - 0.15, x1: x1 + 0.35, y0: y0 - 0.15, y1: y1 + 0.35 };
})();
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Share of the frame the scene may use: the right part on a wide hero (words on the left), the lower part on a phone. */
function fit(aspect: number) {
  const k = clamp((aspect - 1.0) / 0.45);
  return { fw: 1 - 0.43 * k, cx: 0.5 + 0.2 * k, cy: 0.5 + 0.05 * k, fh: 0.97 - 0.1 * k };
}

export function camDist(aspect: number): number {
  const th = Math.tan((FOV / 2) * (Math.PI / 180));
  const f = fit(aspect);
  const w = ((BOX.x1 - BOX.x0) * 1.04) / f.fw, h = ((BOX.y1 - BOX.y0) * 1.04) / f.fh;
  return Math.max(w / (2 * th * aspect), h / (2 * th));
}

/** Where the scene root sits so the box centre lands on the fit centre. */
export function viewShift(aspect: number): [number, number] {
  const th = Math.tan((FOV / 2) * (Math.PI / 180)), d = camDist(aspect), f = fit(aspect);
  const vw = 2 * d * th * aspect, vh = 2 * d * th;
  return [(f.cx - 0.5) * vw - (BOX.x0 + BOX.x1) / 2, (0.5 - f.cy) * vh - (BOX.y0 + BOX.y1) / 2];
}

/** Perspective projection for a camera at (0,0,dist) looking down -z, returns percent of the box. */
export function projectStill(p: V3, aspect: number): [number, number] {
  const th = Math.tan((FOV / 2) * (Math.PI / 180));
  const [sx, sy] = viewShift(aspect);
  const zc = camDist(aspect) - p[2];
  const x = (p[0] + sx) / (zc * th * aspect), y = (p[1] + sy) / (zc * th);
  return [50 + x * 50, 50 - y * 50];
}

