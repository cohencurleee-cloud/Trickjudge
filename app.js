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

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  webglError.classList.remove('hidden');
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111722);
scene.fog = new THREE.Fog(0x111722, 13, 30);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 4.25, 11.8);
camera.lookAt(0, 2.15, 0);

scene.add(new THREE.HemisphereLight(0xaecbff, 0x20232b, 2.15));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.15);
keyLight.position.set(-4, 9, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -2;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x7cf4cd, 1.2);
rimLight.position.set(5, 5, -4);
scene.add(rimLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 10),
  new THREE.MeshStandardMaterial({ color: 0x262c35, roughness: 0.86, metalness: 0.02 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const runway = new THREE.Mesh(
  new THREE.BoxGeometry(10.5, 0.08, 2.7),
  new THREE.MeshStandardMaterial({ color: 0x48515c, roughness: 0.68 })
);
runway.position.set(0, 0.04, 0);
runway.receiveShadow = true;
scene.add(runway);

const lineMat = new THREE.MeshBasicMaterial({ color: 0xbcc6d4, transparent: true, opacity: 0.38 });
for (const x of [-4.5, 0, 4.5]) {
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 2.55), lineMat);
  mark.position.set(x, 0.09, 0);
  scene.add(mark);
}

const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 9),
  new THREE.MeshStandardMaterial({ color: 0x171c26, roughness: 1 })
);
backWall.position.set(0, 4.4, -5.6);
scene.add(backWall);

const crowdGroup = new THREE.Group();
const crowdGeo = new THREE.SphereGeometry(0.12, 8, 6);
const crowdMats = [0x202631,0x2a303b,0x353b46,0x181d25].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
for (let row = 0; row < 8; row++) {
  for (let i = 0; i < 34; i++) {
    const m = new THREE.Mesh(crowdGeo, crowdMats[(i + row) % crowdMats.length]);
    m.position.set(-8.2 + i * 0.5 + (row % 2) * 0.18, 1.4 + row * 0.42, -4.9 + row * 0.08);
    crowdGroup.add(m);
  }
}
scene.add(crowdGroup);

for (const x of [-4.8, 0, 4.8]) {
  const spot = new THREE.SpotLight(0xffffff, 24, 18, Math.PI / 10, 0.55, 1.5);
  spot.position.set(x, 7.7, 1.5);
  spot.target.position.set(x * 0.25, 0, 0);
  scene.add(spot, spot.target);
}

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.78, 40),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.095;
shadow.scale.set(1.45, 0.68, 1);
scene.add(shadow);

const materials = {
  skin: new THREE.MeshStandardMaterial({ color: 0xe1aa80, roughness: 0.78 }),
  skinDark: new THREE.MeshStandardMaterial({ color: 0xc98561, roughness: 0.8 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0xef5a59, roughness: 0.67 }),
  shirtDark: new THREE.MeshStandardMaterial({ color: 0xb93e47, roughness: 0.72 }),
  shorts: new THREE.MeshStandardMaterial({ color: 0x182a43, roughness: 0.75 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0xf1f3f6, roughness: 0.58 }),
  shoeSole: new THREE.MeshStandardMaterial({ color: 0x232730, roughness: 0.8 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x24180f, roughness: 0.95 }),
  white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x0d1118, roughness: 0.7 })
};

function roundedBox(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 2, 3, 2), material);
  mesh.castShadow = true;
  return mesh;
}
function capsule(radius, length, material, radial = 14) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, radial), material);
  mesh.castShadow = true;
  return mesh;
}
function jointSphere(radius, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  mesh.castShadow = true;
  return mesh;
}

const athleteRoot = new THREE.Group();
const bodyRig = new THREE.Group();
athleteRoot.add(bodyRig);
scene.add(athleteRoot);

const torso = capsule(0.34, 0.62, materials.shirt);
torso.scale.set(0.93, 1, 1.18);
torso.position.y = 0.6;
bodyRig.add(torso);
const torsoSide = roundedBox(0.18, 0.68, 0.73, materials.shirtDark);
torsoSide.position.set(-0.29, 0.61, 0);
bodyRig.add(torsoSide);
const chestStripe = roundedBox(0.055, 0.43, 0.48, materials.white);
chestStripe.position.set(0.345, 0.68, 0);
bodyRig.add(chestStripe);
const backStripe = roundedBox(0.055, 0.28, 0.48, materials.dark);
backStripe.position.set(-0.35, 0.69, 0);
bodyRig.add(backStripe);

const hips = roundedBox(0.62, 0.34, 0.82, materials.shorts);
hips.position.y = -0.05;
bodyRig.add(hips);

const headGroup = new THREE.Group();
headGroup.position.set(0, 1.47, 0);
bodyRig.add(headGroup);
const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.31, 22, 16), materials.skin);
headMesh.scale.set(0.92, 1.08, 0.94);
headMesh.castShadow = true;
headGroup.add(headMesh);
const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.305, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.48), materials.hair);
hairMesh.position.y = 0.09;
hairMesh.rotation.z = -0.08;
hairMesh.castShadow = true;
headGroup.add(hairMesh);
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 10), materials.skinDark);
nose.rotation.z = -Math.PI / 2;
nose.position.set(0.315, 0.015, 0);
headGroup.add(nose);
const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), materials.dark);
eye.position.set(0.255, 0.085, 0.185);
headGroup.add(eye);

function makeArm(side) {
  const shoulder = new THREE.Group();
  shoulder.position.set(0, 0.95, 0.48 * side);
  bodyRig.add(shoulder);
  const upper = capsule(0.105, 0.46, materials.skin);
  upper.position.y = -0.34;
  shoulder.add(upper);
  const elbow = new THREE.Group();
  elbow.position.y = -0.68;
  shoulder.add(elbow);
  elbow.add(jointSphere(0.115, materials.skin));
  const lower = capsule(0.09, 0.42, materials.skin);
  lower.position.y = -0.31;
  elbow.add(lower);
  const hand = jointSphere(0.12, materials.skin);
  hand.position.y = -0.62;
  elbow.add(hand);
  return { shoulder, elbow };
}
function makeLeg(side) {
  const hip = new THREE.Group();
  hip.position.set(0, -0.12, 0.24 * side);
  bodyRig.add(hip);
  const thigh = capsule(0.15, 0.55, materials.shorts);
  thigh.position.y = -0.4;
  hip.add(thigh);
  const knee = new THREE.Group();
  knee.position.y = -0.8;
  hip.add(knee);
  knee.add(jointSphere(0.145, materials.skin));
  const shin = capsule(0.12, 0.5, materials.skin);
  shin.position.y = -0.37;
  knee.add(shin);
  const ankle = new THREE.Group();
  ankle.position.y = -0.72;
  knee.add(ankle);
  const foot = roundedBox(0.42, 0.16, 0.25, materials.shoe);
  foot.position.set(0.11, -0.06, 0);
  ankle.add(foot);
  const sole = roundedBox(0.43, 0.055, 0.26, materials.shoeSole);
  sole.position.set(0.11, -0.14, 0);
  ankle.add(sole);
  return { hip, knee, ankle };
}

const leftArm = makeArm(1);
const rightArm = makeArm(-1);
const leftLeg = makeLeg(1);
const rightLeg = makeLeg(-1);

const ROOT_Y = 1.72;
const zAxis = new THREE.Vector3(0, 0, 1);
const yAxis = new THREE.Vector3(0, 1, 0);
const xAxis = new THREE.Vector3(1, 0, 0);
const qA = new THREE.Quaternion();
const qB = new THREE.Quaternion();
const qC = new THREE.Quaternion();

function resetLimbPose() {
  leftArm.shoulder.rotation.set(0,0,0);
  rightArm.shoulder.rotation.set(0,0,0);
  leftArm.elbow.rotation.set(0,0,0);
  rightArm.elbow.rotation.set(0,0,0);
  leftLeg.hip.rotation.set(0,0,0);
  rightLeg.hip.rotation.set(0,0,0);
  leftLeg.knee.rotation.set(0,0,0);
  rightLeg.knee.rotation.set(0,0,0);
  leftLeg.ankle.rotation.set(0,0,0);
  rightLeg.ankle.rotation.set(0,0,0);
}

function setStandingPose(crouch = 0, landing = 0) {
  resetLimbPose();
  const c = Math.max(crouch, landing);
  leftLeg.hip.rotation.z = -0.72 * c;
  rightLeg.hip.rotation.z = -0.72 * c;
  leftLeg.knee.rotation.z = 1.38 * c;
  rightLeg.knee.rotation.z = 1.38 * c;
  leftLeg.ankle.rotation.z = -0.35 * c;
  rightLeg.ankle.rotation.z = -0.35 * c;
  leftArm.shoulder.rotation.z = -1.9 * c;
  rightArm.shoulder.rotation.z = -1.9 * c;
  bodyRig.position.y = -0.22 * c;
}

function setRunPose(progress, crouch = 0, oneLeg = false) {
  resetLimbPose();
  const phase = progress * Math.PI * 6;
  const swing = Math.sin(phase);
  const swing2 = Math.sin(phase + Math.PI);
  leftLeg.hip.rotation.z = swing * 0.72;
  rightLeg.hip.rotation.z = swing2 * 0.72;
  leftLeg.knee.rotation.z = Math.max(0, -swing) * 1.12;
  rightLeg.knee.rotation.z = Math.max(0, -swing2) * 1.12;
  leftArm.shoulder.rotation.z = swing2 * 0.72;
  rightArm.shoulder.rotation.z = swing * 0.72;
  leftArm.elbow.rotation.z = 0.25;
  rightArm.elbow.rotation.z = 0.25;
  bodyRig.rotation.z = -0.08;
  bodyRig.position.y = Math.abs(Math.sin(phase)) * 0.035;

  if (crouch > 0) {
    leftLeg.hip.rotation.z = THREE.MathUtils.lerp(leftLeg.hip.rotation.z, -0.7, crouch);
    rightLeg.hip.rotation.z = THREE.MathUtils.lerp(rightLeg.hip.rotation.z, -0.7, crouch);
    leftLeg.knee.rotation.z = THREE.MathUtils.lerp(leftLeg.knee.rotation.z, 1.35, crouch);
    rightLeg.knee.rotation.z = THREE.MathUtils.lerp(rightLeg.knee.rotation.z, 1.35, crouch);
    leftArm.shoulder.rotation.z = THREE.MathUtils.lerp(leftArm.shoulder.rotation.z, -1.8, crouch);
    rightArm.shoulder.rotation.z = THREE.MathUtils.lerp(rightArm.shoulder.rotation.z, -1.8, crouch);
    bodyRig.position.y -= 0.18 * crouch;
  }

  if (oneLeg && crouch > 0.55) {
    const k = (crouch - 0.55) / 0.45;
    rightLeg.hip.rotation.z = THREE.MathUtils.lerp(rightLeg.hip.rotation.z, -1.15, k);
    rightLeg.knee.rotation.z = THREE.MathUtils.lerp(rightLeg.knee.rotation.z, 1.8, k);
    leftLeg.hip.rotation.z = THREE.MathUtils.lerp(leftLeg.hip.rotation.z, 0.18, k);
    leftLeg.knee.rotation.z = THREE.MathUtils.lerp(leftLeg.knee.rotation.z, 0.18, k);
  }
}

function setAirPose(trick, a) {
  resetLimbPose();
  bodyRig.position.y = 0;
  const enter = smoothstep(0.06, 0.22, a);
  const exit = 1 - smoothstep(0.72, 0.94, a);
  const tuck = Math.min(enter, exit);

  if (trick.pose === 'tuck') {
    const tight = trick.rotations > 1 ? 1 : 0.82;
    const p = tuck * tight;
    leftLeg.hip.rotation.z = -1.05 * p;
    rightLeg.hip.rotation.z = -1.05 * p;
    leftLeg.knee.rotation.z = 2.05 * p;
    rightLeg.knee.rotation.z = 2.05 * p;
    leftArm.shoulder.rotation.z = -1.25 * p;
    rightArm.shoulder.rotation.z = -1.25 * p;
    leftArm.elbow.rotation.z = 1.0 * p;
    rightArm.elbow.rotation.z = 1.0 * p;
  } else if (trick.pose === 'spin') {
    leftArm.shoulder.rotation.z = -1.35;
    rightArm.shoulder.rotation.z = 1.35;
    leftArm.elbow.rotation.z = 1.0;
    rightArm.elbow.rotation.z = -1.0;
    leftLeg.hip.rotation.z = -0.1;
    rightLeg.hip.rotation.z = 0.1;
  } else if (trick.pose === 'layout') {
    leftArm.shoulder.rotation.z = -2.35 * enter * exit;
    rightArm.shoulder.rotation.z = -2.0 * enter * exit;
    leftLeg.hip.rotation.z = -0.12;
    rightLeg.hip.rotation.z = 0.08;
  } else if (trick.pose === 'side') {
    leftArm.shoulder.rotation.z = -1.4;
    rightArm.shoulder.rotation.z = -0.3;
    leftLeg.hip.rotation.z = -0.65 * tuck;
    rightLeg.hip.rotation.z = -0.25 * tuck;
    leftLeg.knee.rotation.z = 1.2 * tuck;
    rightLeg.knee.rotation.z = 0.8 * tuck;
  }
}

const tricks = [
  { id:'front', name:'Frontflip', difficulty:'Beginner', note:'Forward somersault: head and chest rotate toward the direction of travel.', type:'front', takeoff:'run', height:2.45, travel:1.35, rotations:1, pose:'tuck', coinReward:16, price:0 },
  { id:'back', name:'Backflip', difficulty:'Beginner', note:'Standing backward somersault with almost no forward travel.', type:'back', takeoff:'stand', height:2.5, travel:0.12, rotations:1, pose:'tuck', coinReward:18, price:0 },
  { id:'side', name:'Sideflip', difficulty:'Beginner', note:'Forward travel with a side roll around the direction-of-travel axis.', type:'side', takeoff:'run', height:2.35, travel:1.15, rotations:1, pose:'side', coinReward:18, price:0 },
  { id:'spin', name:'360 Spin', difficulty:'Intermediate', note:'Upright full twist around the vertical axis without a somersault.', type:'spin', takeoff:'run', height:1.85, travel:1.0, rotations:1, pose:'spin', coinReward:20, price:0 },
  { id:'gainer', name:'Gainer', difficulty:'Intermediate', note:'Backward rotation while continuing forward from a one-leg takeoff.', type:'gainer', takeoff:'oneLeg', height:2.45, travel:2.05, rotations:1, pose:'layout', coinReward:28, price:220 },
  { id:'webster', name:'Webster', difficulty:'Intermediate', note:'Forward flip from one leg with obvious forward travel.', type:'webster', takeoff:'oneLeg', height:2.3, travel:2.15, rotations:1, pose:'tuck', coinReward:30, price:260 },
  { id:'cork', name:'Cork 360', difficulty:'Advanced', note:'A backward off-axis flip blended with a full twist.', type:'cork', takeoff:'run', height:2.55, travel:1.35, rotations:1, pose:'layout', coinReward:34, price:320 },
  { id:'backfull', name:'Back Full', difficulty:'Advanced', note:'One backward somersault with one full twist.', type:'backfull', takeoff:'stand', height:2.65, travel:0.18, rotations:1, pose:'layout', coinReward:38, price:390 },
  { id:'doubleback', name:'Double Backflip', difficulty:'Advanced', note:'Two backward somersaults from a standing two-foot takeoff.', type:'doubleback', takeoff:'stand', height:3.0, travel:0.2, rotations:2, pose:'tuck', coinReward:44, price:470 },
  { id:'doublefront', name:'Double Frontflip', difficulty:'Expert', note:'Two forward somersaults with controlled forward travel.', type:'doublefront', takeoff:'run', height:2.95, travel:1.15, rotations:2, pose:'tuck', coinReward:50, price:560 }
];

const characters = [
  { id:'rookie', name:'Rookie', price:0, shirt:0xef5a59, shirtDark:0xb93e47, shorts:0x182a43, shoe:0xf1f3f6, hair:0x24180f, swatch:'#ef5a59', label:'R' },
  { id:'neon', name:'Neon Racer', price:180, shirt:0x33e7d0, shirtDark:0x138f87, shorts:0x10161d, shoe:0xdffff9, hair:0x151515, swatch:'#33e7d0', label:'N' },
  { id:'shadow', name:'Shadow', price:340, shirt:0x171922, shirtDark:0x090a0e, shorts:0x06070a, shoe:0x8b6cff, hair:0x080808, swatch:'#7660d8', label:'S' },
  { id:'gold', name:'Gold Pro', price:620, shirt:0xf0b93f, shirtDark:0xaa7216, shorts:0xf1f3f6, shoe:0x171a20, hair:0x2d1c0d, swatch:'#f0b93f', label:'G' }
];

const SAVE_KEY = 'trickJudgeSaveV4';
const defaultSave = {
  coins: 0,
  ownedCharacters: ['rookie'],
  equippedCharacter: 'rookie',
  ownedTricks: ['front','back','side','spin']
};

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return structuredClone(defaultSave);
    const merged = { ...structuredClone(defaultSave), ...parsed };
    if (!Array.isArray(merged.ownedCharacters)) merged.ownedCharacters = ['rookie'];
    if (!Array.isArray(merged.ownedTricks)) merged.ownedTricks = ['front','back','side','spin'];
    if (!merged.ownedCharacters.includes('rookie')) merged.ownedCharacters.unshift('rookie');
    for (const id of ['front','back','side','spin']) if (!merged.ownedTricks.includes(id)) merged.ownedTricks.push(id);
    return merged;
  } catch {
    return structuredClone(defaultSave);
  }
}
let save = loadSave();
function persistSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function applyCharacter(id) {
  const c = characters.find(item => item.id === id) || characters[0];
  materials.shirt.color.setHex(c.shirt);
  materials.shirtDark.color.setHex(c.shirtDark);
  materials.shorts.color.setHex(c.shorts);
  materials.shoe.color.setHex(c.shoe);
  materials.hair.color.setHex(c.hair);
  save.equippedCharacter = c.id;
  persistSave();
}
applyCharacter(save.equippedCharacter);

let score = 0;
let round = 1;
let lives = 3;
let combo = 1;
let current = null;
let locked = false;
let performanceRunning = false;
let performanceStart = 0;
let performanceDuration = 1800;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function smoothstep(a,b,v){
  if (a === b) return v >= b ? 1 : 0;
  const x = clamp01((v-a)/(b-a));
  return x*x*(3-2*x);
}
function easeOutCubic(x){ return 1-Math.pow(1-x,3); }
function easeInOutCubic(x){ return x<.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2; }

function trickQuaternion(trick, a) {
  const revolutions = Math.PI * 2 * trick.rotations * a;
  bodyRig.quaternion.identity();
  if (trick.type === 'front' || trick.type === 'webster' || trick.type === 'doublefront') {
    bodyRig.quaternion.setFromAxisAngle(zAxis, -revolutions);
  } else if (trick.type === 'back' || trick.type === 'gainer' || trick.type === 'doubleback') {
    bodyRig.quaternion.setFromAxisAngle(zAxis, revolutions);
  } else if (trick.type === 'side') {
    bodyRig.quaternion.setFromAxisAngle(xAxis, revolutions);
  } else if (trick.type === 'spin') {
    bodyRig.quaternion.setFromAxisAngle(yAxis, -revolutions);
  } else if (trick.type === 'cork') {
    qA.setFromAxisAngle(zAxis, Math.PI * 2 * a);
    qB.setFromAxisAngle(yAxis, -Math.PI * 2 * a);
    qC.setFromAxisAngle(xAxis, 0.55 * Math.sin(Math.PI * a));
    bodyRig.quaternion.copy(qA).multiply(qB).multiply(qC);
  } else if (trick.type === 'backfull') {
    qA.setFromAxisAngle(zAxis, Math.PI * 2 * a);
    qB.setFromAxisAngle(yAxis, -Math.PI * 2 * a);
    bodyRig.quaternion.copy(qA).multiply(qB);
  }
}

function updateAthlete(t, trick) {
  const standing = trick.takeoff === 'stand';
  const oneLeg = trick.takeoff === 'oneLeg';
  const takeoffEnd = standing ? 0.27 : 0.3;
  const landingStart = 0.82;
  const takeoffX = standing ? -0.55 : -1.45;
  const runStartX = -4.25;

  athleteRoot.rotation.set(0,0,0);
  bodyRig.quaternion.identity();
  bodyRig.position.set(0,0,0);

  if (t < takeoffEnd) {
    const p = clamp01(t / takeoffEnd);
    const crouch = smoothstep(0.62, 1, p);
    if (standing) {
      athleteRoot.position.set(takeoffX, ROOT_Y, 0);
      setStandingPose(crouch);
      bodyRig.rotation.z = 0;
    } else {
      const x = THREE.MathUtils.lerp(runStartX, takeoffX, easeInOutCubic(p));
      athleteRoot.position.set(x, ROOT_Y, 0);
      setRunPose(p, crouch, oneLeg);
    }
    shadow.position.x = athleteRoot.position.x;
    shadow.material.opacity = 0.28;
    shadow.scale.set(1.25, 0.62, 1);
    return;
  }

  if (t <= landingStart) {
    const a = clamp01((t - takeoffEnd) / (landingStart - takeoffEnd));
    const jump = 4 * trick.height * a * (1-a);
    const x = takeoffX + trick.travel * a;
    athleteRoot.position.set(x, ROOT_Y + jump, 0);
    setAirPose(trick, a);
    trickQuaternion(trick, a);

    shadow.position.x = x;
    const h = clamp01(jump / Math.max(0.01, trick.height));
    shadow.material.opacity = 0.28 * (1 - h * 0.7);
    const s = 1 + h * 0.55;
    shadow.scale.set(1.25 * s, 0.62 * s, 1);
    return;
  }

  const p = clamp01((t - landingStart) / (1 - landingStart));
  const finalX = takeoffX + trick.travel;
  athleteRoot.position.set(finalX, ROOT_Y, 0);
  bodyRig.quaternion.identity();
  setStandingPose(1 - smoothstep(0.12, 0.95, p), 1 - smoothstep(0.12, 0.95, p));
  bodyRig.rotation.z = THREE.MathUtils.lerp(-0.08, 0, smoothstep(0.3,1,p));
  shadow.position.x = finalX;
  shadow.material.opacity = 0.28;
  shadow.scale.set(1.25, 0.62, 1);
}

function resizeRenderer() {
  const w = Math.max(1, arena.clientWidth);
  const h = Math.max(1, arena.clientHeight);
  if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

function renderLoop(now) {
  resizeRenderer();
  if (performanceRunning && current) {
    const elapsed = now - performanceStart;
    const t = clamp01(elapsed / performanceDuration);
    updateAthlete(t, current);
    if (t >= 1) {
      performanceRunning = false;
      statusText.textContent = locked ? statusText.textContent : 'MAKE YOUR CALL';
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

function playPerformance(slow = false) {
  if (!current) return;
  performanceRunning = false;
  updateAthlete(0, current);
  statusText.textContent = slow ? 'SLOW MOTION REPLAY' : 'WATCH THE TRICK';
  performanceDuration = reducedMotion ? 450 : (slow ? 4300 : 1950);
  performanceStart = performance.now();
  performanceRunning = true;
}

function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function ownedTricks() {
  return tricks.filter(t => save.ownedTricks.includes(t.id));
}

function getOptions(correct) {
  const pool = ownedTricks();
  const others = shuffled(pool.filter(t => t.id !== correct.id)).slice(0, 3);
  return shuffled([correct, ...others]);
}

function renderAnswers() {
  answersEl.innerHTML = '';
  for (const option of getOptions(current)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'answer-btn';
    btn.textContent = option.name;
    btn.addEventListener('click', () => guess(option.id, btn));
    answersEl.appendChild(btn);
  }
}

function updateHud() {
  scoreEl.textContent = score;
  roundEl.textContent = round;
  livesEl.textContent = lives;
  comboEl.textContent = `×${combo}`;
  coinsEl.textContent = save.coins;
  shopCoinsEl.textContent = save.coins;
}

function difficultyRank(level) {
  return { Beginner:0, Intermediate:1, Advanced:2, Expert:3 }[level] ?? 0;
}

function newRound() {
  locked = false;
  let pool = ownedTricks();
  const maxRank = round < 4 ? 0 : round < 8 ? 1 : round < 13 ? 2 : 3;
  let eligible = pool.filter(t => difficultyRank(t.difficulty) <= maxRank);
  if (eligible.length < 2) eligible = pool;
  let next = eligible[Math.floor(Math.random() * eligible.length)];
  if (current && eligible.length > 1) {
    let guard = 0;
    while (next.id === current.id && guard++ < 10) next = eligible[Math.floor(Math.random() * eligible.length)];
  }
  current = next;
  difficultyEl.textContent = current.difficulty;
  feedbackEl.textContent = 'Watch the takeoff, travel direction and rotation before guessing.';
  renderAnswers();
  playPerformance(false);
}

function guess(id, button) {
  if (locked || lives <= 0) return;
  locked = true;
  const buttons = [...answersEl.querySelectorAll('.answer-btn')];
  buttons.forEach(b => b.disabled = true);
  const correctButton = buttons.find(b => b.textContent === current.name);
  if (correctButton) correctButton.classList.add('correct');

  if (id === current.id) {
    const points = 100 * combo;
    const coinBonus = current.coinReward + Math.max(0, combo - 1) * 3;
    score += points;
    save.coins += coinBonus;
    persistSave();
    combo = Math.min(combo + 1, 8);
    feedbackEl.textContent = `Correct — +${points} score and +${coinBonus} coins. ${current.note}`;
    statusText.textContent = 'CORRECT CALL';
  } else {
    button.classList.add('wrong');
    lives -= 1;
    combo = 1;
    score = Math.max(0, score - 50);
    feedbackEl.textContent = `Wrong. That was ${current.name}. ${current.note}`;
    statusText.textContent = 'WRONG CALL';
  }
  updateHud();
  renderShop();

  if (lives <= 0) {
    feedbackEl.textContent += ` Game over. Final score: ${score}.`;
    restartBtn.classList.remove('hidden');
    return;
  }

  setTimeout(() => {
    round += 1;
    updateHud();
    newRound();
  }, 1650);
}

function restart() {
  score = 0;
  round = 1;
  lives = 3;
  combo = 1;
  current = null;
  locked = false;
  restartBtn.classList.add('hidden');
  updateHud();
  newRound();
}

function characterItemHtml(c) {
  const owned = save.ownedCharacters.includes(c.id);
  const equipped = save.equippedCharacter === c.id;
  const price = c.price === 0 ? 'Free' : `${c.price}`;
  const action = equipped ? 'Equipped' : owned ? 'Equip' : 'Buy';
  const cls = equipped ? 'equipped' : owned ? '' : 'buy';
  return `
    <article class="shop-item ${owned ? 'owned' : ''}">
      <div class="shop-swatch" style="background:${c.swatch}">${c.label}</div>
      <div class="shop-copy">
        <strong>${c.name}</strong>
        <small>${equipped ? 'Currently in the arena.' : owned ? 'Owned character skin.' : 'New outfit and arena look.'}</small>
      </div>
      <div class="shop-action-wrap">
        <div class="shop-price">${c.price ? '<span class="coin-dot"></span>' : ''}${price}</div>
        <button class="shop-action ${cls}" data-character="${c.id}" type="button">${action}</button>
      </div>
    </article>`;
}

function trickItemHtml(t) {
  const owned = save.ownedTricks.includes(t.id);
  const price = t.price === 0 ? 'Free' : `${t.price}`;
  return `
    <article class="shop-item ${owned ? 'owned' : ''}">
      <div class="shop-swatch" style="background:#202734;color:#e9edf5">${t.rotations > 1 ? '×2' : '↻'}</div>
      <div class="shop-copy">
        <strong>${t.name}</strong>
        <small>${t.difficulty} · ${t.note}</small>
      </div>
      <div class="shop-action-wrap">
        <div class="shop-price">${t.price ? '<span class="coin-dot"></span>' : ''}${price}</div>
        <button class="shop-action ${owned ? 'equipped' : 'buy'}" data-trick="${t.id}" type="button" ${owned ? 'disabled' : ''}>${owned ? 'Unlocked' : 'Buy'}</button>
      </div>
    </article>`;
}

function renderShop() {
  characterShop.innerHTML = characters.map(characterItemHtml).join('');
  trickShop.innerHTML = tricks.map(trickItemHtml).join('');
  shopCoinsEl.textContent = save.coins;

  characterShop.querySelectorAll('[data-character]').forEach(btn => {
    btn.addEventListener('click', () => buyOrEquipCharacter(btn.dataset.character));
  });
  trickShop.querySelectorAll('[data-trick]').forEach(btn => {
    btn.addEventListener('click', () => buyTrick(btn.dataset.trick));
  });
}

function buyOrEquipCharacter(id) {
  const c = characters.find(item => item.id === id);
  if (!c) return;
  if (save.ownedCharacters.includes(id)) {
    applyCharacter(id);
    shopMessage.textContent = `${c.name} equipped.`;
  } else if (save.coins >= c.price) {
    save.coins -= c.price;
    save.ownedCharacters.push(id);
    save.equippedCharacter = id;
    persistSave();
    applyCharacter(id);
    shopMessage.textContent = `${c.name} purchased and equipped.`;
  } else {
    shopMessage.textContent = `You need ${c.price - save.coins} more coins for ${c.name}.`;
  }
  updateHud();
  renderShop();
}

function buyTrick(id) {
  const t = tricks.find(item => item.id === id);
  if (!t || save.ownedTricks.includes(id)) return;
  if (save.coins >= t.price) {
    save.coins -= t.price;
    save.ownedTricks.push(id);
    persistSave();
    shopMessage.textContent = `${t.name} unlocked. It can now appear in rounds.`;
  } else {
    shopMessage.textContent = `You need ${t.price - save.coins} more coins for ${t.name}.`;
  }
  updateHud();
  renderShop();
}

replayBtn.addEventListener('click', () => playPerformance(false));
slowBtn.addEventListener('click', () => playPerformance(true));
restartBtn.addEventListener('click', restart);

const howDialog = $('#howDialog');
$('#howBtn').addEventListener('click', () => howDialog.showModal());
$('#closeHow').addEventListener('click', () => howDialog.close());
howDialog.addEventListener('click', (e) => { if (e.target === howDialog) howDialog.close(); });

$('#shopBtn').addEventListener('click', () => {
  shopMessage.textContent = '';
  renderShop();
  shopDialog.showModal();
});
$('#closeShop').addEventListener('click', () => shopDialog.close());
shopDialog.addEventListener('click', (e) => { if (e.target === shopDialog) shopDialog.close(); });

window.addEventListener('resize', resizeRenderer);
updateHud();
renderShop();
newRound();
