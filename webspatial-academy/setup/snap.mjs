#!/usr/bin/env node
// Screenshot the PICO Emulator, and keep a frame you can trust.
//
//   node setup/snap.mjs                      best available method, result in captures/<name>-<stamp>-best.png
//   node setup/snap.mjs --name p3-volume     file name prefix
//   node setup/snap.mjs --method burst --burst 8 --keep    force one method (emu | window | burst)
//
// Methods, tried in this order; the first frame under 30% black wins:
//   emu     `adb emu screenrecord screenshot <dir>`: the emulator's own host-side grab
//           (0.1% black, emulator-lab 2026-09-24)
//   window  Windows only: PrintWindow of the "PICO Emulator" host window (setup/printwindow.ps1;
//           clean every time, spatial-crack 2026-09-24). Includes the window frame
//   burst   `pico-cli capture screenshot` x5, keep the least black. In-guest screencap reads the
//           framebuffer mid-write, so single frames are often 40-95% black while the app is fine
//           (pico-dev kb, 2026-09-18; >30% black on almost every burst on 2026-09-24)
// One screenshot is a sample, not a state.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { KIT, args, pickEmulator, sh } from './_lib.mjs';

const { flags } = args();
let target;
try { target = pickEmulator(flags['--device']); } catch (e) { console.error(`[snap] ${e.message}`); process.exit(1); }

const dir = path.join(KIT, 'captures');
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
const prefix = `${flags['--name'] || 'emulator'}-${stamp}`;

// Fraction of near-black pixels, sampled on a grid. Decodes 8-bit RGB/RGBA PNGs (what screencap emits).
function blackFraction(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) return 1;
  let off = 8; let w = 0; let h = 0; let ct = 0; const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off); const type = b.toString('ascii', off + 4, off + 8);
    const data = b.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8) return NaN; }
    if (type === 'IDAT') idat.push(data);
    if (type === 'IEND') break;
    off += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0;
  if (!bpp) return NaN;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp; const cur = Buffer.alloc(stride); const prev = Buffer.alloc(stride);
  const step = Math.max(1, Math.floor(w / 216)); let black = 0; let n = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]; const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0; const up = prev[x]; const c = x >= bpp ? prev[x - bpp] : 0;
      let p = 0;
      if (f === 1) p = a; else if (f === 2) p = up; else if (f === 3) p = (a + up) >> 1;
      else if (f === 4) { const q = a + up - c; const pa = Math.abs(q - a); const pb = Math.abs(q - up); const pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      cur[x] = (row[x] + p) & 0xff;
    }
    if (y % step === 0) for (let x = 0; x < w; x += step) { const i = x * bpp; n++; if (cur[i] < 8 && cur[i + 1] < 8 && cur[i + 2] < 8) black++; }
    cur.copy(prev);
  }
  return black / n;
}

const GOOD = 0.3;
const best = path.join(dir, `${prefix}-best.png`);
const rel = (p) => path.relative(KIT, p);
const score = (f) => { try { return blackFraction(f); } catch { return NaN; } };

// emu: the emulator writes a PNG into a directory we name; take whatever new PNG appears there.
function viaEmu() {
  const tmp = path.join(dir, `.emu-${stamp}`);
  fs.mkdirSync(tmp, { recursive: true });
  const r = sh(`${target.adb} -s ${target.serial} emu screenrecord screenshot "${tmp}"`, 60000);
  const png = fs.readdirSync(tmp).find((f) => f.toLowerCase().endsWith('.png'));
  if (!png) { fs.rmSync(tmp, { recursive: true, force: true }); return { err: r.err || r.out || 'no PNG written' }; }
  const out = path.join(dir, `${prefix}-emu.png`);
  fs.renameSync(path.join(tmp, png), out); fs.rmSync(tmp, { recursive: true, force: true });
  return { out };
}
function viaWindow() {
  if (process.platform !== 'win32') return { err: 'Windows only' };
  const out = path.join(dir, `${prefix}-window.png`);
  const r = sh(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(KIT, 'setup', 'printwindow.ps1')}" -Out "${out}"`, 60000);
  return fs.existsSync(out) ? { out } : { err: r.err || r.out };
}
async function viaBurst() {
  const n = Math.max(1, Number(flags['--burst'] || 5));
  const shots = [];
  for (let i = 1; i <= n; i++) {
    const out = path.join(dir, `${prefix}-${i}.png`);
    const r = sh(`pico-cli capture screenshot -d ${target.serial} -o "${out}"`, 60000);
    if (r.ok && fs.existsSync(out)) shots.push({ out, black: score(out) });
    else console.error(`[snap] burst capture ${i} failed: ${r.err || r.out}`);
    if (i < n) await new Promise((res) => setTimeout(res, 1500));
  }
  if (!shots.length) return { err: 'no capture succeeded' };
  shots.sort((a, b) => (a.black || 0) - (b.black || 0));
  if (!flags['--keep']) for (const s of shots.slice(1)) fs.rmSync(s.out, { force: true });
  for (const s of shots.slice(1)) console.log(`  burst ${(s.black * 100).toFixed(1).padStart(5)}% black  ${flags['--keep'] ? rel(s.out) : '(discarded)'}`);
  return { out: shots[0].out };
}

const order = flags['--method'] ? [String(flags['--method'])] : ['emu', 'window', 'burst'];
const methods = { emu: viaEmu, window: viaWindow, burst: viaBurst };
let winner = null; const tried = [];
for (const m of order) {
  if (!methods[m]) { console.error(`[snap] unknown --method ${m} (emu | window | burst)`); process.exit(1); }
  const res = await methods[m]();
  if (res.err) { console.log(`  ${m.padEnd(6)} failed: ${String(res.err).split(/\r?\n/)[0]}`); continue; }
  const black = score(res.out);
  console.log(`  ${m.padEnd(6)} ${Number.isNaN(black) ? '  ?  ' : `${(black * 100).toFixed(1).padStart(5)}%`} black  ${rel(res.out)}`);
  tried.push({ m, out: res.out, black: Number.isNaN(black) ? 1 : black });
  if (!Number.isNaN(black) && black < GOOD) { winner = tried.at(-1); break; }
}
if (!tried.length) { console.error('[snap] every method failed. Is the emulator booted? pico-cli emulator status'); process.exit(1); }
winner ||= tried.sort((a, b) => a.black - b.black)[0];
fs.renameSync(winner.out, best);
if (!flags['--keep']) for (const t of tried) if (t !== winner) fs.rmSync(t.out, { force: true });
console.log(`\n[snap] ${rel(best)}  (method: ${winner.m}${winner.m === 'window' ? ', includes the emulator window frame' : ''})`);
if (winner.black > GOOD) console.log('[snap] even the best frame is >30% black. Try again; if it persists the compositor is degraded and the emulator needs a restart (pico-cli emulator stop, then start). Check liveness with pico-cli log before blaming your page.');
