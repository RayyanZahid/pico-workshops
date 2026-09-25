# Labs

Six hands-on labs, from "is my machine ready" to "spatialize your own site". Every lab is a small Vite + React + TypeScript project. You edit `start/`, and `solution/` holds the answer. Peek at the solution only after a real attempt.

## Install once

```bash
cd labs
npm install          # or, from the kit root: npm run labs:install
```

This folder is an **npm workspace**. One install serves every lab: about 40 packages, roughly 75 MB, in `labs/node_modules`. On event Wi-Fi, do it before you arrive.

## The labs

| Lab | You build | start → solution | ports (start / solution) |
|---|---|---|---|
| [p0-doctor](p0-doctor/) | Check your machine and pick a track | (no app) | |
| [p1-hello-spatial](p1-hello-spatial/) | One card that floats off the page | plain React → WebSpatial | 5301 / 5311 |
| [p2-spatialize-site](p2-spatialize-site/) | **Headline lab.** A landing page, made spatial one small diff at a time | flat site → glass, depth, 2nd window | 5302 / 5312 |
| [p3-volume-model](p3-volume-model/) | A 3D volume showing a GLB you can turn and scale | window + poster → volume + `<Model>` | 5303 / 5313 |
| [p4-space-invaders](p4-space-invaders/) | Depth as gameplay: rows in terraces, an approaching formation, shots in Z, plus HUD and hall-of-fame windows | flat game → 11 spatial layers + 2 windows | 5304 / 5314 |
| [p5-capstone](p5-capstone/) | Spatialize **your** site: checklist, rubric, prompts | `template/` → `solution/` | 5305 / 5315 |

## Every lab has the same scripts

```bash
npm run dev        # desktop browser, http://localhost:<port>/  (flat fallback: that is expected)
npm run dev:xr     # same app bound to 0.0.0.0, for the emulator
npm run build      # typecheck + production build
npm run build:xr   # the same build (SDK 2 ships one bundle; see VERSIONS.md)
```

## Seeing depth in the PICO OS 6 emulator

```bash
npm run dev:xr                     # in the lab folder
node setup/launch.mjs <n>          # from the kit root; add --solution for the answer
```

`launch.mjs` runs `adb reverse tcp:<port> tcp:<port>` and opens `http://localhost:<port>/` in the emulator's PICO Browser. You can do the same by hand. Then click the small monitor icon just left of the star in the address bar. On OS 6.0.0 it is titled **Install app**; PICO's docs call it **Open as standalone app**. Then click **Install**, and wait up to 60 s for the `enable-xr` panels to appear (a cold launch is slow; if they are still missing, force-close and reopen the app once). The app opens in its own window; relaunch it later from its launcher tile. A browser tab is never spatial: only the installed web app's user agent carries `WebSpatial/`. The runtime badge in the bottom-right corner reads "Web app · WebSpatial on" once you're in the right place. Code edits hot-reload into the installed app, but after a **manifest** edit you must `adb uninstall <package>` (`adb shell pm list packages webapp` finds it) and install again.

Two facts decide whether you see depth (both measured 2026-09-24; see [SPATIAL-CRACK.md](SPATIAL-CRACK.md)):

- **A browser tab is never spatial.** Only the installed web app's user agent carries `WebSpatial/`, and that is what the SDK checks.
- **Use `localhost` via `adb reverse`, not `10.0.2.2`.** `http://10.0.2.2:<port>/` loads only as a flat tab: the emulator doesn't treat it as a secure context, so it can't become a web app, despite PICO's docs.

Three rules the emulator taught us (2026-09-24), all built into the solutions:

- **Register scenes in `<SpatialBoot onReady={registerScenes}>`.** `initScene` before boot does nothing, and the new scene opens as a default flat window.
- **Never put an `enable-xr` element inside another `enable-xr` element.** The nested one got an empty 0 x 0 document and never rendered.
- **A first cold launch can leave the glass empty.** The runtime answered slower than the SDK's 30 s timeout. A reload fixes it, and every solution now reloads itself once when that happens (`src/spatialRetry.ts`). If panels are still missing after 60 s, close and reopen the app.

Two more things about the emulator:

- **Installed web apps opened at 1280 × 720**, whatever `xr_main_scene.default_size` asked for, and second windows opened at main-window size. Design each lab page to fit 1280 × 720 without scrolling.
- **Close other web apps before you launch one.** At the emulator's 4 GB RAM setting, Android's low-memory killer stopped the p4 app 12 s after launch while other web apps were still resident.

Every lab page shows a **runtime badge** in the bottom-right corner: "Browser tab · flat" or "Web app · WebSpatial on". It uses PICO's own `display-mode` check. If nothing floats, look at the badge first.

## What "WebSpatial-ready" means in these labs

Four things, and every solution has all four:

1. **SDK 2.0.0**: `@webspatial/react-sdk` + `@webspatial/core-sdk`. **No `@webspatial/vite-plugin`**, because it breaks 2.0 builds ([VERSIONS.md](VERSIONS.md)).
2. **JSX through the SDK**: `jsxImportSource: '@webspatial/react-sdk'` in both `tsconfig.json` and `react({...})` in `vite.config.ts`.
3. **`<SpatialBoot>`** around the app in `main.tsx`. Without it, `enable-xr` does nothing, even in the headset.
4. **A web app manifest**, which every lab (start and solution) ships: `public/app.webmanifest` linked from `index.html`. It has the four fields PICO requires (`name`/`short_name`, `icons`, `start_url`, `display: "minimal-ui"`), plus `scope: "/"`, relative icon paths (including a 1024 px maskable one) and `xr_main_scene` for the first window's size. Vite serves it as `application/manifest+json` in both dev and preview (checked).

## Theme

Every lab imports the shared PICO theme with `import '@pico/theme/pico.css'`. `@pico/theme` is a Vite alias for the kit's `theme/` folder, set in each lab's `vite.config.ts`, and `server.fs.allow` lets the dev server read it. No lab hardcodes a brand colour. 3D materials, which need resolved colours, read the tokens at runtime with `getComputedStyle`.

## Verified

2026-09-24, Windows 11, Node 22.17, headless Chrome through Playwright (`channel: 'chrome'`):

| Lab | build | build:xr | dev, 0 console errors | Interaction test |
|---|---|---|---|---|
| p1 start / solution | pass / pass | pass / pass | pass / pass | |
| p2 start / solution | pass / pass | pass / pass | pass / pass (main + `?scene=schedule`) | |
| p3 start / solution | pass / pass | pass / pass | pass / pass (launcher + `?scene=viewer`) | |
| p4 start / solution | pass / pass | pass / pass | pass / pass (+ `?scene=hud`, `?scene=halloffame`) | start 5/5, solution 13/13 (see its README) |
| p5 template / solution | pass / pass | pass / pass | pass / pass (main, stall, lanterns) | |

**Emulator (PICO OS 6.0.0, installed web app):** p1, p2, p3 (the volume), p4 (mid-game) and p5 are verified with screenshots; see [EMULATOR-RESULTS.md](EMULATOR-RESULTS.md).

Screenshots of the **desktop** fallback: [`_shots/`](_shots/).

## Maintainers

- `_shared/scaffold.mjs` writes each project's boilerplate: package.json, tsconfig, vite config, index.html and icons are skipped if present (`--force` overwrites); `src/RuntimeBadge.tsx` and its CSS are always refreshed from `_shared/src/`. App code is never touched.
- `_shared/strip-spatial.mjs <lab>` regenerates a lab's flat `start/src` from `solution/src` by deleting everything marked `SPATIAL`. p4 is built this way; keep its markers intact.
- `_shared/make-icons.py` regenerates the PWA icons (Pillow). The output is shipped with the kit.
