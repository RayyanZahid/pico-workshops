/*
 * HAND GARDEN
 * ----------------------------------------------------------------------------
 * What it shows: pinch your thumb and index finger together anywhere in the air
 * and a glowing orb appears at the pinch point. Orbs drift upward, bob, and each
 * one hums a note from a pentatonic scale, positioned in 3D so you hear where it
 * is. Controllers work too (trigger = pinch). The garden keeps the newest 24 orbs.
 *
 * WebXR features used:
 *   - immersive-vr session (local-floor reference space)
 *   - hand-tracking: three.js hand joints + the 'pinchstart' event
 *   - controllers as a fallback ('selectstart')
 *   - WebAudio via three.js PositionalAudio (one oscillator per orb)
 * Desktop fallback: OrbitControls; click the canvas to plant an orb.
 *
 * Remix prompts to paste into Claude Code:
 *   1. "In examples/hand-garden, make orbs I pinch with my LEFT hand play a low
 *       drone and orbs from my RIGHT hand play high bells, with different colors."
 *   2. "Let me grab an existing orb by pinching near it and throw it; it should
 *       keep its velocity and bounce off the floor."
 *   3. "When two orbs touch, merge them into one bigger orb whose note is the
 *       chord of both, with a little burst of particles."
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { PICO, applyPicoFog, picoMaterial } from '../../theme/pico-theme.js';

const MAX_ORBS = 24;
const ORB_COLORS = [PICO.accent, PICO.accent2, PICO.glow];
// C major pentatonic across two octaves (Hz). Pentatonic = anything you play sounds fine together.
const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

const statusEl = document.getElementById('status');

// ---- renderer, scene, camera ------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
applyPicoFog(scene, THREE); // PICO background + fog

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(0, 1.6, 2.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0);
controls.enableDamping = true;
controls.update();

// Audio: one listener on the camera. Browsers keep audio muted until a user gesture.
const listener = new THREE.AudioListener();
camera.add(listener);
scene.add(camera);

// ---- environment --------------------------------------------------------------
scene.add(new THREE.HemisphereLight(PICO.glow, PICO.bg, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(1, 3, 2);
scene.add(key);

const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), picoMaterial(THREE, 'matte', { color: PICO.surface }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.PolarGridHelper(6, 12, 8, 48, PICO.accent, PICO.surface);
grid.position.y = 0.002;
scene.add(grid);

// A few "stems" so the empty garden has something in it before the first pinch.
const stemMat = picoMaterial(THREE, 'glass', { color: PICO.accent2 });
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2;
  const h = 0.4 + (i % 3) * 0.25;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, h, 8), stemMat);
  stem.position.set(Math.cos(a) * 1.6, h / 2, Math.sin(a) * 1.6);
  scene.add(stem);
}

// ---- orbs ----------------------------------------------------------------------
const orbGeometry = new THREE.IcosahedronGeometry(1, 2);
const orbs = [];

function spawnOrb(position) {
  const ctx = listener.context;
  if (ctx.state !== 'running') ctx.resume();

  const color = ORB_COLORS[orbs.length % ORB_COLORS.length];
  const mesh = new THREE.Mesh(orbGeometry, picoMaterial(THREE, 'glow', { color }));
  const size = 0.035 + Math.random() * 0.035;
  mesh.scale.setScalar(size);
  mesh.position.copy(position);
  scene.add(mesh);

  // The hum: a sine oscillator routed through a PositionalAudio panner.
  const sound = new THREE.PositionalAudio(listener);
  sound.setRefDistance(0.4);
  sound.setRolloffFactor(1.5);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = NOTES[Math.floor(Math.random() * NOTES.length)];
  sound.setNodeSource(osc);
  sound.gain.gain.setValueAtTime(0, ctx.currentTime);
  sound.gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4); // fade in, no click
  osc.start();
  mesh.add(sound);

  orbs.push({ mesh, sound, osc, size, born: performance.now() / 1000, phase: Math.random() * Math.PI * 2 });

  if (orbs.length > MAX_ORBS) removeOrb(orbs.shift());
  statusEl.textContent = `${orbs.length} orb${orbs.length === 1 ? '' : 's'} humming.`;
}

function removeOrb(orb) {
  const ctx = listener.context;
  orb.sound.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  orb.osc.stop(ctx.currentTime + 0.35);
  setTimeout(() => {
    orb.sound.disconnect();
    orb.mesh.material.dispose();
    scene.remove(orb.mesh);
  }, 400);
}

// ---- hands and controllers --------------------------------------------------------
const handFactory = new XRHandModelFactory();
const controllerFactory = new XRControllerModelFactory();
const pinchPoint = new THREE.Vector3();

for (let i = 0; i < 2; i++) {
  const hand = renderer.xr.getHand(i);
  hand.add(handFactory.createHandModel(hand, 'mesh'));
  scene.add(hand);
  hand.addEventListener('pinchstart', () => {
    const index = hand.joints['index-finger-tip'];
    const thumb = hand.joints['thumb-tip'];
    if (!index || !thumb) return;
    pinchPoint.copy(index.position).add(thumb.position).multiplyScalar(0.5);
    spawnOrb(pinchPoint);
  });

  const controller = renderer.xr.getController(i);
  scene.add(controller);
  controller.addEventListener('selectstart', (event) => {
    if (event.data && event.data.hand) return; // hands already spawn on 'pinchstart'
    spawnOrb(controller.getWorldPosition(new THREE.Vector3()));
  });

  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerFactory.createControllerModel(grip));
  scene.add(grip);
}

// ---- desktop: click (not drag) plants an orb 1.2 m along the mouse ray ---------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  spawnOrb(raycaster.ray.at(1.2, new THREE.Vector3()));
});

// ---- Enter VR button -------------------------------------------------------------
document.getElementById('xr-actions').appendChild(
  xrButton('immersive-vr', 'Enter VR', { optionalFeatures: ['local-floor', 'hand-tracking'] })
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
      listener.context.resume();
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

// ---- loop -------------------------------------------------------------------------
const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const t = timer.getElapsed();
  const dt = Math.min(timer.getDelta(), 0.05);

  for (const orb of orbs) {
    const age = t - orb.born;
    orb.mesh.position.y += dt * 0.03 * Math.max(0, 1 - age / 20); // rise, then settle
    orb.mesh.position.x += Math.sin(t * 0.7 + orb.phase) * dt * 0.01;
    const pulse = 1 + Math.sin(t * 3 + orb.phase) * 0.12;
    orb.mesh.scale.setScalar(orb.size * pulse * Math.min(1, age * 4)); // grow in over 0.25 s
  }

  if (!renderer.xr.isPresenting) controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
