// Shared helpers for setup/launch.mjs and setup/snap.mjs. Zero dependencies.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIN = process.platform === 'win32';

export function sh(cmd, timeout = 60000) {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', timeout, windowsHide: true });
  return { ok: r.status === 0, out: `${r.stdout || ''}`.trim(), err: `${r.stderr || ''}`.trim() };
}

export function args() {
  const a = process.argv.slice(2);
  const flags = {};
  const pos = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--')) {
      const [k, v] = a[i].split('=');
      flags[k] = v ?? (a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true);
    } else pos.push(a[i]);
  }
  return { flags, pos };
}

// Same resolution order pico-cli 0.5.0 uses: ADB_PATH, SDK platform-tools, the emulator bundle, PATH.
export function findAdb() {
  const exe = WIN ? 'adb.exe' : 'adb';
  const home = os.homedir();
  const picoHome = process.env.PICO_HOME || (process.platform === 'darwin' ? path.join(home, 'Library', 'PICO', 'sdk') : path.join(process.env.LOCALAPPDATA || '', 'PICO', 'sdk'));
  const sdks = [process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME,
    process.platform === 'darwin' ? path.join(home, 'Library', 'Android', 'sdk') : path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')].filter(Boolean);
  let bundles = [];
  try { bundles = fs.readdirSync(picoHome).map((v) => path.join(picoHome, v, 'emulator', 'system-images', 'platform-tools', exe)); } catch { /* none */ }
  const hit = [process.env.ADB_PATH, ...sdks.map((s) => path.join(s, 'platform-tools', exe)), ...bundles].filter(Boolean).find((p) => fs.existsSync(p));
  return hit ? `"${hit}"` : 'adb';
}

// Emulators only. A PICO loaner headset is never a valid target for anything that installs.
export function emulators() {
  const adb = findAdb();
  const lines = sh(`${adb} devices`).out.split(/\r?\n/).slice(1);
  const online = lines.map((l) => l.trim().split(/\s+/)).filter(([, st]) => st === 'device').map(([s]) => s);
  const real = online.filter((s) => !/^emulator-\d+$/.test(s));
  const emus = online.filter((s) => /^emulator-\d+$/.test(s) && sh(`${adb} -s ${s} shell getprop ro.kernel.qemu`).out === '1');
  return { adb, emus, real };
}

export function pickEmulator(want) {
  const { adb, emus, real } = emulators();
  if (want && !emus.includes(want)) {
    const why = real.includes(want)
      ? `${want} is a physical device. This kit only ever targets the PICO Emulator: \`pico-cli web launch\` installs a 336 MB browser APK first and rewrites localhost to 10.0.2.2, which is wrong for hardware and not yours to do to a loaner headset.`
      : `${want} is not an online emulator.`;
    throw new Error(`${why}\nOnline emulators: ${emus.join(', ') || 'none'}`);
  }
  if (want) return { adb, serial: want };
  if (!emus.length) throw new Error(`No PICO Emulator online${real.length ? ` (physical devices attached: ${real.join(', ')}; ignored on purpose)` : ''}. Start it with /emulator, or: pico-cli emulator start`);
  if (emus.length > 1) throw new Error(`Several emulators online (${emus.join(', ')}). Pass --device <id>.`);
  return { adb, serial: emus[0] };
}

// "1", "p1", "p1-hello-spatial", "3 --solution" -> the lab folder and its dev port.
export function resolveLab(id, solution = false) {
  const labs = path.join(KIT, 'labs');
  const n = String(id).match(/^p?(\d)/)?.[1];
  const all = fs.readdirSync(labs).filter((d) => fs.statSync(path.join(labs, d)).isDirectory());
  let cands = all.includes(String(id)) ? [String(id)] : all.filter((d) => n && d.startsWith(`p${n}-`));
  // A rename can leave the old folder behind: prefer the one the labs workspace actually lists.
  if (cands.length > 1) {
    let ws = [];
    try { ws = JSON.parse(fs.readFileSync(path.join(labs, 'package.json'), 'utf8')).workspaces || []; } catch { /* none */ }
    const listed = cands.filter((d) => ws.some((w) => w.split('/')[0] === d));
    if (listed.length === 1) cands = listed;
    else throw new Error(`Lab ${id} is ambiguous: ${cands.join(', ')}. Pass the full folder name.`);
  }
  const dir = cands[0];
  if (!dir) throw new Error(`No lab "${id}". Labs: ${fs.readdirSync(labs).filter((d) => /^p\d-/.test(d)).join(', ')}`);
  const variants = solution ? ['solution'] : ['start', 'template'];
  const variant = variants.find((v) => fs.existsSync(path.join(labs, dir, v, 'package.json')));
  if (!variant) throw new Error(`labs/${dir} has no ${variants.join('/')} project yet`);
  const root = path.join(labs, dir, variant);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const script = pkg.scripts?.['dev:xr'] ? 'dev:xr' : 'dev';
  const port = Number((pkg.scripts?.[script] || '').match(/--port[= ](\d+)/)?.[1] || 5173);
  let manifest = null;
  try { manifest = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<link[^>]+rel=["']manifest["'][^>]*href=["']([^"']+)["']/i)?.[1] || null; } catch { /* no index */ }
  return { dir, variant, root, rel: path.relative(KIT, root).split(path.sep).join('/'), script, port, manifest };
}

export async function reachable(url, ms = 1500) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(ms) }); return r.status < 500; } catch { return false; }
}
