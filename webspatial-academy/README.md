# PICO WebSpatial Academy

Take an ordinary website and make it **spatial**: panels that lift off the page, glass
materials, extra windows you can place around you, 3D models in volumes. You run it in the
**PICO OS 6 emulator**, and **Claude Code** does most of the typing, launching, screenshotting and
log reading. Beginner to expert in six levels; by the end you can do it to your own site.

The stack is [WebSpatial](https://webspatial.dev) (`@webspatial/react-sdk` +
`@webspatial/core-sdk` **2.0.0**, React 19, Vite 8), PICO's [`@picoxr/pico-cli`](https://www.npmjs.com/package/@picoxr/pico-cli)
0.5.0, and the PICO OS 6 emulator.

## Quickstart

```bash
# 0. Get the kit (needs Git and Node 20.19+; the installers below add them if missing)
git clone https://github.com/RayyanZahid/pico-workshops.git
cd pico-workshops/webspatial-academy
npm run labs:install
npm run doctor

# 1. Pre-work, at home: install everything (dry run first; nothing installs without --yes)
powershell -ExecutionPolicy Bypass -File setup/install-windows.ps1 --yes --emulator   # Windows
bash setup/install-macos.sh --yes --emulator                                        # Apple Silicon Mac
#    web-only track (Intel Mac, Linux, <16 GB RAM): drop --emulator

# 2. Prove it works
npm run doctor            # emulator track
npm run doctor:web        # web-only track

# 3. Hand over to Claude Code
claude
/doctor
/lab 1
```

Step-by-step with expected output: [`setup/SETUP.md`](setup/SETUP.md). Every dependency, its version
floor and its source: [`setup/DEPENDENCIES.md`](setup/DEPENDENCIES.md).

## Two tracks, same labs

| | Emulator track | Web-only track |
|---|---|---|
| Who | Windows 10/11 x64 or Apple Silicon Mac, 16 GB+ RAM, 40 GB free disk, NVIDIA GTX 1060+ on Windows | Everyone else: Intel Mac, Linux, Windows on ARM, under 16 GB RAM |
| You see | Real spatial windows and volumes in PICO OS 6 | The same app as a flat page in your desktop browser (WebSpatial's built-in fallback), plus the instructor's emulator on the projector or a partner's screen |
| You build | Everything | Everything |

16 GB is PICO's floor for the emulator *alone*: the guest defaults to 6 GB. On a 16 GB machine,
close your browser, set `hw.ramSize=4096` in the AVD's `config.ini` (SETUP step 13), and boot. 32 GB
is comfortable.

## Level map

| Level | Title | Lab | In the room | Self-paced |
|---|---|---|---|---|
| **L0** | Setup: Claude Code, Node, pico-cli, the PICO OS 6 emulator | [`setup/`](setup/SETUP.md) (`npm run doctor`) | 25 min (install is pre-work) | 2 h |
| **L1** | Hello Spatial: your first WebSpatial app in the emulator | [`labs/p1-hello-spatial`](labs/p1-hello-spatial) | 25 min | 1.5 h |
| **L2** | Spatialize a website: `enable-xr`, depth, materials, a second window | [`labs/p2-spatialize-site`](labs/p2-spatialize-site) | 45 min | 3 h |
| **L3** | 3D and volumes: models, entities, interaction | [`labs/p3-volume-model`](labs/p3-volume-model) | 30 min | 2.5 h |
| **L4** | Depth as gameplay + multi-window: Space Invaders in space, with a HUD window | [`labs/p4-space-invaders`](labs/p4-space-invaders) | 30 min | 2.5 h |
| **L5** | Agentic expert: Claude Code runs build, emulator, debug and perf; capstone | [`labs/p5-capstone`](labs/p5-capstone) | 25 min | 4 h |

Objectives, concepts and prompts per level: [`curriculum/SYLLABUS.md`](curriculum/SYLLABUS.md)
(machine-readable: [`curriculum/outline.json`](curriculum/outline.json)).

## Labs

Every lab has a `start/` you edit and a `solution/` you can check against (p5 has a `template/`).
Install once for all of them with `npm run labs:install`.

| Lab | What you build | Start → port | Solution → port |
|---|---|---|---|
| p1-hello-spatial | One React page, one lifted glass card | `start/` → 5301 | `solution/` → 5311 |
| p2-spatialize-site | An existing site, spatialized without changing the desktop version | `start/` → 5302 | `solution/` → 5312 |
| p3-volume-model | A 3D model in a volume you can tap and rotate | `start/` → 5303 | `solution/` → 5313 |
| p4-space-invaders | Space Invaders with rows at different depths, plus a HUD window kept in sync over `BroadcastChannel` | `start/` → 5304 | `solution/` → 5314 |
| p5-capstone | Your own site, with Claude Code running the loop | `template/` → 5305 | `solution/` → 5315 |

Ports come from each lab's `package.json`. Run a lab with `npm run dev` (desktop) or `npm run dev:xr`
(binds 0.0.0.0), then `/launch <n>`, which maps the port with `adb reverse` and opens
`http://localhost:<port>/` in the emulator. Use localhost, not `10.0.2.2`: 10.0.2.2 measured as not a
secure context, so the page cannot become a Web App.

## Claude Code in this kit

Open Claude Code in this folder and it reads [`CLAUDE.md`](CLAUDE.md), which teaches it the whole
loop: labs, ports, the WebSpatial 2.0 rules, the emulator, and what not to do. Slash commands:

| Command | Does |
|---|---|
| `/doctor` | Checks this machine (read-only) and tells you the next fix |
| `/lab <n>` | Opens lab n, starts its dev server, walks you into step 1 |
| `/emulator` | Starts the PICO emulator if needed and reports its device id (`/emulator stop` to stop) |
| `/launch <n>` | Type-checks lab n and opens it in the emulator's PICO Browser |
| `/snap` | Screenshots the emulator (burst, keeps the cleanest frame) and describes it |

Behind them: [`setup/doctor.mjs`](setup/doctor.mjs), [`setup/launch.mjs`](setup/launch.mjs) and
[`setup/snap.mjs`](setup/snap.mjs), all zero-dependency Node you can run yourself. The skill
[`.claude/skills/verify-in-emulator`](.claude/skills/verify-in-emulator/SKILL.md) makes Claude show a
screenshot and logs before it says something works. [`.mcp.json`](.mcp.json) adds Chrome DevTools MCP
for the desktop build. PICO's own Claude Code plugin and docs MCP are optional ([SETUP step 14](setup/SETUP.md#step-14-optional-picos-plugin-for-claude-code)).

## Read before the event

- **License.** The PICO Emulator and PICO WebSpatial browser are licensed by PICO; tonight's
  attendees are cleared by PICO for this workshop. pico-cli accepts the license on your behalf.
  Read it at https://developer.picoxr.com/document/distribute/sdk-license-terms/. Check with PICO
  before publishing OS screenshots outside the workshop.
- **`pico-cli web launch` is for the emulator only.** It installs a 336 MB browser APK on its
  target and rewrites `localhost` to `10.0.2.2`. Never point it at a physical headset, especially a
  borrowed one. `/launch` refuses to.
- **Android Studio must be 2025.1.x.** The PICO plugin cannot load in newer versions, and `winget` or
  `brew` give you a newer one by default. The installers pin 2025.1.4.8.
- **WebSpatial 2.0 broke 1.x.** Videos and tutorials from before August 2026 show 1.x. When they
  disagree with the labs, the labs win. Exact pins: `labs/VERSIONS.md`. Never add
  `@webspatial/vite-plugin`: it breaks 2.0 builds.
- **WebSpatial needs PICO OS 6.** A PICO 4 Ultra runs OS 5.x; a WebSpatial page falls back to flat
  there. A clean emulator run proves your code is right for OS 6, not that it runs on other hardware.

## Layout

```
CLAUDE.md          instructions Claude Code loads in this folder
.claude/           slash commands, settings (permissions), skills
.mcp.json          Chrome DevTools MCP for the desktop build
setup/             SETUP.md walkthrough, DEPENDENCIES.md, doctor/launch/snap scripts, installers
labs/              p1-p5, each with start/ and solution/
curriculum/        syllabus, per-level notes, glossary, troubleshooting
slides/            the workshop deck
theme/             the shared PICO look (pico.css)
assets/            images, emulator walkthrough
captures/          your emulator screenshots (git-ignored)
```
