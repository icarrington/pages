"use strict";
// Dead Hold: red-dot optic on the gun, shooting, hit detection, aiming (ADS), recoil, reload
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ---- Red-dot optic attached to the WEAPON, in weapon-local coordinates. ----
   Previous code added the ADS camera-Z offset to an optic already parented to
   the gun (which itself moves during ADS). That shifted the optic away from the
   rail, and the render loop reset its location on every frame.
   This mount never moves relative to the gun; the eye/reticle are handled below. */
const SCOPE_MOUNT_Y = 0.194; // chosen so the optic's optical axis is screen-center at full ADS
const SCOPE_MOUNT_Z = 0.08;  // sits on the receiver/slide, NOT in camera space
const SCOPE_LENS_Z = -0.065; // reticle is projected inside the front of the tube
const SCOPE_CLEAR_RADIUS = 0.064;
const scopeGroup = new THREE.Group();
scopeGroup.position.set(0, SCOPE_MOUNT_Y, SCOPE_MOUNT_Z);
const scopeTubeMat = new THREE.MeshLambertMaterial({color:0x14191e, side:THREE.DoubleSide});
const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.081,0.081,0.22,24,1,true), scopeTubeMat);
scopeTube.rotation.x = Math.PI/2; // open tube axis runs down the barrel (-Z)
scopeGroup.add(scopeTube);
const scopeRimMat = new THREE.MeshLambertMaterial({color:0x343d45});
for(const z of [-0.11, 0.11]){
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.081,0.012,10,28), scopeRimMat);
  rim.position.z = z;
  scopeGroup.add(rim);
}
// A pair of machined mount pieces connects the sight to the top rail.
const scopeFoot = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.018,0.12), scopeRimMat);
scopeFoot.position.set(0,-0.105,0);
scopeGroup.add(scopeFoot);
const scopePost = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.057,0.060), scopeTubeMat);
scopePost.position.set(0,-0.072,0);
scopeGroup.add(scopePost);
// The glass remains transparent. Never use a fullscreen dark overlay.
const scopeGlass = new THREE.Mesh(new THREE.CircleGeometry(0.076,28),
  new THREE.MeshBasicMaterial({color:0x508a80, transparent:true, opacity:0.07,
    side:THREE.DoubleSide, depthWrite:false}));
scopeGlass.position.z = SCOPE_LENS_Z-0.004;
scopeGroup.add(scopeGlass);
// A radial glow texture makes the reticle readable without turning into a big red ball.
const scopeDotCanvas = document.createElement('canvas');
scopeDotCanvas.width = scopeDotCanvas.height = 64;
const scopeDotCtx = scopeDotCanvas.getContext('2d');
const scopeDotGradient = scopeDotCtx.createRadialGradient(32,32,0,32,32,32);
scopeDotGradient.addColorStop(0,'rgba(255,235,204,1)');
scopeDotGradient.addColorStop(0.10,'rgba(255,65,40,1)');
scopeDotGradient.addColorStop(0.25,'rgba(255,24,12,.65)');
scopeDotGradient.addColorStop(1,'rgba(255,15,5,0)');
scopeDotCtx.fillStyle = scopeDotGradient;
scopeDotCtx.fillRect(0,0,64,64);
const scopeDotTexture = new THREE.CanvasTexture(scopeDotCanvas);
const scopeDotMat = new THREE.SpriteMaterial({map:scopeDotTexture, color:0xffffff,
  transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false});
const scopeDot = new THREE.Sprite(scopeDotMat);
scopeDot.scale.set(0.032,0.032,1);
scopeDot.position.set(0,0,SCOPE_LENS_Z);
scopeDot.renderOrder = 999;
scopeDot.visible = false;
scopeGroup.add(scopeDot);
scopeGroup.visible = false;
gun.add(scopeGroup);
// Reused scratch vectors for projecting the CAMERA AIM RAY onto the actual lens.
const scopeRayOrigin = new THREE.Vector3();
const scopeRayEnd = new THREE.Vector3();

// Attach gun to camera as viewmodel
camera.add(gun);
gun.position.set(0.35, -0.3, -0.6);
gun.rotation.set(0.1, 0, 0);


/* ============================ WEAPON LOGIC ============================ */




function updateWeaponSlots(){
  const slotsEl = document.getElementById('slots');
  const names = {pistol:'Pistol',smg:'SMG',shotgun:'Shotgun',rifle:'Rifle',uzi:'Uzi',m4a1:'M4A1',awp:'AWP',deagle:'Deagle',minigun:'Minigun',doubleShotgun:'DB Shotgun',rpg:'RPG-7'};
  const list = weaponList();
  slotsEl.innerHTML = list.map((w,i)=>{
    const empty = (mags[w] <= 0 && reserves[w] <= 0);
    return '<div class="slot'+(w===activeWeapon?' active':'')+(empty?' empty':'')+'"><span class="num">'+(i+1)+'</span>'+(names[w]||w)+'</div>';
  }).join('');
  if(isTouch) buildTouchSlots();
}
let activeWeapon = 'pistol';
let lastShotTime = 0;
/* ---- Player loadout: starts with ONLY the pistol. Other weapons are picked up
   from zombie drops (see killZombie / weaponDrops). ---- */
const ownedWeapons = ['pistol'];
function isOwned(w){ return ownedWeapons.indexOf(w) >= 0; }
function spawnWeaponDrop(x,z,weapon){ /* loot drops removed - no-op */ }
function clearWeaponDrops(){ /* loot drops removed - no-op */ }
function addWeapon(w){
  const cap = (wbGet(w).extMag ? Math.ceil(MAGS[w]*1.3) : MAGS[w]) + getMagSizeBonus();
  if(ownedWeapons.indexOf(w) < 0){
    ownedWeapons.push(w);
    // Give full magazine and full reserve ammo for this weapon
    mags[w] = cap;
    reserves[w] = (w === 'pistol') ? 116 : (MAGS[w] * 10);
  } else {
    // Already owned: top off to full mag and full reserve
    mags[w] = cap;
    if(w === 'pistol') reserves[w] = Math.max(reserves[w], 116);
    else reserves[w] = Math.max(reserves[w], MAGS[w] * 10);
  }
}
function weaponList(){
  const list = ['pistol','smg','shotgun','rifle','uzi','m4a1','awp','deagle','minigun','rpg'];
  if(state.hasDoubleShotgun) list.push('doubleShotgun');
  return list.filter(w => isOwned(w) && (mags[w] > 0 || reserves[w] > 0));
}

// Ensure RPG is available from the start


function updateRedDot(){
  const el = document.getElementById('crosshair');
  const hud = document.getElementById('hud');
  if(wbGet(activeWeapon).redDot){ el.classList.add('rd'); hud.classList.add('rd-active'); }
  else { el.classList.remove('rd'); hud.classList.remove('rd-active'); }
}

/* ---- ADS (Aim Down Sights) state ---- */
const ADS_FOV = 60;
const ADS_SENS = 0.5;
const ADS_SPEED = 0.6;
let adsActive = false;
let adsBlend = 0;
const ADS_BLEND_SPEED = 1/0.12;
// Per-weapon ADS profiles. The default (hipPos/adsPos/adsRot) is tuned for the
// red-dot optic. Iron-sight weapons (rifle) need their own values so the FRONT
// POST lands exactly on screen-center when aiming down sights.
const ADS_PROFILES = {
  // NOTE: the M4A1 is registered under the weapon key 'rifle' (see isAuto/fireRate/MAGS/wnames),
  // so the M4's ADS profile MUST live here, not under 'm4a1'.
  // Tuned so the M4 front post (built at local y≈0.092, z≈-0.34) lands on the crosshair.
  // Rifle ADS position lowered by 15% (-0.16 * 1.15 = -0.184)
  rifle: { pos: new THREE.Vector3(0, -0.184, -0.90), rot: new THREE.Euler(0, 0, 0), fov: 58 },
  // AWP (sniper): scope view lowered by 10% from its current ADS position
  // (Y lowered by 10% of its offset from center: -0.1514205 * 1.10 = -0.16656255)
  // Now moved UP by 1%: -0.16656255 * 0.99 = -0.1648969245
  awp: { pos: new THREE.Vector3(0, -0.1648969245, -0.90), rot: new THREE.Euler(0, 0, 0), fov: 50 },
  // Deagle: lowered by 10% from default ADS Y position, then an additional 3%,
  // then an additional 1% on top of all previous adjustments.
  // (default adsPos.y = -0.234*0.7225 = -0.169065; lowered 10%: -0.169065 * 1.10 = -0.1859715;
  //  additional 3%: -0.1859715 * 1.03 = -0.191550645; additional 1%: -0.191550645 * 1.01 = -0.19346615145)
  deagle: { pos: new THREE.Vector3(0, -0.19346615145, -0.90), rot: new THREE.Euler(0, 0, 0), fov: 60 }
};
function adsProfileFor(w){ return ADS_PROFILES[w] || null; }

/* ---- Sprint state: Shift boosts speed, gun rotates to a side pose, shooting blocked ---- */
const SPRINT_MULT = 1.6;
const SPRINT_BLEND_SPEED = 1/0.15;
let sprintBlend = 0; // 0 = normal, 1 = full sprint (drives the gun Y rotation)
let sprintYaw = 0;   // Y-axis (yaw) rotation applied to the gun while sprinting
window._touchSprint = false; // set by DASH button on touch devices
function isSprinting(){
  if(window._touchSprint) return true;
  if(crouching) return false;
  return state.running && player.grounded && !!keys['shift'] && !adsActive && (moving || keys['shift']);
}

/* ---- Crouch (toggle with C / CROUCH button) ---- */
let crouching = false;
const EYE_STAND = EYE;
const EYE_CROUCH = EYE * 0.575; // ~57% of standing eye height
const CROUCH_SPEED_MULT = 0.5;
const CROUCH_BLEND_SPEED = 1/0.12;
let crouchBlend = 0; // 0 = standing, 1 = fully crouched
function setCrouch(on){
  if(on === crouching) return;
  crouching = on;
  if(crouching){
    // Crouching cancels any ADS / sprint so the low eye height is the only thing changing
    adsActive = false;
    if(window._touchSprint) window._touchSprint = false;
  }
  updateHUD();
}
function lerpCrouch(dt){
  const target = crouching ? 1 : 0;
  const step = CROUCH_BLEND_SPEED*dt;
  if(crouchBlend < target) crouchBlend = Math.min(target, crouchBlend+step);
  else if(crouchBlend > target) crouchBlend = Math.max(target, crouchBlend-step);
}
function currentEye(){ return EYE_STAND + (EYE_CROUCH - EYE_STAND)*crouchBlend; }
const hipPos = new THREE.Vector3(0.35,-0.42,-0.6);
let swayX = 0, swayY = 0, kickY = 0, kickZ = 0, dipY = 0, dipRot = 0;
let sprintBobX = 0, sprintBobY = 0, sprintLean = 0, sprintTilt = 0;
// ADS: push the weapon FARther back (-Z) and slightly down so it reads as
// smaller / farther away and more of the scene is visible around it.
const adsPos = new THREE.Vector3(0,-0.234*0.7225,-0.9);
const hipRot = new THREE.Euler(0.1,0,0);
const adsRot = new THREE.Euler(0,0,0);
const _tmpV = new THREE.Vector3();
const _tmpE = new THREE.Euler();
function lerpAds(dt){
  const target = adsActive ? 1 : 0;
  const step = ADS_BLEND_SPEED*dt;
  if(adsBlend < target) adsBlend = Math.min(target, adsBlend+step);
  else if(adsBlend > target) adsBlend = Math.max(target, adsBlend-step);
  const b = adsBlend;
  // Pick this weapon's ADS target (iron-sight weapons use their own profile so
  // the front post centers on the crosshair; red-dot weapons keep the default).
  const prof = adsProfileFor(activeWeapon);
  const aPos = prof ? prof.pos : adsPos;
  const aRot = prof ? prof.rot : adsRot;
  const aFov = prof ? prof.fov : ADS_FOV;
  camera.fov = 74 + (aFov-74)*b;
  camera.updateProjectionMatrix();
  _tmpV.copy(hipPos).lerp(aPos, b);
  // Extra ADS lift: shift the weapon UP by an additional 5% of the hip/ADS
  // vertical span, on top of all previous vertical adjustments. Scales with b
  // so it is 0 at hip and fully applied while aiming.
  const adsLift = (aPos.y - hipPos.y) * 0.05 * b;
  // Crouch: drop the weapon to match the lowered eye height
  const crouchDrop = -0.16 * crouchBlend;
  gun.position.set(_tmpV.x + swayX + sprintBobX, _tmpV.y + swayY + kickY + dipY + sprintBobY + adsLift + crouchDrop, _tmpV.z + kickZ);
  _tmpE.set(hipRot.x + (aRot.x-hipRot.x)*b, 0, 0);
  // Sprint pose: pure Y-axis (yaw) rotation so the barrel sweeps sideways.
  // No pitch, no roll — only yaw.
  // sprintTilt: pistol pitches UP (negative X lifts the muzzle toward the sky);
  // other weapons use sprintYaw (sideways sweep) instead.
  gun.rotation.set(_tmpE.x + (state.recoil>0 ? state.recoil*0.1 : 0) + dipRot - sprintTilt, sprintYaw, sprintLean);
  // With a red dot installed, the center of the optic becomes the reticle at ADS.
  // The standard green crosshair stays available while aiming from the hip.
  const wantScope = wbGet(activeWeapon).redDot;
  const hud = document.getElementById('hud');
  hud.classList.toggle('ads-active', wantScope && b > 0.88);
  scopeGroup.visible = wantScope;
  scopeDot.visible = false;
  // Show the screen-centered scope crosshair overlay when ADS is active with a red dot
  const scopeCrossEl = document.getElementById('scopeCrosshair');
  scopeCrossEl.classList.toggle('show', wantScope && b > 0.88);
  if(wantScope){
    // The camera fires hitscan straight through screen center. Intersect that
    // exact ray with the lens plane in SCOPE coordinates. This makes the dot
    // indicate the true point of aim while the housing can sway/recoil around it.
    // If the eye is no longer looking through the aperture, the dot disappears
    // instead of glowing through the metal tube or floating outside the sight.
    camera.updateMatrixWorld(true);
    scopeRayOrigin.set(0,0,0);
    camera.localToWorld(scopeRayOrigin);
    scopeGroup.worldToLocal(scopeRayOrigin);
    scopeRayEnd.set(0,0,-5);
    camera.localToWorld(scopeRayEnd);
    scopeGroup.worldToLocal(scopeRayEnd);
    const dx = scopeRayEnd.x - scopeRayOrigin.x;
    const dy = scopeRayEnd.y - scopeRayOrigin.y;
    const dz = scopeRayEnd.z - scopeRayOrigin.z;
    if(Math.abs(dz) > 1e-6){
      const t = (SCOPE_LENS_Z - scopeRayOrigin.z) / dz;
      const x = scopeRayOrigin.x + dx*t;
      const y = scopeRayOrigin.y + dy*t;
      if(b > 0.55 && t > 0 && t < 1 && x*x+y*y < SCOPE_CLEAR_RADIUS*SCOPE_CLEAR_RADIUS){
        scopeDot.position.set(x,y,SCOPE_LENS_Z);
        scopeDot.visible = true;
      }
    }
  }
}
function resetAds(){
  adsActive = false;
  adsBlend = 0;
  const prof = adsProfileFor(activeWeapon);
  camera.fov = prof ? prof.fov : ADS_FOV;
  camera.updateProjectionMatrix();
  const hud = document.getElementById('hud');
  hud.classList.remove('ads-active');
}

function shoot(){
  if(state.reloading) return;
  if(state.rpgReloading && activeWeapon === 'rpg') return; // RPG reloading: cannot fire
  if(isSprinting()) return; // sprinting: no bullets, no recoil
  const nowMs = performance.now();
  const interval = (isAuto() || activeWeapon === 'rpg') ? 1000/fireRate() : 300;
  if(nowMs - lastShotTime < interval) return;
  lastShotTime = nowMs;

  if(mags[activeWeapon] <= 0){
    if(reserves[activeWeapon] <= 0){
      // No reserve ammo left — weapon is unusable
      playEmpty();
      updateHUD();
      return;
    }
    playEmpty();
    startReload();
    updateHUD();
    return;
  }

  // RPG: fire a rocket projectile
  if(activeWeapon === 'rpg'){
    mags[activeWeapon]--;
    state.shotsFired++;
    state.recoil = 2.0; state.muzzleT = 0.1;
    playRPGShot();
    spawnRPGRocket();
    // Start reload animation: single-shot reload (2.5s) or full mag reload (4s)
    state.rpgReloading = true;
    state.rpgReloadT = 0;
    state.rpgReloadDur = (mags['rpg'] <= 0) ? 3 : 1;
    state.rpgFullReload = (mags['rpg'] <= 0);
    updateHUD();
    return;
  }

  if(state.hasDoubleShotgun && activeWeapon === 'doubleShotgun'){
    if(mags[activeWeapon] <= 0){
      if(reserves[activeWeapon] <= 0){
        playEmpty();
        updateHUD();
        return;
      }
      playEmpty();
      startReload();
      updateHUD();
      return;
    }
    mags[activeWeapon]--;
    state.shotsFired++;
    const _vg2 = wbGet('doubleShotgun').vGrip ? 0.86 : 1;
    state.recoil = 1.5 * _vg2; state.muzzleT = 0.08;
    playShot();
    // 10 pellets per barrel, 2 barrels = 20 pellets total.
    // Bullets PENETRATE everything: each pellet damages EVERY zombie in its path
    // (no wall/obstacle blocking). Only the world edge / max range stops them.
    const origin = new THREE.Vector3(0,0,0).applyMatrix4(camera.matrixWorld);
    const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    const targets = [];
    for(const z of zombies) if(z.alive){ targets.push(z.group); }
    if(state.boss && state.boss.alive) targets.push(state.boss.group);
    let anyHit = false;
    const vGripDmg = wbGet('doubleShotgun').vGrip ? 0.86 : 1;
    for(let p=0;p<20;p++){
      const spread = 0.04 * vGripDmg;
      const dx = (Math.random()-0.5)*spread;
      const dy = (Math.random()-0.5)*spread;
      const dz = (Math.random()-0.5)*spread;
      const d = new THREE.Vector3(dir.x+dx, dir.y+dy, dir.z+dz).normalize();
      // Penetrates all objects — only max range stops pellets
      const ray = new THREE.Raycaster(origin, d, 0.1, 9999);
      const hits = ray.intersectObjects(targets, true);
      for(const hit of hits){
        const z = findZombie(hit.object);
        if(z && z.alive){
          if(!anyHit) state.shotsHit++;
          anyHit = true;
          const isHead = (hit.object === z.head);
          showHitmarker(isHead);
          let dmg = (isHead ? 60 : 60) * getDamageMultiplier();
          if(z.boss) dmg = (isHead ? 60 : 30) * getDamageMultiplier();
          z.hp -= dmg;
          z.flash = 0.08;
          state.points += 10;
          playHit();
          if(z.hp<=0) killZombie(z, isHead);
        }
      }
    }
    if(state.boss && state.boss.alive) updateBossBar(true);
    updateHUD();
    return;
  }

  mags[activeWeapon]--;
  state.shotsFired++;
  const _vg = wbGet(activeWeapon).vGrip ? 0.86 : 1;
  state.recoil = 1 * _vg; state.muzzleT = 0.06;
  playShot();
  // hitscan — PENETRATES every object; damages EVERY zombie in the line.
  // No wall/obstacle blocking; only the world edge / max range stops the bullet.
  const origin = new THREE.Vector3(0,0,0).applyMatrix4(camera.matrixWorld);
  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  // Bullets PENETRATE all objects (walls, trees, rocks, props) — only world edge / max range stops them.
  // We only intersect against zombie/boss groups, never against scene geometry or colliders.
  const ray = new THREE.Raycaster(origin, dir, 0.1, 9999);
  const targets = [];
  for(const z of zombies) if(z.alive){ targets.push(z.group); }
  if(state.boss && state.boss.alive) targets.push(state.boss.group);
  const hits = ray.intersectObjects(targets, true);
  // Weapon-specific damage
  const dmgTable = {
    pistol: {body:15, head:30},
    smg: {body:12, head:24},
    shotgun: {body:20, head:40},
    rifle: {body:25, head:50},
    uzi: {body:8, head:16},
    m4a1: {body:20, head:40},
    awp: {body:100, head:200},
    deagle: {body:40, head:80},
    minigun: {body:6, head:12}
  };
  const dmgSpec = dmgTable[activeWeapon] || {body:15, head:30};
  for(const hit of hits){
    const z = findZombie(hit.object);
    if(z && z.alive){
      const isHead = (hit.object === z.head);
      let dmg = (isHead ? dmgSpec.head : dmgSpec.body) * getDamageMultiplier();
      if(isHead) dmg *= getHeadshotMultiplier();
      if(Math.random() < getCritChance()) dmg *= 2;
      z.hp -= dmg;
      z.flash = 0.08;
      showHitmarker(isHead);
      playHit();
      if(z.hp<=0) killZombie(z, isHead);
    }
  }
  if(state.boss && state.boss.alive) updateBossBar(true);
  updateHUD();
  return;
}


function _unusedShootTail(){
  for(const hit of hits){
    const z = findZombie(hit.object);
    if(z && z.alive){
      state.shotsHit++;
      const isHead = (hit.object === z.head);
      showHitmarker(isHead);
      let dmg = isHead ? dmgSpec.head : dmgSpec.body;
      if(z.boss) dmg = Math.ceil(dmg * 0.5);
      z.hp -= dmg;
      z.flash = 0.08;
      state.points += 10;
      playHit();
      if(z.hp<=0) killZombie(z, isHead);
    }
  }
  if(state.boss && state.boss.alive) updateBossBar(true);
  updateHUD();
}

function showHitmarker(isHead){
  const el = document.getElementById('hitmarker');
  el.classList.remove('show','headshot');
  void el.offsetWidth;
  if(isHead) el.classList.add('headshot');
  el.classList.add('show');
}

function findZombie(obj){
  let o = obj;
  while(o){
    for(const z of zombies){ if(z.group === o) return z; }
    if(state.boss && state.boss.group === o) return state.boss;
    o = o.parent;
  }
  return null;
}

// Ray vs AABB (slab method). Returns distance along ray or Infinity if no hit.
function rayHitAABB(origin, dir, minX, maxX, minZ, maxZ){
  let tMin = 0, tMax = 100;
  // X slab
  if(Math.abs(dir.x) < 1e-8){
    if(origin.x < minX || origin.x > maxX) return Infinity;
  } else {
    let t1 = (minX - origin.x) / dir.x;
    let t2 = (maxX - origin.x) / dir.x;
    if(t1 > t2){ const tmp=t1; t1=t2; t2=tmp; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if(tMin > tMax) return Infinity;
  }
  // Z slab
  if(Math.abs(dir.z) < 1e-8){
    if(origin.z < minZ || origin.z > maxZ) return Infinity;
  } else {
    let t1 = (minZ - origin.z) / dir.z;
    let t2 = (maxZ - origin.z) / dir.z;
    if(t1 > t2){ const tmp=t1; t1=t2; t2=tmp; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if(tMin > tMax) return Infinity;
  }
  return tMin;
}

// Check if a ray from origin along dir hits any collider before distance maxDist.
// Returns the hit distance or Infinity.
function rayHitWalls(origin, dir, maxDist){
  let best = Infinity;
  const ARENA = 60;
  for(const c of colliders){
    const t = rayHitAABB(origin, dir, c.minX, c.maxX, c.minZ, c.maxZ);
    if(t < best && t <= maxDist) best = t;
  }
  // Arena boundary walls
  let tN = rayHitAABB(origin, dir, -HALF-1, HALF+1, -HALF-0.5, -HALF+0.5);
  if(tN < best && tN <= maxDist) best = tN;
  let tS = rayHitAABB(origin, dir, -HALF-1, HALF+1, HALF-0.5, HALF+0.5);
  if(tS < best && tS <= maxDist) best = tS;
  let tW = rayHitAABB(origin, dir, -HALF-0.5, -HALF+0.5, -HALF-1, HALF+1);
  if(tW < best && tW <= maxDist) best = tW;
  let tE = rayHitAABB(origin, dir, ARENA-0.5, ARENA+0.5, -ARENA-1, ARENA+1);
  if(tE < best && tE <= maxDist) best = tE;
  return best;
}
