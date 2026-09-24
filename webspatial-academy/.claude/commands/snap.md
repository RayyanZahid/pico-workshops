---
description: Screenshot the PICO emulator (best clean method) and describe it
argument-hint: "[name]"
---

Take a screenshot of the PICO Emulator.

1. Run `node setup/snap.mjs`, adding `--name <name>` if I gave a name here: "$ARGUMENTS". It tries the emulator's own
   screenshot (`adb emu screenrecord screenshot`), then on Windows a capture of the emulator window,
   then a burst of in-guest captures, and keeps the first frame under 30% black. In-guest captures
   are often mostly black while the app is fine. Say which method won; a `window` frame includes the
   emulator's window border.
2. Open the saved PNG (the path is on the last line) and describe what is on screen: which windows
   or panels, whether `enable-xr` elements look lifted, any error text.
3. If even the best frame is over 30% black, say so, and check liveness with
   `pico-cli log -d emulator-5554 -n 50` before concluding the page is broken.

The screenshot stays in `captures/` (git-ignored). The OS is PICO-licensed: fine to show inside the
workshop, but check with PICO before publishing it anywhere else.
