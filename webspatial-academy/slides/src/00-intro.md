=== intro-s1 concept
# PICO WebSpatial Academy
layout: cover
wifi: Homebrew-Club | homebrew
repo: https://github.com/RayyanZahid/pico-workshops
eyebrow: Workshop · PICO OS 6 · WebSpatial · Claude Code
lead: Take an ordinary website, make it spatial, and run it in the PICO OS 6 emulator. Claude Code does the typing.

Six levels, from an empty laptop to your own site floating in space. Every step has one action, the exact command or prompt, and what you should see.

::: notes
Open on this slide while people settle. Press I for the level index, N to hide these notes, 0 to 5 to jump to a level. The follow-along link is this same page: it scrolls on a phone.
:::

=== intro-s2 concept
# Three facts before you start
lead: Each one has cost someone an hour. Say them out loud.

- **WebSpatial requires React.** It works by replacing React's JSX runtime. There is no plain-HTML path today.
- **WebSpatial needs PICO OS 6.** The emulator is PICO OS 6 and has the runtime built in, so you open a URL and nothing gets packaged. A PICO 4 Ultra runs OS 5.x and shows a flat page.
- **The SDK just moved to 2.0.** `@webspatial/react-sdk` 2.0.0 is what the labs pin. We teach the 2.x API (`<SpatialBoot>`). Older guides use `@webspatial/vite-plugin` and `XR_ENV=avp`, which belong to 1.x.

::: notes
Source: curriculum/SYLLABUS.md "Three facts before you start". If someone has a 1.x project, point them at curriculum/TROUBLESHOOTING.md#version-drift and move on.
:::

=== intro-s3 concept
# Six levels, three hours
layout: agenda
eyebrow: The level map
lead: Pass each lab's check before you start the next level. Press 0 to 5 to jump.

L2 is the headline lab. The emulator install is **pre-work**: don't try to install Android Studio in the room.

::: notes
Run of show from SYLLABUS.md: 0:00 L0 check-in (25), 0:25 L1 (25), 0:50 L2 (45), 1:35 break (10), 1:45 L3 (30), 2:15 L4 (30), 2:45 L5 (15 in the room), 3:00 end. L4 can be demo-only if the room is behind. Self-paced total is about 15.5 h.
:::

=== intro-s4 concept
# How the pieces talk
lead: Four things on one machine. Claude Code drives all of them.

- **Node + Vite** serves your site on a port per lab (5301 for lab 1).
- **PICO OS 6 emulator** is a PICO device in a window, built on the Android emulator.
- **pico-cli** is PICO's one command line for the emulator, apps, logs, screenshots and perf.
- **Claude Code** runs pico-cli and the dev server, and asks the `pico-dev-knowledge` MCP about PICO docs.

The emulator opens your site at `http://localhost:<port>/`, mapped to your machine with `adb reverse`. `node setup/launch.mjs <n>` does the mapping for you.

::: notes
The localhost-through-adb-reverse point comes back in every level; land it here once. MEASURED on the OS 6 emulator (emulator-lab + labs-builder, 2026-09-24): http://10.0.2.2:<port>/ loads but reports isSecureContext=false, beforeinstallprompt never fires, and the page stays a flat tab. localhost through adb reverse is a secure context, and Lab 1 installed as com.picoxr.webapp.localhost.* with depth. PICO's docs say 10.0.2.2; the measurement overrides them for this workshop (assets/pico-docs/WEB-APP-RUNTIME.md section 3, kit CLAUDE.md, setup/launch.mjs).
:::

=== intro-s5 concept
# From PICO: PICO CLI Quickstart, David Oh
eyebrow: From PICO · Show this first
lead: David Oh's deck is the native Spatial SDK (Kotlin) path. The Academy is the WebSpatial path to the same PICO OS 6 emulator.
img: ../partner/pico-cli-quickstart-david-oh/slides/slide-01.png | Cover of David Oh's deck, unmodified: "Build a PICO Spatial app with Claude, from zero". Install the CLI, connect it to Claude Code, and get a first Spatial SDK app running on the PICO emulator.

- **His path:** `pico-cli project create` a planar, volumetric or stage app in Kotlin, build it, then install and launch it in the emulator.
- **Our path:** a React website, spatialized with WebSpatial, opened as a Web App in the same emulator.
- Same pico-cli, same emulator, same Claude Code wiring.

[Open David Oh's deck: PICO CLI Quickstart](../partner/pico-cli-quickstart-david-oh/index.html)

::: notes
Sent by David Oh (PICO) on 2026-09-24 for tonight. It's presented exactly as sent: never edit or re-theme anything in partner/. Its README lists where our kit is more specific (for example, pico-cli 0.5.0 accepts only Android Studio 2025.1.x); those are answers for questions, not corrections to his slides.
:::
