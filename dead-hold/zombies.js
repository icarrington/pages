"use strict";
// Dead Hold: zombie models, waves, spawning, death effects, zombie AI (updateZombies) and beacons
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ ZOMBIE FACTORY ============================ */
const geoBody = new THREE.BoxGeometry(0.6,0.9,0.6);
const geoHead = new THREE.BoxGeometry(0.3,0.3,0.3);
const geoArm  = new THREE.BoxGeometry(0.14,0.7,0.14);
const geoLeg  = new THREE.BoxGeometry(0.18,0.7,0.18);
const geoEye  = new THREE.BoxGeometry(0.06,0.06,0.06);

const zBodyMat = new THREE.MeshLambertMaterial({color:0x4a5a3a});
const zHeadMat = new THREE.MeshLambertMaterial({color:0x5a6a48});
const zArmMat  = new THREE.MeshLambertMaterial({color:0x42523a});
const zEyeMat  = new THREE.MeshLambertMaterial({color:0x330000, emissive:0xff2a1e, emissiveIntensity:2.2});

function makeZombie(){
  const g = new THREE.Group();
  const bodyMat = zBodyMat;
  const headMat = zHeadMat;
  const armMat  = zArmMat;
  const eyeMat  = zEyeMat;

  const body = new THREE.Mesh(geoBody, bodyMat); body.position.y=0.45; body.castShadow=true; g.add(body);
  const head = new THREE.Mesh(geoHead, headMat); head.position.y=1.05; head.castShadow=true; g.add(head);
  const e1 = new THREE.Mesh(geoEye, eyeMat); e1.position.set(-0.08,1.08,0.16); g.add(e1);
  const e2 = new THREE.Mesh(geoEye, eyeMat); e2.position.set(0.08,1.08,0.16); g.add(e2);
  const aL = new THREE.Mesh(geoArm, armMat); aL.position.set(-0.4,0.6,0.1); aL.rotation.x=-0.5; g.add(aL);
  const aR = new THREE.Mesh(geoArm, armMat); aR.position.set(0.4,0.6,0.1); aR.rotation.x=-0.5; g.add(aR);
  const lL = new THREE.Mesh(geoLeg, armMat); lL.position.set(-0.16,0.35,0); g.add(lL);
  const lR = new THREE.Mesh(geoLeg, armMat); lR.position.set(0.16,0.35,0); g.add(lR);
  return {group:g, body, head, aL, aR, lL, lR, bodyMat, headMat, armMat, eyeMat};
}


function killZombie(z, isHead){
  z.alive = false;
  z.dying = true; z.deathT = 0;
  state.kills++;
  const pointMult = getPointMultiplier() * getDamageMultiplier();
  state.points += Math.floor(60 * pointMult);
  if(isHead){ state.headshots++; state.points += Math.floor(100 * pointMult * getHeadshotMultiplier()); }
  state.lastKillTime = state.seconds; // reset the 2-minute no-kill beacon timer
  if(z.boss){
    state.points += 500 + 25*(state.wave/5);
    spawnParticleBurst(z.group.position, true);
    playThud();
  } else {
    spawnParticleBurst(z.group.position);
    playHit();
  
  }
  updateHUD();
}

/* ============================ WAVES ============================ */
function startWave(n){
  state.wave = n;
  const count = 5 + n * 3;
  const speed = (2.4 + n * 0.30) * getZombieSlowMultiplier() * 0.82; // Slightly slower (18% reduction)
  const playerX = player.pos.x;
  const playerZ = player.pos.z;
  for(let i=0;i<count;i++){
    // Spawn at random position 15-30 units from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 15;
    let x = playerX + Math.cos(angle) * dist;
    let z = playerZ + Math.sin(angle) * dist;
    // Clamp to arena bounds (±60)
    x = Math.max(-58, Math.min(58, x));
    z = Math.max(-58, Math.min(58, z));
    spawnQueue.push({
      x, z,
      speed: speed * (0.9 + Math.random() * 0.25),
      hp: 100
    });
  }
  showBanner('WAVE ' + n);
  if(n % 5 === 0){
    state.bossPending = true;
    state.bossWarnT = 2.0;
    state.bossSpawnT = 1.0;
    showBanner('⚠ BOSS INCOMING', true);
  }
  updateHUD();
}
function showBanner(text, boss){
  const el = document.getElementById('waveBanner');
  el.textContent = text;
  el.classList.toggle('boss', !!boss);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

/* ============================ SPAWN / UPDATE ZOMBIES ============================ */
function spawnZombie(data){
  if(zombies.length >= 20) return;
  const z = makeZombie();
  z.group.position.set(data.x, terrainHeight(data.x, data.z), data.z);
  z.speed = data.speed;
  z.hp = data.hp;
  z.alive = true; z.dying = false; z.deathT = 0;
  z.flash = 0;
  z.attackCd = 0;
  z.bobPhase = Math.random()*Math.PI*2;
  // Obstacle-avoidance / stuck-detection state
  z.lastX = data.x; z.lastZ = data.z;
  z.movedDist = 0;
  z.stuckTimer = 0;
  z.detourTimer = 0;
  z.detourDir = Math.random() < 0.5 ? 1 : -1;
  z.speedVar = 0.85 + Math.random()*0.5; // per-zombie speed variance (0.85-1.35)
  // Initialize anti-stuck tracking
  z.lastMoveTime = state.seconds;
  z.lastPos = {x: data.x, z: data.z};
  // Face the player immediately so they start moving toward the player
  const dx = player.pos.x - data.x;
  const dz = player.pos.z - data.z;
  z.group.rotation.y = Math.atan2(dx, dz);
  scene.add(z.group);
  zombies.push(z);
}
function removeZombie(z){
  const idx = zombies.indexOf(z);
  if(idx>=0) zombies.splice(idx,1);
  scene.remove(z.group);
}


/* ---- death particle burst (pooled) ---- */
const P_MAX = 40;
const pGeo = new THREE.BoxGeometry(0.08,0.08,0.08);
const pMat = new THREE.MeshBasicMaterial({color:0x6b8a4a});
const pMatRed = new THREE.MeshBasicMaterial({color:0xff3b2f});
const particles = [];
// Beacon pool (created lazily in the loop, declared here for closure)
let _beaconPool = null, _beaconCylGeo = null, _beaconCylMat = null, _beaconSpriteMat = null, _beaconLightMat = null;
for(let i=0;i<P_MAX;i++){
  const m = new THREE.Mesh(pGeo, pMat);
  m.visible = false; scene.add(m);
  particles.push({m, vel:new THREE.Vector3(), life:0});
}
function spawnParticleBurst(pos, red){
  let n = 0;
  for(const p of particles){
    if(p.life>0) continue;
    p.m.visible = true;
    p.m.material = red ? pMatRed : pMat;
    p.m.position.copy(pos); p.m.position.y += 0.8;
    p.vel.set((Math.random()-0.5)*4, Math.random()*4+1, (Math.random()-0.5)*4);
    p.life = 0.5 + Math.random()*0.3;
    if(++n>=10) break;
  }
}
function updateParticles(dt){
  for(const p of particles){
    if(p.life<=0) continue;
    p.life -= dt;
    if(p.life<=0){ p.m.visible=false; continue; }
    p.vel.y -= 9*dt;
    p.m.position.addScaledVector(p.vel, dt);
    if(p.m.position.y<0.04) p.m.position.y=0.04;
  }
}


/* ============================ ZOMBIE AI ============================ */
// Called every frame from loop() in main.js: movement, pathing, anti-stuck, attacks, death animation.
function updateZombies(dt){
  const toRemove = [];
  for(let zi = zombies.length - 1; zi >= 0; zi--){
    const z = zombies[zi];
    if(z.dying){
      z.deathT += dt;
      const p = Math.min(1, z.deathT/0.6);
      z.group.rotation.x = p*Math.PI/2;
      z.group.position.y = terrainHeight(z.group.position.x, z.group.position.z) - p*0.4;
      if(p>=1) toRemove.push(z);
      continue;
    }
    if(!z.alive) continue;
    
    // Flash effect
    if(z.flash>0){
      z.flash -= dt;
      const f = Math.max(0, z.flash/0.08);
      z.bodyMat.emissive.setRGB(f, f*0.2, f*0.1);
      z.headMat.emissive.setRGB(f, f*0.2, f*0.1);
    } else {
      z.bodyMat.emissive.setRGB(0,0,0);
      z.headMat.emissive.setRGB(0,0,0);
    }
    
    // Calculate direction to player (real-time tracking every frame)
    const dx = player.pos.x - z.group.position.x;
    const dz = player.pos.z - z.group.position.z;
    const dist = Math.hypot(dx,dz);
    
    // Face the player
    z.group.rotation.y = Math.atan2(dx,dz);
    
    if(dist > 0.9){
      // Moderate speed: faster than walking, slower than sprint
      const speed = (z.speed || 3.0) * (z.speedVar || 1.0);
      const step = speed * dt;
      
      // Unit direction toward player
      const ux = dx/dist, uz = dz/dist;
      
      // Perpendicular direction (left of facing)
      const px = -uz, pz = ux;
      
      // Initialize anti-stuck state if not present
      if(!z._detourTimer) z._detourTimer = 0;
      if(!z._detourDir) z._detourDir = 1;
      if(!z._moveTrack) z._moveTrack = {t: state.seconds, x: z.group.position.x, z: z.group.position.z, dist: 0};
      
      // Determine movement direction
      let dirX = ux, dirZ = uz;
      
      // If in detour mode, steer 0.35 toward player + 0.9 perpendicular (signed by detourDir)
      if(z._detourTimer > 0){
        z._detourTimer -= dt;
        dirX = ux * 0.35 + px * z._detourDir * 0.9;
        dirZ = uz * 0.35 + pz * z._detourDir * 0.9;
        const dl = Math.hypot(dirX, dirZ) || 1;
        dirX /= dl; dirZ /= dl;
      }
      
      // Attempt movement with collision sliding
      const nx = z.group.position.x + dirX * step;
      const nz = z.group.position.z + dirZ * step;
      
      let moved = false;
      if(!zombieBlocked(nx, nz)){
        z.group.position.x = nx;
        z.group.position.z = nz;
        moved = true;
      } else {
        // 4-way fallback: pure perp, opposite perp, x-only, z-only
        const candidates = [
          [z.group.position.x + px * step, z.group.position.z + pz * step],
          [z.group.position.x - px * step, z.group.position.z - pz * step],
          [z.group.position.x + dirX * step, z.group.position.z],
          [z.group.position.x, z.group.position.z + dirZ * step]
        ];
        for(let ci = 0; ci < candidates.length; ci++){
          if(!zombieBlocked(candidates[ci][0], candidates[ci][1])){
            z.group.position.x = candidates[ci][0];
            z.group.position.z = candidates[ci][1];
            moved = true;
            break;
          }
        }
      }
      
      // Update movement tracking
      const actualDist = Math.hypot(z.group.position.x - z._moveTrack.x, z.group.position.z - z._moveTrack.z);
      z._moveTrack.dist += actualDist;
      z._moveTrack.x = z.group.position.x;
      z._moveTrack.z = z.group.position.z;
      
      // Anti-stuck: every 0.5s, if movedDist < 0.12 (barely moved), trigger detour
      const elapsed = state.seconds - z._moveTrack.t;
      if(elapsed >= 0.5){
        if(z._moveTrack.dist < 0.12){
          z._detourTimer = 1.0;
          z._detourDir = Math.random() < 0.5 ? 1 : -1;
        }
        z._moveTrack.t = state.seconds;
        z._moveTrack.dist = 0;
      }
      
      // Hard clamp inside arena
      const _B = 59.4;
      if(z.group.position.x < -_B) z.group.position.x = -_B;
      else if(z.group.position.x > _B) z.group.position.x = _B;
      if(z.group.position.z < -_B) z.group.position.z = -_B;
      else if(z.group.position.z > _B) z.group.position.z = _B;
      
      // Update zombie Y position to follow terrain
      z.group.position.y = terrainHeight(z.group.position.x, z.group.position.z);
      
      // Bob animation (relative to terrain height)
      z.bobPhase += dt*6;
      z.group.position.y = terrainHeight(z.group.position.x, z.group.position.z) + Math.abs(Math.sin(z.bobPhase))*0.06;
      z.aL.rotation.x = -0.5 + Math.sin(z.bobPhase)*0.2;
      z.aR.rotation.x = -0.5 - Math.sin(z.bobPhase)*0.2;
    } else {
      // Attack
      z.attackCd -= dt;
      z.aL.rotation.x = -1.2;
      z.aR.rotation.x = -1.2;
      if(z.attackCd<=0){
        z.attackCd = 0.6 + Math.random()*0.3;
        damagePlayer(12 + Math.floor(Math.random()*10));
      }
    }
  }
  for(const z of toRemove) removeZombie(z);



}

/* ============================ ZOMBIE BEACONS ============================ */
// Called every frame from loop(): tall beams over the last few zombies so they're easy to find.
function updateZombieBeacons(dt){
    const _aliveList = zombies.filter(z => z.alive);
    const _aliveCount = _aliveList.length + (state.boss && state.boss.alive ? 1 : 0);
    const _noKillBeacon = state.seconds - state.lastKillTime >= 120;
    // Beacons only on a small subset: show when fewer than 3 remain, or on the
    // no-kill timer — but cap the number of beacons to at most 2 so that on a
    // large wave (e.g. wave 6) not every zombie gets a beacon.
    // Beacons only show when fewer than 3 zombies remain (to help locate the last few)
    // Do NOT show beacons based on the no-kill timer — that was causing all zombies
    // to get beacons on large waves like wave 6.
    const _showBeacons = (_aliveCount > 0 && _aliveCount < 3);
    const _maxBeacons = 2;
    // Ensure beacon pool exists (created once)
    if(!_beaconPool) {
      _beaconPool = [];
      _beaconCylGeo = new THREE.CylinderGeometry(0.35, 0.35, 8, 16, 1, true);
      _beaconCylMat = new THREE.MeshBasicMaterial({color:0xff4422, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide});
      _beaconSpriteMat = new THREE.SpriteMaterial({color:0xff2200, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false});
      _beaconLightMat = new THREE.PointLight(0xff3311, 3, 12, 2);
      for(let bi=0; bi<20; bi++){
        const grp = new THREE.Group();
        const cyl = new THREE.Mesh(_beaconCylGeo, _beaconCylMat);
        cyl.position.y = 4;
        grp.add(cyl);
        const spr = new THREE.Sprite(_beaconSpriteMat);
        spr.position.y = 8.2;
        spr.scale.set(1.2, 1.2, 1);
        grp.add(spr);
        const lt = new THREE.PointLight(0xff3311, 3, 12, 2);
        lt.position.y = 5;
        grp.add(lt);
        grp.visible = false;
        scene.add(grp);
        _beaconPool.push(grp);
      }
    }
    // Assign beacons to alive zombies (capped at _maxBeacons)
    const _beaconCount = _showBeacons ? Math.min(_aliveCount, _maxBeacons) : 0;
    for(let bi=0; bi<_beaconPool.length; bi++){
      const b = _beaconPool[bi];
      if(bi < _beaconCount){
        const target = (bi < _aliveList.length) ? _aliveList[bi] : state.boss;
        if(target){
          b.visible = true;
          b.position.set(target.group.position.x, 0, target.group.position.z);
        } else {
          b.visible = false;
        }
      } else {
        b.visible = false;
      }
    }
}
