# Emulator results

Owner: emulator-lab (pico-dev). Run on 2026-09-24. A row without a screenshot or a logcat
line does not count as a pass.

Host: Alienware m16 R1 laptop (Ryzen 9 7845HX, 16 GB, RTX 4080 Laptop). AVD `PICO_6.0`
(`hw.ramSize=6144`, x86_64, PICO OS 6.0.0, browser `com.picoxr.browser` 5.0.0 / Chrome 138,
web-app runtime `WebSpatial/1.5.0`). pico-cli 0.5.0. Screenshots are in
`../assets/emulator/`; the steps are in `../assets/emulator/WALKTHROUGH.md`.

## Acceptance pass 2026-09-24

Driver: emulator-lab (sole driver), 16:14-16:50 PT. AVD `PICO_6.0` at `hw.ramSize=4096`, PICO OS 6.0.0,
web-app runtime `WebSpatial/1.5.0`, SDK 2.0.0 current sources. Every lab: `node setup/launch.mjs <n>
--solution --serve` → browser tab → Install app (CDP `beforeinstallprompt.prompt()` + tap Install) →
launch the installed app → wait 40-55 s → checkpoints. Console = every page target of the app's
`weblayer_devtools_remote_<pid>` socket (errors + warnings). Screenshots are `adb emu screenrecord
screenshot` frames in `../assets/emulator/`, each looked at.

**`setup/launch.mjs` (first live test): PASS on all five labs.** Output for lab 1, verbatim:
`[launch] com.picoxr.browser is installed: skipping web launch` → `adb -s emulator-5554 reverse tcp:5311
tcp:5311` → `am start -n com.picoxr.browser/com.google.android.apps.chrome.IntentDispatcher -a
android.intent.action.VIEW -d http://localhost:5311/` → `Starting: Intent {...}` plus the 4 printed next
steps (1.2 s). With `--serve` it started `npm run dev:xr` when the port was free (labs 2, 3, 5) and reused
a running server otherwise. `--url http://localhost:5501/` also worked.

| Lab | Checkpoint | Result | Evidence |
|---|---|---|---|
| p1 | Tab renders, badge "Browser tab · flat…" | PASS | `acc-p1-tab-flat.png`; 0 errors |
| p1 | Installed app, badge "Web app · WebSpatial on", UA `WebSpatial/1.5.0`, `is-spatial` | PASS | `acc-p1-app-card-lifted.png` |
| p1 | Card lifted as its own panel | PASS | same; 1 spatial-div doc |
| p1 | 0 console errors | FAIL (minor) | `404 /favicon.ico` requested by the spatial child document |
| p2 | Tab renders, flat badge, 0 errors | PASS | `acc-p2-tab-flat.png` |
| p2 | Nav / hero / 3 feature cards as glass panels | PASS, slow | `acc-p2-app-lifted.png`. Cold launch: empty glass at 40 s; after one relaunch empty at 15 and 30 s, complete at ~50 s. 11 `spatialdiv created`, 0 errors |
| p2 | "See the schedule" opens a second window | PARTIAL | Correct request (`?scene=schedule`, 520x640, type window), 2 windows in worktable, but it shows at main-window size in the main slot and the `enable-xr` slots stayed empty at 60 s (`acc-p2-schedule-window.png`) |
| p3 | Tab, flat badge, 0 errors | PASS | `acc-p3-tab-flat.png` |
| p3 | "Open in 3D" → 0.6 m volume with the avocado, status chip "ready" | PASS | `acc-p3-volume-avocado.png`; request `{"width":0.6,"height":0.6,"depth":0.6},"type":"volume"`; model fills the volume |
| p3 | Viewer bar (Orbit/Reset) visible, 0 errors | FAIL | `Uncaught Error: createSpatialized2DElement failed` in `?scene=viewer`; the bar never appears |
| p3 | Drag rotates / magnify scales | UNTESTABLE | adb cannot inject spatial gestures; "Orbit" toggle via CDP moved nothing in 3 s (`acc-p3-orbit-1/2.png`) |
| p4 | Tab, flat badge, 0 errors | PASS | `acc-p4-tab-flat.png` |
| p4 | Rows at stepped depths | PASS | `acc-p4-app-ready.png`; `--xr-back` rows 40/70/100/130/160, shields 210, ship 260 |
| p4 | Start; formation approaches as it descends | PASS | `acc-p4-app-midgame.png`; rows 40→44.5 … 160→164.5 |
| p4 | Move + fire with on-screen buttons | PASS (via CDP pointer events) | ◀ moved ship 353→338 px; Fire spawned a shot at `--xr-back: 248.2` |
| p4 | Move + fire with keys | PASS via CDP key events; UNTESTABLE via `adb input keyevent` | adb keys never reach the page (`document.hasFocus()` false) |
| p4 | Shots travel in depth | PASS | shot `--xr-back` 248 (ship 260 → rows) |
| p4 | A hit flinches the row / score rises | FAIL (unconfirmed) | ~40 shots under the formation, score stayed 0, no +36 flinch. May be the synthetic input path |
| p4 | HUD window opens, in sync | FAIL | Correct request (`?scene=hud`, 360x480), but the window is main-sized, empty glass at 40 s; the HUD document's text is only the badge |
| p4 | Pause from HUD; game over → HUD; hall of fame | UNTESTABLE | blocked by the HUD failure |
| p5 | Tab, flat badge, 0 errors | PASS | `acc-p5-tab-flat.png` |
| p5 | Main window: nav, hero, vendor cards | PASS | `acc-p5-app-main.png` (55 s), 0 errors across 13 targets |
| p5 | Stall opens a second window | PASS (size ignored) | `acc-p5-stall-window.png`, content at ~50 s; shown main-sized, not 420x360 |
| p5 | Lanterns volume | PASS after labs-builder's 16:18 fix | `acc-p5-lanterns-volume.png`: 5 lanterns render. Before the fix (`height:100%` on `<Reality>`) empty on dev AND prod builds (`acc-p5-lanterns-prod-build.png`), so not StrictMode |
| vite-min | `index.html` as app: 9 spatial-div cells | PASS | `acc-vitemin-index-app.png`; 9x `404 /favicon.ico`; no window material, so body text over the room is hard to read; `<Model>` not seen in frame |
| vite-min | `xr-monitor.html` | PASS | `acc-vitemin-xr-monitor-app.png`; 14 spatial hosts; 0 errors |
| vite-min | `eager-lean.html` (eager entry, no boot) | PASS | `acc-vitemin-eager-lean-app.png`; 20 spatial hosts; 0 errors |

**Re-test on current builds, 16:51-16:59** (after labs-builder's fixes: p4 depths/flat buttons/flat HUD,
p2 flat schedule rows, p3 plain viewer bar, favicon):

| Lab | Checkpoint | Result | Evidence |
|---|---|---|---|
| p4 | New depths live, 0 console errors (no `onSpatialTap` error) | PASS | rows 11.4/31.4/51.4/71.4/91.4, ship 120; 13 targets, 0 errors |
| p4 | Ship + ◀ Fire ▶ visible in the default view | FAIL | `acc-p4-v2-ready.png`: window is 1280x720 but the document is 863 px tall; Fire at y=767 and the ship sit below the window edge. Fix: taller `xr_main_scene.default_size` (reinstall) or a layout that fits 720 |
| p4 | Ship + buttons visible after the 17:0x layout fix (controls column right of a 560 px playfield) | PASS | `acc-p4-v3-fits-720.png` (= `acc-p4-v3-playing.png`), `acc-p4-v3-ready.png`: document 720 = window 720, Fire at y=105, ship drawn just under the playfield (depth 120 projects it slightly low but inside the view); 0 console errors |
| p4 | Fire while moving → hits register | PASS | score 0 → 20 → 40, invaders removed (`acc-p4-v2-midgame.png`); synthetic `KeyboardEvent`s on `window` via CDP |
| p4 | HUD window renders and stays in sync | PASS | `acc-p4-v2-hud-window.png`: "SPATIAL INVADERS · HUD 40 · LIVES ▲▲▲ · WAVE 1 · playing" |
| p4 | Pause from the HUD | PASS | HUD "Pause / resume" → HUD state reads "paused" (`acc-p4-v2-hud-paused.png`) |
| p4 | Game over → HUD; hall of fame | NOT REACHED (second sprint: NOT RUN, time) | Started a game with the HUD open and left it idle 2.5 min (17:06-17:09): lives stayed 3, no game over. Needs a deliberate lose path or a longer run |
| p2 | Schedule rows visible | PASS (17:03) | `acc-p2-v2-schedule-window.png`: six rows (09:30 Doors … Demo hour) on the window glass, 0 console errors. Earlier NOT RUN attempt: app killed by the guest's low-memory killer |
| p3 | Viewer bar visible, no `createSpatialized2DElement failed` | PASS in the volume (17:05); main launcher card FAILED on this launch | `acc-p3-v2-volume-bar.png`: bar under the avocado reads "ready · yaw 0° · scale 1.00× · Orbit: off · Reset", no error in `?scene=viewer`. The MAIN document logged `Uncaught Error: createSpatialized2DElement failed` for the launcher card (cold-start case) |
| all | Window scenes open at main-window size in the main slot, ignoring `defaultSize` | OBSERVED (OS placement) | p2 schedule 520x640, p4 HUD 360x480, p5 stall 420x360 all shown main-sized |
| all | Guest memory at `hw.ramSize=4096` | RISK | low-memory killer killed p4 (16:51:38) and p2 (16:57:14) web apps with other apps resident; close other web apps first, or use 6144 when the host allows |

**Vibe XR kit** (`PORT=5601 node serve/serve.mjs`, `adb reverse`, PICO Browser tab). The target is the
PICO 4 Ultra; these are notes on the OS 6 emulator, not failures.

| Page | Offered | `isSessionSupported` VR / AR | Entered? | Evidence |
|---|---|---|---|---|
| starter `/` | ENTER VR, START AR | true / true | not entered: a CDP click is rejected (`requires user activation`) and one adb tap missed | `acc-vibexr-starter-tab.png` |
| ar-placer | Enter AR | true / true | not tried | |
| beat-room | Enter VR, Start sound | true / true | not tried | `acc-vibexr-beat-room-tab.png` |
| gallery | Enter VR | true / true | not tried | `acc-vibexr-gallery-tab.png` |
| hand-garden | Enter VR | true / true | not tried | `acc-vibexr-hand-garden-tab.png` |
| portal | Enter AR | true / true | **session started** (`started immersive-ar`) after three permission prompts | `acc-vibexr-portal-enter-ar.png`, `acc-vibexr-portal-in-ar-session.png` |

**Real-input Enter pass, 17:14-17:21** (`PORT=5720 node serve/serve.mjs`, `adb reverse`, one fresh tab per page,
`adb shell input tap` on the button's centre computed from its page rect × (2880 / innerWidth) + 129 px toolbar,
then tap "Allow while visiting the site" on each permission prompt; session result read by wrapping
`navigator.xr.requestSession`):

| Page | Button tapped | Result | Evidence |
|---|---|---|---|
| starter `/` | ENTER VR | **session started** (`immersive-vr`) after the prompts | `acc-vibexr-starter-session.png`: emulator frame black except the gaze reticle |
| ar-placer | Enter AR | **FAIL in emulator**: `NotSupportedError: The specified session configuration is not supported.` (likely a required feature the emulator lacks; verify the requested features on the PICO 4 Ultra) | `acc-vibexr-ar-placer-session.png` |
| portal | Enter AR | **session started** (`immersive-ar`) | `acc-vibexr-portal-session.png`: black + reticle |
| beat-room | Enter VR | INCONCLUSIVE: tap landed, the page's hook was lost (reload/navigation), frame went mostly black | `acc-vibexr-beat-room-session.png` |
| gallery | Enter VR | INCONCLUSIVE: `navigator.xr` was undefined when the hook was installed (browser still restarting) | - |
| hand-garden | Enter VR | NOT RUN (time) | - |

In every started session the host capture shows black with only the reticle, so what the scene renders
inside an immersive session is not visible to `adb emu screenrecord screenshot`; UNVERIFIED whether the
emulator window shows it.

Emulator notes for Vibe XR: the first XR use on an origin raises up to three OS prompts, in order
"wants to use your virtual reality device and data", "wants to create a 3D map of your surroundings and
track camera position", "wants to track your hands" (Never allow / Allow while visiting the site). Inside
the AR session the emulator frame is black with only the reticle (no passthrough, no door within 6 s).

**Cross-cutting findings.** (1) Allow ~60 s, not 40 s, before judging lifted panels on a cold launch. (2)
Every window scene (p2 schedule, p4 HUD, p5 stall) opens at main-window size in the main slot; the
runtime appears to ignore `defaultSize` for `type: 'window'`. Volumes do honour their size. (3) Spatial
child documents request `/favicon.ico`; add one to each lab. (4) adb key events do not reach the web app.

## Host viability

| Check | Result |
|---|---|
| `pico-cli emulator doctor` | all `[ok]` (PICO_HOME, Android SDK 35, storage layout, virtualization, Spatial Plugin, emulator bundle) |
| RAM at 14:00 | 1.0 GB physical available, **2.0 GB commit free**: not bootable (guest needs 6,144 MB) |
| RAM at 14:08, after others closed apps | 4.3 GB physical, 9.7 GB commit free: booted |
| RAM while running | 0.3-1.5 GB physical available. `screencap` tearing got worse as memory tightened |
| Cold boot, `emulator start` to `sys.boot_completed=1` | **48 s** first boot, **63 s** second (emulator log: 27.6 s / 42.5 s) |
| AVD at `hw.ramSize=4096` (lead lowered it; backup `config.ini.bak-6144`) | VERIFIED: guest MemTotal 4.0 GB, cold boot 62 s (15:15), ran the browser + 5 installed web apps. Use 4096 on 16 GB laptops if 6144 refuses |
| Fallback host (Hil, <tailnet-ip>) | tailscale offline, last seen 6 days ago |

**Verdict: viable only after freeing about 6 GB.** With the normal workload (Chrome with 39
processes, WSL, Slack, 18 node processes) the emulator refuses to start. Once those were
closed it booted in about a minute and stayed usable for about an hour, with 0.3-1.5 GB left
for everything else. For attendees: 16 GB works if they close their browser and `wsl
--shutdown` first. 32 GB is comfortable.

## Build target

The labs use SDK 2.0.0 with no vite plugin and **no XR_ENV**: one bundle,
`jsxImportSource: "@webspatial/react-sdk"`, `<SpatialBoot>`, and runtime detection from the
UA. **VERIFIED in the emulator:** the installed web app's UA contains `PicoWebApp/0.4.0 ...
WebSpatial/1.5.0`, core-sdk boots (`__webspatialsdk__` react/core 2.0.0, `<html
class="is-spatial">`), and `enable-xr` elements become separate panels. In a browser tab the UA
has no `WebSpatial/`, so the same page stays flat. (`XR_ENV=avp` only applies to 1.x projects
built with `@webspatial/vite-plugin`; it is not used here.)

## The path that works (VERIFIED)

`adb reverse tcp:P tcp:P` → `am start` the PICO browser at `http://localhost:P/` → Install
(via "Open as Web App" / "Install app") → launch the installed web app. `pico-cli web launch`
fails on this image (`INSTALL_FAILED_UID_CHANGED`; `--manifest-url` gets `Permission Denial:
WebRouterActivity not exported`). `10.0.2.2` loads the page, but it is not a secure context,
so the page can never be installed.

## Lab results (solutions, installed as web apps)

Two passes. Pass 1 (14:30-15:08) ran the builds on disk then; the labs have changed since
(scene registration moved to `onReady`, manifests reworked). Pass 2 (15:15 on) ran the current
builds after a cold boot at 4096 MB. Captures prefixed 20-26 were taken by labs-builder on
the same emulator in pass 2; emulator-lab reviewed each frame before listing it here.

| Lab | Result (current build) | Evidence |
|---|---|---|
| p1 Hello Spatial (port 5321 in pass 2) | **PASS** | Tab: flat, badge "Browser tab · flat" (`01-lab1-browser-tab-flat.png`). Install dialog (`02-lab1-install-app-dialog.png`) → `com.picoxr.webapp.localhost.nmgogfki`. Web app: glass window, card as its own panel, badge "Web app · WebSpatial on" (`03-lab1-web-app-card-lifted.png`). Pass 1: UA `PicoWebApp/0.4.0 ... WebSpatial/1.5.0`, `__webspatialsdk__` 2.0.0, `html.is-spatial`, `spatialdiv created` in logcat |
| p2 Spatialize a site (5312) | **PASS** (current build) / FAIL (pass 1 build) | Tab: `04-lab2-browser-tab-flat.png`. Web app: nav, hero, stats and feature cards render as glass panels (`21-lab2-web-app-spatial.png`). Pass 1 build: 10 spatial-div documents created but zero `spatialdiv created`, window empty; labs-builder A/B-tested the manifest `resizability` and ruled it out (p2 passes with and without it). Likely cause: on a cold start the runtime answers `createSpatialized2DElement` after the SDK's 30 s timeout, so the panels stay 0x0 until a reload (reproduced by labs-builder on p3 and p4; INFERRED for the pass-1 p2 run, whose console was not captured) |
| p3 Volumes + models (5313) | **PASS** (current build) / FAIL (pass 1 build) | Launcher window: `10-lab3-volume-web-app.png`. "Open in 3D" now opens the avocado in its own spatial scene with the control bar (`24-lab3-volume-avocado.png`). Pass 1 build sent `type:"window"` 1280x720 because `initScene` ran before boot (fixed: `<SpatialBoot onReady={registerScenes}>`). UNVERIFIED: pinch-rotate / magnify / tap-reset (adb cannot inject spatial gestures) |
| p4 Space invaders (5314) | **PASS** (current build) / FAIL (pass 1 build) | Web app: five invader rows, shields and the control strip as separate panels, "Ready?" card over the playfield (`22-lab4-web-app-rows-stepped.png`); mid-game with score 20 and shots in flight (`23-lab4-web-app-midgame.png`). Angled view with rows at stepped depths: `25-lab4-angled-rows-in-depth.png`; HUD window live and synced: `26-lab4-hud-window-live.png`. UNVERIFIED: frame rate under per-frame `--xr-back` writes |
| p5 Capstone (5315) | **PASS** main + windows / **FAIL** lanterns volume (current build, 16:00) | Web app after 45 s: nav, hero and vendor cards as glass panels, cards overhanging the window edge (`27-lab5-web-app-night-market.png`); earlier build: a stall opened as a second window (`14-lab5-stall-scene-second-window.png`). "Lanterns in 3D" opens a real volume (`createSpatialScene ... {"defaultSize":{"width":0.6,"height":0.5,"depth":0.4},"type":"volume"}`), `supports('Reality')` is true and logcat shows `SpatialPack_SceneInspector ... add component ModelComponent`, but the volume stays empty glass, including after a reload of the scene document and 40 s+ (`28-lab5-lanterns-volume-empty-DIAGNOSTIC.png`, not for slides). No console errors. Only log anomaly: `E SpatialPack_SceneInspector: component ModelComponent already exists`. Handed to labs-builder |

Not run: the `start/` variants.

## Emulator facts learned today

- Tear-free capture: `adb emu screenrecord screenshot <dir>` came back 0.1% black where
  `pico-cli capture screenshot` came back 68% black on the same frame.
- `adb shell input tap` goes to the focused window in **that window's** coordinates (browser
  2880x1792). Taps past x=2160 are dropped, so the browser's `...` menu is out of reach.
- `beforeinstallprompt.prompt()` via CDP with `userGesture: true`, then a tap on Install at
  window (1904, 1070), installs a web app from a script. CDP sockets are
  `@weblayer_devtools_remote_<pid>` for the browser and for each web app.
- Two web apps, or the browser plus a web app, share one worktable slot. The last one drawn
  covers the other. Force-stop the browser before launching an installed app.
- Log noise on every working lab: `SpatialDiv metadata malformed, accepting for
  compatibility ... wsepoch=(missing)` (SDK 2.0.0 on runtime 1.5.0).
- Other drivers were active on the emulator during this run (`crack-*.png` in
  `assets/emulator/`, launches not made by emulator-lab, a mouse cursor in frame). The
  captures listed above were checked against the app in focus when each was taken.

## labs-builder fix loop (2026-09-24, 15:15-15:45, the "second driver" above)

What was changed, and what each change was proven against. All runs are installed web apps on
PICO OS 6.0.0, inspected through the app's `weblayer_devtools_remote_<pid>` socket (child
document sizes and contents), plus `adb emu screenrecord screenshot`.

| Finding | Evidence | Fix in the labs |
|---|---|---|
| `initScene` before `<SpatialBoot>` has booted is a silent no-op, so p3's viewer opened as a flat 1280x720 window | After the fix, logcat shows `createSpatialScene?...config={"defaultSize":{"width":0.6,"height":0.6,"depth":0.6},"type":"volume"}; isAllowed = true`, and the avocado fills the volume (`24-lab3-volume-avocado.png`) | `<SpatialBoot onReady={registerScenes}>` in p2/p3/p4/p5 |
| **`xr_main_scene.resizability` is NOT the p2 cause** | p2 without resizability: PASS (`20-...`). Uninstalled, **restored resizability**, reinstalled: PASS again (`21-...`, 5 child docs sized 1056x62, 670x377 and 3 x 341x244). Resizability stays in the p2/p4 manifests | none needed |
| **A spatial element nested inside another spatial element never rendered** (p4 v1: spatial playfield > spatial formation > spatial rows) | Top-level planes (playfield 720x640, 3 buttons) got sized, filled documents. All 16 nested ones stayed `innerWidth 0, innerHeight 0, body empty` after 45 s | p4 flattened: the playfield is a plain div, the rows are top-level, and each row's depth is the absolute sum formation + row + flinch. 14 planes |
| **A cold launch can time out spatial-element creation** | On some cold launches, every child doc stayed 0x0, and the main doc logged `Uncaught (in promise) Error: createSpatialized2DElement failed` (core-sdk 2.0.0 `SpatializedElementCreator.js`: `createNativeSpatialDiv` failed, 30 s `DEFAULT_SPATIAL_REQUEST_TIMEOUT_MS`). A reload of the same app, same code, created every element (p3: launcher card 420x594; p4: 5 rows 534x24, shields 718x40, ship 44x20, overlay 718x638). Seen on p3 and p4; not seen on p2 in 3 launches | `src/spatialRetry.ts` in every solution: on that rejection, reload once per session. README note: if the glass is still empty after 40 s, close and reopen the app |
| p4 in the web app | Rows march and step (front rows visibly larger), shields float in front, shots fly, hits score (`22-...`, `23-...`). `transform: translate()` does move `enable-xr` planes | n/a |
| The ship at `--xr-back: 260` projects below the window's bottom edge from the default view | `23-...`: the ship is drawn under the panel | noted in the p4 README as a tuning knob; unchanged |

Probable cause of emulator-lab's pass-1 p2 failure: the cold-start timeout above. Pass 1 p2
showed the same signature (child docs 0x0, no `spatialdiv created`), and the same p2 code
passed on later launches. Not proven: that run's console was not captured.
