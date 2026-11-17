// kind "undistort": remap a held-out chessboard view with the camera matrix and distortion fitted by the repo.
// props: src (calib.json URL; images sit in the same folder)
import { ensureStyle, getJSON, h, needStr } from "./_ui";

type Calib = { image_size: [number, number]; K: number[][]; D: number[]; heldout_rms_px: number; train_rms_px: number; images: string[]; credit: string };

/** OpenCV 5-parameter model (k1 k2 p1 p2 k3); `t` scales every coefficient (t = 1 is cv2.undistort with newK = K). */
export function undistortInto(src: ImageData, dst: ImageData, K: number[][], D: number[], t: number) {
  const [fx, fy, cx, cy] = [K[0][0], K[1][1], K[0][2], K[1][2]];
  const [k1, k2, p1, p2, k3] = D.map((d) => d * t);
  const { width: w, height: hgt, data: s } = src, o = dst.data;
  for (let v = 0; v < hgt; v++) {
    const y = (v - cy) / fy;
    for (let u = 0; u < w; u++) {
      const x = (u - cx) / fx, r2 = x * x + y * y, rad = 1 + r2 * (k1 + r2 * (k2 + r2 * k3));
      const xd = x * rad + 2 * p1 * x * y + p2 * (r2 + 2 * x * x), yd = y * rad + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y;
      const su = xd * fx + cx, sv = yd * fy + cy, i = (v * w + u) * 4;
      const u0 = Math.floor(su), v0 = Math.floor(sv);
      if (u0 < 0 || v0 < 0 || u0 >= w - 1 || v0 >= hgt - 1) { o[i] = o[i + 1] = o[i + 2] = 0; o[i + 3] = 255; continue; }
      const a = su - u0, b = sv - v0, p = (v0 * w + u0) * 4, q = p + w * 4;
      for (let c = 0; c < 3; c++) o[i + c] = (s[p + c] * (1 - a) + s[p + 4 + c] * a) * (1 - b) + (s[q + c] * (1 - a) + s[q + 4 + c] * a) * b;
      o[i + 3] = 255;
    }
  }
}

export async function mount(el: HTMLElement, props: Record<string, unknown>): Promise<() => void> {
  ensureStyle();
  const url = needStr(props, "src");
  const cal = await getJSON<Calib>(url);
  const dir = url.slice(0, url.lastIndexOf("/") + 1);
  const [W, H] = cal.image_size;

  const mk = (label: string) => {
    const c = h("canvas", { width: W, height: H, role: "img", "aria-label": label, style: "width:100%;height:auto;display:block;border-radius:6px;background:var(--bg,#14120F)" });
    return c;
  };
  const before = mk("Original chessboard view with lens distortion");
  const after = mk("Same view after undistortion");
  const slider = h("input", { type: "range", min: 0, max: 100, step: 1, value: 100, "aria-label": "Undistortion strength", oninput: () => render() });
  const out = h("output", { style: "min-width:5ch;font-variant-numeric:tabular-nums" }, "100%");
  const picker = h("div", { class: "dm-row", role: "group", "aria-label": "Held-out view" });
  const img = new Image();
  let data: ImageData | null = null;
  const dst = new ImageData(W, H);

  const render = () => {
    const t = Number(slider.value) / 100;
    out.textContent = `${Math.round(t * 100)}%`;
    if (!data) return;
    undistortInto(data, dst, cal.K, cal.D, t);
    after.getContext("2d")!.putImageData(dst, 0, 0);
  };
  const load = (name: string) => new Promise<void>((res, rej) => {
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0, W, H);
      data = g.getImageData(0, 0, W, H);
      before.getContext("2d")!.putImageData(data, 0, 0);
      render();
      res();
    };
    img.onerror = () => rej(new Error(`cannot load ${name}`));
    img.src = dir + name;
  });
  let sel = cal.images[0];
  const buttons = () => picker.replaceChildren(...cal.images.map((n) => h("button", { type: "button", "aria-pressed": String(n === sel), onclick: () => { sel = n; buttons(); void load(n); } }, n.replace(/^left(\d+)\.jpg$/, "view $1"))));
  buttons();

  const K = cal.K, D = cal.D;
  const root = h("div", { class: "dm" },
    h("h3", {}, "Undistort a chessboard view with the calibrated lens"),
    h("p", { class: "dm-sub" }, `Left camera of an OpenCV sample stereo set, calibrated on 9 of 13 views. These four were never used for the fit; held-out reprojection error ${cal.heldout_rms_px.toFixed(2)} px.`),
    picker,
    h("div", { class: "dm-row" }, h("label", {}, "Undistortion strength ", slider, out)),
    h("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px" },
      h("figure", { style: "margin:0" }, before, h("figcaption", { class: "dm-note" }, "Original")),
      h("figure", { style: "margin:0" }, after, h("figcaption", { class: "dm-note" }, "Corrected (lines should look straight at 100%)"))),
    h("p", { class: "dm-note" }, `fx ${K[0][0].toFixed(1)}, fy ${K[1][1].toFixed(1)}, cx ${K[0][2].toFixed(1)}, cy ${K[1][2].toFixed(1)}. k1 ${D[0].toFixed(3)}, k2 ${D[1].toFixed(3)}, p1 ${D[2].toFixed(4)}, p2 ${D[3].toFixed(4)}, k3 ${D[4].toFixed(3)}. ${cal.credit}.`),
  );
  el.append(root);
  await load(sel);
  return () => { img.onload = img.onerror = null; root.remove(); };
}
