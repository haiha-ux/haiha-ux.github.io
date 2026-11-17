import type { DemoMount } from './registry';

const mount: DemoMount = (host, spec) => {
  if (!spec.src || !spec.src.startsWith('https://haiha-ux.github.io/')) return;
  const frame = document.createElement('iframe');
  frame.src = spec.src;
  frame.title = spec.title ?? 'Project demo';
  frame.loading = 'lazy';
  frame.allow = 'camera; fullscreen';
  frame.referrerPolicy = 'no-referrer';
  host.replaceChildren(frame);
};

export default mount;
