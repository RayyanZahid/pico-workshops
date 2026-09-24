# Walkthrough: your website in the PICO OS 6 emulator

Every step here was run on 2026-09-24 on the kit's build laptop (16 GB, RTX 4080 Laptop,
AVD `PICO_6.0`, PICO OS 6.0.0, pico-cli 0.5.0). Tags: **VERIFIED** means it ran here today.
**UNVERIFIED** means nobody has checked it yet. The screenshots in this folder are real
captures from that run.

> The PICO Emulator and PICO WebSpatial browser are PICO-licensed. These PICO OS 6 screenshots
> are shown with PICO's clearance for the Claude for Spatial Computing workshop (2026-09-24).

## The one idea

A page in a PICO browser **tab** is always flat. It only becomes spatial once it is
**installed as a web app**. Inside that shell the user agent gains `PicoWebApp/0.4.0` and
`WebSpatial/1.5.0`, the SDK boots, and `enable-xr` elements lift off the page. The whole
workshop comes down to getting your page into that shell.

| Where the page runs | User agent contains | What you see |
|---|---|---|
| Browser tab | `PicoBrowser/5.0.0` only | A flat page, `enable-xr` does nothing (VERIFIED) |
| Installed web app | `PicoWebApp/0.4.0 ... WebSpatial/1.5.0` | Glass window, spatialized panels, scene windows (VERIFIED) |

## 0. Boot the emulator

```bash
pico-cli emulator status          # "Process running: no" means start it
pico-cli emulator start --avd PICO_6.0
```

- **Cold boot takes about 1 minute.** Measured from `emulator start` to `sys.boot_completed=1`:
  48 s and 63 s on two boots (the emulator's own log said 27.6 s and 42.5 s). VERIFIED.
- **RAM:** the guest reserves 6 GB. With under ~6 GB of free commit the emulator refuses to
  start, and that error goes to stderr only. On a 16 GB laptop, close Chrome, Slack and similar
  apps first, and run `wsl --shutdown` on Windows. VERIFIED: it would not fit at 2 GB free, and
  it booted once about 9 GB was free.
- **If the default 6144 MB refuses, set `hw.ramSize=4096`** in
  `%USERPROFILE%\.pico\avd\PICO_6.0.avd\config.ini` (back up the file first). VERIFIED
  2026-09-24: at 4096 (guest `MemTotal` 4.0 GB) it cold-booted in 62 s and ran the PICO
  Browser plus five installed web apps (Labs 1-5).

You land in the home space with the app launcher floating in front of you.

![The home space with the app launcher](00-emulator-home-launcher.png)

## 1. Serve your page on localhost, not 10.0.2.2

```bash
npm run dev:xr                     # in your lab folder; note the port, e.g. 5311
adb reverse tcp:5311 tcp:5311      # the emulator's localhost:5311 now reaches your laptop
```

**Use `http://localhost:<port>/` in the emulator, not `http://10.0.2.2:<port>/`.** Both
addresses load the page. Only `localhost` is a *secure context*, and the browser offers to
install a page only in a secure context. On `10.0.2.2`, `isSecureContext` is `false`,
`beforeinstallprompt` never fires, and you never get the Install dialog. VERIFIED.

## 2. Open it in the PICO browser

```bash
adb shell am start -a android.intent.action.VIEW -c android.intent.category.BROWSABLE \
  -n com.picoxr.browser/com.google.android.apps.chrome.IntentDispatcher \
  -d http://localhost:5311/
```

Do not use `pico-cli web launch` on this emulator image. It first tries to sideload its own
browser, and that fails: `INSTALL_FAILED_UID_CHANGED: Package com.picoxr.browser shared user
changed from android.uid.system to <nothing>`. Its `--manifest-url` mode also fails:
`Permission Denial ... WebRouterActivity ... not exported`. The browser is already installed,
so the `am start` above is all you need. VERIFIED.

The page opens in a flat browser window, with the tab strip above and the address bar at the top.

![Lab 1 in a browser tab: flat, and the badge says so](01-lab1-browser-tab-flat.png)

![Lab 2 in a browser tab: a whole site, still flat](04-lab2-browser-tab-flat.png)

## 3. Install it as a web app

A page with a valid manifest shows an **"Open as Web App"** button in the address bar (a
small window icon to the left of the bookmark star). The browser also offers **"Install
app"**. Those wordings come from the browser's own string table. The phrase "Run as a
standalone app" from older notes does not appear anywhere in this browser. VERIFIED (strings)
/ UNVERIFIED (which of the two buttons a mouse click lands on first).

The Install dialog shows the app's name and origin. Click **Install**.

![Install app dialog over Lab 1](02-lab1-install-app-dialog.png)

After about 0.3 s the OS creates an app package (`com.picoxr.webapp.localhost.<random>`), and
the app shows up in the launcher. On an `http://` dev server the icon is a generic
placeholder, because the installer refuses to fetch it (`CLEARTEXT communication to localhost
not permitted`). That is cosmetic. VERIFIED.

**Your manifest decides whether install works.** It needs `name` or `short_name`,
`start_url`, and **PNG** icons with real `sizes` (the labs ship 192/512/1024 PNGs). An earlier
test manifest with a single SVG icon at `sizes: "any"` was rejected by the OS web-app check
(`DiscernWebApp: onGotManifestDataError ... "data errors or manifest is empty"`). INFERRED
that the SVG icon is the cause; the lab manifests pass the same check.

## 4. Launch the app and look

Open it from the launcher. From a terminal:
`adb shell am start -n <package>/com.picoxr.spacewebappp.platform.WebAppActivity`.

![Lab 1 as a web app: the enable-xr card is its own spatial panel](03-lab1-web-app-card-lifted.png)

What changed compared with the tab: no browser chrome, a translucent glass window, and the
`enable-xr` card rendered as a separate spatialized panel in front of the page.

**Give it time.** Spatial panels arrive after the page. On the first launch the Lab 1 card
took over 30 s to appear. If a panel is missing, wait, then relaunch before you debug.

![Lab 2 as a web app: nav, hero and cards as glass panels](21-lab2-web-app-spatial.png)

![Lab 3 main window](10-lab3-volume-web-app.png)

![Lab 3: "Open in 3D" opens the avocado in its own scene](24-lab3-volume-avocado.png)

![Lab 4: invader rows, shields and controls as separate panels](22-lab4-web-app-rows-stepped.png)

![Lab 4 mid-game](23-lab4-web-app-midgame.png)

![Lab 4 from an angle: the rows sit at stepped depths](25-lab4-angled-rows-in-depth.png)

![Lab 4 HUD in its own window](26-lab4-hud-window-live.png)

![Lab 5 capstone as a web app: vendor cards overhang the window](27-lab5-web-app-night-market.png)

## 5. Scenes: a second window

`window.open(url, '<scene name>')` inside the web app opens a **new spatial window**. In Lab 5,
opening a stall opens its own window. VERIFIED.

![Lab 5: a stall opened as a second window](14-lab5-stall-scene-second-window.png)

**Register scenes after boot.** In SDK 2.0, `initScene()` does nothing until `<SpatialBoot>`
has finished. It returns undefined and throws nothing. If you call it at the top of
`main.tsx`, `window.open` gets the default config, and your `type: 'volume'` becomes a flat
1280x720 window (VERIFIED: that is what Lab 3 sent,
`config={"defaultSize":{"width":1280,"height":720},"type":"window"}`). Call it from
`<SpatialBoot onReady={...}>`.

## 6. Moving around and moving windows

**UNVERIFIED on this machine.** The emulator window simulates a controller with the mouse
and keyboard, and the view in later screenshots here was turned by someone using that window.
Script-driven `adb shell input tap` lands only on the focused 2D window, in that window's own
pixel coordinates (the browser window is 2880x1792). Anything past x=2160 is unreachable
from adb, which includes the browser's `...` menu. A script cannot grab or move a window. A
person at the emulator window can. Put the actual mouse and keyboard bindings here once
someone has tried them.

## 7. Screenshots that do not lie

`pico-cli capture screenshot` (and `adb exec-out screencap`) often comes back 50-95% black on
this emulator, because it reads the framebuffer mid-write. The emulator's host-side capture
does not have that problem:

```bash
adb emu screenrecord screenshot C:\path\to\folder   # writes Screenshot_<n>.png, full frame
```

On the same frame, `screencap` came back 68% black and this came back 0.1% black. Every image
in this folder was taken this way, except 01, 03 and 08. VERIFIED.

## 8. What went wrong today (so you recognize it)

| Symptom | Cause | Fix |
|---|---|---|
| No Install dialog, no "Open as Web App" icon | Page loaded on `10.0.2.2` (not a secure context), or the manifest was rejected | `adb reverse` + `localhost`, PNG icons with sizes |
| `INSTALL_FAILED_UID_CHANGED` from `pico-cli web launch` | The emulator's browser is a system app, and pico-cli tries to replace it | Open the URL with `am start` (step 2) |
| Web app opens, the page is a blank glass panel | The spatialized elements were moved out of the page and their panels never finished loading. Seen on the first builds of Labs 2 and 4 (no `spatialdiv created` in logcat); the rebuilt labs render. Likely a cold-start race: the runtime answers after the SDK's 30 s timeout and the panels stay 0x0 until a reload (INFERRED; reproduced on p3/p4) | Grep `adb logcat -s WebSpatial` for `spatialdiv created`; if absent, reload the app (force-stop and relaunch) |
| "Open in 3D" gives a flat window | `initScene` called before boot | Register scenes in `onReady` |
| Your window disappears behind another | Two windows share the same worktable slot; the last one drawn wins | Force-stop the other app, or relaunch yours |
| A screenshot is mostly black | Framebuffer capture tearing | `adb emu screenrecord screenshot <dir>` |

Harmless log noise: `SpatialDiv metadata malformed, accepting for compatibility ...
wsepoch=(missing)` appears on every working lab (SDK 2.0.0 on runtime 1.5.0).
