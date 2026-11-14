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
- Transformers.js: always set `env.backends.onnx.wasm.wasmPaths` to the bundled `ort-wasm` URL (the
  library defaults to a CDN). Run long model work in a Web Worker (see `lib/nllb.worker.ts`).
- Raw ONNX code (no Transformers.js) loads the runtime via `loadOrt()` in `lib/dub/ort.ts`: a
  stable `onnxruntime-web` plus its asyncify WASM. Transformers.js keeps its own nested pre-release
  runtime, whose WebGPU kernels turned Chatterbox into noise. Create WebGPU sessions one at a time.
- Check new voice output by transcribing it with Whisper, not by its loudness: noise has loudness too.
- When a model is wrong on WebGPU, find the wrong graph before switching files: run each graph on
  WASM in turn, and teacher-force decoders with a CPU run's tokens to compare step by step.
- Audio inputs: use `AUDIO_ACCEPT` from `lib/tools.ts` (iOS needs explicit extensions).
- Browser checks with Playwright: read results back with `browser_evaluate` as short JSON. Take a
  screenshot or page snapshot only to check how something looks.
- Before finishing: `npm run lint` and `npm run build` must pass.
- Hosting: Vercel builds every push to `main` (settings in `vercel.json`) and serves it at
  xsenzetools.vercel.app, so a push is a release.
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

Tools (Audio and Video categories, built one at a time, user reviews each):

- `lib/flow-hooks.ts` is a reduced stand-in (no workflows); `deliverPending` feeds the omnibox
  hand-off from `lib/handoff.ts`.
- After adding icons by name run `npm run gen-icons`; after changing the logo `npm run gen-brand`.
- Done: audio-trimmer, audio-normaliser, voice-recorder, waveform-genny, audio-atlas,
  audio-extractor, video-muter, video-trimmer, video-atlas, video-to-gif, frame-extractor, screen-recorder, subtitle-converter, subtitle-studio, auto-subtitle, timecode-calc (all 16 ported), plus our own subtitle-translator (browser Translator API, falls back to NLLB-200 via Transformers.js) and audio-dub (Whisper -> NLLB -> voice engines in `lib/dub/`: Supertonic 3 first, Auto picks per language; MMS was removed (Supertonic covers all its languages); speakers found per line in `lib/dub/speakers.ts` (CAM++ voiceprints from `lib/dub/fbank.ts` features + pitch; WavLM q8 scrambled them), a preset voice each; Chatterbox Multilingual clones each speaker from a clip of their lines (`lib/dub/chatterbox.ts`; its speech encoder runs on WASM, WebGPU lacks its AveragePool); Indic Parler-TTS (`lib/dub/parler*.ts`) voices the Indian languages Supertonic lacks; its 4-bit text encoder runs on WASM and DAC at fp32, as WebGPU gets both wrong (its fp16 decoders are fine); NLLB translates a line one sentence at a time, as it drops short sentences otherwise; "Keep music", the default background, splits the original with HTDemucs on WebGPU (`lib/dub/separate*.ts`, 21 ONNX pieces, piece 0's input normalisation pinned to the CPU or it gives NaN) and mixes the dub over the music without the voices; lines are sped up or slowed with their pitch kept by Signalsmith Stretch (`stretched` in `lib/dub/mix.ts`), never `playbackRate`).
