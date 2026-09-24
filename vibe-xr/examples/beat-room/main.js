/*
 * BEAT ROOM
 * ----------------------------------------------------------------------------
 * What it shows: a tiny generative beat (kick, hats, bass, arp) synthesized live
 * with WebAudio, no audio files. Each instrument plays from its own glowing
 * speaker in 3D space. Grab a speaker and move it: the sound moves with it, so
 * you can put the hats behind you or hold the bass next to your ear. A ring of
 * bars around you and the floor ring pulse to the mix.
 *
 * WebXR features used:
 *   - immersive-vr session (local-floor)
 *   - three.js PositionalAudio (an HRTF panner per speaker) + AudioAnalyser
 *   - controllers: raycast + 'selectstart'/'selectend' to grab and release
 *   - hand-tracking: pinch near a speaker ('pinchstart'/'pinchend') to grab it
 * Desktop fallback: OrbitControls; press "Start sound", then drag a speaker.
 *
 * Remix prompts to paste into Claude Code:
 *   1. "In examples/beat-room, add a fifth speaker that plays a clap on beats
 *       2 and 4, and let me change the tempo by twisting my left wrist."
 *   2. "When I hold a speaker above my head, open a lowpass filter on that
 *       instrument; when I hold it near the floor, close it."
 *   3. "Replace the ring of bars with 48 floating cubes that orbit me and jump
 *       to the kick drum, colored by which instrument is loudest."
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { PICO, applyPicoFog, picoMaterial } from '../../theme/pico-theme.js';

const BPM = 112;
const STEP = 60 / BPM / 4; // one 16th note, in seconds
const statusEl = document.getElementById('status');

// ---- renderer, scene, camera ------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
applyPicoFog(scene, THREE, { near: 5, far: 16 });

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(0, 2.2, 3.4);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.1, 0);
controls.enableDamping = true;
controls.update();

const listener = new THREE.AudioListener();
camera.add(listener);
scene.add(camera);
const ctx = listener.context;

scene.add(new THREE.HemisphereLight(PICO.glow, PICO.bg, 0.5));

// ---- room: floor, pulsing floor ring, ring of frequency bars ----------------------
const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 48), picoMaterial(THREE, 'matte', { color: PICO.surface }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const floorRing = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.4, 64).rotateX(-Math.PI / 2), picoMaterial(THREE, 'glow', { color: PICO.accent }));
floorRing.position.y = 0.003;
scene.add(floorRing);

const BAR_COUNT = 48;
const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 1, 0.08).translate(0, 0.5, 0), picoMaterial(THREE, 'glow', { color: '#ffffff' }), BAR_COUNT);
const barColor = new THREE.Color();
const barMatrix = new THREE.Matrix4();
const barScale = new THREE.Vector3(1, 1, 1);
for (let i = 0; i < BAR_COUNT; i++) {
  const a = (i / BAR_COUNT) * Math.PI * 2;
  barColor.set(PICO.accent).lerp(new THREE.Color(i % 2 ? PICO.accent2 : PICO.glow), Math.abs(Math.sin(a)));
  bars.setColorAt(i, barColor);
}
scene.add(bars);

// ---- instruments: each one is a bus -> PositionalAudio on a speaker mesh ------------------
const masterAnalyser = ctx.createAnalyser();
masterAnalyser.fftSize = 128;
const freqData = new Uint8Array(masterAnalyser.frequencyBinCount);

const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
noiseBuffer.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1; });

// Each play(t, step, bus) schedules one note at audio time t. Return nothing to rest.
const INSTRUMENTS = [
  {
    name: 'KICK', color: PICO.accent, pos: [-0.9, 1.1, -1.0],
    play(t, step, bus) {
      if (step % 4 !== 0) return;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      env.gain.setValueAtTime(1, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(env).connect(bus);
      osc.start(t); osc.stop(t + 0.4);
    },
  },
  {
    name: 'HATS', color: PICO.glow, pos: [0.9, 1.5, -1.0],
    play(t, step, bus) {
      if (step % 2 === 0 && step % 4 !== 2) return;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 7000;
      const env = ctx.createGain();
      const level = step % 4 === 2 ? 0.5 : 0.2;
      env.gain.setValueAtTime(level, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      src.connect(hp).connect(env).connect(bus);
      src.start(t); src.stop(t + 0.08);
    },
  },
  {
    name: 'BASS', color: PICO.accent2, pos: [-1.1, 0.8, 0.6],
    notes: [55, 0, 0, 55, 0, 0, 65.41, 0, 73.42, 0, 0, 65.41, 0, 0, 49, 0],
    play(t, step, bus) {
      const f = this.notes[step];
      if (!f) return;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(200, t + 0.2);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.35, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(lp).connect(env).connect(bus);
      osc.start(t); osc.stop(t + 0.3);
    },
  },
  {
    name: 'ARP', color: PICO.danger, pos: [1.1, 1.3, 0.6],
    notes: [440, 523.25, 659.25, 783.99, 659.25, 523.25, 440, 392],
    play(t, step, bus) {
      if (step % 2) return;
      const osc = ctx.createOscillator();
      osc.type = 'triangle'; osc.frequency.value = this.notes[(step / 2 + bar * 3) % this.notes.length];
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.18, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(env).connect(bus);
      osc.start(t); osc.stop(t + 0.25);
    },
  },
];

const labelTexture = (text, color) => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.font = '600 40px "Space Grotesk", system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const coreGeometry = new THREE.IcosahedronGeometry(0.11, 2);
const haloGeometry = new THREE.TorusGeometry(0.16, 0.008, 8, 48);
const speakers = INSTRUMENTS.map((inst) => {
  const group = new THREE.Group();
  group.position.fromArray(inst.pos);
  const core = new THREE.Mesh(coreGeometry, picoMaterial(THREE, 'glow', { color: inst.color }));
  const halo = new THREE.Mesh(haloGeometry, picoMaterial(THREE, 'glow', { color: inst.color, opacity: 0.6 }));
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(inst.name, PICO.ink), transparent: true }));
  label.scale.set(0.32, 0.08, 1);
  label.position.y = 0.26;
  group.add(core, halo, label);
  scene.add(group);

  const bus = ctx.createGain();
  const sound = new THREE.PositionalAudio(listener);
  sound.setRefDistance(0.6);
  sound.setNodeSource(bus);
  group.add(sound);
  bus.connect(masterAnalyser);
  const analyser = new THREE.AudioAnalyser(sound, 32);

  core.userData.speaker = group;
  return { inst, group, core, halo, bus, analyser };
});
const speakerCores = speakers.map((s) => s.core);

// ---- sequencer: schedule notes a little ahead of the audio clock, from the render loop ------
let playing = false;
let nextStepTime = 0;
let step = 0;
let bar = 0;

function startSound() {
  ctx.resume();
  if (playing) return;
  playing = true;
  nextStepTime = ctx.currentTime + 0.1;
  statusEl.textContent = `Playing at ${BPM} BPM. Grab a speaker and move it.`;
  startBtn.textContent = 'Stop sound';
}
function stopSound() {
  playing = false;
  startBtn.textContent = 'Start sound';
}
function schedule() {
  while (playing && nextStepTime < ctx.currentTime + 0.2) {
    for (const s of speakers) s.inst.play(nextStepTime, step, s.bus);
    nextStepTime += STEP;
    step = (step + 1) % 16;
    if (step === 0) bar++;
  }
}

// ---- grabbing: controllers raycast, hands pinch near --------------------------------------------
const raycaster = new THREE.Raycaster();
const handFactory = new XRHandModelFactory();
const controllerFactory = new XRControllerModelFactory();
const handGrabs = new Map(); // hand -> speaker group
const pinchPoint = new THREE.Vector3();

function pinchPosition(hand, target) {
  const index = hand.joints['index-finger-tip'];
  const thumb = hand.joints['thumb-tip'];
  if (!index || !thumb) return null;
  return target.copy(index.position).add(thumb.position).multiplyScalar(0.5);
}

for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  controller.addEventListener('selectstart', (event) => {
    if (event.data && event.data.hand) return; // hands grab via pinch below
    startSound();
    raycaster.setFromXRController(controller);
    const hit = raycaster.intersectObjects(speakerCores, false)[0];
    if (hit) { controller.attach(hit.object.userData.speaker); controller.userData.held = hit.object.userData.speaker; }
  });
  controller.addEventListener('selectend', () => {
    if (controller.userData.held) { scene.attach(controller.userData.held); controller.userData.held = null; }
  });
  // A visible ray so you can aim at speakers.
  const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: PICO.glow }));
  ray.scale.z = 3;
  controller.add(ray);
  controller.addEventListener('connected', (e) => { ray.visible = !e.data.hand; });
  scene.add(controller);

  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerFactory.createControllerModel(grip));
  scene.add(grip);

  const hand = renderer.xr.getHand(i);
  hand.add(handFactory.createHandModel(hand, 'mesh'));
  hand.addEventListener('pinchstart', () => {
    startSound();
    if (!pinchPosition(hand, pinchPoint)) return;
    let best = null;
    let bestDist = 0.25; // metres
    for (const s of speakers) {
      const d = s.group.position.distanceTo(pinchPoint);
      if (d < bestDist) { best = s.group; bestDist = d; }
    }
    if (best) handGrabs.set(hand, best);
  });
  hand.addEventListener('pinchend', () => handGrabs.delete(hand));
  scene.add(hand);
}

// ---- desktop: drag speakers across a horizontal plane ----------------------------------------------
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragPoint = new THREE.Vector3();
let dragging = null;
function setPointer(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
}
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (renderer.xr.isPresenting) return;
  setPointer(e);
  const hit = raycaster.intersectObjects(speakerCores, false)[0];
  if (!hit) return;
  dragging = hit.object.userData.speaker;
  dragPlane.constant = -dragging.position.y;
  controls.enabled = false;
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  setPointer(e);
  if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) dragging.position.set(dragPoint.x, dragging.position.y, dragPoint.z);
});
window.addEventListener('pointerup', () => { dragging = null; controls.enabled = true; });

// ---- buttons ---------------------------------------------------------------------------------
const actions = document.getElementById('xr-actions');
const startBtn = document.createElement('button');
startBtn.className = 'pico-btn pico-btn--ghost';
startBtn.textContent = 'Start sound';
startBtn.addEventListener('click', () => (playing ? stopSound() : startSound()));
actions.append(
  xrButton('immersive-vr', 'Enter VR', { optionalFeatures: ['local-floor', 'hand-tracking'] }),
  startBtn
);

function xrButton(mode, label, sessionInit) {
  const btn = document.createElement('button');
  btn.className = 'pico-btn';
  btn.disabled = true;
  btn.textContent = 'Checking for XR...';
  if (!window.isSecureContext) { btn.textContent = 'Needs https:// or localhost'; return btn; }
  if (!navigator.xr) { btn.textContent = 'No WebXR here'; btn.classList.add('pico-btn--ghost'); return btn; }
  navigator.xr.isSessionSupported(mode).then((ok) => {
    btn.disabled = !ok;
    btn.textContent = ok ? label : `No ${mode === 'immersive-ar' ? 'AR' : 'VR'} in this browser`;
    if (!ok) btn.classList.add('pico-btn--ghost');
  });
  let session = null;
  btn.addEventListener('click', async () => {
    if (session) { session.end(); return; }
    try {
      startSound(); // the click is the user gesture audio needs
      session = await navigator.xr.requestSession(mode, sessionInit);
      session.addEventListener('end', () => { session = null; btn.textContent = label; });
      await renderer.xr.setSession(session);
      btn.textContent = 'Exit';
    } catch (err) {
      session = null;
      btn.textContent = `Could not start: ${err.message}`;
    }
  });
  return btn;
}

// ---- loop -------------------------------------------------------------------------------------
renderer.setAnimationLoop((time) => {
  schedule();

  for (const [hand, group] of handGrabs) {
    if (pinchPosition(hand, pinchPoint)) group.position.copy(pinchPoint);
  }

  masterAnalyser.getByteFrequencyData(freqData);
  const bins = freqData.length;
  for (let i = 0; i < BAR_COUNT; i++) {
    const a = (i / BAR_COUNT) * Math.PI * 2;
    const bin = Math.floor((Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2)) * bins * 0.7); // mirrored spectrum
    const h = 0.05 + (freqData[bin] / 255) * 1.6;
    barMatrix.makeRotationY(-a).setPosition(Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8);
    barScale.y = h;
    barMatrix.scale(barScale);
    bars.setMatrixAt(i, barMatrix);
  }
  bars.instanceMatrix.needsUpdate = true;

  const bass = (freqData[1] + freqData[2]) / 510;
  floorRing.scale.setScalar(1 + bass * 0.08);
  floorRing.material.opacity = 0.35 + bass * 0.65;

  for (const s of speakers) {
    const level = s.analyser.getAverageFrequency() / 255;
    s.core.scale.setScalar(1 + level * 0.8);
    s.halo.rotation.set(time * 0.0007, time * 0.001, 0);
    s.halo.scale.setScalar(1 + level * 0.5);
  }

  if (!renderer.xr.isPresenting) controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
