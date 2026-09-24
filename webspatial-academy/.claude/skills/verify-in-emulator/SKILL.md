---
name: verify-in-emulator
description: Prove a WebSpatial lab or capstone actually works in the PICO OS 6 emulator, with evidence, before saying it does. Use when the attendee asks "does it work?", before marking a lab done, or at L5 when Claude drives the build-launch-debug loop on its own.
---

# Verify in the emulator

"It built" and "the launch command succeeded" are not "it works". A command that returns 0 has
changed nothing you have looked at. This skill produces evidence, then a verdict.

## Steps

1. **Static.** In the lab folder: `npx tsc --noEmit`. Stop on any error.
2. **Desktop.** Dev server up (`npm run dev:xr`, background). With the `chrome-devtools` MCP, open
   `http://localhost:<port>/`, then `list_console_messages`. Zero errors is the bar. Take a
   screenshot: this is the 2D fallback and should still look intentional.
3. **Wiring.** Confirm the four things that silently disable WebSpatial, in the files and not from
   memory:
   - `jsxImportSource: "@webspatial/react-sdk"` in `tsconfig.json` **and** in `vite.config.ts`
     (`react({ jsxImportSource })`)
   - the app renders inside `<SpatialBoot>`
   - `index.html` links a manifest that exists in `public/` and has `name`/`short_name`,
     `start_url` and `icons`
   - every `window.open(url, name)` uses a `name` registered with `initScene` before the call, and
     that `initScene` runs inside `<SpatialBoot onReady={...}>`. Before boot it is a silent no-op
     in SDK 2.0, and the scene then opens flat at the default size.
4. **Emulator.** `node setup/launch.mjs <n>`. Ask the attendee to click the monitor icon left of the star, then Install, and wait up to 60 s; if the panels are still missing, close and reopen the app once. Spatial means the UA has PicoWebApp/ and WebSpatial/
   (you cannot tap for them reliably; synthetic input on the emulator does not reach 3D content).
5. **Look.** `node setup/snap.mjs --name <lab>-verify`, then open the PNG. Name what you see:
   windows, lifted panels, volumes. If the best frame is >30% black, burst again before
   concluding anything.
6. **Logs.** `pico-cli log -d emulator-5554 -l W -n 120` and scan for errors from the page or the
   runtime.

## Verdict

Report one of:

- **WORKS**: the screenshot shows the expected spatial elements, and the logs are clean. Cite the
  PNG path.
- **WORKS ON DESKTOP ONLY**: the flat page is fine, but the emulator shows no spatial elements. Say
  which wiring check you suspect.
- **BROKEN**: quote the error line.
- **NOT VERIFIED**: no emulator (web-only track). Say so plainly. A desktop pass is not an emulator
  pass.

Never upgrade a verdict without the screenshot and the log that support it.
