"use strict";
// Dead Hold: RPG rockets, explosions and rocket jumping
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ RPG ROCKET SYSTEM ============================ */
const rpgRockets = [];
const rpgRocketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 10);
const rpgRocketMat = new THREE.MeshLambertMaterial({color: 0x8899aa, emissive: 0x223344, emissiveIntensity: 0.3});
const rpgRocketTipGeo = new THREE.ConeGeometry(0.06, 0.15, 10);
const rpgRocketTipMat = new THREE.MeshLambertMaterial({color: 0xaabbcc});
const rpgExhaustGeo = new THREE.SphereGeometry(0.08, 8, 8);
const rpgExhaustMat = new THREE.MeshBasicMaterial({color: 0xffaa33, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false});
const rpgExplosionGeo = new THREE.SphereGeometry(1, 16, 16);
const rpgExplosionMat = new THREE.MeshBasicMaterial({color: 0xffcc44, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false});
const rpgExplosionGlowGeo = new THREE.SphereGeometry(1.5, 16, 16);
const rpgExplosionGlowMat = new THREE.MeshBasicMaterial({color: 0xff6611, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false});

function spawnRPGRocket(){
  const origin = new THREE.Vector3(0, 0, 0).applyMatrix4(camera.matrixWorld);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

  const rocket = new THREE.Group();
  const body = new THREE.Mesh(rpgRocketGeo, rpgRocketMat);
  body.rotation.x = Math.PI / 2;
  rocket.add(body);
  const tip = new THREE.Mesh(rpgRocketTipGeo, rpgRocketTipMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = -0.25;
  rocket.add(tip);
  const exhaust = new THREE.Mesh(rpgExhaustGeo, rpgExhaustMat);
  exhaust.position.z = 0.25;
  rocket.add(exhaust);

  rocket.position.copy(origin).addScaledVector(dir, 0.5);
  scene.add(rocket);

  rpgRockets.push({
    group: rocket,
    pos: rocket.position.clone(),
    vel: dir.clone().multiplyScalar(25),
    alive: true,
    age: 0,
    firedByPlayer: true
  });
}

function playRPGShot(){
  ensureAudio();
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  // Whoosh: filtered noise burst
  const bufLen = audioCtx.sampleRate * 0.4;
  const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for(let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(800, t);
  filt.frequency.exponentialRampToValueAtTime(200, t + 0.4);
  filt.Q.value = 2;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
  src.start(t); src.stop(t + 0.4);
}

function playRPGExplosion(){
  ensureAudio();
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  // Low boom
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(t); osc.stop(t + 0.8);
  // Noise crack
  const bufLen = audioCtx.sampleRate * 0.3;
  const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for(let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 600;
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.4, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  src.connect(filt); filt.connect(gain2); gain2.connect(audioCtx.destination);
  src.start(t); src.stop(t + 0.3);
}

function rpgExplode(pos, firedByPlayer, rocketVel){
  playRPGExplosion();
  // Screen shake
  state.recoil = Math.max(state.recoil, 3.0);
  // Explosion visual
  const exp = new THREE.Mesh(rpgExplosionGeo, rpgExplosionMat.clone());
  exp.position.copy(pos);
  scene.add(exp);
  const glow = new THREE.Mesh(rpgExplosionGlowGeo, rpgExplosionGlowMat.clone());
  glow.position.copy(pos);
  scene.add(glow);
  const light = new THREE.PointLight(0xffaa33, 3, 12);
  light.position.copy(pos);
  scene.add(light);
  const expObj = {mesh: exp, glow, light, age: 0, maxAge: 0.5};
  rpgExplosions.push(expObj);

  // Area damage to zombies
  const RADIUS = 10;
  const BASE_DMG = 150;
  for(const z of zombies){
    if(!z.alive) continue;
    const dz = z.group.position.clone().sub(pos);
    const dist = dz.length();
    if(dist < RADIUS){
      const falloff = 1 - (dist / RADIUS) * 0.5; // 1.0 at center, 0.5 at edge
      const dmg = BASE_DMG * falloff * getDamageMultiplier();
      z.hp -= dmg;
      z.flash = 0.15;
      showHitmarker(false);
      playHit();
      if(z.hp <= 0) killZombie(z, false);
    }
  }
  // Boss damage
  if(state.boss && state.boss.alive){
    const db = state.boss.group.position.clone().sub(pos);
    const dist = db.length();
    if(dist < RADIUS){
      const falloff = 1 - (dist / RADIUS) * 0.5;
      const dmg = BASE_DMG * falloff * getDamageMultiplier();
      state.boss.hp -= dmg;
      state.boss.flash = 0.15;
      updateBossBar(true);
      if(state.boss.hp <= 0) killZombie(state.boss, false);
    }
  }

  // Player self-damage and knockback (rocket-jump friendly)
  if(firedByPlayer){
    const playerPos = player.pos;
    const toPlayer = playerPos.clone().sub(pos);
    const distToPlayer = toPlayer.length();
    if(distToPlayer < RADIUS && distToPlayer > 0.01){
      const falloff = 1 - (distToPlayer / RADIUS) * 0.5;
      // Self-damage: 40% of normal
      const selfDmg = BASE_DMG * falloff * 0.4;
      damagePlayer(selfDmg);

      // Knockback: impulse follows rocket trajectory direction
      const dirToPlayer = toPlayer.clone().normalize();
      
      // Use rocket velocity direction for main impulse (if provided)
      let impulseDir;
      if(rocketVel && rocketVel.lengthSq() > 0.001){
        impulseDir = rocketVel.clone().normalize();
      } else {
        // Fallback: straight up if no valid rocket direction
        impulseDir = new THREE.Vector3(0, 1, 0);
      }
      
      // Main impulse: directional boost along rocket trajectory (reduced ~50% for weaker recoil)
      const mainImpulse = 18.0 * 0.75 * 1.5 * 0.5 * falloff;
      player.vel.addScaledVector(impulseDir, mainImpulse);
      player.grounded = false;
      // Set rocket jump state (3 seconds of enhanced air control)
      state.rocketJumpT = 3.0;

      // Radial component: reduced to 15% of main impulse, push away from blast center (trajectory dominates)
      const radialImpulse = mainImpulse * 0.15;
      const radialDir = new THREE.Vector3(dirToPlayer.x, 0, dirToPlayer.z).normalize();
      player.vel.x += radialDir.x * radialImpulse;
      player.vel.z += radialDir.z * radialImpulse;
    }
  }
}

const rpgExplosions = [];

function updateRPGRockets(dt){
  // Update rockets
  for(let i = rpgRockets.length - 1; i >= 0; i--){
    const r = rpgRockets[i];
    if(!r.alive) continue;
    r.age += dt;
    r.pos.addScaledVector(r.vel, dt);
    r.group.position.copy(r.pos);

    // Check collision with zombies
    let hit = false;
    for(const z of zombies){
      if(!z.alive) continue;
      const d = r.pos.distanceTo(z.group.position);
      if(d < 0.8){
        rpgExplode(r.pos.clone(), r.firedByPlayer, r.vel);
        hit = true;
        break;
      }
    }
    // Check collision with boss
    if(!hit && state.boss && state.boss.alive){
      const d = r.pos.distanceTo(state.boss.group.position);
      if(d < 1.2){
        rpgExplode(r.pos.clone(), r.firedByPlayer);
        hit = true;
      }
    }
    // Check ground / world bounds
    if(!hit){
      if(r.pos.y < 0.1 || Math.abs(r.pos.x) > 50 || Math.abs(r.pos.z) > 50 || r.age > 5){
        rpgExplode(r.pos.clone(), r.firedByPlayer);
        hit = true;
      }
    }
    if(hit){
      scene.remove(r.group);
      rpgRockets.splice(i, 1);
    }
  }
  // Update explosions
  for(let i = rpgExplosions.length - 1; i >= 0; i--){
    const e = rpgExplosions[i];
    e.age += dt;
    const t = e.age / e.maxAge;
    if(t >= 1){
      scene.remove(e.mesh);
      scene.remove(e.glow);
      scene.remove(e.light);
      e.mesh.geometry.dispose();
      e.mesh.material.dispose();
      e.glow.geometry.dispose();
      e.glow.material.dispose();
      rpgExplosions.splice(i, 1);
      continue;
    }
    const scale = 1 + t * 3;
    e.mesh.scale.setScalar(scale);
    e.glow.scale.setScalar(scale * 1.2);
    e.mesh.material.opacity = 0.9 * (1 - t);
    e.glow.material.opacity = 0.5 * (1 - t);
    e.light.intensity = 3 * (1 - t);
  }
}
