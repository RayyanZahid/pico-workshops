# p2 · Spatialize a website

**The headline lab.** You get Swanfest, an ordinary landing page for a fictional PICO OS 6 developer day, and make it spatial one small diff at a time: glass, depth, a hero that pops forward, and a schedule that opens as its own window. The desktop version never breaks.

## Goal

Turn `start/`, a flat React site with no WebSpatial in it, into `solution/`. By the end you should be able to point at the exact lines that made each part spatial.

## What you'll learn

- Progressive enhancement: the spatial layer is added on top, and a desktop browser keeps the same site
- `enable-xr` on existing elements, and `--xr-back` as a depth budget (nav 24, cards 40, hero 120)
- `--xr-background-material: translucent` for the window and for single elements, and why you drop your own background in the headset
- Keeping every spatial style in one file (`spatial.css`) so you can review it and remove it cleanly
- A second window: `initScene(name, config, { type: 'window' })` + `window.open(url, name)`, routed by `?scene=`

```
start/      the flat site               npm run dev -> http://localhost:5302/
solution/   the spatialized site        npm run dev -> http://localhost:5312/   (+ ?scene=schedule)
```

Run both side by side. In a desktop browser they look almost identical, and that's the point. The difference shows up in the emulator.

## What changes, in one table

| File | Change | Step |
|---|---|---|
| `package.json` | + `@webspatial/react-sdk`, `@webspatial/core-sdk` 2.0.0 | 1 |
| `tsconfig.json`, `vite.config.ts` | `jsxImportSource: '@webspatial/react-sdk'` | 1 |
| `src/main.tsx` | `<SpatialBoot>`, the `is-spatial` class, `registerScenes()`, route `?scene=schedule` | 1, 3, 6 |
| `public/app.webmanifest` | already present in `start/`; only its name changes | 2 |
| `src/spatial.css` | **new**: every `--xr-*` style | 3, 4, 5, 6 |
| `src/App.tsx` | `enable-xr` on 5 elements; one `<a>` becomes a `<button>` that opens a window | 4, 5, 6 |
| `src/scenes.ts`, `src/ScheduleScene.tsx` | **new**: the second window | 6 |
| `src/app.css`, `src/data.ts` | **unchanged** | |

`app.css` already gives `.nav`, `.hero-card` and `.feature` `position: relative`. `--xr-back` needs a positioned element, so check for this first on your own site.

## Steps

Work in `start/`:

```bash
cd labs/p2-spatialize-site/start
npm run dev              # http://localhost:5302/
```

### 1. SDK, JSX runtime, SpatialBoot

```bash
npm i @webspatial/react-sdk@2.0.0 @webspatial/core-sdk@2.0.0 --save-exact
```

```diff
// tsconfig.json
     "jsx": "react-jsx",
+    "jsxImportSource": "@webspatial/react-sdk",
// vite.config.ts
-    react(),
+    react({ jsxImportSource: '@webspatial/react-sdk' }),
```

```diff
// src/main.tsx
+import { SpatialBoot } from '@webspatial/react-sdk'
 ...
-    <App />
+    <SpatialBoot onError={(err) => console.error('WebSpatial boot failed', err)}>
+      <App />
+    </SpatialBoot>
```

**Expected:** the page is unchanged, and `window.__webspatialsdk__` in the console reads `{ "react-sdk-version": "2.0.0" }`.

> **Claude Code:** `Wire this Vite + React site for WebSpatial SDK 2.0.0 with no vite-plugin: install @webspatial/react-sdk and @webspatial/core-sdk 2.0.0 exactly, set jsxImportSource in tsconfig.json AND in react() in vite.config.ts, and wrap <App /> in <SpatialBoot>. Don't change anything visual. Run npm run build.`

### 2. The manifest

`start/` already has `public/app.webmanifest` (name, `start_url`, `scope: "/"`, `display: "minimal-ui"`, icons), linked from `index.html`. The part that matters here sizes the site's window:

```json
"xr_main_scene": {
  "default_size": { "width": 1280, "height": 900 },
  "resizability": { "min_width": 900, "min_height": 640 }
}
```

**Expected:** DevTools > Application > Manifest lists it with its icons. The main window's size comes from here, not from code, because the OS creates the first window before your JS runs.

### 3. A glass window

Create `src/spatial.css`, import it after `app.css`, and tag `<html>` inside a WebSpatial runtime:

```diff
// src/main.tsx
 import './app.css'
+import './spatial.css'
 ...
+if (/WebSpatial\//.test(navigator.userAgent)) {
+  document.documentElement.classList.add('is-spatial')
+}
```

```css
/* src/spatial.css */
html {
  --xr-background-material: translucent;
}
html.is-spatial body {
  background: transparent;
}
```

**Expected:** no change on desktop. In the headset the opaque window becomes PICO glass, and the violet gradient steps aside so the glass shows.

### 4. Floating cards

```diff
// src/App.tsx
-          <article key={f.tag} className="feature pico-panel">
+          <article key={f.tag} enable-xr className="feature pico-panel">
```

```css
/* src/spatial.css */
.feature {
  --xr-back: 40;
  --xr-background-material: translucent;
  border-radius: var(--pico-radius-lg);
}
html.is-spatial .feature {
  background: transparent;      /* the glass replaces the flat surface colour */
  backdrop-filter: none;
}
```

**Expected:** three glass cards 40 px in front of the page. The `border-radius` also shapes the glass backplate.

> **Claude Code:** `Make the three .feature cards spatial: add enable-xr in App.tsx, and in src/spatial.css give them --xr-back: 40, a translucent background material and the large PICO radius. In the headset only (html.is-spatial), drop their flat background and backdrop-filter. Don't touch app.css.`

### 5. The nav floats, and the hero pops forward

```diff
// src/App.tsx
-      <nav className="nav">
+      <nav enable-xr className="nav">
 ...
-        <div className="hero-card">
+        <div enable-xr className="hero-card">
```

```css
/* src/spatial.css */
.nav {
  --xr-back: 24;
  --xr-background-material: translucent;
}
.hero-card {
  --xr-back: 120;               /* no material: the text itself floats */
}
```

**Expected:** a depth ladder: page 0, nav 24, cards 40, hero 120. The hero is the closest thing and reads first. Keep the numbers few and spaced; depth is a hierarchy, not decoration.

### 6. The schedule gets its own window

New file `src/scenes.ts`:

```ts
import { initScene } from '@webspatial/react-sdk'

export function registerScenes() {
  initScene('schedule', (prev) => ({ ...prev, defaultSize: { width: 520, height: 640 } }), { type: 'window' })
}
export function openSchedule() {
  window.open(`${import.meta.env.BASE_URL}?scene=schedule`, 'schedule')   // 2nd arg = the scene name
}
export function currentScene() {
  return new URLSearchParams(location.search).get('scene') === 'schedule' ? 'schedule' : 'main'
}
```

New file `src/ScheduleScene.tsx` renders the schedule list alone (copy it from `solution/`). Then:

```diff
// src/main.tsx
-    <SpatialBoot onError={...}>
-      <App />
+    <SpatialBoot onReady={registerScenes} onError={...}>
+      {currentScene() === 'schedule' ? <ScheduleScene /> : <App />}
```

> **Gotcha: register scenes in `onReady`, not at module load.** In SDK 2.0, `initScene` does nothing, and throws nothing, until the spatial runtime has booted. Called at the top of `main.tsx`, it is silently dropped, and the scene opens as a default flat 1280 x 720 window. Found in the PICO OS 6 emulator, 2026-09-24. `onReady` fires after boot and before the children mount, so the scene is registered before any button can call `window.open`.

```diff
// src/App.tsx
-            <a className="pico-btn pico-btn--ghost" href="#schedule">See the schedule</a>
+            <button className="pico-btn pico-btn--ghost" type="button" onClick={openSchedule}>
+              See the schedule
+            </button>
```

**Expected:** on desktop, "See the schedule" opens a tab at `?scene=schedule`. In the headset it opens a 520 x 640 glass window you can place next to the site. If the second `window.open` argument doesn't match the `initScene` name, you get a plain browser window with no error. It's the most common mistake in this lab.

> **Claude Code:** `Add a second window scene called 'schedule' with initScene (520x640, type 'window' as the third argument), registered from <SpatialBoot onReady={registerScenes}> (initScene is a no-op before boot), a ScheduleScene component that shows the schedule list, routing by ?scene=schedule in main.tsx, and make "See the schedule" open it with window.open(url, 'schedule'). It must still open as a normal tab in a desktop browser.`

### 7. See it in the emulator

```bash
npm run dev:xr                         # in labs/p2-spatialize-site/start
node setup/launch.mjs 2                # from the kit root: adb reverse + http://localhost:5302/
```

By hand, without the script: `adb reverse tcp:5302 tcp:5302`, then open `http://localhost:5302/` in the emulator's PICO Browser. `http://10.0.2.2:5302/` also loads, but only as a flat tab: the emulator doesn't treat it as a secure context, so it can't become a web app, whatever PICO's docs say (measured 2026-09-24).

In the emulator's PICO Browser, click the small monitor icon just left of the star in the address bar. On OS 6.0.0 it is titled **Install app**; PICO's docs call it **Open as standalone app**. Then click **Install**, and wait up to 60 s for the `enable-xr` panels to appear (a cold launch is slow; if they are still missing, force-close and reopen the app once). The app opens in its own window; relaunch it later from its launcher tile. A browser tab is never spatial: only the installed web app's user agent carries `WebSpatial/`. The runtime badge in the bottom-right corner reads "Web app · WebSpatial on" once you're in the right place. Code edits hot-reload into the installed app, but after a **manifest** edit you must `adb uninstall <package>` (`adb shell pm list packages webapp` finds it) and install again. Then tap **See the schedule**.

> **Claude Code:** `Screenshot the emulator with node setup/snap.mjs before and after I install the page as a web app, and describe which elements float and which stayed on the page plane.`

## Checkpoint

- [ ] `npm run build` and `npm run build:xr` pass
- [ ] Desktop: the site looks the same as `start/` did, with 0 console errors, and "See the schedule" opens `?scene=schedule` in a tab
- [ ] `spatial.css` is the only CSS file with `--xr-*` in it (search `src/` for `--xr-` in your editor, e.g. Ctrl+Shift+F in VS Code)
- [ ] You can name the five `enable-xr` elements and their depths
- [ ] Emulator: glass window, floating nav and cards, the hero in front, and the schedule in its own window

## Stretch goals

- Make each schedule row in the second window its own shallow layer (`enable-xr`, `position: relative`, `--xr-back: 12`). The solution deliberately doesn't: six spatial rows came up as empty glass in the emulator. Try it, give it a minute, and decide whether it's worth the extra planes.
- Hover depth: in the headset, raise a feature card from 40 to 64 while it's hovered. Spatialized elements don't support CSS transitions, so change the value from React state (`style={{ '--xr-back': hovered ? 64 : 40 }}`).
- Tilt the three cards into a gentle curve: `transform: rotateY(8deg)` on the left card and `rotateY(-8deg)` on the right.
- Remove `spatial.css` and the five `enable-xr` attributes. Is the site fully back to `start/`? It should be. That's the progressive-enhancement test.
