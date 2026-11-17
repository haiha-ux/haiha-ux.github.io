// kind -> lazy loader. Each demo is one module with `mount(el, props)` that returns a cleanup; heavy libraries (three.js)
// stay inside their module, so they load only when a page mounts that kind. `iframe` wraps an existing Pages demo.
export type DemoKind = 'iframe' | 'pcb3d' | 'kicanvas' | 'chart' | 'wilson' | 'undistort';
export type Mount = (el: HTMLElement, props: Record<string, unknown>) => Promise<() => void> | void;

export const registry: Record<string, () => Promise<{ mount: Mount }>> = {
  iframe: () => import('./iframe'),
  pcb3d: () => import('./pcb3d'),
  wilson: () => import('./wilson'),
  chart: () => import('./chart'),
  undistort: () => import('./undistort'),
};
