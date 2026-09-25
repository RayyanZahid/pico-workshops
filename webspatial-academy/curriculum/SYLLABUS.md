# PICO WebSpatial Academy: Syllabus

You take an ordinary website and make it spatial with **WebSpatial**, run it in the **PICO OS 6 emulator**, and have **Claude Code** do most of the typing, launching, screenshotting and log reading. By the end you can do it to your own site.

Machine-readable version: [`outline.json`](outline.json). Words you don't know: [`GLOSSARY.md`](GLOSSARY.md). When something breaks: [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).

## Three facts before you start

1. **WebSpatial requires React.** The open-source SDK is a React SDK. It works by replacing React's JSX runtime, and that replacement is what gives a `<div>` the `enable-xr` marker and the `--xr-*` styles. **There is no plain-HTML path today**: a vanilla page with no React gets none of it. You still write normal HTML tags and CSS inside JSX. *(webspatial.dev, Getting Started, fetched 2026-09-24.)*
2. **WebSpatial needs PICO OS 6.** PICO OS 6 (Project Swan, and the PICO Emulator) has the WebSpatial runtime built into its Web App Runtime, so there is **no packaging step**: you open a URL. PICO 4 Ultra headsets run OS 5.x and do **not** have that runtime, so a WebSpatial page falls back to a flat page there. visionOS is the other supported platform, but it needs packaging on a Mac.
3. **The SDK just moved to 2.0.** `@webspatial/react-sdk` 2.0.0 was published 2026-08-21. This course teaches **SDK 2.0.0** (`<SpatialBoot>`, one bundle, no WebSpatial build plugin). Exact pins live in [`labs/VERSIONS.md`](../labs/VERSIONS.md); if they ever differ from this page, the labs win. If you have an older 1.x project, see [TROUBLESHOOTING](TROUBLESHOOTING.md#version-drift).

## Level map

| Level | Title | You leave able to… | Lab | In-person | Self-paced |
|---|---|---|---|---|---|
| [L0](L0.md) | Setup | boot the emulator and pass `pico-cli doctor` | [`setup/`](../setup/SETUP.md) · `npm run doctor` | 25 min (install is **pre-work**) | 2 h |
| [L1](L1.md) | Hello Spatial | install a WebSpatial app as a Web App in the emulator and see it lift | [`p1-hello-spatial`](../labs/p1-hello-spatial/README.md) | 25 min | 1.5 h |
| [L2](L2.md) | Spatialize a website | lift, glass and split an existing site into two windows | [`p2-spatialize-site`](../labs/p2-spatialize-site/README.md) **(headline lab)** | 45 min | 3 h |
| [L3](L3.md) | 3D and volumes | show a model or a primitive scene in a volume and react to gestures | [`p3-volume-model`](../labs/p3-volume-model/README.md) | 30 min | 2.5 h |
| [L4](L4.md) | Depth as gameplay + multi-window | spatialize Space Invaders with depth that means something (11 planes, not 230+), plus synced HUD and hall-of-fame windows | [`p4-space-invaders`](../labs/p4-space-invaders/README.md) | 30 min | 2.5 h |
| [L5](L5.md) | Expert / agentic | let Claude Code run the build-launch-verify loop, profile, ship | [`p5-capstone`](../labs/p5-capstone/README.md) | 25 min | 4 h |
| | | | | **3 h 0 min** | **~15.5 h** |

## Official examples by level

The WebSpatial team's examples, brought into the kit where the license allows and linked where it doesn't. Full list with SDK versions and licenses: [`examples/README.md`](../examples/README.md). **Most official samples are SDK 1.x + `@webspatial/vite-plugin`: read them, don't run them on the kit.** The labs win when they disagree.

| Level | Run (SDK 2.0) | Read (1.x unless noted) |
|---|---|---|
| L0 | nothing; `npx @webspatial/starter` scaffolds a 1.x (`^1.5.0`) project, so use the labs | |
| L1 | `examples/webspatial-vite-min/` index: `<SpatialBoot>` + a 3×3 `enable-xr` grid (port 5501) | |
| L2 | | sample-techshop, WebSpatialPlayground |
| L3 | `examples/webspatial-vite-min/` index: `<Reality>` scene graph + `<Model>` | sample-solarsystem (1.6) |
| L4 | lab p4 is the 2.0 reference | widget-generator (multi-scene widgets) |
| L5 | `webspatial-vite-min/xr-monitor.html`, `eager-lean.html` | webspatial-sdk `apps/spatial-next-min`, `spatial-remix-min`, `spatial-rspack-min`, `test-server` (all **2.0**, MIT) |

## Prerequisites per level

**Get the kit first** (public repo, folder `webspatial-academy/`):

```bash
git clone https://github.com/RayyanZahid/pico-workshops.git
cd pico-workshops/webspatial-academy
npm run labs:install     # one npm workspace installs every lab (SDK 2.0.0 pinned)
npm run doctor           # node setup/doctor.mjs: tells you your track (emulator or web-only)
```

| Level | You need |
|---|---|
| L0 | Git and Node, to clone and install the kit (above). A Windows 10/11 or Apple Silicon Mac with **16 GB RAM minimum (32 GB is comfortable)**, ~40 GB free disk, an **NVIDIA GeForce GTX 1060** or better (Apple Silicon: integrated GPU), admin rights, **Node 20.19+ or 22.12+**, and a Claude Pro/Max/Team/Enterprise/Console account. Exact versions and install commands: [`setup/DEPENDENCIES.md`](../setup/DEPENDENCIES.md). Machines that can't run the emulator do every lab on the **web-only track** (desktop browser, flat fallback). A PICO developer account. For the emulator: **Android Studio 2025.1.x** (not "latest") + the **PICO Spatial (Global)** plugin. The emulator download is ~4.3 GB, so do this **before** the workshop. |
| L1 | L0 green. Basic HTML/CSS. You have seen a React component before (you don't need to be fluent). |
| L2 | L1 green. Comfortable with CSS `position`, flex/grid. |
| L3 | L2. Knowing that a GLB is a 3D model file is enough; no 3D math beyond "metres and radians". |
| L4 | L2. Comfortable reading a `requestAnimationFrame` game loop and React refs. You know what `window.open` and `postMessage`-style messaging do. |
| L5 | L1 to L4. Your own site's repo (React, or willing to wrap it in React). |

## Learning objectives

**L0 Setup.** Install Node 20.19+/22.12+ and Claude Code (native installer). Install pico-cli and get `pico-cli doctor` clean or explained. Wire PICO's plugin skills and knowledge MCP into Claude Code. Boot the PICO OS 6 emulator from the command line. Reach your dev server from the emulator with `adb reverse` + `http://localhost:<port>/`, and explain why that (a secure context) and not `10.0.2.2`.

**L1 Hello Spatial.** Explain WebSpatial vs WebXR. Tell a window from a volume. Say why React is required. Set up `jsxImportSource`, `<SpatialBoot>` and a minimal PWA manifest. Open the app in the PICO Browser and install it as a Web App (the Install app icon).

**L2 Spatialize a website.** Use the `enable-xr` marker. Lift elements with `--xr-back`, make the window glass transparent, and give cards a translucent material with `--xr-background-material`. Open a second window with `initScene` + `window.open(url, name)`. Keep the desktop site identical.

**L3 3D and volumes.** Open a volume scene sized in metres. Show a GLB with `<Model enable-xr>`. Compose `<Reality>` + `<World>` + primitives. Handle `onSpatialTap` / `onSpatialDrag` / `onSpatialRotate` / `onSpatialMagnify`. Feature-detect with `WebSpatialRuntime.supports`. Keep models small.

**L4 Depth as gameplay + multi-window.** Spatialize Space Invaders in a glass window: rows at absolute depths `5 + y × 0.08 + row × 20`, shields at 100, the ship at 120, shots travelling in Z both ways, and hit rows flinching +24, all written from the game loop through refs. Budget layers: one per container, not per sprite, never nested, and kept modest so nothing projects below the window (11 planes). Add HUD and hall-of-fame windows with `initScene` (type as the third argument), sync them over `BroadcastChannel` with a late-join handshake, and handle the post-then-open gotcha. `git diff --no-index start/src solution/src` is the lesson.

**L5 Expert / agentic.** Hand Claude Code the whole loop (edit, serve, launch, capture, log, judge, fix) with evidence at each step. Ground PICO answers in the knowledge MCP. Profile with `pico-cli perf`. Ship over HTTPS and launch via manifest. Capstone: spatialize your own site.

## The 3-hour in-person run

| Clock | Block | Notes for the facilitator |
|---|---|---|
| 0:00 | **L0 check-in** (25) | Everyone runs `pico-cli doctor` and `pico-cli emulator start`. Anyone whose emulator isn't installed pairs with someone whose is. Don't try to install Android Studio in the room. |
| 0:25 | **L1** (25) | 10 min concept, 15 min lab. Success = the app installed as a Web App and the card lifted (allow up to 60 s after launch; if panels are still missing, close and reopen the app once). |
| 0:50 | **L2** (45) | The headline block. 10 min concept, 35 min lab. Success = before/after screenshots. |
| 1:35 | Break (10) | Emulators stay running. |
| 1:45 | **L3** (30) | Teach `<Model>` first; `<Reality>` is optional stretch. |
| 2:15 | **L4** (30) | Start from the flat game; the win moment is seeing rows at different depths. HUD window is stretch if the room is behind. |
| 2:45 | **L5** (15 in the room) | Demo the agent loop on one attendee's site, then assign the capstone as take-home. |
| 3:00 | End | |

Total teaching time is 170 minutes plus the 10-minute break. L5 is 25 in `outline.json`: 15 is in the room and 10 is the capstone kickoff, which people take home.

## Self-paced run

Do one level per sitting. Don't start a level until the previous lab's "done when" check passes. Budget more for L0 than you think: the emulator install is the slowest step of the whole course, and on a 16 GB machine you'll need to close other apps to boot it.

## You're an expert when you can…

- [ ] Explain in two sentences why WebSpatial is not WebXR, and pick the right one for a given idea.
- [ ] Take any React site and ship a spatial version whose desktop build is byte-for-byte the same experience.
- [ ] Predict, before you run it, which plane an element with `--xr-back` will float in front of.
- [ ] Say which `--xr-*` property applies to which element type, and what unit it takes, without looking.
- [ ] Configure the start scene in the manifest and every other scene with `initScene`, and explain why the start scene can't use `initScene`. Know that on PICO OS 6.0.0 windows were observed opening at 1280×720 regardless, and design pages to fit it without scrolling.
- [ ] Put a GLB in a volume with a poster, an error path and a flat fallback, and keep it under a size you can defend.
- [ ] Build a three-scene app whose state survives any scene being closed and reopened.
- [ ] Get a Chrome DevTools console on a scene running in the emulator.
- [ ] Record a perf trace and name the top cost.
- [ ] Hand Claude Code a spec and get back a working, screenshot-verified spatial change without touching the emulator yourself, and catch it when its evidence doesn't support its claim.
- [ ] Say which claims about your app are proven on the emulator and which would need real PICO OS 6 hardware.

## Sources

- webspatial.dev docs (Getting Started, Concepts, React SDK API pages for JSX markers, `back`, `background-material`, `depth`, Spatial Transform, `initScene`, scene options, `main_scene`, `<SpatialBoot>`, `<Model>`, `<Reality>`, events, `userAgent`, `useMetrics`, Minimal PWA), fetched 2026-09-24.
- `@webspatial/react-sdk@2.0.0` npm tarball: `dist/index.d.ts` and `README.md`, read 2026-09-24.
- `pico-cli` 0.5.0 `--help` output on the course author's machine, 2026-09-24.
- SDK 1.x project notes (verified on 1.7.0, desktop only), `projects/pico-vibe-xr/docs/WEBSPATIAL.md`, `projects/webspatial/PICO-EMULATOR.md`, `projects/pico-dev/kb/` recipes and gotchas.
