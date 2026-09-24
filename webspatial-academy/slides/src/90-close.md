=== close-s1 concept
# You're an expert when you can...
lead: Take the list home and tick it honestly.

- Explain in two sentences why WebSpatial is not WebXR.
- Ship a spatial version of any React site whose desktop build is unchanged.
- Say which `--xr-*` property applies to which element, and in what unit.
- Put a GLB in a volume with a poster, an error path and a flat fallback.
- Build a multi-scene app whose state survives any scene closing.
- Hand Claude Code a spec and catch it when its evidence doesn't support its claim.

::: notes
Abridged from the SYLLABUS "You're an expert when you can..." list. The full list has eleven items.
:::

=== close-s2 concept
# Troubleshooting: "it looks flat"
eyebrow: Troubleshooting · Check top to bottom


| Symptom | Check / fix |
|---|---|
| Flat in a browser tab | A tab is **never** spatial. Install it: the monitor icon, titled Install app on OS 6.0.0 (PICO's docs call it Open as standalone app), just left of the star → Install |
| Installed, still flat | **Wait up to 60 s**; if the panels are still missing, close and reopen the app once |
| Second window blank | The page is wrapped in `enable-xr`; remove it |
| Some panels render, others don't | An `enable-xr` nested inside another `enable-xr`: it never renders on PICO OS 6.0.0. Un-nest |
| No install offered at `10.0.2.2` | 10.0.2.2 loads but was not a secure context in our test (no install); use localhost. `node setup/launch.mjs <n>` opens localhost for you |
| No install offered at localhost | Manifest missing, unlinked, or lacking `name` / `start_url` / `icons` / `display` |
| Changed the manifest, nothing changed | The installed app keeps the old one: uninstall (`adb uninstall <pkg>`) and install again |
| Volume or window opens flat at 1280×720 | `initScene` ran before boot finished, so it did nothing. Register scenes in `<SpatialBoot onReady>` |
| Installed, UA has `WebSpatial/`, still inert | App not wrapped in `<SpatialBoot>`: in 2.0 spatial code loads only inside it |
| Still inert with `<SpatialBoot>` | `jsxImportSource` missing in the tsconfig **or** in `react({ jsxImportSource })` in `vite.config.ts` |
| One element won't lift | No `enable-xr`, or no `position: relative / absolute / fixed` |
| Glass looks solid | Your own `background` covers the material; clear it in spatial mode |


::: notes
Root cause and first five rows: labs/SPATIAL-CRACK.md (VERIFIED on the OS 6.0.0 emulator, 2026-09-24): only an installed Web App's UA contains WebSpatial/, and the SDK checks for exactly that. Other rows: curriculum/TROUBLESHOOTING.md.
:::

=== close-s3 concept
# Troubleshooting: setup and the emulator
eyebrow: Troubleshooting · Setup, emulator, network

| Symptom | Check / fix |
|---|---|
| PICO Spatial plugin won't install | Android Studio must be **2025.1.x**, not the latest |
| Emulator dies: `QEMU main loop exits abnormally` | Not enough free RAM; the real message is on **stderr**. Use the 16 GB recipe |
| "Site can't be reached" at `localhost:<port>` | Dev server not running, or the `adb reverse` mapping is gone (it resets when the emulator restarts): rerun `node setup/launch.mjs <n>` |
| Still unreachable | Wrong port, or the firewall blocks Node on private networks |
| Knowledge MCP stopped answering | `pico-cli setup` ran while sessions were open; restart Claude Code |
| Install fails, logcat says `manifest is empty` | Manifest icons rejected (seen with one SVG icon): ship PNG icons with real `sizes` (192, 512, 1024 + maskable) |
| One screenshot is mostly black | Capture artefact, not your page: use `node setup/snap.mjs` (burst) |
| HUD misses a message sent as it opened | Chrome drops a BroadcastChannel post made in the same task as `window.open`: post, then `setTimeout(() => window.open(url, name), 100)` |

::: notes
Rows from curriculum/TROUBLESHOOTING.md "Setup and emulator" and "Reaching the dev server", plus the kit CLAUDE.md screenshot rule.
:::

=== close-s4 concept
# PICO Early Access Developer Program
eyebrow: From PICO · David Oh's slide 12
lead: Where tonight's build can go next. Quoted exactly from his slide:
img: ../partner/pico-cli-quickstart-david-oh/slides/slide-12.png | David Oh's slide 12, unmodified: PICO Early Access Developer Program

> PICO EARLY ACCESS DEVELOPER PROGRAM
> Invitees get up to $1500 for publishing their AI generated application
> October 1-Nov 11 2026
> Hardware Access

[Open slide 12 in David Oh's deck](../partner/pico-cli-quickstart-david-oh/index.html#12)

::: notes
Quote copied from partner/pico-cli-quickstart-david-oh/slides.md, "Slide 12", which is the verbatim text of the unmodified .pptx. Eligibility, how to get invited and the terms are PICO's to answer; point questions to David.
:::

=== close-s5 concept
# Official examples
eyebrow: From the WebSpatial team · Run one, read the rest
lead: One SDK 2.0 example runs in the kit. The rest are linked, mostly SDK 1.x.
img: ../examples/webspatial-vite-min/screenshot.png | webspatial-vite-min in desktop Chrome, the flat fallback: a 3x3 enable-xr grid, an empty Reality box and a Model placeholder that fill in once it runs as a PICO Web App

```cmd
cd examples/webspatial-vite-min
```

```cmd
npm run dev:xr   # port 5501
```

```cmd
node setup/launch.mjs --url http://localhost:5501/   # 2nd terminal
```

| Linked | Level | SDK |
|---|---|---|
| sample-techshop, WebSpatialPlayground | L2 to L4 | 1.x |
| sample-solarsystem, widget-generator | L3, L4 | 1.x |
| webspatial-sdk `apps/*` (Next, Remix, Rspack) | L5 | **2.0** |

::: notes
Run the launch command from the kit root in a second terminal, then install the example as a Web App. Source: examples/README.md (examples-scout). Every standalone sample repo is SDK 1.x with @webspatial/vite-plugin, which fails to build on 2.0; only the apps/* fixtures in the webspatial-sdk monorepo are 2.0. @webspatial/starter 0.1.0 scaffolds ^1.5.0. The labs win where these disagree. webspatial-vite-min is desktop-verified (build clean, 0 console errors on all 3 pages, __webspatialsdk__ 2.0.0) and not yet run on the emulator; its Model swaps in the p3 avocado GLB on PICO. It shares labs/node_modules, so run npm run labs:install first. Repos without a license are linked, not vendored. Community apps: webspatial.dev/showcase.
:::

=== close-s6 concept
# Resources: everything in the kit
layout: resources
lead: One place for all of it. Every link is relative to this deck.

- **The kit:** [github.com/RayyanZahid/pico-workshops](https://github.com/RayyanZahid/pico-workshops) (this Academy is in `webspatial-academy/`)
- **This deck:** [slides.md](slides.md) · [deck.json](deck.json) · [llms.txt](llms.txt)
- **Start here:** [setup/SETUP.md](../setup/SETUP.md) · [setup/DEPENDENCIES.md](../setup/DEPENDENCIES.md) · [CLAUDE.md](../CLAUDE.md) (what Claude Code follows in this kit)
- **Curriculum:** [SYLLABUS](../curriculum/SYLLABUS.md) · [L0](../curriculum/L0.md) · [L1](../curriculum/L1.md) · [L2](../curriculum/L2.md) · [L3](../curriculum/L3.md) · [L4](../curriculum/L4.md) · [L5](../curriculum/L5.md) · [GLOSSARY](../curriculum/GLOSSARY.md) · [TROUBLESHOOTING](../curriculum/TROUBLESHOOTING.md) · [outline.json](../curriculum/outline.json)
- **Labs:** [p1 hello spatial](../labs/p1-hello-spatial/README.md) · [p2 spatialize a site](../labs/p2-spatialize-site/README.md) · [p3 volume model](../labs/p3-volume-model/README.md) · [p4 Space Invaders](../labs/p4-space-invaders/README.md) · [p5 capstone](../labs/p5-capstone/README.md)
- **From PICO:** [PICO CLI Quickstart, David Oh](../partner/pico-cli-quickstart-david-oh/index.html) · [README](../partner/pico-cli-quickstart-david-oh/README.md) · [slides.md](../partner/pico-cli-quickstart-david-oh/slides.md) (native Spatial SDK path; shown as sent)
- **Versions:** [labs/VERSIONS.md](../labs/VERSIONS.md) (SDK 2.0.0 pins, why there's no vite-plugin)
- **Official examples:** [examples/README.md](../examples/README.md) · [webspatial-vite-min](../examples/webspatial-vite-min/UPSTREAM-README.md) (runs in the kit, SDK 2.0) · [webspatial-sdk apps](https://github.com/webspatial/webspatial-sdk/tree/main/apps) · [showcase](https://webspatial.dev/showcase)
- **Emulator notes:** [labs/EMULATOR-RESULTS.md](../labs/EMULATOR-RESULTS.md) · [labs/SPATIAL-CRACK.md](../labs/SPATIAL-CRACK.md)
- **Sources (PICO docs):** [WebSpatial on PICO](https://developer.picoxr.com/document/web/webspatial/) · [Manifest](https://developer.picoxr.com/document/web/manifest/) · [Install-free Web Apps](https://developer.picoxr.com/document/web/install-free/) · [assets/pico-docs/WEB-APP-RUNTIME.md](../assets/pico-docs/WEB-APP-RUNTIME.md)
- **Outside the kit:** [webspatial.dev](https://webspatial.dev) · [developer.picoxr.com](https://developer.picoxr.com) · `pico-cli <family> --help` (commands checked against pico-cli 0.5.0)

::: notes
The emulator and PICO WebSpatial browser are PICO-licensed; PICO cleared this workshop's attendees. The kit will move under a hub folder alongside the Vibe XR kit; all links here are relative so the move keeps them working.
:::
