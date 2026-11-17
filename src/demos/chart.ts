// kind "chart": hand-drawn SVG charts from small JSON files made by tools/make_data.py.
// props: variant "ppo" | "continual", src (JSON URL), env? (ppo start env)
import { ensureStyle, getJSON, h, needStr, onWidth, s, themeColor } from "./_ui";

const f1 = (x: number) => x.toFixed(1);
function niceMax(v: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / p / 2) * 2 * p; // round up to a multiple of 2 * 10^k
}
function sd(a: number[]): number {
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1));
}

/* ---------------------------------- PPO ---------------------------------- */
type PpoVar = { label: string; seeds: number[][]; final_eval: number[] };
type PpoData = { bin_steps: number; envs: Record<string, Record<string, PpoVar>> };

async function ppo(el: HTMLElement, props: Record<string, unknown>) {
  const data = await getJSON<PpoData>(needStr(props, "src"));
  const envs = Object.keys(data.envs);
  let env = typeof props.env === "string" && data.envs[props.env] ? props.env : envs[0];
  const on = new Set<string>(["ours", "sb3"]);
  const colors: Record<string, [string, string]> = { // [css var, dash]
    ours: ["--accent", ""], sb3: ["--accent-2", ""], noobsnorm: ["--ink", "5 4"], nogae: ["--muted", "2 3"],
  };
  const svg = s("svg", { role: "img", tabindex: 0 }) as SVGSVGElement;
  let VW = 640;
  const envRow = h("div", { class: "dm-row", role: "group", "aria-label": "Environment" });
  const serRow = h("div", { class: "dm-row", role: "group", "aria-label": "Series" });
  const tip = h("p", { class: "dm-tip", "aria-live": "polite" }, "Hover or focus the chart and use left/right arrow keys to read values.");
  const table = h("div", {});
  const root = h("div", { class: "dm" },
    h("h3", {}, "PPO training reward, 3 seeds per line"),
    h("p", { class: "dm-sub" }, "Mean of training-episode returns in 20k-step bins; the band is the min and max over seeds. Source: the repo's training logs."),
    envRow, serRow, svg, tip, table);
  el.append(root);
  let cursor = -1;
  let geo = { L: 48, W: 640, R: 12, nb: 1 };

  const draw = () => {
    const ink = themeColor(el, "--ink"), muted = themeColor(el, "--muted");
    const vars = data.envs[env];
    const keys = Object.keys(vars).filter((k) => on.has(k));
    const nb = vars.ours.seeds[0].length;
    const W = VW, Ht = Math.round(Math.max(220, W * 0.47)), L = 48, R = 12, T = 12, B = 34;
    svg.setAttribute("viewBox", `0 0 ${W} ${Ht}`);
    const stats = keys.map((k) => {
      const sd3 = vars[k].seeds;
      return { k, mean: sd3[0].map((_, i) => sd3.reduce((a, c) => a + c[i], 0) / sd3.length), lo: sd3[0].map((_, i) => Math.min(...sd3.map((c) => c[i]))), hi: sd3[0].map((_, i) => Math.max(...sd3.map((c) => c[i]))) };
    });
    const ymax = niceMax(Math.max(1, ...stats.flatMap((x) => x.hi)));
    const x = (i: number) => L + (i / (nb - 1)) * (W - L - R);
    const y = (v: number) => T + (1 - v / ymax) * (Ht - T - B);
    svg.replaceChildren();
    for (let t = 0; t <= 4; t++) {
      const v = (ymax * t) / 4;
      svg.append(s("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: muted, "stroke-opacity": 0.25 }), s("text", { x: L - 6, y: y(v) + 4, "text-anchor": "end" }, String(Math.round(v))));
    }
    for (let t = 0; t <= 4; t++) {
      const i = Math.round(((nb - 1) * t) / 4);
      svg.append(s("text", { x: x(i), y: Ht - 14, "text-anchor": "middle" }, `${(((i + 1) * data.bin_steps) / 1e6).toFixed(2)}M`));
    }
    svg.append(s("text", { x: (L + W - R) / 2, y: Ht - 1, "text-anchor": "middle" }, "environment steps"));
    for (const st of stats) {
      const [cv, dash] = colors[st.k];
      const col = themeColor(el, cv);
      const band = `M${st.lo.map((v, i) => `${x(i)},${y(v)}`).join("L")}L${st.hi.map((v, i) => `${x(i)},${y(v)}`).reverse().join("L")}Z`;
      svg.append(s("path", { d: band, fill: col, "fill-opacity": 0.14 }),
        s("path", { d: `M${st.mean.map((v, i) => `${x(i)},${y(v)}`).join("L")}`, fill: "none", stroke: col, "stroke-width": 2, "stroke-dasharray": dash }));
    }
    if (cursor >= 0) {
      svg.append(s("line", { x1: x(cursor), x2: x(cursor), y1: T, y2: Ht - B, stroke: ink, "stroke-opacity": 0.6 }));
      tip.textContent = `up to ${(((cursor + 1) * data.bin_steps) / 1e6).toFixed(2)}M steps: ` + stats.map((st) => `${vars[st.k].label} ${Math.round(st.mean[cursor])} (${Math.round(st.lo[cursor])} to ${Math.round(st.hi[cursor])})`).join("; ");
    }
    svg.setAttribute("aria-label", `${env} training reward curves for ${keys.map((k) => vars[k].label).join(", ")}.`);

    // final deterministic eval: mean and sample std over seeds
    const rows = Object.keys(vars).map((k) => h("tr", {}, h("td", {}, vars[k].label), h("td", {}, `${Math.round(vars[k].final_eval.reduce((a, b) => a + b, 0) / 3)} ± ${Math.round(sd(vars[k].final_eval))}`), h("td", {}, vars[k].final_eval.map(Math.round).join(", "))));
    table.replaceChildren(h("table", { style: "width:100%;border-collapse:collapse;font-size:13px;margin-top:6px" },
      h("caption", { style: "text-align:left;color:var(--muted,#A39A8A);padding-bottom:4px" }, "Final evaluation, 10 deterministic episodes per seed: mean ± std over 3 seeds, and the per-seed means"),
      h("thead", {}, h("tr", {}, h("th", { scope: "col", style: "text-align:left" }, "Run"), h("th", { scope: "col", style: "text-align:left" }, "Return"), h("th", { scope: "col", style: "text-align:left" }, "Seeds"))),
      h("tbody", {}, ...rows)));
    geo = { L, W, R, nb };
  };

  const pick = (clientX: number) => {
    const g = geo;
    const r = svg.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * g.W;
    cursor = Math.max(0, Math.min(g.nb - 1, Math.round(((px - g.L) / (g.W - g.L - g.R)) * (g.nb - 1))));
    draw();
  };
  svg.addEventListener("pointermove", (e) => pick(e.clientX));
  svg.addEventListener("keydown", (e) => {
    const nb = data.envs[env].ours.seeds[0].length;
    if (e.key === "ArrowRight") cursor = Math.min(nb - 1, cursor + 1);
    else if (e.key === "ArrowLeft") cursor = Math.max(0, (cursor < 0 ? nb : cursor) - 1);
    else return;
    e.preventDefault();
    draw();
  });

  const buildButtons = () => {
    envRow.replaceChildren(...envs.map((e) => h("button", { type: "button", "aria-pressed": String(e === env), onclick: () => { env = e; for (const k of [...on]) if (!data.envs[env][k]) on.delete(k); cursor = -1; buildButtons(); draw(); } }, e)));
    serRow.replaceChildren(...Object.keys(data.envs[env]).map((k) => {
      const [cv, dash] = colors[k];
      return h("button", { type: "button", "aria-pressed": String(on.has(k)), onclick: () => { on.has(k) ? on.delete(k) : on.add(k); if (!on.size) on.add(k); buildButtons(); draw(); } },
        h("span", { class: "dm-sw", style: `border-top:3px ${dash ? "dashed" : "solid"} var(${cv})` }), data.envs[env][k].label);
    }));
  };
  buildButtons();
  const stop = onWidth(svg, (w) => { VW = Math.max(280, Math.min(640, w)); draw(); });
  return () => { stop(); root.remove(); };
}

/* ------------------------------- continual ------------------------------- */
type Acc = { acc: number; lo: number; hi: number; n: number; k: number };
type Stage = { label: string; book1: Acc; book2: Acc; kept: { k: number; n: number } };
type CData = { note: string; stages: Record<string, Stage> };

async function continual(el: HTMLElement, props: Record<string, unknown>) {
  const data = await getJSON<CData>(needStr(props, "src"));
  const S = data.stages;
  const methods = ["naive_b2", "kl_b2", "expert_b2", "e2_router_A_rw", "e2_oracle"].filter((m) => S[m]);
  const col: Record<string, string> = { naive_b2: "--accent", kl_b2: "--accent-2", expert_b2: "--ink", e2_router_A_rw: "--muted", e2_oracle: "--muted" };
  const dash: Record<string, string> = { naive_b2: "", kl_b2: "", expert_b2: "5 4", e2_router_A_rw: "2 3", e2_oracle: "8 3 2 3" };
  const shape: Record<string, string> = { naive_b2: "circle", kl_b2: "square", expert_b2: "diamond", e2_router_A_rw: "triangle", e2_oracle: "ring" };
  const on = new Set(["naive_b2", "kl_b2"]);
  const steps = ["Base model", "After book 1", "After book 2"];
  const svgs = [s("svg", { viewBox: "0 0 320 250", role: "img" }), s("svg", { viewBox: "0 0 320 250", role: "img" })] as SVGSVGElement[];
  const grid = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px" }, ...svgs);
  const btnRow = h("div", { class: "dm-row", role: "group", "aria-label": "Methods" });
  const tip = h("p", { class: "dm-tip", "aria-live": "polite" }, "Pick methods above. Points are focusable; the readout shows accuracy, 95% CI and counts.");
  const keptOut = h("p", { class: "dm-verdict", "aria-live": "polite" });
  const root = h("div", { class: "dm" },
    h("h3", {}, "What the model forgets when it learns book 2"),
    h("p", { class: "dm-sub" }, "Short-answer accuracy on 150 held-out questions per book (numbers only, no book text). Error bars are 95% bootstrap CIs."),
    btnRow, grid, tip, keptOut, h("p", { class: "dm-note" }, data.note));
  el.append(root);

  const panel = (svg: SVGSVGElement, book: "book1" | "book2", title: string) => {
    const ink = themeColor(el, "--ink"), muted = themeColor(el, "--muted");
    const W = 320, Ht = 250, L = 38, R = 14, T = 26, B = 40;
    const x = (i: number) => L + 22 + (i / 2) * (W - L - R - 44);
    const y = (v: number) => T + (1 - v) * (Ht - T - B);
    svg.replaceChildren(s("text", { x: L, y: 14, fill: ink, style: "font-weight:600" }, title));
    for (let t = 0; t <= 4; t++) {
      svg.append(s("line", { x1: L, x2: W - R, y1: y(t / 4), y2: y(t / 4), stroke: muted, "stroke-opacity": 0.25 }), s("text", { x: L - 5, y: y(t / 4) + 4, "text-anchor": "end" }, `${t * 25}%`));
    }
    steps.forEach((t, i) => svg.append(s("text", { x: x(i), y: Ht - 22, "text-anchor": "middle" }, t.split(" ").slice(0, 2).join(" ")), s("text", { x: x(i), y: Ht - 10, "text-anchor": "middle" }, t.split(" ").slice(2).join(" "))));
    const mark = (shape: string, cx: number, cy: number, c: string): SVGElement => {
      if (shape === "square") return s("rect", { x: cx - 5, y: cy - 5, width: 10, height: 10, fill: c });
      if (shape === "diamond") return s("path", { d: `M${cx},${cy - 7}L${cx + 6},${cy}L${cx},${cy + 7}L${cx - 6},${cy}Z`, fill: c });
      if (shape === "triangle") return s("path", { d: `M${cx},${cy - 6}L${cx + 6},${cy + 5}L${cx - 6},${cy + 5}Z`, fill: c });
      if (shape === "ring") return s("circle", { cx, cy, r: 5, fill: "none", stroke: c, "stroke-width": 2 });
      return s("circle", { cx, cy, r: 5, fill: c });
    };
    const point = (a: Acc, i: number, c: string, label: string, shape = "ring") => {
      const g = s("g", { tabindex: 0, role: "img", "aria-label": `${label}, ${title}: ${f1(a.acc * 100)} percent, 95% CI ${f1(a.lo * 100)} to ${f1(a.hi * 100)}, ${a.k} of ${a.n}` });
      const show = () => { tip.textContent = `${label} | ${title}: ${f1(a.acc * 100)}% [${f1(a.lo * 100)}, ${f1(a.hi * 100)}] (${a.k}/${a.n})`; };
      g.addEventListener("pointerenter", show); g.addEventListener("focus", show);
      g.append(s("line", { x1: x(i), x2: x(i), y1: y(a.lo), y2: y(a.hi), stroke: c, "stroke-width": 1.5 }),
        mark(shape, x(i), y(a.acc), c));
      return g;
    };
    const m0 = S.m0[book], m1 = S.m1[book];
    for (const m of methods.filter((k) => on.has(k))) {
      const c = themeColor(el, col[m]);
      svg.append(s("path", { d: `M${x(0)},${y(m0.acc)}L${x(1)},${y(m1.acc)}L${x(2)},${y(S[m][book].acc)}`, fill: "none", stroke: c, "stroke-width": 2, "stroke-dasharray": dash[m] }));
    }
    svg.append(point(m0, 0, ink, S.m0.label), point(m1, 1, ink, S.m1.label));
    for (const m of methods.filter((k) => on.has(k))) svg.append(point(S[m][book], 2, themeColor(el, col[m]), S[m].label, shape[m]));
    svg.setAttribute("aria-label", `${title} over three steps for ${methods.filter((k) => on.has(k)).map((k) => S[k].label).join(", ")}`);
  };

  const draw = () => {
    panel(svgs[0], "book1", "Book 1 accuracy (forgetting)");
    panel(svgs[1], "book2", "Book 2 accuracy (learning)");
    btnRow.replaceChildren(...methods.map((m) => h("button", { type: "button", "aria-pressed": String(on.has(m)), onclick: () => { on.has(m) ? on.delete(m) : on.add(m); draw(); } },
      h("span", { class: "dm-sw", style: `border-top:3px ${dash[m] ? "dashed" : "solid"} var(${col[m]})` }), S[m].label)));
    const chosen = methods.filter((m) => on.has(m));
    keptOut.textContent = chosen.length
      ? "Book-1 answers still correct (of the " + S.m1.kept.n + " that M1 got right): " + chosen.map((m) => `${S[m].label} ${S[m].kept.k}/${S[m].kept.n}`).join("; ") + "."
      : "No method selected.";
  };
  draw();
  return () => root.remove();
}

export async function mount(el: HTMLElement, props: Record<string, unknown>): Promise<() => void> {
  ensureStyle();
  const v = props.variant;
  if (v === "ppo") return ppo(el, props);
  if (v === "continual") return continual(el, props);
  throw new Error(`chart: unknown variant "${String(v)}"`);
}
