import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://haiha-ux.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: { locales: ['en', 'vi'], defaultLocale: 'en' },
  // the dev toolbar draws red dashed audit outlines over the page, and an un-prebundled three.js makes Vite reload mid-load
  devToolbar: { enabled: false },
  vite: { optimizeDeps: { include: ['three', 'three/examples/jsm/loaders/GLTFLoader.js', 'three/examples/jsm/postprocessing/EffectComposer.js', 'three/examples/jsm/postprocessing/RenderPass.js', 'three/examples/jsm/postprocessing/UnrealBloomPass.js', 'three/examples/jsm/postprocessing/OutputPass.js', 'three/examples/jsm/controls/OrbitControls.js', 'three/examples/jsm/libs/meshopt_decoder.module.js', 'three/examples/jsm/environments/RoomEnvironment.js'] } },
});
