# haiha-ux.github.io

Personal site of Hai Ha, a vision and AI engineer. It is a static Astro site: a hero scene of nine tails of foxfire (three.js, loaded on demand), a lab bench of projects, one page per project, an about page, a one-page CV at `/quick/` and a 404.

## Run it

Use Node 22.23 or newer.

```bash
npm install
npm run build
npm run preview      # http://127.0.0.1:4321/
```

`npm run dev` serves the same port with live reload.

## Add a project

Add one Markdown file in `src/content/projects/<slug>.md`, and put any files it needs in `public/projects/<slug>/`. No page code changes. The frontmatter is checked at build time (`src/content.config.ts`):

```yaml
title: "..."
summary: "..."
domain: edge-ai        # edge-ai | robot-learning | pcb | cad | other
repo: <github repo name>
metrics:
  - { label: "...", value: "..." }
demo: { kind: iframe, src: "https://haiha-ux.github.io/<repo>/" }   # optional
star: { planet: sun }  # the tail it sits on; sun, jupiter and neptune are the three bright ones
year: 2026
featured: false
order: 30
```

The body is the "What didn't work" section. Demo kinds load from `src/demos/registry.ts` with a dynamic `import()`, only when the visitor presses "Run it". A new kind is one line in the registry and one file in `src/demos/`.

## Sky data

`src/data/sky.json` holds ecliptic longitudes in degrees, computed offline. They set the order, length and curl of the nine tails (`src/lib/foxsky.ts`). Symbols for fun, not science.

## Design kit

`public/assets/` is the taste kit copied from the skill folder. The finish gate runs on the built page:

```bash
npm run build
node <skill>/scripts/gate.mjs dist/index.html --root dist
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml` (Astro action, then GitHub Pages) and the site goes live at https://haiha-ux.github.io/.

## Folders

- `src/pages/` has the routes: home, `about`, `quick` (the CV), `projects/` and the 404.
- `src/content/projects/` holds one Markdown file per project; `src/layouts/Base.astro` holds the head tags, nav and footer.
- `src/scene/` and `src/demos/` hold the three.js hero and the in-browser demos.
- `public/` is copied as is: fonts, the fox model, the design kit in `assets/`, and `public/projects/<slug>/` for each project's files.

## Sharing and search

Every page gets its own title, description, canonical URL and Open Graph and Twitter tags from `Base.astro`. A project page uses its `cover.webp` (or `fallback.webp`) as the preview image, and falls back to `public/share.jpg` (1200 x 630) when there is none. The home page carries `Person` JSON-LD. `@astrojs/sitemap` writes `sitemap-index.xml` at build, and `public/robots.txt` points to it.
