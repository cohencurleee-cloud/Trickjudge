import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#arenaCanvas');
const arena = $('#arena');
const webglError = $('#webglError');
const scoreEl = $('#score');
const roundEl = $('#round');
const livesEl = $('#lives');
const comboEl = $('#combo');
const coinsEl = $('#coins');
const answersEl = $('#answers');
const feedbackEl = $('#feedback');
const difficultyEl = $('#difficulty');
const statusText = $('#statusText');
const replayBtn = $('#replayBtn');
const slowBtn = $('#slowBtn');
const restartBtn = $('#restartBtn');
const shopDialog = $('#shopDialog');
const characterShop = $('#characterShop');
const trickShop = $('#trickShop');
const shopCoinsEl = $('#shopCoins');
const shopMessage = $('#shopMessage');

const SAVE_KEY = 'trickJudgeSaveV3';
const defaultSave = {
  coins: 0,
  ownedCharacters: ['rookie'],
  equippedCharacter: 'rookie',
  ownedTricks: ['backflip', 'frontflip', 'sideflip', 'spin360']
};

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return {
      ...defaultSave,
      ...saved,
      ownedCharacters: Array.isArray(saved.ownedCharacters) ? saved.ownedCharacters : defaultSave.ownedCharacters,
      ownedTricks: Array.isArray(saved.ownedTricks) ? saved.ownedTricks : defaultSave.ownedTricks
    };
  } catch {
    return { ...defaultSave };
  }
}

let save = loadSave();
const persist = () => localStorage.setItem(SAVE_KEY, JSON.stringify(save));

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
} catch (error) {
  webglError.classList.remove('hidden');
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x28405a);
scene.fog = new THREE.Fog(0x28405a, 26, 58);

// Judge/audience side view. Keep the athlete travelling left -> right.
const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
camera.position.set(0.35, 4.15, 13.8);
camera.lookAt(0.15, 2.25, -0.45);

scene.add(new THREE.HemisphereLight(0xd8e9ff, 0x53606b, 2.6));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.35);
keyLight.position.set(-5, 10.5, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 12;
keyLight.shadow.camera.bottom = -3;
keyLight.shadow.bias = -0.00025;
scene.add(keyLight);

const coolFill = new THREE.DirectionalLight(0x9ec7ff, 1.15);
coolFill.position.set(7, 5, 6);
scene.add(coolFill);

const backRim = new THREE.DirectionalLight(0x92b9e9, 1.2);
backRim.position.set(-5, 5, -8);
scene.add(backRim);

const world = new THREE.Group();
scene.add(world);

const standard = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const boxMesh = (w, h, d, material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

// -----------------------------
// Arena inspired by the supplied reference
// -----------------------------
const floorMat = standard(0x2d4969, 0.92, 0.02);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
world.add(floor);

// Slightly lighter competition area.
const competitionFloor = boxMesh(18.8, 0.055, 8.6, standard(0x36597f, 0.88), 0, 0.025, -0.15);
world.add(competitionFloor);

const whiteLineMat = new THREE.MeshStandardMaterial({
  color: 0xf1f5fa,
  roughness: 0.58,
  emissive: 0xffffff,
  emissiveIntensity: 0.035
});

function laneLine(x, z, width, depth) {
  const line = boxMesh(width, 0.022, depth, whiteLineMat, x, 0.068, z);
  line.castShadow = false;
  world.add(line);
}

// Long parallel floor markings like the reference.
for (const z of [-3.45, -2.15, 2.15, 3.45]) laneLine(0, z, 18.0, 0.055);
for (const x of [-8.25, 8.25]) laneLine(x, 0, 0.055, 7.05);
laneLine(-3.3, 0, 0.055, 7.0);
laneLine(3.3, 0, 0.055, 7.0);

// Blue landing/crash mat behind the athlete path.
const matBaseMat = standard(0x173b67, 0.78, 0.01);
const matTopMat = standard(0x275c91, 0.7, 0.02);
const crashBase = boxMesh(5.6, 0.45, 1.75, matBaseMat, -0.4, 0.26, -2.4);
const crashTop = boxMesh(5.48, 0.12, 1.64, matTopMat, -0.4, 0.55, -2.4);
world.add(crashBase, crashTop);

// Subtle stitched mat lines.
for (let i = -2; i <= 2; i++) {
  const seam = boxMesh(0.018, 0.006, 1.55, standard(0x6b97c1, 0.9), -0.4 + i * 1.05, 0.616, -2.4);
  seam.castShadow = false;
  world.add(seam);
}

// Back wall and upper arena panels.
const wallMat = standard(0x23384e, 0.95);
const backWall = boxMesh(24, 10.5, 0.28, wallMat, 0, 5.2, -8.35);
world.add(backWall);

const panelMat = standard(0x314a64, 0.9);
for (let i = 0; i < 7; i++) {
  const p = boxMesh(2.6, 2.0, 0.12, panelMat, -8.8 + i * 2.95, 7.35, -8.16);
  world.add(p);
  const inset = boxMesh(1.7, 0.72, 0.08, standard(0x283d55, 0.92), p.position.x, 7.35, -8.07);
  world.add(inset);
}

// Bleacher steps.
const bleacherGroup = new THREE.Group();
world.add(bleacherGroup);
const stepMat = standard(0x2b415b, 0.93);
const stepFrontMat = standard(0x20344b, 0.95);
const rows = 8;
for (let row = 0; row < rows; row++) {
  const y = 1.2 + row * 0.46;
  const z = -4.35 - row * 0.49;
  const step = boxMesh(20.4, 0.26, 0.72, row % 2 ? stepMat : stepFrontMat, 0, y, z);
  bleacherGroup.add(step);
}

// Seats - instanced for performance.
const seatGeo = new THREE.BoxGeometry(0.34, 0.24, 0.38);
const seatMat = standard(0x1c3553, 0.83, 0.02);
const seatCount = rows * 36;
const seats = new THREE.InstancedMesh(seatGeo, seatMat, seatCount);
const dummy = new THREE.Object3D();
let seatIndex = 0;
for (let row = 0; row < rows; row++) {
  for (let i = 0; i < 36; i++) {
    const aisleGap = (i === 10 || i === 11 || i === 24 || i === 25);
    const y = 1.46 + row * 0.46;
    const z = -4.10 - row * 0.49;
    const x = -9.1 + i * 0.52;
    dummy.position.set(x, y, z);
    dummy.scale.set(aisleGap ? 0.001 : 1, aisleGap ? 0.001 : 1, aisleGap ? 0.001 : 1);
    dummy.updateMatrix();
    seats.setMatrixAt(seatIndex++, dummy.matrix);
  }
}
seats.instanceMatrix.needsUpdate = true;
seats.receiveShadow = true;
world.add(seats);

// Crowd: heads + torsos, enough color variation to feel busy without looking like black dots.
const crowdColors = [0x7d8794, 0x8c5f5b, 0x5e738c, 0x765f7d, 0x718066, 0x856c50, 0x4c6673, 0x8a7775];
const crowdHeadMat = standard(0xc99576, 0.9);
const torsoMats = crowdColors.map((c) => standard(c, 0.96));
const crowdHeadGeo = new THREE.SphereGeometry(0.105, 10, 8);
const crowdTorsoGeo = new THREE.CapsuleGeometry(0.11, 0.2, 3, 8);

for (let row = 0; row < 5; row++) {
  for (let i = 0; i < 30; i++) {
    if ((i >= 9 && i <= 11) || (i >= 21 && i <= 23)) continue;
    const x = -8.7 + i * 0.59 + (row % 2) * 0.12;
    const y = 1.95 + row * 0.47;
    const z = -4.02 - row * 0.49;

    const torso = new THREE.Mesh(crowdTorsoGeo, torsoMats[(i + row) % torsoMats.length]);
    torso.position.set(x, y - 0.11, z);
    torso.scale.set(0.9, 1.15, 0.86);
    torso.castShadow = false;
    world.add(torso);

    const head = new THREE.Mesh(crowdHeadGeo, crowdHeadMat);
    head.position.set(x, y + 0.22, z + 0.005);
    head.castShadow = false;
    world.add(head);
  }
}

// Aisle/stair cutouts and side stair rails.
const stairMat = standard(0x48637d, 0.9);
for (const x of [-3.45, 3.45]) {
  for (let row = 0; row < 7; row++) {
    const s = boxMesh(1.2, 0.16, 0.47, stairMat, x, 1.26 + row * 0.46, -4.2 - row * 0.49);
    bleacherGroup.add(s);
  }
}

const railMat = standard(0x9aabba, 0.46, 0.62);
function railBar(w, h, d, x, y, z) {
  const b = boxMesh(w, h, d, railMat, x, y, z);
  b.castShadow = false;
  world.add(b);
}
railBar(20.0, 0.065, 0.065, 0, 2.06, -3.67);
for (let x = -9.4; x <= 9.4; x += 1.0) railBar(0.055, 0.72, 0.055, x, 1.72, -3.67);

// Upper balcony rails.
railBar(20.1, 0.055, 0.055, 0, 5.42, -7.15);
for (let x = -9.4; x <= 9.4; x += 1.25) railBar(0.05, 0.62, 0.05, x, 5.12, -7.15);

// Scoreboards / display screens.
function makeScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 220;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#e7eef5');
  grad.addColorStop(1, '#cbd7e4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#8da2b8';
  ctx.lineWidth = 14;
  ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  ctx.fillStyle = '#264766';
  ctx.font = '900 58px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TRICK', c.width / 2, 95);
  ctx.font = '900 52px Arial';
  ctx.fillText('JUDGE', c.width / 2, 155);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const screenMat = new THREE.MeshBasicMaterial({ map: makeScreenTexture() });
for (const x of [-7.4, 0, 7.4]) {
  const frame = boxMesh(3.05, 1.45, 0.16, standard(0x172638, 0.64, 0.28), x, 6.9, -8.0);
  world.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 1.16), screenMat);
  screen.position.set(x, 6.9, -7.9);
  world.add(screen);
}

// Lighting rigs.
const trussMat = standard(0x6d7d8e, 0.45, 0.68);
function truss(w, h, d, x, y, z) {
  const mesh = boxMesh(w, h, d, trussMat, x, y, z);
  mesh.castShadow = false;
  world.add(mesh);
}
truss(19.2, 0.09, 0.09, 0, 8.55, -1.2);
truss(19.2, 0.09, 0.09, 0, 8.55, -6.5);
truss(0.09, 0.09, 5.35, -9.5, 8.55, -3.85);
truss(0.09, 0.09, 5.35, 9.5, 8.55, -3.85);

function floodArray(x, z, aimX) {
  const frame = boxMesh(1.75, 0.68, 0.22, standard(0x27384b, 0.56, 0.35), x, 8.1, z);
  frame.rotation.z = x < 0 ? -0.06 : 0.06;
  world.add(frame);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 5.5,
          roughness: 0.25
        })
      );
      bulb.position.set(x - 0.65 + col * 0.32, 8.27 - row * 0.26, z + 0.12);
      world.add(bulb);
    }
  }
  const spot = new THREE.SpotLight(0xffffff, 18, 28, Math.PI / 8, 0.6, 1.5);
  spot.position.set(x, 8.0, z + 0.25);
  spot.target.position.set(aimX, 0, -0.5);
  world.add(spot, spot.target);
}
floodArray(-7.0, 1.0, -2.5);
floodArray(0, 1.0, 0);
floodArray(7.0, 1.0, 2.5);
floodArray(-5.4, -5.9, -2);
floodArray(5.4, -5.9, 2);

// -----------------------------
// Athlete - stylized sports-game human, not block-man
// -----------------------------
const materials = {
  skin: standard(0xd7a17e, 0.82),
  skinShade: standard(0xb77d5f, 0.86),
  jacket: standard(0xa84a49, 0.68, 0.01),
  jacketDark: standard(0x763536, 0.75, 0.01),
  shirt: standard(0x303842, 0.82),
  jeans: standard(0x2d425d, 0.8),
  jeansDark: standard(0x1f3148, 0.84),
  shoe: standard(0x51382b, 0.82),
  sole: standard(0x251f1b, 0.9),
  hair: standard(0x3a291f, 0.93),
  eye: standard(0x1c1d1f, 0.7),
  metal: standard(0x8a95a1, 0.45, 0.55),
  white: standard(0xf3f4f6, 0.65)
};

const smoothCapsule = (r, length, mat) => {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, length, 10, 24), mat);
  m.castShadow = true;
  return m;
};
const smoothSphere = (r, mat, seg = 28) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(16, Math.round(seg * 0.65))), mat);
  m.castShadow = true;
  return m;
};
const smoothCylinder = (rt, rb, h, mat, segments = 22) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), mat);
  m.castShadow = true;
  return m;
};

const athleteRoot = new THREE.Group();
const bodyRig = new THREE.Group();
athleteRoot.add(bodyRig);
scene.add(athleteRoot);

// Pelvis/core.
const pelvis = smoothCapsule(0.27, 0.22, materials.jeans);
pelvis.scale.set(1.05, 0.8, 0.82);
pelvis.position.y = -0.02;
bodyRig.add(pelvis);

// Torso with tapered jacket silhouette.
const torso = smoothCapsule(0.33, 0.68, materials.jacket);
torso.scale.set(1.02, 1, 0.78);
torso.position.y = 0.68;
bodyRig.add(torso);

// Puffer-style front panels, thin and curved-ish instead of slabs.
for (const y of [0.48, 0.67, 0.86]) {
  const panel = smoothCylinder(0.035, 0.035, 0.48, materials.jacketDark, 14);
  panel.rotation.z = Math.PI / 2;
  panel.scale.z = 0.7;
  panel.position.set(0.30, y, 0);
  bodyRig.add(panel);
}

const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 10, 28, Math.PI * 1.55), materials.jacketDark);
collar.rotation.x = Math.PI / 2;
collar.rotation.z = -0.22;
collar.position.set(0.03, 1.13, 0);
collar.castShadow = true;
bodyRig.add(collar);

const neck = smoothCylinder(0.095, 0.105, 0.16, materials.skin, 20);
neck.position.y = 1.25;
bodyRig.add(neck);

// Head is slightly longer than a sphere, with jaw + face details.
const head = new THREE.Group();
head.position.set(0, 1.57, 0);
bodyRig.add(head);

const skull = smoothSphere(0.285, materials.skin, 30);
skull.scale.set(0.9, 1.08, 0.86);
head.add(skull);

const jaw = smoothSphere(0.205, materials.skinShade, 24);
jaw.scale.set(0.95, 0.7, 0.78);
jaw.position.set(0.055, -0.15, 0);
head.add(jaw);

const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 16), materials.skinShade);
nose.rotation.z = -Math.PI / 2;
nose.position.set(0.278, 0.01, 0);
nose.castShadow = true;
head.add(nose);

for (const z of [-0.085, 0.085]) {
  const eye = smoothSphere(0.018, materials.eye, 12);
  eye.position.set(0.24, 0.065, z);
  head.add(eye);
}

const earL = smoothSphere(0.055, materials.skinShade, 16);
earL.scale.set(0.55, 1, 0.55);
earL.position.set(0, 0.02, 0.25);
head.add(earL);
const earR = earL.clone();
earR.position.z = -0.25;
head.add(earR);

const hairCap = smoothSphere(0.292, materials.hair, 30);
hairCap.scale.set(0.92, 0.58, 0.9);
hairCap.position.y = 0.18;
head.add(hairCap);

// Hair volume swept backward so facing direction is obvious.
for (let i = 0; i < 5; i++) {
  const lock = smoothCapsule(0.045, 0.17 + i * 0.02, materials.hair);
  lock.rotation.z = -0.85 - i * 0.07;
  lock.position.set(-0.06 - i * 0.045, 0.22 + i * 0.012, -0.14 + i * 0.07);
  head.add(lock);
}

function makeArm(side) {
  const shoulder = new THREE.Group();
  shoulder.position.set(0.01, 0.98, side * 0.39);
  bodyRig.add(shoulder);

  const upperJacket = smoothCapsule(0.12, 0.34, materials.jacket);
  upperJacket.position.y = -0.29;
  upperJacket.scale.z = 0.9;
  shoulder.add(upperJacket);

  const elbow = new THREE.Group();
  elbow.position.y = -0.58;
  shoulder.add(elbow);
  elbow.add(smoothSphere(0.095, materials.skin, 18));

  const forearm = smoothCapsule(0.082, 0.34, materials.skin);
  forearm.position.y = -0.27;
  elbow.add(forearm);

  const hand = smoothSphere(0.09, materials.skin, 20);
  hand.scale.set(0.78, 1.04, 0.7);
  hand.position.y = -0.53;
  elbow.add(hand);

  return { shoulder, elbow };
}

function makeLeg(side) {
  const hip = new THREE.Group();
  hip.position.set(0, -0.13, side * 0.18);
  bodyRig.add(hip);

  const thigh = smoothCylinder(0.13, 0.105, 0.58, materials.jeans, 24);
  thigh.position.y = -0.37;
  hip.add(thigh);

  const knee = new THREE.Group();
  knee.position.y = -0.67;
  hip.add(knee);
  const kneeShape = smoothSphere(0.115, materials.jeansDark, 18);
  kneeShape.scale.set(0.9, 1.0, 0.82);
  knee.add(kneeShape);

  const shin = smoothCylinder(0.105, 0.09, 0.58, materials.jeans, 24);
  shin.position.y = -0.35;
  knee.add(shin);

  const ankle = new THREE.Group();
  ankle.position.y = -0.66;
  knee.add(ankle);

  const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.27, 5, 18), materials.shoe);
  shoe.rotation.z = Math.PI / 2;
  shoe.scale.set(1.0, 0.82, 0.8);
  shoe.position.set(0.12, -0.02, 0);
  shoe.castShadow = true;
  ankle.add(shoe);

  const sole = boxMesh(0.4, 0.035, 0.19, materials.sole, 0.13, -0.105, 0);
  ankle.add(sole);

  return { hip, knee, ankle };
}

const leftArm = makeArm(1);
const rightArm = makeArm(-1);
const leftLeg = makeLeg(1);
const rightLeg = makeLeg(-1);
const ROOT_Y = 1.62;

const groundShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.68, 44),
  new THREE.MeshBasicMaterial({ color: 0x0b1724, transparent: true, opacity: 0.32, depthWrite: false })
);
groundShadow.rotation.x = -Math.PI / 2;
groundShadow.position.y = 0.085;
groundShadow.scale.set(1.45, 0.68, 1);
scene.add(groundShadow);

function resetPose() {
  for (const j of [
    leftArm.shoulder,
    rightArm.shoulder,
    leftArm.elbow,
    rightArm.elbow,
    leftLeg.hip,
    rightLeg.hip,
    leftLeg.knee,
    rightLeg.knee,
    leftLeg.ankle,
    rightLeg.ankle
  ]) {
    j.rotation.set(0, 0, 0);
  }
  bodyRig.rotation.set(0, 0, 0);
  bodyRig.position.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
}

function runPose(t) {
  resetPose();
  const phase = t * Math.PI * 6.6;
  const leftStride = Math.sin(phase);
  const rightStride = -leftStride;

  leftLeg.hip.rotation.z = leftStride * 0.76;
  rightLeg.hip.rotation.z = rightStride * 0.76;

  leftLeg.knee.rotation.z = leftStride < 0 ? -leftStride * 1.28 : -leftStride * 0.14;
  rightLeg.knee.rotation.z = rightStride < 0 ? -rightStride * 1.28 : -rightStride * 0.14;

  leftLeg.ankle.rotation.z = leftStride > 0 ? 0.2 : -0.12;
  rightLeg.ankle.rotation.z = rightStride > 0 ? 0.2 : -0.12;

  leftArm.shoulder.rotation.z = rightStride * 0.8;
  rightArm.shoulder.rotation.z = leftStride * 0.8;
  leftArm.elbow.rotation.z = 0.78 + Math.max(0, -rightStride) * 0.22;
  rightArm.elbow.rotation.z = 0.78 + Math.max(0, -leftStride) * 0.22;

  bodyRig.rotation.z = -0.12;
  bodyRig.rotation.y = Math.sin(phase * 2) * 0.025;
  bodyRig.position.y = 0.035 + Math.abs(Math.cos(phase)) * 0.035;
  head.rotation.z = 0.045;
}

function takeoffPose(v, oneLeg = false) {
  runPose(0.76);
  leftArm.shoulder.rotation.z = THREE.MathUtils.lerp(leftArm.shoulder.rotation.z, 1.85, v);
  rightArm.shoulder.rotation.z = THREE.MathUtils.lerp(rightArm.shoulder.rotation.z, 1.85, v);
  leftArm.elbow.rotation.z = THREE.MathUtils.lerp(leftArm.elbow.rotation.z, 0.22, v);
  rightArm.elbow.rotation.z = THREE.MathUtils.lerp(rightArm.elbow.rotation.z, 0.22, v);

  if (oneLeg) {
    leftLeg.hip.rotation.z = THREE.MathUtils.lerp(leftLeg.hip.rotation.z, -0.04, v);
    leftLeg.knee.rotation.z = THREE.MathUtils.lerp(leftLeg.knee.rotation.z, 0.08, v);
    rightLeg.hip.rotation.z = THREE.MathUtils.lerp(rightLeg.hip.rotation.z, 1.0, v);
    rightLeg.knee.rotation.z = THREE.MathUtils.lerp(rightLeg.knee.rotation.z, -0.38, v);
  } else {
    leftLeg.hip.rotation.z = THREE.MathUtils.lerp(leftLeg.hip.rotation.z, -0.12, v);
    rightLeg.hip.rotation.z = THREE.MathUtils.lerp(rightLeg.hip.rotation.z, -0.12, v);
    leftLeg.knee.rotation.z = THREE.MathUtils.lerp(leftLeg.knee.rotation.z, 0.12, v);
    rightLeg.knee.rotation.z = THREE.MathUtils.lerp(rightLeg.knee.rotation.z, 0.12, v);
  }

  bodyRig.rotation.z = THREE.MathUtils.lerp(-0.12, -0.02, v);
  bodyRig.position.y = THREE.MathUtils.lerp(-0.08, 0.08, v);
}

function standingLoadPose(v) {
  resetPose();
  leftLeg.hip.rotation.z = rightLeg.hip.rotation.z = -0.52 * v;
  leftLeg.knee.rotation.z = rightLeg.knee.rotation.z = 1.05 * v;
  leftLeg.ankle.rotation.z = rightLeg.ankle.rotation.z = -0.18 * v;
  leftArm.shoulder.rotation.z = rightArm.shoulder.rotation.z = -1.4 * v;
  leftArm.elbow.rotation.z = rightArm.elbow.rotation.z = 0.5 * v;
  bodyRig.position.y = -0.16 * v;
}

function tuckPose(v) {
  resetPose();
  leftLeg.hip.rotation.z = rightLeg.hip.rotation.z = -1.18 * v;
  leftLeg.knee.rotation.z = rightLeg.knee.rotation.z = 1.95 * v;
  leftLeg.ankle.rotation.z = rightLeg.ankle.rotation.z = -0.42 * v;
  leftArm.shoulder.rotation.z = rightArm.shoulder.rotation.z = -0.9 * v;
  leftArm.elbow.rotation.z = rightArm.elbow.rotation.z = 1.05 * v;
}

function layoutPose() {
  resetPose();
  leftArm.shoulder.rotation.z = rightArm.shoulder.rotation.z = -0.35;
  leftArm.elbow.rotation.z = rightArm.elbow.rotation.z = 0.18;
  leftLeg.hip.rotation.z = rightLeg.hip.rotation.z = -0.08;
}

function sidePose() {
  resetPose();
  leftArm.shoulder.rotation.x = -1.0;
  rightArm.shoulder.rotation.x = 1.0;
  leftLeg.hip.rotation.z = -0.2;
  rightLeg.hip.rotation.z = 0.2;
  leftLeg.knee.rotation.z = rightLeg.knee.rotation.z = 0.18;
}

function landingPose(v) {
  standingLoadPose(0.72 * v);
  leftArm.shoulder.rotation.z = rightArm.shoulder.rotation.z = 0.45 * v;
  bodyRig.rotation.z = -0.04 * v;
}

const characters = [
  {
    id: 'rookie',
    name: 'Arena Rookie',
    price: 0,
    jacket: 0xa84a49,
    jacketDark: 0x763536,
    jeans: 0x2d425d,
    jeansDark: 0x1f3148,
    skin: 0xd7a17e,
    skinShade: 0xb77d5f,
    hair: 0x3a291f,
    shoe: 0x51382b,
    desc: 'Red jacket, jeans and brown trainers.'
  },
  {
    id: 'neon',
    name: 'Teal Pro',
    price: 180,
    jacket: 0x3d9a8e,
    jacketDark: 0x23675f,
    jeans: 0x28394e,
    jeansDark: 0x1b2939,
    skin: 0xe0aa86,
    skinShade: 0xbb8262,
    hair: 0x1e1a17,
    shoe: 0xe7e8ea,
    desc: 'Teal jacket with dark athletic jeans.'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    price: 260,
    jacket: 0x354b73,
    jacketDark: 0x24344f,
    jeans: 0x161f2e,
    jeansDark: 0x0e1622,
    skin: 0xaf7657,
    skinShade: 0x86553c,
    hair: 0x171310,
    shoe: 0x292929,
    desc: 'Dark blue arena kit.'
  },
  {
    id: 'gold',
    name: 'Gold Pro',
    price: 420,
    jacket: 0xc49a3f,
    jacketDark: 0x8d6b2a,
    jeans: 0x26364c,
    jeansDark: 0x1b2a3b,
    skin: 0xd29b74,
    skinShade: 0xab7353,
    hair: 0x2d1b10,
    shoe: 0x3d2a1f,
    desc: 'Gold jacket with competition denim.'
  }
];

function applyCharacter(id) {
  const c = characters.find((x) => x.id === id) || characters[0];
  materials.jacket.color.setHex(c.jacket);
  materials.jacketDark.color.setHex(c.jacketDark);
  materials.jeans.color.setHex(c.jeans);
  materials.jeansDark.color.setHex(c.jeansDark);
  materials.skin.color.setHex(c.skin);
  materials.skinShade.color.setHex(c.skinShade);
  materials.hair.color.setHex(c.hair);
  materials.shoe.color.setHex(c.shoe);
}

applyCharacter(save.equippedCharacter);

const tricks = [
  { id: 'backflip', name: 'Backflip', difficulty: 'Beginner', price: 0, mode: 'standing', axis: 'back', turns: 1, height: 2.28, travel: -0.12, note: 'Standing backflip: mostly vertical takeoff with backward rotation.' },
  { id: 'frontflip', name: 'Frontflip', difficulty: 'Beginner', price: 0, mode: 'run', axis: 'front', turns: 1, height: 2.02, travel: 2.15, note: 'Forward rotation while continuing to travel forward.' },
  { id: 'sideflip', name: 'Sideflip', difficulty: 'Beginner', price: 0, mode: 'run', axis: 'side', turns: 1, height: 2.05, travel: 1.9, note: 'Sideways barrel rotation around the travel direction.' },
  { id: 'spin360', name: '360 Spin', difficulty: 'Intermediate', price: 0, mode: 'run', axis: 'spin', turns: 1, height: 1.68, travel: 1.85, note: 'Mostly upright twist around the vertical axis.' },
  { id: 'gainer', name: 'Gainer', difficulty: 'Intermediate', price: 160, mode: 'run', axis: 'back', turns: 1, height: 2.18, travel: 2.48, oneLeg: true, note: 'Forward travel with backward rotation from a one-leg takeoff.' },
  { id: 'cork360', name: 'Cork 360', difficulty: 'Intermediate', price: 220, mode: 'run', axis: 'cork', turns: 1, height: 2.28, travel: 2.1, note: 'Off-axis backward flip blended with a twist.' },
  { id: 'doubleback', name: 'Double Backflip', difficulty: 'Advanced', price: 320, mode: 'standing', axis: 'back', turns: 2, height: 2.78, travel: -0.14, note: 'Two backward rotations with a nearly vertical takeoff.' },
  { id: 'doublefront', name: 'Double Frontflip', difficulty: 'Advanced', price: 360, mode: 'run', axis: 'front', turns: 2, height: 2.62, travel: 2.25, note: 'Two forward rotations while traveling forward.' },
  { id: 'cork720', name: 'Cork 720', difficulty: 'Expert', price: 520, mode: 'run', axis: 'cork', turns: 2, height: 2.68, travel: 2.2, note: 'Off-axis flipping motion with two twists worth of rotation.' }
];

let score = 0;
let round = 1;
let lives = 3;
let combo = 1;
let current = null;
let locked = false;
let animationFrame = null;

function ownedTricks() {
  return tricks.filter((t) => save.ownedTricks.includes(t.id));
}

function updateHud() {
  scoreEl.textContent = score;
  roundEl.textContent = round;
  livesEl.textContent = lives;
  comboEl.textContent = `×${combo}`;
  coinsEl.textContent = save.coins;
  shopCoinsEl.textContent = save.coins;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function optionsFor(trick) {
  const others = shuffle(tricks.filter((t) => t.id !== trick.id)).slice(0, 3);
  return shuffle([trick, ...others]);
}

function renderAnswers() {
  answersEl.innerHTML = '';
  for (const option of optionsFor(current)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-btn';
    button.textContent = option.name;
    button.addEventListener('click', () => guess(option, button));
    answersEl.appendChild(button);
  }
}

function trickQuaternion(trick, p) {
  const angle = Math.PI * 2 * trick.turns * p;
  const q = new THREE.Quaternion();

  if (trick.axis === 'front') {
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle);
  } else if (trick.axis === 'back') {
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
  } else if (trick.axis === 'spin') {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
  } else if (trick.axis === 'side') {
    // Slight yaw makes a sideflip readable from the judge's side camera.
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(Math.PI * p) * 0.58);
    const barrel = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle);
    q.copy(yaw).multiply(barrel);
  } else {
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle * 0.68);
    const twist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
    const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(Math.PI * p) * 0.35);
    q.copy(twist).multiply(tilt).multiply(roll);
  }

  return q;
}

function poseAir(trick, p) {
  if (trick.axis === 'spin') {
    layoutPose();
  } else if (trick.axis === 'side') {
    sidePose();
  } else if (trick.axis === 'cork') {
    layoutPose();
    bodyRig.rotation.x = 0.18;
  } else {
    const tightness = 0.48 + 0.52 * Math.sin(Math.PI * p);
    tuckPose(tightness);
  }
}

function runAnimation(trick, slow = false) {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  const start = performance.now();
  const duration = (slow ? 2.35 : 1) * (trick.mode === 'standing' ? 2450 : 3000);
  const runPart = trick.mode === 'run' ? 0.34 : 0.19;
  const airEnd = 0.84;
  const startX = trick.mode === 'run' ? -4.75 : 0;
  const takeoffX = trick.mode === 'run' ? -1.0 : 0;
  const landingX = takeoffX + trick.travel;

  statusText.textContent = slow ? 'SLOW MOTION' : 'WATCH THE TRICK';

  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    athleteRoot.quaternion.identity();

    if (t < runPart) {
      const r = t / runPart;
      if (trick.mode === 'run') {
        athleteRoot.position.set(THREE.MathUtils.lerp(startX, takeoffX, r), ROOT_Y, 0);
        if (r < 0.78) {
          runPose(r / 0.78);
        } else {
          takeoffPose((r - 0.78) / 0.22, Boolean(trick.oneLeg));
        }
      } else {
        athleteRoot.position.set(0, ROOT_Y, 0);
        const load = r < 0.62 ? r / 0.62 : (1 - r) / 0.38;
        standingLoadPose(Math.max(0, Math.min(1, load)));
        if (r > 0.68) {
          leftArm.shoulder.rotation.z = rightArm.shoulder.rotation.z = THREE.MathUtils.lerp(-1.4, 1.75, (r - 0.68) / 0.32);
        }
      }
    } else if (t < airEnd) {
      const p = (t - runPart) / (airEnd - runPart);
      const x = THREE.MathUtils.lerp(takeoffX, landingX, p);
      const y = ROOT_Y + 4 * trick.height * p * (1 - p);
      athleteRoot.position.set(x, y, 0);
      athleteRoot.quaternion.copy(trickQuaternion(trick, p));
      poseAir(trick, p);
    } else {
      const l = (t - airEnd) / (1 - airEnd);
      athleteRoot.position.set(landingX, ROOT_Y, 0);
      athleteRoot.quaternion.identity();
      landingPose(Math.max(0, 1 - l));
    }

    groundShadow.position.x = athleteRoot.position.x;
    const h = Math.max(0, athleteRoot.position.y - ROOT_Y);
    groundShadow.material.opacity = 0.32 * Math.max(0.25, 1 - h / 4.2);
    groundShadow.scale.set(1.45 + h * 0.13, 0.68 + h * 0.045, 1);

    renderer.render(scene, camera);

    if (t < 1) {
      animationFrame = requestAnimationFrame(frame);
    } else {
      animationFrame = null;
      statusText.textContent = locked ? statusText.textContent : 'MAKE YOUR CALL';
    }
  };

  animationFrame = requestAnimationFrame(frame);
}

function newRound() {
  locked = false;
  const pool = ownedTricks();
  let next = pool[Math.floor(Math.random() * pool.length)];
  if (current && pool.length > 1) {
    while (next.id === current.id) next = pool[Math.floor(Math.random() * pool.length)];
  }
  current = next;
  difficultyEl.textContent = current.difficulty;
  feedbackEl.textContent = 'Watch the takeoff, travel and rotation axis before guessing.';
  renderAnswers();
  runAnimation(current, false);
}

function guess(option, button) {
  if (locked || lives <= 0) return;
  locked = true;
  const buttons = [...answersEl.querySelectorAll('.answer-btn')];
  buttons.forEach((b) => (b.disabled = true));
  const correct = option.id === current.id;
  buttons.find((b) => b.textContent === current.name)?.classList.add('correct');

  if (correct) {
    button.classList.add('correct');
    const points = 100 * combo;
    const earnedCoins = 12 + Math.min(18, (combo - 1) * 3);
    score += points;
    save.coins += earnedCoins;
    combo = Math.min(8, combo + 1);
    persist();
    feedbackEl.textContent = `Correct — +${points} score, +${earnedCoins} coins. ${current.note}`;
    statusText.textContent = 'CORRECT';
  } else {
    button.classList.add('wrong');
    lives -= 1;
    combo = 1;
    score = Math.max(0, score - 50);
    feedbackEl.textContent = `Wrong. That was ${current.name}. ${current.note}`;
    statusText.textContent = 'WRONG';
  }

  updateHud();

  if (lives <= 0) {
    restartBtn.classList.remove('hidden');
    feedbackEl.textContent += ` Game over — ${score} points.`;
    return;
  }

  setTimeout(() => {
    round += 1;
    updateHud();
    newRound();
  }, 1500);
}

function restart() {
  score = 0;
  round = 1;
  lives = 3;
  combo = 1;
  restartBtn.classList.add('hidden');
  updateHud();
  newRound();
}

function renderShop() {
  characterShop.innerHTML = '';
  trickShop.innerHTML = '';
  updateHud();

  for (const character of characters) {
    const owned = save.ownedCharacters.includes(character.id);
    const equipped = save.equippedCharacter === character.id;
    const el = document.createElement('div');
    el.className = `shop-item ${owned ? 'owned' : ''}`;
    el.innerHTML = `
      <div class="shop-swatch" style="background:#${character.jacket.toString(16).padStart(6, '0')}">●</div>
      <div class="shop-copy">
        <strong>${character.name}</strong>
        <small>${character.desc}</small>
        <div class="shop-price"><span class="coin-dot"></span>${character.price}</div>
      </div>
      <div class="shop-action-wrap">
        <button class="shop-action ${owned ? '' : 'buy'} ${equipped ? 'equipped' : ''}" type="button">
          ${equipped ? 'Equipped' : owned ? 'Equip' : 'Buy'}
        </button>
      </div>`;

    const action = el.querySelector('button');
    action.addEventListener('click', () => {
      if (equipped) return;
      if (owned) {
        save.equippedCharacter = character.id;
        applyCharacter(character.id);
        persist();
        shopMessage.textContent = `Equipped ${character.name}.`;
        renderShop();
        renderer.render(scene, camera);
        return;
      }
      if (save.coins < character.price) {
        shopMessage.textContent = 'Not enough coins.';
        return;
      }
      save.coins -= character.price;
      save.ownedCharacters.push(character.id);
      save.equippedCharacter = character.id;
      applyCharacter(character.id);
      persist();
      shopMessage.textContent = `Bought ${character.name}.`;
      renderShop();
      renderer.render(scene, camera);
    });
    characterShop.appendChild(el);
  }

  for (const trick of tricks.filter((t) => t.price > 0)) {
    const owned = save.ownedTricks.includes(trick.id);
    const el = document.createElement('div');
    el.className = `shop-item ${owned ? 'owned' : ''}`;
    el.innerHTML = `
      <div class="shop-swatch" style="background:#244263;color:#fff">↻</div>
      <div class="shop-copy">
        <strong>${trick.name}</strong>
        <small>${trick.note}</small>
        <div class="shop-price"><span class="coin-dot"></span>${trick.price}</div>
      </div>
      <div class="shop-action-wrap">
        <button class="shop-action ${owned ? 'equipped' : 'buy'}" type="button" ${owned ? 'disabled' : ''}>
          ${owned ? 'Owned' : 'Unlock'}
        </button>
      </div>`;

    el.querySelector('button').addEventListener('click', () => {
      if (owned) return;
      if (save.coins < trick.price) {
        shopMessage.textContent = 'Not enough coins.';
        return;
      }
      save.coins -= trick.price;
      save.ownedTricks.push(trick.id);
      persist();
      shopMessage.textContent = `Unlocked ${trick.name}. It can now appear in rounds.`;
      renderShop();
    });
    trickShop.appendChild(el);
  }
}

$('#shopBtn').addEventListener('click', () => {
  renderShop();
  shopMessage.textContent = '';
  shopDialog.showModal();
});
$('#closeShop').addEventListener('click', () => shopDialog.close());
shopDialog.addEventListener('click', (event) => {
  if (event.target === shopDialog) shopDialog.close();
});

const howDialog = $('#howDialog');
$('#howBtn').addEventListener('click', () => howDialog.showModal());
$('#closeHow').addEventListener('click', () => howDialog.close());
howDialog.addEventListener('click', (event) => {
  if (event.target === howDialog) howDialog.close();
});

replayBtn.addEventListener('click', () => current && runAnimation(current, false));
slowBtn.addEventListener('click', () => current && runAnimation(current, true));
restartBtn.addEventListener('click', restart);

function resize() {
  const w = arena.clientWidth;
  const h = arena.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}

new ResizeObserver(resize).observe(arena);
window.addEventListener('resize', resize);

athleteRoot.position.set(-4.75, ROOT_Y, 0);
updateHud();
resize();
newRound();
