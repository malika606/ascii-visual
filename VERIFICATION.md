# ASCII Visual v3.0.0 — release candidate verification

## Confirmed evidence before this PR (2026-11-28)

- PR #16: full CI passed (run 46114810907); deployment passed (46114847229).
- PR #17: 42/42 unit tests passed; browser checks through output levels and PNG parity passed, then the test attempted to click Fine while the Effects tab was active (46114954821).
- PR #18: 44/44 unit tests passed; browser checks through crop, zoom, PNG/GIF, all 25 styles, dithering, geometry and post-processing passed, then the same tab-navigation test failure occurred (46115156531).
- This PR corrects the failing tab navigation, extends transformed native-video checks, caches static spatial analysis, and adds a fixed multi-source quality audit. Full CI and visual review are pending. Do not treat earlier successful deployment as verification of the entire v3 suite.

## Acceptance gate

Require successful typecheck, unit tests, production build, Chromium editor and hero tests, screenshot capture, and the six-fixture rendering audit. Inspect `quality/comparison-sheet.png` and `quality/metrics.json` in the GitHub Actions artifact; the numerical checks are not an aesthetic rating. Physical iOS/Android, Safari codec compatibility, sustained high-resolution animation performance and direct ASCII Magic A/B remain unverified. No claim of feature or visual parity with ASCII Magic.

---

## Historical verification record (v1.3.1)

# ASCII Visual v1.3.1 — final technical verification

## Repository delivery (2026-11-28)

- Public repository: https://github.com/malika606/ascii-visual
- The repository content is derived only from `ascii-visual-v1.3.1-verified.zip`; the final commit hash is reported after the push.

## Final verification scope (2026-11-28)

The only project source was `ascii-visual-v1.3.1-verified.zip` (SHA-256 `63746D30EF00451CC5FC897416771DAD32ED6DEB031661740579E4C7BB354F19`). The archive included the genuine `package-lock.json`. This pass used the declared React 18.3.1/Vite 6.4.1 application through a real Vite HTTP server, not the historical offline harness. No product source, design, renderer, decoder, encoder, or architecture changes were required. The intentional final-pass edits are this verification record and Python cache exclusions in `.gitignore`.

Environment: Windows, Node 22.14.0, npm 10.9.2, Python 3.12.0, Google Chrome/Chromium 158.0.8127.88, Playwright 1.65.2, Pillow 13.0.0, and a real static FFprobe binary. Python/browser helpers were installed only in the system temporary directory and are not project dependencies or repository files.

## Actual commands and results

| Command | Actual result |
|---|---|
| `npm ci` | Exit 0; 70 packages installed, 71 audited. npm reported one high-severity dependency vulnerability. No forced dependency update was applied. |
| `npm run typecheck` | Exit 0; `tsc --noEmit` passed. |
| `npm test` | Exit 0; 14 tests passed, 0 failed/skipped/cancelled. |
| `npm run build` | Exit 0; Vite 6.4.1 transformed 44 modules and produced `dist/`. |
| `node_modules/.bin/vite.cmd --host 127.0.0.1` | Real Vite dev server started at `http://127.0.0.1:5173/`. |
| `python tests/ui_smoke.py` with the Vite URL, installed Chrome, Pillow and FFprobe | Exit 0; full editor smoke passed. |
| `PYTHONIOENCODING=utf-8 python tests/hero_smoke.py` with the Vite URL and installed Chrome | Exit 0; full intro/lifecycle smoke passed. |

The first attempted Vite invocation lost `--host` in PowerShell and served a 404 at the test URL; the server was restarted by calling the Vite binary directly. The first hero run timed out once while waiting for a dynamically emulated reduced-motion change. A repeat passed that step and then hit only Windows console `cp1251` output encoding on the `×` character. The final UTF-8 run passed every scenario. These environment/test-run issues did not reproduce as application defects, so no product code was changed.

## Browser evidence

`tests/ui_smoke.py` passed the home-to-editor transition, demo readiness, canvas and controls, four distinct character ramps, setting changes, PNG and GIF downloads, WebM/VP9 and MP4/H.264 downloads validated by FFprobe, GIF/video upload and seeking, upload errors beside Upload, retention of the previous file/frame/settings/time, a successful replacement upload, mobile 390/320 layouts, reduced motion, export progress/cancellation, and fallback when native video recording is unavailable.

`tests/hero_smoke.py` passed the playing local hero video, loop fade, simulated visibility pause/resume, editor transition and hero resource release, preservation of file/settings/exact GIF frame/time/paused state on a round trip, retained MP4 time, dynamic reduced motion, 390×844 and 320×568 layouts without horizontal overflow, and poster fallbacks for reduced motion, data saver, and video error.

```text
PASS four distinct character ramps, style adjusted marker, primary controls
PASS UI download WEBM vp9
PASS UI download MP4 h264
PASS unsupported, oversized and corrupt uploads: one visible alert near Upload at desktop/390/320, retained source/frame/settings/time, successful next upload
PASS export progress and cancellation
PASS fallback when native video recording unavailable (simulated)
PASS Vite UI: full UI demo, source upload, scrub/pause/restart, settings, dimensions, PNG/video/GIF downloads, validation, mobile layout, reduced motion
Chromium 158.0.8127.88 Vite
PASS desktop, one CTA, playing local video
PASS actual loop wraps with black fade
PASS visibility-event pause/resume (simulated)
PASS editor opens and hero video released
PASS file, settings, exact GIF frame/time and paused state survive round trip
PASS MP4 returns paused at retained playback time
PASS dynamic reduced motion
PASS mobile 390×844 and 320×568, CTA fits viewport, no horizontal overflow, full media fit
PASS poster fallback: reduce
PASS poster fallback: data
PASS poster fallback: error
```

## Remaining limitations

- npm reports one high-severity vulnerability in the installed dependency tree; `npm audit fix --force` was deliberately not run because it can introduce breaking version changes without a reproduced product failure.
- Physical Safari/iOS/Android testing, real OS tab switching/data-saver hardware behavior, and worst-case performance/stress testing remain outside this Windows Chrome run.
- The Vite application was verified locally only. No site deployment or publication was performed.

---

Historical verification retained below; results from earlier releases are not new v1.3.1 results.

# ASCII Visual v1.3.0 — editor redesign verification

## Scope and changes

Incremental from `ascii-visual-v1.2.0.zip`. Editor UI only: pink upload, two-column desktop and stacked mobile, explicit demo marker, four preset styles with adjusted marker, four character ramps and preset-original ramps, advanced disclosure, format/resolution selection and one Download, capability filtering, actual dimensions/duration, export progress and cancellation. Native encoder failure fallback only changes UI selection. No changes to hero source, assets, Site or engine/media/export modules. No new npm dependencies, GitHub writes or Codex.

## Current environment and executed commands

Node 22.16.0; npm 10.9.2; global TypeScript 5.8.3; Chromium 144.0.7559.96; Python Playwright, Pillow, FFprobe. Actual React components were executed using local JupyterLab React/ReactDOM 18.2.0 in a test-only transpiled bundle with inline CSS and Blob media. Not a Vite build, not the pinned 18.3.1 React, not an HTTP/code-splitting verification. The extracted runtime/bundle is not part of the archive.

| Command | Actual result |
|---|---|
| `npm install --fetch-retries=0 --fetch-timeout=12000` | Exit 1; EAI_AGAIN registry.npmjs.org/@types%2freact. No lockfile. |
| `npm test` | Exit 0; 14 passed, 0 failed. |
| `tsc -p tsconfig.core.json` | Exit 0. |
| `npm run typecheck` | Exit 2; React/Vite packages and type declarations unavailable. |
| `npm run build` | Exit 2; stopped at typecheck. |
| `TYPESCRIPT_PATH=$(npm root -g)/typescript REACT_CHUNKS_DIR=/opt/pyvenv/share/jupyter/lab/static node scripts/offline-ui-bundle.cjs /tmp/ascii-ui13.js` | Exit 0; local test bundle. |
| `ASCII_UI_OFFLINE_BUNDLE=/tmp/ascii-ui13.js CHROMIUM_PATH=/usr/bin/chromium python tests/ui_smoke.py` | Exit 0; actual UI including 4 formats. |
| `ASCII_UI_OFFLINE_BUNDLE=/tmp/ascii-ui13.js CHROMIUM_PATH=/usr/bin/chromium python tests/hero_smoke.py` | Exit 0; all 11 hero/round-trip scenarios. |
| Separate engine browser harnesses | Not rerun in this release; 11 unchanged engine/media/export files verified against previous archive. |

### Current editor test output

```text
PASS four distinct character ramps, style adjusted marker, primary controls
PASS UI download WEBM vp9
PASS UI download MP4 h264
PASS export progress and cancellation
PASS fallback when native video recording unavailable (simulated)
PASS offline React runtime: full UI demo, source upload, scrub/pause/restart, settings, dimensions, PNG/video/GIF downloads, validation, mobile layout, reduced motion
```

The PNG was independently opened with Pillow and verified at 720 × 617; GIF opened with 20 frames; FFprobe confirmed actual single video stream and container for WebM/VP9 and MP4/H.264. The ramp check compares four actual canvas data URLs under paused/reduced-motion conditions. Native recording unavailability was simulated by removing MediaRecorder before opening the editor; only PNG/GIF remained. The tests also exercise conditional background controls, source validation, GIF/MP4/WebM seek and restart, desktop/mobile order at 390 and 320 px, reduced motion, and export cancellation. The initial test stopped on an ambiguous Format accessible name; explicit names were added and the rerun passed.

### Current intro regression output

```text
Chromium 144.0.7559.96 offline React
PASS desktop, one CTA, playing local video
PASS actual loop wraps with black fade
PASS visibility-event pause/resume (simulated)
PASS editor opens and hero video released
PASS file, settings, exact GIF frame/time and paused state survive round trip
PASS MP4 returns paused at retained playback time
PASS dynamic reduced motion
PASS mobile 390×844 and 320×568, CTA fits viewport, no horizontal overflow, full media fit
PASS poster fallback: reduce
PASS poster fallback: data
PASS poster fallback: error
```

Screenshots captured from the actual offline React runtime: desktop 1440 × 900 viewport, full page 1440 × 1009; mobile 390 × 844 viewport, full page 390 × 1604; advanced settings open on mobile. These are not design mockups. Desktop and mobile may scroll vertically; horizontal overflow assertions passed.

## Remaining acceptance tasks

- Install dependencies on a network-enabled machine, retain generated package-lock.json, run full typecheck and production build, and rerun default Vite UI tests. No fabricated lockfile.
- Verify actual lazy HTTP requests and deployed static asset paths. Test Safari/iOS/Android, actual OS reduced motion and tab/data saver behavior, codec failures on real devices and worst-case resource usage.
- Native codec capability checks are advisory. Simulated missing MediaRecorder passed; specific real device encoder failure paths are not independently confirmed. A user may still choose PNG/GIF or another supported format. No silent format conversion.
- Approve editor visuals and typography. No evidence of a defect requiring Codex.

---

# Historical verification (v1.2 and earlier; not rerun results)

# ASCII Visual v1.2.0 — intro integration verification

## Scope

Incremental from the supplied `ascii-visual-v1.1.0.zip`. Introduces a full-screen editorial intro and one tactile CTA. The editor's appearance and all 11 files in `src/engine`, `src/media`, and `src/export` are byte-identical to the previous archive. Editor component changes are limited to navigation, active/paused state, focus and accessible range names. No GitHub or Codex activity.

## Actual environment and results

Node 22.16.0, npm 10.9.2, global TypeScript 5.8.3, Chromium 144.0.7559.96, FFmpeg/FFprobe and Python Playwright/Pillow. The local JupyterLab production React/ReactDOM 18.2.0 runtime was used for a **test-only** bundle of the actual TypeScript/React source. JSX was transpiled with the classic React factory; local media bytes were delivered as Blob URLs and CSS loaded verbatim. Browser network navigation was blocked by ERR_BLOCKED_BY_ADMINISTRATOR. The test bundle is not a replacement for Vite or the declared React 18.3.1 dependencies; neither extracted React runtime nor test bundle is distributed.

| Command | Actual result |
|---|---|
| `npm install --fetch-retries=0 --fetch-timeout=10000` | Exit 1; DNS EAI_AGAIN registry.npmjs.org/@types%2freact. No lockfile. |
| `npm run typecheck` | Exit 2; unresolved React/Vite packages/types. Not certified. |
| `npm run build` | Exit 2; stopped at typecheck, Vite not reached. |
| `npm test` | Exit 0, 14/14 passed. |
| `tsc -p tsconfig.core.json` | Exit 0. |
| `tsc --noEmit --strict --skipLibCheck --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --allowImportingTsExtensions tests/browser-harness.ts` | Exit 0. |
| `python -m py_compile tests/{ui_runtime,hero_smoke,ui_smoke,browser_smoke,v11_browser}.py` | Exit 0. |
| `TYPESCRIPT_PATH=$(npm root -g)/typescript REACT_CHUNKS_DIR=/opt/pyvenv/lib/python3.13/site-packages/jupyterlab/static node scripts/offline-ui-bundle.cjs /tmp/ascii-ui12/bundle.js` | Exit 0. Test-only React 18.2 bundle. |
| `CHROMIUM_PATH=/usr/bin/chromium ASCII_UI_OFFLINE_BUNDLE=/tmp/ascii-ui12/bundle.js ASCII_SCREENSHOTS=/mnt/data/ascii-v12-screens python tests/hero_smoke.py` | Passed all 11 printed scenarios (see below). |
| `CHROMIUM_PATH=/usr/bin/chromium ASCII_UI_OFFLINE_BUNDLE=/tmp/ascii-ui12/bundle.js python tests/ui_smoke.py` | Passed; actual PNG, GIF, WebM/VP9, MP4/H.264 downloaded and checked. |
| Default Vite mode of both UI tests | Not run. |
| Separate engine browser scripts `browser_smoke.py` and `v11_browser.py` | Not rerun for v1.2; v1.1 logs below are historical. All 11 engine/media/export source files unchanged. |

## Current browser logs

Hero test:

```text
Chromium 144.0.7559.96 offline React
PASS desktop, one CTA, playing local video
PASS actual loop wraps with black fade
PASS visibility-event pause/resume (simulated)
PASS editor opens and hero video released
PASS file, settings, exact GIF frame/time and paused state survive round trip
PASS MP4 returns paused at retained playback time
PASS dynamic reduced motion
PASS mobile 390×844 and 320×568, CTA fits viewport, no horizontal overflow, full media fit
PASS poster fallback: reduce
PASS poster fallback: data
PASS poster fallback: error
```

Editor test:

```text
PASS UI download WEBM vp9
PASS UI download MP4 h264
PASS offline React runtime: full UI demo, source upload, scrub/pause/restart, settings, dimensions, PNG/video/GIF downloads, validation, mobile layout, reduced motion
```

The visibility test overrides `document.hidden` and dispatches a visibility event, rather than switching physical OS tabs. Data Saver is a simulated `navigator.connection` object, and video-error fallback is tested using invalid Blob bytes. Reduced motion uses Chromium's actual media-query emulation. Loop, video decode, Canvas, file upload, seeks and downloads use real browser APIs. Both UI suites assert no uncaught page errors. Native H.264 and VP9 were available in this Chromium; they were not skipped. Screenshots provided separately are actual Chromium captures of this test-only React runtime, not mockups or production Vite screenshots.

## Media and lifecycle

The supplied MP4 is byte-for-byte unchanged (SHA-256 `3b5b9c71394e53241737ee9cfaf3b448d525495ab65ef73197855a69b2785157`). FFprobe: H.264, 1280 × 768, 24 FPS, duration 20.208333 s, size 5,105,145 bytes, only video stream. Poster produced at 2.4 s using `ffmpeg -ss 2.4 -i src/assets/hero.mp4 -frames:v 1 -c:v libwebp -quality 86 src/assets/hero-poster.webp`. A 0.38 s eased fade to/from black covers the different end and start flowers. The native loop and opacity change were tested; subjective approval of the cut remains with the user.

Lazy import isolates initial editor loading in source code; actual network-level code-splitting and absence of unnecessary downloads need a successful Vite build and browser network trace. On returning to intro, editor state stays in memory; the hidden editor's RAF and playback stop. Return is disabled while a source operation or export is in progress. Reloading clears the state. No changes to the core format/rendering implementation.

## Final acceptance commands (normal environment)

```sh
npm install
npm run typecheck
npm test
npm run build
npm run dev
# separate terminal, Python Playwright/Pillow and ffmpeg/ffprobe installed
python tests/hero_smoke.py
python tests/ui_smoke.py
python tests/browser_smoke.py
python tests/v11_browser.py
```

Retain the generated package-lock.json. Verify actual network requests, built asset paths on subdirectory hosting, physical Safari/iOS/Android, real tab/background behavior and data-saver devices. No new backend or external assets. Do not infer that the local offline results certify a release build.

---

# Historical v1.1 verification (unchanged record)

# ASCII Visual v1.1.0 — delivery verification (2026-11-27)

## Scope and environment

Incremental update from the supplied `ascii-visual-v1.0.0.zip`; original React/TypeScript/Vite shell, Canvas renderer, GIF decoder, motion logic and file bounds retained. No GitHub repository, commit, PR or Codex work requested or performed. Original archive not overwritten.

Architect's independently reported v1.0.0 results: npm install, full typecheck, 9/9 tests and production build succeeded. Full UI smoke was not confirmed (no executable Chromium). This is historical evidence only, not a v1.1 build result.

Delivery environment: Node 22.16.0, npm 10.9.2, global TypeScript 5.8.3, Chromium 144.0.7559.96, Python Playwright/Pillow, FFmpeg/FFprobe. All inputs and samples are synthetic/original.

## Actual commands and results

| Command | Outcome |
|---|---|
| `npm install --fetch-retries=0 --fetch-timeout=8000` | FAILED: EAI_AGAIN on registry.npmjs.org/@types%2freact; no lockfile generated. |
| `npm run typecheck` | Exit 2, React / JSX modules and types unavailable (TS2307 etc.); not a full verified check. |
| `npm run build` | Exit 2 at the typecheck step; Vite not reached. |
| `npm test` | PASS: 14 tests, 14 passed, 0 failed. |
| `tsc -p tsconfig.core.json` | PASS, exit 0. |
| `tsc --noEmit --strict --skipLibCheck --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --allowImportingTsExtensions tests/browser-harness.ts` | PASS, exit 0. |
| `python -m py_compile tests/ui_smoke.py tests/v11_browser.py tests/browser_smoke.py` | PASS, exit 0 (syntax only). |
| `TYPESCRIPT_PATH=$(npm root -g)/typescript node scripts/offline-browser-bundle.cjs /tmp/ascii-v11-test.js` | PASS. |
| `CHROMIUM_PATH=/usr/bin/chromium ASCII_OFFLINE_BUNDLE=/tmp/ascii-v11-test.js python tests/browser_smoke.py` | PASS, v1.0 regression scenarios re-run after final engine changes. |
| `CHROMIUM_PATH=/usr/bin/chromium ASCII_OFFLINE_BUNDLE=/tmp/ascii-v11-test.js ASCII_SAMPLE_DIR=/mnt/data/ascii-v11-samples python tests/v11_browser.py` | PASS, final v1.1 engine scenarios, no page errors reported. |
| `python tests/ui_smoke.py` | NOT RUN: Vite app cannot be installed/built here. Updated script is supplied. |

Engine tests run actual browser Canvas, video seek, MediaRecorder and Blob code in the initial Chromium blank document with local transpiled modules and in-memory fixture bytes. They do not mount React, exercise its controls or verify the production bundle. This is intentionally not a substitute for the full UI test. No test doubles were used for decoder, canvas or encoder APIs.

## New checks

Unit tests retain original nine cases; five new cases cover background key masks, no-upscale resolution/even-size MP4, final GIF seek boundary, encoder palette/timing and container signature validation. First test attempt exposed unsupported TypeScript parameter-property syntax in Node strip-only mode; replaced with explicit properties and re-ran all 14 tests successfully. The first seek run had an intermittent stale video canvas hash after seeked; added cancellable frame settling, then verified the final engine using known-color video fixtures and rapid seek cancellation. First MP4 test showed H.264 rounded 64x43 down to 64x42; output dimensions are now explicitly even, down-rounded and displayed in the UI. No cropping or upscaling.

### Final v1.0 regression log

```text
Chromium 144.0.7559.96
PASS decode/render/PNG still.png (96, 64)
PASS decode/render/PNG still.jpg (96, 64)
PASS decode/render/PNG still.webp (96, 64)
PASS GIF real frame changes and wrap {'duration': 0.6, 'hashes': [4066283065, 1500081813, 650169045, 4066283065]}
PASS video decode, real frame changes, reset motion.webm {'duration': 2, 'hashes': [3135749419, 101201256, 3135749419]}
PASS video decode, real frame changes, reset motion.mp4 {'duration': 2, 'hashes': [2240421490, 3976143023, 2240421490]}
PASS animated silent export still.png -> webm vp9 120 frames 120 unique 185610 bytes
PASS animated silent export motion.gif -> webm vp9 48 frames 45 unique 8372 bytes
PASS animated silent export motion.webm -> webm vp9 48 frames 48 unique 156169 bytes
PASS animated silent export motion.mp4 -> webm vp9 48 frames 48 unique 157142 bytes
PASS cancel recording
```

### Final v1.1 browser log

```text
Chromium 144.0.7559.96
PASS seek/pause/end/restart motion.gif {'actual': [0, 0.15, 0.44999999999999996, 0.599, 0], 'hashes': [4066283065, 1500081813, 650169045, 650169045, 4066283065], 'pausedHash': 4066283065, 'duration': 0.6}
PASS seek/pause/end/restart motion.webm {'actual': [0, 0.5, 1.5, 1.999, 0], 'hashes': [3135749419, 1190595996, 1856802784, 4225957352, 3135749419], 'pausedHash': 3135749419, 'duration': 2}
PASS seek/pause/end/restart motion.mp4 {'actual': [0, 0.5, 1.5, 1.999, 0], 'hashes': [2240421490, 3795923463, 286850336, 169931395, 2240421490], 'pausedHash': 2240421490, 'duration': 2}
PASS known-color frame seek + cancelled stale seek seek-colors.webm {'positions': [0.4, 1.4, 2.4, 0.4, 2.4, 1.4], 'dominant': [0, 1, 2, 0, 2, 1], 'oldAborted': True, 'latest': 2.4}
PASS known-color frame seek + cancelled stale seek seek-colors.mp4 {'positions': [0.4, 1.4, 2.4, 0.4, 2.4, 1.4], 'dominant': [0, 1, 2, 0, 2, 1], 'oldAborted': True, 'latest': 2.4}
PASS background keys and lower resolution (240, 120) (120, 60)
PASS procedural bouquet PNG (720, 617)
Native formats [{'mime': 'video/webm;codecs=vp9', 'extension': 'webm'}, {'mime': 'video/mp4;codecs=avc1.42001f', 'extension': 'mp4'}]
PASS mp4 still.png ('mov,mp4,m4a,3gp,3g2,mj2', 'h264', 64, 42, 119, 92) 46183 bytes
PASS mp4 motion.gif ('mov,mp4,m4a,3gp,3g2,mj2', 'h264', 64, 48, 48, 11) 6562 bytes
PASS mp4 motion.webm ('mov,mp4,m4a,3gp,3g2,mj2', 'h264', 64, 48, 48, 40) 26852 bytes
PASS mp4 motion.mp4 ('mov,mp4,m4a,3gp,3g2,mj2', 'h264', 64, 48, 48, 46) 29784 bytes
PASS gifExport still.png ('gif', 'gif', 64, 43, 50, 50) 28900 bytes
PASS gifExport motion.gif ('gif', 'gif', 64, 48, 20, 3) 5267 bytes
PASS gifExport motion.webm ('gif', 'gif', 64, 48, 20, 20) 18959 bytes
PASS gifExport motion.mp4 ('gif', 'gif', 64, 48, 20, 20) 18864 bytes
PASS cancel GIF export
PASS original bouquet export webm ('matroska,webm', 'vp9', 720, 617, 120, 115) 1206893 bytes
PASS original bouquet export mp4 ('mov,mp4,m4a,3gp,3g2,mj2', 'h264', 720, 616, 120, 119) 653457 bytes
PASS original bouquet export gif ('gif', 'gif', 480, 411, 50, 48) 989795 bytes
```

Interpretation: GIF seek positions 0/.15/.45/final/0 produced expected first/second/third/final/first hashes. MP4 and WebM known-color fixtures have one second each of red, green, blue: canvas dominant channels 0,1,2,0,2,1 match exact expected content at requested times 0.4/1.4/2.4/0.4/2.4/1.4. Stale seek aborted; latest position 2.4 s. Background tests examined pixel regions (black keyed background, nonempty subject), and checked 240x120 → 120x60. MP4/GIF outputs from still PNG, GIF, MP4, WebM were decoded with FFmpeg; FFprobe confirmed actual container/codec/dimensions, video-only streams and decoded frames. GIFs independently opened via Pillow with expected frame count, 100 ms per-frame timing, looping and differing decoded pixels. Real-time recording frame counts and sizes can vary. Demo exports are real app engine outputs, not generated mockups.

## Changed files from v1.0.0

Modified:
- `package.json` — version only, no new npm dependencies.
- `src/App.tsx` — initial demo, scrubber, seek lifecycle, resolution, export selection, status.
- `src/components/SettingsPanel.tsx` — background mode/color/tolerance.
- `src/engine/settings.ts` — typed mask defaults in presets.
- `src/engine/pixels.ts` — pre-adjustment RGB/luminance keys, output dimensions.
- `src/engine/renderer.ts` — canonical glyph grid, output size, aspect fit.
- `src/media/gif.ts` — stable frame boundary lookup.
- `src/media/source.ts` — native media position, seek/abort/frame settling, GIF last-frame clamp.
- `src/export/record.ts` — native H.264 negotiation, even dimensions, header/format check; preserves WebM.
- `src/styles.css` — minimal timeline and additional-control spacing.
- `tests/unit.test.mjs`, `tests/browser-harness.ts`, `tests/ui_smoke.py` — additional tests and updated selectors.
- `README.md`, `VERIFICATION.md` — current behavior and verification.

Added:
- `src/media/demo.ts` — local original bouquet generator.
- `src/export/gif.ts` — GIF89a RGB332/LZW encoder and bounded frame-by-frame export.
- `tests/v11_browser.py` — new independent Chromium/FFmpeg/Pillow checks.
- `tests/fixtures/seek-colors.mp4`, `tests/fixtures/seek-colors.webm` — synthetic three-color time fixtures.

All other source/config/test files from v1.0.0 retained. No external runtime assets, extra packages, server, or final design changes.

## Remaining acceptance gates

1. In an environment with npm access: `npm install` to generate lockfile, `npm run typecheck`, `npm test`, `npm run build`. Commit/retain the lockfile in the user's approved repository workflow. Fix only actual failures. Do not attribute the v1.0 build to v1.1.
2. Start Vite and run `python tests/ui_smoke.py` with an executable Chromium. Verify actual scrubber events, pause/restart, settings, correct sizes and downloads. Engine tests do not establish React integration. Test real upload/replacement races and reduced motion in UI.
3. Confirm Safari/mobile browser compatibility, native H.264/WebM recorder runtime support (capability checks are advisory), and worst-case memory/FPS at dense grid, maximum input dimensions and GIF bounds. Native video container metadata may vary across browsers. GIF encoder runs on main thread with bounded work and yields between frames; large input GIF decode still synchronous. Color masking is not semantic object segmentation. No output alpha or audio.
4. Future design brief is separate. No confirmed need for Codex or a new repo; the remaining work is dependency installation, actual UI/build and device testing, not a rewrite.
