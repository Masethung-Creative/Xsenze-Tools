# Xsenze Tools roadmap

Every tool and feature, by category, with where it stands. Code for each category lives in
`app/components/tools/<category>/` and `app/lib/<category>/`.

Status: ✅ done and live · 🧪 built, dev builds only · 🚧 in progress · 📋 planned · 💤 switched off

## Site

| Work                                                                | Status | Notes                                                                            |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Xsenze UI Kit across the whole site (shell, home, every tool)       | ✅     | Kit bundled in `vendor/xsenze-ui/`; tool parts in `app/components/xz/`           |
| Old kit motion restored (press, slider fine drag, dialog, size bar) | ✅     |                                                                                  |
| Site sidebar folds to icons (button or Ctrl B, remembered)          | ✅     |                                                                                  |
| Folders grouped by category                                         | ✅     |                                                                                  |
| Live site deploys by itself on push                                 | 📋     | Vercel's GitHub app needs access to the repo; until then `npx.cmd vercel --prod` |

## Audio

| Tool               | Status | Notes                                                                       |
| ------------------ | ------ | --------------------------------------------------------------------------- |
| Audio Atlas        | ✅     | Everything about one audio file                                             |
| Audio Dub          | 💤     | Whisper → NLLB → voices; voices off (`VOICES_READY`), Dub shows Coming soon |
| Audio Extractor    | ✅     |                                                                             |
| Audio Normaliser   | ✅     |                                                                             |
| Audio Trimmer      | ✅     |                                                                             |
| Voice Recorder     | ✅     |                                                                             |
| Waveform Generator | ✅     |                                                                             |

## Video

| Tool                | Status | Notes                                    |
| ------------------- | ------ | ---------------------------------------- |
| Auto Subtitle       | ✅     | Whisper on the device                    |
| Frame Extractor     | ✅     |                                          |
| Screen Recorder     | ✅     |                                          |
| Subtitle Converter  | ✅     |                                          |
| Subtitle Studio     | ✅     | Burn subtitles in                        |
| Subtitle Translator | ✅     | Browser Translator API, else NLLB-200    |
| Timecode Calculator | ✅     |                                          |
| Video Atlas         | ✅     |                                          |
| Video Compressor    | ✅     |                                          |
| Video Muter         | ✅     |                                          |
| Video to GIF        | ✅     |                                          |
| Video Trimmer       | ✅     |                                          |
| **Video Edit**      | 🧪     | `VIDEO_EDIT_LIVE` keeps it to dev builds |

### Video Edit

| Feature                                                                                                                                                                   | Status |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Clips on one video track: trim, split, cut out a part, reorder, delete, duplicate, undo/redo                                                                              | ✅     |
| Music and Voice layers: sounds placed in time, moved between layers, trimmed, split                                                                                       | ✅     |
| Volume 0–200 %, mute, fade in/out per clip; a level and switch per layer                                                                                                  | ✅     |
| Preview of the whole edit, with waveforms                                                                                                                                 | ✅     |
| Export to MP4 (H.264/H.265/AV1 + AAC) or WebM (VP9/AV1 + Opus): shape, fit, size, frame rate, quality, sound                                                              | ✅     |
| Editor layout: tool rail (Media, Text, Overlay, Audio, Canvas), closable panel, centred preview with play bar, Edit/Adjust/Audio tabs, full-width timeline, Export dialog | ✅     |
| **Batch 1**                                                                                                                                                               |        |
| Photos as clips, with a duration                                                                                                                                          | ✅     |
| Speed 0.25–4× with the pitch kept                                                                                                                                         | ✅     |
| Crop, rotate 90°, flip                                                                                                                                                    | ✅     |
| Adjust (brightness, contrast, saturation) and filter presets                                                                                                              | ✅     |
| Background colour or blur behind clips of another shape                                                                                                                   | ✅     |
| **Phase 1: content on the picture**                                                                                                                                       |        |
| Text titles: preset styles, font, size, colour, bold, italic, alignment, outline, background box, place, time                                                             | ✅     |
| Text animations: fade, slide up, slide in, pop, typewriter; in and out                                                                                                    | ✅     |
| Overlay: logo, picture or small video (picture in picture), dragged and resized on the preview, opacity, round corners, turn                                              | ✅     |
| Shapes (box, circle, arrow, star) and emoji                                                                                                                               | ✅     |
| Transitions between clips: dissolve, through black, through white, wipe, slide, circle                                                                                    | ✅     |
| Presets for where it is posted: YouTube, Shorts, Reels, TikTok, Instagram, Facebook, X                                                                                    | ✅     |
| **Phase 1.5: keep work safe, link the site**                                                                                                                              |        |
| Autosave in the browser (edit, settings and files); New edit starts over                                                                                                  | ✅     |
| Export written straight to a file as it renders (Chrome, Edge), for long videos                                                                                           | ✅     |
| Drag files from Media onto the video, Overlay, Music or Voice row                                                                                                         | ✅     |
| SRT and VTT files become captions on the Text row                                                                                                                         | ✅     |
| Open in another tool after export                                                                                                                                         | ✅     |
| **Phase 2: sound and speech**                                                                                                                                             |        |
| Record a voice-over onto the Voice layer                                                                                                                                  | ✅     |
| Auto subtitles with Whisper onto the Text layer                                                                                                                           | ✅     |
| Ducking: music lowers under speech                                                                                                                                        | ✅     |
| Detach a video’s sound onto its own layer                                                                                                                                 | ✅     |
| Noise reduction on voice clips                                                                                                                                            | ✅     |
| **Phase 3: effects and finishing**                                                                                                                                        |        |
| Vignette and blur effects; green screen for overlay videos                                                                                                                | ✅     |
| Reverse a clip, freeze a frame, zoom and pan on photos                                                                                                                    | ✅     |
| Export 4K, GIF, or sound only (MP3/WAV)                                                                                                                                   | ✅     |
| Save and open a project file; save the current frame as PNG                                                                                                               | ✅     |
| **Animations**                                                                                                                                                            |        |
| In and out picker with moving tiles for titles, overlays and clips: fade, blur, zoom, slide, soft reveal, circle, pop, typewriter                                         | ✅     |

## Image

| Tool             | Status | Notes                                   |
| ---------------- | ------ | --------------------------------------- |
| Image Compressor | ✅     | MozJPEG, WebP, AVIF, OxiPNG in a worker |

## AI Studio

| Tool         | Status | Notes                                      |
| ------------ | ------ | ------------------------------------------ |
| Story Studio | 🧪     | `STORY_STUDIO_LIVE` keeps it to dev builds |

### Story Studio

| Phase                                                                | Status |
| -------------------------------------------------------------------- | ------ |
| 1. Setup screens and Plan tab                                        | ✅     |
| 2. Story, pass 1, bible, asset prompts, export                       | ✅     |
| Open project files; read the story from any file (docx, PDF, audio…) | ✅     |
| 3. Your own pictures: name reading, matching, project .zip           | 📋     |
| 4. Shots, frame and video prompts                                    | 📋     |
| 5. Keywords skill swap                                               | 📋     |

## Coming soon (empty categories)

PDF · Dev Tools · Other Tools · Xsenze UI Kit · Paths · Roadmap
