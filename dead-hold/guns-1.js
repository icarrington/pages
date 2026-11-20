"use strict";
// Dead Hold: gun materials and models: pistol, SMG, shotgun, double-barrel shotgun, rifle
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ WEAPON ============================ */
const gun = new THREE.Group();
const gunMetal = new THREE.MeshLambertMaterial({color:0x3a3a3a});
const gunDark = new THREE.MeshLambertMaterial({color:0x2a2a2a});
const gunWood = new THREE.MeshLambertMaterial({color:0x6a4a2a});
const gunOlive = new THREE.MeshLambertMaterial({color:0x5a3a1a});
const gunBlack = new THREE.MeshLambertMaterial({color:0x2a2a2a});
const gunLight = new THREE.MeshLambertMaterial({color:0x4a4a4a});
const gunSilver = new THREE.MeshLambertMaterial({color:0x8a8a8a});
const gunGold = new THREE.MeshLambertMaterial({color:0x8a7a4a});
const gunTan = new THREE.MeshLambertMaterial({color:0x7a6a4a});
const gunDarkOlive = new THREE.MeshLambertMaterial({color:0x3a4a2a});
/* Polished steel for M4 iron sights: a subtle metallic sheen so the posts read
   clearly against the dark receiver (slight emissive lift + lighter base). */
const sightSteel = new THREE.MeshLambertMaterial({color:0x9aa1ab, emissive:0x1c2026, emissiveIntensity:0.55});
const gunSteel = new THREE.MeshLambertMaterial({color:0x5a6a7a});




function buildPistol(){
  const g = new THREE.Group();
  
  // === MAIN SLIDE (top, dark metal) ===
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.07,0.34), gunMetal); slide.position.set(0,0.04,0); g.add(slide);
  
  // Slide serrations (rear) - 5 thin vertical ridges
  for(let i=0;i<5;i++){
    const serr = new THREE.Mesh(new THREE.BoxGeometry(0.092,0.005,0.006), gunDark);
    serr.position.set(0,0.04,0.12+i*0.018); g.add(serr);
  }
  
  // Ejection port: small rectangular cutout on top-right of slide
  const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.012,0.06), gunDark);
  ejPort.position.set(0.035,0.075,0.02); g.add(ejPort);
  
  // === FRAME (bottom, lighter) ===
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.085,0.05,0.30), gunLight); frame.position.set(0,-0.01,0.01); g.add(frame);
  
  // Barrel (exposed, lighter gray)
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,0.16,10), gunLight);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,0.04,-0.20); g.add(barrel);
  
  // Muzzle brake
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.02,10), gunDark);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.04,-0.28); g.add(muzzle);
  
  // === GRIP (angled ~15 deg, dark) ===
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065,0.17,0.09), gunDark);
  grip.position.set(0,-0.13,0.10); grip.rotation.x = 0.26; g.add(grip);
  
  // Finger-groove grip: 3 stepped horizontal ridges on the grip face
  for(let i=0;i<3;i++){
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.067,0.004,0.085), gunMetal);
    groove.position.set(0,-0.13,0.10); groove.rotation.x = 0.26;
    groove.position.y += (i-1)*0.035; g.add(groove);
  }
  
  // Magazine base plate: slightly wider box at the bottom of the magazine
  const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.075,0.015,0.10), gunLight);
  magBase.position.set(0,-0.21,0.13); g.add(magBase);
  
  // === TRIGGER GUARD: small ring made of 4 thin boxes under the frame ===
  const tgW = 0.035, tgH = 0.025, tgT = 0.006;
  const tgFront = new THREE.Mesh(new THREE.BoxGeometry(tgT, tgH, tgT), gunDark);
  tgFront.position.set(0, -0.065, 0.02 - tgW/2); g.add(tgFront);
  const tgBack = new THREE.Mesh(new THREE.BoxGeometry(tgT, tgH, tgT), gunDark);
  tgBack.position.set(0, -0.065, 0.02 + tgW/2); g.add(tgBack);
  const tgBottom = new THREE.Mesh(new THREE.BoxGeometry(tgW, tgT, tgT), gunDark);
  tgBottom.position.set(0, -0.065 - tgH/2, 0.02); g.add(tgBottom);
  const tgTop = new THREE.Mesh(new THREE.BoxGeometry(tgW, tgT, tgT), gunDark);
  tgTop.position.set(0, -0.065 + tgH/2, 0.02); g.add(tgTop);
  
  // Trigger (lighter)
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.03,0.012), gunLight);
  trigger.position.set(0,-0.055,0.02); g.add(trigger);
  
  // === HAMMER: small L-shaped bump at the rear ===
  const hammerBase = new THREE.Mesh(new THREE.BoxGeometry(0.02,0.035,0.02), gunMetal);
  hammerBase.position.set(0,0.015,0.16); g.add(hammerBase);
  const hammerTip = new THREE.Mesh(new THREE.BoxGeometry(0.015,0.015,0.015), gunDark);
  hammerTip.position.set(0,0.035,0.17); g.add(hammerTip);
  
  // === FRONT IRON SIGHT: raised blade post at the muzzle end ===
  // Base plate
  const fsBase = new THREE.Mesh(new THREE.BoxGeometry(0.018,0.008,0.022), gunDark);
  fsBase.position.set(0,0.078,-0.16); g.add(fsBase);
  // Blade post (tall, narrow, with a slightly rounded top)
  const fsBlade = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.032,0.012), gunMetal);
  fsBlade.position.set(0,0.098,-0.16); g.add(fsBlade);
  // Blade tip (small cap)
  const fsTip = new THREE.Mesh(new THREE.BoxGeometry(0.010,0.006,0.014), gunDark);
  fsTip.position.set(0,0.116,-0.16); g.add(fsTip);
  // Lateral guard wings (small, flanking the blade)
  const fsWingL = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.018,0.010), gunDark);
  fsWingL.position.set(-0.012,0.092,-0.16); g.add(fsWingL);
  const fsWingR = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.018,0.010), gunDark);
  fsWingR.position.set(0.012,0.092,-0.16); g.add(fsWingR);


  // === REAR IRON SIGHT: two ears with a center notch gap ===
  // Left ear
  const rsEarL = new THREE.Mesh(new THREE.BoxGeometry(0.016,0.022,0.020), gunDark);
  rsEarL.position.set(-0.014,0.088,0.12); g.add(rsEarL);
  // Right ear
  const rsEarR = new THREE.Mesh(new THREE.BoxGeometry(0.016,0.022,0.020), gunDark);
  rsEarR.position.set(0.014,0.088,0.12); g.add(rsEarR);
  // Center bridge (top bar connecting the ears, leaving a gap below)
  const rsBridge = new THREE.Mesh(new THREE.BoxGeometry(0.028,0.006,0.018), gunMetal);
  rsBridge.position.set(0,0.100,0.12); g.add(rsBridge);
  // Notch floor (dark recess visible through the gap)
  const rsNotch = new THREE.Mesh(new THREE.BoxGeometry(0.016,0.014,0.016), gunBlack);
  rsNotch.position.set(0,0.090,0.12); g.add(rsNotch);
  // Rear sight base plate
  const rsBase = new THREE.Mesh(new THREE.BoxGeometry(0.036,0.006,0.024), gunDark);
  rsBase.position.set(0,0.078,0.12); g.add(rsBase);
  // Serration ridges on the ears (3 each)
  for(let i=0;i<3;i++){
    const serrL = new THREE.Mesh(new THREE.BoxGeometry(0.017,0.003,0.004), gunMetal);
    serrL.position.set(-0.014,0.082+i*0.006,0.12); g.add(serrL);
    const serrR = new THREE.Mesh(new THREE.BoxGeometry(0.017,0.003,0.004), gunMetal);
    serrR.position.set(0.014,0.082+i*0.006,0.12); g.add(serrR);
  }
  
  // Beavertail (grip extension)
  const beavertail = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.02,0.03), gunDark);
  beavertail.position.set(0,-0.05,0.14); g.add(beavertail);
  
  return g;
}

function buildSMG(){
  const g = new THREE.Group();
  
  // === RAIL (top Picatinny-style, lighter grey) ===
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045,0.018,0.42), gunLight);
  rail.position.set(0,0.07,0); g.add(rail);
  // Rail notches (Picatinny cross-slots)
  for(let i=0;i<10;i++){
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.047,0.019,0.006), gunDark);
    notch.position.set(0,0.07,-0.18+i*0.04); g.add(notch);
  }
  // Front sight post (raised, on rail)
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.018,0.028,0.018), gunLight);
  frontSight.position.set(0,0.095,-0.24); g.add(frontSight);
  // Rear sight post (raised, on rail)
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.035,0.022,0.025), gunLight);
  rearSight.position.set(0,0.092,0.18); g.add(rearSight);
  // Rear sight notch (darker center)
  const rearNotch = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.018,0.018), gunDark);
  rearNotch.position.set(0,0.092,0.18); g.add(rearNotch);
  
  // === RECEIVER BODY (boxy, dark grey) ===
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.115,0.115,0.50), gunBlack); body.position.set(0,0,0); g.add(body);
  // Ejection port (visible rectangular cutout on right side)
  const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.035,0.08), gunDark);
  ejPort.position.set(0.058,0.01,0.05); g.add(ejPort);
  // Ejection port rim (lighter frame around it)
  const ejRim = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.045,0.09), gunLight);
  ejRim.position.set(0.057,0.01,0.05); g.add(ejRim);
  
  // === HANDGUARD (textured with horizontal grooves) ===
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.10,0.09,0.22), gunDark);
  handguard.position.set(0,0,-0.22); g.add(handguard);
  // Horizontal grooves on handguard (4 ridges)
  for(let i=0;i<4;i++){
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.102,0.008,0.012), gunLight);
    groove.position.set(0,0,-0.14-i*0.04); g.add(groove);
  }
  // Handguard side panels (slightly inset, textured)
  const hgSideL = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.07,0.18), gunBlack);
  hgSideL.position.set(-0.053,0,-0.22); g.add(hgSideL);
  const hgSideR = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.07,0.18), gunBlack);
  hgSideR.position.set(0.053,0,-0.22); g.add(hgSideR);
  
  // === BARREL (exposed, lighter grey) ===
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.16,10), gunLight);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,0.02,-0.36); g.add(barrel);
  
  // === FLASH HIDER (ribbed/ridged, multiple concentric rings) ===
  const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.10,12), gunLight);
  flashHider.rotation.x = Math.PI/2; flashHider.position.set(0,0.02,-0.48); g.add(flashHider);
  // Concentric rings on flash hider (5 ridges)
  for(let i=0;i<5;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025,0.005,8,16), gunDark);
    ring.position.set(0,0.02,-0.44-i*0.02); ring.rotation.x = Math.PI/2; g.add(ring);
  }
  // Muzzle tip (darker)
  const muzzleTip = new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.015,12), gunDark);
  muzzleTip.rotation.x = Math.PI/2; muzzleTip.position.set(0,0.02,-0.535); g.add(muzzleTip);
  
  // === MAGAZINE (curved, two segments, dark) ===
  const magTop = new THREE.Mesh(new THREE.BoxGeometry(0.058,0.13,0.075), gunDark);
  magTop.position.set(0,-0.12,0.06); g.add(magTop);
  const magBot = new THREE.Mesh(new THREE.BoxGeometry(0.058,0.13,0.075), gunDark);
  magBot.position.set(0,-0.22,0.09); magBot.rotation.x = 0.28; g.add(magBot);
  // Magazine base plate (lighter, flat)
  const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.065,0.022,0.08), gunLight);
  magBase.position.set(0,-0.28,0.115); magBase.rotation.x = 0.28; g.add(magBase);
  // Magazine release button (small, on side)
  const magRelease = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.015,0.02), gunLight);
  magRelease.position.set(0.032,-0.10,0.06); g.add(magRelease);
  
  // === GRIP (angled ergonomic, dark brown/black, finger grooves) ===
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.16,0.085), gunDark);
  grip.position.set(0,-0.13,0.15); grip.rotation.x = 0.32; g.add(grip);
  // Finger grooves (stepped profile, 4 ridges)
  for(let i=0;i<4;i++){
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.062,0.006,0.08), gunBlack);
    groove.position.set(0,-0.13,0.15); groove.rotation.x = 0.32;
    groove.position.y += (i-1.5)*0.032; g.add(groove);
  }
  // Grip texture (horizontal lines)
  for(let i=0;i<3;i++){
    const gripLine = new THREE.Mesh(new THREE.BoxGeometry(0.062,0.004,0.078), gunLight);
    gripLine.position.set(0,-0.13,0.15); gripLine.rotation.x = 0.32;
    gripLine.position.y += (i-1)*0.04; g.add(gripLine);
  }
  
  // === TRIGGER GUARD (ring) ===
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.028,0.007,8,14), gunDark);
  triggerGuard.position.set(0,-0.075,0.04); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Trigger (lighter)
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.03,0.012), gunLight);
  trigger.position.set(0,-0.065,0.04); g.add(trigger);
  
  // === STOCK STUB (small, at rear) ===
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.105,0.16), gunBlack);
  stock.position.set(0,-0.02,0.32); g.add(stock);
  // Stock pad (rubber, darker)
  const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.10,0.115,0.035), gunDark);
  stockPad.position.set(0,-0.02,0.40); g.add(stockPad);
  // Stock hinge (metal)
  const stockHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.09,8), gunLight);
  stockHinge.rotation.z = Math.PI/2; stockHinge.position.set(0,-0.02,0.24); g.add(stockHinge);
  
  // === SIDE PANELS (textured, on receiver) ===
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.09,0.32), gunDark);
  sideL.position.set(-0.061,0,0); g.add(sideL);
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.09,0.32), gunDark);
  sideR.position.set(0.061,0,0); g.add(sideR);
  // Side panel vents (4 on each side)
  for(let i=0;i<4;i++){
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.007,0.012,0.022), gunLight);
    ventL.position.set(-0.062,0.02,-0.12+i*0.06); g.add(ventL);
    const ventR = new THREE.Mesh(new THREE.BoxGeometry(0.007,0.012,0.022), gunLight);
    ventR.position.set(0.062,0.02,-0.12+i*0.06); g.add(ventR);
  }
  
  return g;
}

function buildShotgun(){
  const g = new THREE.Group();
  // Wooden stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.10,0.28), gunWood);
  stock.position.set(0,-0.02,0.22); g.add(stock);
  // Stock comb
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.03,0.10), gunWood);
  comb.position.set(0,0.04,0.28); g.add(comb);
  // Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.10,0.09,0.18), gunMetal);
  receiver.position.set(0,0,0.06); g.add(receiver);
  // Barrel 1 (top)
  const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.40,8), gunMetal);
  barrel1.rotation.x = Math.PI/2; barrel1.position.set(-0.025,0.03,-0.22); g.add(barrel1);
  // Barrel 2 (bottom)
  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.40,8), gunMetal);
  barrel2.rotation.x = Math.PI/2; barrel2.position.set(0.025,0.03,-0.22); g.add(barrel2);
  // Barrel bands
  for(let i=0;i<2;i++){
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.055,0.008,8,16), gunDark);
    band.position.set(0,0.03,-0.12-i*0.15); band.rotation.x = Math.PI/2; g.add(band);
  }
  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.03,12), gunDark);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.03,-0.42); g.add(muzzle);
  // Pump (wooden forend)
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.07,0.15), gunWood);
  pump.position.set(0,-0.01,-0.14); g.add(pump);
  // Pump ribs
  for(let i=0;i<4;i++){
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.085,0.075,0.008), gunDark);
    rib.position.set(0,-0.01,-0.08-i*0.03); g.add(rib);
  }
  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.12,0.09), gunDark);
  grip.position.set(0,-0.12,0.16); grip.rotation.x = 0.35; g.add(grip);
  // Trigger guard
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.028,0.007,8,12), gunDark);
  triggerGuard.position.set(0,-0.07,0.06); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Trigger
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.015,0.035,0.015), gunMetal);
  trigger.position.set(0,-0.06,0.06); g.add(trigger);
  // Front sight (bead)
  const frontSight = new THREE.Mesh(new THREE.SphereGeometry(0.012,8,8), gunMetal);
  frontSight.position.set(0,0.065,-0.38); g.add(frontSight);
  // Rear sight
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.015,0.02), gunMetal);
  rearSight.position.set(0,0.065,0.12); g.add(rearSight);
  return g;
}

function buildDoubleShotgun(){
  const g = new THREE.Group();
  // Wooden stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.11,0.30), gunWood);
  stock.position.set(0,-0.02,0.24); g.add(stock);
  // Stock comb
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.035,0.12), gunWood);
  comb.position.set(0,0.045,0.30); g.add(comb);
  // Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.11,0.10,0.20), gunMetal);
  receiver.position.set(0,0,0.06); g.add(receiver);
  // Barrel 1 (top-left)
  const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.42,8), gunBlack);
  barrel1.rotation.x = Math.PI/2; barrel1.position.set(-0.03,0.035,-0.24); g.add(barrel1);
  // Barrel 2 (top-right)
  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.42,8), gunBlack);
  barrel2.rotation.x = Math.PI/2; barrel2.position.set(0.03,0.035,-0.24); g.add(barrel2);
  // Barrel bands
  for(let i=0;i<2;i++){
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.065,0.009,8,16), gunDark);
    band.position.set(0,0.035,-0.14-i*0.16); band.rotation.x = Math.PI/2; g.add(band);
  }
  // Muzzle (wide, covers both barrels)
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.058,0.035,12), gunDark);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.035,-0.44); g.add(muzzle);
  // Pump (wooden forend)
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.08,0.16), gunWood);
  pump.position.set(0,-0.015,-0.16); g.add(pump);
  // Pump ribs
  for(let i=0;i<4;i++){
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.085,0.008), gunDark);
    rib.position.set(0,-0.015,-0.10-i*0.03); g.add(rib);
  }
  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065,0.13,0.09), gunDark);
  grip.position.set(0,-0.13,0.18); grip.rotation.x = 0.35; g.add(grip);
  // Trigger guard
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.03,0.008,8,12), gunDark);
  triggerGuard.position.set(0,-0.075,0.07); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Trigger
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.016,0.038,0.016), gunMetal);
  trigger.position.set(0,-0.065,0.07); g.add(trigger);
  // Front sight (bead)
  const frontSight = new THREE.Mesh(new THREE.SphereGeometry(0.014,8,8), gunMetal);
  frontSight.position.set(0,0.075,-0.40); g.add(frontSight);
  // Rear sight
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.045,0.018,0.022), gunMetal);
  rearSight.position.set(0,0.075,0.14); g.add(rearSight);
  return g;
}

function buildRifle(){
  const g = new THREE.Group();

  // === RECEIVER BODY (AK-47: dark metal, slightly tapered) ===
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.08,0.32), gunMetal);
  receiver.position.set(0,0,0); g.add(receiver);
  // Receiver top plate (slightly darker)
  const recvTop = new THREE.Mesh(new THREE.BoxGeometry(0.085,0.015,0.30), gunDark);
  recvTop.position.set(0,0.045,0); g.add(recvTop);
  // Side panels (darker, inset)
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.005,0.06,0.28), gunBlack);
  sideL.position.set(-0.048,0,0); g.add(sideL);
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.005,0.06,0.28), gunBlack);
  sideR.position.set(0.048,0,0); g.add(sideR);

  // === WOODEN BUTTSTOCK (long, at rear, gunWood) ===
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.09,0.22), gunWood);
  stock.position.set(0,-0.01,0.26); g.add(stock);
  // Stock comb (top edge, slightly wider)
  const stockComb = new THREE.Mesh(new THREE.BoxGeometry(0.075,0.025,0.10), gunWood);
  stockComb.position.set(0,0.04,0.32); g.add(stockComb);
  // Stock pad (rear end, darker wood)
  const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.075,0.095,0.03), gunDark);
  stockPad.position.set(0,-0.01,0.37); g.add(stockPad);
  // Stock hinge (metal pin)
  const stockHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.07,8), gunMetal);
  stockHinge.rotation.z = Math.PI/2; stockHinge.position.set(0,-0.01,0.15); g.add(stockHinge);

  // === WOODEN HANDGUARD / FOREND (wraps front of barrel, gunWood) ===
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.07,0.22), gunWood);
  handguard.position.set(0,0,-0.22); g.add(handguard);
  // Handguard top (slightly inset, darker)
  const hgTop = new THREE.Mesh(new THREE.BoxGeometry(0.075,0.012,0.20), gunDark);
  hgTop.position.set(0,0.04,-0.22); g.add(hgTop);
  // Handguard bottom (slightly inset)
  const hgBot = new THREE.Mesh(new THREE.BoxGeometry(0.075,0.012,0.20), gunDark);
  hgBot.position.set(0,-0.04,-0.22); g.add(hgBot);

  // === BARREL (protruding forward, gunMetal) ===
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.22,10), gunMetal);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,0.01,-0.38); g.add(barrel);
  // Muzzle tip (slightly wider)
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.03,10), gunDark);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.01,-0.50); g.add(muzzle);

  // === GAS TUBE / CYLINDER (running parallel ABOVE the barrel, gunMetal) ===
  const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.20,8), gunMetal);
  gasTube.rotation.x = Math.PI/2; gasTube.position.set(0,0.045,-0.32); g.add(gasTube);
  // Gas block (small block at front of gas tube)
  const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.025,0.03), gunDark);
  gasBlock.position.set(0,0.045,-0.42); g.add(gasBlock);

  // === CURVED BANANA MAGAZINE (3-4 angled box segments, gunDark) ===
  // Segment 1: top, nearly vertical
  const mag1 = new THREE.Mesh(new THREE.BoxGeometry(0.055,0.10,0.06), gunDark);
  mag1.position.set(0,-0.10,0.06); mag1.rotation.x = 0.15; g.add(mag1);
  // Segment 2: middle, more angled
  const mag2 = new THREE.Mesh(new THREE.BoxGeometry(0.055,0.10,0.06), gunDark);
  mag2.position.set(0,-0.18,0.09); mag2.rotation.x = 0.45; g.add(mag2);
  // Segment 3: bottom, most angled (banana curve)
  const mag3 = new THREE.Mesh(new THREE.BoxGeometry(0.055,0.09,0.06), gunDark);
  mag3.position.set(0,-0.24,0.14); mag3.rotation.x = 0.75; g.add(mag3);
  // Magazine base plate (lighter, flat)
  const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.015,0.065), gunLight);
  magBase.position.set(0,-0.27,0.17); magBase.rotation.x = 0.75; g.add(magBase);

  // === PISTOL GRIP (angled back, gunDark) ===
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.12,0.07), gunDark);
  grip.position.set(0,-0.10,0.14); grip.rotation.x = 0.35; g.add(grip);
  // Grip texture (horizontal lines)
  for(let i=0;i<3;i++){
    const gripLine = new THREE.Mesh(new THREE.BoxGeometry(0.052,0.004,0.065), gunLight);
    gripLine.position.set(0,-0.10,0.14); gripLine.rotation.x = 0.35;
    gripLine.position.y += (i-1)*0.035; g.add(gripLine);
  }

  // === TRIGGER GUARD (small loop) ===
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.022,0.006,8,12), gunDark);
  triggerGuard.position.set(0,-0.065,0.04); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Trigger (lighter)
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.010,0.025,0.010), gunLight);
  trigger.position.set(0,-0.055,0.04); g.add(trigger);

  // === FRONT IRON SIGHT (small post + base at muzzle, gunDark) ===
  const fsBase = new THREE.Mesh(new THREE.BoxGeometry(0.016,0.008,0.020), gunDark);
  fsBase.position.set(0,0.065,-0.44); g.add(fsBase);
  const fsPost = new THREE.Mesh(new THREE.BoxGeometry(0.005,0.030,0.005), gunMetal);
  fsPost.position.set(0,0.085,-0.44); g.add(fsPost);
  const fsTip = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.005,0.008), gunDark);
  fsTip.position.set(0,0.105,-0.44); g.add(fsTip);

  // === REAR IRON SIGHT (block with notch near back of receiver, gunMetal) ===
  const rsBody = new THREE.Mesh(new THREE.BoxGeometry(0.030,0.018,0.020), gunMetal);
  rsBody.position.set(0,0.065,0.12); g.add(rsBody);
  // Notch (dark recess)
  const rsNotch = new THREE.Mesh(new THREE.BoxGeometry(0.010,0.012,0.016), gunBlack);
  rsNotch.position.set(0,0.072,0.12); g.add(rsNotch);
  // Two ears flanking the notch
  const rsEarL = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.016,0.018), gunMetal);
  rsEarL.position.set(-0.010,0.068,0.12); g.add(rsEarL);
  const rsEarR = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.016,0.018), gunMetal);
  rsEarR.position.set(0.010,0.068,0.12); g.add(rsEarR);

  return g;
}
