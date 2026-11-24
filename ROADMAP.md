# Xsenze Tools roadmap

Every tool and feature, by category, with where it stands. Code for each category lives in
`app/components/tools/<category>/` and `app/lib/<category>/`.

Status: ✅ done and live · 🧪 built, dev builds only · 🚧 in progress · 📋 planned · 💤 switched off

## Site

| Work                                                                | Status | Notes                                                                            |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Xsenze UI Kit across the whole site (shell, home, every tool)       | ✅     | Kit bundled in `vendor/xsenze-ui/`; tool parts in `app/components/xz/`           |
| Old kit motion restored (press, slider fine drag, dialog, size bar) | ✅     |                                                                                  |
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

| Feature                                                                                                      | Status |
| ------------------------------------------------------------------------------------------------------------ | ------ |
| Clips on one video track: trim, split, cut out a part, reorder, delete, duplicate, undo/redo                 | ✅     |
| Music and Voice layers: sounds placed in time, moved between layers, trimmed, split                          | ✅     |
| Volume 0–200 %, mute, fade in/out per clip; a level and switch per layer                                     | ✅     |
| Preview of the whole edit, with waveforms                                                                    | ✅     |
| Export to MP4 (H.264/H.265/AV1 + AAC) or WebM (VP9/AV1 + Opus): shape, fit, size, frame rate, quality, sound | ✅     |
| **Batch 1**                                                                                                  |        |
| Photos as clips, with a duration                                                                             | ✅     |
| Text titles: font, size, colour, background, position, time                                                  | 📋     |
| Overlay: logo, watermark or small video, dragged and resized on the preview, opacity                         | 📋     |
| Speed 0.25–4× with the pitch kept                                                                            | ✅     |
| Crop, rotate 90°, flip                                                                                       | ✅     |
| Adjust (brightness, contrast, saturation) and filter presets                                                 | ✅     |
| Transitions: fade, dissolve, wipe                                                                            | 📋     |
| Background colour or blur behind clips of another shape                                                      | ✅     |
| **Batch 2**                                                                                                  |        |
| Shapes and emoji, text animations                                                                            | 📋     |
| Save and open a project file                                                                                 | 📋     |
| Record voice, screen or camera in the editor                                                                 | 📋     |

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
