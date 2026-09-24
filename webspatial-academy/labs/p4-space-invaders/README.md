# p4 · Spatial Invaders: depth as gameplay, plus a HUD window

## Goal

Take a complete, flat Space Invaders game and let depth carry meaning. The invader rows stand in terraces with the back rows deepest, the whole formation comes toward you as it descends, your shots fly away from you into the formation, enemy shots fly at you, and a hit row flinches forward before the invader vanishes. Then give the score, lives and wave their own **HUD window**, kept in sync over `BroadcastChannel`, and a **hall of fame** window that opens when the game ends.

Background and diagrams: [`curriculum/L4.md`](../../curriculum/L4.md).

## What you'll learn

- **Layer budget.** Every `enable-xr` element is a separate native plane the OS composites. Spatialize containers (a row, the shield line), not sprites (55 invaders, 160 shield blocks).
- **Don't nest spatial elements (PICO OS 6.0.0, measured).** A spatial element inside another spatial element came out as an empty 0 x 0 document and never rendered. So every layer here is a top-level `enable-xr`, and the depths are absolute sums you compute yourself: formation + row + flinch.
- **Write styles only when they change.** The loop runs 60 times a second, and every style write on a spatial element goes to the native runtime.
- **Animating depth from JS.** Write `el.style['--xr-back']` through a ref from the `requestAnimationFrame` loop, rounded to one decimal, and only when it changes. Spatialized elements don't support CSS animations or transitions.
- **Pooling.** Two shot planes and two bomb planes, reused for the whole game.
- **A second (and third) window:** `initScene(name, cfg, { type: 'window' })` + `window.open(url, name)`. The game's own window is sized in the manifest instead.
- **Cross-window state:** an authoritative game, display-only windows, a `hello` handshake for late joiners, intents flowing back, and one real Chrome gotcha.

```
start/      the flat game: complete and playable, no WebSpatial     npm run dev -> http://localhost:5304/
solution/   11 spatial layers + HUD + hall of fame                   npm run dev -> http://localhost:5314/
```

**Controls:** ← → move · Space fire · Enter start · P pause · M sound. The on-screen ◀ Fire ▶ buttons work with a mouse, touch or a pinch. All art is CSS, and all sound is synthesized with WebAudio: no sprites or audio files.

## The depth map (solution)

All values are `--xr-back` in px (its only unit; one decimal; never negative), measured from the window's glass. Bigger means closer to you. **No spatial element sits inside another one.** The playfield is a plain div.

| Layer | Planes | Depth | Why it's a plane |
|---|---|---|---|
| Rows 0 to 4 | 5 | `5 + y × 0.08` (the formation, **comes forward as it descends**) `+ row × 20` (0 / 20 / 40 / 60 / 80, back rows deepest) `+ flinch` (24 on a hit, decays in ~200 ms) | rows differ in depth, move together, flinch on their own |
| Invaders | 0 | ride on their row | same depth as the row, so a plane each buys nothing |
| Shields | 1 | 100, all four bunkers on one plane | one depth for the whole line; blocks are plain divs |
| Ship | 1 | 120, always the closest: the deepest possible front row is 5 + 412 × 0.08 + 80 = 118 | |
| Player shots | 2 (pooled) | from 120 **back** to the front row's depth as they rise | travel in Z |
| Enemy shots | 2 (pooled) | from the firing row's depth **toward you** to 120 | travel in Z |
| UFO | 0 | the page plane: far away | cosmetic |
| ◀ Fire ▶ | 0 | flat on the window | always in view; a pinch arrives as a click |
| Overlay card | +1 while shown | 150 | Ready / Paused / Game over must sit in front of the rows |

**11 planes while playing, 12 while the overlay shows**, against 230+ if every sprite and block were spatial. The docs publish no per-scene plane limit, so treat roughly 15 as a budget habit, not a hard number. Measure it with `pico-cli perf` in L5.

**Keep depths modest.** The first version used a ship at 260, shields at 210 and 30 px row steps. In the emulator's default view, the ship and the buttons projected **below the window's bottom edge**: a plane lifted far toward you, low in the window, lands lower in the view. The depths above keep everything inside the window's footprint while the rows still read as stepped.

**Emulator-verified 2026-09-24** (installed web app, PICO OS 6.0.0): the rows render visibly stepped, with front rows larger. The shields float in front of the playfield, the formation marches, shots fly, and hits land (`assets/emulator/22-lab4-web-app-rows-stepped.png`, `23-lab4-web-app-midgame.png`). Two things were learned the hard way:

- **Nested spatial elements didn't render.** The first version had a spatial playfield containing a spatial formation containing spatial rows. Only the top-level planes (playfield, buttons) were created; every nested one got an empty 0 x 0 document. Flattening fixed it.

Everything about Z lives in **`solution/src/depth.ts`**. Every spatial line in `Game.tsx` and `app.css` is marked `SPATIAL`, and `start/` is exactly `solution/` with those lines removed (`node _shared/strip-spatial.mjs p4-space-invaders`, from `labs/`). So `git diff --no-index start/src solution/src` is the whole lesson. Collisions never read Z: the game plays the same on a laptop.

## Steps

```bash
cd labs/p4-space-invaders/start
npm run dev              # http://localhost:5304/  Press Enter and play a round first.
```

### Step 1 · Wire WebSpatial

The same four pieces as p1 and p2:

- **SDK:** `npm i @webspatial/react-sdk@2.0.0 @webspatial/core-sdk@2.0.0 --save-exact`
- **JSX runtime:** `jsxImportSource: '@webspatial/react-sdk'` in `tsconfig.json` and in `react({...})` in `vite.config.ts`
- **Boot:** `<SpatialBoot>` around `<Game />` in `main.tsx`, plus the `is-spatial` class
- **Manifest:** already there, sizing the game window with `"xr_main_scene": { "default_size": { "width": 900, "height": 1000 } }`

Then make the window glass (`solution/src/app.css`, the first `SPATIAL` block). Leave `.playfield` a plain div: every game layer will be spatial, and a spatial element must not sit inside another one.

### Step 2 · Rows get depth

> **Claude Code:** `Spatialize this Space Invaders game with one spatial layer per ROW, not per sprite: make each .row enable-xr (no spatial parent: never nest enable-xr inside enable-xr, it does not render on PICO OS 6.0.0) and write each row's --xr-back = row * 20 (row 0, the top/back row, deepest) through its ref. Leave every invader a plain div. Put the depth constants in src/depth.ts with a writeBack(el, z) helper that rounds to one decimal and skips unchanged values, and make the loop's transform/visibility writes skip unchanged values too. Then count the enable-xr elements.`

```ts
// depth.ts
export const rowZ = (row: number, pop = 0) => row * ROW_STEP + pop     // offset in front of the formation's depth
export function writeBack(el: HTMLElement | null, z: number) {
  if (!el) return
  const v = Math.round(Math.max(0, z) * 10) / 10                      // px, one decimal, never negative
  if (last.get(el) === v) return                                       // unchanged writes still cost a bridge update
  last.set(el, v)
  el.style['--xr-back'] = String(v)                                    // the documented imperative form; the SDK types it
}
```

**Expected on desktop:** no visible change. In DevTools, each `.row`'s inline style shows `--xr-back` stepping by 20 from row 0 to row 4.

### Step 3 · Depth tied to descent

> **Claude Code:** `Tie the formation's depth to its descent: each row's --xr-back = (5 + y * 0.08) + row * 20 + flinch, written from the requestAnimationFrame loop through the row's ref with writeBack, so it only writes when the rounded value changes. No CSS transitions on spatial elements. Show me the loop code you changed.`

```diff
       for (let r = 0; r < C.ROWS; r++) {
         place(rowRefs.current[r], w.fx, w.fy + r * C.ROW_H)
+        writeBack(rowRefs.current[r], formationZ(w.fy) + rowZ(r, w.pops[r])) // SPATIAL
       }
```

The threat now physically approaches: at the start (y = 80) the back row sits at 11.4 and the front row at 91.4. Near the shields (y ≈ 300) the front row reaches about 109, level with the shields at 100.

### Step 4 · Shots travel in Z; hits flinch

> **Claude Code:** `Make the ship (120) and the shield line (100) enable-xr at fixed depths, and the 2 pooled shots and 2 pooled bombs enable-xr. Player shots: lerp --xr-back from the ship's depth to the front row's absolute depth (formation + row) as they rise. Enemy shots: lerp from the depth of the row that fired them to the ship's depth as they fall. Keep collision detection 2D. On a hit, pop that row forward by 24px and decay it back over about 200ms in the loop, while the invader flashes before it vanishes.`

```ts
writeBack(shotEl, lerp(SHIP_Z, rowWorldZ(w.fy, target, w.pops[target]), progress))   // recedes
writeBack(bombEl, lerp(b.z0, SHIP_Z, progress))                                       // approaches
w.pops[r] = POP                                                  // on hit
w.pops.forEach((p, r) => (w.pops[r] = p < 0.1 ? 0 : p * Math.pow(POP_DECAY, dt * 60)))  // every frame
```

**Expected:** 11 layers (see the depth map). The on-screen buttons stay flat and use plain `onClick`, because a pinch on a spatialized button arrives as a click. **Don't put `onSpatialTap` on a `<button>`.** Inside the PICO runtime React logs `Unknown event handler property onSpatialTap` as a console error (measured 2026-09-24). Save spatial events for `<Model>`, `<Reality>` entities and `enable-xr` divs.

### Step 5 · The HUD window

> **Claude Code:** `Add a HUD window: register initScene('hud', cfg => ({...cfg, defaultSize: {width: 360, height: 480}}), { type: 'window' }) in src/scenes.ts, open it with window.open('/?scene=hud', 'hud') from a "HUD window" button, call registerScenes from <SpatialBoot onReady={registerScenes}> (initScene before boot is a silent no-op in SDK 2.0), route ?scene=hud in main.tsx, and sync score, lives, wave and status over a BroadcastChannel named 'invaders'. The game is authoritative, broadcasts only when HUD state changes, answers 'hello', and applies 'intent' messages (pause, restart) from the HUD. Prove it in desktop Chrome, including a HUD opened mid-game and one closed and reopened.`

Register the scenes in `<SpatialBoot onReady={registerScenes}>`, never at module load. In SDK 2.0 `initScene` does nothing before the runtime has booted, and the HUD would open as a default flat 1280 x 720 window (measured in the emulator on p3, 2026-09-24).

The pieces, all in `solution/src`: `bus.ts` (message types + channel), `scenes.ts` (initScene + openScene + router), `Hud.tsx` (display, `hello` on mount, intent buttons; deliberately **not** `enable-xr`, because as one big spatial panel the HUD came up blank in the emulator, so it sits flat on its own window's glass), and in `Game.tsx` the bus effect plus `useEffect(() => post(state), [hud])`.

**Expected on desktop:** "HUD window" opens a tab with the **current** score, even mid-game. Its Pause button pauses the game tab. Close it, reopen it, and the score is still right.

### Step 6 · Gotcha: a message posted just before `window.open` can vanish

When the game ends, the solution tells the already-open HUD (`gameover`) and then opens a **hall of fame** window. The obvious code is:

```ts
bus.post({ type: 'gameover', score, wave })
openScene('halloffame')                     // same task: the HUD never hears 'gameover'
```

In desktop Chrome, a `BroadcastChannel` message posted in the **same task** that opens a brand-new window was dropped for the windows already listening. This lab's automated check reproduces it: with the line above, the HUD never shows "Game over". The fix is to open the new window on a later task:

```ts
bus.post({ type: 'gameover', score, wave })
window.setTimeout(() => openScene('halloffame'), 100)
```

(Measured 2026-09-24, Chrome, SDK 2.0.0. Not yet measured inside PICO's web-app runtime; keep the deferral either way.)

### Step 7 · In the emulator

```bash
npm run dev:xr                                   # in labs/p4-space-invaders/start (or solution)
node setup/launch.mjs 4                          # from the kit root: adb reverse + http://localhost:5304/
```

By hand, without the script: `adb reverse tcp:5304 tcp:5304`, then open `http://localhost:5304/` in the emulator's PICO Browser. `http://10.0.2.2:5304/` also loads, but only as a flat tab: the emulator doesn't treat it as a secure context, so it can't become a web app, whatever PICO's docs say (measured 2026-09-24).

In the emulator's PICO Browser, click the small monitor icon just left of the star in the address bar. On OS 6.0.0 it is titled **Install app**; PICO's docs call it **Open as standalone app**. Then click **Install**, and wait up to 60 s for the `enable-xr` panels to appear (a cold launch is slow; if they are still missing, force-close and reopen the app once). The app opens in its own window; relaunch it later from its launcher tile. A browser tab is never spatial: only the installed web app's user agent carries `WebSpatial/`. The runtime badge in the bottom-right corner reads "Web app · WebSpatial on" once you're in the right place. Code edits hot-reload into the installed app, but after a **manifest** edit you must `adb uninstall <package>` (`adb shell pm list packages webapp` finds it) and install again.

> **Claude Code:** `Launch the game in the PICO emulator, open the HUD, take a burst of screenshots with node setup/snap.mjs, then close the HUD and reopen it. Tell me whether it showed the right score immediately after reopening.`

## Checkpoint

- [ ] `npm run build` / `npm run build:xr` pass. Desktop play: 0 console errors
- [ ] You can state the layer count (11, 12 with the overlay), why invaders and shield blocks are not layers, and why no layer sits inside another
- [ ] DevTools: each `.row` style shows `--xr-back` = 5 + y × 0.08 + row × 20, rising as the formation descends
- [ ] The HUD opened mid-game shows the live score, its Pause works, it recovers after close + reopen, and it shows "Game over" when the game ends
- [ ] Emulator (web app): stepped rows, an approaching formation, flinching hits, and shots flying in and out of depth

## Verified (2026-09-24)

**Desktop Chrome.** `solution/` passed 13/13 automated checks with 0 console errors:
- ready overlay shows; shooting scores; hit invaders vanish; the rows move through refs; 4 shields drawn
- each row's `--xr-back` = 5 + y × 0.08 + row × 20 (+ flinch); ship 120; shields 100
- a HUD opened mid-game shows the live score; the HUD Pause intent pauses the game; the HUD shows `paused`; a reopened HUD gets state again
- game over reaches the open HUD; the hall of fame opens with that score

Removing the Step 6 deferral makes the "game over reached the HUD" check fail, which is how the gotcha was confirmed. `start/` passed its 5 gameplay checks.

**PICO OS 6.0.0 emulator, installed web app.**
- Checked through the app's DevTools socket: every spatial child document was created and sized (5 rows at 534 x 24, shields 718 x 40, ship 44 x 20, overlay).
- The rows render stepped and march; shots fly; hits remove invaders and score (`assets/emulator/22-*.png`, `23-*.png`).
- `transform: translate()` does move `enable-xr` planes.

**Still unmeasured:** frame rate, and the buttons under a real pinch.

## Stretch goals

- **Measure the budget.** Put `enable-xr` on every invader (55 more planes) and compare `pico-cli perf` traces (L5). Then revert.
- **Depth as difficulty.** Raise `APPROACH` each wave, so later waves close in faster in Z as well as Y.
- **The UFO in a volume** (UNVERIFIED on PICO). Register a `type: 'volume'` scene (0.4 m) and, when the UFO is hit, open it showing a saucer built from `<Reality>` + `<World>` primitives (a flattened `Sphere` and a `Cylinder`). It's the p3 pattern; nobody has checked it in the emulator yet.
- **Hall of fame as a volume** (UNVERIFIED): the top three scores as podium `Box` entities with heights proportional to score.
