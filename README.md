# ASCII Visual · v2.0.0

A local-first creative studio for turning images, GIFs and short videos into character-based and geometric digital artwork. Built with React, TypeScript, Vite and Canvas 2D. The original intro and tactile black-and-pink visual identity remain intact.

**[Open the live studio](https://malika606.github.io/ascii-visual/)** · [Technical verification](VERIFICATION.md)

## What you can create

- 18 visual styles with thumbnails rendered by the artwork engine, across 10 mark modes: text, dots, pixels, ordered dither, Braille density, contours, stipple, LED, hatch and particles.
- Detail from 2–32 reference pixels; Auto, Fast and High preview modes.
- Nine color modes, including custom duotone; six stackable effects (distortion, RGB split, glow, grain, CRT scanlines and vignette).
- 13 generated-motion modes, with intensity, speed and creative-cycle controls. Direction is available for applicable effects.
- Five editing tabs, Before/After, up to 60 appearance-history steps, custom character ramps, curated Surprise me and up to 30 locally saved looks.
- PNG, GIF, native MP4/WebM and standalone static/animated HTML.

## Use the studio

1. Select **MAKE IT ASCII**, then use the procedural bouquet demo or upload/drop your own source.
2. Choose a look under Style. Use Adjust for density, contrast, saturation, character ramps and background masking; use Color, Motion and Effects for further editing.
3. Compare the current original and processed frame, pause or scrub as needed, and optionally save a named look.
4. Select an output format and resolution in Export. Choose FPS and bitrate mode for native video. Download the result. Keep the tab visible for video recording.

Files are processed in your browser. No backend, analytics, external runtime service or source uploads. My looks stores settings only in localStorage on this origin; source media, playback and history do not persist across reloads. Browser storage can be cleared.

## Input and output limits

| Input | Support and limit |
| --- | --- |
| PNG / JPG / JPEG / static WebP | Browser bitmap decode; up to 24 MP after decoding. Animated WebP/APNG are not supported as animation. |
| GIF | Local decoder; up to 2 MP logical screen, 300 frames and 96 MiB stored RGBA. Delays under 20 ms are clamped; zero delay defaults to 100 ms. |
| MP4 / WebM | Browser-native decoding, codec-dependent; up to 15 s and 24 MP. |
| All files | Up to 30 MiB. Failed replacement retains the previous source and shows one local error. |

| Output | Support and limit |
| --- | --- |
| Preview | Up to 960 px on the long edge. |
| PNG / HTML still | Fresh render of current artwork, up to 3840 px on the long edge, bounded by source size. |
| MP4 / WebM | Up to 1920 px on the long edge, source-bounded; 12/24/30 target FPS; balanced/high target bitrate; silent. MP4 dimensions round down to even values. |
| GIF / HTML animated | Up to 480 px, 10 FPS, at most 5 s / 50 frames; fixed 256-color palette. |

Animation exports start from the beginning of the source. Video duration is 5 s for ordinary still-image looks, 1–5 s for selected creative-motion cycles, or 2–15 s for moving sources. GIF is additionally limited to 5 s. Native capture is real-time: actual FPS, bitrate, codecs and container compatibility depend on the browser and hardware. The app verifies the container signature and offers a lower-resolution or alternate-format fallback on recognized recording failures.

HTML exports contain pre-rendered PNG or GIF artwork, not an editable ASCII runtime or original source. Animated HTML includes a static PNG for reduced-motion preferences. Open directly or host on a static site and embed with an iframe.

## Rendering and accessibility

The grid uses a canonical reference of at most 960 px; larger exports redraw the same composition rather than creating extra source detail. Preview cell budgets range from 24,000 to 240,000, depending on quality and playback, while animation export uses up to 60,000 cells. Dense artwork and effects can be demanding on weak devices.

Background masking uses sampled colors and luminance, not object segmentation. Output is opaque black even when the source has transparency. Braille maps brightness to a Unicode dot-density ramp; contours approximate local luminance edges. Custom characters depend on available fonts. Creative motion cycles are periodic, but source-media seams and real-time encoder timing are not guaranteed seamless.

System reduced-motion preferences suppress generated motion and start preview paused; real GIF/video sources can still be played explicitly. The editor retains source, settings and playhead when returning to the intro during the same session. The original local hero video has poster fallbacks and is released when entering the editor.

## Local development

Node.js 22.13+ and npm are required. The committed lockfile is the reproducible dependency source.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

Production output is in `dist/`. Vite uses relative asset paths for subdirectory hosting. GitHub Pages publishes the main branch through GitHub Actions.

## Architecture

```text
src/
  Site.tsx, components/Hero.tsx    lazy editor and original intro
  App.tsx                        editor state and export orchestration
  components/                    settings tabs, style gallery, saved looks
  engine/                        sample grid, rendering, styles, motion, effects
  media/                         validation, GIF decoding and source adapters
  export/                        PNG, GIF, native recording and HTML packaging
  assets/                        local hero media
```

Source → validation and decode → sampled grid → mask, color and mark mapping → motion and effects → Canvas 2D → output encoder. No per-character DOM nodes.

## Verification

The final product-polish commit passed npm installation (0 vulnerabilities reported in that run), TypeScript, 29/29 unit tests, production build and the complete real-Vite Chromium UI/intro suite. See [the CI run](https://github.com/malika606/ascii-visual/actions/runs/46066540950) and [actual screenshots](https://github.com/malika606/ascii-visual/actions/runs/46066540950/artifacts/15231396224). This release changes documentation and package version metadata only; its own CI must pass before merge.

To reproduce browser tests, install Python Playwright, Pillow, Chromium and FFmpeg/FFprobe, start Vite, then run:

```sh
python tests/ui_smoke.py
python tests/hero_smoke.py
python tests/studio_screens.py
```

`ASCII_TEST_URL` sets the Vite URL; `CHROMIUM_PATH` selects a local Chromium; `ASCII_SCREENSHOTS` specifies the screenshot folder. Independent engine harnesses are `tests/browser_smoke.py` and `tests/v11_browser.py`. Offline harnesses are test-only, not the production runtime.

Physical iOS/Android/Safari, worst-case stress and manual aesthetic acceptance remain unverified. Browser smoke results do not guarantee performance on every device or parity with another editor.
