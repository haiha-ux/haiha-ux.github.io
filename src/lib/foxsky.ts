// Geometry of the nine-tailed fox constellation, shared by the build-time still (SVG) and the live three.js scene.
// Nine bodies from sky.json give nine tails: the order of their ecliptic longitudes sets which slot of the fan each
// tail takes, and the longitude itself sets that tail's length, curl and depth. Symbols for fun, not science.
import sky from '../data/sky.json';

export type V3 = [number, number, number];
export type Body = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
const NINE: Body[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

/** The three bright tails are the three trades; the other six hold the remaining projects and ornament. */
export const MAIN_TAILS: Record<string, Body> = { 'edge-ai': 'sun', 'robot-learning': 'jupiter', pcb: 'neptune' };
export const HEAD: V3 = [0, -1.65, 0];
export const FOV = 40;

export type Tail = { body: Body; slot: number; theta: number; len: number; curl: number; depth: number; main: boolean };

const lon = (b: Body) => (sky as Record<string, number>)[b];

export const TAILS: Tail[] = [...NINE]
  .sort((a, b) => lon(a) - lon(b))
  .map((body, slot) => {
    const rad = (lon(body) * Math.PI) / 180;
    return {
      body,
      slot,
      theta: ((-98 + slot * 24.5) * Math.PI) / 180,
      len: 2.3 + 0.8 * (0.5 + 0.5 * Math.sin(rad)),
      curl: Math.sin(rad * 2),
      depth: Math.cos(rad) * 0.9,
      main: Object.values(MAIN_TAILS).includes(body),
    };
  });

export const tailOf = (b: Body) => TAILS.find((t) => t.body === b)!;

/** Point on a tail, u in 0..1 from the head; sway is a sideways push that grows towards the tip. */
export function tailPoint(t: Tail, u: number, sway = 0): V3 {
  const dx = Math.sin(t.theta), dy = Math.cos(t.theta);
  const side = Math.sin(Math.PI * u) * t.curl * 0.3 * t.len + sway * u * u * 0.7;
  const lift = 0.35 * t.len * u * u * Math.abs(dx);
  return [HEAD[0] + dx * t.len * u + dy * side, HEAD[1] + dy * t.len * u - dx * side + lift, HEAD[2] + t.depth * u];
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
      const u = n === 1 ? 1 : 0.3 + (0.7 * i) / (n - 1);
      out.push({ ...p, u, off: n === 1 ? 0 : (i % 2 ? 1 : -1) * 0.1, zoff: ((i * 37) % 7) * 0.05 - 0.15 });
    });
  }
  return out;
}

export function orbPos(o: Orb, sway = 0): V3 {
  const t = tailOf(o.body);
  const p = tailPoint(t, o.u, sway);
  const nx = Math.cos(t.theta), ny = -Math.sin(t.theta);
  return [p[0] + nx * o.off, p[1] + ny * o.off, p[2] + o.zoff];
}

/** The constellation sits right of centre on a wide hero (the words take the left), centred on a narrow one. */
export function viewShift(aspect: number): [number, number] {
  const k = Math.min(1, Math.max(0, (aspect - 1.25) / 0.4));
  return [1.2 * k, -0.2];
}

export function camDist(aspect: number): number {
  const th = Math.tan((FOV / 2) * (Math.PI / 180));
  return Math.max(2.05 / th, (3.0 + viewShift(aspect)[0]) / (aspect * th)) + 0.2;
}

/** Perspective projection for a camera at (0,0,dist) looking down -z, returns percent of the box. */
export function projectStill(p: V3, aspect: number): [number, number] {
  const th = Math.tan((FOV / 2) * (Math.PI / 180));
  const [sx, sy] = viewShift(aspect);
  const zc = camDist(aspect) - p[2];
  const x = (p[0] + sx) / (zc * th * aspect), y = (p[1] + sy) / (zc * th);
  return [50 + x * 50, 50 - y * 50];
}

/** The dial the fox stands on: a tilted ring with 12 sign ticks. angle in radians, ring in the XZ plane tilted. */
export const DIAL = { cy: -1.45, rx: 3.5, rz: 1.35, tiltZ: -0.25 };
export function dialPoint(a: number, k = 1): V3 {
  return [Math.cos(a) * DIAL.rx * k, DIAL.cy, Math.sin(a) * DIAL.rz * k * 2.0 - 0.6];
}

/** Fox head glyph, a few line segments around HEAD, facing the viewer. */
export const FOX_LINES: [V3, V3][] = (() => {
  const [hx, hy] = HEAD;
  const P = (x: number, y: number): V3 => [hx + x, hy + y - 0.12, 0.05];
  const pts = [P(-0.42, 0.34), P(-0.3, 0.7), P(-0.1, 0.42), P(0.1, 0.42), P(0.3, 0.7), P(0.42, 0.34), P(0.0, -0.22)];
  const seg: [V3, V3][] = [];
  for (let i = 0; i < pts.length - 1; i++) seg.push([pts[i], pts[i + 1]]);
  seg.push([pts[6], pts[0]]);
  return seg;
})();
