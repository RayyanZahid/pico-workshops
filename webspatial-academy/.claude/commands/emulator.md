---
description: Start the PICO OS 6 emulator if it is not running, then report its status
argument-hint: "[stop]"
---

Manage the PICO Emulator. Arguments: "$ARGUMENTS".

If the arguments say `stop`: run `pico-cli emulator stop`, confirm with
`pico-cli emulator status --format json`, and stop there.

Otherwise:

1. `pico-cli emulator status --format json`. Only the top-level `data.processRunning` and
   `data.adbOnline` are live; `data.state` describes the previous boot and can say "running" when
   nothing is. If both are true, report the device id (`data.adbDeviceId`, usually `emulator-5554`)
   and stop.
2. Before starting, check headroom: `node setup/doctor.mjs --json --quick` and read the host checks.
   If free commit/RAM is below what the 6 GB guest needs, tell me what to close (browsers; on Windows
   also `wsl --shutdown`) and wait for me.
3. `pico-cli emulator start --format json`. It waits for adb readiness, and a first boot can take
   several minutes. Run it in the background and poll `pico-cli emulator status --format json` every
   ~20 s, not faster.
4. If it fails with no clear message, the cause is often on stderr only ("Insufficient RAM free for
   launching emulator"). Show me the stderr output. `pico-cli emulator dump-logs` exports the
   emulator logs.
5. Finish with the device id and "next: `/launch <lab number>`".

Never pass `--wipe-data`, and never run `emulator delete` or `delete-image`, without asking me first.
