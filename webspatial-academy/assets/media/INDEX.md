# Academy media (desktop Chrome captures)

Every file here is a **desktop Chrome capture** (headless Chrome via Playwright, 2026-09-24) of the lab
dev servers. Desktop Chrome has no WebSpatial runtime, so every lab shows its **flat fallback**: no
depth, no volume, no separate windows. Nothing here is the headset or the emulator. For depth, use the
emulator captures in `../emulator/` (listed at the bottom as the pairing for each slide).

Stills are 1600x1000 unless noted. Clips are silent webm, 3-7 s, trimmed so the first frame is the
loaded page.

| File | What it shows | Source | Suggested slide |
|---|---|---|---|
| `p1-start-hello.png` | Lab 1 start/ page, flat | desktop Chrome capture | L1-s6 (Scaffold the app) |
| `p1-solution-hello.png` | Lab 1 solution/: the `enable-xr` card and the "Browser tab, flat" runtime badge | desktop Chrome capture | L1-s4 (Show which runtime you're in), L1-s16 |
| `p1-clip-hello.webm` | Lab 1 solution loading on desktop (3.3 s, mostly static) | desktop Chrome capture | L1-s16 (optional) |
| `p2-start-site.png` | SWANFEST site, start/ | desktop Chrome capture | L2-s2 (Take the before picture) |
| `p2-solution-site.png` | SWANFEST site, solution/. **Looks identical to start/ on desktop**: the lift and glass only appear in the Web App | desktop Chrome capture | L2-s7 only next to `../emulator/21-lab2-web-app-spatial.png` |
| `p2-clip-solution-scroll.webm` | Scrolling the whole SWANFEST solution page (5.8 s) | desktop Chrome capture | L2-s1 or L2-s10 |
| `p3-solution-model-viewer.png` | Lab 3 main page: avocado poster, "flat fallback" chip, Orbit/Reset. start/ renders the same on desktop, so only one file | desktop Chrome capture | L3-s2, L3-s9 (pair with `../emulator/24-lab3-volume-avocado.png`) |
| `p3-solution-viewer-volume.png` | Lab 3 `?scene=viewer` document opened as a plain page (the volume's content, flat) | desktop Chrome capture | L3-s2 or L3-s4 |
| `p4-start-invaders.png` | Spatial Invaders start/, Ready screen | desktop Chrome capture | L4-s12 |
| `p4-solution-invaders.png` | Spatial Invaders solution/, Ready screen with controls row and HUD window button | desktop Chrome capture | L4-s1 |
| `p4-solution-invaders-playing.png` | Solution mid-game: score, shots in flight | desktop Chrome capture | L4-s7 (Shots travel in Z) |
| `p4-solution-hud-window.png` (840x560) | The HUD scene (`?scene=hud`) live-connected to a running game over BroadcastChannel: score 10, lives, wave, "playing" | desktop Chrome capture | L4-s8 (The HUD window) |
| `p4-solution-hall-of-fame.png` | Hall of fame scene (`?scene=halloffame`). **Scores are sample rows seeded into localStorage for the capture**, not real play | desktop Chrome capture | L4-s8 or L4-s11 |
| `p4-start-vs-solution.png` (1600x700) | start/ and solution/ side by side, labelled. They look the same on desktop, which is the point: the diff is depth only | desktop Chrome capture | L4-s4 or L4-s12 |
| `p4-clip-start-vs-solution.webm` | Same side-by-side, 5.3 s | desktop Chrome capture | L4-s12 (optional) |
| `p4-clip-gameplay.webm` | Solution: Enter to start, strafing and firing (6.5 s) | desktop Chrome capture | L4-s1 or L4-s12 |
| `p5-start-night-market.png` | Night Market template/: no "Lanterns in 3D" button, plain cards (the solution adds the lanterns volume and glass cards) | desktop Chrome capture | L5-s9 |
| `p5-solution-night-market.png` | Night Market solution/: hero and vendor cards | desktop Chrome capture | L5-s9 |
| `p5-solution-stall-window.png` | Stall scene (`?scene=stall&id=taco`) opened as a plain page | desktop Chrome capture | L5-s9 (pair with `../emulator/14-lab5-stall-scene-second-window.png`) |
| `p5-solution-lanterns-volume.png` | Lanterns scene (`?scene=lanterns`) opened as a plain page, flat | desktop Chrome capture | L5-s9 (optional) |
| `p5-clip-night-market.webm` | Scrolling the Night Market solution (5.4 s) | desktop Chrome capture | L5-s9 |

Dropped on purpose: a p3 drag clip (the desktop fallback is a static poster, so nothing moved) and
`p3-start` (byte-identical to the solution on desktop).

Captured by `capture-media.mjs` / `capture-extra.mjs` in the session scratchpad; the dev servers ran on
ports 5601-5610 for this capture only.

## Clip posters

`<clip>-poster.png` is the frame 2 s into each clip, at the clip's size: `p1-clip-hello-poster.png`,
`p2-clip-solution-scroll-poster.png`, `p4-clip-gameplay-poster.png`, `p5-clip-night-market-poster.png`
(1280x800), `p4-clip-start-vs-solution-poster.png` (1600x700). Desktop Chrome capture, like the clips.
