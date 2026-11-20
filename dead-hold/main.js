"use strict";
// Dead Hold: the main loop, resize, buttons, start-up
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ MAIN LOOP ============================ */
let lastT = performance.now();
let fpsFrames = 0, fpsAccum = 0, fpsLow = 0;
function adaptQuality(fps){
  if(fps < 30 && fpsLow < 1){
    fpsLow = 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.0));
    // Reduce fog density by 20%
    if(scene.fog) scene.fog.density *= 0.8;
    // Drop one more light if any remain
    if(flickerLights.length > 1){
      const last = flickerLights.pop();
      scene.remove(last.light);
    }
  }
}
let fpsFrameCount = 0, fpsTimeAccum = 0;
function loop(){
  requestAnimationFrame(loop);
  const nowMs = performance.now();
  let dt = (nowMs - lastT)/1000;
  lastT = nowMs;
  if(dt>0.05) dt=0.05;
  if(document.hidden){ lastT = nowMs; renderer.render(scene, camera); return; }
  // Mobile: ensure canvas stays in sync with viewport (orientation change, safe-area, etc.)
  if(isTouch){
    const w = window.innerWidth, h = window.innerHeight;
    if(canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())){
      onResize();
    }
  }

  // adaptive quality sampling
  fpsAccum += dt; fpsFrames++;
  fpsFrameCount++;
  fpsTimeAccum += dt;
  if(fpsFrameCount >= 60){
    const avgFrame = fpsTimeAccum / fpsFrameCount;
    fpsFrameCount = 0; fpsTimeAccum = 0;
    if(avgFrame > 0.033) adaptQuality(1000/avgFrame);
  }

  // flicker lights always
  for(const f of flickerLights){
    f.next -= dt;
    if(f.next<=0){ f.next = 0.05+Math.random()*0.2; f.phase = Math.random(); }
    const flick = 0.7 + 0.3*Math.sin(nowMs*0.008 + f.phase*10) + (Math.random()-0.5)*0.25;
    f.light.intensity = f.base * Math.max(0.3, flick);
  }

  if(!state.running){
    // still render
    renderer.render(scene, camera);
    return;
  }

  /* ---- weapon viewmodel swap ---- */
  const model = weaponModels[activeWeapon] || weaponModels.pistol;
  if(gun.children.length){
    for(let i=gun.children.length-1;i>=0;i--){
      if(gun.children[i] !== flash && gun.children[i] !== flashLight && gun.children[i] !== scopeGroup) gun.remove(gun.children[i]);
    }
  }
  gun.add(model);
  // Optic remains rigidly mounted in gun-local coordinates. ADS only moves gun.
  // The scope is kept as a child through weapon swaps (never reposition it here).
  // The 3D scope housing is only shown when a red dot is installed; the
  // screen-centered reticle (all weapons) is handled in lerpAds().
  scopeGroup.visible = wbGet(activeWeapon).redDot;

  state.seconds += dt;

  /* ---- boss warning / spawn ---- */
  if(state.bossPending){
    state.bossWarnT -= dt;
    if(state.bossWarnT <= 0){
      state.bossSpawnT -= dt;
      if(state.bossSpawnT <= 0){
        state.bossPending = false;
        spawnBoss(state.wave);
      }
    }
  }

  /* ---- reload ---- */
  if(state.reloading){
    state.reloadT += dt;
    if(state.reloadT >= state.reloadDur){
      state.reloading = false;
      refillMag(activeWeapon);
      updateHUD();
      // If we still have no ammo and no reserves, try to switch to another weapon
      if(mags[activeWeapon] <= 0 && reserves[activeWeapon] <= 0){
        const list = weaponList();
        if(list.length > 0 && list[0] !== activeWeapon){
          switchWeapon(list[0]);
        }
      }
    }
  }
  
  /* ---- Rocket jump timer ---- */
  if(state.rocketJumpT > 0){
    state.rocketJumpT = Math.max(0, state.rocketJumpT - dt);
  }

  /* ---- RPG reload animation ---- */
  if(state.rpgReloading){
    state.rpgReloadT += dt;
    const rpgProgress = Math.min(1, state.rpgReloadT / state.rpgReloadDur);
    
    // Visual animation: tube slides back and new rocket is inserted
    // Two types: single-shot reload (2.5s) vs full mag reload (4s)
    const rpgModel = weaponModels['rpg'];
    if(rpgModel){
      // Find the rocket and tip (children of the RPG group)
      // The rocket is at index 0 (body), tip at index 1
      const rocketBody = rpgModel.children[0];
      const rocketTip = rpgModel.children[1];
      if(rocketBody && rocketTip){
        if(state.rpgFullReload){
          // Full reload: tube fully retracts, then new mag inserted
          // Phase 1 (0-0.5): tube slides back
          // Phase 2 (0.5-1.0): new rocket inserted
          if(rpgProgress < 0.5){
            const t = rpgProgress / 0.5;
            const slideBack = Math.sin(t * Math.PI * 0.5) * 0.3;
            rocketBody.position.z = -0.12 + slideBack;
            rocketTip.position.z = -0.25 + slideBack;
          } else {
            const t = (rpgProgress - 0.5) / 0.5;
            const slideIn = Math.sin(t * Math.PI * 0.5) * 0.3;
            rocketBody.position.z = -0.12 - slideIn + 0.3;
            rocketTip.position.z = -0.25 - slideIn + 0.3;
          }
        } else {
          // Single-shot reload: tube slides back slightly, new rocket inserted
          const slideOut = Math.sin(rpgProgress * Math.PI) * 0.15;
          rocketBody.position.z = -0.12 + slideOut;
          rocketTip.position.z = -0.25 + slideOut;
        }
      }
    }
    
    if(state.rpgReloadT >= state.rpgReloadDur){
      state.rpgReloading = false;
      state.rpgReloadT = 0;
      state.rpgFullReload = false;
      // Refill RPG magazine
      if(mags['rpg'] === 0 && reserves['rpg'] > 0){
        mags['rpg'] = 3;
        reserves['rpg'] = Math.floor(Math.max(0, reserves['rpg'] - 3));
      }
      // Reset rocket position
      const rpgModel = weaponModels['rpg'];
      if(rpgModel){
        const rocketBody = rpgModel.children[0];
        const rocketTip = rpgModel.children[1];
        if(rocketBody) rocketBody.position.z = -0.12;
        if(rocketTip) rocketTip.position.z = -0.25;
      }
      updateHUD();
    }
  }

  /* ---- gamepad: poll + edge-triggered actions ---- */
  pollGamepad(dt);

  /* ---- auto fire (SMG / Rifle) ---- */
  if((mouseDown || (isTouch && fireHeld) || gpFire) && isAuto() && !state.reloading && mags[activeWeapon]>0 && !isSprinting()){
    shoot();
  }

  /* ---- spawn queue ---- */
  if(spawnQueue.length>0 && zombies.length<20){
    const data = spawnQueue.shift();
    spawnZombie(data);
  }

  /* ---- sprint blend (drives gun side-pose + speed boost) ---- */
  {
    const wantSprint = (isSprinting() || window._touchSprint) ? 1 : 0;
    const sStep = SPRINT_BLEND_SPEED*dt;
    if(sprintBlend < wantSprint) sprintBlend = Math.min(wantSprint, sprintBlend+sStep);
    else if(sprintBlend > wantSprint) sprintBlend = Math.max(wantSprint, sprintBlend-sStep);
  }

  /* ---- wave gap countdown ---- */
  if(state.waveGap > 0){
    state.waveGap -= dt;
    if(state.waveGap <= 0){
      startWave(state.wave + 1);
    }
  }

  /* ---- gamepad: apply movement + look (combines with keyboard) ---- */
  applyGamepad(dt);

  /* ---- movement ---- */
  const _q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,player.yaw,0));
  const forward = new THREE.Vector3(0,0,-1).applyQuaternion(_q);
  const right = new THREE.Vector3(1,0,0).applyQuaternion(_q);
  const move = new THREE.Vector3();
  if(keys['w']) move.add(forward);
  if(keys['s']) move.sub(forward);
  if(keys['d']) move.add(right);
  if(keys['a']) move.sub(right);
  // Gamepad left stick movement (analog)
  // X: positive = right, negative = left (strafe). Y: positive = up/forward, negative = down/backward.
  if(keys['gpX'] || keys['gpY']){
    move.add(right.clone().multiplyScalar(keys['gpX'] || 0));
    move.add(forward.clone().multiplyScalar(keys['gpY'] || 0));
  }
  // Mobile joystick input
  if(isTouch && (joyVec.x !== 0 || joyVec.y !== 0)){
    const jf = new THREE.Vector3(0,0,-1).applyQuaternion(_q);
    const jr = new THREE.Vector3(1,0,0).applyQuaternion(_q);
    move.add(jf.multiplyScalar(-joyVec.y)).add(jr.multiplyScalar(joyVec.x));
  }
  moving = move.lengthSq()>0;
  if(moving) move.normalize();

  // Base walk speed; sprint (Shift) boosts it and drains stamina.
  let speed = 4.2 * getSpeedMultiplier();
  if(adsActive) speed *= ADS_SPEED;
  if(isSprinting()) speed *= SPRINT_MULT;
  if(crouchBlend > 0.01) speed *= (1 - CROUCH_SPEED_MULT * crouchBlend);
  // Sprint drains stamina; when exhausted, sprint stops
  if(isSprinting() && state.stamina > 0){
    state.stamina = Math.max(0, state.stamina - 25 * dt);
    updateHUD();
  } else if(!isSprinting() && state.stamina < 100){
    state.stamina = Math.min(100, state.stamina + 15 * dt);
    updateHUD();
  }

  const targetVel = move.multiplyScalar(speed);
  // Air control: BOOSTED acceleration ONLY during rocket jump state (3s after RPG explosion)
  // Outside of rocket jump: minimal air control (normal jumping/falling)
  if(!player.grounded){
    if(state.rocketJumpT > 0){
      // ROCKET JUMP ACTIVE: strong directional air acceleration (jetpack feel)
      const JETPACK_THRUST = 8.0;
      if(moving){
        // Apply thrust in the direction the player is facing (WASD input)
        player.vel.x += targetVel.x * JETPACK_THRUST * dt;
        player.vel.z += targetVel.z * JETPACK_THRUST * dt;
      }
      // Air drag: slight resistance so speed doesn't go infinite (0.3x per second)
      const AIR_DRAG = 0.3;
      player.vel.x *= Math.max(0, 1 - AIR_DRAG * dt);
      player.vel.z *= Math.max(0, 1 - AIR_DRAG * dt);
      // No hard speed cap — drag naturally limits terminal velocity
    } else {
      // NORMAL AIR CONTROL: minimal acceleration, just slight drift (no jetpack)
      const AIR_CONTROL = 1.5;
      if(moving){
        player.vel.x += targetVel.x * AIR_CONTROL * dt;
        player.vel.z += targetVel.z * AIR_CONTROL * dt;
      }
      // Light air drag
      const AIR_DRAG = 0.1;
      player.vel.x *= Math.max(0, 1 - AIR_DRAG * dt);
      player.vel.z *= Math.max(0, 1 - AIR_DRAG * dt);
    }
  } else {
    player.vel.lerp(targetVel, 1 - Math.pow(0.001, dt));
  }
  const newPos = player.pos.clone().add(player.vel.clone().multiplyScalar(dt));
  resolveCollision(newPos);
  player.pos.copy(newPos);

  // jump: gravity pulls the player back down to the terrain surface
  const groundY = terrainHeight(player.pos.x, player.pos.z);
  if(!player.grounded){
    player.vel.y -= GRAVITY*dt;
    player.pos.y += player.vel.y*dt;
    if(player.pos.y <= groundY + EYE){
      player.pos.y = groundY + EYE;
      player.vel.y = 0;
      player.grounded = true;
    }
  } else {
    player.pos.y = groundY + EYE;
  }

  // head bob (subtle vertical bob only while moving)
  if(moving && player.grounded){ player.bob += dt * 9; }
  const bobY = Math.sin(player.bob)*0.03*(moving && player.grounded ? 1 : 0);
  camera.position.set(player.pos.x, player.pos.y + bobY, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0);

  /* ---- recoil / muzzle ---- */
  if(state.recoil>0){ state.recoil = Math.max(0, state.recoil - dt*8); }
  
  // Lateral gun sway: while moving the weapon rocks SIDEWAYS (left-right)
  // rhythmically, like a weapon inspect animation. No forward/back bobbing —
  // only lateral sway. Amplitude eases in/out with movement.
  {
    const swayTarget = (moving && player.grounded) ? 1 : 0;
    const swayBlend = 1 - Math.pow(0.001, dt); // smooth lerp factor
    swayX = Math.sin(state.seconds * 10) * 0.05 * swayTarget; // left-right rock
    swayY = 0; // no vertical bob
  }

  // Sprint pose: ALL weapons rotate HORIZONTALLY around the Y axis (yaw) so the
  // barrel sweeps sideways across the screen, like the gun is turned to face
  // left/right across the body. No pitch (up-tilt), no roll — only yaw.
  // Eases in/out with sprintBlend so it returns smoothly to forward-facing.
  // Sprint pose per weapon:
  //  - RIFLE / SMG / SHOTGUN: yaw around Y (barrel sweeps sideways across the body).
  //  - PISTOL: no yaw — instead it tilts UP (barrel faces the sky).
  const _sprintIsPistol = (activeWeapon === 'pistol' || activeWeapon === 'deagle');
  sprintLean = 0;   // no Z roll
  sprintTilt = _sprintIsPistol ? -sprintBlend * 1.15 : 0; // pistol: pitch up (barrel toward sky); others: none
  sprintYaw = _sprintIsPistol ? 0 : sprintBlend * 1.15;  // others: yaw sideways; pistol: none
  sprintBobX = 0; sprintBobY = 0;

  // Recoil: kick back (z +0.05) and up (y +0.03)
  kickZ = state.recoil * 0.05;
  kickY = state.recoil * 0.03;

  // Reload dip (weapon lowers and tilts down, then returns)
  dipY = 0; dipRot = 0;
  if(state.reloading){
    const p = Math.min(1, state.reloadT / state.reloadDur);
    const dip = Math.sin(p * Math.PI);
    dipY = -0.22 * dip;
    dipRot = 0.55 * dip;
  }

  // Apply sway, recoil and ADS transition (lerps FOV + viewmodel)
  lerpAds(dt);

  // Muzzle flash
  if(state.muzzleT>0){
    state.muzzleT -= dt;
    const f = Math.max(0, state.muzzleT/0.05);
    const _sup = wbGet(activeWeapon).suppressor ? 0.45 : 1;
    flash.visible = true;
    flashMat.opacity = f * _sup;
    flashLight.intensity = 12*f * _sup;
    flash.scale.setScalar((0.8+Math.random()*0.6) * _sup);
    flashSprite.visible = true;
    flashSpriteMat.opacity = f * _sup;
    flashSprite.scale.setScalar((0.25 + Math.random()*0.15) * _sup);
  } else {
    flash.visible=false; flashMat.opacity=0; flashLight.intensity=0;
    flashSprite.visible=false; flashSpriteMat.opacity=0;
  }

  /* ---- health regen ---- */
  if(state.seconds - state.lastHitTime > 4 && state.health<getMaxHealth()){
    state.health = Math.min(getMaxHealth(), state.health + getRegenRate()*dt);
    updateHUD();
  }

  /* ---- damage flash ---- */
  if(state.damageFlash>0){
    state.damageFlash = Math.max(0, state.damageFlash - dt*2.2);
    document.getElementById('vignette').style.opacity = state.damageFlash;
  }

  /* ---- chalk fade ---- */
  if(typeof updateChalkFade==='function') updateChalkFade(dt);

  /* ---- workbench proximity prompt ---- */
  if(state.running && !wbMenuOpen) wbUpdateNear();
  if(isTouch) updateTouchSlots();

  /* ---- zombies: see updateZombies() in zombies.js ---- */
  updateZombies(dt);

  /* ---- RPG rockets & explosions ---- */
  updateRPGRockets(dt);

  /* ---- death particles ---- */
  updateParticles(dt);

  /* ---- groans ---- */
  state.groanTimer -= dt;
  if(state.groanTimer<=0){
    state.groanTimer = 2 + Math.random()*3;
    const alive = zombies.filter(z=>z.alive);
    if(alive.length){
      const z = alive[Math.floor(Math.random()*alive.length)];
      const d = z.group.position.distanceTo(camera.position);
      if(d<18) playGroan();
    }
  }

  /* ---- boss ---- */
  updateBoss(dt);

  /* ---- lightning projectiles ---- */
  updateLightningProjectiles(dt);

  updateZombieBeacons(dt);   // zombies.js

  /* ---- wave complete ---- */
  if(zombies.length===0 && spawnQueue.length===0 && !state.boss){
    if(state.waveGap<=0){
      state.waveGap = 15;
    } else {
      state.waveGap -= dt;
      if(state.waveGap<=0) startWave(state.wave+1);
    }
  }

  /* ---- wave countdown display ---- */
  const cdEl = document.getElementById('waveCountdown');
  const cdNumEl = document.getElementById('cdNum');
  if(state.waveGap > 0 && zombies.length===0 && spawnQueue.length===0 && !state.boss && state.wave > 0){
    cdEl.classList.add('show');
    const cdVal = Math.ceil(state.waveGap);
    if(cdNumEl.textContent !== String(cdVal)) cdNumEl.textContent = cdVal;
  } else {
    cdEl.classList.remove('show');
  }

  /* ---- Update RPG rockets ---- */
  updateRPGRockets(dt);

  renderer.render(scene, camera);
}

/* ============================ RESIZE ============================ */
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================ BUTTONS ============================ */
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

/* ============================ INIT ============================ */
updateHUD();
updateHint();
// Start the render loop once (it used to be started twice, which drew every frame twice)
if(!window._loopStarted){
  window._loopStarted = true;
  requestAnimationFrame(loop);
}
