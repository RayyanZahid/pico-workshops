#!/usr/bin/env node
// PICO WebSpatial Academy doctor: is this machine ready for the labs?
//
//   node setup/doctor.mjs              full check, human output
//   node setup/doctor.mjs --json       machine-readable (Claude Code reads this)
//   node setup/doctor.mjs --web-only   you are on the fallback track: no emulator on this machine
//   node setup/doctor.mjs --quick      skip the pico-dev-knowledge check (~5 s)
//   node setup/doctor.mjs --no-device  never query adb / the emulator (for when someone else owns it)
//
// Zero dependencies. Read-only: it never installs, starts, or fixes anything. Every
// failing line prints the exact command that fixes it; setup/install-*.{ps1,sh} run them.
// Every threshold here is cited in setup/DEPENDENCIES.md.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = new Set(process.argv.slice(2));
const JSON_OUT = argv.has('--json');
const WEB_ONLY = argv.has('--web-only');
const QUICK = argv.has('--quick');
const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIN = process.platform === 'win32';
const MAC = process.platform === 'darwin';
const HOME = os.homedir();
const GiB = 1024 ** 3;

// ---- floors (sources in setup/DEPENDENCIES.md) -------------------------------------
const FLOOR = {
  node: [20, 19, 0],          // vite 8 + @vitejs/plugin-react 6 engines: ^20.19.0 || >=22.12.0
  node22: [22, 12, 0],
  picoCli: [0, 5, 0],         // the version every command in this kit was read from
  java: 21,                   // primer-cli launcher: "requires Java 21+"
  ramGiB: 15.0,               // primer-cli EnvDoctorCommand: total >= 15.0 GiB passes "16 GB"
  diskGiB: 40.0,              // primer-cli EnvDoctorCommand: available >= 40.0 GiB
  guestRamMiB: 6144,          // ~/.pico/avd/PICO_6.0.avd/config.ini hw.ramSize
  macOS: 14,
  studio: '2025.1',           // pico-cli HC(): version.includes("2025.1"); plugin until-build 251.*
};

// ---- helpers ------------------------------------------------------------------------
const checks = [];
const add = (group, level, what, fix = '', extra = {}) => checks.push({ group, level, what, fix, ...extra });
// Emulator-chain problems are real failures on the emulator track and notes on the web-only track.
const emu = (level) => (WEB_ONLY && (level === 'fail' || level === 'warn') ? 'info' : level);

function sh(cmd, timeout = 20000) {
  // One string through the shell: resolves npm .cmd shims on Windows without DEP0190.
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', timeout, windowsHide: true });
  return { ok: r.status === 0, out: `${r.stdout || ''}`.trim(), err: `${r.stderr || ''}`.trim(), status: r.status };
}
const exists = (p) => { try { return !!p && fs.existsSync(p); } catch { return false; } };
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const listDirs = (p) => { try { return fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { return []; } };
const vparse = (s) => (String(s).match(/(\d+)\.(\d+)(?:\.(\d+))?/) || []).slice(1, 4).map((n) => Number(n || 0));
const vgte = (a, b) => { for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0); } return true; };
const onPath = (bin) => sh(WIN ? `where ${bin}` : `command -v ${bin}`).ok;
const psJson = (script) => {
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  try { return JSON.parse(r.stdout); } catch { return null; }
};

// ---- host ---------------------------------------------------------------------------
const host = { platform: process.platform, arch: os.arch(), totalGiB: os.totalmem() / GiB, freeGiB: os.freemem() / GiB };
let emulatorPossible = true;

if (WIN) {
  const info = psJson(`
    $ErrorActionPreference='SilentlyContinue'
    $os=Get-CimInstance Win32_OperatingSystem; $cs=Get-CimInstance Win32_ComputerSystem
    $cpu=Get-CimInstance Win32_Processor | Select-Object -First 1
    [pscustomobject]@{
      caption=$os.Caption; build=$os.BuildNumber; arch=$os.OSArchitecture
      commitFreeGiB=[math]::Round($os.FreeVirtualMemory/1MB,2); physFreeGiB=[math]::Round($os.FreePhysicalMemory/1MB,2)
      hypervisor=$cs.HypervisorPresent; vtFirmware=$cpu.VirtualizationFirmwareEnabled; cpu=$cpu.Name.Trim()
      gpus=@(Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name })
    } | ConvertTo-Json -Compress`) || {};
  Object.assign(host, info);
  const is64 = /64/.test(info.arch || os.arch());
  const winOk = /Windows 1[01]/.test(info.caption || '') && is64;
  add('host', winOk ? 'pass' : 'fail', `${info.caption || 'Windows'} (${info.arch || os.arch()}, build ${info.build || '?'})`,
    winOk ? '' : 'The PICO Emulator needs Windows 10 or 11, 64-bit. Use the web-only track: node setup/doctor.mjs --web-only');
  if (!winOk) emulatorPossible = false;
  if (/arm/i.test(os.arch())) {
    add('host', emu('fail'), 'Windows on ARM: the PICO Emulator image is x86_64', 'Use the web-only track (pair up, or the projector)');
    emulatorPossible = false;
  }
  add('host', info.cpu ? 'info' : 'warn', `CPU: ${info.cpu || 'unknown'} (PICO floor: Intel Core i5 or equivalent)`);
  const gpus = info.gpus || [];
  const nvidia = gpus.some((g) => /nvidia/i.test(g));
  let vram = '';
  if (nvidia) {
    const q = sh('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits');
    if (q.ok) vram = q.out.split(/\r?\n/).map((l) => { const [n, m] = l.split(','); return `${n.trim()} ${(Number(m) / 1024).toFixed(0)} GB VRAM`; }).join('; ');
  }
  add('host', nvidia ? 'pass' : emu('warn'), `GPU: ${vram || gpus.join(', ') || 'unknown'}`,
    nvidia ? '' : 'PICO lists an NVIDIA GeForce GTX 1060 as the floor. AMD/Intel-only GPUs are untested by us: try it, and keep the web-only track as the fallback');
  const virtOk = info.hypervisor === true || info.vtFirmware === true;
  add('host', virtOk ? 'pass' : emu('fail'), `Virtualization: hypervisor ${info.hypervisor ? 'present' : 'absent'}, firmware VT ${info.vtFirmware ? 'on' : info.vtFirmware === false ? 'OFF' : 'unknown'}`,
    virtOk ? '' : 'Enable Intel VT-x / AMD SVM in BIOS, then turn on "Windows Hypervisor Platform" (optionalfeatures.exe) and reboot. `pico-cli emulator doctor` re-checks it');
} else if (MAC) {
  const ver = sh('sw_vers -productVersion').out;
  const chip = sh('sysctl -n machdep.cpu.brand_string').out;
  const arm = os.arch() === 'arm64' || sh('sysctl -n hw.optional.arm64').out === '1';
  Object.assign(host, { macos: ver, cpu: chip });
  const verOk = vparse(ver)[0] >= FLOOR.macOS;
  add('host', verOk ? 'pass' : emu('fail'), `macOS ${ver || '?'} (PICO floor: 14.0)`, verOk ? '' : 'Update macOS to 14 Sonoma or later, or use the web-only track');
  if (!arm) {
    add('host', emu('fail'), `CPU: ${chip || 'Intel'}. PICO: "Intel chips are not supported" for the emulator`,
      'You cannot run the PICO Emulator on this Mac. Use the web-only track: node setup/doctor.mjs --web-only');
    emulatorPossible = false;
  } else {
    add('host', 'pass', `CPU: ${chip || 'Apple Silicon'} (PICO floor: M1 Pro)`);
    if (/Apple M\d/.test(chip) && !/Pro|Max|Ultra/.test(chip))
      add('host', emu('warn'), 'Base M-series chip: PICO names M1 Pro as the floor', 'It may run slowly. Close other apps before starting the emulator');
  }
  if (!verOk) emulatorPossible = false;
} else {
  add('host', emu('fail'), `${process.platform}: PICO publishes no emulator for this OS`, 'Use the web-only track: node setup/doctor.mjs --web-only');
  emulatorPossible = false;
}

const ramOk = host.totalGiB >= FLOOR.ramGiB;
add('host', ramOk ? 'pass' : emu('fail'), `RAM: ${host.totalGiB.toFixed(1)} GB total (PICO floor 16 GB; its own check passes at 15.0)`,
  ramOk ? '' : 'Below the PICO floor. Use the web-only track, or pair with someone whose machine passes');
if (ramOk && host.totalGiB < 24) {
  add('host', emu('warn'), `16 GB is the floor for the emulator ALONE. The guest reserves ${FLOOR.guestRamMiB} MB; measured on a 16 GB laptop, a normal browser+editor load left too little and it refused to boot`,
    'Before `pico-cli emulator start`: close Chrome and other Electron apps, on Windows also `wsl --shutdown`, and set hw.ramSize=4096 in ~/.pico/avd/<avd>.avd/config.ini (setup/SETUP.md step 13)');
}
if (WIN && typeof host.commitFreeGiB === 'number') {
  const ok = host.commitFreeGiB * 1024 >= FLOOR.guestRamMiB + 2048;
  add('host', ok ? 'pass' : emu('warn'), `Free right now: ${host.physFreeGiB} GB physical, ${host.commitFreeGiB} GB commit (emulator needs ${FLOOR.guestRamMiB / 1024} GB commit free to boot)`,
    ok ? '' : 'Close apps until commit free is at least 8 GB. The emulator prints "Insufficient RAM free" to stderr only, never to its log', { id: 'commit' });
}
try {
  const st = fs.statfsSync(HOME);
  const free = (st.bavail * st.bsize) / GiB;
  host.diskFreeGiB = free;
  add('host', free >= FLOOR.diskGiB ? 'pass' : emu('warn'), `Disk free: ${free.toFixed(1)} GB on your home drive (PICO floor: 40 GB)`,
    free >= FLOOR.diskGiB ? '' : 'The floor covers a fresh install of Android Studio + the emulator (~4.3 GB download, ~12 GB installed, plus the IDE and SDK). Free space before installing; if all of that is already installed, this matters less', { id: 'disk' });
} catch { add('host', 'info', 'Disk free: could not read (Node < 18.15?)'); }

// ---- core tools ---------------------------------------------------------------------
const nodeV = vparse(process.versions.node);
const nodeOk = (nodeV[0] === 20 && vgte(nodeV, FLOOR.node)) || vgte(nodeV, FLOOR.node22);
add('core', nodeOk ? 'pass' : 'fail', `Node ${process.version} (Vite 8 needs ^20.19 or >=22.12; kit recommends 24 LTS)`,
  nodeOk ? '' : WIN ? 'winget install --id OpenJS.NodeJS.LTS -e' : 'brew install node@24  (then follow brew\'s PATH hint), or the installer at https://nodejs.org/en/download');
const npmV = sh('npm --version');
add('core', npmV.ok ? 'pass' : 'fail', `npm ${npmV.out || 'missing'}`, npmV.ok ? '' : 'npm ships with Node; reinstall Node');
const git = sh('git --version');
add('core', git.ok ? 'pass' : 'fail', git.ok ? git.out : 'git missing (PICO lists it as a pico-cli prerequisite; Claude Code on Windows uses Git Bash)',
  git.ok ? '' : WIN ? 'winget install --id Git.Git -e' : 'xcode-select --install   (or: brew install git)');
const claude = sh('claude --version');
add('core', claude.ok ? 'pass' : 'fail', claude.ok ? `Claude Code ${claude.out.split(/\s/)[0]}` : 'Claude Code missing',
  claude.ok ? '' : WIN ? 'irm https://claude.ai/install.ps1 | iex      (PowerShell)' : 'curl -fsSL https://claude.ai/install.sh | bash');

const pc = sh('pico-cli --version');
const pcMatch = pc.out.match(/pico-cli\/(\d+\.\d+\.\d+)/);
let picoOk = false;
if (pcMatch) {
  picoOk = vgte(vparse(pcMatch[1]), FLOOR.picoCli);
  add('core', picoOk ? 'pass' : 'warn', `pico-cli ${pcMatch[1]} (@picoxr/pico-cli)`, picoOk ? '' : 'npm install -g @picoxr/pico-cli@latest');
} else if (pc.ok || onPath('pico-cli')) {
  add('core', 'fail', 'A `pico-cli` is on PATH but it is not PICO\'s. The unscoped npm package `pico-cli` is an unrelated CLI framework',
    'npm uninstall -g pico-cli   then:   npm install -g @picoxr/pico-cli');
} else {
  add('core', 'fail', 'pico-cli missing', 'npm install -g @picoxr/pico-cli    (NOT `npm i -g pico-cli`, which is unrelated)');
}

// ---- Claude Code wiring -------------------------------------------------------------
const plugins = readJson(path.join(HOME, '.claude', 'plugins', 'installed_plugins.json'));
const picoPlugin = plugins && Object.keys(plugins.plugins || plugins).find((k) => k.startsWith('pico-spatial-agentic-tools@'));
add('agent', picoPlugin ? 'pass' : 'warn', picoPlugin ? `Claude Code plugin ${picoPlugin} (PICO skills + pico-dev-knowledge MCP)` : 'PICO plugin not installed in Claude Code (optional for the web labs, needed for the knowledge MCP)',
  picoPlugin ? '' : 'Close every other Claude Code window, then: pico-cli setup --agent-tool claude-code --platform spatial --scope global --yes');
if (picoOk && !QUICK) {
  const kd = sh('pico-cli knowledge doctor', 60000);
  const ready = /serve:\s*READY/i.test(kd.out);
  add('agent', ready ? 'pass' : 'warn', ready ? 'pico-dev-knowledge: READY (PICO docs graph for Claude)' : 'pico-dev-knowledge not ready',
    ready ? '' : 'pico-cli knowledge pull   then restart Claude Code (an MCP server only connects at session start)');
}

// ---- emulator chain -----------------------------------------------------------------
const picoHome = process.env.PICO_HOME?.trim() || (MAC ? path.join(HOME, 'Library', 'PICO', 'sdk') : path.join(process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local'), 'PICO', 'sdk'));

if (emulatorPossible || !WEB_ONLY) {
  // Android Studio 2025.1.x: the PICO Spatial plugin declares until-build 251.*, so newer IDEs cannot load it.
  const studioRoots = WIN
    ? [path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Android'), path.join(process.env.LOCALAPPDATA || '', 'Programs'), path.join(process.env.LOCALAPPDATA || '', 'JetBrains', 'Toolbox', 'apps', 'AndroidStudio')]
    : ['/Applications', path.join(HOME, 'Applications'), path.join(HOME, 'Library', 'Application Support', 'JetBrains', 'Toolbox', 'apps', 'AndroidStudio')];
  const studios = [];
  const seek = (dir, depth) => {
    if (depth < 0) return;
    for (const name of listDirs(dir)) {
      const p = path.join(dir, name);
      if (/android studio/i.test(name)) {
        const info = readJson(MAC ? path.join(p, 'Contents', 'Resources', 'product-info.json') : path.join(p, 'product-info.json'));
        if (info) { studios.push({ path: p, version: info.version, dataDirectoryName: info.dataDirectoryName }); continue; }
      }
      if (depth > 0 && !/\.app$/.test(name)) seek(p, depth - 1);
    }
  };
  // pico-cli checks ANDROID_STUDIO_PATH before the standard locations; so do we.
  const envStudio = process.env.ANDROID_STUDIO_PATH;
  const envInfo = envStudio && readJson(MAC ? path.join(envStudio, 'Contents', 'Resources', 'product-info.json') : path.join(envStudio, 'product-info.json'));
  if (envInfo) studios.push({ path: envStudio, version: envInfo.version, dataDirectoryName: envInfo.dataDirectoryName });
  studioRoots.forEach((r) => seek(r, 3));
  const good = studios.find((s) => `${s.version}${s.dataDirectoryName}`.includes(FLOOR.studio));
  const studioFix = WIN ? 'winget install --id Google.AndroidStudio -e --version 2025.1.4.8' : 'Download android-studio-2025.1.4.8-mac_arm.dmg (setup/install-macos.sh --yes fetches it) or pick any 2025.1.x at https://developer.android.com/studio/archive';
  if (good) add('emulator', 'pass', `Android Studio ${good.dataDirectoryName || good.version} (${good.version}) at ${good.path}`);
  else if (studios.length) add('emulator', emu('fail'), `Android Studio ${studios.map((s) => s.version).join(', ')} found, but PICO requires 2025.1.x exactly (its plugin cannot load in newer builds)`, `Install 2025.1.4.8 alongside it: ${studioFix}`);
  else add('emulator', emu('fail'), 'Android Studio 2025.1.x missing', studioFix);

  // Java 21+: pico-cli's primer-cli is a Java 21 jar. Android Studio 2025.1 bundles JBR 21, so no separate JDK is needed.
  const jbr = good && (MAC ? path.join(good.path, 'Contents', 'jbr', 'Contents', 'Home') : path.join(good.path, 'jbr'));
  const javaHome = process.env.JAVA_HOME;
  const javaBin = javaHome && exists(path.join(javaHome, 'bin', WIN ? 'java.exe' : 'java')) ? `"${path.join(javaHome, 'bin', 'java')}"` : 'java';
  const jv = sh(`${javaBin} -version 2>&1`);
  const jmaj = Number((jv.out.match(/version "(\d+)/) || [])[1] || 0);
  if (jmaj >= FLOOR.java) add('emulator', 'pass', `Java ${jmaj}${javaHome ? ` (JAVA_HOME=${javaHome})` : ' on PATH'}`);
  else add('emulator', emu(jbr && exists(jbr) ? 'warn' : 'fail'), `Java 21+ not found${jmaj ? ` (found ${jmaj})` : ''}; pico-cli's emulator/doctor half is a Java 21 jar`,
    jbr && exists(jbr) ? (WIN ? `setx JAVA_HOME "${jbr}"   (then open a new terminal)` : `echo 'export JAVA_HOME="${jbr}"' >> ~/.zshrc`) : 'Install Android Studio 2025.1.x first: it bundles Java 21 (jbr)');

  // Android SDK Platform 35 + Sources 35 (Android 15), exactly what pico-cli checks.
  const sdkRoots = [process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME, MAC ? path.join(HOME, 'Library', 'Android', 'sdk') : WIN ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : null].filter(Boolean);
  const sdk = sdkRoots.find(exists);
  const p35 = sdk && exists(path.join(sdk, 'platforms', 'android-35'));
  const s35 = sdk && exists(path.join(sdk, 'sources', 'android-35'));
  add('emulator', p35 ? (s35 ? 'pass' : emu('warn')) : emu('fail'),
    sdk ? `Android SDK ${sdk}: Platform 35 ${p35 ? 'yes' : 'NO'}, Sources 35 ${s35 ? 'yes' : 'no'}` : 'Android SDK not found',
    p35 && s35 ? '' : 'Android Studio > Settings > Languages & Frameworks > Android SDK > Show Package Details > Android 15.0 ("VanillaIceCream"): tick SDK Platform 35 + Sources for Android 35. Or: pico-cli emulator setup');

  // PICO Spatial plugin: pico-cli matches /(pico|spatial)/i under the IDE config dirs.
  const cfgRoot = MAC ? path.join(HOME, 'Library', 'Application Support', 'Google') : path.join(process.env.APPDATA || '', 'Google');
  const pluginHits = [];
  for (const ide of listDirs(cfgRoot).filter((d) => /^AndroidStudio/i.test(d)))
    for (const pl of listDirs(path.join(cfgRoot, ide, 'plugins')).filter((d) => /(pico|spatial)/i.test(d))) {
      let jar = '';
      try { jar = fs.readdirSync(path.join(cfgRoot, ide, 'plugins', pl, 'lib')).find((f) => /^SpatialPlugin-[\d.]+\.jar$/.test(f)) || ''; } catch { /* no lib dir */ }
      pluginHits.push(`${ide}/${pl}${jar ? ` ${jar.replace(/^SpatialPlugin-|\.jar$/g, '')}` : ''}`);
    }
  add('emulator', pluginHits.length ? 'pass' : emu('fail'), pluginHits.length ? `PICO Spatial plugin: ${pluginHits.join(', ')}` : 'PICO Spatial plugin not installed',
    pluginHits.length ? '' : 'Android Studio > Plugins > Marketplace > "PICO Spatial (Global)" > Install > Restart IDE. Or: pico-cli emulator setup');

  // Emulator bundle + AVD.
  const bundles = listDirs(picoHome).filter((v) => exists(path.join(picoHome, v, 'emulator', WIN ? 'emulator.exe' : 'emulator')));
  const disk = checks.find((c) => c.id === 'disk' && c.level === 'warn');
  if (disk && bundles.length && good) disk.level = 'info';
  add('emulator', bundles.length ? 'pass' : emu('fail'), bundles.length ? `PICO Emulator bundle(s): ${bundles.map((b) => `OS ${b}`).join(', ')} in ${picoHome}` : `No PICO Emulator bundle in ${picoHome}`,
    bundles.length ? '' : 'pico-cli emulator install   (then: pico-cli emulator create)');
  const avdDir = path.join(HOME, '.pico', 'avd');
  const avds = (() => { try { return fs.readdirSync(avdDir).filter((f) => f.endsWith('.ini')).map((f) => f.slice(0, -4)); } catch { return []; } })();
  add('emulator', avds.length ? 'pass' : emu(bundles.length ? 'warn' : 'fail'), avds.length ? `AVD(s): ${avds.join(', ')} in ${avdDir}` : 'No PICO AVD yet',
    avds.length ? '' : 'pico-cli emulator create');

  // adb: pico-cli does not ship one; it resolves ADB_PATH, SDK platform-tools, the emulator bundle, then PATH.
  const adbCands = [process.env.ADB_PATH, sdk && path.join(sdk, 'platform-tools', WIN ? 'adb.exe' : 'adb'),
    ...bundles.map((b) => path.join(picoHome, b, 'emulator', 'system-images', 'platform-tools', WIN ? 'adb.exe' : 'adb'))].filter(Boolean);
  const adb = adbCands.find(exists) || (onPath('adb') ? 'adb (PATH)' : '');
  add('emulator', adb ? 'pass' : emu('fail'), adb ? `adb: ${adb}` : 'adb not found',
    adb ? '' : WIN ? 'winget install --id Google.PlatformTools -e   (or tick SDK Platform-Tools in Android Studio)' : 'brew install --cask android-platform-tools');

  // The PICO WebSpatial browser that `pico-cli web launch` installs into the emulator (336 MB).
  const webApk = listDirs(picoHome).map((v) => path.join(picoHome, v, 'webspatial', 'PicoBrowser.apk')).find(exists);
  add('emulator', webApk ? 'pass' : emu('warn'), webApk ? `PICO WebSpatial browser staged: ${webApk}` : 'PICO WebSpatial browser not downloaded yet (336 MB; `pico-cli web launch` fetches it on first use)',
    webApk ? '' : 'pico-cli web setup   (do it at home, not on event Wi-Fi)');

  // Live state, if pico-cli can tell us. Only the top-level fields are live; data.state is the last boot's record.
  if (picoOk && bundles.length && !argv.has('--no-device')) {
    const st = sh('pico-cli emulator status --format json', 45000);
    let j = null; try { j = JSON.parse(st.out.slice(st.out.indexOf('{'))); } catch { /* not JSON */ }
    if (j?.data) {
      const up = j.data.processRunning && j.data.adbOnline;
      add('live', 'info', up ? `Emulator running and online as ${j.data.adbDeviceId}` : 'Emulator not running (start it with /emulator or `pico-cli emulator start`)');
      // A running emulator already holds its 6 GB, so low free commit is its footprint, not a boot blocker.
      const commit = checks.find((c) => c.id === 'commit' && c.level === 'warn');
      if (up && commit) Object.assign(commit, { level: 'info', what: `${commit.what.replace(/ \(emulator needs.*\)$/, '')} with the emulator already running (it holds ~${FLOOR.guestRamMiB / 1024} GB)`, fix: 'If the machine is sluggish, close browsers and editors you are not using' });
    }
  }
}

// ---- the kit ------------------------------------------------------------------------
// The pin labs-builder set in labs/VERSIONS.md. Change both together.
const WEBSPATIAL_PIN = '2.0.0';
const labsNm = path.join(KIT, 'labs', 'node_modules');
if (exists(path.join(KIT, 'labs', 'package.json'))) {
  if (!exists(labsNm)) add('kit', 'warn', 'Lab dependencies not installed', 'npm run labs:install   (from the kit root)');
  else {
    for (const name of ['react-sdk', 'core-sdk']) {
      const v = readJson(path.join(labsNm, '@webspatial', name, 'package.json'))?.version;
      add('kit', v === WEBSPATIAL_PIN ? 'pass' : 'fail', `@webspatial/${name} ${v || 'missing'} (labs pin ${WEBSPATIAL_PIN}, labs/VERSIONS.md)`,
        v === WEBSPATIAL_PIN ? '' : 'npm run labs:install   (from the kit root; the labs pin exact versions)');
    }
  }
  // `npm install --prefix labs` run from the kit root installs the KIT into labs: a `file:..`
  // dependency plus a recursive node_modules link back to the kit (labs-builder, 2026-09-24).
  const labsPkg = readJson(path.join(KIT, 'labs', 'package.json')) || {};
  const selfDeps = Object.entries({ ...labsPkg.dependencies, ...labsPkg.devDependencies }).filter(([, v]) => /^file:\.\.\/?$/.test(String(v))).map(([k]) => k);
  const selfLink = exists(path.join(labsNm, 'pico-webspatial-academy'));
  add('kit', selfDeps.length || selfLink ? 'fail' : 'pass',
    selfDeps.length || selfLink ? `labs/ has the kit installed into itself (${[...selfDeps.map((d) => `labs/package.json: "${d}": "file:.."`), selfLink ? 'labs/node_modules/pico-webspatial-academy -> ..' : ''].filter(Boolean).join('; ')})` : 'labs/ workspace is clean (no file:.. self-install)',
    selfDeps.length || selfLink ? 'Remove that entry from labs/package.json and delete labs/node_modules/pico-webspatial-academy, then: npm run labs:install   (it runs `cd labs && npm install`)' : '');
  // @webspatial/vite-plugin 1.0.1 aliases the SDK to /web, which 2.0 removed: builds fail.
  const offenders = [];
  if (exists(path.join(labsNm, '@webspatial', 'vite-plugin'))) offenders.push('labs/node_modules');
  for (const lab of listDirs(path.join(KIT, 'labs')).filter((d) => /^p\d-/.test(d)))
    for (const v of listDirs(path.join(KIT, 'labs', lab))) {
      const pkg = readJson(path.join(KIT, 'labs', lab, v, 'package.json'));
      if (pkg && ({ ...pkg.dependencies, ...pkg.devDependencies })['@webspatial/vite-plugin']) offenders.push(`labs/${lab}/${v}/package.json`);
    }
  add('kit', offenders.length ? 'fail' : 'pass', offenders.length ? `@webspatial/vite-plugin present in ${offenders.join(', ')}: it breaks SDK 2.0 builds` : 'No @webspatial/vite-plugin anywhere in labs/',
    offenders.length ? 'npm uninstall @webspatial/vite-plugin   (in each listed lab), and remove webspatial() from its vite.config.ts' : '');
}

// ---- report -------------------------------------------------------------------------
const fails = checks.filter((c) => c.level === 'fail');
const warns = checks.filter((c) => c.level === 'warn');
const track = WEB_ONLY || !emulatorPossible ? 'web-only' : 'emulator';
const verdict = fails.length ? 'NOT READY' : warns.length ? 'READY WITH WARNINGS' : 'READY';

if (JSON_OUT) {
  process.stdout.write(`${JSON.stringify({ verdict, track, emulatorPossible, host, checks, generatedAt: new Date().toISOString() }, null, 2)}\n`);
} else {
  const tty = process.stdout.isTTY && !process.env.NO_COLOR;
  const col = (n, s) => (tty ? `\x1b[${n}m${s}\x1b[0m` : s);
  const mark = { pass: col(32, 'PASS'), warn: col(33, 'WARN'), fail: col(31, 'FAIL'), info: col(36, 'INFO') };
  const titles = { host: 'This machine', core: 'Core tools', agent: 'Claude Code wiring', emulator: 'PICO Emulator chain', live: 'Right now', kit: 'This kit' };
  console.log(col(1, `\nPICO WebSpatial Academy doctor  (${new Date().toISOString().slice(0, 16).replace('T', ' ')}Z, ${process.platform}/${os.arch()}, track: ${track})`));
  for (const g of Object.keys(titles)) {
    const rows = checks.filter((c) => c.group === g);
    if (!rows.length) continue;
    console.log(col(1, `\n== ${titles[g]}`));
    for (const r of rows) console.log(`  ${mark[r.level]}  ${r.what}${r.fix ? `\n        fix: ${r.fix}` : ''}`);
  }
  console.log(col(1, `\n${verdict}`) + `  ${fails.length} fail, ${warns.length} warn`);
  if (!emulatorPossible) console.log('This machine cannot run the PICO Emulator. You are on the web-only track: every lab runs in a desktop browser (2D fallback), and you watch the emulator on the projector or pair up. See setup/SETUP.md "No emulator?".');
  else if (fails.length && !WEB_ONLY) console.log('Only the emulator chain failing? You can still do every lab in a desktop browser: node setup/doctor.mjs --web-only');
}
process.exit(fails.length ? 1 : 0);
