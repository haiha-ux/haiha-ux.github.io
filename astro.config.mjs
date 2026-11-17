import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://haiha-ux.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: { locales: ['en', 'vi'], defaultLocale: 'en' },
});
