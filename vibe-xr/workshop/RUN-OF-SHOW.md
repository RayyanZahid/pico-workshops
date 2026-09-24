# Vibe XR live demo · run of show

Thu 2026-09-24, Homebrew Club SF. The demo slot is **18:05 to 18:25** (PLAN §3:
18:05 "The pipeline, live, twenty minutes"). Build block starts 18:30.
Projector shows `workshop/index.html`. Arrow keys move between sections.

Starter repo (public, live within the hour of this edit): https://github.com/RayyanZahid/pico-workshops,
starter in its `vibe-xr/` folder. The page already shows it, with the clone command:

```
git clone https://github.com/RayyanZahid/pico-workshops.git
cd pico-workshops/vibe-xr
```

Wifi (Homebrew-Club / homebrew) is already filled in on the page. Before doors, open
https://github.com/RayyanZahid/pico-workshops once from a phone to confirm it is public.

## Staging (17:00 to 17:55)

- Demo laptop on **Windows** (not WSL), mirrored to the room screen, font size up in the terminal.
- Fresh clone of the repo in `~/demo/pico-workshops`; work in `~/demo/pico-workshops/vibe-xr`, with `npm run serve` already running in its own terminal. Second terminal: `claude` open in the repo, signed in.
- A **pre-baked copy** in `~/demo/vibe-xr-done` (a second clone, `cd` into its `vibe-xr/`): build it this afternoon by running the 3 prompts once, committing after each (so `git log` shows one commit per prompt), and opening it in a headset. This is the fallback for everything below. It does not exist yet.
- Demo headset (one Ultra, charged, Tailscale on, `deviceidle whitelist` + `always_on_vpn_app` set) on USB to the laptop. `pico-cli device list` shows it.
- Ray's laptop uses **`npm run serve` only, never funnel.** It already has a public funnel on 443 (the Jev/Laya demo), so `start.mjs` auto-picks a free port (5443 here) and leaves 443 alone. **Never run `tailscale funnel reset` or `tailscale serve reset` on this laptop**: both wipe every mapping, the Jev/Laya funnel included. When §05 path C comes up, say the scoped off command out loud: `tailscale funnel --https=443 off`.
- The `https://...ts.net:5443` URL that `npm run serve` printed is open in the headset's PICO browser and loads (Enter VR button visible).
- Pick the volunteer wearer before 18:00 (someone near the front, not a host).

## Minute by minute

| Clock | Screen | Ray says / does |
|---|---|---|
| 18:05 | Page §00 | "Tonight you describe a 3D scene and Claude writes it. You leave with a scene you have walked around in." Point at the wifi and repo URL. |
| 18:06 | §01 | Three lines. Say the honesty line out loud: "This is WebXR in the PICO browser. Not a native PICO app. Everything tonight works on the headsets on that table." |
| 18:07 | §02 | 30 seconds. "Claude Code, Node 20, git. Tailscale and PICO CLI are optional. The PICO CLI package is `@picoxr/pico-cli`; plain `pico-cli` on npm is someone else's." |
| 18:08 | §03 | Walk the six boxes once. "One file, `src/main.js`. You never leave this loop." |
| 18:09 | Switch to terminal | Show the untouched starter in the desktop tab. Type **prompt 1** (copy from §04). While Claude works, narrate what it is reading. |
| 18:11 | Desktop tab | Refresh. Spinning torus knot + stars. Drag to look around. |
| 18:12 | Terminal | Type **prompt 2** (pinch spawns spheres). |
| 18:14 | Desktop tab | Refresh, click to fire a few spheres if the starter maps mouse to select; otherwise say "this one you have to feel with your hands" and move on. |
| 18:15 | Terminal | `node scripts/open-on-headset.mjs <the ts.net URL>`. Hand the headset to the volunteer. They press Enter VR and pinch. |
| 18:16 | Terminal | `node scripts/snap.mjs`, open the PNG from `captures/` on the projector (both eyes side by side). "That's what they see right now." |
| 18:17 | Terminal | Type **prompt 3** (dusk sky, fog, colour cycling, fix console errors). While it runs, show `node scripts/console.mjs` in a side pane. |
| 18:19 | Headset | Volunteer reloads (or run `node scripts/open-on-headset.mjs <url>` again). Ask them out loud what changed. Second `node scripts/snap.mjs` on screen. |
| 18:20 | Page §05 | "Three ways in." HTTPS or localhost only; a LAN IP never shows Enter VR. Funnel is how you get onto one of our headsets (they sit on the IC tailnet and cannot see yours), and the link is public while it is on. |
| 18:21 | §08 | Can and can't. Name the three refusals: camera, depth/mesh, eye tracking. "Don't spend your build block on those." |
| 18:22 | §09 | Rotation: 5 to 8 minutes, check-out at the table with Devinder. |
| 18:23 | §06 then §10 | "Stuck for ideas: remix one of these." Assets lane opens 19:30: Meshy, Blender over MCP, GLB into your scene. |
| 18:24 | §00 | Back to the repo URL. "Clone it now, then `cd pico-workshops/vibe-xr`. First headset views by 19:00." Hand off to build block. |

If Claude runs long on any prompt, skip the narration beat after it, not the headset beat. The headset moment (18:15 to 18:19) is the one that must happen.

## Fallbacks

**Wifi dies (or venue wifi isolates clients).**
1. Switch the laptop to the phone hotspot (the Wed checklist item; if it was never tested, test it at 17:00). Claude Code needs internet; the headset does not, if you go over USB.
2. Headset path drops to USB: stop `npm run serve`, run `npm run usb` (it does `adb reverse tcp:5173 tcp:5173`), then `node scripts/open-on-headset.mjs http://localhost:5173`. localhost is a secure context, so WebXR still starts.
3. If the laptop has no internet at all: say so, `cd ~/demo/vibe-xr-done/vibe-xr`, `npm run usb`, and show the finished scene in the headset over USB. Walk through `git log -p src/main.js` on the projector to show what each prompt changed.

**Claude Code is slow or errors.** Keep talking over the §03 loop. After 90 seconds with no edit, `git checkout` the matching commit from `vibe-xr-done` and continue as if it landed; say "this is the version I made yesterday with the same prompt."

**Headset won't show Enter VR.** The URL is not HTTPS or localhost. Re-open via `node scripts/open-on-headset.mjs <url>` (USB) rather than typing it.

**Tailscale drops on the headset.** Known: Android kills it when idle. Use USB (above); fix the whitelist after the demo, not during.

**PICO CLI can't see the headset.** Re-seat USB, accept the debugging prompt inside the headset (the volunteer has to look at it). If still nothing, skip the snap and let the volunteer narrate.

**Projector dies.** Laptop screen toward the front row; everyone else has the same page on their own laptop via the repo.

