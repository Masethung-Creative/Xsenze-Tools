# Xsenze Tools: notes for Claude

Browser-only creative tools site (Ember 7 + Vite + Embroider, TS + Glint, SCSS, the user's own
Xsenze UI Kit, lucide-static). See README.md for the stack and the "Adding a tool" steps.

Rules:

- Everything runs client-side. Never add a server call, upload, analytics or login.
- `app/lib/tools.ts` is the single source of truth for categories and tools.
- Tool UIs are lazy-loaded via `app/lib/tool-components.ts`; import heavy libs (mediabunny, etc.)
  inside the tool component so they stay out of the main bundle.
- Components are strict-mode `.gts`. Styles: site-wide blocks in `app/styles/app.scss`, component
  styles as co-located plain `.css` using the kit's `--xz-*` variables.
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

- The UI is the user's own **Xsenze UI Kit** (docs: xsenze-ui.vercel.app/docs). Its built files
  are bundled in `vendor/xsenze-ui/` (no CDN); `app/app.ts` imports `xsenze.min.css`; the readable `xsenze.css` is
  kept for looking up class names.
  Use its `xz-` classes and `--xz-*` tokens. Ember drives behaviour; the kit's script is not
  loaded.
- Kit defaults, as the user chose: main buttons black (light) or white (dark), orange
  (`--xz-accent-2`, text `--xz-accent-2-text`) only for highlights, Plus Jakarta Sans headings,
  Space Grotesk body, the kit's corner rounding. Dark is the default theme; `data-theme` on
  <html> (plus the old `dark`/`light` class) is set in `index.html`.
- Shell: the kit's `xz-shell` with `xz-sidebar` (drawer below 1024px), `xz-navbar` top bar; only
  the content area scrolls. Home: omnibox over a faint icon backdrop, then `xz-card` tool cards.
- Tool UIs use the kit parts in `app/components/xz/` (XzSplit, XzRows, XzRow, XzButton, XzSegmented,
  XzSlider, XzDropZone, XzDialog…), with shared helpers in `lib/xz/`, `modifiers/xz/` and the
  `xz-toast` service (`<XzToast />` is mounted in `templates/application.gts`). Tool pages sit in
  `.xz-tool-frame`. Own classes must not reuse a kit base name (`xz-grid`, `xz-row`, `xz-tiles`,
  `xz-split` are the kit's layout helpers): the parts use `xz-cellgrid`, `xz-prow`,
  `xz-tilegroup`, `xz-tool-split`.

Tools (Audio, Video and Image categories, built one at a time, user reviews each; PDF, Dev Tools,
Other Tools, Xsenze UI Kit, Paths and Roadmap are empty categories that show Coming soon, with
their `soon` line from `lib/tools.ts`):

- `lib/flow-hooks.ts` is a reduced stand-in (no workflows); `deliverPending` feeds the omnibox
  hand-off from `lib/handoff.ts`.
- Story Studio (`story-studio`, AI Studio category) is built in phases the user checks one by
  one. `STORY_STUDIO_LIVE` in `lib/tools.ts` keeps it to dev builds until it is finished; the
  site shows AI Studio as Coming soon. Its data is in `lib/story/`:
  - `project-types.ts`: every New project question, option and default, plus the plan maths;
  - `targets.ts`: image models and video tools (Sora is gone: it shut down in 2026);
  - `keywords.ts`: looks, to be swapped for the user's keywords skill;
  - `analysis.ts`: the chatbot prompts and the reader for the JSON answers. Up to 16 parts are
    read in one step; longer plans are read as an outline first, then the details one group at a
    time;
  - `prompts.ts`: picture prompts for each model, built fresh from the project. Midjourney rules
    come from the user's skills: parameters last, `--v 8.2` (`--niji 7` for anime), `--raw`
    with `--s 50`, never `--q`, and `--oref` switches to V7;
  - `export.ts`: Markdown and CSV;
  - `read-document.ts`: any story file to plain text for the story box (docx, odt, epub, rtf,
    html, fdx, srt/vtt/ass, text in any encoding; PDF through `read-pdf.ts`, pdf.js loaded only
    then; audio and video through Whisper). .doc and .pages can't be read: it asks for docx or PDF.

  The project tabs are `components/tools/story-studio/*-tab.gts`. Projects autosave to
  localStorage (`xsenze.story-studio`) and move between devices as `.story.json` files (Open file,
  or drop several in Saved projects; a project already here asks Replace or Keep both). Only the
  project type is locked after Create. No server: the chatbot steps are the user's own copy and
  paste.

- Video Edit (`video-edit`, Video category) is built in steps the user checks: (1) layers (Video,
  Music, Voice), audio, volume up to 200 %, fades; (2) an Overlay layer (pictures, a small video,
  text) and speed 0.5–2×; (3) export with every layer and the mixed sound. `VIDEO_EDIT_LIVE` in `lib/tools.ts` keeps it to
  dev builds until export is in. The edit is plain data in `lib/video-edit/timeline.ts` (clips,
  video pieces, audio items placed in time, a level per layer; pure functions and a History for undo; unit tests in
  `tests/unit/video-edit-timeline-test.ts`). `lib/video-edit/player.ts` plays the edit on one clock: the
  video track onto one canvas with black bars, every sound through its own Web Audio gain. A modifier must not read
  tracked state it does not mean to follow: the canvas modifier once reread the playhead every
  frame and re-sought the video.
- After adding icons by name run `npm run gen-icons`; after changing the logo `npm run gen-brand`.
- Done: audio-trimmer, audio-normaliser, voice-recorder, waveform-genny, audio-atlas,
  audio-extractor, video-muter, video-trimmer, video-atlas, video-to-gif, frame-extractor, screen-recorder, subtitle-converter, subtitle-studio, auto-subtitle, timecode-calc (all 16 ported), plus our own video-compressor (one or many videos; mediabunny transcode
  at a bitrate it works out from a Quality preset or a target size; `compressVideo` in
  `lib/media-convert.ts`), image-compressor (jSquash WASM codecs: MozJPEG, WebP, AVIF, OxiPNG, plus
  image-q palettes for PNG, in `lib/image-compress.worker.ts`; shrinks with Lanczos3 from `@jsquash/resize`; Target size searches quality; both
  compressors take many files and share `media/work-banner.gts` for progress and time left), subtitle-translator (browser Translator API, falls back to NLLB-200 via Transformers.js) and audio-dub (Whisper -> NLLB -> voice engines in `lib/dub/`, switched off on the site for now: `VOICES_READY` in `lib/dub/engines.ts` is false, so no language gets an engine, the Voice engine section says Coming soon and Dub stays disabled; with them on: Supertonic 3 first, Auto picks per language; MMS was removed (Supertonic covers all its languages); speakers found per line in `lib/dub/speakers.ts` (CAM++ voiceprints from `lib/dub/fbank.ts` features + pitch; WavLM q8 scrambled them), a preset voice each; Chatterbox Multilingual clones each speaker from a clip of their lines (`lib/dub/chatterbox.ts`; its speech encoder runs on WASM, WebGPU lacks its AveragePool); Indic Parler-TTS (`lib/dub/parler*.ts`) voices the Indian languages Supertonic lacks; its 4-bit text encoder runs on WASM and DAC at fp32, as WebGPU gets both wrong (its fp16 decoders are fine); NLLB translates a line one sentence at a time, as it drops short sentences otherwise; "Keep music", the default background, splits the original with HTDemucs on WebGPU (`lib/dub/separate*.ts`, 21 ONNX pieces, piece 0's input normalisation pinned to the CPU or it gives NaN) and mixes the dub over the music without the voices; lines are sped up or slowed with their pitch kept by Signalsmith Stretch (`stretched` in `lib/dub/mix.ts`), never `playbackRate`).
