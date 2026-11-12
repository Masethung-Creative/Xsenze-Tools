# Xsenze Tools

Free creative tools that run entirely in the browser. No logins, no uploads, no tracking.
Every file is processed on the user's device.

## Stack

| Layer              | Choice                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Framework          | [Ember.js](https://emberjs.com) 7.1, Octane, strict-mode `.gts` components                                             |
| Build              | [Vite](https://vite.dev) 8 + [Embroider](https://github.com/embroider-build/embroider)                                 |
| Language           | TypeScript 6 + [Glint](https://typed-ember.gitbook.io/glint) (type-checked templates)                                  |
| Styles             | SCSS via `sass-embedded` + [crayon-css](https://crayoncss.com) utilities/tokens, plain co-located `.css` per component |
| Icons              | [lucide-static](https://lucide.dev)                                                                                    |
| Audio/video engine | [mediabunny](https://mediabunny.dev) (WebCodecs decode/encode, in-browser)                                             |
| Local storage      | [Dexie](https://dexie.org) (IndexedDB), `browser-fs-access` for open/save                                              |
| Lint/format        | ESLint, ember-template-lint, Stylelint, Prettier                                                                       |
| Tests              | QUnit + ember-qunit                                                                                                    |
| Hosting            | Static build (`dist/`) on Cloudflare Workers assets (`wrangler.jsonc`)                                                 |

## Getting started

Requires Node 20.19+.

```sh
npm install
npm start          # http://localhost:4200
```

In VS Code, accept the recommended extensions (Glint 2, ESLint, Prettier, Stylelint).
`Ctrl+Shift+B` starts the dev server; F5 starts it and opens a debug browser.

| Command            | What it does                  |
| ------------------ | ----------------------------- |
| `npm start`        | Dev server with hot reload    |
| `npm run build`    | Production build into `dist/` |
| `npm run lint`     | All linters + type check      |
| `npm run lint:fix` | Auto-fix + format             |
| `npm test`         | QUnit tests                   |

## Project layout

```
app/
  lib/tools.ts            tool registry: categories + tools (sidebar, home, routing read this)
  lib/tool-components.ts  lazy loader per tool id (each tool is its own code-split chunk)
  lib/icons.ts            lucide icons in use
  components/             shell (app-shell, app-sidebar), tool-frame, tool-grid, icon
  components/tools/       one .gts per tool UI
  routes/tools/tool.ts    /tools/:tool_id
  templates/              route templates (.gts)
  styles/app.scss         crayon + theme tokens (light/dark CSS variables)
```

## Adding a tool

1. Add an entry to the right category in `app/lib/tools.ts` (id, name, description, icon).
2. Create `app/components/tools/<id>.gts`. It receives `@tool`.
3. Register it in `app/lib/tool-components.ts`:
   `'<id>': () => import('xsenze-tools/components/tools/<id>')`
4. Add any new icon to `app/lib/icons.ts`.

The tool shows up in the sidebar, the home grid and search, at `/tools/<id>`.

## Logo and favicons

The source logo is `assets/brand/xsenze-tools-logo.png` (two-tone, transparent). Run
`npm run gen-brand` after changing it. It traces the PNG into two theme versions:

- `public/logo.svg` (dark theme): orange square and letters, dark X and outlines
- `public/logo-light.svg` (light theme): black square and letters, orange X and orange letter outline

The site swaps them with the theme (`components/brand-logo.gts`). It also writes the favicons
(`favicon.svg`, `favicon-32/192/512.png`, `apple-touch-icon.png`, from the dark version) and
`assets/brand/preview-light.png` for checking the light recolour.

## Windows note

`patches/@embroider+vite+*.patch` (applied by `postinstall`) makes Embroider create a directory
junction instead of a symlink, so builds work on Windows without Developer Mode.
