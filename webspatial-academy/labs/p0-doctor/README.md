# p0 · Doctor: is this machine ready?

## Goal

Find out in two minutes whether your laptop can run the PICO OS 6 emulator, or whether you are on the web-only track. Then install the lab dependencies once.

## What you'll learn

- Which track you are on: **emulator** (full spatial loop) or **web-only** (every lab runs flat in your browser, and you watch the spatial version on the projector).
- How to read a doctor report: `fail` blocks you, `warn` is worth a look, `info` is context.
- How the emulator reaches your dev server: `adb reverse` maps its `localhost:<port>` to yours. That address is a secure context, which a page needs before it can become a web app. `10.0.2.2` also reaches your machine, but it only ever gives a flat tab.

There is no app in this lab. The doctor lives in the kit at [`setup/doctor.mjs`](../../setup/doctor.mjs) and the step-by-step install guide in [`setup/SETUP.md`](../../setup/SETUP.md).

## Steps

**1. Run the doctor** from the kit root (the folder with `CLAUDE.md`):

```bash
node setup/doctor.mjs
```

Expected: a report grouped as *This machine · Core tools · Claude Code wiring · PICO Emulator chain*, ending in a verdict line such as `READY`, `READY WITH WARNINGS  0 fail, 2 warn`, or `NOT READY`. It is read-only and takes about 10 seconds.

**2. On an Intel Mac, Linux, Windows on ARM, or under 16 GB of RAM**, run the web-only variant. Emulator problems then become notes instead of failures:

```bash
node setup/doctor.mjs --web-only
```

**3. Let Claude Code read it for you.** Start `claude` in the kit root and paste:

```text
Run `node setup/doctor.mjs --json`, tell me my track and verdict, and for every fail or warn
give me the exact fix line from the report. Do not run any fix yet.
```

Expected: Claude reports `track` and `verdict` from the JSON and lists each `fix` line. It asks before installing anything.

**4. Install the lab dependencies once** (about 75 MB, one npm workspace for every lab):

```bash
npm run labs:install        # same as running npm install inside labs/
```

Expected: `added ... packages` with no `ERR!`, and a `labs/node_modules/` folder.

**5. Prove a lab builds and serves:**

```bash
cd labs/p1-hello-spatial/solution
npm run build
npm run dev
```

Expected: `✓ built in ...ms`, then `Local: http://localhost:5311/`. Open it and you'll see "Hello, spatial web." on a dark violet background. Stop the server with Ctrl+C.

**6. (Emulator track only) Boot the emulator** and check it:

```bash
pico-cli emulator start
pico-cli emulator status
```

Expected: `ADB online: yes`. On a 16 GB laptop, first close Chrome and other heavy apps, and on Windows run `wsl --shutdown`. The emulator guest reserves 6 GB. If there isn't enough RAM it refuses to start and says so **on stderr only**.

## Checkpoint: you're ready when...

- [ ] `node setup/doctor.mjs` ends in `READY` or `READY WITH WARNINGS` with **0 fail**, on your track
- [ ] `labs/node_modules/@webspatial/react-sdk/package.json` exists and says `"version": "2.0.0"`
- [ ] `npm run build` in `labs/p1-hello-spatial/solution` prints `✓ built`
- [ ] `npm run dev` there serves `http://localhost:5311/` and the browser console shows no errors
- [ ] Emulator track: `pico-cli emulator status` shows `ADB online: yes`
- [ ] You can explain in one sentence why the labs open `http://localhost:<port>/` in the emulator after `adb reverse`, not `http://10.0.2.2:<port>/`: only a secure-context page can be installed as a web app, and only the installed web app is spatial

## Stretch goals

- Run `node setup/launch.mjs 1 --solution --dry-run`. It prints which folder, script and port lab 1 resolves to, and touches nothing.
- Ask Claude: "Which of my running apps use the most RAM, and which should I close before starting the PICO emulator?"
