// kind "wilson": 95% Wilson intervals for two success rates, with a slider for the number of episodes.
// props: src (runs.json written by tools/make_data.py), a?, b? (run ids to start with)
import { ensureStyle, getJSON, h, needStr, onWidth, s, themeColor } from "./_ui";

type Run = { id: string; label: string; successes: number; episodes: number; ci95_repo: [number, number] };
type Data = { suite: string; runs: Run[] };

const Z = 1.959964;
/** 95% Wilson score interval for k successes in n trials, as fractions. */
export function wilson(k: number, n: number): [number, number] {
  const p = k / n, z2 = Z * Z, d = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / d;
  const r = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / d;
  return [Math.max(0, c - r), Math.min(1, c + r)];
}

// two-sided p of a pooled two-proportion z-test (Abramowitz-Stegun erf)
function pTwoProp(p1: number, p2: number, n: number): number {
  const pp = (p1 + p2) / 2, se = Math.sqrt(pp * (1 - pp) * (2 / n));
  if (se === 0) return 1;
  const x = Math.abs(p1 - p2) / se / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 1 - erf;
}

const pct = (x: number) => (x * 100).toFixed(1);
const nFromSlider = (v: number) => Math.round(Math.pow(10, 1.3 + (v / 100) * 2)); // 20 .. 2000

export async function mount(el: HTMLElement, props: Record<string, unknown>): Promise<() => void> {
  ensureStyle();
  const data = await getJSON<Data>(needStr(props, "src"));
  const runs = data.runs;
  const find = (id: unknown, dflt: number) => runs.find((r) => r.id === id) ?? runs[dflt];
  const baseN = runs[0].episodes;

  const opts = (sel: HTMLSelectElement, r: Run) => {
    runs.forEach((x) => sel.append(h("option", { value: x.id, selected: x.id === r.id }, x.label)));
  };
  const selA = h("select", { "aria-label": "Policy A", onchange: () => draw() });
  const selB = h("select", { "aria-label": "Policy B", onchange: () => draw() });
  opts(selA, find(props.a, 0));
  opts(selB, find(props.b, runs.length - 1));

  const slider = h("input", { type: "range", min: 0, max: 100, step: 1, value: ((Math.log10(baseN) - 1.3) / 2) * 100, "aria-label": "Assumed number of episodes per policy", oninput: () => draw() });
  const nLabel = h("output", { style: "min-width:6ch;font-variant-numeric:tabular-nums" });
  const real = h("button", { type: "button", onclick: () => { slider.value = String(((Math.log10(baseN) - 1.3) / 2) * 100); draw(); } }, `Real n = ${baseN}`);
  const svg = s("svg", { role: "img" }) as SVGSVGElement;
  let W = 640;
  const readout = h("p", { class: "dm-tip", "aria-live": "polite" });
  const verdict = h("p", { class: "dm-verdict", "aria-live": "polite" });

  const root = h("div", { class: "dm" },
    h("h3", {}, "Is one policy better? 95% Wilson intervals"),
    h("p", { class: "dm-sub" }, `${data.suite}. Success rates are the measured ones; drag the slider to see how many episodes it would take to separate them.`),
    h("div", { class: "dm-row" }, h("label", {}, "A ", selA), h("label", {}, "B ", selB)),
    h("div", { class: "dm-row" }, h("label", {}, "Episodes per policy ", slider, nLabel), real),
    svg, readout, verdict,
    h("p", { class: "dm-note" }, "Thin grey bars: the interval at the real n. Thick bars: the interval at the assumed n with the same success rate."),
  );
  el.append(root);

  const draw = () => {
    const A = runs.find((r) => r.id === selA.value)!, B = runs.find((r) => r.id === selB.value)!;
    const n = nFromSlider(Number(slider.value));
    nLabel.textContent = `n = ${n}`;
    const ink = themeColor(el, "--ink"), muted = themeColor(el, "--muted"), c1 = themeColor(el, "--accent"), c2 = themeColor(el, "--accent-2");
    const L = 30, R = 20, x = (f: number) => L + f * (W - L - R);
    svg.setAttribute("viewBox", `0 0 ${W} 190`);
    svg.replaceChildren();
    for (let t = 0; t <= 100; t += 25) {
      svg.append(s("line", { x1: x(t / 100), x2: x(t / 100), y1: 20, y2: 150, stroke: muted, "stroke-opacity": 0.25 }),
        s("text", { x: x(t / 100), y: 168, "text-anchor": "middle" }, `${t}%`));
    }
    const rows = [{ r: A, col: c1, y: 55 }, { r: B, col: c2, y: 115 }];
    const pa = A.successes / A.episodes, pb = B.successes / B.episodes;
    const ia = wilson(pa * n, n), ib = wilson(pb * n, n);
    const ivs = [ia, ib];
    const lo = Math.max(ia[0], ib[0]), hi = Math.min(ia[1], ib[1]);
    const overlap = hi - lo;
    if (overlap > 0) {
      svg.append(s("rect", { x: x(lo), y: 22, width: x(hi) - x(lo), height: 126, fill: ink, "fill-opacity": 0.1 }));
    }
    rows.forEach(({ r, col, y }, i) => {
      const [rl, rh] = wilson(r.successes, r.episodes);
      svg.append(
        s("line", { x1: x(rl), x2: x(rh), y1: y + 14, y2: y + 14, stroke: muted, "stroke-width": 2 }),
        s("line", { x1: x(rl), x2: x(rl), y1: y + 9, y2: y + 19, stroke: muted, "stroke-width": 2 }),
        s("line", { x1: x(rh), x2: x(rh), y1: y + 9, y2: y + 19, stroke: muted, "stroke-width": 2 }),
        s("rect", { x: x(ivs[i][0]), y: y - 8, width: Math.max(2, x(ivs[i][1]) - x(ivs[i][0])), height: 16, rx: 3, fill: col, "fill-opacity": 0.85 }),
        s("line", { x1: x(r.successes / r.episodes), x2: x(r.successes / r.episodes), y1: y - 14, y2: y + 14, stroke: ink, "stroke-width": 2 }),
        s("text", { x: x(r.successes / r.episodes), y: y - 18, "text-anchor": "middle", fill: ink }, `${i ? "B" : "A"}: ${r.successes}/${r.episodes}`),
      );
    });
    svg.setAttribute("aria-label", `Wilson 95% intervals at n=${n}: A ${pct(ia[0])} to ${pct(ia[1])} percent, B ${pct(ib[0])} to ${pct(ib[1])} percent.`);

    readout.textContent = `A: ${pct(pa)}% [${pct(ia[0])}, ${pct(ia[1])}]   B: ${pct(pb)}% [${pct(ib[0])}, ${pct(ib[1])}]   (n = ${n} each)`;
    const p = pTwoProp(pa, pb, n);
    const gap = Math.abs(pa - pb) * 100;
    if (A.id === B.id) {
      verdict.textContent = "Same policy on both sides: identical intervals, nothing to compare.";
    } else if (overlap > 0) {
      verdict.textContent = `The intervals overlap by ${(overlap * 100).toFixed(1)} points, so at n = ${n} the two policies are not distinguishable by this test. The ${gap.toFixed(0)}-point gap is inside the noise. (A pooled two-proportion z-test gives p = ${p.toFixed(3)}, so overlap is the conservative reading.)`;
    } else {
      verdict.textContent = `The intervals no longer overlap at n = ${n}: a ${gap.toFixed(0)}-point gap is now distinguishable (pooled z-test p ${p < 0.001 ? "< 0.001" : "= " + p.toFixed(3)}), if the success rates held.`;
    }
  };
  const stop = onWidth(svg, (w) => { W = Math.max(280, Math.min(640, w)); draw(); });
  return () => { stop(); root.remove(); };
}
