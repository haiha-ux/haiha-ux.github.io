import type { Mount } from './registry';

export const mount: Mount = (host, props) => {
  const src = props.src;
  if (typeof src !== 'string' || !src.startsWith('https://haiha-ux.github.io/')) return;
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = typeof props.title === 'string' ? props.title : 'Project demo';
  frame.loading = 'lazy';
  frame.allow = 'camera; fullscreen';
  frame.referrerPolicy = 'no-referrer';
  host.replaceChildren(frame);
};
