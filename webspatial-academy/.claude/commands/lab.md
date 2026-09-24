---
description: Open lab n (1-5), start its dev server, and walk me through the first step
argument-hint: "<1-5> [solution]"
---

Open lab `$ARGUMENTS` of the PICO WebSpatial Academy.

1. Resolve the lab: the first number in "$ARGUMENTS" picks `labs/p<n>-*/`. Use `start/` (or
   `template/` for p5) unless the arguments contain "solution"; never edit `solution/`.
   Lab 0 means setup: run `/doctor` instead and stop.
2. Read the lab's `README.md` if it exists, otherwise `curriculum/L<n>.md`. Summarize the goal in two
   sentences and list the steps as a short checklist.
3. If `labs/node_modules` is missing, run `npm run labs:install` from the kit root.
4. Start the dev server in the background: `npm run dev:xr` in that folder. Read the port from its
   `package.json`, wait until `http://127.0.0.1:<port>/` answers, and give me the desktop URL.
5. Check `pico-cli emulator status --format json` (read `data.processRunning` and `data.adbOnline`
   only; `data.state` is the previous boot's record). If the emulator is up, offer `/launch <n>`.
   If it is not, say so and offer `/emulator`. On the web-only track, skip the emulator entirely.
6. Point me at the file I edit first, open at the first step of the checklist, and stop there.
   Let me try the step. Help when I ask, and show the solution only if I ask for it.
