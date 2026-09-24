# p5 · Capstone: spatialize YOUR site

## Goal

Take a React + Vite site you care about (yours, your company's, or the Night Market template here) and ship a spatial version of it that still works as a normal website. Claude Code does the typing. You make the design calls and check the evidence.

## What you'll learn

- A repeatable conversion order: wire → glass → depth → windows → volumes
- Where depth helps and where it's noise, and how to spend a layer budget
- Replacing desktop-only idioms (fixed overlays, modals) with spatial ones (a window of its own)
- Letting the agent run the loop (build → launch → screenshot → logs → fix) while you judge the results

```
template/   Night Market, a flat site to practise on if you don't bring your own   npm run dev -> :5305
solution/   Night Market spatialized, one reference answer at "expert"             npm run dev -> :5315
```

## Bring your own site: what works

- **React 18+ with Vite** is the smooth path. The WebSpatial SDK is a React SDK; there is no plain-HTML path.
- Next.js / Remix / Rspack work too, but need the SSR or Rspack setup from webspatial.dev (How-to: SSR, Rspack). Budget extra time.
- Plain HTML, Vue, Svelte: use `template/`, or port one page to React first.
- Put your project **outside** `labs/`, or copy it to `labs/p5-capstone/mine/` if you want the shared `node_modules` and the `@pico/theme` alias (copy `template/vite.config.ts`).

## The checklist

Tick these in order. Each block works on its own, so you can stop after any of them with a working site.

**A. Wired (required)**
- [ ] `@webspatial/react-sdk` + `@webspatial/core-sdk` **2.0.0**, and **no** `@webspatial/vite-plugin`
- [ ] `jsxImportSource: '@webspatial/react-sdk'` in `tsconfig.json` **and** in the JSX plugin of the bundler config
- [ ] The app wrapped in `<SpatialBoot>`; `window.__webspatialsdk__` shows `2.0.0`
- [ ] `public/app.webmanifest`: `name`, `start_url`, `scope`, `display: minimal-ui`, icons (192, 512, 1024, 1024 maskable, relative paths), `xr_main_scene.default_size`, linked from `index.html` and served as JSON (`application/manifest+json`)
- [ ] A runtime badge (copy `src/RuntimeBadge.tsx`) so anyone can see browser tab vs web app
- [ ] `npm run build` passes; the desktop site is unchanged, with 0 console errors

**B. Glass**
- [ ] `html { --xr-background-material: translucent }`, plus a transparent `body` background under `html.is-spatial`
- [ ] All `--xr-*` styles in one file (`spatial.css`)

**C. Depth**
- [ ] 3 to 8 `enable-xr` elements, each on a **container** (a nav, a card, a panel), never on every list item
- [ ] Every one is positioned (`relative` / `absolute` / `fixed`)
- [ ] A small depth ladder you can write down, for example nav 16 · sections 24 · cards 36/56 · hero 90
- [ ] Glass elements drop their own flat background in the headset

**D. Windows**
- [ ] At least one extra `type: 'window'` scene: `initScene(name, cfg, { type })` registered in `<SpatialBoot onReady>`, so after boot and before any `window.open(url, name)`
- [ ] Routed by `?scene=` in `main.tsx`; desktop still opens it as a tab
- [ ] Any fixed full-screen overlay (modal, lightbox, drawer) becomes a window in the headset, and stays an overlay on desktop

**E. Volume (expert)**
- [ ] One `type: 'volume'` scene in metres, with `<Model>` (a GLB you've checked for size and license) or `<Reality>` + `<World>` + primitives
- [ ] Gated on `useSpatialReady()` + `WebSpatialRuntime.supports(...)`, with a flat fallback that isn't empty

**F. Evidence**
- [ ] Emulator screenshots (burst, via `node setup/snap.mjs`) of every scene, and the last 100 log lines at `-l E` read and explained
- [ ] A 3-line write-up: what's spatial, the layer count, one thing you chose **not** to spatialize and why

## Rubric

| Tier | You have | It shows you can |
|---|---|---|
| **Beginner** | Block A + B. One or two `enable-xr` elements lifted with `--xr-back`. Runs as a standalone app in the emulator. | Wire WebSpatial into a real project without breaking the web build |
| **Intermediate** | A to D. A deliberate depth ladder across 3 to 8 layers, glass elements, and one extra window that opens from the page and works on desktop. | Design with depth and scenes, not just turn them on |
| **Expert** | A to F. A volume with a model or primitives plus a fallback, overlays replaced by windows in the headset only, cross-window state if your windows share data (BroadcastChannel + hello), and a written layer budget. Evidence from the emulator for every scene. | Ship a spatial product and prove it works |

`solution/` is one expert-tier answer for Night Market: 5 kinds of spatial element (nav 16, hero 90, vendor cards 36 and 56 by row, visit panel 24), a **stall** window that replaces the modal in the headset only, and a **lanterns** volume built from five sphere + cylinder primitives.

## The prompts

Run `claude` inside your project. Each prompt is one step; review the diff before the next.

**0. Plan (read-only)**
```text
Read this project and plan how to spatialize it with WebSpatial SDK 2.0.0 in five steps: wire
(SDK, jsxImportSource in tsconfig AND the bundler's JSX plugin, SpatialBoot, manifest), glass
window, a depth pass on 3-8 container elements, one extra window scene, and optionally one
volume. For each step list the files you would touch. Flag anything that will fight WebSpatial:
SSR, a non-Vite bundler, fixed overlays, aspect-ratio grids, CSS animations on elements I'd
spatialize. Do not edit anything yet.
```

**1. Wire**
```text
Do step 1 only: install @webspatial/react-sdk and @webspatial/core-sdk at exactly 2.0.0 (never
@webspatial/vite-plugin; it breaks 2.0), set jsxImportSource '@webspatial/react-sdk' in
tsconfig.json and in the React plugin of the bundler config, wrap the root in <SpatialBoot>, add
public/app.webmanifest (name, start_url "/", scope "/", display minimal-ui, icons 192/512/1024
plus a 1024 maskable with no transparency, xr_main_scene default_size) and link it. Build, run the dev
server, and confirm window.__webspatialsdk__ reports 2.0.0 and the console is clean.
```

**2. Glass + depth**
```text
Create src/spatial.css (imported last) and do the glass + depth pass: html gets
--xr-background-material: translucent; add an is-spatial class on <html> when the user agent
matches /WebSpatial\//, and make the body background transparent under it. Then pick 3-8
CONTAINER elements (not list items), add enable-xr, make sure each is positioned, and give them
a depth ladder with the most important content closest. Put every --xr-* style in spatial.css.
Show me the ladder as a table and count the enable-xr elements.
```

**3. Windows**
```text
Find any fixed full-screen overlay (modal, drawer, lightbox) or secondary page that deserves its
own window. Register it with initScene(name, cfg, { type: 'window' }) inside <SpatialBoot onReady={...}> (initScene before boot is a silent no-op in SDK 2.0),
route it with ?scene=<name> in main.tsx, and open it with window.open(url, name), where the
second argument equals the initScene name. In the headset (useSpatialReady()), open the window;
on desktop, keep the existing overlay.
```

**4. Volume (expert)**
```text
Add one volume scene, sized in metres, that shows something 3D that belongs to this site: a GLB
with the WebSpatial <Model> (enable-xr, poster, onLoad/onError; check its size and license first),
or <Reality> with <Material> declarations and primitives inside <World>. Gate it on
useSpatialReady() && WebSpatialRuntime.supports(...) and give desktop a real fallback.
```

**5. The loop (let the agent drive)**
```text
Run the whole loop without asking me: npm run build, npm run dev:xr in the background,
node setup/launch.mjs with my port, node setup/snap.mjs for every scene, then pico-cli log
-d emulator-5554 -l E -n 100. Fix anything broken and repeat until each scene screenshot matches
the checklist in labs/p5-capstone/README.md. Stop and show me the evidence: screenshot paths,
the log lines, and the layer count.
```

**6. Review**
```text
Grade this project against the rubric in labs/p5-capstone/README.md. Name the tier I'm at, the
unchecked boxes, and the single change that would move me up a tier.
```

## Gotcha: size a `<Reality>` with real units, or the volume is empty

"Lanterns in 3D" first shipped as `<Reality style={{ width: '100%', height: '100%' }}>` on a page whose `#root` has no height. In the PICO OS 6.0.0 emulator the volume opened as **empty glass**. The entities were created (logcat showed `create entity`, `add ModelComponent`, `add CollisionComponent`), but inside a container of zero height. A percentage height of an auto-height parent is 0; measured in Chrome it's `height: 100%` → 0 px, `100vh` → 720 px. The fix is one line: `style={{ width: '100vw', height: '100vh' }}`, or give `html, body, #root` a height first, as p3 does.

Ruled out along the way: React StrictMode (a production build was just as empty). The runtime also logs `E SpatialPack_SceneInspector ... component ModelComponent already exists` once per geometry entity, with or without StrictMode. It appears to be noise, but it isn't explained.

**Status:** fixed and verified in the emulator (2026-09-24, 16:40): five glowing lanterns render in the 0.6 m volume.

## Try the reference

```bash
cd labs/p5-capstone/solution
npm run dev                                   # http://localhost:5315/   (?scene=stall&id=taco, ?scene=lanterns)
```

In the emulator, from the kit root:

```bash
node setup/launch.mjs 5 --solution --serve    # starts dev:xr, adb reverse, opens http://localhost:5315/
```

Then, in the emulator's PICO Browser, click the small monitor icon just left of the star in the address bar. On OS 6.0.0 it is titled **Install app**; PICO's docs call it **Open as standalone app**. Then click **Install**, and wait up to 60 s for the `enable-xr` panels to appear (a cold launch is slow; if they are still missing, force-close and reopen the app once). The app opens in its own window; relaunch it later from its launcher tile. A browser tab is never spatial: only the installed web app's user agent carries `WebSpatial/`. The runtime badge in the bottom-right corner reads "Web app · WebSpatial on" once you're in the right place. Code edits hot-reload into the installed app, but after a **manifest** edit you must `adb uninstall <package>` (`adb shell pm list packages webapp` finds it) and install again.

By hand, without the script: `adb reverse tcp:5315 tcp:5315`, then open `http://localhost:5315/` in the emulator's PICO Browser. `http://10.0.2.2:5315/` also loads, but only as a flat tab: the emulator doesn't treat it as a secure context, so it can't become a web app, whatever PICO's docs say (measured 2026-09-24).

## Stretch goals

- Deploy your spatial site over HTTPS (any static host) and install it on the emulator from its manifest: `pico-cli web launch --manifest-url https://<host>/app.webmanifest`
- Record a 10-second perf trace with a window and the volume open (`pico-cli perf trace record`, then `perf trace analysis`), and cut your layer count until the top cost changes
- Ask the `pico-dev-knowledge` MCP what PICO recommends for window sizes and text legibility, and audit your `xr_main_scene` size against it, citing the source
