#!/usr/bin/env node
// Open a lab in the PICO Emulator's browser, as a secure context, so it can become a Web App.
//
//   node setup/launch.mjs 1                 lab p1 (start), dev server must already run
//   node setup/launch.mjs 1 --serve         start the lab's dev server first (background, log in .academy/logs/)
//   node setup/launch.mjs 3 --solution      the finished version of lab p3
//   node setup/launch.mjs --url http://localhost:5173/   any local URL
//   node setup/launch.mjs 4 --dry-run       show which folder/port/commands lab 4 resolves to; touches nothing
//   --via adb | --via web-launch            force one path (default: auto, see below)
//   add --device emulator-5556 when more than one emulator is up
//
// The recipe (MEASURED on the OS 6 emulator, emulator-lab + labs-builder, 2026-09-24):
//   adb -s <emu> reverse tcp:<port> tcp:<port>
//   adb -s <emu> shell am start -n com.picoxr.browser/com.google.android.apps.chrome.IntentDispatcher \
//       -a android.intent.action.VIEW -d http://localhost:<port>/
// then install / "Open as standalone app". Lab 1 installed as com.picoxr.webapp.localhost.* with depth.
// PICO's docs say to use http://10.0.2.2:<port>/, but that measured as NOT a secure context: no
// install prompt, and the page stays a flat tab. localhost through `adb reverse` is secure.
//
// `pico-cli web launch` is kept only to install the PICO browser when it is missing. It rewrites
// localhost to 10.0.2.2 (0.5.0, source-read), i.e. the flat URL, so the adb recipe always runs after
// it. On images where the browser is already installed under another uid, web launch dies with
// INSTALL_FAILED_UID_CHANGED; that is skipped the same way.
//
// Emulator only. Any adb target that is not `emulator-N` with ro.kernel.qemu=1 is refused.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { KIT, args, pickEmulator, reachable, resolveLab, sh } from './_lib.mjs';

const BROWSER = 'com.picoxr.browser';
const { flags, pos } = args();
const fail = (m) => { console.error(`\n[launch] ${m}\n`); process.exit(1); };
const via = flags['--via'] ? String(flags['--via']) : 'auto';
if (!['auto', 'adb', 'web-launch'].includes(via)) fail('--via must be adb or web-launch');

// --dry-run: resolve the lab and print the commands. Never touches adb, the emulator or a dev server.
const DRY = !!flags['--dry-run'];
let target;
if (DRY) target = { adb: 'adb', serial: flags['--device'] || 'emulator-5554' };
else { try { target = pickEmulator(flags['--device']); } catch (e) { fail(e.message); } }

let lab = null; let hostUrl;
if (flags['--url']) hostUrl = new URL(String(flags['--url']));
else if (pos[0]) {
  try { lab = resolveLab(pos[0], !!flags['--solution']); } catch (e) { fail(e.message); }
  hostUrl = new URL(`http://localhost:${lab.port}/`);
} else fail('Which lab? e.g. `node setup/launch.mjs 1`, or pass --url');
if (flags['--manifest']) console.log('[launch] --manifest is retired: the manifest route goes through web launch, which opens the flat 10.0.2.2 URL. Opening the page; install it from the browser.');

const port = Number(hostUrl.port || 80);
// Inside the guest, localhost:<port> is the host's port once `adb reverse` maps it.
const guest = new URL(hostUrl.href);
if (['127.0.0.1', '[::1]', '10.0.2.2'].includes(guest.hostname)) guest.hostname = 'localhost';
const guestUrl = guest.href;

const adb = `${target.adb} -s ${target.serial}`;
const reverseCmd = `${adb} reverse tcp:${port} tcp:${port}`;
// Explicit component: the start spatial-crack verified on the OS 6.0.0 emulator (2026-09-24). It avoids a
// browser chooser if anything else ever registers for VIEW. --implicit drops it.
const COMPONENT = `${BROWSER}/com.google.android.apps.chrome.IntentDispatcher`;
const openCmd = `${adb} shell am start ${flags['--implicit'] ? '' : `-n ${COMPONENT} `}-a android.intent.action.VIEW -d ${guestUrl}`;
const webCmd = `pico-cli web launch -d ${target.serial} --url ${hostUrl.href}`;

if (DRY) {
  console.log(`[launch] dry run${lab ? `: lab ${lab.dir} (${lab.variant}), folder ${lab.rel}, dev script "npm run ${lab.script}", port ${port}` : ''}`);
  console.log(`[launch] only if ${BROWSER} is missing (or --via web-launch), to install it: ${webCmd}`);
  console.log(`[launch] then: ${reverseCmd}`);
  console.log(`[launch] then: ${openCmd}`);
  console.log('[launch] device not checked in a dry run');
  process.exit(0);
}

const v4 = `http://127.0.0.1:${port}/`;
if (!(await reachable(v4))) {
  if (lab && flags['--serve']) {
    const logs = path.join(KIT, '.academy', 'logs');
    fs.mkdirSync(logs, { recursive: true });
    const log = path.join(logs, `${lab.dir}-${lab.variant}.log`);
    const out = fs.openSync(log, 'a');
    // One string through the shell: npm is a .cmd shim on Windows.
    const child = spawn(`npm run ${lab.script}`, { cwd: lab.root, shell: true, detached: true, stdio: ['ignore', out, out], windowsHide: true });
    child.unref();
    console.log(`[launch] started \`npm run ${lab.script}\` in ${lab.rel} (pid ${child.pid}), log ${path.relative(KIT, log)}`);
    for (let i = 0; i < 40 && !(await reachable(v4)); i++) await new Promise((r) => setTimeout(r, 500));
    if (!(await reachable(v4))) fail(`Dev server did not answer on ${v4} within 20 s. Read ${path.relative(KIT, log)}.`);
  } else if (await reachable(`http://localhost:${port}/`)) {
    fail(`Something answers on localhost:${port} but not on 127.0.0.1:${port}: the dev server is bound to IPv6 only. Stop it and run \`npm run dev:xr\` (binds 0.0.0.0).`);
  } else {
    fail(`Nothing is serving ${v4}.${lab ? ` Start it and launch in one step: node setup/launch.mjs ${pos[0]}${flags['--solution'] ? ' --solution' : ''} --serve` : ''}`);
  }
}

// 1. Browser present? If not, let web launch install it (it will open the flat 10.0.2.2 URL; ignored).
const hasBrowser = /package:/.test(sh(`${adb} shell pm path ${BROWSER}`, 30000).out);
if (via === 'web-launch' || (via === 'auto' && !hasBrowser)) {
  console.log(`[launch] ${hasBrowser ? '' : `${BROWSER} missing: `}${webCmd}   (installs the PICO WebSpatial browser, 336 MB on first use)`);
  const r = sh(webCmd, 300000);
  console.log(r.out);
  if (!r.ok) {
    if (/INSTALL_FAILED_UID_CHANGED/.test(r.out + r.err)) console.log('[launch] INSTALL_FAILED_UID_CHANGED: the browser is already installed under another uid. Continuing with adb.');
    else { console.error(r.err); fail(`pico-cli web launch failed (output above). \`pico-cli log -d ${target.serial} -l E -n 80\` shows the device side.`); }
  }
} else console.log(`[launch] ${BROWSER} is installed: skipping web launch`);

// 2. Map the port so the guest's localhost is a secure context pointing at our dev server.
console.log(`[launch] ${reverseCmd}`);
const rev = sh(reverseCmd, 30000);
if (!rev.ok) fail(`adb reverse failed: ${rev.err || rev.out}`);
const listed = sh(`${adb} reverse --list`, 30000).out;
if (!listed.includes(`tcp:${port}`)) fail(`adb reverse reported success but tcp:${port} is not in \`adb reverse --list\`:\n${listed}`);

// 3. Open it.
console.log(`[launch] ${openCmd}`);
let r = sh(openCmd, 60000);
console.log(r.out);
// Pinned component missing on this image ("Activity class {...} does not exist"): retry unpinned.
if (!flags['--implicit'] && /does not exist|Unable to resolve|No Activity found/i.test(r.out + r.err)) {
  const implicitCmd = `${adb} shell am start -a android.intent.action.VIEW -d ${guestUrl}`;
  console.log(`[launch] ${COMPONENT} not found; retrying unpinned: ${implicitCmd}`);
  r = sh(implicitCmd, 60000);
  console.log(r.out);
}
if (!r.ok || /Error|Exception/.test(r.out + r.err)) { console.error(r.err); fail(`am start failed (output above). \`pico-cli log -d ${target.serial} -l E -n 80\` shows the device side.`); }

console.log(`\n[launch] The emulator is loading ${guestUrl} in a browser TAB. A tab is never spatial (labs/SPATIAL-CRACK.md). Next:`);
console.log('  1. In the address bar, click the small monitor icon LEFT of the star -> "Install app" dialog -> Install.');
console.log('  2. The app opens in its own window. Wait up to 60 s; if the panels are still missing, close and reopen the app once (cold launch: 10-50 s).');
console.log('  3. Spatial check: the UA contains PicoWebApp/ and WebSpatial/ (the tab has PicoBrowser/ and no WebSpatial/).');
console.log('  4. Later: relaunch from the app\'s own launcher tile. Changed the manifest? Uninstall the com.picoxr.webapp.localhost.* package and install again.');
console.log(`[launch] The reverse mapping lasts until the emulator restarts (then re-run this) or \`${adb} reverse --remove tcp:${port}\`.`);
console.log(`[launch] Screenshot: node setup/snap.mjs    Logs: pico-cli log -d ${target.serial} -e "chromium|Console|WebSpatial" -n 100`);
