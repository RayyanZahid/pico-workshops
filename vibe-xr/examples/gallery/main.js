/*
 * GALLERY
 * ----------------------------------------------------------------------------
 * What it shows: a small lit gallery with one plinth. A GLB model floats above
 * it. Grab it (controller trigger, or pinch near it with your hand) and twist:
 * the model turns with your hand, so you can inspect it from every side. Squeeze
 * or press Next to cycle through the sample models. A plaque shows the name and
 * license of what is on display.
 *
 * SWAP IN YOUR OWN GLB (the Meshy / Blender lane):
 *   - put the file in the repo's assets/ folder and add it to MODELS below as
 *     { name: 'My robot', url: '../../assets/robot.glb', credit: 'me' }, or
 *   - open this page with ?model=<url-of-a-glb>, or
 *   - on desktop, drag a .glb file from your computer onto the page.
 * Any size model is fine: it is auto-scaled to fit and centered on the plinth.
 * Draco and meshopt compressed GLBs load too.
 *
 * WebXR features used:
 *   - immersive-vr session (local-floor)
 *   - controllers: raycast + 'selectstart'/'selectend' grab, 'squeeze' = next model
 *   - hand-tracking: pinch near the model to grab, wrist rotation turns it
 *   - GLTFLoader (+ DRACOLoader, MeshoptDecoder), RoomEnvironment lighting
 * Desktop fallback: OrbitControls; drag ON the model to rotate it, drag
 * elsewhere to orbit.
 *
 * Remix prompts to paste into Claude Code:
 *   1. "In examples/gallery, add two more plinths to the left and right, each
 *       with a different model from MODELS, and let me grab any of them."
 *   2. "When I let go of the model, keep it spinning with the speed my hand
 *       had, slowing down over a few seconds like a real turntable."
 *   3. "Load my Meshy model from assets/meshy.glb, and if it has animations,
 *       play the first one with an AnimationMixer while it is on the plinth."
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { PICO, applyPicoFog, picoMaterial } from '../../theme/pico-theme.js';

// CC0 models from KhronosGroup/glTF-Sample-Assets, pinned to one commit so they never move.
// Sizes matter: 50 people on one Wi-Fi. The default is the smallest.
const KHRONOS = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@c6a6bd13ab2b3c685c7903d03561b8a9392f38b8/Models';
const MODELS = [
  { name: 'Sheen Chair', url: `${KHRONOS}/SheenChair/glTF-Binary/SheenChair.glb`, credit: 'Eric Chadwick / Wayfair, CC0' },
  { name: 'Avocado', url: `${KHRONOS}/Avocado/glTF-Binary/Avocado.glb`, credit: 'Microsoft, CC0' },
  { name: 'Lantern', url: `${KHRONOS}/Lantern/glTF-Binary/Lantern.glb`, credit: 'sbtron / Frank Galligan, CC0' },
  { name: 'Water Bottle', url: `${KHRONOS}/WaterBottle/glTF-Binary/WaterBottle.glb`, credit: 'Microsoft, CC0' },
];
const MODEL_SIZE = 0.5;                            // metres: the model's largest side after auto-scaling
const PIVOT = new THREE.Vector3(0, 1.3, -1.1);     // where the model floats, chest height, arm's reach-ish

const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
if (params.get('model')) {
  const url = params.get('model');
  MODELS.unshift({ name: decodeURIComponent(url.split('/').pop().replace(/\.glb.*$/i, '')), url, credit: 'from ?model=' });
}

// ---- renderer, scene, camera ------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
applyPicoFog(scene, THREE, { near: 6, far: 18 });
// A baked "room" reflection so PBR models (metal, sheen) look right without extra lights.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 50);
camera.position.set(0.6, 1.55, 0.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(PIVOT);
controls.enableDamping = true;
controls.update();

// ---- the room -------------------------------------------------------------------------
const room = new THREE.Group();
scene.add(room);
const wallMat = picoMaterial(THREE, 'matte', { color: PICO.surface, roughness: 0.95 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), picoMaterial(THREE, 'matte', { color: '#101218', roughness: 0.6 }));
floor.rotation.x = -Math.PI / 2;
const back = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), wallMat);
back.position.set(0, 1.6, -3);
const left = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), wallMat);
left.position.set(-3, 1.6, 0);
left.rotation.y = Math.PI / 2;
const right = left.clone();
right.position.x = 3;
right.rotation.y = -Math.PI / 2;
room.add(floor, back, left, right);

// Accent strip lines along the walls.
const stripMat = picoMaterial(THREE, 'glow', { color: PICO.accent });
for (const [x, z, ry] of [[0, -2.99, 0], [-2.99, 0, Math.PI / 2], [2.99, 0, -Math.PI / 2]]) {
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.02), stripMat);
  strip.position.set(x, 2.4, z);
  strip.rotation.y = ry;
  room.add(strip);
}

const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.9, 40), picoMaterial(THREE, 'matte', { color: '#2c2f3a', roughness: 0.4 }));
plinth.position.set(PIVOT.x, 0.45, PIVOT.z);
const plinthRing = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.006, 8, 64).rotateX(Math.PI / 2), picoMaterial(THREE, 'glow', { color: PICO.glow }));
plinthRing.position.set(PIVOT.x, 0.9, PIVOT.z);
room.add(plinth, plinthRing);

scene.add(new THREE.HemisphereLight(0xffffff, PICO.bg, 0.6));
const spot = new THREE.SpotLight(0xffffff, 18, 6, Math.PI / 7, 0.5, 1.5);
spot.position.set(0.4, 3, -0.4);
spot.target.position.copy(PIVOT);
scene.add(spot, spot.target);

// Plaque: a canvas texture we redraw whenever the model changes.
const plaqueCanvas = document.createElement('canvas');
plaqueCanvas.width = 512; plaqueCanvas.height = 160;
const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
plaqueTex.colorSpace = THREE.SRGBColorSpace;
const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.125), new THREE.MeshBasicMaterial({ map: plaqueTex }));
plaque.position.set(PIVOT.x, 0.72, PIVOT.z + 0.37);
plaque.rotation.x = -0.35;
room.add(plaque);
function drawPlaque(title, line2) {
  const g = plaqueCanvas.getContext('2d');
  g.fillStyle = PICO.surface; g.fillRect(0, 0, 512, 160);
  g.fillStyle = PICO.glow; g.fillRect(0, 0, 8, 160);
  g.fillStyle = PICO.ink; g.font = '700 46px "Space Grotesk", system-ui, sans-serif';
  g.fillText(title, 32, 70, 460);
  g.fillStyle = '#a4a9b8'; g.font = '400 26px Inter, system-ui, sans-serif';
  g.fillText(line2, 32, 120, 460);
  plaqueTex.needsUpdate = true;
}

// ---- loading models ----------------------------------------------------------------------
const pivot = new THREE.Group();   // we rotate this; the model sits centered inside it
pivot.position.copy(PIVOT);
scene.add(pivot);

const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/draco/gltf/');
const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
let current = null;
let modelIndex = 0;
let loadToken = 0;

function showModel(entry) {
  const token = ++loadToken;
  drawPlaque(entry.name, 'Loading...');
  statusEl.textContent = `Loading ${entry.name}...`;
  loader.load(
    entry.url,
    (gltf) => {
      if (token !== loadToken) return; // a newer load started; drop this one
      if (current) disposeModel(current);
      current = gltf.scene;
      // Center it on the pivot and scale its largest side to MODEL_SIZE.
      const box = new THREE.Box3().setFromObject(current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = MODEL_SIZE / Math.max(size.x, size.y, size.z, 1e-6);
      current.scale.setScalar(scale);
      current.position.copy(center).multiplyScalar(-scale);
      pivot.quaternion.identity();
      pivot.add(current);
      drawPlaque(entry.name, entry.credit);
      statusEl.textContent = `${entry.name}: grab it to rotate. ${MODELS.length} models, squeeze or Next to cycle.`;
    },
    (e) => {
      if (token === loadToken && e.total) statusEl.textContent = `Loading ${entry.name}: ${Math.round((e.loaded / e.total) * 100)}% of ${(e.total / 1e6).toFixed(1)} MB`;
    },
    (err) => {
      if (token !== loadToken) return;
      console.warn('GLB failed to load', entry.url, err);
      drawPlaque(entry.name, 'Could not load this file');
      statusEl.textContent = `Could not load ${entry.name}. Check the URL or file, then try Next.`;
    }
  );
}
function disposeModel(obj) {
  pivot.remove(obj);
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) for (const m of [].concat(o.material)) { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); m.dispose(); }
  });
}
function nextModel() {
  modelIndex = (modelIndex + 1) % MODELS.length;
  showModel(MODELS[modelIndex]);
}
showModel(MODELS[0]);

// ---- grab to rotate: the model follows the rotation of whatever grabbed it ---------------------
// grab = { grabber: Object3D whose rotation we follow, q0: its rotation at grab time, m0: model rotation }
let grab = null;
const qNow = new THREE.Quaternion();
function startGrab(grabber) {
  grab = { grabber, q0: grabber.getWorldQuaternion(new THREE.Quaternion()).invert(), m0: pivot.quaternion.clone() };
}
function endGrab(grabber) {
  if (grab && grab.grabber === grabber) grab = null;
}

const raycaster = new THREE.Raycaster();
const handFactory = new XRHandModelFactory();
const controllerFactory = new XRControllerModelFactory();
const pinchPoint = new THREE.Vector3();

for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  controller.addEventListener('selectstart', (event) => {
    if (event.data && event.data.hand) return; // hands grab via pinch below
    raycaster.setFromXRController(controller);
    const close = controller.getWorldPosition(new THREE.Vector3()).distanceTo(PIVOT) < MODEL_SIZE;
    if (close || raycaster.intersectObject(pivot, true).length) startGrab(controller);
  });
  controller.addEventListener('selectend', () => endGrab(controller));
  controller.addEventListener('squeeze', nextModel);
  const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: PICO.glow }));
  ray.scale.z = 2;
  controller.add(ray);
  controller.addEventListener('connected', (e) => { ray.visible = !e.data.hand; });
  scene.add(controller);

  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerFactory.createControllerModel(grip));
  scene.add(grip);

  const hand = renderer.xr.getHand(i);
  hand.add(handFactory.createHandModel(hand, 'mesh'));
  hand.addEventListener('pinchstart', () => {
    const index = hand.joints['index-finger-tip'];
    const thumb = hand.joints['thumb-tip'];
    if (!index || !thumb) return;
    pinchPoint.copy(index.position).add(thumb.position).multiplyScalar(0.5);
    if (pinchPoint.distanceTo(PIVOT) < MODEL_SIZE * 0.9) startGrab(hand.joints['wrist']);
  });
  hand.addEventListener('pinchend', () => endGrab(hand.joints['wrist']));
  scene.add(hand);
}

// ---- desktop: drag on the model rotates it, drag elsewhere orbits; drop a .glb to load it -------
const pointer = new THREE.Vector2();
let spinDrag = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (renderer.xr.isPresenting) return;
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (!raycaster.intersectObject(pivot, true).length) return;
  spinDrag = { x: e.clientX, y: e.clientY };
  controls.enabled = false;
});
window.addEventListener('pointermove', (e) => {
  if (!spinDrag) return;
  const dx = e.clientX - spinDrag.x;
  const dy = e.clientY - spinDrag.y;
  spinDrag = { x: e.clientX, y: e.clientY };
  pivot.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), dx * 0.01);
  pivot.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), dy * 0.01);
});
window.addEventListener('pointerup', () => { spinDrag = null; controls.enabled = true; });

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = [...e.dataTransfer.files].find((f) => /\.(glb|gltf)$/i.test(f.name));
  if (!file) { statusEl.textContent = 'Drop a .glb file (a .gltf with separate textures will not load this way).'; return; }
  MODELS.push({ name: file.name.replace(/\.(glb|gltf)$/i, ''), url: URL.createObjectURL(file), credit: 'dropped from your computer' });
  modelIndex = MODELS.length - 1;
  showModel(MODELS[modelIndex]);
});

// ---- buttons --------------------------------------------------------------------------------
const nextBtn = document.createElement('button');
nextBtn.className = 'pico-btn pico-btn--ghost';
nextBtn.textContent = 'Next model';
nextBtn.addEventListener('click', nextModel);
document.getElementById('xr-actions').append(
  xrButton('immersive-vr', 'Enter VR', { optionalFeatures: ['local-floor', 'hand-tracking'] }),
  nextBtn
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
const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.05);

  if (grab) {
    grab.grabber.getWorldQuaternion(qNow);
    // delta = now * start^-1, applied on top of the model's rotation at grab time
    pivot.quaternion.copy(qNow).multiply(grab.q0).multiply(grab.m0);
  } else if (!spinDrag) {
    pivot.rotation.y += dt * 0.25; // idle turntable
  }
  plinthRing.material.opacity = grab ? 1 : 0.7;

  if (!renderer.xr.isPresenting) controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
