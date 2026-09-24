# p3 · Volumes and models

## Goal

Open a **volume**, a 3D window, from a flat launcher, and show a real GLB in it that you can turn with a pinch-drag, scale with two hands, and reset with a tap. Desktop browsers get a flat poster instead.

## What you'll learn

- Window vs volume: `initScene(name, config, { type: 'volume' })`, sized in metres (`'0.6m'`)
- The `<Model>` component: `enable-xr`, `src`, `poster`, `onLoad` / `onError`, and `stagemode`
- Feature detection with `useSpatialReady()` + `WebSpatialRuntime.supports('Model')`, and a real fallback
- Spatial gestures: `onSpatialDrag` (`translationX`, px), `onSpatialMagnify` (`magnification`, 1 = 100%), `onSpatialTap`
- Why gesture values are totals since the gesture started, so you add them to a saved baseline
- Checking a GLB's size and triangle count before putting it in a headset

```
start/      launcher + a flat 'viewer' window with only a poster     npm run dev -> http://localhost:5303/
solution/   launcher + a 0.6 m volume with the model and gestures    npm run dev -> http://localhost:5313/
```

Both open the viewer at `?scene=viewer`.

## The model

`public/models/avocado.glb` is **Avocado** from the Khronos glTF Sample Assets (CC0, Microsoft), pinned to commit `c6a6bd13`. We shrank its textures from 2048 to 1024 px: 8.1 MB became 2.4 MB, with 682 triangles and no glTF extensions. Details and the exact command are in `public/models/CREDITS.md`. It lives in `public/`, so the emulator loads it from your dev server with no internet needed.

## Steps

```bash
cd labs/p3-volume-model/start
npm run dev              # http://localhost:5303/  then click "Open in 3D"
```

`start/` is already wired for WebSpatial (SDK, JSX runtime, SpatialBoot, manifest). You only do the 3D work.

### 1. Make the viewer a volume

```diff
// src/scenes.ts
   initScene(
     'viewer',
     (prev) => ({
       ...prev,
-      defaultSize: { width: 600, height: 600 },
+      defaultSize: { width: '0.6m', height: '0.6m', depth: '0.6m' },
     }),
-    { type: 'window' },
+    { type: 'volume' },
   )
```

**Expected:** nothing changes on desktop. In the headset "Open in 3D" now opens a 60 cm box instead of a flat panel. Strings with `m` are metres; plain numbers are px.

`main.tsx` calls `registerScenes` from `<SpatialBoot onReady={registerScenes}>`, and that placement matters. In SDK 2.0, `initScene` before boot is a silent no-op: with the call at module load, the emulator opened `viewer` as a default flat 1280 x 720 window instead of the volume (measured 2026-09-24).

### 2. Put the model in it

```tsx
// src/ViewerScene.tsx
import { Model } from '@webspatial/react-sdk'

<Model
  enable-xr
  className="viewer-model"
  src={MODEL.src}
  poster={MODEL.poster}
  onLoad={() => setStatus('ready')}
  onError={() => setStatus('error')}
/>
```

`.viewer-model` in `app.css` gives the model the free space (`flex: 1`). Its depth defaults to the volume's own depth. **`enable-xr` is what makes it 3D:** without it, `<Model>` falls back to the flat web `<model>` element.

### 3. Fall back honestly

```tsx
import { Model, WebSpatialRuntime, useSpatialReady } from '@webspatial/react-sdk'

const ready = useSpatialReady()                          // true once the spatial runtime booted
const has3D = ready && WebSpatialRuntime.supports('Model')

return has3D ? <Model ... /> : <div className="viewer-fallback pico-panel"><img src={MODEL.poster} /> ...</div>
```

**Expected on desktop:** the poster and a "flat fallback" chip. The SDK's capability table lists `Model` as supported on PICO OS 6 runtimes 0.1.1 and later.

### 4. Gestures: drag to turn, magnify to scale, tap to reset

```tsx
const base = useRef<View>(HOME)            // the view when the gesture began

onSpatialDragStart={() => { base.current = view }}
onSpatialDrag={(e) => setView((v) => ({ ...v, yaw: base.current.yaw + e.translationX * 0.4 }))}
onSpatialMagnify={(e) => { /* first event: save base; then */ scale = base.current.scale * e.magnification }}
onSpatialTap={() => setView(HOME)}
style={{ transform: `rotateY(${view.yaw}deg) scale3d(${s}, ${s}, ${s})` }}
```

Two facts from the event API docs drive this:

- `translationX/Y/Z` on a drag, and `magnification` on a magnify, are measured **from the start of the gesture**. Add them to the baseline you saved; if you add them to the live value, the model runs away.
- There is no `onSpatialMagnifyStart`. The solution saves the baseline on the first magnify event and clears a flag in `onSpatialMagnifyEnd`.

`transform` on a spatialized element is a real 3D transform. `rotateY` turns the container and the model with it.

**Bonus, in the solution:** `stagemode="orbit"` hands rotation to the runtime (the Orbit toggle). While it's on, the solution unhooks its own drag handlers so the two don't fight.

> **Claude Code:** `In ViewerScene, render public/models/avocado.glb with the WebSpatial <Model> component (enable-xr, poster, onLoad/onError status) only when useSpatialReady() && WebSpatialRuntime.supports('Model'), else keep the poster fallback. Pinch-drag should turn it around Y (0.4 deg per px), two-hand magnify should scale it (0.5x to 3x), tap resets. Drag and magnify values are totals since the gesture began, so keep a baseline ref. Explain which event carries which value.`

### 5. See it in the emulator

```bash
npm run dev:xr
node setup/launch.mjs 3          # from the kit root: adb reverse + http://localhost:5303/
```

By hand, without the script: `adb reverse tcp:5303 tcp:5303`, then open `http://localhost:5303/` in the emulator's PICO Browser. `http://10.0.2.2:5303/` also loads, but only as a flat tab: the emulator doesn't treat it as a secure context, so it can't become a web app, whatever PICO's docs say (measured 2026-09-24).

In the emulator's PICO Browser, click the small monitor icon just left of the star in the address bar. On OS 6.0.0 it is titled **Install app**; PICO's docs call it **Open as standalone app**. Then click **Install**, and wait up to 60 s for the `enable-xr` panels to appear (a cold launch is slow; if they are still missing, force-close and reopen the app once). The app opens in its own window; relaunch it later from its launcher tile. A browser tab is never spatial: only the installed web app's user agent carries `WebSpatial/`. The runtime badge in the bottom-right corner reads "Web app · WebSpatial on" once you're in the right place. Code edits hot-reload into the installed app, but after a **manifest** edit you must `adb uninstall <package>` (`adb shell pm list packages webapp` finds it) and install again. Then tap **Open in 3D**.

> **Claude Code:** `Record 15 seconds of the emulator with pico-cli capture record -d emulator-5554 -t 15 -o captures/volume.mp4 while I turn the model, then read pico-cli log -d emulator-5554 -l W -n 200 and tell me about any model-loading warnings.`

> **Emulator-verified 2026-09-24** (installed web app, PICO OS 6.0.0): "Open in 3D" sent `createSpatialScene ... "type":"volume"` at 0.6 x 0.6 x 0.6. The avocado rendered in the volume, filling it, and the status chip read **ready**. The control bar under the model is a plain panel, not `enable-xr`: as a spatial 2D panel inside the volume it failed to create (`createSpatialized2DElement failed`). Drag, magnify and tap can't be scripted in the emulator, so they are untested there; try them on a headset.

## Checkpoint

- [ ] `npm run build` / `npm run build:xr` pass. Desktop: launcher and `?scene=viewer` both load with 0 console errors
- [ ] Desktop viewer shows the poster with the **flat fallback** chip, not an empty box
- [ ] Emulator: "Open in 3D" opens a volume, the status chip turns **ready** (`onLoad` fired), and drag turns the model
- [ ] You can explain why the gesture handlers keep a baseline ref

## Stretch goals

- **Size check.** `npx @gltf-transform/cli@4 inspect public/models/avocado.glb` prints vertex counts and texture sizes. Try `npx @gltf-transform/cli@4 resize public/models/avocado.glb a512.glb --width 512 --height 512`. How much smaller is it, and can you see the difference in the headset?
- **Another model.** Pick a CC0 model from [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) (check its `metadata.json` license), pin it to a commit on jsdelivr (`https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@<sha>/Models/<Name>/glTF-Binary/<Name>.glb`), and check it with `curl.exe -I <url>` (plain `curl` on macOS) before you use it.
- **Size fit.** The avocado is 6 cm tall in real units, but in the emulator the `<Model>` scaled it to fill the 0.6 m volume (`assets/emulator/24-lab3-volume-avocado.png`). Try a model with a very different aspect ratio and see how the fit behaves.
- **Constrain rotation** to the vertical axis with `spatialEventOptions={{ constrainedToAxis: [0, 1, 0] }}` and handle `onSpatialRotate` for two-handed turning.
