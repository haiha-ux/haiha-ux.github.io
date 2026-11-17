// kind -> dynamic import. One file per demo kind; a demo is only fetched when the visitor presses "Run it".
// Phase A ships `iframe`. Later kinds (pcb3d, kicanvas, chart, wilson) add one line here and one file next to it.
export type DemoKind = 'iframe' | 'pcb3d' | 'kicanvas' | 'chart' | 'wilson';
export type DemoSpec = { kind: DemoKind; src?: string; title?: string };
export type DemoMount = (host: HTMLElement, spec: DemoSpec) => void | (() => void);

export const demos: Record<string, () => Promise<{ default: DemoMount }>> = {
  iframe: () => import('./iframe'),
};
