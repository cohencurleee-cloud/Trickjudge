import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const $ = (s) => document.querySelector(s);
const canvas=$('#arenaCanvas'), arena=$('#arena'), webglError=$('#webglError');
const scoreEl=$('#score'), roundEl=$('#round'), livesEl=$('#lives'), comboEl=$('#combo'), coinsEl=$('#coins');
const answersEl=$('#answers'), feedbackEl=$('#feedback'), difficultyEl=$('#difficulty'), statusText=$('#statusText');
const replayBtn=$('#replayBtn'), slowBtn=$('#slowBtn'), restartBtn=$('#restartBtn');
const shopDialog=$('#shopDialog'), characterShop=$('#characterShop'), trickShop=$('#trickShop'), shopCoinsEl=$('#shopCoins'), shopMessage=$('#shopMessage');

const SAVE_KEY='trickJudgeSaveV2';
const defaultSave={coins:0,ownedCharacters:['rookie'],equippedCharacter:'rookie',ownedTricks:['backflip','frontflip','sideflip','spin360']};
let save=loadSave();
function loadSave(){try{return {...defaultSave,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}}catch{return {...defaultSave}}}
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));}

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){webglError.classList.remove('hidden');throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)); renderer.shadowMap.enabled=true; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x111722); scene.fog=new THREE.Fog(0x111722,15,34);
const camera=new THREE.PerspectiveCamera(40,1,.1,100); camera.position.set(0,4.2,12.2); camera.lookAt(0,2.0,0);
scene.add(new THREE.HemisphereLight(0xbad0ff,0x20242c,2.2));
const key=new THREE.DirectionalLight(0xffffff,3.1); key.position.set(-4,9,6); key.castShadow=true; scene.add(key);
const rim=new THREE.DirectionalLight(0x7cf4cd,1.2); rim.position.set(5,5,-3); scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,11),new THREE.MeshStandardMaterial({color:0x272d36,roughness:.9})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const runway=new THREE.Mesh(new THREE.BoxGeometry(12,.08,2.8),new THREE.MeshStandardMaterial({color:0x48515c,roughness:.72})); runway.position.y=.04; runway.receiveShadow=true; scene.add(runway);
for(const x of [-5,0,5]){const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.015,2.7),new THREE.MeshBasicMaterial({color:0xc8d0da,transparent:true,opacity:.35}));m.position.set(x,.09,0);scene.add(m)}
const wall=new THREE.Mesh(new THREE.PlaneGeometry(24,10),new THREE.MeshStandardMaterial({color:0x171c26,roughness:1}));wall.position.set(0,4.7,-6);scene.add(wall);
const crowdGeo=new THREE.SphereGeometry(.11,8,6), crowdMats=[0x1f2530,0x2a303a,0x343a45,0x181d24].map(c=>new THREE.MeshStandardMaterial({color:c}));
for(let r=0;r<8;r++)for(let i=0;i<38;i++){const m=new THREE.Mesh(crowdGeo,crowdMats[(i+r)%crowdMats.length]);m.position.set(-9+i*.5+(r%2)*.15,1.45+r*.42,-5.15+r*.08);scene.add(m)}
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.8,36),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.095;shadow.scale.set(1.5,.7,1);scene.add(shadow);

const mat={skin:new THREE.MeshStandardMaterial({color:0xe1aa80,roughness:.78}),skinDark:new THREE.MeshStandardMaterial({color:0xc98561}),shirt:new THREE.MeshStandardMaterial({color:0xef5a59}),shirtDark:new THREE.MeshStandardMaterial({color:0xb93e47}),shorts:new THREE.MeshStandardMaterial({color:0x182a43}),shoe:new THREE.MeshStandardMaterial({color:0xf3f4f6}),sole:new THREE.MeshStandardMaterial({color:0x20242b}),hair:new THREE.MeshStandardMaterial({color:0x24180f}),white:new THREE.MeshStandardMaterial({color:0xffffff}),dark:new THREE.MeshStandardMaterial({color:0x11151d})};
const box=(w,h,d,m)=>{const x=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);x.castShadow=true;return x};
const cap=(r,l,m)=>{const x=new THREE.Mesh(new THREE.CapsuleGeometry(r,l,6,14),m);x.castShadow=true;return x};
const ball=(r,m)=>{const x=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),m);x.castShadow=true;return x};
const root=new THREE.Group(), rig=new THREE.Group(); root.add(rig); scene.add(root);
const torso=cap(.34,.62,mat.shirt);torso.scale.set(.94,1,1.18);torso.position.y=.62;rig.add(torso);
const chest=box(.055,.42,.5,mat.white);chest.position.set(.35,.7,0);rig.add(chest);
const back=box(.055,.28,.5,mat.dark);back.position.set(-.35,.7,0);rig.add(back);
const hips=box(.62,.34,.82,mat.shorts);hips.position.y=-.04;rig.add(hips);
const head=new THREE.Group();head.position.set(0,1.48,0);rig.add(head);const face=ball(.31,mat.skin);face.scale.set(.92,1.08,.94);head.add(face);const hair=ball(.305,mat.hair);hair.scale.y=.52;hair.position.y=.17;head.add(hair);const nose=new THREE.Mesh(new THREE.ConeGeometry(.055,.16,10),mat.skinDark);nose.rotation.z=-Math.PI/2;nose.position.x=.325;head.add(nose);const eye=ball(.024,mat.dark);eye.position.set(.26,.08,.18);head.add(eye);
function arm(side){const s=new THREE.Group();s.position.set(0,.97,.48*side);rig.add(s);const u=cap(.105,.46,mat.skin);u.position.y=-.34;s.add(u);const e=new THREE.Group();e.position.y=-.68;s.add(e);e.add(ball(.11,mat.skin));const l=cap(.09,.42,mat.skin);l.position.y=-.31;e.add(l);const h=ball(.11,mat.skin);h.position.y=-.62;e.add(h);return{s,e}}
function leg(side){const h=new THREE.Group();h.position.set(0,-.12,.24*side);rig.add(h);const t=cap(.15,.55,mat.shorts);t.position.y=-.4;h.add(t);const k=new THREE.Group();k.position.y=-.8;h.add(k);k.add(ball(.14,mat.skin));const sh=cap(.12,.5,mat.skin);sh.position.y=-.37;k.add(sh);const a=new THREE.Group();a.position.y=-.72;k.add(a);const f=box(.43,.16,.25,mat.shoe);f.position.set(.12,-.06,0);a.add(f);const so=box(.44,.05,.26,mat.sole);so.position.set(.12,-.14,0);a.add(so);return{h,k,a}}
const LA=arm(1),RA=arm(-1),LL=leg(1),RL=leg(-1); const ROOT_Y=1.72;
function resetPose(){for(const j of [LA.s,RA.s,LA.e,RA.e,LL.h,RL.h,LL.k,RL.k,LL.a,RL.a])j.rotation.set(0,0,0);rig.rotation.set(0,0,0);rig.position.set(0,0,0)}
function runPose(t){resetPose();const p=t*Math.PI*8,s=Math.sin(p),o=-s;LL.h.rotation.z=s*.72;RL.h.rotation.z=o*.72;LL.k.rotation.z=Math.max(0,-s)*1.1;RL.k.rotation.z=Math.max(0,-o)*1.1;LA.s.rotation.z=o*.7;RA.s.rotation.z=s*.7;LA.e.rotation.z=.3;RA.e.rotation.z=.3;rig.rotation.z=-.09;rig.position.y=Math.abs(Math.sin(p))*.035}
function crouchPose(v=1){resetPose();LL.h.rotation.z=RL.h.rotation.z=-.72*v;LL.k.rotation.z=RL.k.rotation.z=1.35*v;LA.s.rotation.z=RA.s.rotation.z=-1.7*v;rig.position.y=-.2*v}
function tuckPose(v=1){resetPose();LL.h.rotation.z=RL.h.rotation.z=-1.28*v;LL.k.rotation.z=RL.k.rotation.z=2.1*v;LA.s.rotation.z=RA.s.rotation.z=-1.1*v;LA.e.rotation.z=RA.e.rotation.z=1.15*v}
function layoutPose(){resetPose();LA.s.rotation.z=RA.s.rotation.z=-.55;LL.h.rotation.z=RL.h.rotation.z=-.15}
function sidePose(){resetPose();LA.s.rotation.x=-1.15;RA.s.rotation.x=1.15;LL.h.rotation.z=-.3;RL.h.rotation.z=.3}
function landingPose(v=1){crouchPose(.75*v)}

const characters=[
 {id:'rookie',name:'Rookie',price:0,shirt:0xef5a59,shorts:0x182a43,skin:0xe1aa80,hair:0x24180f,desc:'Default athlete.'},
 {id:'neon',name:'Neon',price:180,shirt:0x54f7c7,shorts:0x111827,skin:0xe1aa80,hair:0x111111,desc:'Bright competition kit.'},
 {id:'midnight',name:'Midnight',price:260,shirt:0x5865f2,shorts:0x090b10,skin:0xb97855,hair:0x0b0908,desc:'Dark arena setup.'},
 {id:'gold',name:'Gold Pro',price:420,shirt:0xf5c451,shorts:0x352610,skin:0xd59b74,hair:0x2b1a0e,desc:'For people who need everyone to know.'}
];
function applyCharacter(id){const c=characters.find(x=>x.id===id)||characters[0];mat.shirt.color.setHex(c.shirt);mat.shirtDark.color.setHex(c.shirt).multiplyScalar(.72);mat.shorts.color.setHex(c.shorts);mat.skin.color.setHex(c.skin);mat.skinDark.color.setHex(c.skin).multiplyScalar(.82);mat.hair.color.setHex(c.hair)}
applyCharacter(save.equippedCharacter);

const tricks=[
 {id:'backflip',name:'Backflip',difficulty:'Beginner',price:0,mode:'standing',axis:'back',turns:1,height:2.25,travel:.18,note:'Standing backflip: nearly vertical takeoff, backward rotation, almost no forward travel.'},
 {id:'frontflip',name:'Frontflip',difficulty:'Beginner',price:0,mode:'run',axis:'front',turns:1,height:2.05,travel:2.15,note:'Forward rotation while continuing to travel forward.'},
 {id:'sideflip',name:'Sideflip',difficulty:'Beginner',price:0,mode:'run',axis:'side',turns:1,height:2.05,travel:1.9,note:'Sideways barrel rotation around the travel axis.'},
 {id:'spin360',name:'360 Spin',difficulty:'Intermediate',price:0,mode:'run',axis:'spin',turns:1,height:1.75,travel:1.8,note:'Mostly upright, one full twist around the vertical axis.'},
 {id:'gainer',name:'Gainer',difficulty:'Intermediate',price:160,mode:'run',axis:'back',turns:1,height:2.2,travel:2.45,oneLeg:true,note:'Forward travel with a backward flip from a running one-leg takeoff.'},
 {id:'cork360',name:'Cork 360',difficulty:'Intermediate',price:220,mode:'run',axis:'cork',turns:1,height:2.3,travel:2.1,note:'Off-axis backward flip blended with a twist.'},
 {id:'doubleback',name:'Double Backflip',difficulty:'Advanced',price:320,mode:'standing',axis:'back',turns:2,height:2.85,travel:.22,note:'Two backward rotations with a vertical standing takeoff.'},
 {id:'doublefront',name:'Double Frontflip',difficulty:'Advanced',price:360,mode:'run',axis:'front',turns:2,height:2.7,travel:2.3,note:'Two forward rotations while traveling forward.'},
 {id:'cork720',name:'Cork 720',difficulty:'Expert',price:520,mode:'run',axis:'cork',turns:2,height:2.7,travel:2.25,note:'Off-axis flip with two twists worth of rotation.'}
];

let score=0,round=1,lives=3,combo=1,current=null,locked=false,anim=null;
function ownedTricks(){return tricks.filter(t=>save.ownedTricks.includes(t.id))}
function updateHud(){scoreEl.textContent=score;roundEl.textContent=round;livesEl.textContent=lives;comboEl.textContent='×'+combo;coinsEl.textContent=save.coins;shopCoinsEl.textContent=save.coins}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function optionsFor(t){return shuffle([t,...shuffle(tricks.filter(x=>x.id!==t.id)).slice(0,3)])}
function renderAnswers(){answersEl.innerHTML='';for(const opt of optionsFor(current)){const b=document.createElement('button');b.className='answer-btn';b.type='button';b.textContent=opt.name;b.addEventListener('click',()=>guess(opt,b));answersEl.appendChild(b)}}
function quatFor(trick,p){const angle=Math.PI*2*trick.turns*p;const q=new THREE.Quaternion();if(trick.axis==='front')q.setFromAxisAngle(new THREE.Vector3(0,0,1),-angle);else if(trick.axis==='back')q.setFromAxisAngle(new THREE.Vector3(0,0,1),angle);else if(trick.axis==='side')q.setFromAxisAngle(new THREE.Vector3(1,0,0),angle);else if(trick.axis==='spin')q.setFromAxisAngle(new THREE.Vector3(0,1,0),-angle);else{const tilt=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle*.72);const twist=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-angle);q.copy(twist).multiply(tilt)}return q}
function poseAir(trick,p){if(trick.axis==='spin'){layoutPose();return}if(trick.axis==='side'){sidePose();return}if(trick.axis==='cork'){layoutPose();return}const tight=Math.sin(Math.PI*p);tuckPose(.45+.55*tight)}
function runAnimation(trick,slow=false){if(anim)cancelAnimationFrame(anim);locked=false;const start=performance.now();const dur=(slow?2.45:1)*(trick.mode==='standing'?2500:2900);statusText.textContent=slow?'SLOW MOTION':'WATCH THE TRICK';
 const runPart=trick.mode==='run'?0.34:0.18,airEnd=.84,startX=trick.mode==='run'?-4.2:-.15,takeX=trick.mode==='run'?-1.15:0,landX=takeX+trick.travel;
 function frame(now){const t=Math.min(1,(now-start)/dur);root.quaternion.identity();
   if(t<runPart){const r=t/runPart;if(trick.mode==='run'){root.position.set(THREE.MathUtils.lerp(startX,takeX,r),ROOT_Y,0);runPose(r);if(r>.78){const c=(r-.78)/.22;crouchPose(c);}}else{root.position.set(0,ROOT_Y,0);crouchPose(Math.sin(r*Math.PI)*.9)}}
   else if(t<airEnd){const p=(t-runPart)/(airEnd-runPart);const x=THREE.MathUtils.lerp(takeX,landX,p);const y=ROOT_Y+4*trick.height*p*(1-p);root.position.set(x,y,0);root.quaternion.copy(quatFor(trick,p));poseAir(trick,p)}
   else{const l=(t-airEnd)/(1-airEnd);root.position.set(landX,ROOT_Y,0);root.quaternion.identity();landingPose(Math.max(0,1-l));}
   shadow.position.x=root.position.x;const h=Math.max(0,root.position.y-ROOT_Y);shadow.material.opacity=.28*Math.max(.25,1-h/4);shadow.scale.set(1.5+h*.12,.7+h*.05,1);renderer.render(scene,camera);
   if(t<1)anim=requestAnimationFrame(frame);else{statusText.textContent='MAKE YOUR CALL';anim=null}}
 anim=requestAnimationFrame(frame);
}
function newRound(){locked=false;const pool=ownedTricks();let next=pool[Math.floor(Math.random()*pool.length)];if(current&&pool.length>1){while(next.id===current.id)next=pool[Math.floor(Math.random()*pool.length)]}current=next;difficultyEl.textContent=current.difficulty;feedbackEl.textContent='Watch the takeoff, travel direction and rotation axis.';renderAnswers();runAnimation(current,false)}
function guess(opt,button){if(locked||lives<=0)return;locked=true;const buttons=[...answersEl.querySelectorAll('.answer-btn')];buttons.forEach(b=>b.disabled=true);const correct=opt.id===current.id;buttons.find(b=>b.textContent===current.name)?.classList.add('correct');if(correct){button.classList.add('correct');const pts=100*combo,earned=12+Math.min(18,(combo-1)*3);score+=pts;save.coins+=earned;combo=Math.min(8,combo+1);persist();feedbackEl.textContent=`Correct — +${pts} score, +${earned} coins. ${current.note}`;statusText.textContent='CORRECT'}else{button.classList.add('wrong');lives--;combo=1;score=Math.max(0,score-50);feedbackEl.textContent=`Wrong. That was ${current.name}. ${current.note}`;statusText.textContent='WRONG'}updateHud();if(lives<=0){restartBtn.classList.remove('hidden');feedbackEl.textContent+=` Game over — ${score} points.`;return}setTimeout(()=>{round++;updateHud();newRound()},1500)}
function restart(){score=0;round=1;lives=3;combo=1;restartBtn.classList.add('hidden');updateHud();newRound()}

function renderShop(){characterShop.innerHTML='';trickShop.innerHTML='';updateHud();for(const c of characters){const owned=save.ownedCharacters.includes(c.id),equipped=save.equippedCharacter===c.id;const el=document.createElement('div');el.className='shop-item '+(owned?'owned':'');el.innerHTML=`<div class="shop-swatch" style="background:#${c.shirt.toString(16).padStart(6,'0')}">●</div><div class="shop-copy"><strong>${c.name}</strong><small>${c.desc}</small><div class="shop-price"><span class="coin-dot"></span>${c.price}</div></div><div class="shop-action-wrap"><button class="shop-action ${owned?'':'buy'} ${equipped?'equipped':''}" type="button">${equipped?'Equipped':owned?'Equip':'Buy'}</button></div>`;const b=el.querySelector('button');b.addEventListener('click',()=>{if(equipped)return;if(owned){save.equippedCharacter=c.id;applyCharacter(c.id);persist();shopMessage.textContent=`Equipped ${c.name}.`;renderShop();return}if(save.coins<c.price){shopMessage.textContent='Not enough coins.';return}save.coins-=c.price;save.ownedCharacters.push(c.id);save.equippedCharacter=c.id;applyCharacter(c.id);persist();shopMessage.textContent=`Bought ${c.name}.`;renderShop()});characterShop.appendChild(el)}
 for(const t of tricks.filter(t=>t.price>0)){const owned=save.ownedTricks.includes(t.id);const el=document.createElement('div');el.className='shop-item '+(owned?'owned':'');el.innerHTML=`<div class="shop-swatch" style="background:#242c39;color:#fff">↻</div><div class="shop-copy"><strong>${t.name}</strong><small>${t.note}</small><div class="shop-price"><span class="coin-dot"></span>${t.price}</div></div><div class="shop-action-wrap"><button class="shop-action ${owned?'equipped':'buy'}" type="button" ${owned?'disabled':''}>${owned?'Owned':'Unlock'}</button></div>`;const b=el.querySelector('button');b.addEventListener('click',()=>{if(owned)return;if(save.coins<t.price){shopMessage.textContent='Not enough coins.';return}save.coins-=t.price;save.ownedTricks.push(t.id);persist();shopMessage.textContent=`Unlocked ${t.name}. It can now appear in rounds.`;renderShop()});trickShop.appendChild(el)}}

$('#shopBtn').addEventListener('click',()=>{renderShop();shopMessage.textContent='';shopDialog.showModal()});$('#closeShop').addEventListener('click',()=>shopDialog.close());shopDialog.addEventListener('click',e=>{if(e.target===shopDialog)shopDialog.close()});
const how=$('#howDialog');$('#howBtn').addEventListener('click',()=>how.showModal());$('#closeHow').addEventListener('click',()=>how.close());how.addEventListener('click',e=>{if(e.target===how)how.close()});
replayBtn.addEventListener('click',()=>runAnimation(current,false));slowBtn.addEventListener('click',()=>runAnimation(current,true));restartBtn.addEventListener('click',restart);
function resize(){const w=arena.clientWidth,h=arena.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera)}new ResizeObserver(resize).observe(arena);window.addEventListener('resize',resize);
updateHud();resize();newRound();