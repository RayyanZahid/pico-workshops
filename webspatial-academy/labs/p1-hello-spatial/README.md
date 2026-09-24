# p1 · Hello Spatial

## Goal

Take a plain React page and make exactly one thing on it spatial: a card that floats 80 px in front of the page on a glass back, inside a window that is glass too. It is the smallest possible WebSpatial app.

## What you'll learn

- The four pieces every WebSpatial app needs: the SDK, the JSX runtime, `<SpatialBoot>`, and a web app manifest
- `enable-xr`, which turns one element into a spatialized element
- `--xr-back`, which sets how far the element lifts toward you, in px
- `--xr-background-material: translucent`, the glass back, for an element or for the whole window
- Why your desktop browser shows no change (progressive enhancement), and how to see the real thing in the emulator
- The runtime badge (bottom right on every lab page): browser tab = flat, web app = spatial

```
start/      plain React + Vite page, not spatial      npm run dev  -> http://localhost:5301/
solution/   the finished Hello Spatial                npm run dev  -> http://localhost:5311/
```

Work in `start/`. Install first, once, from `labs/`: `npm install`.

## Steps

### 1. Run the flat page

```bash
cd labs/p1-hello-spatial/start
npm run dev
```

**Expected:** `http://localhost:5301/` shows "Hello, spatial web." with a card that says "just a div, for now". Leave the server running; Vite reloads on every save.

### 2. Add the SDK

```bash
npm i @webspatial/react-sdk@2.0.0 @webspatial/core-sdk@2.0.0 --save-exact
```

**Expected:** done in a couple of seconds, since the workspace already has the packages. `package.json` now lists both. Do **not** add `@webspatial/vite-plugin`: it breaks SDK 2.0 builds ([why](../VERSIONS.md)).

### 3. Route JSX through the SDK

This is the step that gives every HTML tag the `enable-xr` prop. It goes in two files:

```diff
// tsconfig.json
     "jsx": "react-jsx",
+    "jsxImportSource": "@webspatial/react-sdk",
```

```diff
// vite.config.ts
   plugins: [
-    react(),
+    react({ jsxImportSource: '@webspatial/react-sdk' }),
   ],
```

**Expected:** no visible change. To prove it took, fetch the transformed module:
open `http://localhost:5301/src/App.tsx` in your browser: the first lines should import `@webspatial_react-sdk_jsx-dev-runtime.js`, not React's.

> Why both? tsconfig is what the type checker reads. Vite 8 compiles with oxc and needs the option on the React plugin. If only one is set, you get type errors, or a build where `enable-xr` silently does nothing.

### 4. Boot the spatial runtime

```diff
// src/main.tsx
+import { SpatialBoot } from '@webspatial/react-sdk'
 ...
   <StrictMode>
-    <App />
+    <SpatialBoot onError={(err) => console.error('WebSpatial boot failed', err)}>
+      <App />
+    </SpatialBoot>
   </StrictMode>,
```

**Expected:** unchanged page. In the browser console, `window.__webspatialsdk__` now returns `{ "react-sdk-version": "2.0.0" }`. In a desktop browser SpatialBoot finishes at once. On PICO OS 6 it loads the spatial chunk first, and without it `enable-xr` is ignored even in the headset.

### 5. Read the web app manifest

`start/` already ships one: `public/app.webmanifest`, linked from `index.html`. Every lab has one, because PICO only offers to open a page as an app when its URL belongs to a manifest's `scope`. Open it and find the fields PICO requires:

```json
{
  "name": "Hello Spatial (start)",
  "start_url": "/",
  "scope": "/",
  "display": "minimal-ui",
  "icons": [ "... 192, 512, 1024 and a 1024 maskable ..." ],
  "xr_main_scene": { "default_size": { "width": 1000, "height": 700 } }
}
```

**Expected:** DevTools > Application > Manifest shows it with no errors, served as `application/manifest+json`. Notes:

- `display: minimal-ui` gives PICO's app menu Back / Home buttons.
- `xr_main_scene` sets the first window's size, and manifest keys are snake_case.
- Icon paths are relative, so they resolve against the manifest's own URL.

### 6. Lift the card

```diff
// src/App.tsx
-      <div className="lifted pico-panel">
+      <div enable-xr className="lifted pico-panel">
```

```diff
/* src/app.css */
 .lifted {
+  position: relative;
+  --xr-back: 80;
+  --xr-background-material: translucent;
   display: flex;
```

**Expected on desktop:** nothing moves. That's correct: browsers ignore `--xr-*`, so your site stays intact everywhere else. `--xr-back` only applies to positioned elements and only takes px; a bare number means px.

### 7. Make the whole window glass

```css
/* src/app.css */
html {
  --xr-background-material: translucent;
}
html.is-spatial body {
  background: transparent;   /* stop painting over the glass in the headset */
}
```

```ts
// src/main.tsx, before createRoot: PICO OS 6 puts "WebSpatial/<version>" in the user agent
if (/WebSpatial\//.test(navigator.userAgent)) {
  document.documentElement.classList.add('is-spatial')
}
```

**Expected on desktop:** still the violet gradient, because the class is only added inside a WebSpatial runtime.

### 8. See it in the emulator

```bash
npm run dev:xr                          # binds 0.0.0.0
# in a second terminal, from the kit root:
node setup/launch.mjs 1                 # adb reverse tcp:5301 tcp:5301, then opens http://localhost:5301/
```

By hand, without the script: `adb reverse tcp:5301 tcp:5301`, then open `http://localhost:5301/` in the emulator's PICO Browser. `http://10.0.2.2:5301/` also loads, but only as a flat tab: the emulator doesn't treat it as a secure context, so it can't become a web app, whatever PICO's docs say (measured 2026-09-24).

In the emulator's PICO Browser, click the small monitor icon just left of the star in the address bar. On OS 6.0.0 it is titled **Install app**; PICO's docs call it **Open as standalone app**. Then click **Install**, and wait up to 60 s for the `enable-xr` panels to appear (a cold launch is slow; if they are still missing, force-close and reopen the app once). The app opens in its own window; relaunch it later from its launcher tile. A browser tab is never spatial: only the installed web app's user agent carries `WebSpatial/`. The runtime badge in the bottom-right corner reads "Web app · WebSpatial on" once you're in the right place. Code edits hot-reload into the installed app, but after a **manifest** edit you must `adb uninstall <package>` (`adb shell pm list packages webapp` finds it) and install again.

**Expected:** a glass window. The title and text sit on the window plane, and the card floats in front of them on its own glass. The icon may fail to load during install ("CLEARTEXT communication to localhost not permitted"); the install still succeeds.

> **Emulator-verified (2026-09-24, emulator-lab):** `solution/` installed as a web app. Inside it the UA carried `WebSpatial/1.5.0`, `<html>` had `is-spatial`, and the runtime spatialized the card.

### Or let Claude Code do steps 2 to 7

Paste into `claude`, started in `labs/p1-hello-spatial/start`:

```text
Make this page a WebSpatial app with @webspatial/react-sdk and @webspatial/core-sdk 2.0.0 (exact
versions, no @webspatial/vite-plugin). Set jsxImportSource to @webspatial/react-sdk in BOTH
tsconfig.json and the react() plugin in vite.config.ts, wrap <App /> in <SpatialBoot>, check
public/app.webmanifest has name, start_url, scope, display minimal-ui and icons. Then make the .lifted card enable-xr with
position: relative, --xr-back: 80 and a translucent background material, and make the window
itself translucent. List every file you changed and why, then run npm run build.
```

## Checkpoint

- [ ] `npm run build` and `npm run build:xr` both print `✓ built`, and `dist/assets/` contains a `spatial-*.js` chunk (the lazy spatial runtime)
- [ ] `http://localhost:5301/` looks the same as before, with 0 console errors
- [ ] `window.__webspatialsdk__` shows `react-sdk-version: "2.0.0"`
- [ ] In the emulator, installed as a web app (badge: "Web app · WebSpatial on"), the card is visibly in front of the page
- [ ] You can say which one line makes the card spatial (`enable-xr`) and which one sets how far (`--xr-back`)

## Stretch goals

- Change `--xr-back` to `200`, then `0`. What does 0 look like?
- Add a second `enable-xr` element with `--xr-back: 40` and nest it inside the card. Nested backs add up: it lands at 120 from the page.
- Tilt the card: `transform: rotateY(-12deg)` on a spatialized element is a real 3D rotation, not a projection.
- Try `--xr-background-material: transparent` on `html`. The window's backplate vanishes and the card floats alone.

**Docs:** webspatial.dev: Getting Started, JSX Markers (`enable-xr`), CSS API `back` and `background-material`, and the minimal PWA guide.
