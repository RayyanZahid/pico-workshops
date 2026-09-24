# Doctor: real output from the kit's build machine

Captured 2026-09-24 on the Alienware m16 R1 used to build this kit (Ryzen 9 7845HX, 16 GB RAM,
RTX 4080 Laptop 12 GB, Windows 11 Pro), with pico-cli 0.5.0 and Claude Code 2.1.282. The PICO
Emulator was running at the time (another agent had booted it), so the "free right now" line
describes a loaded machine. Nothing below is edited except that the home directory is shown as
%USERPROFILE% / %LOCALAPPDATA% / %APPDATA% instead of the build machine's real path.

Not run on macOS: the macOS branches of `doctor.mjs` follow PICO's published requirements and
pico-cli's own macOS paths, but no Mac has executed them yet.

## `node setup/doctor.mjs`

```text

PICO WebSpatial Academy doctor  (2026-09-24 21:20Z, win32/x64, track: emulator)

== This machine
  PASS  Microsoft Windows 11 Pro (64-bit, build 26200)
  INFO  CPU: AMD Ryzen 9 7845HX with Radeon Graphics (PICO floor: Intel Core i5 or equivalent)
  PASS  GPU: NVIDIA GeForce RTX 4080 Laptop GPU 12 GB VRAM
  PASS  Virtualization: hypervisor present, firmware VT on
  PASS  RAM: 15.2 GB total (PICO floor 16 GB; its own check passes at 15.0)
  WARN  16 GB is the floor for the emulator ALONE. The guest reserves 6144 MB; measured on a 16 GB laptop, a normal browser+editor load left too little and it refused to boot
        fix: Before `pico-cli emulator start`: close Chrome and other Electron apps; on Windows also `wsl --shutdown`
  INFO  Free right now: 0.57 GB physical, 0.81 GB commit with the emulator already running (it holds ~6 GB)
        fix: If the machine is sluggish, close browsers and editors you are not using
  INFO  Disk free: 38.2 GB on your home drive (PICO floor: 40 GB)
        fix: The floor covers a fresh install of Android Studio + the emulator (~4.3 GB download, ~12 GB installed, plus the IDE and SDK). Free space before installing; if all of that is already installed, this matters less

== Core tools
  PASS  Node v22.17.0 (Vite 8 needs ^20.19 or >=22.12; kit recommends 24 LTS)
  PASS  npm 10.9.2
  PASS  git version 2.48.1.windows.1
  PASS  Claude Code 2.1.282
  PASS  pico-cli 0.5.0 (@picoxr/pico-cli)

== Claude Code wiring
  PASS  Claude Code plugin pico-spatial-agentic-tools@pico-xr (PICO skills + pico-dev-knowledge MCP)
  PASS  pico-dev-knowledge: READY (PICO docs graph for Claude)

== PICO Emulator chain
  PASS  Android Studio AndroidStudio2025.1.1 (AI-251.25410.109.2511.13752376) at C:\Program Files\Android\Android Studio
  PASS  Java 21 (JAVA_HOME=%USERPROFILE%\scoop\apps\temurin21-jdk\current)
  WARN  Android SDK %LOCALAPPDATA%\Android\Sdk: Platform 35 yes, Sources 35 no
        fix: Android Studio > Settings > Languages & Frameworks > Android SDK > Show Package Details > Android 15.0 ("VanillaIceCream"): tick SDK Platform 35 + Sources for Android 35. Or: pico-cli emulator setup
  PASS  PICO Spatial plugin: AndroidStudio2025.1.1/SpatialPlugin 0.13.2
  PASS  PICO Emulator bundle(s): OS 6.0 in %LOCALAPPDATA%\PICO\sdk
  PASS  AVD(s): PICO_6.0 in %USERPROFILE%\.pico\avd
  PASS  adb: %LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
  PASS  PICO WebSpatial browser staged: %LOCALAPPDATA%\PICO\sdk\6.0\webspatial\PicoBrowser.apk

== Right now
  INFO  Emulator running and online as emulator-5554

== This kit
  PASS  Lab dependencies installed (@webspatial/react-sdk 2.0.0)

READY WITH WARNINGS  0 fail, 2 warn
exit=0
```

What to read from it:

- **0 fail**, so every lab can run here on the emulator track.
- The **16 GB warning** is the one that bites at events. With a browser and editor open, this same
  laptop measured about 1 GB of physical RAM and 2 GB of commit free earlier today, which the
  emulator-lab agent ruled not viable for a 6 GB guest (`labs/EMULATOR-RESULTS.md`). The doctor says
  so before you find out the hard way.
- **Sources for Android 35: no** is a real gap on this machine. The emulator boots without it
  (pico-cli's own `emulator doctor` reports `hasSources35: false` and still says ready), but PICO's
  setup doc asks for it, so the doctor keeps it as a warning.
- **Disk 38.2 GB** is under PICO's 40 GB floor, but everything is already installed, so it is a note.
  Ten minutes earlier the same line read 48.9 GB: something else on the machine was downloading.

## `node setup/doctor.mjs --web-only --quick`

The web-only track turns emulator-chain problems into notes, so someone on an Intel Mac, a Linux
box or an 8 GB laptop still gets a clean READY for the work they *can* do.

```text

PICO WebSpatial Academy doctor  (2026-09-24 21:21Z, win32/x64, track: web-only)

== This machine
  PASS  Microsoft Windows 11 Pro (64-bit, build 26200)
  INFO  CPU: AMD Ryzen 9 7845HX with Radeon Graphics (PICO floor: Intel Core i5 or equivalent)
  PASS  GPU: NVIDIA GeForce RTX 4080 Laptop GPU 12 GB VRAM
  PASS  Virtualization: hypervisor present, firmware VT on
  PASS  RAM: 15.2 GB total (PICO floor 16 GB; its own check passes at 15.0)
  INFO  16 GB is the floor for the emulator ALONE. The guest reserves 6144 MB; measured on a 16 GB laptop, a normal browser+editor load left too little and it refused to boot
        fix: Before `pico-cli emulator start`: close Chrome and other Electron apps; on Windows also `wsl --shutdown`
  INFO  Free right now: 0.74 GB physical, 2.48 GB commit (emulator needs 6 GB commit free to boot)
        fix: Close apps until commit free is at least 8 GB. The emulator prints "Insufficient RAM free" to stderr only, never to its log
  INFO  Disk free: 38.0 GB on your home drive (PICO floor: 40 GB)
        fix: The floor covers a fresh install of Android Studio + the emulator (~4.3 GB download, ~12 GB installed, plus the IDE and SDK). Free space before installing; if all of that is already installed, this matters less

== Core tools
  PASS  Node v22.17.0 (Vite 8 needs ^20.19 or >=22.12; kit recommends 24 LTS)
  PASS  npm 10.9.2
  PASS  git version 2.48.1.windows.1
  PASS  Claude Code 2.1.282
  PASS  pico-cli 0.5.0 (@picoxr/pico-cli)

== Claude Code wiring
  PASS  Claude Code plugin pico-spatial-agentic-tools@pico-xr (PICO skills + pico-dev-knowledge MCP)

== PICO Emulator chain
  PASS  Android Studio AndroidStudio2025.1.1 (AI-251.25410.109.2511.13752376) at C:\Program Files\Android\Android Studio
  PASS  Java 21 (JAVA_HOME=%USERPROFILE%\scoop\apps\temurin21-jdk\current)
  INFO  Android SDK %LOCALAPPDATA%\Android\Sdk: Platform 35 yes, Sources 35 no
        fix: Android Studio > Settings > Languages & Frameworks > Android SDK > Show Package Details > Android 15.0 ("VanillaIceCream"): tick SDK Platform 35 + Sources for Android 35. Or: pico-cli emulator setup
  PASS  PICO Spatial plugin: AndroidStudio2025.1.1/SpatialPlugin 0.13.2
  PASS  PICO Emulator bundle(s): OS 6.0 in %LOCALAPPDATA%\PICO\sdk
  PASS  AVD(s): PICO_6.0 in %USERPROFILE%\.pico\avd
  PASS  adb: %LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
  PASS  PICO WebSpatial browser staged: %LOCALAPPDATA%\PICO\sdk\6.0\webspatial\PicoBrowser.apk

== This kit
  PASS  Lab dependencies installed (@webspatial/react-sdk 2.0.0)

READY  0 fail, 0 warn
exit=0
```

## `node setup/doctor.mjs --json --quick` (excerpt)

What Claude Code reads at the start of a session (the `/doctor` command):

```json
{
  "verdict": "READY WITH WARNINGS",
  "track": "emulator",
  "emulatorPossible": true,
  "checks": [
    {
      "group": "host",
      "level": "warn",
      "what": "16 GB is the floor for the emulator ALONE. The guest reserves 6144 MB; measured on a 16 GB laptop, a normal browser+editor load left too little and it refused to boot",
      "fix": "Before `pico-cli emulator start`: close Chrome and other Electron apps; on Windows also `wsl --shutdown`"
    },
    {
      "group": "host",
      "level": "warn",
      "what": "Free right now: 0.97 GB physical, 2.8 GB commit (emulator needs 6 GB commit free to boot)",
      "fix": "Close apps until commit free is at least 8 GB. The emulator prints \"Insufficient RAM free\" to stderr only, never to its log",
      "id": "commit"
    }
  ]
}
```
