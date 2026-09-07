import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#arenaCanvas');
const arena = $('#arena');
const webglError = $('#webglError');
const scoreEl = $('#score');
const roundEl = $('#round');
const livesEl = $('#lives');
const comboEl = $('#combo');
const answersEl = $('#answers');
const feedbackEl = $('#feedback');
const difficultyEl = $('#difficulty');
const statusText = $('#statusText');
const replayBtn = $('#replayBtn');
const slowBtn = $('#slowBtn');
const restartBtn = $('#restartBtn');

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
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111722);
scene.fog = new THREE.Fog(0x111722, 13, 30);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 4.25, 11.8);
camera.lookAt(0, 2.15, 0);

scene.add(new THREE.HemisphereLight(0xaecbff, 0x20232b, 2.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.3);
keyLight.position.set(-4, 9, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -2;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x7cf4cd, 1.3);
rimLight.position.set(5, 5, -4);
scene.add(rimLight);

const floorMat = new THREE.MeshStandardMaterial({ color: 0x262c35, roughness: 0.86, metalness: 0.02 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const runwayMat = new THREE.MeshStandardMaterial({ color: 0x48515c, roughness: 0.68 });
const runway = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.08, 2.7), runwayMat);
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
const crowdColors = [0x202631,0x2a303b,0x353b46,0x181d25];
for (let row = 0; row < 8; row++) {
  for (let i = 0; i < 34; i++) {
    const m = new THREE.Mesh(crowdGeo, new THREE.MeshStandardMaterial({ color: crowdColors[(i + row) % crowdColors.length], roughness: 1 }));
    m.position.set(-8.2 + i * 0.5 + (row % 2) * 0.18, 1.4 + row * 0.42, -4.9 + row * 0.08);
    crowdGroup.add(m);
  }
}
scene.add(crowdGroup);

for (const x of [-4.8, 0, 4.8]) {
  const spot = new THREE.SpotLight(0xffffff, 25, 18, Math.PI / 10, 0.55, 1.5);
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

const skin = new THREE.MeshStandardMaterial({ color: 0xe1aa80, roughness: 0.78 });
const skinDark = new THREE.MeshStandardMaterial({ color: 0xc98561, roughness: 0.8 });
const shirt = new THREE.MeshStandardMaterial({ color: 0xef5a59, roughness: 0.67 });
const shirtDark = new THREE.MeshStandardMaterial({ color: 0xb93e47, roughness: 0.72 });
const shorts = new THREE.MeshStandardMaterial({ color: 0x182a43, roughness: 0.75 });
const shoe = new THREE.MeshStandardMaterial({ color: 0xf1f3f6, roughness: 0.58 });
const shoeSole = new THREE.MeshStandardMaterial({ color: 0x232730, roughness: 0.8 });
const hair = new THREE.MeshStandardMaterial({ color: 0x24180f, roughness: 0.95 });
const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
const dark = new THREE.MeshStandardMaterial({ color: 0x0d1118, roughness: 0.7 });

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
athleteRoot.position.set(-3.5, 1.7, 0);

const torso = capsule(0.34, 0.62, shirt);
torso.scale.set(0.93, 1, 1.18);
torso.position.y = 0.6;
bodyRig.add(torso);
const torsoSide = roundedBox(0.18, 0.68, 0.73, shirtDark);
torsoSide.position.set(-0.29, 0.61, 0);
bodyRig.add(torsoSide);
const chestStripe = roundedBox(0.055, 0.43, 0.48, white);
chestStripe.position.set(0.345, 0.68, 0);
bodyRig.add(chestStripe);
const backStripe = roundedBox(0.055, 0.28, 0.48, dark);
backStripe.position.set(-0.35, 0.69, 0);
bodyRig.add(backStripe);

const hips = roundedBox(0.62, 0.34, 0.82, shorts);
hips.position.y = -0.05;
bodyRig.add(hips);

const headGroup = new THREE.Group();
headGroup.position.set(0, 1.47, 0);
bodyRig.add(headGroup);
const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.31, 22, 16), skin);
headMesh.scale.set(0.92, 1.08, 0.94);
headMesh.castShadow = true;
headGroup.add(headMesh);
const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.305, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.48), hair);
hairMesh.position.y = 0.09;
hairMesh.rotation.z = -0.08;
hairMesh.castShadow = true;
headGroup.add(hairMesh);
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 10), skinDark);
nose.rotation.z = -Math.PI / 2;
nose.position.set(0.315, 0.015, 0);
headGroup.add(nose);
const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), dark);
eye.position.set(0.255, 0.085, 0.185);
headGroup.add(eye);

function makeArm(side) {
  const s = side;
  const shoulder = new THREE.Group();
  shoulder.position.set(0, 0.95, 0.48 * s);
  bodyRig.add(shoulder);
  const upper = capsule(0.105, 0.46, skin);
  upper.position.y = -0.34;
  shoulder.add(upper);
  const elbow = new THREE.Group();
  elbow.position.y = -0.68;
  shoulder.add(elbow);
  const elbowBall = jointSphere(0.115, skin);
  elbow.add(elbowBall);
  const lower = capsule(0.09, 0.42, skin);
  lower.position.y = -0.31;
  elbow.add(lower);
  const hand = jointSphere(0.12, skin);
  hand.position.y = -0.62;
  elbow.add(hand);
  return { shoulder, elbow };
}
function makeLeg(side) {
  const s = side;
  const hip = new THREE.Group();
  hip.position.set(0, -0.12, 0.24 * s);
  bodyRig.add(hip);
  const thigh = capsule(0.15, 0.55, shorts);
  thigh.position.y = -0.4;
  hip.add(thigh);
  const knee = new THREE.Group();
  knee.position.y = -0.8;
  hip.add(knee);
  const kneeBall = jointSphere(0.145, skin);
  knee.add(kneeBall);
  const shin = capsule(0.12, 0.5, skin);
  shin.position.y = -0.37;
  knee.add(shin);
  const ankle = new THREE.Group();
  ankle.position.y = -0.72;
  knee.add(ankle);
  const foot = roundedBox(0.42, 0.16, 0.25, shoe);
  foot.position.set(0.11, -0.06, 0);
  ankle.add(foot);
  const sole = roundedBox(0.43, 0.055, 0.26, shoeSole);
  sole.position.set(0.11, -0.14, 0);
  ankle.add(sole);
  return { hip, knee, ankle };
}

const leftArm = makeArm(1);
const rightArm = makeArm(-1);
const leftLeg = makeLeg(1);
const rightLeg = makeLeg(-1);

function setPose({ crouch = 0, tuck = 0, armsUp = 0, side = 0, landing = 0 }) {
  const crouchMix = Math.max(crouch, landing);
  const hipFlex = THREE.MathUtils.lerp(0.02, -0.95, Math.max(crouchMix, tuck));
  const kneeFlex = THREE.MathUtils.lerp(0.04, 1.75, Math.max(crouchMix, tuck));
  leftLeg.hip.rotation.z = hipFlex + side * 0.2;
  rightLeg.hip.rotation.z = hipFlex - side * 0.2;
  leftLeg.knee.rotation.z = kneeFlex;
  rightLeg.knee.rotation.z = kneeFlex;
  leftLeg.ankle.rotation.z = -0.15 - crouchMix * 0.35;
  rightLeg.ankle.rotation.z = -0.15 - crouchMix * 0.35;

  const armBase = THREE.MathUtils.lerp(0.08, -2.65, armsUp);
  const tuckArm = THREE.MathUtils.lerp(armBase, -1.15, tuck);
  leftArm.shoulder.rotation.z = tuckArm + side * 0.55;
  rightArm.shoulder.rotation.z = tuckArm - side * 0.55;
  leftArm.elbow.rotation.z = tuck * 1.1;
  rightArm.elbow.rotation.z = tuck * 1.1;
  bodyRig.rotation.z = crouch * -0.12 + landing * 0.1;
}

const tricks = [
  { name:'Frontflip', difficulty:'Beginner', axis:'forward pitch', note:'Forward somersault: the head rotates toward the direction of travel.', type:'front', height:2.55, rotations:1 },
  { name:'Backflip', difficulty:'Beginner', axis:'backward pitch', note:'Backward somersault: the chest opens and the head rotates away from travel.', type:'back', height:2.65, rotations:1 },
  { name:'Sideflip', difficulty:'Beginner', axis:'side roll', note:'The body rolls around the direction of travel, so the shoulders tip toward and away from the judge.', type:'side', height:2.5, rotations:1 },
  { name:'360 Spin', difficulty:'Intermediate', axis:'vertical twist', note:'An upright full twist around the vertical axis with no somersault.', type:'spin', height:2.05, rotations:1 },
  { name:'Cork 360', difficulty:'Intermediate', axis:'off-axis twist', note:'A backward off-axis flip combined with a full twist.', type:'cork', height:2.65, rotations:1 },
  { name:'Double Backflip', difficulty:'Advanced', axis:'double backward pitch', note:'Two complete backward somersaults before the landing.', type:'doubleback', height:3.15, rotations:2 }
];

let score = 0;
let round = 1;
let lives = 3;
let combo = 1;
let current = null;
let locked = false;
let perfToken = 0;
let performanceRunning = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function smoothstep(a,b,v){
  const x = clamp01((v-a)/(b-a));
  return x*x*(3-2*x);
}
function easeOutCubic(x){ return 1-Math.pow(1-x,3); }
function easeInOutCubic(x){ return x<.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2; }

function updateAthlete(t, trick) {
  const takeoffEnd = 0.22;
  const landingStart = 0.78;
  const airT = clamp01((t - takeoffEnd) / (landingStart - takeoffEnd));
  const airborne = t >= takeoffEnd && t <= landingStart;

  let x;
  if (t < takeoffEnd) x = THREE.MathUtils.lerp(-3.6, -1.65, easeOutCubic(t / takeoffEnd));
  else if (t <= landingStart) x = THREE.MathUtils.lerp(-1.65, 1.8, airT);
  else x = THREE.MathUtils.lerp(1.8, 2.25, smoothstep(landingStart, 1, t));

  const jumpY = airborne ? 4 * trick.height * airT * (1 - airT) : 0;
  athleteRoot.position.set(x, 1.72 + jumpY, 0);
  shadow.position.x = x;
  const shadowScale = 1 - Math.min(jumpY / 7, 0.45);
  shadow.scale.set(1.5 * shadowScale, 0.68 * shadowScale, 1);
  shadow.material.opacity = 0.33 * shadowScale;

  athleteRoot.rotation.set(0,0,0,'YXZ');
  if (airborne) {
    const r = easeInOutCubic(airT) * Math.PI * 2 * trick.rotations;
    if (trick.type === 'front') athleteRoot.rotation.z = -r;
    if (trick.type === 'back' || trick.type === 'doubleback') athleteRoot.rotation.z = r;
    if (trick.type === 'side') athleteRoot.rotation.x = r;
    if (trick.type === 'spin') athleteRoot.rotation.y = r;
    if (trick.type === 'cork') {
      athleteRoot.rotation.order = 'YZX';
      athleteRoot.rotation.y = r;
      athleteRoot.rotation.z = r;
      athleteRoot.rotation.x = Math.sin(airT * Math.PI) * 0.42;
    }
  }

  const crouch = t < takeoffEnd ? Math.sin((t / takeoffEnd) * Math.PI) * 0.9 : 0;
  const landing = t > landingStart ? Math.sin(((t - landingStart) / (1 - landingStart)) * Math.PI) * 0.72 : 0;
  const tuckEnvelope = airborne ? Math.sin(airT * Math.PI) : 0;
  const tuck = ['front','back','doubleback'].includes(trick.type) ? Math.pow(tuckEnvelope, 0.72) : trick.type === 'cork' ? tuckEnvelope * 0.35 : 0;
  const armsUp = trick.type === 'spin' ? tuckEnvelope * 0.86 : Math.min(1, crouch * 0.8 + (airborne ? 0.18 : 0));
  const side = trick.type === 'side' ? tuckEnvelope : 0;
  setPose({ crouch, tuck, armsUp, side, landing });
}

function playCurrent(slow = false) {
  if (!current) return;
  const myToken = ++perfToken;
  const duration = reducedMotion ? 200 : (slow ? 5200 : 2450);
  performanceRunning = true;
  statusText.textContent = slow ? 'SLOW MOTION REPLAY' : 'WATCH THE TRICK';
  const start = performance.now();

  function frame(now) {
    if (myToken !== perfToken) return;
    const t = clamp01((now - start) / duration);
    updateAthlete(t, current);
    if (t < 1) requestAnimationFrame(frame);
    else {
      performanceRunning = false;
      statusText.textContent = locked ? statusText.textContent : 'MAKE YOUR CALL';
    }
  }
  requestAnimationFrame(frame);
}

function shuffled(array){
  const copy = [...array];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
function getOptions(correct){
  return shuffled([correct, ...shuffled(tricks.filter(t=>t.name!==correct.name)).slice(0,3)]);
}
function renderAnswers(){
  answersEl.innerHTML='';
  getOptions(current).forEach(option=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='answer-btn';
    btn.textContent=option.name;
    btn.addEventListener('click',()=>guess(option.name,btn));
    answersEl.appendChild(btn);
  });
}
function updateHud(){
  scoreEl.textContent=score;
  roundEl.textContent=round;
  livesEl.textContent=lives;
  comboEl.textContent=`×${combo}`;
}
function chooseTrick(){
  const pool = round < 4 ? tricks.slice(0,3) : round < 8 ? tricks.slice(0,5) : tricks;
  let next=pool[Math.floor(Math.random()*pool.length)];
  while(current && pool.length>1 && next.name===current.name) next=pool[Math.floor(Math.random()*pool.length)];
  return next;
}
function newRound(){
  locked=false;
  current=chooseTrick();
  difficultyEl.textContent=current.difficulty;
  feedbackEl.textContent='Watch the takeoff and rotation before guessing.';
  renderAnswers();
  playCurrent(false);
}
function guess(name,button){
  if(locked||lives<=0)return;
  locked=true;
  const buttons=[...answersEl.querySelectorAll('.answer-btn')];
  buttons.forEach(b=>b.disabled=true);
  const correctButton=buttons.find(b=>b.textContent===current.name);
  if(correctButton)correctButton.classList.add('correct');
  if(name===current.name){
    const points=100*combo;
    score+=points;
    combo=Math.min(combo+1,8);
    feedbackEl.textContent=`Correct — ${current.note} +${points} points.`;
    statusText.textContent='CORRECT CALL';
  }else{
    button.classList.add('wrong');
    lives-=1;
    combo=1;
    score=Math.max(0,score-50);
    feedbackEl.textContent=`Wrong. That was ${current.name}. ${current.note}`;
    statusText.textContent='WRONG CALL';
  }
  updateHud();
  if(lives<=0){
    feedbackEl.textContent+=` Game over. Final score: ${score}.`;
    restartBtn.classList.remove('hidden');
    return;
  }
  window.setTimeout(()=>{
    round+=1;
    updateHud();
    newRound();
  },1500);
}
function restart(){
  ++perfToken;
  score=0;round=1;lives=3;combo=1;current=null;locked=false;
  restartBtn.classList.add('hidden');
  updateHud();
  newRound();
}

replayBtn.addEventListener('click',()=>playCurrent(false));
slowBtn.addEventListener('click',()=>playCurrent(true));
restartBtn.addEventListener('click',restart);

const howDialog=$('#howDialog');
$('#howBtn').addEventListener('click',()=>howDialog.showModal());
$('#closeHow').addEventListener('click',()=>howDialog.close());
howDialog.addEventListener('click',e=>{if(e.target===howDialog)howDialog.close();});

function resize(){
  const rect=arena.getBoundingClientRect();
  const w=Math.max(1,Math.floor(rect.width));
  const h=Math.max(1,Math.floor(rect.height));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  if(w<600){
    camera.position.set(0,4.5,13.6);
    camera.lookAt(0,2.0,0);
  }else{
    camera.position.set(0,4.25,11.8);
    camera.lookAt(0,2.15,0);
  }
  camera.updateProjectionMatrix();
}
const resizeObserver=new ResizeObserver(resize);
resizeObserver.observe(arena);
resize();

function render(){
  renderer.render(scene,camera);
  requestAnimationFrame(render);
}
render();
updateHud();
newRound();
