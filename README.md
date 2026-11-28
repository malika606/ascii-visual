# ASCII Visual · v1.3.1

A standalone, local-first experiment for a professional portfolio Lab. Convert static images, animated GIFs and browser-decodable short videos into animated, colored ASCII-like artwork. Incremental patch from v1.3.0. The only UI change in v1.3.1 is local upload error feedback. The accepted introduction is unchanged. The editor now has a black, tactile, preview-first workspace with a compact settings panel and unified export. No copied reference interfaces or remote runtime services.

## Quick start

Node.js 22.13+ and npm are required.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173). For production:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Deploy `dist/` to a static HTTPS host. Vite uses relative asset paths (`base: './'`) for subdirectory hosting. No backend, API credentials, analytics or upload service. Do not open index.html directly from the file system. The committed lockfile supports reproducible installs with `npm ci`.

**Verification status (v1.3.1):** `npm ci`, TypeScript, all 14 unit tests, and the production Vite build passed. The real Vite/React app passed desktop and mobile Chromium UI smoke tests, including uploads, settings, intro/editor navigation, and PNG/GIF/WebM/MP4 downloads in the tested browser. See [VERIFICATION.md](VERIFICATION.md) for commands, environment, and device limitations.

## Introduction and editor lifecycle

- The first screen has one action: **MAKE IT ASCII**. The editor chunk is imported lazily after the first click, and the intro is unmounted. The editor remains mounted but hidden on return, so file, settings, resolution and playhead survive. Playback and Canvas animation stop while the editor is hidden. Opening it again leaves playback paused. The return button is disabled during decoding, seeking, restarting or export; cancel export to leave. State is retained during this page session only, not across reloads.
- `src/assets/hero.mp4` is the supplied MP4, byte-for-byte unchanged: H.264, 1280 × 768, 24 FPS, 20.208 s, no audio, 5,105,145 bytes. `hero-poster.webp` is a locally extracted frame at 2.4 s. The media is fitted without cropping, and a separate black scrim protects text contrast on desktop. On narrow screens the video is above the copy, with natural overflow on unusually short screens or large text.
- The video is muted, inline and loops. Since the last flower differs from the first, a black fade of 0.38 s on each side of the native loop smooths the cut without re-encoding, duplicating the video or running a second decoder.
- Reduced motion and supported `navigator.connection.saveData` skip/unload the MP4 and show the poster. A hidden document pauses playback and shows the poster; the MP4 may remain buffered until the intro is left. Returning to a visible tab resumes if allowed. An autoplay or decoding failure unloads the video and retains the poster; the button still works. Leaving the intro pauses and detaches the source and cancels its animation callback.
- All assets are local, addressed through Vite's `new URL(..., import.meta.url)` asset handling. No external fonts, CDN or upload service. Physical mobile Safari and actual network transfer/code-splitting still require verification.

## How to use

- The original procedural bouquet is generated locally and loaded automatically on first opening the editor, using Bloom; no remote assets. Restore it with **Use demo** (restores default preset/settings). Replace it using the pink **Upload file** button or drop a file on the preview. The demo is explicitly labeled.
- Choose Bloom (bottom-up reveal and saturation), Terminal (green glimmer), Mosaic (large glyphs with wave), or Fine (dense static glyphs). Adjust Detail (existing cell size; smaller symbols mean more detail), Contrast, and Color intensity. Characters offers Classic, Numbers, Binary, and Blocks. Non-Classic presets also retain their original character ramp option. Choosing a preset resets appearance; subsequent adjustments keep its name with an adjusted indicator. Advanced settings contains background mode, color/tolerance (when relevant), dark threshold (applies to all modes), motion, speed (when relevant), monochrome, and reduced motion. Effect speed changes the character animation, not source playback speed.
- GIF/video have a time slider and current/total time. Scrubbing pauses the preview, requests the chosen source time, and redraws after the decode/seek has settled. New requests abort stale seeks. The right edge targets the final frame rather than wrapping to the beginning. Play resumes from the selected position; Restart resets to the beginning and plays unless reduced motion is active. Video uses the browser's media clock; GIF uses decoded per-frame delays. The effect clock resets to the selected time on seek, so a reveal can be incomplete near the beginning; select Fine or Motion=None to inspect source frames without the extra effect. Native video seeking is frame-granular, not sub-frame editing.
- System reduced-motion preference starts paused and suppresses generated effects; users may explicitly play real moving source frames. Hiding the tab pauses preview.
- Set **Background mode** and tolerance in Advanced settings if needed. At the bottom select Format and Export resolution, then click the single **Download** button. The actual dimensions and animation duration are displayed for the selected format. Native video formats are omitted when the browser does not advertise support; a fallback note explains available formats. If a native encoder reports an unsupported/invalid container or recognized recorder failure, the format is removed for the page session and GIF is selected. PNG saves the current Canvas, including the paused position. WebM, MP4 and GIF create independent animations **from the beginning**, with current appearance settings; they do not start from the preview playhead. Reduced-motion suppresses the extra effect in the exported animation, but does not freeze the real source frames.
- Video recording is silent, real-time; keep the tab visible. Cancel export stops without downloading partial output. GIF uses a bounded frame-by-frame local encoder (no recording API required).

## Background controls

- **Dark / transparent**: original alpha and luminance threshold filter. Fully transparent input and pixels at/below the dark threshold do not produce characters. Output remains opaque black.
- **Light**: removes sampled cells with original luminance >= `255 - tolerance * 2.55`. For an off-white background start around 5–15%; decrease tolerance if light parts of the subject disappear.
- **Chosen color**: choose the background RGB color and tolerance (0–100%). Removes sampled cells when RGB Euclidean distance / sqrt(3) is <= `tolerance * 2.55`. Start around 5–10% for a uniform backdrop. Keying is performed before contrast/saturation; it applies to the entire sampled grid. Color key removes matching colors on the subject too, and anti-aliased edges may leave a fringe. Neither mode is object segmentation or semantic background removal. Complex backgrounds require a separate technique. Transparency in PNG input is supported, but the output PNG/GIF/video has a black background, not an alpha channel.

## Formats and bounds

| Input | Support and limit |
| --- | --- |
| PNG / JPG / JPEG / static WebP | createImageBitmap; 24 MP maximum after decode. Animated WebP/APNG are not supported as animation. |
| GIF | Local LZW decoder, global/local palettes, interlacing, transparency, per-frame timing, rectangles, disposal 2/3; repeated playback. Max 2 MP logical screen, 300 frames, 96 MiB stored RGBA. Delays under 20 ms are clamped; zero delay defaults to 100 ms. |
| MP4 / WebM | Native HTMLVideoElement decoding; codec-dependent. Max 15 s and 24 MP. Source audio muted. |
| All files | Max 30 MiB, supported MIME or extension for generic MIME; invalid files produce a single accessible alert immediately above the preview. A failed replacement keeps the previous source, settings and paused preview; a subsequent successful upload clears the alert. |

| Output | Support and limits |
| --- | --- |
| Preview / PNG | Source aspect ratio, no cropping, longest side <= min(original longest side, 960 px). PNG exports the actual current Canvas. |
| WebM | Native Canvas capture + MediaRecorder VP9/VP8/generic WebM; only shown if capability detected. Silent; 24 FPS target; 5 s photos, 2–15 s moving sources (short ones loop). |
| MP4 | Native Canvas capture + MediaRecorder with explicit H.264/AVC MIME; only shown if capability detected. Real MP4 verified in Chromium 144 with FFprobe/FFmpeg. Same video duration/FPS policy. Odd dimensions rounded **down** to even dimensions, fitted without stretching/cropping; actual size displayed separately. Extremely narrow output (<2 px in either direction) disables MP4. No WebM renaming, no software transcoder. |
| GIF | Original local GIF89a encoder, fixed RGB332 palette (256 colors), looping, 10 FPS, at most 5 s / 50 frames, longest side <= 480 px and selected/native size. Video frames seek to 0.1 s intervals; source GIF delays sampled by timestamp. Duration rounded up to a 0.1 s frame boundary. Actual output dimensions shown separately. |

### Resolution policy

Options: source/render maximum, 720, 480, 320 px longest side, excluding options exceeding the maximum. Small sources have only their valid native-size option(s); no hidden upscaling. Actual width/height are shown. The ASCII grid is derived from the source's canonical working size (max 960 px); output selection scales that same grid and character sizes, preserving composition rather than claiming more detail. Low output resolutions may make a dense grid less legible. MP4 uses an explicit even-sized output; GIF has its own cap. Both exceptions are displayed in the UI before export.

The renderer runs on the main thread. GIF input decodes synchronously, bounded by memory and frame limits; large GIFs may temporarily block the interface. Image dimensions are checked after decode. Native MP4/WebM capability detection is advisory; device encoders may fail at runtime. MP4 may be fragmented, and native WebM/MP4 seek/duration metadata and editing compatibility vary by browser. Output MIME and container header are verified before download; actual decode and frame differences are independently tested on Chromium. No source audio is included. GIF uses a limited palette and may band colors. Safari/mobile encoders, extreme input dimensions and worst-case performance need device testing. Current source uses modern AbortSignal.any and throwIfAborted APIs. The intro and editor visual designs are implemented; no publication is implied.

## Architecture

```text
src/
  Site.tsx                intro/editor navigation, lazy import, retained editor
  components/Hero.tsx     intro, media lifecycle and single CTA
  components/hero.css     isolated editorial/retro intro styles
  assets/                 local hero video and poster
  App.tsx                 editor state, playback timeline, source lifecycle, export selection
  main.tsx                React root
  styles.css              shared base styles and variables
  components/
    SettingsPanel.tsx     presets, character sets, primary/advanced settings
    editor.css            isolated editor layout and tactile controls
  media/
    validation.ts         formats and input limits
    gif.ts                GIF parsing, LZW, compositing and frame timing
    source.ts             image/GIF/video adapters; position/seek/play/pause/dispose
    demo.ts               original procedural bouquet PNG
  engine/
    settings.ts           typed presets and settings
    pixels.ts             background keys, luminance/glyph conversion, resolution policy
    motion.ts             deterministic reveal, wave and glimmer
    renderer.ts           sample grid, aspect-preserving Canvas output
  export/
    download.ts           PNG Blob / object URL download
    record.ts             WebM and MP4 capability/container checks and capture
    gif.ts                bounded RGB332/LZW GIF encoder + frame iterator
```

File → validation → Source.frame(time) → sample grid → mask → glyph + RGB → seeded animation → Canvas 2D → PNG/MediaRecorder/GIF encoder. `Source` owns decoder/media resources; disposal closes ImageBitmap, releases GIF frames, aborts pending video seeks and revokes object URLs. Preview and exports own independent source/canvas resources. There are no per-character DOM nodes. Editor layout and styling are isolated in `components/editor.css`; UI state and export orchestration live in `App.tsx` and settings in `SettingsPanel.tsx`. Retain engine/media/export APIs. Intro styling is in `components/hero.css`. Do not describe the character reveal on a photo as actual physical motion (e.g., a flower opening).

## Tests

Unit tests require Node 22.13+ and no external npm packages:

```sh
npm test
npx tsc -p tsconfig.core.json
```

Browser tests use Python Playwright, Pillow, Chromium, FFmpeg and FFprobe on PATH. Fixtures are original generated geometry/test patterns, including three-color videos with known content per second.

```sh
python -m pip install playwright Pillow
python -m playwright install chromium
npm run dev
```

In another terminal:

```sh
python tests/browser_smoke.py
python tests/v11_browser.py
python tests/ui_smoke.py
python tests/hero_smoke.py
```

`ASCII_TEST_URL` overrides the default dev URL; `CHROMIUM_PATH` selects a system Chromium. The first two scripts exercise the engine via `/tests/browser.html` on Vite dev, not the React UI. The UI smoke requires the actual Vite app (dev or preview). `v11_browser.py` verifies selected timestamps against known source colors, stale seek cancellation, final GIF frame, background keys, resolution, real H.264/MP4 and GIF output, GIF cancellation and original demo exports. `ui_smoke.py` and `hero_smoke.py` have passed in v1.3.1 using the test-only local React 18.2.0 runtime; the default Vite mode has not run. `hero_smoke.py` checks CTA, real looping media, simulated visibility, fallback states, editor round-trip state and mobile widths. The editor smoke checks unsupported, oversized and corrupt uploads at desktop and 390/320 px, verifies a single visible alert near Upload, preserves the previous GIF frame/time/settings and checks a successful replacement. It additionally checks four distinct ramp outputs at pixel level, adjusted style indicator, collapsed advanced settings, unified downloads, cancellation, mobile order and simulated native recorder unavailability. Native formats are tested only when supported; a skipped MP4 is not a pass.

Independent engine-only path (no Vite or npm packages required if global TypeScript exists):

```sh
TYPESCRIPT_PATH=$(npm root -g)/typescript node scripts/offline-browser-bundle.cjs /tmp/ascii-browser-bundle.js
ASCII_OFFLINE_BUNDLE=/tmp/ascii-browser-bundle.js CHROMIUM_PATH=/usr/bin/chromium python tests/browser_smoke.py
ASCII_OFFLINE_BUNDLE=/tmp/ascii-browser-bundle.js CHROMIUM_PATH=/usr/bin/chromium python tests/v11_browser.py
```

Set `ASCII_SAMPLE_DIR` to save actual generated demo/verification outputs. The offline bundle is test-only, never the application. On Windows use equivalent environment variable syntax. Refer to `VERIFICATION.md` for actual execution outcomes and remaining acceptance tasks.

### Rendering quality (stage 1)
Detail ranges from 2–32 reference pixels. The preview shows the actual grid and when a cell budget limits it. Auto uses up to 24,000 cells while playing and 240,000 paused; Fast uses 24,000 and High uses up to 90,000 playing / 240,000 paused. PNG is independently rendered from the current source at up to 3840 pixels on the long side, never above source resolution. The grid is based on a 960-pixel reference, so larger PNGs sharpen glyphs rather than implying extra source detail. Animation export uses up to 60,000 cells, WebM/MP4 retain 960px maximum, GIF 480px. High density may still be slower on mobile; use Auto or Fast. Video recording is real time.

### Creative Styles (stage 2)
18 selectable looks, with real thumbnails generated locally by the same Canvas renderer from the original procedural bouquet. The four original presets remain unchanged. The extended library includes ten mark modes: text, variable-size dots, pixel tiles, ordered dither, Unicode Braille density, local-gradient contours, stipple, LED dots, hatch and drifting particles. Braille maps sampled cell brightness to eight-dot coverage (not eight independently sampled subpixels). Contours use neighboring sampled luminance, not vector tracing. Geometric styles hide the character ramp because they do not use text; other appearance and motion controls remain available. All modes use the same renderer for preview and PNG/GIF/WebM/MP4. Effects stacking and custom palettes are planned separately. No new dependencies or third-party artwork.

### Effects & Colors (stage 3)
Choose original color, white, amber, paper, four duotones or a custom shadow/highlight gradient. Choosing a palette disables the old green monochrome override; selecting a style restores that style's own palette and effect defaults. Palette mapping uses luminance, so saturation changes original colors only. Six independently adjustable, combinable Canvas passes: distortion, RGB channel split, glow, deterministic grain, CRT scanlines, and vignette (fixed processing order). Effects are static to avoid flashing and are baked into the same shared renderer for preview, PNG, GIF, MP4 and WebM. The glow uses a lightweight downsampled halo, not CSS filters. High effects/density can be slower on mobile and high-resolution PNGs; no guaranteed frame rate. Reset effects clears the effect stack. No external assets, uploads or new dependencies.

### Motion Studio (stage 4)
Ten new deterministic creative motions complement the original reveal, wave and glimmer: Assemble, Disintegrate, Breathing, Digital rain (directional waves of marks), Scan reveal, Spiral reveal, Flow, Glitch loop (smooth band displacement), Dissolve and Shimmer. Intensity and speed are adjustable; creative modes also support base duration (1–5 seconds), seamless periodic cycle or play once, and direction for directional motions. The effective period is base duration divided by speed, rounded to 0.1 seconds and bounded to 1–5 seconds. Still images have a separate scrub control, and once stops playback at the end; animated source media retain their own time and duration. Still-image GIF and video export use one selected creative cycle; actual video capture is real-time and source GIF/video seams and encoder timing are not guaranteed seamless. Reduced motion suppresses generated motion in all formats. The new motions use smooth envelopes, not rapid whole-frame flashes; no new dependencies, external assets or uploads.

### Studio Experience (stage 5)
The appearance panel is divided into five keyboard-navigable tabs: Style, Adjust, Color, Motion and Effects. The main preview and export controls stay in place. Undo/Redo keep up to 60 look changes (settings + selected style); a pointer slider gesture is grouped. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z work outside text editing. History covers appearance only, not files, playback, export format or the comparison slider.
Compare shows a synchronized original source frame over the processed canvas using a movable split; it is preview-only and never changes exports. Custom character ramps accept 1–64 printable Unicode code points ordered sparse to dense; unsupported fonts may display replacement glyphs. Surprise me chooses a curated style/palette/effects combination while preserving the current background mask. My looks stores up to 30 named settings-only recipes in browser localStorage; they survive reload on that origin, are not uploaded, and may disappear if browser storage is cleared. Duplicate names are not silently overwritten. No new dependencies or changes to the intro, decoder, or encoding algorithms.

### Advanced Export (stage 6)
PNG and still HTML can be rendered up to 3840px on the long edge, bounded by the source. Native WebM/MP4 offer up to 1920px long edge (MP4 dimensions rounded down to even numbers), 12/24/30 target FPS and balanced/high target bitrate. Preview remains capped at 960px. Video is recorded in real time, so frame rate, actual bitrate and codec availability depend on the browser and device. If a large export fails, choose a smaller size or another format. 4K video is not promised; GIF remains 480px / 10 FPS / 5 seconds maximum.
Choose HTML · still or HTML · animated to download a standalone responsive page with embedded processed PNG or GIF, not original source media. Animated HTML has a PNG fallback for prefers-reduced-motion and requires no script, network connection, or installed library. Open the file directly or upload it to your own static site and embed it with an iframe. The HTML contains raster artwork rather than an editable character-by-character runtime. The animated version follows GIF limits; it is not a real-time renderer.

### Product polish
The export resolution is now resolved from the actual format-specific list and used consistently in the preview, metadata and encoder, including after replacing a source. MP4 availability checks all usable resolutions for the current aspect ratio. Static still images stop scheduling animation frames; the preview reuses its renderer and uses elapsed time rather than slowing the clock when drawing is expensive. Source video/GIF remains playable with reduced generated motion. On roomy desktops the preview stays in view while browsing the settings; Go to export moves focus to the existing export section. No new dependencies.

### Compositing controls (Rendering Engine Upgrade stage 2)
Color → Layers & backdrop separates the mark layer from black, solid, original-frame, blurred-frame or transparent backdrops. Hybrid look combines a low-opacity blurred original with screen-blended marks. Mark opacity applies to the whole mark layer. Original and blurred backdrops include the unmasked source; source masking affects marks only. Blur is a bounded downsample/resample approximation. PNG and still HTML preserve true alpha; GIF, MP4, WebM and animated HTML flatten transparency to black. The existing opaque post effects and blend modes are bypassed on transparent artwork until alpha-aware effects are implemented. Default black + normal + 100% marks preserves pure ASCII behavior.
