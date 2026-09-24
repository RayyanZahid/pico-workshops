/*
 * AR PLACER
 * ----------------------------------------------------------------------------
 * What it shows: passthrough AR. Look at a real floor or table and a glowing
 * reticle sticks to the surface. Pull the trigger (or pinch) to drop an object
 * there; it stays put in the room because each one is pinned with a WebXR anchor
 * when the headset offers one. Squeeze the grip button to undo the last drop.
 *
 * WebXR features used:
 *   - immersive-ar session (passthrough: no background, no fog)
 *   - hit-test (required): a hit-test source cast from the 'viewer' space, so the
 *     reticle sits where you are looking
 *   - anchors (optional): hitTestResult.createAnchor() keeps objects locked to the room
 *   - 'select' for placing (controller trigger or hand pinch), 'squeeze' for undo
 * Desktop fallback: a stand-in floor and table; move the mouse to aim the
 * reticle, click to place, drag to orbit.
 *
 * Remix prompts to paste into Claude Code:
 *   1. "In examples/ar-placer, replace the shapes with a tiny potted plant built
 *       from three.js primitives that grows taller for ten seconds after I place it."
 *   2. "Make placed objects snap to a 10 cm grid on the surface and draw a faint
 *       grid around the reticle so I can line things up."
 *   3. "Turn it into a domino game: each drop places a domino facing away from me,
 *       and pinching the first one knocks the whole chain over with simple physics."
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PICO, applyPicoFog, picoMaterial } from '../../theme/pico-theme.js';

const MAX_OBJECTS = 30;
const statusEl = document.getElementById('status');

// ---- renderer, scene, camera ------------------------------------------------
// alpha: true lets the passthrough camera feed show wherever we draw nothing.
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
applyPicoFog(scene, THREE);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.02, 50);
camera.position.set(0.9, 1.5, 1.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.6, 0);
controls.enableDamping = true;
controls.update();

// No light estimation on PICO, so a fixed, soft rig that reads well in most rooms.
scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(0.5, 2, 1);
scene.add(sun);

// ---- desktop stand-in room (hidden in AR, where the real room takes its place) --------
const standIn = new THREE.Group();
const standInFloor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), picoMaterial(THREE, 'matte', { color: PICO.surface }));
standInFloor.rotation.x = -Math.PI / 2;
const table = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 0.7), picoMaterial(THREE, 'matte', { color: '#2c2f3a' }));
table.position.set(0, 0.36, -0.2);
const grid = new THREE.GridHelper(6, 30, PICO.accent, PICO.surface);
grid.position.y = 0.001;
standIn.add(standInFloor, table, grid);
scene.add(standIn);

// ---- reticle ---------------------------------------------------------------------------
// Built lying flat in its local XZ plane, so a hit pose's +Y (the surface normal) is "up".
const reticle = new THREE.Group();
reticle.add(
  new THREE.Mesh(new THREE.RingGeometry(0.06, 0.075, 40).rotateX(-Math.PI / 2).translate(0, 0.003, 0), picoMaterial(THREE, 'glow', { color: PICO.glow })),
  new THREE.Mesh(new THREE.CircleGeometry(0.012, 16).rotateX(-Math.PI / 2).translate(0, 0.003, 0), picoMaterial(THREE, 'glow', { color: PICO.ink }))
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

// ---- placeable objects ----------------------------------------------------------------------
const SHAPES = [
  { geometry: new THREE.TorusKnotGeometry(0.05, 0.016, 64, 8), height: 0.14, material: () => picoMaterial(THREE, 'matte', { color: PICO.accent, roughness: 0.35 }) },
  { geometry: new THREE.ConeGeometry(0.055, 0.14, 24), height: 0.14, material: () => picoMaterial(THREE, 'matte', { color: PICO.accent2, roughness: 0.4 }) },
  { geometry: new THREE.IcosahedronGeometry(0.06, 0), height: 0.12, material: () => picoMaterial(THREE, 'glow', { color: PICO.glow }) },
];
const shadowGeometry = new THREE.CircleGeometry(0.075, 24).rotateX(-Math.PI / 2).translate(0, 0.002, 0); // lifted 2 mm: no z-fighting
const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });

const placed = []; // { holder, spinner, anchor }
let shapeIndex = 0;

function place(matrix, hitResult) {
  const shape = SHAPES[shapeIndex++ % SHAPES.length];
  const holder = new THREE.Group();          // pinned to the surface (matrix from hit pose or anchor)
  holder.matrixAutoUpdate = false;
  holder.matrix.copy(matrix);
  const spinner = new THREE.Mesh(shape.geometry, shape.material());
  spinner.position.y = shape.height / 2 + 0.01;
  holder.add(new THREE.Mesh(shadowGeometry, shadowMaterial), spinner);
  scene.add(holder);

  const entry = { holder, spinner, anchor: null, born: performance.now() };
  placed.push(entry);

  // Anchors keep the object glued to the room if tracking re-centers.
  if (hitResult && hitResult.createAnchor) {
    hitResult.createAnchor().then((anchor) => { entry.anchor = anchor; }).catch(() => {});
  }
  if (placed.length > MAX_OBJECTS) removeEntry(placed.shift());
  statusEl.textContent = `${placed.length} placed. Squeeze (or press Z) to undo.`;
}

function removeEntry(entry) {
  if (!entry) return;
  if (entry.anchor) entry.anchor.delete();
  entry.spinner.material.dispose();
  scene.remove(entry.holder);
}

function undo() {
  removeEntry(placed.pop());
  statusEl.textContent = `${placed.length} placed.`;
}

// ---- XR: hit-test source from the viewer (gaze) ------------------------------------------------
let hitTestSource = null;
let lastHit = null;

renderer.xr.addEventListener('sessionstart', async () => {
  applyPicoFog(scene, THREE, { ar: true }); // passthrough must show through
  standIn.visible = false;
  const session = renderer.xr.getSession();
  const viewerSpace = await session.requestReferenceSpace('viewer');
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
});
renderer.xr.addEventListener('sessionend', () => {
  hitTestSource = null;
  lastHit = null;
  reticle.visible = false;
  applyPicoFog(scene, THREE);
  standIn.visible = true;
});

for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  controller.addEventListener('select', () => {
    if (reticle.visible) place(reticle.matrix, lastHit);
  });
  controller.addEventListener('squeeze', undo);
  scene.add(controller);
}

// ---- desktop: mouse aims the reticle at the stand-in floor/table --------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const up = new THREE.Vector3(0, 1, 0);
const tmpQuat = new THREE.Quaternion();
const tmpNormal = new THREE.Vector3();
let downAt = null;

function aimDesktop(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects([table, standInFloor], false)[0];
  reticle.visible = !!hit;
  if (!hit) return;
  tmpNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
  tmpQuat.setFromUnitVectors(up, tmpNormal);
  reticle.matrix.compose(hit.point, tmpQuat, new THREE.Vector3(1, 1, 1));
}
renderer.domElement.addEventListener('pointermove', (e) => { if (!renderer.xr.isPresenting) aimDesktop(e); });
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (renderer.xr.isPresenting || !downAt) return;
  if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  aimDesktop(e);
  if (reticle.visible) place(reticle.matrix, null);
});
window.addEventListener('keydown', (e) => { if (e.key === 'z' || e.key === 'Z') undo(); });

// ---- Enter AR button -------------------------------------------------------------------------
document.getElementById('xr-actions').appendChild(
  xrButton('immersive-ar', 'Enter AR', { requiredFeatures: ['hit-test'], optionalFeatures: ['local-floor', 'anchors', 'hand-tracking'] })
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
      renderer.xr.setReferenceSpaceType('local-floor');
      await renderer.xr.setSession(session);
      btn.textContent = 'Exit';
    } catch (err) {
      session = null;
      btn.textContent = `Could not start: ${err.message}`;
    }
  });
  return btn;
}

// ---- loop ------------------------------------------------------------------------------------
renderer.setAnimationLoop((time, frame) => {
  if (frame) {
    const refSpace = renderer.xr.getReferenceSpace();
    if (hitTestSource) {
      const results = frame.getHitTestResults(hitTestSource);
      lastHit = results.length ? results[0] : null;
      const pose = lastHit && lastHit.getPose(refSpace);
      reticle.visible = !!pose;
      if (pose) reticle.matrix.fromArray(pose.transform.matrix);
    }
    for (const entry of placed) {
      if (!entry.anchor || !frame.trackedAnchors || !frame.trackedAnchors.has(entry.anchor)) continue;
      const pose = frame.getPose(entry.anchor.anchorSpace, refSpace);
      if (pose) entry.holder.matrix.fromArray(pose.transform.matrix);
    }
  } else {
    controls.update();
  }

  for (const entry of placed) {
    entry.spinner.rotation.y = time * 0.0008;
    const s = Math.min(1, (performance.now() - entry.born) / 250); // pop in
    entry.spinner.scale.setScalar(0.3 + 0.7 * s);
  }
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
