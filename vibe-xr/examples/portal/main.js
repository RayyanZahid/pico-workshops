/*
 * PORTAL
 * ----------------------------------------------------------------------------
 * What it shows: in passthrough AR, a glowing doorway stands in your real room.
 * Through it you see another world: a violet sky, stars, floating crystals. Step
 * through the doorway and the other world wraps around you, while the door now
 * shows your real room behind you. Pinch or pull the trigger to move the door to
 * wherever you are looking (on the floor).
 *
 * How the trick works: the doorway is an invisible plane that writes 1 into the
 * stencil buffer. Every material in the other world only draws where the stencil
 * is 1 (EqualStencilFunc). When you cross the door plane we flip those materials
 * to NotEqualStencilFunc, so the world draws everywhere except the doorway.
 * Nothing drawn = passthrough shows, so the doorway becomes a window back home.
 *
 * WebXR features used:
 *   - immersive-ar session with passthrough (alpha canvas, no background)
 *   - WebGL stencil buffer (renderer created with stencil: true)
 *   - hit-test (optional) to re-place the door on the real floor
 *   - 'select' (trigger or hand pinch) to move the door
 * Desktop fallback: a stand-in room; orbit to look through the door, scroll to
 * fly through it and look back.
 *
 * Remix prompts to paste into Claude Code:
 *   1. "In examples/portal, make the other world an underwater scene: blue fog
 *       inside the portal only, drifting bubbles, and a slow caustic shimmer on
 *       the ground."
 *   2. "Add a second portal to a different world and let me choose which one to
 *       place with the left vs right hand."
 *   3. "Make the doorway a circle that starts closed and irises open over two
 *       seconds when it is placed, with a humming sound that gets louder as I
 *       get closer."
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PICO, applyPicoFog, picoMaterial } from '../../theme/pico-theme.js';

const DOOR_W = 1.0;
const DOOR_H = 2.1;
const statusEl = document.getElementById('status');

// ---- renderer, scene, camera ------------------------------------------------
// stencil: true is required; three.js turned the stencil buffer off by default in r163.
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
applyPicoFog(scene, THREE, { near: 6, far: 20 });

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(1.2, 1.5, 1.8);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, -3.2); // behind the door, so scrolling in flies you through it
controls.minDistance = 0.3;
controls.enableDamping = true;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(1, 3, 2);
scene.add(sun);

// ---- stencil helpers ---------------------------------------------------------------
const worldMaterials = [];   // draw only through the door (flipped when inside)
const outsideMaterials = []; // desktop stand-in room: the inverse
function inWorld(mat) {
  mat.stencilWrite = true; // three.js only enables the stencil test when this is true
  mat.stencilRef = 1;
  mat.stencilFunc = THREE.EqualStencilFunc;
  worldMaterials.push(mat);
  return mat;
}
function outsideWorld(mat) {
  mat.stencilWrite = true;
  mat.stencilRef = 1;
  mat.stencilFunc = THREE.NotEqualStencilFunc;
  outsideMaterials.push(mat);
  return mat;
}
let inside = false;
function setInside(value) {
  inside = value;
  for (const m of worldMaterials) m.stencilFunc = inside ? THREE.NotEqualStencilFunc : THREE.EqualStencilFunc;
  for (const m of outsideMaterials) m.stencilFunc = inside ? THREE.EqualStencilFunc : THREE.NotEqualStencilFunc;
  statusEl.textContent = inside ? 'You are in the other world. The door leads home.' : 'You are in your room. Step through the door.';
}

// ---- the portal: door frame + invisible stencil mask + the world behind it ---------------
const portal = new THREE.Group();
portal.position.set(0, 0, -1.5);
scene.add(portal);

const mask = new THREE.Mesh(
  new THREE.PlaneGeometry(DOOR_W, DOOR_H),
  new THREE.MeshBasicMaterial({
    colorWrite: false, depthWrite: false, side: THREE.DoubleSide,
    stencilWrite: true, stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
  })
);
mask.position.y = DOOR_H / 2;
mask.renderOrder = -1; // must write the stencil before anything reads it
portal.add(mask);

const frameMat = picoMaterial(THREE, 'glow', { color: PICO.glow });
const t = 0.05;
for (const [w, h, x, y] of [
  [t, DOOR_H + t, -DOOR_W / 2 - t / 2, DOOR_H / 2],
  [t, DOOR_H + t, DOOR_W / 2 + t / 2, DOOR_H / 2],
  [DOOR_W + 2 * t, t, 0, DOOR_H + t / 2],
]) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), frameMat);
  bar.position.set(x, y, 0);
  portal.add(bar);
}

const world = new THREE.Group();
portal.add(world);

// Sky: a big inside-out sphere with a vertical gradient baked into vertex colors.
const skyGeo = new THREE.SphereGeometry(30, 32, 16);
const skyColors = [];
const top = new THREE.Color(PICO.accent2).multiplyScalar(0.35);
const horizon = new THREE.Color(PICO.accent2);
const below = new THREE.Color(PICO.bg);
const c = new THREE.Color();
for (let i = 0; i < skyGeo.attributes.position.count; i++) {
  const y = skyGeo.attributes.position.getY(i) / 30;
  if (y > 0) c.copy(horizon).lerp(top, Math.pow(y, 0.6));
  else c.copy(horizon).lerp(below, Math.min(1, -y * 4));
  skyColors.push(c.r, c.g, c.b);
}
skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
world.add(new THREE.Mesh(skyGeo, inWorld(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }))));

const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48), inWorld(picoMaterial(THREE, 'matte', { color: '#1b1033', fog: false })));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.005;
world.add(ground);

const starGeo = new THREE.BufferGeometry();
const starPos = [];
for (let i = 0; i < 500; i++) {
  const v = new THREE.Vector3().randomDirection();
  v.y = Math.abs(v.y) * 0.9 + 0.1;
  v.normalize().multiplyScalar(26);
  starPos.push(v.x, v.y, v.z);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
world.add(new THREE.Points(starGeo, inWorld(new THREE.PointsMaterial({ color: PICO.ink, size: 0.12, fog: false }))));

const moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 16), inWorld(picoMaterial(THREE, 'glow', { color: PICO.glow, fog: false })));
moon.position.set(-6, 9, -20);
world.add(moon);

// Crystals live only on the far side of the door (local -z), so none float in front of it.
const crystals = [];
const crystalGeo = new THREE.OctahedronGeometry(1, 0);
const crystalColors = [PICO.glow, PICO.accent, PICO.danger, PICO.ink];
for (let i = 0; i < 22; i++) {
  const color = crystalColors[i % crystalColors.length];
  const mat = inWorld(i % 3 ? picoMaterial(THREE, 'matte', { color, roughness: 0.3, fog: false }) : picoMaterial(THREE, 'glow', { color, fog: false }));
  const m = new THREE.Mesh(crystalGeo, mat);
  const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.9; // always local -z, behind the door
  const r = 2.5 + Math.random() * 11;
  m.position.set(Math.sin(angle) * r, 0.4 + Math.random() * 3, Math.cos(angle) * r);
  m.scale.set(0.25, 0.6, 0.25).multiplyScalar(0.6 + Math.random() * 1.4);
  m.userData.phase = Math.random() * Math.PI * 2;
  m.userData.baseY = m.position.y;
  world.add(m);
  crystals.push(m);
}

// ---- desktop stand-in room (your "real" room when there is no passthrough) ------------------
const standIn = new THREE.Group();
const standInFloor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), outsideWorld(picoMaterial(THREE, 'matte', { color: PICO.surface })));
standInFloor.rotation.x = -Math.PI / 2;
const standInGrid = new THREE.GridHelper(8, 32, PICO.accent, '#2c2f3a');
outsideWorld(standInGrid.material);
standInGrid.position.y = 0.002;
standIn.add(standInFloor, standInGrid);
scene.add(standIn);

// ---- AR: place the door in front of you, re-place it with hit-test -------------------------------
let hitTestSource = null;
let needsPlacement = false;
const reticle = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.1, 40).rotateX(-Math.PI / 2).translate(0, 0.003, 0), picoMaterial(THREE, 'glow', { color: PICO.glow }));
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

renderer.xr.addEventListener('sessionstart', async () => {
  applyPicoFog(scene, THREE, { ar: true });
  standIn.visible = false;
  needsPlacement = true;
  setInside(false);
  const session = renderer.xr.getSession();
  try {
    const viewerSpace = await session.requestReferenceSpace('viewer');
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
  } catch {
    hitTestSource = null; // hit-test not granted: the door just stays where it was placed
  }
});
renderer.xr.addEventListener('sessionend', () => {
  hitTestSource = null;
  reticle.visible = false;
  applyPicoFog(scene, THREE, { near: 6, far: 20 });
  standIn.visible = true;
  portal.position.set(0, 0, -1.5);
  portal.rotation.set(0, 0, 0);
  setInside(false);
});

const viewerPos = new THREE.Vector3();
const viewerDir = new THREE.Vector3();
function faceViewer(position) {
  const xrCam = renderer.xr.getCamera();
  xrCam.getWorldPosition(viewerPos);
  portal.position.copy(position);
  portal.rotation.set(0, Math.atan2(viewerPos.x - position.x, viewerPos.z - position.z), 0);
  setInside(false);
}

for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  controller.addEventListener('select', () => {
    if (reticle.visible) faceViewer(new THREE.Vector3().setFromMatrixPosition(reticle.matrix));
  });
  scene.add(controller);
}

// ---- Enter AR button ----------------------------------------------------------------------------
document.getElementById('xr-actions').appendChild(
  xrButton('immersive-ar', 'Enter AR', { optionalFeatures: ['local-floor', 'hit-test', 'hand-tracking'] })
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

// ---- loop: detect crossing the door plane ------------------------------------------------------
const eye = new THREE.Vector3();
let prevZ = null;
setInside(false);

renderer.setAnimationLoop((time, frame) => {
  const presenting = renderer.xr.isPresenting;

  if (frame) {
    const refSpace = renderer.xr.getReferenceSpace();
    if (needsPlacement) {
      const pose = frame.getViewerPose(refSpace);
      if (pose) {
        const p = pose.transform.position;
        viewerDir.set(0, 0, -1).applyQuaternion(new THREE.Quaternion().copy(pose.transform.orientation));
        viewerDir.y = 0;
        viewerDir.normalize();
        faceViewer(new THREE.Vector3(p.x, 0, p.z).addScaledVector(viewerDir, 1.8));
        needsPlacement = false;
      }
    }
    if (hitTestSource) {
      const hit = frame.getHitTestResults(hitTestSource)[0];
      const pose = hit && hit.getPose(refSpace);
      reticle.visible = !!pose;
      if (pose) reticle.matrix.fromArray(pose.transform.matrix);
    }
  } else {
    controls.update();
  }

  // Where is the eye relative to the door? Local z > 0 is "our" side.
  (presenting ? renderer.xr.getCamera() : camera).getWorldPosition(eye);
  portal.worldToLocal(eye);
  const inDoorway = Math.abs(eye.x) < DOOR_W / 2 + 0.1 && eye.y < DOOR_H + 0.2;
  if (prevZ !== null && inDoorway) {
    if (prevZ > 0 && eye.z <= 0 && !inside) setInside(true);
    else if (prevZ < 0 && eye.z >= 0 && inside) setInside(false);
  }
  prevZ = eye.z;

  const s = time * 0.001;
  for (const m of crystals) {
    m.rotation.y = s * 0.4 + m.userData.phase;
    m.position.y = m.userData.baseY + Math.sin(s + m.userData.phase) * 0.15;
  }
  frameMat.opacity = 0.75 + Math.sin(s * 2) * 0.2;

  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
