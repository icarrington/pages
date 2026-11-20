"use strict";
// Dead Hold: the boss: model, spawn/removal, health bar, fireballs, boss AI (updateBoss)
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ BOSS ============================ */
const bGeoBody = new THREE.BoxGeometry(1.1,1.5,1.0);
const bGeoHead = new THREE.BoxGeometry(0.5,0.5,0.5);
const bGeoArm  = new THREE.BoxGeometry(0.28,1.2,0.28);
const bGeoLeg  = new THREE.BoxGeometry(0.34,1.1,0.34);
const bGeoEye  = new THREE.BoxGeometry(0.11,0.11,0.11);
const bGeoJag  = new THREE.BoxGeometry(0.2,0.2,0.2);

const bBodyMat = new THREE.MeshLambertMaterial({color:0x2a1a1a});
const bHeadMat = new THREE.MeshLambertMaterial({color:0x332020});
const bArmMat  = new THREE.MeshLambertMaterial({color:0x241a1a});
const bEyeMat  = new THREE.MeshLambertMaterial({color:0x220000, emissive:0xff2a1e, emissiveIntensity:3.0});
const bOutlineMat = new THREE.MeshBasicMaterial({color:0xff2a1e, transparent:true, opacity:0.15, side:THREE.BackSide, depthWrite:false});

function makeBoss(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(bGeoBody, bBodyMat); body.position.y=0.75; body.castShadow=true; g.add(body);
  const head = new THREE.Mesh(bGeoHead, bHeadMat); head.position.y=1.75; head.castShadow=true; g.add(head);
  const e1 = new THREE.Mesh(bGeoEye, bEyeMat); e1.position.set(-0.13,1.8,0.26); g.add(e1);
  const e2 = new THREE.Mesh(bGeoEye, bEyeMat); e2.position.set(0.13,1.8,0.26); g.add(e2);
  // normal left arm
  const aL = new THREE.Mesh(bGeoArm, bArmMat); aL.position.set(-0.7,1.0,0.15); aL.rotation.x=-0.4; g.add(aL);
  // massive jagged right arm
  const aR = new THREE.Mesh(bGeoArm, bArmMat); aR.position.set(0.7,1.0,0.15); aR.rotation.x=-0.4; g.add(aR);
  for(let i=0;i<4;i++){
    const jag = new THREE.Mesh(bGeoJag, bArmMat);
    jag.position.set(0.7, 1.3 - i*0.28, 0.15 + i*0.05);
    jag.rotation.set(0.3, 0, 0.4); g.add(jag);
  }
  const lL = new THREE.Mesh(bGeoLeg, bArmMat); lL.position.set(-0.3,0.55,0); g.add(lL);
  const lR = new THREE.Mesh(bGeoLeg, bArmMat); lR.position.set(0.3,0.55,0); g.add(lR);
  // translucent red pulsing outline shell
  const outline = new THREE.Mesh(bGeoBody, bOutlineMat); outline.position.y=0.75; outline.scale.setScalar(1.12); g.add(outline);
  return {group:g, body, head, aL, aR, lL, lR, bodyMat:bBodyMat, headMat:bHeadMat, armMat:bArmMat, eyeMat:bEyeMat, outline, outlineMat:bOutlineMat};
}


/* ---- boss spawn / removal ---- */
function spawnBoss(wave){
  const b = makeBoss();
  const hp = Math.round((150 + 100*(wave/5)) * 12.0); // Doubled from 6.0x to 12.0x for much tankier boss
  b.group.position.set(0, terrainHeight(0, -40), -40);
  b.hp = hp; b.maxHp = hp;
  b.alive = true; b.dying = false; b.deathT = 0;
  b.flash = 0; b.attackCd = 0; b.windup = 0; b.bobPhase = 0;
  b.speed = 0.7 * 1.25;
  b.lightningCd = 3.0; // Initial cooldown for lightning attack
  scene.add(b.group);
  state.boss = b;
  updateBossBar(true);
}
function removeBoss(){
  const b = state.boss;
  if(!b) return;
  scene.remove(b.group);
  state.boss = null;
  updateBossBar(false);
}
function updateBossBar(show){
  const bar = document.getElementById('bossBar');
  if(!show){ bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const b = state.boss;
  if(!b) return;
  const p = Math.max(0, b.hp / b.maxHp);
  document.getElementById('bossFill').style.transform = 'scaleX(' + p + ')';
  setNum('bossNum', Math.max(0, Math.round(b.hp)));
}


/* ---- Fireball projectile system (boss) ---- */
const lightningProjectiles = [];
const fireballCoreGeo = new THREE.SphereGeometry(0.16, 20, 20);
const fireballCoreMat = new THREE.MeshBasicMaterial({color: 0xfff2d0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false});
const fireballGlowGeo = new THREE.SphereGeometry(0.30, 20, 20);
const fireballGlowMat = new THREE.MeshBasicMaterial({color: 0xff5a1e, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false});
const fireballLightMat = new THREE.PointLight(0xff7a2a, 14.0, 12, 2);
const flameTex = (function(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32,32,2,32,32,32);
  grad.addColorStop(0,'rgba(255,240,200,1)');
  grad.addColorStop(0.35,'rgba(255,150,40,0.9)');
  grad.addColorStop(0.7,'rgba(255,70,20,0.4)');
  grad.addColorStop(1,'rgba(255,40,10,0)');
  g.fillStyle = grad; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
})();
const smokeTex = (function(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32,32,2,32,32,32);
  grad.addColorStop(0,'rgba(90,80,70,0.55)');
  grad.addColorStop(0.6,'rgba(60,55,50,0.3)');
  grad.addColorStop(1,'rgba(40,38,35,0)');
  g.fillStyle = grad; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
})();
const flameSpriteMat = new THREE.SpriteMaterial({map: flameTex, color: 0xffb050, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false});
const smokeSpriteMat = new THREE.SpriteMaterial({map: smokeTex, color: 0x665a50, transparent: true, opacity: 0.5, depthWrite: false, depthTest: false});
const flameSpriteGeo = new THREE.SphereGeometry(0.12, 8, 8);
const flameSpriteMat2 = new THREE.MeshBasicMaterial({color: 0xffa030, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false});
const smokeSpriteGeo = new THREE.SphereGeometry(0.14, 8, 8);
const smokeSpriteMat2 = new THREE.MeshBasicMaterial({color: 0x554a40, transparent: true, opacity: 0.4, depthWrite: false});

function spawnLightningProjectile(fromPos, toPos){
  // Fireball: bright core + orange glow + point light + flame/smoke particle trail
  const proj = new THREE.Group();

  const core = new THREE.Mesh(fireballCoreGeo, fireballCoreMat);
  proj.add(core);
  const glow = new THREE.Mesh(fireballGlowGeo, fireballGlowMat);
  proj.add(glow);
  const light = new THREE.PointLight(0xff7a2a, 14.0, 12, 2);
  proj.add(light);

  // Pre-allocate a small particle pool (flames + smoke) reused every frame
  const trail = [];
  for(let i=0;i<10;i++){
    const m = new THREE.Mesh(flameSpriteGeo, flameSpriteMat2);
    m.visible = false; proj.add(m);
    trail.push({m, life: 0, vel: new THREE.Vector3(), isFlame: true, size: 0.8 + Math.random()*0.6});
  }
  for(let i=0;i<8;i++){
    const m = new THREE.Mesh(smokeSpriteGeo, smokeSpriteMat2);
    m.visible = false; proj.add(m);
    trail.push({m, life: 0, vel: new THREE.Vector3(), isFlame: false, size: 0.9 + Math.random()*0.8});
  }

  proj.position.copy(fromPos);
  proj.position.y += 1.0; // Start at boss height

  // Faster than the old lightning bolt (~1.5-2x) but still dodgeable
  const dir = new THREE.Vector3().subVectors(toPos, fromPos).normalize();
  const speed = 15.0;

  proj.userData = {
    vel: dir.multiplyScalar(speed),
    life: 5.0,
    damage: 25,
    trail: trail,
    spawnT: 0
  };

  scene.add(proj);
  lightningProjectiles.push(proj);
}

function updateLightningProjectiles(dt){
  for(let i = lightningProjectiles.length - 1; i >= 0; i--){
    const p = lightningProjectiles[i];
    p.userData.life -= dt;

    if(p.userData.life <= 0){
      scene.remove(p);
      lightningProjectiles.splice(i, 1);
      continue;
    }

    // Move projectile
    p.position.addScaledVector(p.userData.vel, dt);

    // Emit flame + smoke particles from the trail pool (reuse, no allocation)
    p.userData.spawnT -= dt;
    if(p.userData.spawnT <= 0){
      p.userData.spawnT = 0.03;
      let spawned = 0;
      for(const t of p.userData.trail){
        if(t.life > 0) continue;
        t.m.visible = true;
        t.m.position.copy(p.position);
        t.vel.set((Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5);
        t.life = t.isFlame ? 0.25 + Math.random()*0.15 : 0.5 + Math.random()*0.3;
        t.m.scale.setScalar(t.size);
        if(++spawned >= 2) break; // ~1 flame + 1 smoke per emit
      }
    }
    // Update trail particles
    for(const t of p.userData.trail){
      if(t.life <= 0) continue;
      t.life -= dt;
      if(t.life <= 0){ t.m.visible = false; continue; }
      t.m.position.addScaledVector(t.vel, dt);
      if(t.isFlame){
        t.m.scale.multiplyScalar(1 - dt*1.5);
        t.m.material.opacity = Math.max(0, t.life * 3);
      } else {
        t.m.scale.multiplyScalar(1 + dt*1.2);
        t.m.material.opacity = Math.max(0, t.life * 0.8);
      }
    }

    // Check collision with player
    const distToPlayer = p.position.distanceTo(player.pos);
    if(distToPlayer < 1.2){
      damagePlayer(p.userData.damage);
      scene.remove(p);
      lightningProjectiles.splice(i, 1);
      continue;
    }

    // Remove if out of bounds
    if(Math.abs(p.position.x) > 60 || Math.abs(p.position.z) > 60 || p.position.y < 0 || p.position.y > 30){
      scene.remove(p);
      lightningProjectiles.splice(i, 1);
    }
  }
}

/* ---- boss update ---- */
function updateBoss(dt){
  const b = state.boss;
  if(!b) return;
  if(b.dying){
    b.deathT += dt;
    const p = Math.min(1, b.deathT/0.9);
    b.group.rotation.x = p*Math.PI/2;
    b.group.position.y = -p*0.8;
    b.group.scale.setScalar(1 - p*0.15);
    if(p>=1) removeBoss();
    return;
  }
  if(!b.alive) return;
  // pulsing outline
  b.outlineMat.opacity = 0.12 + 0.10*Math.sin(state.seconds*4);
  // flash
  if(b.flash>0){
    b.flash -= dt;
    const f = Math.max(0, b.flash/0.08);
    b.bodyMat.emissive.setRGB(f, f*0.15, f*0.1);
    b.headMat.emissive.setRGB(f, f*0.15, f*0.1);
  } else {
    b.bodyMat.emissive.setRGB(0,0,0);
    b.headMat.emissive.setRGB(0,0,0);
  }
  const dx = player.pos.x - b.group.position.x;
  const dz = player.pos.z - b.group.position.z;
  const dist = Math.hypot(dx,dz);
  b.group.rotation.y = Math.atan2(dx,dz);
  if(b.windup>0){
    // wind-up: raise arm, then strike
    b.windup -= dt;
    const wp = 1 - Math.max(0,b.windup)/0.6;
    b.aR.rotation.x = -0.4 - wp*1.6;
    if(b.windup<=0){
      if(dist < 3.2){ damagePlayer(45); }
      b.attackCd = 1.2;
    }
  } else {
    b.aR.rotation.x = -0.4 + Math.sin(b.bobPhase)*0.15;
    b.aL.rotation.x = -0.4 - Math.sin(b.bobPhase)*0.15;
    
    // Lightning attack cooldown
    if(b.lightningCd > 0) b.lightningCd -= dt;
    
    if(dist > 2.5){
      // Boss obstacle-avoidance + stuck detection (same scheme as zombies)
      if(b.lastX==null){ b.lastX=b.group.position.x; b.lastZ=b.group.position.z; b.movedDist=0; b.stuckTimer=0; b.detourTimer=0; b.detourDir=1; }
      const spd = b.speed;
      const step = spd*dt;
      const ux = dx/dist, uz = dz/dist;
      const px = -uz, pz = ux;
      let dirX = ux, dirZ = uz;
      if(b.detourTimer > 0){
        b.detourTimer -= dt;
        dirX = ux*0.35 + px*b.detourDir*0.9;
        dirZ = uz*0.35 + pz*b.detourDir*0.9;
        const dl = Math.hypot(dirX,dirZ) || 1; dirX/=dl; dirZ/=dl;
      }
      let nx = b.group.position.x + dirX*step;
      let nz = b.group.position.z + dirZ*step;
      if(!zombieBlocked(nx,nz)){ b.group.position.x=nx; b.group.position.z=nz; }
      else {
        const cand = [
          [ b.group.position.x + px*b.detourDir*step, b.group.position.z + pz*b.detourDir*step ],
          [ b.group.position.x - px*b.detourDir*step, b.group.position.z - pz*b.detourDir*step ],
          [ nx, b.group.position.z ],
          [ b.group.position.x, nz ]
        ];
        for(const c of cand){ if(!zombieBlocked(c[0],c[1])){ b.group.position.x=c[0]; b.group.position.z=c[1]; break; } }
      }
      const movedThisFrame = Math.hypot(b.group.position.x - b.lastX, b.group.position.z - b.lastZ);
      b.movedDist += movedThisFrame; b.lastX = b.group.position.x; b.lastZ = b.group.position.z;
      b.stuckTimer += dt;
      if(b.stuckTimer >= 0.5){
        if(b.movedDist < 0.12){ b.detourTimer = 1.0; b.detourDir = Math.random()<0.5?1:-1; }
        b.movedDist = 0; b.stuckTimer = 0;
      }
      const _B = 59.4;
      if(b.group.position.x < -_B) b.group.position.x = -_B; else if(b.group.position.x > _B) b.group.position.x = _B;
      if(b.group.position.z < -_B) b.group.position.z = -_B; else if(b.group.position.z > _B) b.group.position.z = _B;
      b.bobPhase += dt*3;
      b.group.position.y = terrainHeight(b.group.position.x, b.group.position.z) + Math.abs(Math.sin(b.bobPhase))*0.08;
      
      // Throw lightning if in range and cooldown ready
      if(b.lightningCd <= 0 && dist < 25){
        const fromPos = b.group.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        const toPos = player.pos.clone();
        spawnLightningProjectile(fromPos, toPos);
        b.lightningCd = 3.0 + Math.random() * 2.0; // 3-5 second cooldown
      }
    } else {
      b.attackCd -= dt;
      if(b.attackCd<=0){
        b.windup = 0.6;
        b.attackCd = 1.2;
      }
      b.group.position.y = terrainHeight(b.group.position.x, b.group.position.z);
    }
  }
  updateBossBar(true);
}

function playThud(){
  if(!audioCtx) return;
  const t=now();
  const o=audioCtx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(28,t+0.5);
  const g=audioCtx.createGain(); g.gain.setValueAtTime(0.6,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.6);
  o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.65);
  const dur=0.4;
  const buf=audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate*dur), audioCtx.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2); }
  const src=audioCtx.createBufferSource(); src.buffer=buf;
  const filt=audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=500;
  const g2=audioCtx.createGain(); g2.gain.setValueAtTime(0.4,t); g2.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(filt).connect(g2).connect(audioCtx.destination); src.start(t); src.stop(t+dur);
}
