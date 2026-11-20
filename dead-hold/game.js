"use strict";
// Dead Hold: damage and regen, game flow (start, waves, game over), HUD
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ DAMAGE / REGEN ============================ */
function damagePlayer(amount){
  // GOD MODE: no damage from any source
  if(state.godMode){
    state.health = getMaxHealth();
    return;
  }
  // Spawn shield: brief invulnerability after taking a hit
  if(state.spawnShieldT > 0) return;
  // Apply defense reduction
  const reduction = getDefenseReduction();
  let finalDamage = amount * (1 - reduction);
  // Apply armor (flat reduction)
  finalDamage = Math.max(1, finalDamage - getArmorReduction());
  state.health -= finalDamage;
  state.lastHitTime = state.seconds;
  state.damageFlash = 1;
  // Activate spawn shield
  state.spawnShieldT = getSpawnShieldDuration();
  playHurt();
  if(state.health<=0){ state.health=0; endGame(); }
  updateHUD();
}

/* ============================ GAME FLOW ============================ */
function resetGame(){
  crouching = false;
  crouchBlend = 0;
  // clear zombies
  for(const z of zombies) scene.remove(z.group);
  zombies.length = 0;
  if(state.boss) scene.remove(state.boss.group);
  spawnQueue.length = 0;
  state.health=getMaxHealth(); state.stamina=getMaxStamina();
  state.wave=1; state.points=0; state.kills=0; state.headshots=0;
  state.shotsFired=0; state.shotsHit=0;
  state.seconds=0; state.lastHitTime=-99; state.lastKillTime=0;
  state.reloading=false; state.reloadT=0; state.reloadDur=1;
  state.recoil=0; state.muzzleT=0;
  state.groanTimer=0; state.damageFlash=0; state.waveGap=0;
  state.hasDoubleShotgun=false;
  window._touchSprint = false;
  state.boss=null; state.bossPending=false; state.bossWarnT=0; state.bossSpawnT=0;
  state.spawnShieldT=0;
  state.rpgReloading=false; state.rpgReloadT=0; state.rpgReloadDur=0; state.rpgFullReload=false;
  state.rocketJumpT=0;
  // Clean up fireball projectiles
  for(const p of lightningProjectiles){
    scene.remove(p);
  }
  lightningProjectiles.length = 0;
  clearWeaponDrops();
  // Reset boss lightning cooldown
  if(state.boss) state.boss.lightningCd = 3.0;
  
  // Reset to base state
  ownedWeapons.length = 0; ownedWeapons.push('pistol'); // start with pistol only
  Object.keys(MAGS).forEach(w=>{
    mags[w]=Math.floor(MAGS[w] + getMagSizeBonus());
    if(w === 'pistol') reserves[w] = Math.floor(116 + (getStartAmmoBonus() * MAGS[w]));
    else reserves[w]=Math.floor((MAGS[w]*10) + (getStartAmmoBonus() * MAGS[w])); // 10 full magazines + starting ammo bonus
  });
  
  // Clear any pending dev actions to prevent stacking on wave reset
  if(window._devActionQueue) window._devActionQueue.length = 0;
  
  player.pos.set(0,1.7,0); player.vel.set(0,0,0);
  player.yaw=0; player.pitch=0; player.bob=0;
  player.grounded=true;
  camera.position.set(0,1.7,0);
  resetAds();
  updateRedDot();
  state.over=false; state.running=true;
  activeWeapon='pistol';
  updateWeaponSlots();
  // 3-second countdown before Wave 1
  state.waveGap = 3.0;
  state.wave = 0; // Will be set to 1 when startWave is called
  showBanner('GET READY', false);
  updateHUD();
}
function startGame(){
  ensureAudio();
  resetGame();
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('overScreen').classList.add('hidden');
  canvas.requestPointerLock && canvas.requestPointerLock();
  // Mobile: kick off the render loop if it hasn't started yet
  if(!window._loopStarted){
    window._loopStarted = true;
    requestAnimationFrame(loop);
  }
}
function endGame(){
  state.running=false; state.over=true;
  resetAds();
  if(state.boss){ scene.remove(state.boss.group); state.boss=null; }
  if(document.pointerLockElement===canvas) document.exitPointerLock();
  const secs = Math.floor(state.seconds);
  const acc = state.shotsFired>0 ? Math.round(state.shotsHit/state.shotsFired*100) : 0;
  document.getElementById('oWave').textContent = state.wave;
  document.getElementById('oKills').textContent = state.kills;
  document.getElementById('oPoints').textContent = state.points;
  document.getElementById('oHead').textContent = state.headshots;
  document.getElementById('oTime').textContent = secs+'s';
  document.getElementById('oAcc').textContent = acc+'%';
  document.getElementById('bossBar').classList.add('hidden');
  document.getElementById('overScreen').classList.remove('hidden');
  // call botScore once
  if(window.botScore){
    try{ window.botScore({wave:state.wave, kills:state.kills, points:state.points, headshots:state.headshots, seconds:secs}); }catch(e){}
  }
}

/* ============================ HUD ============================ */
const hudCache = {};
function setNum(id,val){ if(hudCache[id]!==val){ hudCache[id]=val; document.getElementById(id).textContent=val; } }
function showToast(msg, dur){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>{ el.classList.remove('show'); }, dur || 2000);
}
function updateHUD(){
  const crouchEl = document.getElementById('crouchInd');
  if(crouchEl) crouchEl.classList.toggle('show', crouching);
  const h = Math.max(0,Math.round(state.health));
  const s = Math.max(0,Math.round(state.stamina));
  document.getElementById('healthFill').style.transform = 'scaleX('+(h/Math.max(1, getMaxHealth()))+')';
  document.getElementById('stamFill').style.transform = 'scaleX('+(s/100)+')';
  setNum('healthNum', h);
  setNum('wave', state.wave);
  setNum('points', state.points);
  setNum('kills', state.kills);
  setNum('headshots', state.headshots);
  setNum('zombiesLeft', zombies.filter(z=>z.alive).length + (state.boss && state.boss.alive ? 1 : 0));
  const mag = Math.floor(mags[activeWeapon]);
  const cap = Math.floor((wbGet(activeWeapon).extMag ? Math.ceil(MAGS[activeWeapon]*1.3) : MAGS[activeWeapon]) + getMagSizeBonus());
  setNum('mag', mag);
  // Force the reserve onto the DOM as a whole integer (bypass cache so it is always visible)
  const _resVal = Math.floor(Math.max(0, reserves[activeWeapon]));
  const _resEl = document.getElementById('reserve');
  if(_resEl && _resEl.textContent !== String(_resVal)) _resEl.textContent = _resVal;
  hudCache['reserve'] = _resVal;
  const ammoEl = document.getElementById('ammo');
  const wnames = {pistol:'Pistol',smg:'SMG',shotgun:'Shotgun',rifle:'Rifle',uzi:'Uzi',m4a1:'M4A1',awp:'AWP',deagle:'Deagle',minigun:'Minigun',doubleShotgun:'DB Shotgun',rpg:'RPG-7'};
  const wnameEl = document.getElementById('weaponName');
  const _wname = wnames[activeWeapon] || activeWeapon;
  if(wnameEl && wnameEl.textContent !== _wname) wnameEl.textContent = _wname;
  if(mag <= cap*0.25) ammoEl.classList.add('low'); else ammoEl.classList.remove('low');
  // Show empty state if no ammo at all
  if(mag <= 0 && reserves[activeWeapon] <= 0) ammoEl.classList.add('empty');
  else ammoEl.classList.remove('empty');
  
  // RPG reload indicator
  const rpgReloadEl = document.getElementById('rpgReload');
  if(rpgReloadEl){
    if(activeWeapon === 'rpg' && state.rpgReloading){
      rpgReloadEl.classList.add('show');
      const progress = Math.min(1, state.rpgReloadT / state.rpgReloadDur);
      rpgReloadEl.querySelector('.rpg-reload-fill').style.transform = `scaleX(${progress})`;
    } else {
      rpgReloadEl.classList.remove('show');
    }
  }
}
function updateHint(){
  const hint = document.getElementById('hint');
  if(state.running && !pointerLocked){ hint.classList.add('show'); }
  else hint.classList.remove('show');
}
