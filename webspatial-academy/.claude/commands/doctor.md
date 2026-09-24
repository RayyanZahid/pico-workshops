---
description: Check this machine for the PICO WebSpatial Academy (read-only) and explain the result
argument-hint: "[--web-only]"
---

Run `node setup/doctor.mjs --json $ARGUMENTS` from the kit root. It is read-only.

Then tell me, in this order:

1. The verdict and my track (`emulator` or `web-only`) in one sentence. If I'm on the web-only
   track, say plainly why (the failing host check) and what I do instead: labs in a desktop
   browser, the emulator on the projector or a partner's machine.
2. Every `fail`, then every `warn`, as a short list: what it means in plain words, then the exact
   `fix` command from the JSON. Group them by `group`.
3. The single next step I should take.

Do not run any fix command yourself. Ask me first, one at a time. If a fix installs something
large (Android Studio, the emulator bundle, the 336 MB web runtime), say how big it is and suggest
doing it off event Wi-Fi. If a fix is `pico-cli setup`, warn me to close every other Claude Code
window first.
