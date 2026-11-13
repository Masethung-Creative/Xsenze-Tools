# Xsenze Tools: notes for Claude

Browser-only creative tools site (Ember 7 + Vite + Embroider, TS + Glint, SCSS + crayon-css,
lucide-static). See README.md for the stack and the "Adding a tool" steps.

Rules:

- Everything runs client-side. Never add a server call, upload, analytics or login.
- `app/lib/tools.ts` is the single source of truth for categories and tools.
- Tool UIs are lazy-loaded via `app/lib/tool-components.ts`; import heavy libs (mediabunny, etc.)
  inside the tool component so they stay out of the main bundle.
- Components are strict-mode `.gts`. Styles: theme tokens/shared blocks in `app/styles/app.scss`,
  component styles as co-located plain `.css` using the CSS variables (do not `@use` crayon in
  component files; it re-emits the whole utility sheet).
- Audio inputs: use `AUDIO_ACCEPT` from `lib/tools.ts` (iOS needs explicit extensions).
- Before finishing: `npm run lint` and `npm run build` must pass.
- Do not mention third-party reference sites in repo files, comments or commit messages.

Design:

- Dense full-bleed sidebar (Ctrl K search, active row filled with accent), top bar with page
  title + square icon buttons, home omnibox over a faint icon backdrop, category strip + square
  bordered cell grid. Square corners, 1px borders.
- Colours + font come from the Masethung R portfolio (masethung-r-portfolio.vercel.app):
  Space Grotesk (bundled via @fontsource-variable, no Google request); orange #ff3800 on warm
  stone neutrals. Dark is the default theme; light theme uses the same family. Tokens live in
  `app/styles/app.scss`. Use `--accent-text` (not `--accent`) for orange text on light.
- Tool UIs use the canon UI kit (`delphicanon` package). Its `--canon-*` tokens are mapped to
  our palette in `app/styles/_canon.scss`.

Tools (Audio & Video category, built one at a time, user reviews each):

- `lib/flow-hooks.ts` is a reduced stand-in (no workflows); `deliverPending` feeds the omnibox
  hand-off from `lib/handoff.ts`.
- After adding icons by name run `npm run gen-icons`; after changing the logo `npm run gen-brand`.
- Done: audio-trimmer, audio-normaliser, voice-recorder, waveform-genny, audio-atlas,
  audio-extractor, video-muter, video-trimmer, video-atlas, video-to-gif, frame-extractor, screen-recorder. Remaining:
  subtitle-converter, subtitle-studio, auto-subtitle, timecode-calc.
