# Versions the labs pin

Checked against npm on 2026-09-24. Every lab builds and runs on exactly these versions.

| Package | Pinned (package.json) | Resolved (package-lock) | Notes |
|---|---|---|---|
| `@webspatial/react-sdk` | **2.0.0** exact | 2.0.0 | Latest on npm. Most tutorials and older demos use 1.x (1.7.0); 2.0 changed how the runtime loads, see below |
| `@webspatial/core-sdk` | **2.0.0** exact | 2.0.0 | Must match react-sdk (it is a peer dependency) |
| `@webspatial/vite-plugin` | **not used** | | 1.0.1 is the latest and it **breaks the build on SDK 2.0**, see below |
| `react` / `react-dom` | ^19.2.8 | 19.3.0 | SDK needs React 18+ |
| `vite` | ^8.2.0 | 8.3.1 | |
| `@vitejs/plugin-react` | ^6.0.4 | 6.1.1 | Carries `jsxImportSource` |
| `typescript` | ~6.0.2 | 6.0.3 | |
| **Node** | `^20.19.0 \|\| >=22.12.0` | | Vite 8's floor. Kit recommends 24 LTS |

The lockfile (`labs/package-lock.json`) ships with the kit, so `npm install` reproduces the resolved column exactly.

**Proven on PICO OS 6 (emulator-lab, 2026-09-24):** Lab 1's solution was installed as a web app in the OS 6.0.0 emulator. Inside the web app:
- the user agent reads `... PicoWebApp/0.4.0 (like PicoBrowser) Chrome/138 WebSpatial/1.5.0 ...`;
- `<html>` got `is-spatial`;
- `__webspatialsdk__` reported react-sdk 2.0.0;
- the runtime opened a `?command=createSpatialized2DElement` child document, which means the `enable-xr` card was spatialized.

So the SDK 2.0 bundle with no plugin and no `XR_ENV` works on PICO. In a plain browser tab the UA has **no** `WebSpatial/` token, so the page stays flat until it is installed and opened as a web app.

## What changed between SDK 1.7 and 2.0, and why there is no vite-plugin

**1.7 (older projects):** two builds. `@webspatial/vite-plugin` aliased the SDK to `@webspatial/react-sdk/web` for the plain web build and to `/default` for the XR build (`XR_ENV=avp`).

**2.0 (these labs):** one build. The SDK now ships a lean default entry plus a lazily loaded `spatial` chunk. At load time it reads the user agent, and `<SpatialBoot>` pulls in the spatial chunk only inside a WebSpatial runtime. The `/web` and `/default` entries no longer exist; the exports are `.`, `./eager`, `./spatial`, `./jsx-runtime`, `./jsx-dev-runtime` and `./experimental`.

So vite-plugin 1.0.1 cannot resolve its own alias. Reproduced on 2026-09-24 with SDK 2.0.0 + vite-plugin 1.0.1 + Vite 8.3.1: both `vite build` and `XR_ENV=avp vite build` fail with

```
"./web" is not exported under the conditions ["module", "browser", "production", "import"]
from package @webspatial/react-sdk
```

**There is no PICO `XR_ENV` value.** In `@webspatial/shared` 0.2.0, the plugin's only dependency, `getEnv()` is `return env === "avp" ? "avp" : void 0`. PICO is detected at runtime instead: `@webspatial/react-sdk` 2.0.0 `dist/chunk-GG2QK5MA.js`, `inferPicoOs(ua) = /PicoWebApp\//i.test(ua) || /PicoBrowser/i.test(ua)`, which gives runtime type `picoos`. The SDK's capability table has PICO OS rows 0.1.1 to 0.4.90.

So in every lab:

- `dev` = `vite --port <p>`: localhost only, for your desktop browser.
- `dev:xr` = `vite --host 0.0.0.0 --port <p>`: the same app, bound to IPv4 so the emulator reaches it (`node setup/launch.mjs <n>` runs `adb reverse tcp:<p> tcp:<p>` and opens `http://localhost:<p>/`).
- `build` and `build:xr` run the same build. There is one bundle; the headset decides at runtime. `build:xr` exists so the command names line up with `dev:xr`.

## The three lines that replace the plugin

```ts
// vite.config.ts
react({ jsxImportSource: '@webspatial/react-sdk' })
```
```jsonc
// tsconfig.json
"jsx": "react-jsx", "jsxImportSource": "@webspatial/react-sdk"
```
```tsx
// main.tsx: register scenes in onReady. initScene before boot is a silent no-op in 2.0
<SpatialBoot onReady={registerScenes} onError={...}><App /></SpatialBoot>
```

Proof they took effect: in dev, `http://localhost:<p>/src/App.tsx` (open it in a browser) imports `@webspatial_react-sdk_jsx-dev-runtime.js`, and `window.__webspatialsdk__` reads `{ "react-sdk-version": "2.0.0" }`. A production build emits a separate `spatial-*.js` chunk of about 137 kB, which only a WebSpatial runtime downloads.

## Upgrading later

`npm view @webspatial/react-sdk version`. If a new vite-plugin appears that targets 2.x, the labs do not need it; the three lines above are the whole integration.
