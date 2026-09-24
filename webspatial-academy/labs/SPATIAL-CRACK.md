# Why WebSpatial pages look flat in the PICO OS 6 emulator

Owner: pico-dev. Date: 2026-09-24. Host: the Alienware m16 R1 laptop. AVD `PICO_6.0` (PICO OS
6.0.0, `ro.build.type=user`, `hw.ramSize=4096` for this run). pico-cli 0.5.0. Tags:
**VERIFIED** (reproduced on this emulator today), **SOURCE** (read in code), **UNVERIFIED**.

## Symptom

A WebSpatial page (lab p1 on SDK 2.0.0, and webspatial-colorblast on SDK 1.7.0) opens in the
emulator's PICO Browser as an ordinary flat tab. Nothing marked `enable-xr` lifts toward the
viewer. Screenshot: `assets/emulator/crack-browser-tab-flat.png` (p1 in a tab, card drawn flat
inside the page).

## Root cause, in one line

**A browser tab is never spatial. The page has to be installed as a Web App.** Only the
installed Web App's user agent contains `WebSpatial/`, and both SDK lines check for exactly
that string before installing any spatial code. On this image, pico-cli's own "launch as a Web
App" path fails, so the only route is the **Install app** icon in the browser's address bar.

## Hypotheses and the experiments that settled them

### H2 The tab's UA fails the SDK's runtime check: CONFIRMED (VERIFIED + SOURCE)

UA read over CDP, via `adb forward tcp:9231 localabstract:weblayer_devtools_remote_<browser pid>`
then `Runtime.evaluate navigator.userAgent`:

```
browser tab   ... PicoBrowser/5.0.0 Chrome/138.0.7204.55 VR Safari/537.36  OculusBrowser/7.0
installed app ... PicoWebApp/0.4.0 (like PicoBrowser) Chrome/138.0.7204.55 WebSpatial/1.5.0 VR Safari/537.36 OculusBrowser/7.0
```

SDK side (core-sdk 2.0.0, `dist/install-polyfills.js` and `Spatial.runInSpatialWeb()`):
`if (!isSSREnv() && navigator.userAgent.indexOf('WebSpatial/') > 0) { injectSceneHook(); spatialWindowPolyfill() }`.
In the tab: `window.__webspatialsdk__ = {"react-sdk-version":"2.0.0"}`, no `is-spatial` class.
In the installed app: `{"react-sdk-version":"2.0.0","core-sdk-version":"2.0.0","physicalMetrics":{...}}`,
`<html class="is-spatial">`, `display-mode: standalone` true.

The CDP socket is named `weblayer_devtools_remote_<pid>`, not `chrome_devtools_remote` as the
kit CLAUDE.md suggests. Each installed Web App is its own process with its own socket.

### H1 Spatialization needs the standalone Web App: CONFIRMED (VERIFIED)

- The address-bar icon to the left of the star (a small monitor) opens an **Install app**
  dialog (`assets/emulator/crack-browser-install-app-dialog.png`). Logcat when it opens:
  `weblayer_webapps_client.cc:59] IsWebApkInstalled, start_url=http://localhost:5311/; is_installed=0`.
- **Install** creates a real Android package, `com.picoxr.webapp.localhost.anoignjj`
  (versionName 0.4.3, under `/data/app`), and launches
  `com.picoxr.spacewebappp.platform.WebAppActivity`. It survives an emulator restart and
  appears on the launcher as its own tile (`crack-launcher-installed-webapps.png`, where
  "Hello" and "ColorBlast" are both installed).
- In the app the card is a separate glass panel with its own document:
  `http://localhost:5311/<random>/?command=createSpatialized2DElement&rid=wsreq_..._2`, 440x193,
  1,824 bytes of portaled markup (`crack-p1-standalone-card-lifted.png`).
- **Depth proof:** an unchanged DOM with only `--xr-back` changed live over CDP, from 80 to
  400. The card grows from about 374 to 580 px wide on screen and overhangs the window's left
  edge, which a flat element cannot do: `crack-p1-standalone-xr-back-80.png` vs
  `crack-p1-standalone-xr-back-400.png`.

### pico-cli's Web App launcher is broken on this image: NEW (VERIFIED)

`node setup/launch.mjs 1 --solution --manifest` (i.e. `pico-cli web launch --manifest-url`):

```
Preparing web runtime on device: emulator-5554...
The system cannot find the path specified.
Error: ADB install failed: ... PicoBrowser.apk: Failure [INSTALL_FAILED_UID_CHANGED:
Package com.picoxr.browser shared user changed from android.uid.system to <nothing>]
```

The emulator's browser is a system app (`/system/priv-app/SpaceBrowser`,
`sharedUser=android.uid.system`, versionCode 1026862684). pico-cli's
`%PICO_HOME%/6.0/webspatial/PicoBrowser.apk` (versionCode 2147483647, no shared user) cannot
update it. pico-cli installs before every launch (SOURCE: `yE()` then `cU()` in
`dist/index.js`), so both `--url` and `--manifest-url` die here. Starting the target activity
by hand does not work either: `am start -n com.picoxr.browser/com.picoxr.webappservice.feature.router.ui.WebRouterActivity`
gives `SecurityException: ... not exported from uid 1000`, and the image is a `user` build
(`ro.debuggable=0`), so `adb root` is out.

### H3 The SDK never booted: KILLED

Colorblast in the tab reports `__webspatialsdk__ = {"core-sdk-version":"1.7.0","react-sdk-version":"1.7.0","XR_ENV":"avp"}`.
The XR build is loaded; the runtime simply refuses it because of the UA. p1 carries the same
SDK 2.0 stamp as above.

### H4 The manifest is invalid or unreachable: KILLED

`Page.getInstallabilityErrors` returns `[]` for both p1 (`http://10.0.2.2:5311/`) and colorblast.
The browser offers Install for both. (The colorblast `/favicon.svg` 404 under the avp base did
not block installation.)

### H5 The image has no WebSpatial runtime: KILLED

`com.picoxr.webapp.runtime` 0.4.0 and `com.pico.spatial.runtime` 6.0.0.0-alpha.14 are
installed. The installed app answers the SDK's bridge: a `window.__SpatialWebEvent` hook logs
`{"id":"wsreq_..._2","data":{"spatialId":"9cfc524f-..."}}` about 450 ms after each
`window.open(...createSpatialized2DElement...)`.

## Two traps found on the way

1. **The card takes 10 to 40 s to appear after a cold launch.** Across three cold launches,
   observed at 10 s: child document 0x0, card missing. At 40 s: 440x193, card present.
   An attendee who looks after 5 s concludes "not spatial". Wait up to 60 s before judging (p2 took ~50 s in the acceptance pass); if the panels are still missing, close and reopen the app once.
2. **`adb shell input tap` coordinates are panel-local, not screenshot pixels.** The
   compositor view in the screenshot is a 3D render. `dumpsys input` shows the browser window
   as `frame=[0,0][2880,1792]`, and taps are dispatched in that space. The monitor icon sat at
   about (2310, 65) and Install at about (1925, 1117) *for that panel*. Screenshot coordinates
   miss, and the miss lands on whatever sits at those panel pixels. Use this for agent-driven
   runs only; attendees click with the mouse.

Also: `setup/snap.mjs` frames were >30% black on almost every burst tonight. Host-side
`PrintWindow(hwnd, hdc, PW_RENDERFULLCONTENT)` on the `PICO Emulator - 6.0.0` window returned
a clean full frame every time (all the crack-p1-*/crack-launcher-* images).

## The fix, for an attendee (final recipe)

1. Serve the lab: `npm run dev:xr` in the lab folder.
2. Map the port and open it as **localhost**, not 10.0.2.2:
   `adb reverse tcp:<port> tcp:<port>`, then open `http://localhost:<port>/` in the emulator's
   PICO Browser. `node setup/launch.mjs <n>` currently dies at its install step (see above), so
   either type the URL or use
   `adb shell am start -n com.picoxr.browser/com.google.android.apps.chrome.IntentDispatcher -a android.intent.action.VIEW -d http://localhost:<port>/`
   (the exported activity pico-cli itself uses, VERIFIED here). Re-run `adb reverse` after
   every emulator restart.
3. In the address bar, click the **small monitor icon left of the star**. On this image it
   opens an **Install app** dialog showing the app name and URL; PICO's docs call this
   affordance "Open as standalone app". Either label, same button. Click **Install**.
4. The app opens as its own window with a glass background. **Wait up to 60 s** (close and reopen once if still empty) for
   `enable-xr` elements to appear as separate floating panels.
5. Relaunch it later from its own tile on the home launcher, not from the browser. After an
   emulator restart, re-run `adb reverse` if you used localhost.
6. Changed the manifest? The installed app keeps the old one. Uninstall it
   (`adb shell pm list packages | grep picoxr.webapp` then `adb uninstall <pkg>`), then install
   again. Code changes hot-reload as usual.

Checking from an agent: the app is spatial when `navigator.userAgent` contains `WebSpatial/`
and `<html>` has `is-spatial` (lab p1). A target named `...?command=createSpatialized2DElement`
with a non-zero `innerWidth` means an element really was lifted.

## Reconciling with PICO's docs (`assets/pico-docs/WEB-APP-RUNTIME.md`)

| PICO doc says | What this run saw | Verdict |
|---|---|---|
| WebSpatial runs only in the Web App Runtime, never in a tab | Tab UA has no `WebSpatial/`; installed-app UA has `WebSpatial/1.5.0`; the card lifts only in the app | **Agrees** |
| Button is "Open as standalone app" | The address-bar icon opens a dialog titled **Install app** | Same affordance, different label on OS 6.0.0. Teach "the monitor icon left of the star" |
| Use `http://10.0.2.2:<port>/` for HTTP in the emulator; localhost does not qualify | The Web App that worked was installed from `http://localhost:5311/` (tab reached via `adb reverse`), package `com.picoxr.webapp.localhost.anoignjj`. emulator-lab and labs-builder measured 10.0.2.2 as `isSecureContext=false` with no install offer | **Contradicts the doc. Use localhost + adb reverse.** One loose end: CDP `Page.getInstallabilityErrors` returned `[]` for my `http://10.0.2.2:5311/` tab too. I never tried installing from it, so that is not evidence 10.0.2.2 works |
| Manifest needs name/short_name, icons, start_url, display, served as JSON | p1's manifest has all four; Vite serves it as `Content-Type: application/manifest+json` | **Agrees** |
| `matchMedia('(display-mode: standalone)')` tells you the runtime | `false` in the tab, `true` in the installed app, read over CDP | **Agrees**. Use it together with the `WebSpatial/` UA check |

## The 14:33 emulator death

The qemu log stops at 21:33:44 UTC with no exit line. Windows' System log has **no events at all**
between 14:32 and 14:36 PT, and in particular no Resource-Exhaustion (event 2004). A host
out-of-memory kill is plausible with a 4096 MB AVD on a 16 GB box, but it is **not proven**. The
restart at 14:37:38 was emulator-lab's (per team-lead).

## What stays unverified

- **Colorblast (SDK 1.7.0) in its installed app**: at about 20 s the page drew with holes
  where its `enable-xr` header and grid belong, and its three child documents were empty 0x0
  (`crack-colorblast-standalone-holes.png`). This matches the slow-load trap, but I did not
  re-observe at 40 s before another agent stopped the app. Someone else's
  `07-colorblast-spatialized-divs-floating.png` suggests it does fill in.
- Scenes (`initScene` + `window.open`), volumes and `<Model>` in the installed app: not tested.
- The p1 app worked from localhost. I did not try installing from the 10.0.2.2 tab myself;
  the "10.0.2.2 gets no install offer" result is emulator-lab's and labs-builder's measurement.
- The `The system cannot find the path specified.` line from pico-cli on Windows precedes the
  install error. I did not trace it; the install error alone explains the failure.
- Headsets: none of this was run on hardware. OS 5.x headsets have no WebSpatial runtime (DOC).

## Interference during this run

Another session drove the emulator while this run had exclusive control. It started the
browser at 14:26:42, the emulator died at about 14:33:44 with no exit line and was restarted
at 14:37:38, and a shell force-stopped both Web Apps at 14:48:57. None of these changed a
conclusion, but they cost several attempts.
