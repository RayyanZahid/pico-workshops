# PICO CLI for a WebXR workflow

Your scene is a web page. PICO CLI is the headset side of the loop: find the
headset, open your page in it, see what it sees, read its logs, measure it.
Every command below comes from `pico-cli <family> --help` on **pico-cli 0.5.0**.

**Install:** `npm i -g @picoxr/pico-cli` (the command is still `pico-cli`). Plain
`npm i -g pico-cli` installs an unrelated package. pico-cli does not include adb,
so install Android platform-tools as well (`winget install Google.PlatformTools`
or `brew install --cask android-platform-tools`).

**Verified column:** `Y` means the command ran against a real PICO 4 Ultra and we
say which unit and when. `help` means it exists in `--help` and the source, but
nobody has run it on a headset yet. **No headset was on USB when this sheet was
written (Thu 2026-09-24), so no pico-cli device command was re-run today.**

## Cheatsheet

| Task | Helper (prints what it runs) | pico-cli | raw adb | Verified |
|---|---|---|---|---|
| Is everything ready? | `node scripts/doctor.mjs` | `pico-cli doctor` + `pico-cli device list` | `adb devices -l` | pico-cli doctor ran on the kit laptop 2026-09-24 (no device). adb: Y, IC4 + IC5, 2026-08-01 |
| Which headset is this? | `doctor.mjs` | `pico-cli device info` / `device props` | `adb shell getprop pxr.vendorhw.product.name` (`A92U0` consumer, `A9210` Enterprise) | getprop: Y, IC4 + IC5, 2026-08-01. pico-cli: help |
| Let the headset reach `localhost:5173` over USB | `node scripts/usb-reverse.mjs` | none documented (hidden `pico-cli adb reverse`) | `adb reverse tcp:5173 tcp:5173` | Y, IC4, 2026-07-31 (port 8731) |
| Open a URL in the PICO browser | `node scripts/open-on-headset.mjs <url>` | `pico-cli device shell "am start -a android.intent.action.VIEW -d '<url>'"` | `adb shell am start -a android.intent.action.VIEW -d '<url>'` | adb: Y, IC4, 2026-07-31. pico-cli wrapper: help |
| Screenshot the headset | `node scripts/snap.mjs` → `captures/<time>.png` | `pico-cli capture screenshot --out x.png` | `adb exec-out screencap -p > x.png` | adb: Y, IC4 (4320x2160 stereo). pico-cli: Y on the OS 6 **emulator** only, 2026-09-18 |
| Record a clip | `node scripts/record.mjs 15` → `captures/<time>.mp4` | `pico-cli capture record --time 15 --out x.mp4` | `adb shell screenrecord --time-limit 15 /sdcard/x.mp4` then `adb pull` | help |
| Browser console on your laptop | `node scripts/console.mjs` | `pico-cli log --follow --tag chromium` | `adb logcat -s chromium` | DevTools socket: Y, IC5, 2026-08-01. Console-via-logcat: **not verified** |
| Frame rate / perf | `node scripts/perf.mjs 30` | `pico-cli perf live run --package <browser> --duration 30` | none worth teaching | help. The kit laptop's `pico-cli doctor` says the profiler deps still need `pico-cli perf doctor` |
| Battery | `doctor.mjs` | `pico-cli device battery` | `adb shell dumpsys battery` | help |

Every helper takes `--device <serial>` when more than one headset is plugged in,
and `--raw` to skip pico-cli and run the adb version, so you can learn both.

### The PICO browser package differs between our headsets

| Unit | Package |
|---|---|
| Consumer PICO 4 Ultra `A92U0` (IC4 checked; IC1-3, IC6-8 are the same SKU) | `com.pico.browser.overseas` |
| Enterprise PICO 4 Ultra `A9210` (IC5) | `com.pico.browser` |
| PICO OS 6 emulator / Project Swan | `com.picoxr.browser` |

The first two are verified on IC4 and IC5 (2026-08-01). The consumer row covers
the other six units because they share the SKU, which is an inference: only IC4
has been probed. That is why `open-on-headset` sends the **implicit** VIEW intent
(no package), which lets Android pick the browser, and only names the package,
looked up on that device, if the implicit one fails. Never hardcode it: on the
wrong unit `monkey -p com.pico.browser.overseas ...` prints
`No activities found to run, monkey aborted` and a careless script carries on
as if it had worked.

### HTTPS or localhost, or there is no Enter VR button

`http://192.168.x.x:5173` loads in the headset and **silently has no
`navigator.xr`**. Use one of:

- `http://localhost:5173` in the headset, plus `adb reverse` (USB). This is what `open-on-headset` sets up.
- The `https://<machine>.<tailnet>.ts.net` URL from `npm run serve` (wireless, needs Tailscale on the headset).

## What PICO CLI does NOT do on our headsets

IC1-IC8 are PICO 4 Ultras on PICO OS 5.x. Much of PICO CLI targets **PICO OS 6**
(Project Swan) and has no path onto them:

- **`pico-cli web launch --url` is wrong for these headsets. Don't use it.** Read from the 0.5.0 source (`dist/index.js`) and its own contract (`sideEffects: device-write`), it:
  1. **installs a 336 MB `PicoBrowser.apk` onto the headset** before it opens anything. That's the OS 6 browser, `com.picoxr.browser`, with versionCode set to INT_MAX. Nobody has tested what it does to an Ultra's own browser. These headsets are on loan, so nothing gets installed on them tonight;
  2. launches `com.picoxr.browser`, which isn't on our units until that install runs;
  3. rewrites `localhost` / `127.0.0.1` to `10.0.2.2`, the Android emulator's alias for the host, which breaks `adb reverse` on a real headset.

  It is built for the OS 6 emulator. `open-on-headset.mjs` does what you want on these headsets.
- **Spatial SDK apps** (`pico-cli project create`, `app install` of a Spatial APK): OS 6 only. They cannot install on the OS 5 fleet.
- **Spatial Editor** (`pico-cli editor`, the `pico-spatial-editor` MCP) and the **PICO Emulator** (`pico-cli emulator`): OS 6 tooling. The emulator also needs about 6 GB of free RAM just to boot.
- **`pico-cli doctor` reports "blocking issues"** on a laptop that hasn't run `pico-cli setup`. Those checks are for the Spatial SDK toolchain and don't matter for WebXR. Ignore them tonight.
- **Wireless adb** (`pico-cli device connect`): leaves adb open on every Wi-Fi network the headset joins until it reboots. Use USB. Wireless *viewing* goes through Tailscale, not adb.
- **Camera, depth, mesh, light estimation, DOM overlay, eye and face tracking**: the browser refuses them, or the hardware doesn't have them. No CLI changes that.

## Letting Claude Code drive it

**The skill.** `pico-cli setup` installs the `pico-spatial-agentic-tools` plugin.
Its `pico-cli` skill covers routing across command families, `--device`
targeting and `--format json`. It is written for Spatial apps, so point it at
this page: *"read docs/PICO-CLI.md, then open my scene on the headset and
screenshot it"*. Claude runs the helpers above, opens the PNG and describes it.
Asking Claude to look at `captures/` is the quickest way to debug something you
can only see in the headset.

**The knowledge MCP.** `pico-cli knowledge server` serves PICO's developer docs
(a graph, queried with the `query_graph` tool) as the `pico-dev-knowledge` MCP.
`pico-cli knowledge list` shows what is installed (6.1 spatial + unity on the kit
laptop), and `pico-cli knowledge doctor` reported `graphify serve: READY` on
2026-09-24. Its content is the **OS 6 Spatial SDK**, so it's the right source for
PICO questions but not for WebXR, where three.js and the WebXR spec are the
reference.

**One warning.** Don't run `pico-cli setup` while Claude Code sessions are open
on the same machine. On 2026-09-18 it upgraded graphify, killed the processes
holding the knowledge vault (every open session's MCP server), and then failed
anyway. Run it once, before you start.
