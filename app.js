const $ = (s) => document.querySelector(s);

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
const athleteStage = $('#athleteStage');
const athlete = $('#athlete');
const trailA = $('#trailA');
const trailB = $('#trailB');

let score = 0;
let round = 1;
let lives = 3;
let combo = 1;
let current = null;
let locked = false;
let lastAnimation = null;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tricks = [
  {
    name: 'Backflip',
    difficulty: 'Beginner',
    note: 'Backward rotation around the horizontal axis.',
    stageFrames: [
      { transform: 'translateX(-50%) translate(0,0) rotateZ(0deg)' },
      { transform: 'translateX(-50%) translate(42px,-55px) rotateZ(-70deg)', offset: .24 },
      { transform: 'translateX(-50%) translate(28px,-155px) rotateZ(-185deg)', offset: .52 },
      { transform: 'translateX(-50%) translate(-18px,-68px) rotateZ(-305deg)', offset: .8 },
      { transform: 'translateX(-50%) translate(0,0) rotateZ(-360deg)' }
    ],
    body: 'tuck'
  },
  {
    name: 'Frontflip',
    difficulty: 'Beginner',
    note: 'Forward rotation; head and chest pitch down first.',
    stageFrames: [
      { transform: 'translateX(-50%) translate(0,0) rotateZ(0deg)' },
      { transform: 'translateX(-50%) translate(40px,-55px) rotateZ(70deg)', offset: .24 },
      { transform: 'translateX(-50%) translate(26px,-155px) rotateZ(185deg)', offset: .52 },
      { transform: 'translateX(-50%) translate(-18px,-68px) rotateZ(305deg)', offset: .8 },
      { transform: 'translateX(-50%) translate(0,0) rotateZ(360deg)' }
    ],
    body: 'tuck'
  },
  {
    name: 'Sideflip',
    difficulty: 'Beginner',
    note: 'Cartwheel-like barrel rotation with the body turning sideways.',
    stageFrames: [
      { transform: 'translateX(-50%) translate(0,0) rotateY(0deg) rotateZ(0deg)' },
      { transform: 'translateX(-50%) translate(36px,-58px) rotateY(28deg) rotateZ(84deg)', offset: .26 },
      { transform: 'translateX(-50%) translate(10px,-150px) rotateY(70deg) rotateZ(180deg)', offset: .53 },
      { transform: 'translateX(-50%) translate(-20px,-60px) rotateY(30deg) rotateZ(280deg)', offset: .8 },
      { transform: 'translateX(-50%) translate(0,0) rotateY(0deg) rotateZ(360deg)' }
    ],
    body: 'side'
  },
  {
    name: '360 Spin',
    difficulty: 'Intermediate',
    note: 'Upright twist around the vertical axis with very little forward/backward flip.',
    stageFrames: [
      { transform: 'translateX(-50%) translate(0,0) rotateY(0deg) rotateZ(0deg)' },
      { transform: 'translateX(-50%) translate(24px,-70px) rotateY(100deg) rotateZ(-5deg)', offset: .28 },
      { transform: 'translateX(-50%) translate(12px,-122px) rotateY(210deg) rotateZ(2deg)', offset: .54 },
      { transform: 'translateX(-50%) translate(-12px,-68px) rotateY(310deg) rotateZ(4deg)', offset: .79 },
      { transform: 'translateX(-50%) translate(0,0) rotateY(360deg) rotateZ(0deg)' }
    ],
    body: 'open'
  },
  {
    name: 'Cork 360',
    difficulty: 'Intermediate',
    note: 'A twisting off-axis flip: part backflip, part spin.',
    stageFrames: [
      { transform: 'translateX(-50%) translate(0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
      { transform: 'translateX(-50%) translate(36px,-66px) rotateX(20deg) rotateY(85deg) rotateZ(-55deg)', offset: .25 },
      { transform: 'translateX(-50%) translate(14px,-148px) rotateX(30deg) rotateY(190deg) rotateZ(-170deg)', offset: .52 },
      { transform: 'translateX(-50%) translate(-20px,-64px) rotateX(12deg) rotateY(300deg) rotateZ(-285deg)', offset: .8 },
      { transform: 'translateX(-50%) translate(0,0) rotateX(0deg) rotateY(360deg) rotateZ(-360deg)' }
    ],
    body: 'layout'
  },
  {
    name: 'Double Backflip',
    difficulty: 'Advanced',
    note: 'Two complete backward rotations before landing.',
    stageFrames: [
      { transform: 'translateX(-50%) translate(0,0) rotateZ(0deg)' },
      { transform: 'translateX(-50%) translate(34px,-95px) rotateZ(-170deg)', offset: .24 },
      { transform: 'translateX(-50%) translate(10px,-175px) rotateZ(-360deg)', offset: .48 },
      { transform: 'translateX(-50%) translate(-16px,-112px) rotateZ(-555deg)', offset: .72 },
      { transform: 'translateX(-50%) translate(0,0) rotateZ(-720deg)' }
    ],
    body: 'tight'
  }
];

function setBodyPose(type) {
  const la = $('.left-arm');
  const ra = $('.right-arm');
  const ll = $('.left-leg');
  const rl = $('.right-leg');
  const torso = $('.torso');
  const poses = {
    tuck: ['rotate(65deg)','rotate(-65deg)','rotate(-34deg)','rotate(34deg)','scaleY(.88)'],
    tight: ['rotate(82deg)','rotate(-82deg)','rotate(-47deg)','rotate(47deg)','scaleY(.82)'],
    side: ['rotate(98deg)','rotate(-15deg)','rotate(-14deg)','rotate(26deg)','rotateY(26deg)'],
    open: ['rotate(118deg)','rotate(-118deg)','rotate(-8deg)','rotate(8deg)','scaleY(1)'],
    layout: ['rotate(35deg)','rotate(-92deg)','rotate(-12deg)','rotate(24deg)','rotateY(18deg)']
  };
  const p = poses[type] || poses.open;
  la.style.transform = p[0]; ra.style.transform = p[1]; ll.style.transform = p[2]; rl.style.transform = p[3]; torso.style.transform = p[4];
}

function shuffled(array) {
  return [...array].sort(() => Math.random() - .5);
}

function getOptions(correct) {
  const others = shuffled(tricks.filter(t => t.name !== correct.name)).slice(0,3);
  return shuffled([correct, ...others]);
}

function animateCurrent(slow = false) {
  if (!current) return;
  if (lastAnimation) lastAnimation.cancel();
  setBodyPose(current.body);
  statusText.textContent = slow ? 'SLOW MOTION REPLAY' : 'WATCH THE TRICK';
  const duration = reducedMotion ? 10 : (slow ? 4200 : 1650);
  lastAnimation = athleteStage.animate(current.stageFrames, {
    duration,
    easing: 'cubic-bezier(.22,.62,.28,1)',
    fill: 'forwards'
  });
  trailA.animate([
    {opacity:0, transform:'translateX(-50%) scale(.8)'},
    {opacity:.32, transform:'translateX(-50%) scale(1.12)', offset:.45},
    {opacity:0, transform:'translateX(-50%) scale(1.28)'}
  ], {duration, easing:'ease-out'});
  trailB.animate([
    {opacity:0, transform:'translateX(-50%) rotate(0deg) scale(.7)'},
    {opacity:.18, transform:'translateX(-50%) rotate(120deg) scale(1)', offset:.5},
    {opacity:0, transform:'translateX(-50%) rotate(260deg) scale(1.2)'}
  ], {duration, easing:'ease-out'});
  lastAnimation.onfinish = () => { statusText.textContent = locked ? statusText.textContent : 'MAKE YOUR CALL'; };
}

function renderAnswers() {
  answersEl.innerHTML = '';
  for (const option of getOptions(current)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'answer-btn';
    btn.textContent = option.name;
    btn.addEventListener('click', () => guess(option.name, btn));
    answersEl.appendChild(btn);
  }
}

function updateHud() {
  scoreEl.textContent = score;
  roundEl.textContent = round;
  livesEl.textContent = lives;
  comboEl.textContent = `x${combo}`;
}

function newRound() {
  locked = false;
  const pool = round < 4 ? tricks.slice(0,3) : round < 8 ? tricks.slice(0,5) : tricks;
  let next = pool[Math.floor(Math.random() * pool.length)];
  if (current && pool.length > 1) {
    while (next.name === current.name) next = pool[Math.floor(Math.random() * pool.length)];
  }
  current = next;
  difficultyEl.textContent = current.difficulty;
  feedbackEl.textContent = 'Watch the full motion before guessing.';
  renderAnswers();
  animateCurrent(false);
}

function guess(name, button) {
  if (locked || lives <= 0) return;
  locked = true;
  const buttons = [...answersEl.querySelectorAll('.answer-btn')];
  buttons.forEach(b => b.disabled = true);
  const isCorrect = name === current.name;
  const correctButton = buttons.find(b => b.textContent === current.name);
  if (correctButton) correctButton.classList.add('correct');

  if (isCorrect) {
    const points = 100 * combo;
    score += points;
    combo = Math.min(combo + 1, 8);
    feedbackEl.textContent = `Correct — ${current.note} +${points} points.`;
    statusText.textContent = 'CORRECT CALL';
  } else {
    button.classList.add('wrong');
    lives -= 1;
    combo = 1;
    score = Math.max(0, score - 50);
    feedbackEl.textContent = `Nope. That was ${current.name}. ${current.note}`;
    statusText.textContent = 'WRONG CALL';
  }
  updateHud();

  if (lives <= 0) {
    feedbackEl.textContent += ` Game over. Final score: ${score}.`;
    restartBtn.classList.remove('hidden');
    replayBtn.disabled = false;
    slowBtn.disabled = false;
    return;
  }

  setTimeout(() => {
    round += 1;
    updateHud();
    newRound();
  }, 1450);
}

function restart() {
  score = 0; round = 1; lives = 3; combo = 1; current = null; locked = false;
  restartBtn.classList.add('hidden');
  updateHud();
  newRound();
}

replayBtn.addEventListener('click', () => animateCurrent(false));
slowBtn.addEventListener('click', () => animateCurrent(true));
restartBtn.addEventListener('click', restart);

const howDialog = $('#howDialog');
$('#howBtn').addEventListener('click', () => howDialog.showModal());
$('#closeHow').addEventListener('click', () => howDialog.close());
howDialog.addEventListener('click', (e) => { if (e.target === howDialog) howDialog.close(); });

updateHud();
newRound();
