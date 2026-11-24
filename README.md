# Xsenze Tools

Free creative tools that run entirely in the browser. No logins, no uploads, no tracking.
Every file is processed on the user's device.

## Stack

| Layer              | Choice                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Framework          | [Ember.js](https://emberjs.com) 7.1, Octane, strict-mode `.gts` components                                          |
| Build              | [Vite](https://vite.dev) 8 + [Embroider](https://github.com/embroider-build/embroider)                              |
| Language           | TypeScript 6 + [Glint](https://typed-ember.gitbook.io/glint) (type-checked templates)                               |
| Styles             | The Xsenze UI Kit (bundled in `vendor/xsenze-ui/`), SCSS via `sass-embedded`, plain co-located `.css` per component |
| Icons              | [lucide-static](https://lucide.dev)                                                                                 |
| Audio/video engine | [mediabunny](https://mediabunny.dev) (WebCodecs decode/encode, in-browser)                                          |
| Local storage      | [Dexie](https://dexie.org) (IndexedDB), `browser-fs-access` for open/save                                           |
| Lint/format        | ESLint, ember-template-lint, Stylelint, Prettier                                                                    |
| Tests              | QUnit + ember-qunit                                                                                                 |
| Hosting            | Static build (`dist/`) on Vercel (`vercel.json`); Cloudflare Workers assets also set up (`wrangler.jsonc`)          |

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
  components/xz/          the Xsenze UI Kit parts tools are built from
  components/tools/       tool UIs, one folder per category:
    audio/ video/ image/ ai-studio/   <id>.gts plus a <id>/ folder for its parts
    shared/               parts several tools use (media player, trim, strips, text tool)
  lib/                    site-wide helpers at the top (tools, icons, download, format)
    audio/ video/ image/ subtitles/   helpers per kind of media (video/edit: Video Edit)
    ai/                   Whisper, translation, Audio Dub's voices (ai/dub)
    ai-studio/story/      Story Studio
    xz/                   helpers of the kit parts
  routes/tools/tool.ts    /tools/:tool_id
  templates/              route templates (.gts)
  styles/app.scss         site-wide styles on the Xsenze UI Kit tokens
```

## Adding a tool

1. Add an entry to the right category in `app/lib/tools.ts` (id, name, description, icon).
2. Create `app/components/tools/<category>/<id>.gts` (parts in a `<id>/` folder next to it). It
   receives `@tool`.
3. Register it in `app/lib/tool-components.ts`:
   `'<id>': () => import('xsenze-tools/components/tools/<category>/<id>')`
4. Run `npm run gen-icons` for any new icon name.
5. Add it to `ROADMAP.md`.

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
