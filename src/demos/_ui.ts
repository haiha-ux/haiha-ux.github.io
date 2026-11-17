// Shared helpers for demo modules: DOM builder, one stylesheet, theme colours read from CSS variables.
const CSS = `
.dm{font:14px/1.5 var(--font-body,system-ui,sans-serif);color:var(--ink,#EFE7D6);background:var(--surface,#1F1B16);border:1px solid color-mix(in srgb,var(--muted,#A39A8A) 35%,transparent);border-radius:10px;padding:12px;max-width:100%;box-sizing:border-box}
.dm *{box-sizing:border-box}
.dm h3{margin:0 0 4px;font-size:15px;font-weight:600}
.dm .dm-sub{margin:0 0 10px;color:var(--muted,#A39A8A);font-size:13px}
.dm .dm-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
.dm button,.dm select{font:inherit;color:var(--ink,#EFE7D6);background:var(--bg,#14120F);border:1px solid color-mix(in srgb,var(--accent-2,#9DB2BC) 55%,transparent);border-radius:6px;padding:5px 10px;min-height:34px;cursor:pointer}
.dm button[aria-pressed=true]{border-color:var(--accent,#D9AE55);color:var(--accent,#D9AE55)}
.dm button:hover,.dm select:hover{border-color:var(--accent,#D9AE55)}
.dm :focus-visible{outline:2px solid var(--accent,#D9AE55);outline-offset:2px}
.dm input[type=range]{accent-color:var(--accent,#D9AE55);flex:1 1 160px;min-width:120px}
.dm label{display:inline-flex;gap:6px;align-items:center;max-width:100%}
.dm select{max-width:100%;min-width:0}
.dm .dm-note{margin:8px 0 0;color:var(--muted,#A39A8A);font-size:12.5px}
.dm .dm-verdict{margin:10px 0 0;padding:8px 10px;border-left:3px solid var(--accent,#D9AE55);background:var(--bg,#14120F)}
.dm svg{display:block;width:100%;height:auto;max-width:100%}
.dm svg text{fill:var(--muted,#A39A8A);font:11px system-ui,sans-serif}
.dm .dm-tip{min-height:1.5em;font-size:12.5px;color:var(--ink,#EFE7D6)}
.dm .dm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.dm .dm-sw{display:inline-block;width:14px;height:0;vertical-align:middle;margin-right:4px}
`;

export function ensureStyle() {
  if (document.getElementById("dm-style")) return;
  const s = document.createElement("style");
  s.id = "dm-style";
  s.textContent = CSS;
  document.head.appendChild(s);
}

type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined>;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === "function") e.addEventListener(k.replace(/^on/, ""), v);
    else e.setAttribute(k, v === true ? "" : String(v));
  }
  e.append(...kids);
  return e;
}

const SVGNS = "http://www.w3.org/2000/svg";
export function s(tag: string, attrs: Record<string, string | number> = {}, ...kids: (Node | string)[]): SVGElement {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
}

const FALLBACK: Record<string, string> = {
  "--bg": "#14120F", "--surface": "#1F1B16", "--ink": "#EFE7D6",
  "--accent": "#D9AE55", "--accent-2": "#9DB2BC", "--muted": "#A39A8A",
};
export function themeColor(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || FALLBACK[name];
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fetch JSON relative to the page; throws a readable error. */
export async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

export function needStr(props: Record<string, unknown>, key: string): string {
  const v = props[key];
  if (typeof v !== "string" || !v) throw new Error(`demo prop "${key}" (string) is required`);
  return v;
}

/** Call `fn` now and whenever the element's width changes; returns a stop function. */
export function onWidth(el: Element, fn: (w: number) => void): () => void {
  let last = -1;
  const run = () => { const w = Math.round(el.getBoundingClientRect().width); if (w && w !== last) { last = w; fn(w); } };
  const ro = new ResizeObserver(run);
  ro.observe(el);
  run();
  return () => ro.disconnect();
}
