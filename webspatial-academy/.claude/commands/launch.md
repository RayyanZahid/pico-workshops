---
description: Build-check a lab and open it in the PICO emulator's browser
argument-hint: "<1-5> [solution]"
---

Open lab `$ARGUMENTS` in the PICO Emulator.

1. Resolve the lab folder (`labs/p<n>-*/start`, `template` for p5, `solution` if I said so).
2. Type-check it first: `npx tsc --noEmit` in that folder. If it fails, show the errors and fix them
   with me before launching. A broken build launches as a blank page.
3. Launch with the kit helper (never raw `pico-cli web launch`):
   `node setup/launch.mjs <n> --serve` (add `--solution` if I asked).
   It starts the dev server if needed and refuses any adb target that is not an emulator. It runs
   `pico-cli web launch` only if the PICO browser is missing, then always does
   `adb reverse tcp:<port> tcp:<port>` and opens `http://localhost:<port>/` with `am start`.
   Never hand the emulator `http://10.0.2.2:<port>/`: it measured as not a secure context (no
   install prompt, flat tab), even though PICO's docs suggest it. Say which steps it ran.
4. If it refuses because no emulator is online, offer `/emulator`. If it refuses a physical device,
   explain why (web launch installs a browser APK and rewrites localhost to 10.0.2.2) and do not
   work around it.
5. Tell me to click the **monitor icon left of the star** in the address bar, then **Install** (a tab is never spatial), and to wait up to 60 s; if the panels are still missing, close and reopen the app once. Then take a
   screenshot with `node setup/snap.mjs` and look at it. Describe what is on screen, and say whether
   the spatial parts (lifted `enable-xr` elements, extra scene windows) are visible.
6. If something is wrong, read `pico-cli log -d <device> -l E -n 80` before guessing.
