# PICO WebSpatial Academy: instructions for Claude Code

You are working with a workshop attendee who is learning to **spatialize websites with
WebSpatial** and run them in the **PICO OS 6 emulator**. They range from "first time in a
terminal" (L0) to "wants the agent to drive the whole loop" (L5). Do the work, explain each
step in one or two plain sentences, and after every change tell them what to look at.

Tags used below: **VERIFIED** (run on this kit's build machine, dated), **SOURCE** (read in
pico-cli 0.5.0 or SDK code), **DOC** (PICO or WebSpatial docs say so), **UNVERIFIED**.

## First move in a new session

This kit lives in the `webspatial-academy/` folder of the public repo. The attendee's start is:

```bash
git clone https://github.com/RayyanZahid/pico-workshops.git
cd pico-workshops/webspatial-academy
npm run labs:install        # runs `cd labs && npm install`; never `npm install --prefix labs`
npm run doctor
```

Every path in this file is relative to `webspatial-academy/`. Never write an absolute path into
the kit. If `labs/node_modules` is missing, run `npm run labs:install` first.

Run `node setup/doctor.mjs --json` and read `verdict`, `track` and any `fail` checks. It is
read-only and takes about 10 s. The result decides which track you are on:

- **emulator track**: the PICO Emulator runs on this machine. Full loop below.
- **web-only track** (`track: "web-only"`): Intel Mac, Linux, under 15 GB RAM, Windows on ARM,
  or the emulator chain is not installed. Every lab still runs in a desktop browser as a flat
  page (WebSpatial falls back to 2D), and the attendee watches the emulator on the projector or
  pairs with someone. Do not try to "fix" their hardware.

If a check fails, show its `fix` line and ask before running it. Installs are the attendee's
call. Nothing in this kit installs anything without `--yes`.

## The labs

| Level | Lab | Start port | Solution port | Read first |
|---|---|---|---|---|
| L0 Setup | `setup/` (doctor) | | | `setup/SETUP.md`, `curriculum/L0.md` |
| L1 Hello Spatial | `labs/p1-hello-spatial/` | 5301 | 5311 | `curriculum/L1.md` |
| L2 Spatialize a website | `labs/p2-spatialize-site/` | 5302 | 5312 | `curriculum/L2.md` |
| L3 3D + volumes | `labs/p3-volume-model/` | 5303 | 5313 | `curriculum/L3.md` |
| L4 Depth as gameplay + multi-window | `labs/p4-space-invaders/` (Z-offset rows + a HUD window) | 5304 | 5314 | `curriculum/L4.md` |
| L5 Agentic expert + capstone | `labs/p5-capstone/` (`template/`, `solution/`) | 5305 | 5315 | `curriculum/L5.md` |

Ports come from each lab's `package.json`; if they disagree with this table, the package.json
wins. Resolve a lab by number (`labs/p<n>-*/`), never by a remembered folder name: the kit scripts
do exactly that, so a renamed lab keeps working. Each lab has `start/` (what the attendee edits) and `solution/` (the answer). **Edit
`start/`, never `solution/`**, and only open the solution when the attendee asks for it or is
stuck after a real attempt. If a lab has a `README.md`, it has the steps; otherwise
`curriculum/L<n>.md` does.

Install lab dependencies once, from the kit root: `npm run labs:install` (one npm workspace
serves every lab).

## The loop

1. **Serve the lab.** Easiest: `node setup/launch.mjs <n> --serve` starts the dev server (`npm run dev:xr`
   in the lab folder) and opens it. By hand, run `npm run dev:xr` in the background from inside
   `labs/p1-hello-spatial/start`. Don't chain commands with `&&`: Windows PowerShell 5.1 rejects it.
   `dev:xr` binds `0.0.0.0`; `dev` binds localhost only. Use `dev:xr` for the emulator: a Vite
   server bound only to IPv6 `::1` can be unreachable through the emulator's port mapping
   (INFERRED; `setup/launch.mjs` detects exactly this case and says so).
2. **Desktop check first.** Open `http://localhost:<port>/`, confirm zero console errors (use
   the `chrome-devtools` MCP from `.mcp.json`: `list_console_messages`, `take_screenshot`). A
   desktop browser shows the flat fallback; that is expected.
3. **Emulator.** `pico-cli emulator status`; if it is not running, `pico-cli emulator start`
   (waits for adb; first boot takes minutes). Then `node setup/launch.mjs <lab number>` (VERIFIED 2026-09-24: live run by emulator-lab on p1, 1.2 s, the printed next steps matched). It refuses
   any target that is not an emulator, then runs the recipe that works:

   ```bash
   adb -s emulator-5554 reverse tcp:<port> tcp:<port>
   adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d http://localhost:<port>/
   ```

   **Open `http://localhost:<port>/` through `adb reverse`, not `http://10.0.2.2:<port>/`.**
   Through `adb reverse`, localhost is a secure context, and Lab 1 installed as
   `com.picoxr.webapp.localhost.*` with depth (VERIFIED, emulator-lab + labs-builder, 2026-09-24).
   The mapping lasts until the emulator restarts. PICO's docs say to use 10.0.2.2
   (`assets/pico-docs/WEB-APP-RUNTIME.md` §3). **10.0.2.2 loads but was not a secure context in our
   test; use localhost** (VERIFIED 2026-09-24: the lifted p1 Web App,
   `com.picoxr.webapp.localhost.anoignjj`, was installed from localhost; nothing was ever installed
   from 10.0.2.2).
   `pico-cli web launch` runs only when the PICO browser (`com.picoxr.browser`) is missing, to install
   it. It rewrites localhost to the flat 10.0.2.2 URL, so the recipe still runs afterwards. If it fails
   with `INSTALL_FAILED_UID_CHANGED` (the browser is already installed under another uid, seen on this
   image 2026-09-24), launch.mjs carries on with adb. `--dry-run` prints every command without
   touching the device.
4. **Make it spatial: install it as a Web App.** A browser tab is **never** spatial
   (`labs/SPATIAL-CRACK.md`, VERIFIED 2026-09-24): only the installed app's user agent carries
   `WebSpatial/`, and the SDK checks for exactly that before it installs any spatial code.
   - In the address bar, click the **small monitor icon to the left of the star**. An **Install
     app** dialog appears. Click **Install**. (PICO's docs call this "Open as standalone app" and
     webspatial.dev says "Run as a standalone app"; on the OS 6.0.0 emulator it is this icon.)
   - The app opens in its own window with a glass background, as a real package
     `com.picoxr.webapp.localhost.*`. **Wait up to 60 s before judging; if the panels are still missing, close and reopen the app
     once.** On a cold launch the `enable-xr` panels took 10 to 40 s to appear (p2 took ~50 s in the
     acceptance pass), so a look at 5 s says "flat" wrongly.
   - **Check it from an agent:** the UA contains **`PicoWebApp/` and `WebSpatial/`** (a tab shows
     `PicoBrowser/` and no `WebSpatial/`), and lab p1's `<html>` has class `is-spatial`.
   - Relaunch later from the app's **own tile on the launcher**, not from the browser. After an
     emulator restart, re-run `node setup/launch.mjs <n>` so `adb reverse` exists again.
   - **Changed the manifest?** The installed app keeps the old one. Uninstall it
     (`adb -s emulator-5554 shell pm list packages picoxr.webapp`, then
     `adb -s emulator-5554 uninstall <pkg>`) and install again. Code changes hot-reload as usual.
   - Agent-driven taps: `adb shell input tap` coordinates are panel-local (the browser window is
     `[0,0][2880,1792]` in `dumpsys input`), not screenshot pixels. Attendees just click.
5. **Look.** `node setup/snap.mjs` saves a screenshot to `captures/` and prints the path. Open
   the PNG and look at it before claiming anything rendered. It tries `adb emu screenrecord
   screenshot` first (0.1% black), then on Windows a host-side PrintWindow of the emulator window
   (clean every time), then the old `pico-cli capture` burst, which was >30% black on almost every
   try on 2026-09-24. It keeps the first frame under 30% black and prints which method won.
6. **Logs.** `pico-cli log -d emulator-5554 -l E -n 100` for errors;
   `pico-cli log -d emulator-5554 -e "chromium|Console|WebSpatial" -n 100` for page console
   output (the tag the PICO browser uses for console messages is UNVERIFIED; widen the regex if
   it shows nothing).

Vite hot-reloads the page in the emulator too. If a change doesn't show, reload in the PICO
Browser or the installed app; if the app is stale, close it and relaunch it from its tile.

## Slash commands in this kit

`/doctor` checks the machine · `/lab <n>` opens lab n and starts its dev server · `/emulator`
starts the emulator or reports status · `/launch [n]` opens the lab in the emulator ·
`/snap` screenshots the emulator.

## WebSpatial rules (SDK 2.0.0, what the labs pin)

The labs use `@webspatial/react-sdk` and `@webspatial/core-sdk` **2.0.0** (published
2026-08-21). Exact pins: `labs/VERSIONS.md`; per-lab specifics: each lab's `README.md`. 2.0 broke
1.x, and most tutorials and videos were written for 1.x. When outside material disagrees with
the labs, the labs win.

**Never add `@webspatial/vite-plugin`.** Its 1.0.1 aliases the SDK to the `/web` entry, which 2.0
removed, so builds fail. There is one bundle and no `XR_ENV`: the runtime is detected from the user
agent at load time. `dev:xr` is only `vite --host 0.0.0.0`, and `build:xr` is the same build as
`build`. `node setup/doctor.mjs` fails if the installed SDK is not the pin or if the plugin appears
anywhere in `labs/`.

VERIFIED on the OS 6 emulator (emulator-lab, 2026-09-24): Lab 1 installed as a Web App reported UA
`WebSpatial/1.5.0` and `__webspatialsdk__` 2.0.0, and its `enable-xr` card was spatialized. The UA
number is presumably the OS runtime's version rather than the SDK's (INFERRED: it differs from the
SDK version).

1. **React is required.** WebSpatial's SDK is a React SDK (DOC). There is no plain-HTML path.
2. **JSX goes through the SDK, in two places.** `tsconfig.json`:
   `"jsxImportSource": "@webspatial/react-sdk"`, and `vite.config.ts`:
   `react({ jsxImportSource: '@webspatial/react-sdk' })`. Vite 8 transforms with oxc and ignores
   `esbuild.jsxImportSource`, so if only the old esbuild option is set, the build silently uses
   React's JSX runtime and every `enable-xr` goes inert with no error (VERIFIED on SDK 1.7.0,
   2026-07).
3. **Wrap the app in `<SpatialBoot>`** (from `@webspatial/react-sdk`). In 2.0 the default entry is
   lazy: spatial code loads only after boot, and without it `enable-xr` does nothing even on
   PICO (DOC, 2.0.0 release notes and Getting Started). `@webspatial/react-sdk/eager` exists for
   client-only apps; the `/web` and `/default` subpaths from 1.x are **gone**.
4. **A web app manifest is mandatory.** `index.html` has `<link rel="manifest" href="/app.webmanifest">`
   and the file lives in `public/`. Without it the browser offers no **Install app** icon. It needs
   `name` or `short_name`, `start_url` and `icons` (`pico-cli web launch --manifest-url` rejects a
   manifest missing any of them, SOURCE). Icons live in `public/icons/`.
5. **Spatialize an element with the `enable-xr` attribute**, then style it with `--xr-*` CSS
   custom properties: `--xr-back` (how far it lifts toward the viewer, in px) and
   `--xr-background-material` (e.g. a translucent glass back). Put them in CSS, not inline.
6. **Scenes: `initScene(name, config, { type })`, then `window.open(url, name)`.** WebSpatial adds
   no new "open a window" call; it polyfills `window.open` and matches the **second argument**
   against a name registered with `initScene`. A typo there opens an ordinary browser tab with no
   error. `type: 'window'` is a flat panel, `type: 'volume'` a 3D box. Volume sizes are metre
   strings (`'0.6m'`); plain numbers are px.
   **Register scenes inside `<SpatialBoot onReady={registerScenes}>`, THEN call `window.open`.**
   In 2.0, `initScene` silently does nothing until the spatial runtime has booted, so a scene
   registered at module load or in `main.tsx` before render is lost, and the volume or window opens
   as a default flat window. `onReady` runs right after boot and before `<SpatialBoot>` renders
   its children, so anything that later calls `window.open` sees the registration. (VERIFIED in
   react-sdk 2.0.0 source: `initScene` is `getSpatialImpl()?.getSession?.()?.initScene(...)`, so
   every step is optional-chained, and `SpatialBoot` calls `onReady` after `await bootSpatial()` and
   renders its children only when `status === "ready"`. The emulator confirmation is pending.)

   ```tsx
   <SpatialBoot onReady={registerScenes}>   {/* registerScenes() calls initScene(...) */}
     <App />                                {/* App's buttons call window.open(url, 'viewer') */}
   </SpatialBoot>
   ```
7. **Each scene is a separate document** with its own React tree and no shared state. Pass state
   over `BroadcastChannel`. Lab p4's HUD window shows the pattern: the game scene is authoritative,
   and the HUD only displays and asks for the current state when it opens.
8. **3D content**: `<Model src="/models/x.glb">` for a GLB, or `<Reality>` with entity primitives
   (`BoxEntity`, `SphereEntity`, ...). Entity units are metres and `position` is `{x, y, z}`, not
   a tuple. Gate 3D behind a runtime capability check and give desktop a 2D fallback.
9. **Detect the runtime the way the SDK does: the user agent.** core-sdk 2.0.0 installs its
   polyfills only when `navigator.userAgent` contains `WebSpatial/` (SOURCE); lab p1 adds an
   `is-spatial` class on `<html>` from the same test.

## Emulator and pico-cli rules

- **`pico-cli web launch` is for the emulator only.** It installs a 336 MB PICO WebSpatial
  browser APK on the target before opening anything, then rewrites `localhost`/`127.0.0.1` to
  `10.0.2.2` (SOURCE, pico-cli 0.5.0). Installing the browser is fine on the emulator, but the
  10.0.2.2 page it opens is flat (see the loop, step 3), so use it only to install the browser.
  Both steps are wrong for a headset.
  If a physical PICO headset is plugged in (a loaner, a PICO 4 Ultra), **never** point web
  launch or `app install` at it. `setup/launch.mjs` enforces this; do not bypass it with raw
  commands. PICO 4 Ultras run OS 5.x and have no WebSpatial runtime anyway (DOC).
- **`adb` may not be on PATH on Windows**, even after Android Studio installs it. `setup/launch.mjs`
  and `setup/snap.mjs` find it themselves. By hand, use the full path:
  `& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 ...` (PowerShell), i.e.
  `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. On macOS it is `~/Library/Android/sdk/platform-tools/adb`.
  In this file, read a bare `adb` as that path.
- **The install is `@picoxr/pico-cli`.** The unscoped npm package `pico-cli` is an unrelated
  CLI framework.
- **Ask before** `pico-cli emulator start --wipe-data`, `emulator delete`, `emulator delete-image`,
  `pico-cli doctor --fix` (it also `git pull`s PICO's plugin repo, SOURCE) and `pico-cli setup`
  (it kills running `pico-dev-knowledge` MCP servers in every Claude Code window on the machine,
  VERIFIED 2026-09-18; an MCP server only reconnects when a session restarts).
- **RAM.** The emulator guest defaults to 6 GB (`hw.ramSize=6144` in
  `~/.pico/avd/<avd>.avd/config.ini`). On a 16 GB machine: close browsers, `wsl --shutdown` on
  Windows, and set `hw.ramSize=4096` in that file (with the emulator stopped). A 16 GB laptop booted
  that way (VERIFIED boot, 2026-09-24; page rendering at 4096 is still being confirmed). "Insufficient
  RAM free" goes to stderr only, never to the emulator log, so if a start fails silently, run it in a
  foreground shell and read stderr.
- **Screenshots lie in one direction.** A single emulator screenshot is often 40-95% black while
  the app renders fine: the capture reads the framebuffer mid-write (VERIFIED 2026-09-18).
  `setup/snap.mjs` takes a burst and keeps the least-black frame. Never conclude "my page draws
  nothing" from one screenshot; check logcat too.
- **License.** The PICO Emulator and PICO WebSpatial browser are PICO-licensed; this workshop's
  attendees are cleared by PICO. Check with PICO before publishing OS screenshots outside the
  workshop. `captures/` stays git-ignored.
- **What an emulator run proves.** The emulator models PICO OS 6 (Project Swan). A clean run
  proves the code is right for OS 6. It says nothing about any other headset.

## Tools you have

| Need | Use |
|---|---|
| Is this machine ready? | `node setup/doctor.mjs [--json] [--web-only]` |
| Emulator lifecycle | `pico-cli emulator status / start / stop / list` (`--format json` on status/start) |
| Open a lab in the emulator | `node setup/launch.mjs <n> [--solution] [--serve] [--dry-run]` (adb reverse + localhost) |
| Screenshot | `node setup/snap.mjs [--name x] [--method emu\|window\|burst]` (emu screenshot, then window capture, then burst) |
| Video | `pico-cli capture record -d emulator-5554 -t 15 -o captures/clip.mp4` |
| Logs | `pico-cli log -d emulator-5554 [-l E] [-t <tag>] [-e <regex>] [-f]` |
| Performance | `pico-cli perf trace record ...`, then `perf trace analysis` (`pico-cli perf --help`) |
| PICO docs, offline | the `pico-dev-knowledge` MCP from PICO's Claude Code plugin, if installed. Its graph covers the native Spatial SDK far better than WebSpatial; for WebSpatial APIs read `labs/node_modules/@webspatial/react-sdk/dist/*.d.ts` |
| Desktop browser | `chrome-devtools` MCP (`.mcp.json`): console, network, screenshots of `localhost:<port>` |

**CDP into the emulator's browser and Web Apps works** (VERIFIED by spatial-crack, 2026-09-24:
`Runtime.evaluate` read the UA and `__webspatialsdk__`). With the browser or app open, run
`adb -s emulator-5554 shell "cat /proc/net/unix | grep devtools_remote"` to find the socket. It is
named `weblayer_devtools_remote_<pid>`. Each installed Web App is its own process with its own
socket, and the pid changes on every restart. Then `adb forward tcp:9231 localabstract:<that name>`
and `curl http://127.0.0.1:9231/json`. Pointing chrome-devtools-mcp at it with `--browserUrl` is
UNVERIFIED; raw CDP is the proven path.

## When a change goes wrong

- **Page works on desktop, nothing is spatial in the emulator**: read `labs/SPATIAL-CRACK.md` first;
  it has the measured root cause. Then check: did they install it as a Web App (monitor icon left of the star, then Install), waited up to 60 s, and if the panels were still missing, closed and reopened the app once? A tab is never spatial. Is the manifest
  linked and valid? Is the app inside `<SpatialBoot>`? Is `jsxImportSource` set in **both** places?
  Is there no `@webspatial/vite-plugin`?
- **`window.open` opens a normal tab**: the second argument does not match an `initScene` name, or
  `initScene` ran after the `window.open`.
- **Volume or second window opens, but flat, at the default size**: `initScene` ran before the
  runtime booted, and in SDK 2.0 that is a silent no-op. Move the registration into
  `<SpatialBoot onReady={registerScenes}>` (rule 6).
- **Emulator shows "can't reach this page"**: the dev server isn't running, or it's bound to IPv6
  only (use `dev:xr`), or the port differs from the one launched.
- **No Install app icon, page stays a flat tab**: it was opened
  at `http://10.0.2.2:<port>/` (loads, but was not a secure context in our test; use localhost), or `adb reverse` is missing
  (`adb -s emulator-5554 reverse --list`), or the manifest is missing or invalid. Re-run
  `node setup/launch.mjs <n>`.
- **`INSTALL_FAILED_UID_CHANGED` from `pico-cli web launch`**: expected on the OS 6.0.0 emulator. Its
  browser is a system app (`/system/priv-app/SpaceBrowser`, `android.uid.system`), and pico-cli's APK
  cannot update it, so both `--url` and `--manifest-url` die (SPATIAL-CRACK.md). `setup/launch.mjs`
  sees the browser is already there and never calls web launch.
- **Installed app opened, but it looks flat**: wait. On a cold launch the `enable-xr` panels took
  10 to 40 s to appear (SPATIAL-CRACK.md), and p2 took ~50 s. Wait up to 60 s; if the panels are still missing, close and reopen the app once. Judge at 60 s, not 5.
- **Changed `app.webmanifest` and nothing changed in the app**: the installed Web App keeps the
  manifest it was installed with. Uninstall and reinstall: `adb -s emulator-5554 shell pm list
  packages picoxr.webapp`, then `adb -s emulator-5554 uninstall <pkg>`, then Install again from
  the browser. Code changes hot-reload without this.
- **Type error on `enable-xr`**: `jsxImportSource` is missing from `tsconfig.json`.
- **Black screenshot**: burst again with `setup/snap.mjs`; see the screenshot rule above.
