# Xsenze Tools: notes for Claude

Browser-only creative tools site (Ember 7 + Vite + Embroider, TS + Glint, SCSS, the user's own
Xsenze UI Kit, lucide-static). See README.md for the stack and the "Adding a tool" steps.

Rules:

- Everything runs client-side. Never add a server call, upload, analytics or login.
- `app/lib/tools.ts` is the single source of truth for categories and tools.
- Folders go by category: tool UIs in `app/components/tools/<audio|video|image>/<id>.gts`
  (parts in `<id>/`; parts several tools share in `tools/shared/`); helpers in
  `app/lib/<audio|video|image|subtitles|ai>/` (site-wide ones stay at `app/lib/`).
- `ROADMAP.md` lists every tool and feature with its status: update it when work starts or ends.
- Tool UIs are lazy-loaded via `app/lib/tool-components.ts`; import heavy libs (mediabunny, etc.)
  inside the tool component so they stay out of the main bundle.
- Components are strict-mode `.gts`. Styles: site-wide blocks in `app/styles/app.scss`, component
  styles as co-located plain `.css` using the kit's `--xz-*` variables.
- Transformers.js: always set `env.backends.onnx.wasm.wasmPaths` to the bundled `ort-wasm` URL (the
  library defaults to a CDN). Run long model work in a Web Worker (see `lib/ai/nllb.worker.ts`).
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
  the content area scrolls. The desktop sidebar folds to the kit's icon rail (header button or Ctrl B, kept in
  localStorage `xsenze.sidebar-rail`). A tool can put buttons in the top bar with `<PageTools>`
  (`components/page-tools.gts`, an in-element into `#page-tools`). Home: omnibox over a faint icon backdrop, then `xz-card` tool cards.
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
- Video Edit (`video-edit`, Video category) is built in steps the user checks: (1) layers (Video,
  Music, Voice), audio, volume up to 200 %, fades; (2) an Overlay layer (pictures, a small video,
  text) and speed 0.5–2×; (3) export with every layer and the mixed sound. It is live (`VIDEO_EDIT_LIVE` in `lib/tools.ts`
  is true; set it to `import.meta.env.DEV` to hide it again). The edit is plain data in `lib/video/edit/timeline.ts` (clips,
  video pieces, audio items placed in time, a level per layer; pure functions and a History for undo; unit tests in
  `tests/unit/video-edit-timeline-test.ts`). `lib/video/edit/player.ts` plays the edit on one clock: the
  video track onto one canvas with black bars, every sound through its own Web Audio gain.
  `lib/video/edit/export.ts` renders the same edit in 5-second windows: frames from
  `VideoSampleSink` drawn with `drawWithFit` onto one canvas into a `CanvasSource`, and every sound
  mixed in an `OfflineAudioContext` (gain curves for volume and fades) into an `AudioBufferSource`.
  MP4 is H.264/H.265/AV1 + AAC, WebM is VP9/AV1 + Opus. The preview and the export draw every picture through `lib/video/edit/draw.ts` (crop, turn, flip, look filters, fit, background colour or blur, fade), so they match. Photos are clips of kind image (`photoLimit` long, a piece shows `photoSeconds`); speed divides a piece's clip seconds, and the export stretches its sound with `lib/audio/stretch.ts` (pitch kept). A piece's `transition`
  overlaps the piece before it (`overlapOf`, at most half of either; `showingAt` gives the two
  pieces and the progress); the player keeps two video slots per clip (`index % 2`) so both can
  show, and `drawShots` in `draw.ts` blends them. Text, pictures, small videos, shapes and emoji
  are `layers` on the Text and Overlay rows, drawn over the picture by `lib/video/edit/layers.ts`
  (sizes, animations, fonts; the export waits for the fonts); `video-edit/frame-box.gts` drags and
  sizes them on the preview. The edit, its settings and its files are kept in IndexedDB by
  `lib/video/edit/store.ts` and come back on the next visit; New edit clears them. Where
  `showSaveFilePicker` exists, an export can go straight to a file through mediabunny's
  `StreamTarget` (MP4 without fast start), so long videos never sit whole in memory. Sound and
  speech: a voice-over is recorded with MediaRecorder and kept as WAV on the Voice layer; Music
  ducks under Voice items (`duckAt`, a gain in the player and a curve in the export); "Subtitles
  from speech" mixes the videos and Voice at 16 kHz (`mixSpeech`) for the site's Whisper worker,
  drops bracketed sound notes and keeps captions inside the sound; noise reduction is spectral
  gating in `lib/audio/denoise.ts`, making a hidden cleaned clip (`cleanOf`) the item switches to.
  Effects and finishing: a look also has `vignette`, `blur` and `motion` (zoom or pan over
  the piece, `movedBox` in `draw.ts`; a Shot carries its `progress`); overlay pictures and
  videos have a `key` (green screen, `lib/video/edit/chroma.ts`, keyed at the drawn size).
  `clip-tools.ts` makes new files from a clip: `reverseClip` (picture and sound backwards, read
  in half-second windows from the end; a hidden clip with `reverseOf` the piece swaps to) and
  `clipStill` (an upright PNG for Freeze frame). `export.ts` also makes a GIF (`gif.ts`), the
  sound alone (WAV, or MP3 through `@mediabunny/mp3-encoder`) and one frame as PNG; 4K is
  offered where `exportCodecs(3840, 2160)` finds an encoder. A project file is a zip of
  project.json and a media folder (`packProject` / `unpackProject` in `store.ts`); older records
  are filled in by `fullLook` and `plainKey`.
  In and out animations (titles, overlays and clips) are worked out in `lib/video/edit/anim.ts`
  (`motionOf`: opacity, move, size, blur, and a soft or circle wipe drawn through a frame-sized
  sheet by `drawRevealed`); a piece has `animIn`, `animOut`, `animSeconds` and comes in over
  black. `video-edit/anim-picker.gts` is the In / Out tile grid (CSS previews on hover).
  Tools' own messages use `toast.notify`; `toast.show` stays the "Copied" note. A modifier must not read
  tracked state it does not mean to follow: the canvas modifier once reread the playhead every
  frame and re-sought the video.
- After adding icons by name run `npm run gen-icons`; after changing the logo `npm run gen-brand`.
- Done: audio-trimmer, audio-normaliser, voice-recorder, waveform-genny, audio-atlas,
  audio-extractor, video-muter, video-trimmer, video-atlas, video-to-gif, frame-extractor, screen-recorder, subtitle-converter, subtitle-studio, auto-subtitle, timecode-calc (all 16 ported), plus our own video-compressor (one or many videos; mediabunny transcode
  at a bitrate it works out from a Quality preset or a target size; `compressVideo` in
  `lib/video/media-convert.ts`), image-compressor (jSquash WASM codecs: MozJPEG, WebP, AVIF, OxiPNG, plus
  image-q palettes for PNG, in `lib/image/image-compress.worker.ts`; shrinks with Lanczos3 from `@jsquash/resize`; Target size searches quality; both
  compressors take many files and share `shared/media/work-banner.gts` for progress and time left), subtitle-translator (browser Translator API, falls back to NLLB-200 via Transformers.js), transcript
  (subtitle files only, no speech: SRT/VTT/ASS/LRC read by `lib/subtitles/transcript.ts` into
  paragraphs; any mix of TXT, Word, MD, PDF, CSV, JSON, HTML; Word and PDF are made in
  `transcript-files.ts`, loaded on demand: a minimal DOCX zip, and a PDF of canvas-drawn A4 pages
  so every script prints; Download all or one Zip through `shared/media/download-all.gts`).
