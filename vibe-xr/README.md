# Vibe XR with PICO CLI

A three.js WebXR starter you change by talking to Claude Code, then walk around inside on a
PICO 4 Ultra. No build step, no install beyond Node: one HTML file, one `src/main.js`,
three.js from a CDN.

Built for **Claude for Spatial Computing**, Claude Community SF, Thu 2026-09-24.

## Quickstart

1. **Clone** the repo and `cd` into it. You need Node 20+ and Claude Code.
2. **Run it on your laptop:** `npm run dev`, then open http://localhost:5173. Drag to orbit, click the orb.
3. **Ask Claude to change it.** Run `claude` in this folder and describe what you want (try a prompt below). Reload the tab to see the result.
4. **Publish it to the headset:** `npm run serve`. It runs `tailscale serve` and prints an `https://<your-machine>.<tailnet>.ts.net` URL. (No Tailscale? Plug the headset in over USB and run `npm run usb`, which sets up `adb reverse` so the headset can open `http://localhost:5173`.)
5. **Open that URL in the PICO browser** in the headset and tap **Enter VR** or **Enter AR**. Grab the orb with a controller or pinch it with your hand; poke it with a fingertip.

WebXR only runs on HTTPS or localhost, so a plain `http://192.168.x.x` LAN address shows the page
but no Enter VR button. That is why step 4 exists.

## Five prompts to paste into Claude Code

1. `Replace the orb with a ring of 12 floating crystals that slowly orbit me at head height. Poking any crystal makes it burst into sparks.`
2. `Turn the room into a night sky: remove the grid, add a few thousand stars as one Points object, and make the floor a dark reflective-looking pool. Keep it fast on a mobile headset.`
3. `Put a glass pillar to my left. Every time I poke the orb, stack a small glowing cube on top of the pillar, so the stack counts my pokes. Reset it when I pinch the top cube.`
4. `In AR mode, let me place copies of the orb on real tables and floors where the controller ray hits a surface, using WebXR hit-test. Look at examples/ar-placer for the pattern.`
5. `Load assets/model.glb (I just dropped it in), put it on the plinth, make it grabbable, and have it turn slowly when nobody is holding it.`

## What's in here

| Path | |
|---|---|
| `src/main.js` | The scene. Claude edits this, at the `✏️ REMIX HERE` markers. |
| `index.html` | Import map (three.js 0.186.1 from jsDelivr) and the landing overlay. |
| `theme/` | PICO workshop palette and materials. |
| `examples/` | Finished scenes to borrow from: AR placer, hand garden, portal, gallery, beat room. |
| `assets/` | Drop GLB models, textures and audio here. |
| `serve/` | Zero-dependency static server + the tailnet / USB publish script. |
| `scripts/`, `docs/PICO-CLI.md` | PICO CLI helpers (Node): open a URL on the headset, screenshot the headset view. |
| `CLAUDE.md` | What Claude Code reads first: the loop, the constraints, the recipes. |

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Serve at http://localhost:5173 (desktop preview). |
| `npm run serve` | Serve + `tailscale serve --bg --https=<port>`; prints the headset URL. Uses 443 unless it's already taken on your machine, and never overwrites an existing mapping. Ctrl+C removes the mapping. |
| `npm run usb` | Serve + `adb reverse tcp:5173 tcp:5173`; open `http://localhost:5173` in the headset. |
| `./serve/serve.sh` / `.\serve\serve.ps1` | Same as `npm run serve`; add `--usb` for USB mode. |
| `node scripts/open-on-headset.mjs <url>` | Open a URL in the headset's PICO browser over USB (no VR keyboard typing). |
| `node scripts/snap.mjs` | Screenshot what the headset shows, into `captures/`. |

Optional: PICO CLI (`npm i -g @picoxr/pico-cli`, binary `pico-cli`) makes the scripts use it for device work; they fall back to plain `adb`. Don't use `npm i -g pico-cli` (unrelated package) or `pico-cli web launch` (wrong browser, emulator-only address).

## What the PICO browser can and can't do

Works: immersive VR, immersive AR (passthrough), controllers, hand tracking, hit-test,
anchors, plane detection. Not available: camera access, depth, room mesh, light estimation,
DOM overlay, eye or face tracking. If you want a feature from the second list, it is not a
bug in your code; the browser refuses it.

## Headset checklist

- The PICO browser, not a third-party one.
- For `npm run serve`: the Tailscale app on the headset, logged in to the same tailnet as your laptop. The first load can take ~10 s while the HTTPS certificate is issued.
- For `npm run usb`: developer mode + USB debugging on, the cable plugged in, and the "allow USB debugging" prompt accepted inside the headset.
