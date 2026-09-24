# WebSpatial and PICO CLI: what HTML can and cannot do tonight

Two-minute read. Every line is tagged: **DOCS** = PICO or WebSpatial documentation says so,
**SOURCE** = we read it in the `pico-cli` 0.5.0 code or the file it downloads, **UNIT** = we
measured it on one of our headsets, **UNVERIFIED** = nobody has checked.

## The short answer

- **Tonight you build WebXR, not WebSpatial.** Plain HTML/CSS/JS + three.js, opened in the PICO
  browser on a PICO 4 Ultra, entering `immersive-vr` or `immersive-ar`. **UNIT** (IC4, IC5): WebXR
  with anchors, plane detection, hit test, hand tracking and layers works on our Ultras.
- **WebSpatial is the "HTML becomes native spatial windows" path, and it needs PICO OS 6.**
  **DOCS** (webspatial.dev, Getting Started): *"PICO OS 6 (for example, Project Swan devices): its
  OS-level Web App Runtime includes the WebSpatial Runtime"*, and *"PICO OS 6 does not need packaging."*
- **None of IC1 to IC8 runs OS 6.** **UNIT**: they are PICO 4 Ultra on OS 5.x (see
  `projects/claude-community-sf/events/spatial-computing/PLAN.md` §1).

## Can plain HTML/CSS/JS make a native spatial app?

Close, but not plain. **DOCS**: *"WebSpatial currently requires React. The open-source WebSpatial SDK
currently provides a React SDK."* You still write HTML tags and CSS, but they go through the
`@webspatial/react-sdk` JSX runtime, which adds `enable-xr`, the `--xr-*` CSS properties, and scenes
opened with `window.open(url, sceneName)`. A vanilla page with no React does not get those.

On an OS 6 device you open the URL in the PICO Browser and tap **"Run as a standalone app"** in the
address bar. **DOCS**. We have run this only on the laptop (desktop browser, 2D fallback) in
`projects/webspatial-colorblast/`, never on OS 6 hardware. That README lists what is unverified.

## What `pico-cli` 0.5.0 offers a web developer

| Command | What it does | Status |
|---|---|---|
| `pico-cli project create --template planar\|volumetric\|stage` | Scaffolds a **Kotlin/Gradle** Spatial SDK app, or Unity with `--sdk-type unity`. **There is no web template.** | SOURCE (`--help`) |
| `pico-cli web setup` | Downloads "PICO WebSpatial 6.0.0" to `%LOCALAPPDATA%\PICO\sdk\6.0\webspatial\`: one 336 MB `PicoBrowser.apk` (`com.picoxr.browser`, versionName 5.0.0, versionCode 2147483647, minSdk 30, arm64) | SOURCE, ran it 2026-09-24 |
| `pico-cli web launch --url <u>` | **Installs that browser APK on the target first**, then opens the URL with `am start` on `com.picoxr.browser` (the OS 6 package, absent on our Ultras) | SOURCE (`dist/index.js`) |
| `pico-cli web launch --manifest-url <u>` | Same install, then hands a PWA manifest (needs `name`, `start_url`, `icons`) to the browser's web-app router as an installed Web App | SOURCE |
| `pico-cli device / app / log / capture / perf` | USB tooling | UNIT: works on the Ultras over USB, not over Tailscale |

Three traps in `web launch`, read from its source and checked against our units:

1. **It sideloads a browser before it opens anything.** Do **not** point it at a lending headset
   (IC1 to IC8). The Ultras' browser has a different package name (trap 3), so it would likely
   install as a second browser rather than replace theirs, but that is **UNVERIFIED**. It is a
   fleet change either way, so it needs an owner's yes.
2. **It rewrites `localhost` and `127.0.0.1` to `10.0.2.2`**, the Android emulator's alias for the
   host. That is right for the PICO Emulator and wrong for a real headset. On a headset, use the
   HTTPS tailnet URL the kit gives you.

3. **It targets a browser package the Ultras do not have.** `com.picoxr.browser` exists on the OS 6
   emulator only. **UNIT** (probed 2026-08-01, `pico-dev/kb/gotchas/same-model-string-different-headset.md`): IC4 ships
   `com.pico.browser.overseas`, IC5 ships `com.pico.browser`.

To open a page on an Ultra without these traps, use `node scripts/open-on-headset.mjs <url>`, or the
implicit intent with **no package name**, which lets the headset pick its own browser
(UNIT: used on IC4 2026-07-31, `pico-dev/kb/gotchas/webxr-needs-secure-context-use-adb-reverse.md`):
`adb shell am start -a android.intent.action.VIEW -d '<https-url>'`

## What works where

| Capability | PICO 4 Ultra (IC1 to IC8, OS 5.x) | Project Swan / OS 6 (incl. PICO Emulator) |
|---|---|---|
| WebXR `immersive-vr` / `immersive-ar`, hit test, planes, anchors, hands | **UNIT** yes | DOCS: browser is present; WebXR on OS 6 UNVERIFIED by us |
| Persistent anchors (8 per origin per device) | **UNIT** yes | UNVERIFIED |
| Camera, mesh, depth, DOM overlay from a web page | **UNIT** refused | UNVERIFIED |
| WebSpatial windows, volumes, `enable-xr`, `--xr-*` CSS | No, per DOCS (OS 6 runtime only). A WebSpatial page should fall back to a flat page: UNVERIFIED on an Ultra | DOCS yes, via "Run as a standalone app" |
| `pico-cli project create` Kotlin apps | No (Spatial SDK targets Swan + emulator only, DOCS) | DOCS yes; emulator boot UNIT-verified 2026-08-08 |
| `pico-cli web launch` | Do not run on fleet units (see trap 1) | Intended target |

## If an OS 6 unit is in the room

> **Superseded for WebSpatial work (2026-09-24).** The PICO WebSpatial Academy builds on SDK
> **2.0.0 with no vite-plugin**, serves on `localhost` via `adb reverse` (not `10.0.2.2`), and
> installs the page as a Web App (address-bar monitor icon, "Install app"), all measured in the
> PICO OS 6 emulator. Follow `../../webspatial-academy/CLAUDE.md` and
> `../../webspatial-academy/labs/VERSIONS.md`. The notes below are the earlier headset-side view;
> the 1.7.0 pin applies only to copying the old `webspatial-colorblast` reference as-is.

Then WebSpatial is a live demo on that unit only: React + `@webspatial/react-sdk`, plain `vite dev`,
open the URL in the PICO Browser, "Run as a standalone app". Verify on the device before promising it.

**Pin the SDK (1.x reference only): `npm i @webspatial/react-sdk@1.7.0 @webspatial/core-sdk@1.7.0 @webspatial/vite-plugin@1.0.1`.**
A plain `npm i` now gets **2.0.0** (npm `latest`, published 2026-08-21), and 2.0 is a breaking release.
`webspatial-colorblast` was built on 1.7.0 and has only been smoke-tested on the laptop, so copy
it with its pins. **SOURCE** (npm registry, 2026-09-24): 2.0 exports `.`, `./eager`, `./spatial`,
`./jsx-runtime` and `./experimental`, with no `/web` or `/default`, and core-sdk adds `./install-polyfills`.
The release notes say (per the kit's setup agent, not re-read by me) that the default entry is now
lazy (spatial UI waits behind `<SpatialBoot>` / `bootSpatial()`), that client-only apps should
import `@webspatial/react-sdk/eager`, and that the IIFE bundle is gone. Nobody has built a 2.0 app
here. Node floor for vite 8.3: `^20.19.0 || >=22.12.0`.

Sources: webspatial.dev/docs/introduction/getting-started (fetched 2026-09-24);
`pico-cli` 0.5.0 `--help` and `@picoxr/pico-cli/dist/index.js`; `projects/pico-dev/kb/gotchas/the-emulator-is-a-different-device-generation.md`;
`projects/pico-dev/kb/recipes/booting-the-pico-os6-emulator.md`; `projects/webspatial-colorblast/README.md`.
