# Dependencies

Everything the Academy needs, with the version floor, why it is there, how to install it on
Windows and macOS, how to check it, and where the claim comes from. Every row was checked on
**2026-09-24**. `setup/doctor.mjs` tests all of it, and `setup/install-windows.ps1` /
`setup/install-macos.sh` run these same commands.

**Status key**: **VERIFIED** = run or read on the kit's build machine that day ·
**OFFICIAL** = copied from the vendor's own page, fetched that day · **SOURCE** = read in the
tool's code · **UNVERIFIED** = nobody has run it.

## Two tracks

| Track | You need | You get |
|---|---|---|
| **Web-only** (anyone) | Rows 1-5 | Every lab in a desktop browser (WebSpatial's flat 2D fallback), Claude Code doing the work, the emulator on the projector or a partner's screen |
| **Emulator** | Rows 1-13 + the hardware floor below | The same labs as real spatial windows and volumes in the PICO OS 6 emulator |

## Core: everyone

| # | Dependency | Floor | Why | Windows | macOS | Verify | Source |
|---|---|---|---|---|---|---|---|
| 1 | **Node.js** | **20.19** or **22.12+**; kit recommends **24 LTS** | Runs Vite, the labs and every kit script. The floor comes from Vite 8.3.1 and `@vitejs/plugin-react` 6.1.1 (`engines: ^20.19.0 \|\| >=22.12.0`). The WebSpatial packages declare no `engines`. Node 24 "Krypton" is the current LTS | `winget install --id OpenJS.NodeJS.LTS -e` | `brew install node@24`, then add `$(brew --prefix)/opt/node@24/bin` to PATH (keg-only) | `node --version` | npm registry `vite`, `@vitejs/plugin-react`, `@webspatial/*` engines (VERIFIED `npm view`); https://nodejs.org/dist/index.json (LTS list); winget and formulae.brew.sh entries (VERIFIED) |
| 2 | **Git** | any current | pico-cli lists Git as a prerequisite, and `pico-cli doctor` `git pull`s PICO's plugin repo. On Windows, Claude Code uses Git Bash for its Bash tool; without Git it falls back to PowerShell | `winget install --id Git.Git -e` | `xcode-select --install` (or `brew install git`) | `git --version` | PICO CLI installation guide (OFFICIAL); code.claude.com/docs/en/setup "Set up on Windows" (OFFICIAL) |
| 3 | **Claude Code** | current | The agent that does the work. OS floor: Windows 10 1809+, macOS 13+, 4 GB RAM. **Needs a Pro, Max, Team, Enterprise or Console account; the free claude.ai plan does not include Claude Code** | PowerShell: `irm https://claude.ai/install.ps1 \| iex`  ·  or `winget install Anthropic.ClaudeCode` | `curl -fsSL https://claude.ai/install.sh \| bash`  ·  or `brew install --cask claude-code` | `claude --version`, then `claude doctor` | https://code.claude.com/docs/en/setup (OFFICIAL; docs.anthropic.com redirects there) |
| 4 | **PICO CLI** `@picoxr/pico-cli` | **0.5.0** (every command in this kit was read from 0.5.0's `--help`) | PICO's one CLI for the emulator, apps, logs, screenshots, perf, web launch and Claude Code wiring. **The unscoped npm package `pico-cli` is an unrelated CLI framework** (antonk52/pico-cli 0.2.0) | `npm install -g @picoxr/pico-cli` | same | `pico-cli --version` prints `pico-cli/0.5.x (public) ...` | https://github.com/Pico-Developer/PICO-Intelligent-Plugins/blob/main/docs/pico-cli-installation-guide.md (OFFICIAL: "Node.js 18 or later"); npm registry (VERIFIED) |
| 5 | **Lab packages**: `@webspatial/react-sdk` + `@webspatial/core-sdk` **2.0.0 exact**, vite ^8.2 (8.3.1 resolved), `@vitejs/plugin-react` 6.1.1, react 19.3.0, typescript 6.0.3. One npm workspace at `labs/`, ~40 packages, ~73 MB | `labs/VERSIONS.md` (the source of truth) | The SDK that turns HTML elements into spatial content. **2.0.0 (2026-08-21) breaks 1.x**: `<SpatialBoot>` is required, `/web` and `/default` entries are gone. Tutorials older than August 2026 describe 1.x. **No `@webspatial/vite-plugin`**: 1.0.1 aliases to the removed `/web` entry and 2.0 builds fail | `npm run labs:install` (kit root) | same | `npm ls @webspatial/react-sdk --prefix labs` | https://github.com/webspatial/webspatial-sdk/releases, https://webspatial.dev/docs/introduction/getting-started (OFFICIAL) |

## Emulator chain

In order. `pico-cli emulator setup` installs rows 7-11 for you: it runs PICO's `primer-cli env setup`
with only the steps that are missing (`android_sdk, pico_tools, set_pico_home, create_avd,
android_studio, spatial_plugin, java_runtime`, SOURCE). The manual commands are listed for when
it fails, or when you want to see what it does.

| # | Dependency | Floor | Why | Windows | macOS | Verify | Source |
|---|---|---|---|---|---|---|---|
| 6 | **PICO license** | accepted by pico-cli on your behalf | The PICO Emulator and PICO WebSpatial browser are licensed by PICO; this workshop's attendees are cleared by PICO. pico-cli passes `--accept-license` when it installs them. Read it at https://developer.picoxr.com/document/distribute/sdk-license-terms/ | nothing to install | same | n/a | installed `package.xml` files and PICO's `sdk_config_global` (VERIFIED); pico-cli `dist/*.js` (SOURCE); event clearance confirmed by the organizer 2026-09-24 |
| 7 | **Android Studio** | **2025.1.x exactly** (PICO pins 2025.1.4.8) | The PICO Spatial plugin declares `until-build="251.*"`, so it cannot load in any newer IDE, and pico-cli accepts only a version string containing `2025.1`. **`winget install Google.AndroidStudio` (2026.1.4.7) and `brew install --cask android-studio` (2026.1.4.8) both install versions that fail.** You never need the IDE open once the emulator exists | `winget install --id Google.AndroidStudio -e --version 2025.1.4.8`, or `https://edgedl.me.gvt1.com/edgedl/android/studio/install/2025.1.4.8/android-studio-2025.1.4.8-windows.exe` | download `https://edgedl.me.gvt1.com/edgedl/android/studio/install/2025.1.4.8/android-studio-2025.1.4.8-mac_arm.dmg`; if a newer Studio already owns `/Applications/Android Studio.app`, install beside it and `export ANDROID_STUDIO_PATH=...` | `node setup/doctor.mjs` (reads `product-info.json`) | PICO "Set up the development environment" (OFFICIAL: "Currently, only the 2025.1.x version is supported"); plugin.xml in `SpatialPlugin-0.13.2.jar` (VERIFIED); pico-cli `HC()` (SOURCE); both installer URLs are embedded in pico-cli's `primer-cli-all.jar` and returned HTTP 200 (VERIFIED); archive: https://developer.android.com/studio/archive |
| 8 | **Java** | **21+** | pico-cli's emulator and doctor half is a Java jar (`primer-cli`) whose launcher requires Java 21+. **No separate JDK needed**: Android Studio 2025.1 bundles JBR 21 (`jbr/`, OpenJDK 21.0.6 here), and pico-cli sets `JAVA_HOME` to it | `setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"` | `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"` | `java -version` | `primer-cli.bat` launcher (SOURCE); `jbr\bin\java -version` (VERIFIED) |
| 9 | **Android SDK Platform 35 + Sources for Android 35** | API 35 (Android 15) | Required by the PICO toolchain; pico-cli checks `platforms/android-35` and `sources/android-35` | Android Studio > Settings > Languages & Frameworks > Android SDK > Show Package Details > Android 15.0 ("VanillaIceCream"), or `pico-cli emulator setup` | same | doctor row "Android SDK" | PICO setup doc (OFFICIAL); pico-cli (SOURCE) |
| 10 | **adb** (Android SDK Platform-Tools) | any current (37.0.1 on 2026-09-24) | Everything pico-cli does to the emulator goes through adb. pico-cli does **not** ship adb: it looks in `ADB_PATH`, the SDK's `platform-tools`, then the emulator bundle, then PATH | `winget install --id Google.PlatformTools -e` (or tick SDK Platform-Tools in Android Studio) | `brew install --cask android-platform-tools` | `adb version` | winget / formulae.brew.sh (VERIFIED); pico-cli (SOURCE) |
| 11 | **PICO Spatial plugin** "PICO Spatial (Global)" | matches the emulator's `major.minor` | Installs and manages the emulator from the IDE. Marketplace id 30402, plugin id `org.byted.ide.spatial.global`. Use **(CN)** only in mainland China | Android Studio > Plugins > Marketplace > "PICO Spatial" > **PICO Spatial (Global)** > Install > Restart IDE; or `pico-cli emulator setup` | same | doctor row "PICO Spatial plugin" | https://plugins.jetbrains.com/plugin/30402-pico-spatial-global- (VERIFIED via Marketplace API); PICO setup doc (OFFICIAL) |
| 12 | **PICO Emulator bundle + AVD** | PICO OS 6 (6.0.0 of 2026-07-31, or 6.1.0 of 2026-09-02) | The PICO OS 6 device in a window. ~4.3 GB download, ~12 GB installed, under `%LOCALAPPDATA%\PICO\sdk` or `~/Library/PICO/sdk`; AVDs in `~/.pico/avd` (not `~/.android/avd`) | `pico-cli emulator install`, then `pico-cli emulator create` (or `pico-cli emulator setup` for both) | same | `pico-cli emulator doctor`, `pico-cli emulator list` (not `--managed-only`: an AVD made in Android Studio's Device Manager shows `managed: no` and is hidden by that flag) | `pico-cli emulator * --help` (VERIFIED); PICO `sdk_config_global` (VERIFIED) |
| 13 | **PICO WebSpatial browser** | 6.0.0 artifact (`com.picoxr.browser`) | `pico-cli web launch` installs this 336 MB APK into the emulator before it opens a URL. Pre-download it at home | `pico-cli web setup` | same | doctor row "PICO WebSpatial browser staged" | pico-cli source + downloaded artifact (VERIFIED, `projects/pico-dev/kb/gotchas/pico-cli-web-launch-sideloads-a-browser-and-rewrites-localhost.md`) |

## Claude Code wiring (optional, recommended)

| # | Dependency | Why | Command (both OSes) | Verify | Source |
|---|---|---|---|---|---|
| 14 | **PICO plugin `pico-spatial-agentic-tools`** (17 skills) + **`pico-dev-knowledge` MCP** (PICO's docs as a graph) + `pico-spatial-editor` MCP | Gives Claude Code PICO's own skills and an offline docs graph. **It covers the native Spatial SDK far better than WebSpatial**: one of ~670 docs in the graph mentions WebSpatial. The web labs do not need it. There is no public marketplace URL; `pico-cli setup` stages a local marketplace (`pico-xr`) and registers it. PICO-licensed, like row 6 | Close every other Claude Code window, then `pico-cli setup --agent-tool claude-code --platform spatial --scope global --yes` | `pico-cli plugin doctor`, `pico-cli knowledge doctor` (expect `graphify serve: READY`) | PICO CLI installation guide (OFFICIAL); `~/.claude/plugins/known_marketplaces.json` on the build machine (VERIFIED); `projects/pico-dev/kb/gotchas/pico-cli-setup-kills-the-knowledge-mcp-out-from-under-every-session.md` (VERIFIED 2026-09-18: setup kills running knowledge servers) |
| 15 | **`chrome-devtools-mcp` 1.10.1** (in the kit's `.mcp.json`) | Lets Claude read the desktop page's console, network and screenshots. Needs Google Chrome installed. Claude Code asks once to approve project servers; `.claude/settings.json` pre-approves this one | nothing: `npx` fetches it on first use | `/mcp` inside Claude Code | npm registry, `--help` output (VERIFIED) |

## Hardware floor (emulator track)

| | Windows | macOS |
|---|---|---|
| OS | Windows 10 or 11, **64-bit** | **macOS 14.0** or newer |
| CPU | Intel Core i5 or equivalent | **Apple Silicon (PICO names M1 Pro). Intel Macs are NOT supported** |
| RAM | **16 GB** | **16 GB** |
| Disk free | **40 GB** | **40 GB** |
| GPU | **NVIDIA GeForce GTX 1060** or better | integrated Apple GPU |
| Virtualization | VT-x/AMD-V on in firmware, hypervisor present | built in |

**Source:** PICO, "Set up the development environment" (Spatial SDK quickstart,
`developer.picoxr.com/document/spatial-sdk/set-up-development-environment/`), read from PICO's own
offline copy in `agent-vault` 6.1.2, because developer.picoxr.com renders client-side and a plain
fetch returns no content. Cross-checked against the thresholds pico-cli actually enforces
(`EnvDoctorCommand` in `primer-cli-all.jar`: RAM passes at **≥ 15.0 GiB total**, disk at **≥ 40.0 GiB
free**; its strings include "Apple Silicon required, Intel chips are not supported" and "macOS 14.0 or
newer required"). An older PICO emulator page asked for **8 GB of VRAM**
(`projects/pico-dev/kb/gotchas/the-emulator-is-a-different-device-generation.md`, 2026-08-08); the
current setup page names the GTX 1060 instead.

**What the floor does not tell you.** 16 GB is the floor for the emulator *alone*. The guest takes
6 GB (`hw.ramSize=6144`), and it refuses to start without that much free commit. On the kit's own 16 GB
laptop, a launch failed with `ERROR: Insufficient RAM free for launching emulator` (VERIFIED
2026-08-08), and on 2026-09-24 a normal browser and editor load left only 1-2 GB free (VERIFIED,
`labs/EMULATOR-RESULTS.md`). With 16 GB: close Chrome and other Electron apps, run
`wsl --shutdown` on Windows, and set `hw.ramSize=4096` in `~/.pico/avd/<avd>.avd/config.ini`. A 16 GB
laptop booted that way (VERIFIED boot, 2026-09-24; page rendering at 4096 is still being confirmed).
32 GB is comfortable.

## Who cannot run the emulator, and what they do instead

Be blunt about this at the door. It saves an hour per person.

| You have | Emulator? | Do this |
|---|---|---|
| Intel Mac | **No**, PICO does not support it | Web-only track |
| Linux | **No**, PICO publishes Windows and macOS bundles only | Web-only track |
| Windows on ARM (Snapdragon laptops) | **No**, the emulator image is x86_64 | Web-only track |
| Under 15 GB RAM | **No**, pico-cli's own check fails | Web-only track |
| Base M1/M2/M3 (not Pro/Max) with 16 GB | Probably, below PICO's named M1 Pro | Try it; keep the web-only track as the fallback (UNVERIFIED on our side) |
| Windows with AMD/Intel graphics only | Unknown: PICO lists an NVIDIA card | Try it; web-only fallback (UNVERIFIED) |
| A Chromebook, tablet or work-locked laptop | No | Pair up |

**The web-only track is a real track, not a consolation prize.** Every lab builds and runs in a
desktop browser, where WebSpatial renders its flat fallback. Claude Code does the same work, and you
see the spatial result by (a) watching the instructor's emulator on the projector, or (b) pairing
with someone on the emulator track and sending them your URL. Run
`node setup/doctor.mjs --web-only` to get a clean checklist for it.

## Install commands not verified end to end

Each command below is quoted from an official source, and its package ID or URL was checked to exist
on 2026-09-24. None of them was run on a fresh machine: the kit's build machine already had
everything installed.

- `winget install --id Google.AndroidStudio -e --version 2025.1.4.8` (the version exists in winget)
- The macOS Android Studio dmg install path in `install-macos.sh` (the URL returns 200; no Mac has run it)
- `pico-cli emulator setup` on a machine with nothing installed (which steps prompt for input, or need
  a PICO account login, is unknown)
- `brew install node@24` + PATH, `xcode-select --install`, `brew install --cask android-platform-tools`
- Both installer scripts' `--yes` paths (only their dry-run and skip paths were run, on Windows)
- The whole macOS branch of `doctor.mjs`
