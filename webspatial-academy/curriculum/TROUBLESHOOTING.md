# Troubleshooting

Find your symptom, check the cause in order, apply the fix. **Source** says how we know: **DOCS** (webspatial.dev / PICO docs), **CLI** (`pico-cli --help` / source), **SOURCE** (read in the SDK package), **UNIT** (reproduced on this team's machines), **INFERRED** (reasoned, not reproduced).

## Start here: nothing is spatial

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| **Everything looks flat: still in a browser tab** (click path: the monitor icon, titled **Install app** on OS 6.0.0 (PICO's docs call it "Open as standalone app") → Install → wait up to 60 s; if panels are still missing, close and reopen the app once) | A browser tab never goes spatial: its UA (`PicoBrowser/5.0.0 …`) has no `WebSpatial/` token, and the SDK checks for exactly that | **Install it**: monitor icon left of the star → **Install**. Then **wait up to 60 s** after launch for `enable-xr` panels; if panels are still missing, close and reopen the app once. Next time open it from its launcher tile | VERIFIED 2026-09-24 ([`labs/SPATIAL-CRACK.md`](../labs/SPATIAL-CRACK.md)) |
| Installed, but still flat after a few seconds | Cold launch: the lifted elements can take about 50 s to appear | Wait up to 60 s before judging; then check the UA reads `PicoWebApp/0.4.0 … WebSpatial/1.5.0` (a tab reads `PicoBrowser/5.0.0`, no `WebSpatial/`) and `display-mode: standalone` matches | VERIFIED 2026-09-24 ([`labs/SPATIAL-CRACK.md`](../labs/SPATIAL-CRACK.md)) |
| **Panels still missing after 60 s**; console: `Uncaught (in promise) Error: createSpatialized2DElement failed` | Cold launch: the runtime answered slower than the SDK's 30 s request timeout, and the SDK doesn't retry | **Close and reopen the app once.** A reload of the same app creates every element. The lab solutions reload once automatically (`src/spatialRetry.ts`) | VERIFIED 2026-09-24 (p3, p4; `labs/EMULATOR-RESULTS.md`) |
| Some spatial elements render, others stay invisible (DevTools: their child documents are 0×0 with an empty body) | They're `enable-xr` **nested inside another `enable-xr`**; on PICO OS 6.0.0 nested spatial elements never rendered | Keep every spatial element top-level; compute absolute `--xr-back` values instead of relying on nesting | VERIFIED 2026-09-24 (p4 v1: 16 nested planes, all 0×0) |
| **No Install app icon in the address bar** | You opened `http://10.0.2.2:<port>/`. `10.0.2.2` loads but was not a secure context in our test (no install); use `localhost`. (VERIFIED 2026-09-24) |  `node setup/launch.mjs <n>` (it does `adb reverse tcp:<port> tcp:<port>` and opens **`http://localhost:<port>/`**; by hand: `adb shell am start -a android.intent.action.VIEW -d http://localhost:<port>/`) | VERIFIED 2026-09-24 |
| Install fails: `DiscernWebApp: onGotManifestDataError ... manifest is empty` in logcat | Manifest icons the OS check rejects (seen with a single SVG icon at `sizes: "any"`) | Ship PNG icons with real `sizes` (192, 512, 1024 + a 1024 maskable) | VERIFIED symptom, INFERRED cause (`assets/emulator/WALKTHROUGH.md`) |
| Still no Install app icon on `localhost` | URL outside the manifest `scope`, or the manifest lacks `name`/`short_name`, `icons`, `start_url`, `display`, or isn't served as JSON | Fix the manifest; serve it as `application/manifest+json` | DOC (/document/web/manifest/) |
| `http://localhost:<port>` in the emulator: connection refused | No `adb reverse` for that port (inside the guest, `localhost` is the guest) | Use `node setup/launch.mjs <n>` (it reverses and verifies), or `adb reverse tcp:<port> tcp:<port>` and check `adb reverse --list` | UNIT |
| Real PICO OS 6 device refuses the HTTP dev URL | HTTP Web Apps need the debug toggle on a device | `adb shell am broadcast -p com.picoxr.webappservice -a com.picoxr.webappservice.action.TOGGLE_DEBUG_MODE --ez enable true` (Developer Mode on) | DOC (/document/web/manifest/) |

## Setup and emulator

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| `The token '&&' is not a valid statement separator in this version` | Windows PowerShell 5.1 (the default terminal) doesn't support `&&` | Run the commands on separate lines, or use `node setup/launch.mjs <n> --serve`, which does the `cd` + dev server for you | VERIFIED (PowerShell 5.1) |
| `grep` is not recognized | PowerShell has no `grep` | Use the command's own filter, e.g. `adb -s emulator-5554 shell pm list packages picoxr.webapp` | VERIFIED (PowerShell 5.1) |
| `pico-cli: command not found` | Not installed, or the global npm bin isn't on PATH | Reinstall per the L0 lab; open a new terminal; `npm config get prefix` and add its bin to PATH | INFERRED |
| `pico-cli doctor` shows red items | Missing Android SDK 35, PICO plugin, emulator bundle or virtualization | `pico-cli doctor --format json` → fix each; `pico-cli doctor --fix` for supported ones; `pico-cli emulator doctor` for the emulator subset | CLI |
| PICO Spatial plugin won't install | Wrong Android Studio version | Use **Android Studio 2025.1.x** (2025.1.1 to 2025.1.4), not the latest | DOCS / UNIT |
| Emulator dies: `QEMU main loop exits abnormally with code 1` | Almost always **not enough free RAM**; the real message (`Insufficient RAM free for launching emulator`) goes to **stderr**, not the qemu log | Run `pico-cli emulator start` in a terminal and read its output; close browsers, IDEs and Android Studio (the guest wants ~6 GB free on top); or lower the guest to `hw.ramSize=4096` in `~/.pico/avd/PICO_6.0.avd/config.ini` (booted and ran several web apps, 2026-09-24) | UNIT |
| Laptop freezes while the emulator runs | 16 GB host out of commit memory | Close Android Studio (not needed after the AVD exists), close heavy tabs; use a 32 GB machine for a full day | UNIT |
| `emulator -list-avds` shows nothing | The PICO AVD lives in `~/.pico/avd`, not `~/.android/avd` | Use `pico-cli emulator list` / `pico-cli emulator start` instead of the raw binary | UNIT |
| Knowledge MCP tools stopped answering in Claude Code | `pico-cli setup` was run while sessions were open, and it killed their `pico-dev-knowledge` servers | `pico-cli knowledge doctor`; restart Claude Code (MCP servers only start with a session) | UNIT |

## Reaching the dev server

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| Emulator browser: "site can't be reached" | Dev server not running | From the kit root: `node setup/launch.mjs <n> --serve` (starts the lab's dev server on 5301 to 5305, or 5311 to 5315 with `--solution`, then opens it) | kit |
| Still unreachable | Wrong port in `adb reverse` vs the dev server, or the server is bound to IPv6 only | Match the port Vite printed; `adb reverse --list`; use `dev:xr` (binds `0.0.0.0`) | UNIT |
| `pico-cli web launch` prints `Opening URL in browser: http://10.0.2.2:…` | By design: it rewrites `localhost` to `10.0.2.2`, the flat non-secure case | Don't use it to open labs; use `node setup/launch.mjs <n>` (`adb reverse` + `localhost`). **Never** point it at a real headset (it also installs a browser APK first) | CLI (source read) + VERIFIED |
| `pico-cli web launch` slow the first time | It installs the PICO WebSpatial browser package on the target before opening | Run `pico-cli web setup` once beforehand; wait | CLI |
| Page works in the emulator browser but a real headset can't load it | `10.0.2.2` exists only inside emulators | Use the host's LAN/tailnet HTTPS URL on hardware | DOCS |

## WebSpatial not taking effect

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| Still no Install app icon after the checks at the top | Manifest not linked from this page, or `display` isn't `standalone`/`minimal-ui` | `<link rel="manifest" href="/app.webmanifest">` on every page; include a 1024×1024 maskable icon | DOCS |
| Changed `app.webmanifest` but the installed app ignores it | The installed Web App keeps the manifest it was installed with | `adb -s emulator-5554 shell pm list packages picoxr.webapp`, `adb uninstall <pkg>`, install again. Code changes hot-reload without this | VERIFIED 2026-09-24 |
| `node setup/launch.mjs` / `pico-cli web launch` fails with `INSTALL_FAILED_UID_CHANGED` | `pico-cli web launch` tries to install its own `PicoBrowser.apk` over the emulator's system browser and can't (`--url` and `--manifest-url` both) | Open the page by hand: `adb reverse tcp:<port> tcp:<port>` + `adb shell am start -a android.intent.action.VIEW -d http://localhost:<port>/`, or type the URL into the browser; then use the Install app icon | VERIFIED 2026-09-24 |
| `enable-xr` / `--xr-back` do nothing, even in standalone mode (check this first) | App isn't wrapped in `<SpatialBoot>`: in 2.0 the spatial code loads only inside it, so markers are inert with no error | Wrap the root in `<SpatialBoot onReady={…} onError={…}>`; confirm `onReady` fires via `chrome://inspect` | DOCS / SOURCE |
| **(SDK 1.x tool)** Build errors or inert markers after adding `@webspatial/vite-plugin` | The plugin (latest 1.0.1) is 1.x-only and breaks on SDK 2.0 | Remove it; use plain `@vitejs/plugin-react` | Academy team (labs) |
| `enable-xr` / `--xr-back` still do nothing with `<SpatialBoot>` in place | `jsxImportSource` not set, or set in the wrong tsconfig | Put `"jsxImportSource": "@webspatial/react-sdk"` next to `"jsx"` (usually `tsconfig.app.json`); restart Vite | DOCS |
| Same, on Vite 8, with tsconfig set correctly | Vite 8 compiles JSX with oxc and ignores `esbuild.jsxImportSource` / tsconfig for the runtime, so the build silently uses React's plain runtime | Also set `react({ jsxImportSource: '@webspatial/react-sdk' })` in `vite.config.ts` (the labs do both) | UNIT (SDK 1.x project; labs apply it on 2.0) |
| `--xr-back` ignored on one element | Missing `position: relative/absolute/fixed`, or no `enable-xr` | Add both | DOCS |
| Glass cards look solid | Your own `background` covers the material | Clear or lighten backgrounds in spatial mode; put `--xr-background-material: transparent` on `html` | DOCS |
| `--xr-background-material: thick` does nothing | Not a valid value | Use `translucent`, `transparent` or `none` | DOCS |
| CSS transition on a lifted element doesn't animate | Spatialized elements don't support CSS animations yet | Animate `--xr-back` / `transform` from JS | DOCS |
| Styles set with `querySelector(...).style` ignored | Spatial styles and events only work declaratively through React | Set them in JSX `style`, or through a ref | DOCS |
| App is blank in the emulator, fine on desktop | `<SpatialBoot>` hides children until boot succeeds, forever if it fails | Add `onError={e => console.error(e)}`; read it via `chrome://inspect`; put loading UI outside `<SpatialBoot>` | DOCS |
| Crash: `WebSpatialRuntimeError` from `useMetrics` | Called outside a WebSpatial runtime or before boot | Only render that component on the spatial path, inside `<SpatialBoot>` | DOCS |
| Styled-components break | Known SDK bug | Use CSS modules, plain CSS or Tailwind for now | DOCS |

## Animation and layer budget

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| Console error: `Unknown event handler property onSpatialTap` (desktop **and** inside the PICO runtime) | `onSpatialTap` on a `<button>` (or another element React doesn't treat as spatial); gating it with `useSpatialReady()` doesn't help | Use plain `onClick` on buttons: a pinch on a spatialized button arrives as a click. Keep spatial events (`onSpatialTap` and friends) for `<Model>`, `<Reality>` entities and `enable-xr` **divs**; never put them on a `<button>`. | VERIFIED 2026-09-24 (installed p4 app) |
| Game stutters once spatialized, smooth on desktop | Too many `enable-xr` elements (one per sprite), or depth written every frame even when unchanged | One spatial layer per row/container; pool shot layers; round `--xr-back` to one decimal and write only on change; confirm with `pico-cli perf` | DOCS (each marker is a spatialized element) + INFERRED |
| A lifted element (e.g. a ship at `--xr-back: 260`) vanishes below the window | A plane lifted far toward you, low in the window, projects below the window's bottom edge in the default view | Keep depths modest (the p4 lab uses ≤ 150) | VERIFIED 2026-09-24 (p4) |
| Rows invisible after wrapping them in a spatial formation | Nested `enable-xr` never rendered on PICO OS 6.0.0 | Rows top-level, each with absolute depth `formationZ(y) + row * 20 + flinch` | VERIFIED 2026-09-24 |
| Hit pop / depth change doesn't animate | CSS `transition` / `@keyframes` on a spatialized element | Drive it from the game loop via a ref | DOCS |

## Known issues

| Symptom | Status | Source |
|---|---|---|
| p5 "Lanterns in 3D": the volume opens but stays **empty**; logcat shows `ModelComponent already exists` | **Cause found (StrictMode ruled out by a production-build A/B):** `<Reality style={{height:'100%'}}>` on a page whose `#root` has no height resolves to 0 px (Chrome: `100%` → 0, `100vh` → 720). Fix: empty volume? give `<Reality>`/`<Model>` a real size (`100vw`/`100vh`, or give `html`/`body`/`#root` a height); a percentage of an auto-height parent is 0. Emulator re-test pending | labs-builder, 2026-09-24 |

## Scenes

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| A second window (HUD, details, schedule) comes up **blank** | The whole page (or many rows) is wrapped in `enable-xr` | In a second window, don't wrap the page in `enable-xr`; the window is already glass. Keep floating panels small and few (a large one intermittently fails to create on PICO OS 6.0.0). | VERIFIED 2026-09-24 (p2, p4 acceptance pass) |
| A second window opens at the main window's size, not my `defaultSize` | Observed OS placement on PICO OS 6.0.0: second windows open at main-window size in the main window's slot | Nothing to fix in the page; design the second window to work at either size | VERIFIED 2026-09-24 (observed, p2 520×640, p4 360×480) |
| A 2D panel inside a **volume** never appears; console: `createSpatialized2DElement failed` | An `enable-xr` 2D element inside a volume scene failed to create on PICO OS 6.0.0 | Make the panel plain (no `enable-xr`): inside a volume, keep 2D UI flat; put the depth in the 3D content | VERIFIED 2026-09-24 (p3 acceptance pass) |
| An open window misses a `BroadcastChannel` message sent right as a new window opens | Chrome drops a message posted in the **same task** as `window.open` of a brand-new window, for the other already-open windows | Post first, then `setTimeout(() => window.open(url, name), 100)`; let the new window pull state with `hello` | VERIFIED (desktop Chrome e2e, 2026-09-24; reproduced in `labs/p4-space-invaders` Step 6) |
| **Volume/window opens at the default size (e.g. flat 1280×720)** | `initScene` ran before `<SpatialBoot>` booted (module load / top of `main.tsx`); in SDK 2.0's lazy entry it's a silent no-op until then | `<SpatialBoot onReady={registerScenes}>`: `onReady` runs after boot, before children render | VERIFIED 2026-09-24 (emulator, p3) + SOURCE |
| New window has default size, not mine | `initScene` name ≠ `window.open` target, or called after opening | Same string in both; call `initScene` first | DOCS |
| `window.open` opens the browser, not a scene | URL outside the manifest scope, or an external site | Keep scene URLs under `start_url`'s scope | DOCS |
| Start window ignores my `initScene` | The start scene is created before JS runs | Configure it in the manifest `xr_main_scene` (snake_case keys) | DOCS |
| Changed `initScene` config but the open window didn't change | Config only applies the next time that scene is created | Close the scene and reopen it | DOCS |
| Satellite scene shows empty or stale state | Scenes are separate documents; it missed the last broadcast | Late-join handshake: satellite sends `hello`, owner replies with full state | UNIT (desktop) |

## 3D

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| `<Model>` shows nothing / a flat box | Missing `enable-xr` | Add `enable-xr` | DOCS |
| `<Model>` fires `onError` | Every `src`/`<source>` failed: bad path, unsupported type | Serve from `public/`; types `model/gltf-binary` or `model/vnd.usdz+zip`; check the network tab in DevTools | DOCS |
| Primitive is huge or invisible | Entity units are **metres**; `width={200}` is 200 m | Use `0.2` for 20 cm | DOCS |
| Rotation is wildly off | `rotation` is radians | `Math.PI / 2` for 90° | DOCS |
| `--xr-depth` does nothing | Only applies to `<Model>` / `<Reality>` | Move it to the container | DOCS |
| Scripted `adb shell input swipe` never triggers `onSpatialDrag` | adb injects a 2D touch on the flat display, which never ray-casts into 3D | Test gestures by hand in the emulator window and log each event | UNIT (native app), INFERRED for WebSpatial |

## Capture, logs, perf

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| `pico-cli capture screenshot` is half or all black | Framebuffer read mid-compose; worse right after launch and after long sessions | Wait ≥5 s after launch; take 3 shots and keep the cleanest; restart the emulator if every frame is black. **Don't** conclude the app is broken from one black frame | UNIT |
| Can't see `console.log` from the page | Logcat doesn't show page consoles reliably | `chrome://inspect` on the host (remote debugging over adb) | DOCS |
| `pico-cli perf` shows no app metrics | Wrong `--package` | `pico-cli app list` while the Web App is open; pass that package | CLI, INFERRED |

## Version drift

| Symptom | Likely cause | Fix | Source |
|---|---|---|---|
| `Cannot find module '@webspatial/react-sdk/web'` (or `/default`) | 1.x import paths; removed in 2.x | Import everything from `@webspatial/react-sdk` | DOCS / npm 2.0.0 |
| `SSRProvider` not exported | Replaced by `<SpatialBoot>` in 2.x | Wrap the root in `<SpatialBoot>` | DOCS |
| **(SDK 1.x only)** Tutorials, SDK 1.x projects or older emulator notes say PICO needs `XR_ENV=avp` + `@webspatial/vite-plugin` | 1.x dual-build setup. On **1.x** it's required for PICO too: without it the SDK aliases to a passthrough JSX runtime and `enable-xr` is inert, and the XR build serves under `/webspatial/avp/` | On **2.x** neither exists (no `XR_ENV` in the 2.0 dist; platform comes from the UA at runtime). On a 1.x project, keep it and open `http://10.0.2.2:<port>/webspatial/avp/` | SOURCE (1.x `@webspatial/shared` and 2.0 dist, read 2026-09-24) |
| **(SDK 1.x only)** `XR_ENV=avp vite` fails on Windows | POSIX env syntax | `cross-env XR_ENV=avp vite` (1.x projects only) | UNIT |
| Claude Code drops `<SpatialBoot>` or writes 1.x-style setup after `npx @webspatial/starter ai` | starter v0.1.0 (2026-04-15) installs `.webspatial/docs` that predate SDK 2.0 (no `<SpatialBoot>`), and its `CLAUDE.md` block says local `.webspatial/docs` always wins | Don't run it inside the labs. In your own project, add after its block: `SDK 2.0: wrap the app in <SpatialBoot>; labs/VERSIONS.md overrides .webspatial/docs` | VERIFIED 2026-09-24 |
| Claude Code writes 1.x code | Model training data predates 2.0 (published 2026-08-21) | Tell it "WebSpatial 2.x, use SpatialBoot" and point it at `labs/VERSIONS.md` / the 2.0 `.d.ts` files | INFERRED |
