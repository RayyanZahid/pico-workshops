# Glossary

Alphabetical. **(L*n*)** is the level that teaches the term.

| Term | Meaning |
|---|---|
| **10.0.2.2** | Inside an Android-based emulator, the fixed alias for the **host machine's** localhost. PICO's docs suggest it for the emulator, but `10.0.2.2` loads but was not a secure context in our test (no install); use `localhost`. (VERIFIED 2026-09-24) (L0, L1) |
| **adb** | Android Debug Bridge. How pico-cli, and you, talk to the emulator or a device: install, logs, shell, port forwarding. (L0) |
| **`adb reverse`** | `adb reverse tcp:5301 tcp:5301` makes the emulator's `localhost:5301` reach your laptop's. **The course's way in**: `localhost` is a secure context, so the page can be installed or opened as a Web App. (L0, L1) |
| **Secure context** | HTTPS or `localhost` (`window.isSecureContext === true`). Required before a page can be installed or opened as a PICO Web App. (L1) |
| **Agent Host** | pico-cli's name for a coding agent it configures (`claude-code`, `codex`, `cursor`, …). (L0) |
| **`AttachmentAsset` / `AttachmentEntity`** | Declare live HTML inside `<Reality>`, then attach it to a plane in 3D. (L3) |
| **Backplate** | The plane behind a window scene or a spatialized element. Can be opaque, glass (`translucent`) or invisible (`transparent`). (L2) |
| **`baseplateVisibility`** | Volume option: show (`automatic`) or hide (`hidden`) the base under a volume. (L3) |
| **Claude Code** | Anthropic's agentic coding tool. The course's hands. (L0, L5) |
| **Containing block** | CSS: the box an element is positioned relative to. Marking an element `enable-xr` makes it a containing block. (L2) |
| **`defaultSize`** | Scene option: the requested initial `width` / `height` (/ `depth` for volumes). Numbers are px; strings take units (`"0.6m"`). The OS may adjust it. (L2, L3) |
| **`enable-xr`** | The JSX marker that turns an element into a **spatialized HTML element**. Also spelled as the class `__enableXr__` or the style `enableXr: true`. (L2) |
| **`enable-xr-monitor`** | Marker for a parent whose child changes can move spatialized children, so the SDK re-syncs them. (L2) |
| **Entity** | A 3D object inside `<Reality>`'s `<World>`: `Box`, `Plane`, `Sphere`, `Cone`, `Cylinder`, `ModelEntity`, `AttachmentEntity`, or the invisible group `Entity`. Sized in metres. (L3) |
| **GLB / glTF** | The standard binary 3D model format (`model/gltf-binary`). USDZ is Apple's. (L3) |
| **`initScene`** | `initScene(name, prev => config, { type })` sets up the scene that `window.open(url, name)` will create. Must be called after `<SpatialBoot>` has booted (use `onReady`; before boot it's a silent no-op in SDK 2.0) and before opening. (L2, L4) |
| **Layer budget** | The number of `enable-xr` elements (native planes) a scene keeps alive and updates. Spend it on containers whose depth differs (a row), not on every sprite inside them. The L4 game uses 11, against 230+ per-sprite. (L4) |
| **JSX runtime / `jsxImportSource`** | The functions JSX compiles into. Pointing `jsxImportSource` at `@webspatial/react-sdk` is how WebSpatial sees your elements. This is why WebSpatial requires React. (L1) |
| **Manifest (Web App Manifest)** | The PWA JSON file (`app.webmanifest`) with `name`, `start_url`, `display`, `icons`, and WebSpatial's `xr_main_scene`. Required for installing it as a Web App (Install app icon). Changing it later means uninstalling and reinstalling the app. (L1, L4) |
| **`<Model>`** | Static 3D container: shows a model file. Needs `enable-xr` to go spatial. (L3) |
| **PICO Emulator licence** | The PICO Emulator is PICO-licensed; this workshop's attendees are cleared by PICO. Check with PICO before publishing OS screenshots outside the workshop. (L0) |
| **pico-cli** | PICO's command line: emulator, device, app, log, capture, perf, knowledge, web, setup, doctor. (L0) |
| **pico-dev-knowledge** | The MCP server (from `pico-cli knowledge`) that lets Claude Code query PICO's developer docs. (L0, L5) |
| **PICO Emulator** | A PICO OS 6 (Project Swan) device running on your computer, installed through Android Studio + the PICO Spatial plugin. (L0) |
| **PICO OS 6** | PICO's OS for Project Swan. Its Web App Runtime includes the WebSpatial runtime. (L0, L1) |
| **PICO 4 Ultra** | Earlier PICO headset on OS 5.x. No WebSpatial runtime; WebSpatial pages render flat there. (L0) |
| **`PicoWebApp/`** | Token in `navigator.userAgent` inside PICO OS 6's Web App Runtime. (L1) |
| **Progressive enhancement** | Same code, flat on ordinary browsers, spatial where a runtime exists. WebSpatial's `--xr-*` and markers are ignored outside a runtime. (L2) |
| **PWA** | Progressive Web App: a site with a manifest that can run like an installed app. (L1) |
| **px (point)** | WebSpatial's unit for `--xr-back`, `--xr-depth`, `translateZ`, and event coordinates. Convert to metres with `useMetrics`. (L2, L3) |
| **`<Reality>`** | Dynamic 3D container: assets (`Material`, `ModelAsset`, …) as direct children, entities inside `<World>`. (L3) |
| **Install app (icon)** | The monitor icon, titled **Install app** on OS 6.0.0 (PICO's docs call it "Open as standalone app"), just left of the star in the PICO Browser address bar. Install creates a Web App (its own package and launcher tile) that runs in the **Web App Runtime**, where WebSpatial is active. webspatial.dev calls it "Run as a standalone app". Needs a secure URL (HTTPS or `localhost`) inside a manifest's `scope`. VERIFIED 2026-09-24. (L1) |
| **Web App Runtime** | PICO OS 6's runtime for standalone Web Apps. It has WebSpatial built in; a browser tab does not. Detect with `matchMedia('(display-mode: standalone)')`. (L1) |
| **display-mode** | CSS media feature / `matchMedia` query: `browser` in a tab, `standalone` or `minimal-ui` in the Web App Runtime. (L1) |
| **Scene (Spatial Scene)** | A window or volume the OS places in space. Each page opened in a new window is a scene. (L1, L4) |
| **Scope (manifest)** | The URL range that belongs to the app. `window.open` inside scope makes a scene; outside, it opens the browser. (L2, L4) |
| **Spatial gesture events** | `onSpatialTap`, `onSpatialDragStart/Drag/DragEnd`, `onSpatialRotate(/End)`, `onSpatialMagnify(/End)`. JSX props only. (L3) |
| **Spatial transform** | Ordinary CSS `transform` (`translateZ`, `rotateX/Y`, `scale3d`) that becomes real 3D on spatialized elements. (L2) |
| **Spatialized HTML element** | An element marked `enable-xr`: keeps its CSS X/Y layout, becomes a floating plane, and can take `--xr-*` styles and spatial events. Don't nest one inside another: on PICO OS 6.0.0 nested ones never rendered. (L2, L4) |
| **`<SpatialBoot>`** | SDK 2.x root wrapper. Loads the spatial part of the SDK only in a WebSpatial runtime and renders children once it's ready. (L1) |
| **Start scene** | The first scene, created from `start_url` before code runs. Configured only via `xr_main_scene` in the manifest. (L4) |
| **Volume** | A scene type with depth that behaves like a physical object. (L1, L3) |
| **WebSpatial** | Open-source extensions to HTML/CSS/DOM plus a React SDK that make web content native spatial UI. (L1) |
| **WebSpatial Builder** | `@webspatial/builder`, which packages a site into a native app for platforms without a built-in runtime (visionOS). Not needed for PICO OS 6. (L5) |
| **`WebSpatialRuntime.supports(key)`** | Feature detection: `'Model'`, `'Reality'`, `'VolumeScene'`, `'SpatialDragEvent'`, `'-xr-back'`, … (L3) |
| **WebXR** | The W3C API for immersive VR/AR sessions drawn on a canvas. A different model from WebSpatial. (L1) |
| **Window (scene)** | The default scene type: a 2D panel for GUI that keeps constant apparent size. (L1) |
| **`worldScaling`** | Volume option: `automatic` (scales with distance like an object) or `dynamic` (constant apparent size). (L3) |
| **`xr_main_scene`** | Manifest key for the start scene: `type`, `default_size`, `resizability`, `world_scaling`, `world_alignment`, `baseplate_visibility`. (L4) |
| **`--xr-back`** | CSS custom property: the Z offset of a spatialized element, in px. Needs `position` relative, absolute or fixed. (L2) |
| **`--xr-background-material`** | CSS custom property: `translucent`, `transparent` or `none`, on `html` (the window) or spatialized elements. (L2) |
| **`--xr-depth`** | CSS custom property: the depth of a `<Model>` / `<Reality>` container, in px. (L3) |
| **`xrOffsetBack`, `xrClientDepth`, `xrInnerDepth`** | DOM read-backs on refs and `window`: how far an element is lifted, a container's depth, a volume's depth. (L3) |
