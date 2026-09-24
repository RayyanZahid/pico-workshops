# L0 Setup: zero to "Claude Code + WebSpatial + the PICO emulator"

One path, one step per screen. Each step has the command, what you should see, and what to do if
you don't. Expected output is real output from the kit's build machine (Windows 11, 2026-09-24)
unless it says "shape only". Your version numbers will differ slightly. Two commands, `pico-cli
emulator setup` and `pico-cli emulator start`, were not run for this page (the machine was already
set up and another session owned the emulator), so their blocks show the check you run afterwards.

**Do steps 1-8 before the event.** They download several GB, and event Wi-Fi will not cope.

**Shortcut:** `setup/install-windows.ps1` and `setup/install-macos.sh` run steps 2-6 (and 9-13 with
`--emulator`, 14 with `--agent`). Without `--yes` they only print what they would do. Details and
sources for every dependency are in [`DEPENDENCIES.md`](DEPENDENCIES.md).

---

## Step 1. Get the kit, and pick your track

Already have Git and Node 20.19+? This is the whole start:

```bash
git clone https://github.com/RayyanZahid/pico-workshops.git
cd pico-workshops/webspatial-academy
npm run labs:install
npm run doctor
```

Missing Git or Node? Do steps 3 and 4 first, then come back to these four lines. Everything
after this runs from inside `pico-workshops/webspatial-academy`.

Now look at this table before installing anything else.

| You have | Track |
|---|---|
| Windows 10/11 64-bit (x86), 16 GB+ RAM, NVIDIA GPU | **Emulator** |
| Apple Silicon Mac, macOS 14+, 16 GB+ RAM | **Emulator** |
| Intel Mac · Linux · Windows on ARM · under 16 GB RAM | **Web-only** |

Web-only means every lab runs in your desktop browser as a flat page, and you watch the spatial
version on the projector or pair with someone on the emulator track. You still build everything.

**If you are unsure:** finish steps 2-8, then the doctor tells you.

---

## Step 2. Open a terminal in the kit

If you ran the clone in step 1, you are already there (`pico-workshops/webspatial-academy`).
Coming back later:

**Windows:** open `pico-workshops\webspatial-academy` in File Explorer, click the address bar, type
`powershell`, press Enter.
**macOS:** Terminal, then `cd ` (with a space), drag the `webspatial-academy` folder onto the window,
press Enter.

```text
> ls
CLAUDE.md  README.md  assets/  curriculum/  labs/  package.json  setup/  slides/  theme/
```

**If it fails:** if you see files from a different folder, you are in the wrong place. `cd` into
the folder that contains `CLAUDE.md`.

---

## Step 3. Node.js (24 LTS)

| Windows | macOS |
|---|---|
| `winget install --id OpenJS.NodeJS.LTS -e` | `brew install node@24`, then `echo 'export PATH="$(brew --prefix)/opt/node@24/bin:$PATH"' >> ~/.zshrc` |

Close the terminal, open a new one, then:

```text
> node --version
v22.17.0
```

That's the build machine. A fresh LTS install prints `v24.x`. Anything from `v22.12` up works
(`v20.19+` too).

**If it fails:** `node` not found means PATH was not refreshed. Open a *new* terminal. On macOS
with no `brew`, install Homebrew first from https://brew.sh.

---

## Step 4. Git

| Windows | macOS |
|---|---|
| `winget install --id Git.Git -e` | `xcode-select --install` (click Install in the dialog) |

```text
> git --version
git version 2.48.1.windows.1
```

**If it fails:** open a new terminal. On macOS, finish the Apple dialog; it can take 5-10 minutes.

---

## Step 5. Claude Code

| Windows (PowerShell) | macOS |
|---|---|
| `irm https://claude.ai/install.ps1 \| iex` | `curl -fsSL https://claude.ai/install.sh \| bash` |

```text
> claude --version
2.1.282 (Claude Code)
```

Then run `claude` once and log in in the browser window it opens. **You need a Pro, Max, Team,
Enterprise or Console account; the free claude.ai plan does not include Claude Code.**

**If it fails:** `The token '&&' is not a valid statement separator` means you pasted the CMD
command into PowerShell. `claude doctor` explains most other problems. Official troubleshooting:
https://code.claude.com/docs/en/troubleshoot-install

---

## Step 6. PICO CLI

```text
> npm install -g @picoxr/pico-cli
> pico-cli --version
pico-cli/0.5.0 (public) win32-x64 node-v22.17.0
```

Type the `@picoxr/` part. **`npm install -g pico-cli` installs an unrelated package.**

**If it fails:** if `pico-cli --version` prints anything that does not start with `pico-cli/`, you
have the wrong package: `npm uninstall -g pico-cli`, then install `@picoxr/pico-cli`.

---

## Step 7. Lab packages

```text
> npm run labs:install
added <n> packages, and audited <n> packages in <time>
```

(Shape only; the count varies.)

**If it fails:** an `EBADENGINE` warning naming `vite` means your Node is too old: redo step 3.
Network errors: retry on a better connection. This is a few hundred MB.

---

## Step 8. First doctor

```text
> npm run doctor:web
...
READY  0 fail, 0 warn
```

This checks everything the web-only track needs. On the emulator track, keep going; web-only
attendees are done with setup. Skip to step 15.

**If it fails:** each `FAIL` line has a `fix:` line under it. Run that command, then the doctor again.

---

## Step 9. Emulator track: the license, in one line

The PICO Emulator and PICO WebSpatial browser are licensed by PICO; tonight's attendees are cleared
by PICO for this workshop. pico-cli accepts the license on your behalf. Read it at
https://developer.picoxr.com/document/distribute/sdk-license-terms/.

Screenshots are fine inside the workshop. Check with PICO before publishing OS screenshots anywhere
else.

---

## Step 10. Android Studio 2025.1.x (not the latest)

> **WARNING: the current Android Studio release FAILS.** PICO's plugin only loads in Android Studio
> **2025.1.x** (it declares `until-build 251.*`), and pico-cli checks for "2025.1" in the version.
> The download button on developer.android.com, `winget install Google.AndroidStudio` and
> `brew install --cask android-studio` all give you **2026.1**, which fails that check. Install
> **2025.1.4.8**, the version PICO's own tools pin.

| | Command or download (Android Studio 2025.1.4.8) |
|---|---|
| Windows | `winget install --id Google.AndroidStudio -e --version 2025.1.4.8`, or download https://edgedl.me.gvt1.com/edgedl/android/studio/install/2025.1.4.8/android-studio-2025.1.4.8-windows.exe (1.4 GB) |
| macOS (Apple Silicon) | https://edgedl.me.gvt1.com/edgedl/android/studio/install/2025.1.4.8/android-studio-2025.1.4.8-mac_arm.dmg (1.4 GB), or `bash setup/install-macos.sh --yes --emulator`, which installs it for you |
| Any other 2025.1.x | https://developer.android.com/studio/archive (accept the terms, find a 2025.1 release) |

Launch it once and click through the setup wizard (Standard install is fine).

```text
> node setup/doctor.mjs --quick
  PASS  Android Studio AndroidStudio2025.1.1 (AI-251.25410.109.2511.13752376) at C:\Program Files\Android\Android Studio
```

**If it fails:** "found, but PICO requires 2025.1.x" means you have a newer one. Install 2025.1.4.8
beside it. On macOS, if the newer one owns `/Applications/Android Studio.app`, the script installs
to `~/Applications/Android Studio 2025.1.app` and sets `ANDROID_STUDIO_PATH` so pico-cli finds it.

---

## Step 11. PICO's emulator prerequisites (one command)

```text
> pico-cli emulator setup
```

This fills only what's missing: Android SDK 35, Java, the PICO Spatial plugin, `PICO_HOME`, the
emulator bundle (~4.3 GB download, ~12 GB on disk) and an AVD. It can take 20-40 minutes. Then:

```text
> pico-cli emulator doctor --format json
  "summary": "PICO Emulator prerequisites are ready; optional components may be skipped.",
```

**If it fails:** run `node setup/doctor.mjs` and do the manual steps its `fix:` lines give (the
Android Studio menus for SDK 35 and the "PICO Spatial (Global)" plugin). A virtualization failure on
Windows means turning on VT-x/AMD-V in BIOS and "Windows Hypervisor Platform" in
`optionalfeatures.exe`, then rebooting.

---

## Step 12. The web runtime (336 MB)

```text
> pico-cli web setup
```

This downloads the PICO WebSpatial browser that `pico-cli web launch` installs into the emulator.
Doing it now saves the download at the event.

**If it fails:** it's safe to retry. If you skip it, the first `/launch` downloads it instead.

---

## Step 13. Boot the emulator once

Close Chrome, Slack, and anything else heavy. On Windows, also run `wsl --shutdown`. The emulator
reserves 6 GB by default.

**On a 16 GB machine, lower it to 4 GB first.** With the emulator stopped, open
`~/.pico/avd/<avd name>.avd/config.ini` (Windows: `%USERPROFILE%\.pico\avd\PICO_6.0.avd\config.ini`)
and change `hw.ramSize=6144` to `hw.ramSize=4096`. A 16 GB laptop booted this way on 2026-09-24.
Page rendering at 4096 is still being confirmed.

```text
> pico-cli emulator start
> pico-cli emulator status
Process running: yes
ADB online: yes
ADB device: emulator-5554
```

The first boot takes several minutes. A window with PICO OS 6 appears.

**If it fails:** if nothing happens and the log shows nothing useful, the real error is on stderr
only: `ERROR: Insufficient RAM free for launching emulator`. Close more apps and try again.
`pico-cli emulator dump-logs` collects the logs.

---

## Step 14. Optional: PICO's plugin for Claude Code

Close **every** Claude Code window first. This command stops PICO's knowledge server in any session
that has it running.

```text
> pico-cli setup --agent-tool claude-code --platform spatial --scope global --yes
> pico-cli knowledge doctor
  graphify serve: READY
```

This gives Claude PICO's skills and an offline PICO docs graph (mostly native Spatial SDK). The web
labs work without it.

**If it fails:** `pico-cli plugin doctor` explains a broken install. If it ran while Claude Code was
open, restart Claude Code.

---

## Step 15. Final doctor, then hand over to Claude

```text
> npm run doctor              # emulator track
> npm run doctor:web          # web-only track
READY WITH WARNINGS  0 fail, 2 warn
```

**0 fail is the bar.** Warnings are advice. The full sample, with what each warning means, is in
[`DOCTOR-SAMPLE.md`](DOCTOR-SAMPLE.md).

Now start Claude Code in the kit folder and let it drive:

```text
> claude
> /doctor
> /lab 1
```

**If it fails:** paste the doctor output to Claude and ask, "What do I fix first?"

---

## No emulator? Here is your day

1. `npm run doctor:web` → READY.
2. `claude`, then `/lab 1`. Claude starts the lab's dev server and gives you `http://localhost:5301/`.
3. Build each lab in your desktop browser. Spatial elements render as flat cards: that is
   WebSpatial's fallback working as designed.
4. To see it in 3D, send your code to someone on the emulator track, or watch the instructor's
   emulator on the projector.
