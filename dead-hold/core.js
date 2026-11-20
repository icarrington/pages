"use strict";
// Dead Hold: setup (renderer, scene, camera), game state, audio, input, collision
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ STUB ============================ */
if(!window.botScore){
  window.botScore = function(wave,kills,points,headshots,secondsSurvived){
    console.log("DEAD HOLD — wave:"+wave+" kills:"+kills+" points:"+points+" headshots:"+headshots+" time:"+secondsSurvived+"s");
  };
}

/* ============================ SETUP ============================ */
const canvas = document.getElementById('game');
canvas.style.touchAction = 'none';
const renderer = new THREE.WebGLRenderer({canvas, antialias:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.0));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a4a5e);
scene.fog = new THREE.Fog(0x3a4a5e, 5, 50);

const camera = new THREE.PerspectiveCamera(74, window.innerWidth/window.innerHeight, 0.1, 360);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.7, 0);


/* ============================ GAME STATE ============================ */
const MAXZ = 22;
const zombies = [];
const spawnQueue = [];
const doors = [
  {x:0, z:-45, angle:0},
  {x:0, z:45, angle:Math.PI},
  {x:-45, z:0, angle:Math.PI/2},
  {x:45, z:0, angle:-Math.PI/2}
];



const state = {
  running:false, over:false,
  health:100, stamina:100,
  wave:1, points:0, kills:0, headshots:0,
  hasDoubleShotgun:false,
  shotsFired:0, shotsHit:0,
  seconds:0,
  lastHitTime:-99,
  reloading:false, reloadT:0, reloadDur:1,
  recoil:0, muzzleT:0,
  groanTimer:0,
  damageFlash:0,
  waveGap:0,
  boss:null,
  bossWarnT:0,
  bossSpawnT:0,
  bossPending:false,
  spawnShieldT:0,
  rpgReloading:false, rpgReloadT:0, rpgReloadDur:0, rpgFullReload:false,
  rocketJumpT:0
};

/* finite magazine sizes; reserve is finite (10 full mags per weapon) */
const MAGS = { pistol:12, smg:30, shotgun:2, rifle:30, doubleShotgun:2, uzi:32, m4a1:30, awp:5, deagle:6, minigun:200, rpg:3 };
const RELOAD_TIME = { pistol:1.0, smg:1.4, shotgun:1.1, rifle:1.4, doubleShotgun:1.2, uzi:1.2, m4a1:1.5, awp:2.0, deagle:1.3, minigun:3.0, rpg:3.0 };
const mags = { pistol:12, smg:30, shotgun:2, rifle:30, doubleShotgun:2, uzi:32, m4a1:30, awp:5, deagle:6, minigun:200, rpg:3 };
const reserves = { pistol:120, smg:300, shotgun:20, rifle:300, doubleShotgun:20, uzi:320, m4a1:300, awp:50, deagle:60, minigun:2000, rpg:12 };
function refillMag(w){
  const cap = (wbGet(w).extMag ? Math.ceil(MAGS[w]*1.5) : MAGS[w]) + getMagSizeBonus();
  const need = cap - mags[w];
  const take = Math.min(need, reserves[w]);
  mags[w] += take;
  reserves[w] -= take;
}
function startReload(){
  const w = activeWeapon;
  const cap = wbGet(w).extMag ? Math.ceil(MAGS[w]*1.5) : MAGS[w];
  if(mags[w] >= cap) return;
  if(reserves[w] <= 0) return;
  state.reloading = true;
  state.reloadT = 0;
  state.reloadDur = RELOAD_TIME[w] * getReloadSpeedMultiplier();
  playReload();
}

const player = {
  pos:new THREE.Vector3(0,1.7,0),
  vel:new THREE.Vector3(0,0,0),
  yaw:0, pitch:0,
  radius:0.4,
  bob:0,
  grounded:true
};
const JUMP_V = 6.6;   // initial upward velocity (m/s)
const GRAVITY = 14;   // downward acceleration (m/s^2)
const EYE = 1.7;      // standing eye height

/* ============================ AUDIO ============================ */
let audioCtx = null;
function ensureAudio(){
  if(!audioCtx){
    try{ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ audioCtx=null; }
  }
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
}
function now(){ return audioCtx ? audioCtx.currentTime : 0; }

function playShot(){
  if(!audioCtx) return;
  const t = now();
  const _sup = (typeof wbGet==='function' && typeof activeWeapon!=='undefined' && wbGet(activeWeapon).suppressor) ? 0.4 : 1;
  // noise burst
  const dur=0.18;
  const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate*dur), audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<d.length;i++){ d[i] = (Math.random()*2-1)*Math.pow(1-i/d.length,2); }
  const src = audioCtx.createBufferSource(); src.buffer=buf;
  const filt = audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=1800*_sup;
  const g = audioCtx.createGain(); g.gain.setValueAtTime(0.5*_sup,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(filt).connect(g).connect(audioCtx.destination);
  src.start(t); src.stop(t+dur);
  // low thump
  const o = audioCtx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(40,t+0.12);
  const og = audioCtx.createGain(); og.gain.setValueAtTime(0.4*_sup,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.14);
  o.connect(og).connect(audioCtx.destination); o.start(t); o.stop(t+0.15);
}
function playHit(){
  if(!audioCtx) return;
  const t=now();
  const o=audioCtx.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(90,t+0.08);
  const g=audioCtx.createGain(); g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
  o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.11);
}
function playGroan(){
  if(!audioCtx) return;
  const t=now();
  const o=audioCtx.createOscillator(); o.type='sawtooth';
  o.frequency.setValueAtTime(70,t);
  o.frequency.linearRampToValueAtTime(55,t+0.5);
  o.frequency.linearRampToValueAtTime(80,t+0.9);
  const lfo=audioCtx.createOscillator(); lfo.frequency.value=6;
  const lfoG=audioCtx.createGain(); lfoG.gain.value=12;
  lfo.connect(lfoG).connect(o.frequency);
  const g=audioCtx.createGain(); g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime(0.18,t+0.15);
  g.gain.linearRampToValueAtTime(0.0001,t+1.0);
  const filt=audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=400;
  o.connect(filt).connect(g).connect(audioCtx.destination);
  o.start(t); lfo.start(t); o.stop(t+1.05); lfo.stop(t+1.05);
}
function playReload(){
  if(!audioCtx) return;
  const t=now();
  [0,0.18,0.4].forEach((off,i)=>{
    const o=audioCtx.createOscillator(); o.type='square';
    o.frequency.setValueAtTime(i===2?180:240,t+off);
    const g=audioCtx.createGain(); g.gain.setValueAtTime(0.12,t+off); g.gain.exponentialRampToValueAtTime(0.001,t+off+0.06);
    o.connect(g).connect(audioCtx.destination); o.start(t+off); o.stop(t+off+0.07);
  });
}
function playHurt(){
  if(!audioCtx) return;
  const t=now();
  const o=audioCtx.createOscillator(); o.type='sawtooth';
  o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(60,t+0.18);
  const g=audioCtx.createGain(); g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
  const filt=audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=900;
  o.connect(filt).connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.22);
}
function playEmpty(){
  if(!audioCtx) return;
  const t=now();
  const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(1400,t); o.frequency.exponentialRampToValueAtTime(700,t+0.05);
  const g=audioCtx.createGain(); g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.06);
  o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.07);
}
function playJump(){
  if(!audioCtx) return;
  const t=now();
  const o=audioCtx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(320,t+0.12);
  const g=audioCtx.createGain(); g.gain.setValueAtTime(0.16,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
  o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.18);
}
function playReload(){
  if(!audioCtx) return;
  const t=now();
  [0,0.18,0.4].forEach((off,i)=>{
    const o=audioCtx.createOscillator(); o.type='square';
    o.frequency.setValueAtTime(i===2?180:240,t+off);
    const g=audioCtx.createGain(); g.gain.setValueAtTime(0.12,t+off); g.gain.exponentialRampToValueAtTime(0.001,t+off+0.06);
    o.connect(g).connect(audioCtx.destination); o.start(t+off); o.stop(t+off+0.07);
  });
}

/* ============================ INPUT ============================ */
const keys = {};
let pointerLocked = false;
let mouseDown = false;
let moving = false;


/* ============================ COLLISION ============================ */
function resolveCollision(pos){
  const r = player.radius;
  // walls (arena boundary) — removed: player can walk freely to the edge
  // pos.x = Math.max(-60+r, Math.min(60-r, pos.x));
  // pos.z = Math.max(-60+r, Math.min(60-r, pos.z));
  // crates/pillars — two passes for corner robustness, height-aware
  const playerFeetY = player.pos.y - EYE; // feet relative to ground (0 when standing)
  for(let pass=0; pass<2; pass++){
    for(const c of colliders){
      // Skip collider if player's feet are above it (with 0.3 margin)
      if(playerFeetY > c.height) continue;
      if(pos.x > c.minX-r && pos.x < c.maxX+r && pos.z > c.minZ-r && pos.z < c.maxZ+r){
        const dxl = (pos.x) - (c.minX-r);
        const dxr = (c.maxX+r) - (pos.x);
        const dzl = (pos.z) - (c.minZ-r);
        const dzr = (c.maxZ+r) - (pos.z);
        const m = Math.min(dxl,dxr,dzl,dzr);
        if(m===dxl) pos.x = c.minX-r;
        else if(m===dxr) pos.x = c.maxX+r;
        else if(m===dzl) pos.z = c.minZ-r;
        else pos.z = c.maxZ+r;
      }
    }
  }
  return pos;
}
function zombieBlocked(x,z){
  const r=0.4;
  // boundary check removed: zombies can also reach the edge
  // if(x<-60+r||x>60-r||z<-60+r||z>60-r) return true;
  for(const c of colliders){
    if(x>c.minX-r && x<c.maxX+r && z>c.minZ-r && z<c.maxZ+r) return true;
  }
  return false;
}
