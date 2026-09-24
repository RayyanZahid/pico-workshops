# PICO CLI Quickstart (from David Oh, PICO)

Sent by David Oh (PICO) on 2026-09-24 at 14:29 PT, subject "Claude Group Pres":
"Here's a prez for your claude meetup tonight".

**The deck is presented exactly as sent. Do not edit these files.**

| File | What it is |
|---|---|
| `PICO CLI Quickstart.pptx` | The original, byte for byte (sha256 `c7beb283534ec7132521e06cd356f27e8d6b2b9a548dee8d70bb318a4272ae10`) |
| `PICO CLI Quickstart.pdf` | Exported from the original by PowerPoint, no edits |
| `slides/slide-01.png` … `slide-12.png` | 1920×1080 renders of each slide, exported by PowerPoint |
| `index.html` | Viewer: arrow keys, `#N` deep links. Shows the renders unchanged |
| `slides.md` | Verbatim slide text for agents and screen readers |

## Where it fits

David's deck is the **native Spatial SDK (Kotlin) path**: `pico-cli project create` a planar,
volumetric or stage app, `gradlew assembleDebug`, then `pico-cli emulator start` / `app install` /
`app launch`. The Academy is the **WebSpatial (React) path** into the same PICO OS 6 emulator. Show
his deck first as the PICO CLI overview, then the Academy for the web path. Slide 12 is the PICO
Early Access Developer Program (up to $1500 for publishing an AI-generated app, Oct 1 to Nov 11
2026, hardware access).

## Presenter notes: where our kit is more specific (his slides stay as they are)

These are not corrections to his deck; they are what our own setup docs say after testing on
2026-09-24, so the presenter can answer questions:

- **Android Studio:** his slide 3 says "2025.1+". pico-cli 0.5.0 accepts only 2025.1.x, and the
  current winget/brew install (2026.1) fails its check. See `setup/SETUP.md` step 10.
- **Node:** his slide 3 says 18+. The WebSpatial labs need 20.19+ or 22.12+ (Vite 8).
- **Claude Code install:** his slide 4 uses npm. The official installer is now the native one
  (`setup/DEPENDENCIES.md`); npm also works on Node 22+.
- **pico-cli version:** his slide 5 shows real 0.4.2 output and notes 0.5.0 is out. The kit is on
  0.5.0. Both `pico-cli app logcat` (his slide 9) and `pico-cli log` exist in 0.5.0.
