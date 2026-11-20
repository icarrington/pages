"use strict";
// Dead Hold: gun models: Uzi, M4A1, AWP, Deagle, Minigun, RPG launcher, and the weaponModels table
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

function buildUzi(){
  const g = new THREE.Group();
  // Compact body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.09,0.30), gunBlack); body.position.set(0,0,0); g.add(body);
  // Top rail
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.012,0.22), gunDark);
  rail.position.set(0,0.055,0); g.add(rail);
  // Short barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.12,8), gunMetal);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,0.01,-0.20); g.add(barrel);
  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.02,8), gunDark);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.01,-0.26); g.add(muzzle);
  // Curved magazine (Uzi characteristic)
  const mag1 = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.10,0.06), gunDark);
  mag1.position.set(0,-0.09,0.04); g.add(mag1);
  const mag2 = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.10,0.06), gunDark);
  mag2.position.set(0,-0.17,0.07); mag2.rotation.x = 0.3; g.add(mag2);
  const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.055,0.015,0.065), gunMetal);
  magBase.position.set(0,-0.22,0.09); magBase.rotation.x = 0.3; g.add(magBase);
  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.12,0.07), gunDark);
  grip.position.set(0,-0.10,0.12); grip.rotation.x = 0.3; g.add(grip);
  // Trigger guard
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.02,0.005,8,12), gunDark);
  triggerGuard.position.set(0,-0.055,0.03); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Front sight
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.018,0.012), gunMetal);
  frontSight.position.set(0,0.07,-0.16); g.add(frontSight);
  // Rear sight
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.012,0.015), gunMetal);
  rearSight.position.set(0,0.07,0.10); g.add(rearSight);
  // Side panels
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.004,0.07,0.22), gunDark);
  sideL.position.set(-0.048,0,0); g.add(sideL);
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.004,0.07,0.22), gunDark);
  sideR.position.set(0.048,0,0); g.add(sideR);
  return g;
}

function buildM4A1(){
  const g = new THREE.Group();
  
  // === RECEIVER BODY (dark grey, main box) ===
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.11,0.11,0.48), gunDark);
  receiver.position.set(0,0,0); g.add(receiver);
  
  // === EJECTION PORT (recessed darker box on right side) ===
  const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.035,0.08), gunBlack);
  ejPort.position.set(0.056,0.01,0.05); g.add(ejPort);
  const ejRim = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.045,0.09), gunLight);
  ejRim.position.set(0.055,0.01,0.05); g.add(ejRim);
  
  // === PICATINNY RAIL HANDGUARD (medium grey, rectangular) ===
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.10,0.09,0.24), gunLight);
  handguard.position.set(0,0,-0.22); g.add(handguard);
  
  // 6 horizontal raised rail sections on top of handguard
  for(let i=0;i<6;i++){
    const railSection = new THREE.Mesh(new THREE.BoxGeometry(0.102,0.012,0.018), gunMetal);
    railSection.position.set(0,0.051,-0.12-i*0.035); g.add(railSection);
  }
  
  // 5 heat vent slots on each side (recessed darker boxes)
  for(let i=0;i<5;i++){
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.015,0.022), gunBlack);
    ventL.position.set(-0.051,0.01,-0.14+i*0.04); g.add(ventL);
    const ventR = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.015,0.022), gunBlack);
    ventR.position.set(0.051,0.01,-0.14+i*0.04); g.add(ventR);
  }
  
  // === GAS CYLINDER (thin horizontal tube above barrel, in front of receiver) ===
  // 3 small boxes in a row forming a tube
  const gasCyl1 = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.025,0.08), gunMetal);
  gasCyl1.position.set(0,0.045,-0.10); g.add(gasCyl1);
  const gasCyl2 = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.025,0.08), gunMetal);
  gasCyl2.position.set(0,0.045,-0.18); g.add(gasCyl2);
  const gasCyl3 = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.025,0.08), gunMetal);
  gasCyl3.position.set(0,0.045,-0.26); g.add(gasCyl3);
  
  // === BARREL (lighter grey, exposed) ===
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.20,10), gunLight);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,0.02,-0.34); g.add(barrel);
  
  // === MUZZLE BRAKE (ribbed, multiple rings) ===
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.08,12), gunLight);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.02,-0.46); g.add(muzzle);
  // Concentric rings on muzzle (4 ridges)
  for(let i=0;i<4;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025,0.005,8,16), gunDark);
    ring.position.set(0,0.02,-0.42-i*0.02); ring.rotation.x = Math.PI/2; g.add(ring);
  }
  // Muzzle tip (darker)
  const muzzleTip = new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.015,12), gunDark);
  muzzleTip.rotation.x = Math.PI/2; muzzleTip.position.set(0,0.02,-0.505); g.add(muzzleTip);
  
  // === STANAG CURVED MAGAZINE (dark near-black, 5 boxes stacked with forward offset) ===
  const magLevels = 5;
  for(let i=0;i<magLevels;i++){
    const magBox = new THREE.Mesh(new THREE.BoxGeometry(0.058,0.08,0.065), gunBlack);
    magBox.position.set(0,-0.08-i*0.075,0.06+i*0.012);
    magBox.rotation.x = 0.15+i*0.03;
    g.add(magBox);
    // Vertical rib lines on sides (2 per level)
    const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.004,0.075,0.06), gunDark);
    ribL.position.set(-0.030,-0.08-i*0.075,0.06+i*0.012);
    ribL.rotation.x = 0.15+i*0.03;
    g.add(ribL);
    const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.004,0.075,0.06), gunDark);
    ribR.position.set(0.030,-0.08-i*0.075,0.06+i*0.012);
    ribR.rotation.x = 0.15+i*0.03;
    g.add(ribR);
  }
  // Magazine base plate (slightly wider, darker)
  const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.065,0.022,0.075), gunDark);
  magBase.position.set(0,-0.46,0.12);
  magBase.rotation.x = 0.30;
  g.add(magBase);
  // Magazine release button (small, on side)
  const magRelease = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.015,0.02), gunLight);
  magRelease.position.set(0.032,-0.10,0.06); g.add(magRelease);
  
  // === GRIP (dark near-black, angled ergonomic) ===
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.16,0.085), gunBlack);
  grip.position.set(0,-0.13,0.15); grip.rotation.x = 0.32; g.add(grip);
  // Finger grooves (4 ridges)
  for(let i=0;i<4;i++){
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.062,0.006,0.08), gunDark);
    groove.position.set(0,-0.13,0.15); groove.rotation.x = 0.32;
    groove.position.y += (i-1.5)*0.032; g.add(groove);
  }
  // Grip texture (horizontal lines)
  for(let i=0;i<3;i++){
    const gripLine = new THREE.Mesh(new THREE.BoxGeometry(0.062,0.004,0.078), gunLight);
    gripLine.position.set(0,-0.13,0.15); gripLine.rotation.x = 0.32;
    gripLine.position.y += (i-1)*0.04; g.add(gripLine);
  }
  
  // === TRIGGER GUARD (small loop: 2 vertical posts + bottom bar) ===
  const tgPostL = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.035,0.006), gunDark);
  tgPostL.position.set(-0.015,-0.075,0.04); g.add(tgPostL);
  const tgPostR = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.035,0.006), gunDark);
  tgPostR.position.set(0.015,-0.075,0.04); g.add(tgPostR);
  const tgBottom = new THREE.Mesh(new THREE.BoxGeometry(0.036,0.006,0.006), gunDark);
  tgBottom.position.set(0,-0.093,0.04); g.add(tgBottom);
  // Trigger (lighter)
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.03,0.012), gunLight);
  trigger.position.set(0,-0.065,0.04); g.add(trigger);
  
  // === TUBULAR COLLAPSIBLE STOCK (horizontal tube with ridges) ===
  // Main tube body (3 boxes stacked to form rounded profile)
  const stockTube1 = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.06,0.22), gunDark);
  stockTube1.position.set(0,-0.01,0.32); g.add(stockTube1);
  const stockTube2 = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.05,0.22), gunDark);
  stockTube2.position.set(0,0.03,0.32); g.add(stockTube2);
  const stockTube3 = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.22), gunDark);
  stockTube3.position.set(0,0.06,0.32); g.add(stockTube3);
  
  // 4 vertical ridge lines along the tube (thin protruding strips)
  for(let i=0;i<4;i++){
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.11,0.012), gunLight);
    ridge.position.set(0,-0.01,0.24+i*0.05); g.add(ridge);
  }
  
  // Rubber butt pad at the very back (slightly larger, darker)
  const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.12,0.04), gunBlack);
  buttPad.position.set(0,-0.01,0.44); g.add(buttPad);
  
  // === FRONT IRON SIGHT (M4-style: slim post + protective hood, on barrel centerline x=0) ===
  // Rotated 90° in yaw (around weapon's local Y axis) per SgtSerotonin's request.
  // Low cradle base the post rises out of (dark, distinct from gun body)
  const fsBase = new THREE.Mesh(new THREE.BoxGeometry(0.020,0.010,0.022), gunBlack);
  fsBase.position.set(0,0.068,-0.34); fsBase.rotation.y = Math.PI/2; g.add(fsBase);
  // Slim vertical post (precise, narrow, dark) — raised so it reads clearly as the
  // aiming reference even at hip; the ADS profile above is tuned to this height.
  const fsPost = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.038,0.006), gunBlack);
  fsPost.position.set(0,0.094,-0.34); fsPost.rotation.y = Math.PI/2; g.add(fsPost);
  // Tiny bead cap on the post tip (dark)
  const fsCap = new THREE.Mesh(new THREE.BoxGeometry(0.009,0.006,0.009), gunBlack);
  fsCap.position.set(0,0.116,-0.34); fsCap.rotation.y = Math.PI/2; g.add(fsCap);
  // Protective hood: two curved prongs that arch over the post (front + back)
  const hoodArc = new THREE.Mesh(new THREE.TorusGeometry(0.014,0.0035,8,14,Math.PI), sightSteel);
  hoodArc.rotation.y = Math.PI; // rotated 90° in yaw from original Math.PI/2
  hoodArc.position.set(0,0.090,-0.34); g.add(hoodArc);
  const hoodArc2 = new THREE.Mesh(new THREE.TorusGeometry(0.014,0.0035,8,14,Math.PI), sightSteel);
  hoodArc2.rotation.y = Math.PI; // rotated 90° in yaw from original Math.PI/2
  hoodArc2.position.set(0,0.090,-0.34); hoodArc2.rotation.z = Math.PI; g.add(hoodArc2);


  // === SIDE PANELS (textured, on receiver) ===
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.09,0.32), gunDark);
  sideL.position.set(-0.056,0,0); g.add(sideL);
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.09,0.32), gunDark);
  sideR.position.set(0.056,0,0); g.add(sideR);
  // Side panel vents (4 on each side)
  for(let i=0;i<4;i++){
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.007,0.012,0.022), gunLight);
    ventL.position.set(-0.057,0.02,-0.12+i*0.06); g.add(ventL);
    const ventR = new THREE.Mesh(new THREE.BoxGeometry(0.007,0.012,0.022), gunLight);
    ventR.position.set(0.057,0.02,-0.12+i*0.06); g.add(ventR);
  }
  
  return g;
}

function buildAWP(){
  const g = new THREE.Group();
  // Long body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.10,0.10,0.65), gunDarkOlive); body.position.set(0,0,0); g.add(body);
  // Handguard (long)
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.08,0.30), gunDark);
  handguard.position.set(0,0,-0.25); g.add(handguard);
  // Long barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.35,10), gunMetal);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,0.02,-0.45); g.add(barrel);
  // Muzzle brake (large)
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.06,12), gunDark);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.02,-0.65); g.add(muzzle);

  // Magazine (box)
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.14,0.08), gunDark);
  mag.position.set(0,-0.11,0.08); g.add(mag);
  // Stock (long, with cheek rest)
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.10,0.28), gunDarkOlive);
  stock.position.set(0,-0.02,0.35); g.add(stock);
  const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.04,0.12), gunDark);
  cheekRest.position.set(0,0.04,0.38); g.add(cheekRest);
  const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.11,0.03), gunDark);
  stockPad.position.set(0,-0.02,0.49); g.add(stockPad);
  // Scope: red-dot-sight-style tube with crosshair lines in the center
  const awpScopeMat = new THREE.MeshLambertMaterial({color:0x14191e, side:THREE.DoubleSide});
  const awpScopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.081,0.081,0.22,24,1,true), awpScopeMat);
  awpScopeTube.rotation.x = Math.PI/2; awpScopeTube.position.set(0,0.10,0.05); g.add(awpScopeTube);
  const awpScopeRimMat = new THREE.MeshLambertMaterial({color:0x343d45});
  for(const rz of [-0.11, 0.11]){
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.081,0.012,10,28), awpScopeRimMat);
    rim.position.set(0,0.10,0.05+rz); g.add(rim);
  }
  const awpScopeFoot = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.018,0.12), awpScopeRimMat);
  awpScopeFoot.position.set(0,0.10-0.105,0.05); g.add(awpScopeFoot);
  const awpScopePost = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.057,0.060), awpScopeMat);
  awpScopePost.position.set(0,0.10-0.072,0.05); g.add(awpScopePost);
  const awpScopeGlass = new THREE.Mesh(new THREE.CircleGeometry(0.076,28),
    new THREE.MeshBasicMaterial({color:0x508a80, transparent:true, opacity:0.07, side:THREE.DoubleSide, depthWrite:false}));
  awpScopeGlass.position.set(0,0.10,0.05-0.065-0.004); g.add(awpScopeGlass);
  // Crosshair lines (red, additive) in the center of the scope
  const awpCrossMat = new THREE.MeshBasicMaterial({color:0xff2a1e, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false});
  const awpCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.002,0.06,0.001), awpCrossMat);
  awpCrossV.position.set(0,0.10,0.05-0.065); g.add(awpCrossV);
  const awpCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.002,0.001), awpCrossMat);
  awpCrossH.position.set(0,0.10,0.05-0.065); g.add(awpCrossH);
  const awpCrossDot = new THREE.Mesh(new THREE.SphereGeometry(0.003,8,8), awpCrossMat);
  awpCrossDot.position.set(0,0.10,0.05-0.065); g.add(awpCrossDot);
  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.10,0.07), gunDark);
  grip.position.set(0,-0.09,0.18); grip.rotation.x = 0.25; g.add(grip);
  // Trigger guard
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.022,0.006,8,12), gunDark);
  triggerGuard.position.set(0,-0.06,0.08); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Front sight
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.014,0.02,0.014), gunMetal);
  frontSight.position.set(0,0.08,-0.30); g.add(frontSight);
  return g;
}

function buildDeagle(){
  const g = new THREE.Group();
  // Large slide
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.10,0.08,0.38), gunSilver); slide.position.set(0,0.04,0); g.add(slide);
  // Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.06,0.34), gunDark); frame.position.set(0,-0.01,0.01); g.add(frame);
  // Long barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.20,10), gunMetal);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,0.04,-0.24); g.add(barrel);
  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.03,10), gunDark);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.04,-0.34); g.add(muzzle);
  // Large grip (angled)
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.20,0.10), gunDark);
  grip.position.set(0,-0.15,0.12); grip.rotation.x = 0.3; g.add(grip);
  // Magazine
  const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.07,12), gunLight);
  mag.position.set(0,-0.24,0.15); g.add(mag);
  // Trigger guard (large)
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.035,0.008,8,14), gunDark);
  triggerGuard.position.set(0,-0.07,0.03); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Trigger
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.014,0.035,0.014), gunLight);
  trigger.position.set(0,-0.06,0.03); g.add(trigger);
  // Hammer (large)
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.04,0.025), gunMetal);
  hammer.position.set(0,0.02,0.18); g.add(hammer);
  // === FRONT IRON SIGHT (raised blade post on the front of the slide, dark metal,
  //     aligned to the barrel centerline x=0 so ADS feels clean) ===
  // Low base plate the post rises out of
  const fsBase = new THREE.Mesh(new THREE.BoxGeometry(0.020,0.008,0.020), gunDark);
  fsBase.position.set(0,0.084,-0.16); g.add(fsBase);
  // Slim vertical blade post
  const fsBlade = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.030,0.010), gunDark);
  fsBlade.position.set(0,0.104,-0.16); g.add(fsBlade);
  // Small cap on the blade tip
  const fsTip = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.006,0.012), gunBlack);
  fsTip.position.set(0,0.122,-0.16); g.add(fsTip);
  // Lateral guard wings flanking the blade
  const fsWingL = new THREE.Mesh(new THREE.BoxGeometry(0.005,0.016,0.008), gunDark);
  fsWingL.position.set(-0.011,0.098,-0.16); g.add(fsWingL);
  const fsWingR = new THREE.Mesh(new THREE.BoxGeometry(0.005,0.016,0.008), gunDark);
  fsWingR.position.set(0.011,0.098,-0.16); g.add(fsWingR);

  // === REAR IRON SIGHT (notched block on the rear of the slide, dark metal,
  //     central notch aligned to the barrel centerline x=0) ===
  // Rear sight body: a low, wide plate near the rear of the slide
  const rsBody = new THREE.Mesh(new THREE.BoxGeometry(0.040,0.016,0.024), gunDark);
  rsBody.position.set(0,0.088,0.14); g.add(rsBody);
  // Central notch (dark recess visible through the gap)
  const rsNotch = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.014,0.020), gunBlack);
  rsNotch.position.set(0,0.096,0.14); g.add(rsNotch);
  // Two thin ears flanking the notch (the U-shape walls)
  const rsEarL = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.018,0.020), gunDark);
  rsEarL.position.set(-0.010,0.094,0.14); g.add(rsEarL);
  const rsEarR = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.018,0.020), gunDark);
  rsEarR.position.set(0.010,0.094,0.14); g.add(rsEarR);
  // Thin top bridge over the notch (closes the U at the top)
  const rsBridge = new THREE.Mesh(new THREE.BoxGeometry(0.030,0.004,0.018), gunDark);
  rsBridge.position.set(0,0.104,0.14); g.add(rsBridge);
  // Serration ridges on the ears (2 each)
  for(let i=0;i<2;i++){
    const serrL = new THREE.Mesh(new THREE.BoxGeometry(0.007,0.003,0.004), gunBlack);
    serrL.position.set(-0.010,0.088+i*0.006,0.14); g.add(serrL);
    const serrR = new THREE.Mesh(new THREE.BoxGeometry(0.007,0.003,0.004), gunBlack);
    serrR.position.set(0.010,0.088+i*0.006,0.14); g.add(serrR);
  }
  // Slide serrations
  for(let i=0;i<4;i++){
    const serr = new THREE.Mesh(new THREE.BoxGeometry(0.102,0.005,0.01), gunDark);
    serr.position.set(0,0.04,0.08+i*0.02); g.add(serr);
  }
  // Gold accents
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(0.025,0.004,8,16), gunGold);
  goldRing.position.set(0,0.04,-0.30); goldRing.rotation.x = Math.PI/2; g.add(goldRing);
  return g;
}

function buildMinigun(){
  const g = new THREE.Group();
  // Main body (large)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.14,0.55), gunSteel); body.position.set(0,0,0); g.add(body);
  // Top housing
  const topHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,0.40), gunDark);
  topHousing.position.set(0,0.10,0); g.add(topHousing);
  // 6 barrel cluster (hexagonal arrangement)
  const barrelPositions = [
    [0, 0.03], [0.026, 0.015], [0.026, -0.015],
    [0, -0.03], [-0.026, -0.015], [-0.026, 0.015]
  ];
  barrelPositions.forEach(bp => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.45,8), gunMetal);
    barrel.rotation.x = Math.PI/2;
    barrel.position.set(bp[0], bp[1]+0.02, -0.35);
    g.add(barrel);
    // Muzzle
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.02,8), gunDark);
    muzzle.rotation.x = Math.PI/2;
    muzzle.position.set(bp[0], bp[1]+0.02, -0.58);
    g.add(muzzle);
  });
  // Barrel shroud
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.30,12,1,true), gunDark);
  shroud.rotation.x = Math.PI/2; shroud.position.set(0,0.02,-0.35); g.add(shroud);
  // Magazine drum (large, on the side)
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.12,16), gunDark);
  drum.rotation.z = Math.PI/2; drum.position.set(0.10,-0.05,0.10); g.add(drum);
  // Drum cap
  const drumCap = new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,0.02,16), gunMetal);
  drumCap.rotation.z = Math.PI/2; drumCap.position.set(0.165,-0.05,0.10); g.add(drumCap);
  // Stock (large)
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.25), gunSteel);
  stock.position.set(0,-0.03,0.35); g.add(stock);
  const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.125,0.13,0.04), gunDark);
  stockPad.position.set(0,-0.03,0.48); g.add(stockPad);
  // Grip (large)
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.15,0.10), gunDark);
  grip.position.set(0,-0.13,0.18); grip.rotation.x = 0.3; g.add(grip);
  // Trigger guard (large)
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.035,0.008,8,14), gunDark);
  triggerGuard.position.set(0,-0.08,0.06); triggerGuard.rotation.x = Math.PI/2; g.add(triggerGuard);
  // Side panels
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.005,0.10,0.40), gunDark);
  sideL.position.set(-0.072,0,0); g.add(sideL);
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.005,0.10,0.40), gunDark);
  sideR.position.set(0.072,0,0); g.add(sideR);
  // Cooling vents
  for(let i=0;i<3;i++){
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.004,0.04,0.02), gunDark);
    vent.position.set(-0.073,0.02,-0.10+i*0.08); g.add(vent);
    const vent2 = new THREE.Mesh(new THREE.BoxGeometry(0.004,0.04,0.02), gunDark);
    vent2.position.set(0.073,0.02,-0.10+i*0.08); g.add(vent2);
  }
  return g;
}

function buildRPG(){
  const g = new THREE.Group();
  // Long dark tube (main body)
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.9,16), gunDark);
  tube.rotation.x = Math.PI/2; tube.position.set(0,0.02,0); g.add(tube);
  // Muzzle ring (front)
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,0.05,16), gunMetal);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0,0.02,-0.46); g.add(muzzle);
  // Rocket visible in the tube (slightly smaller, lighter, near front)
  const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.55,12), gunLight);
  rocket.rotation.x = Math.PI/2; rocket.position.set(0,0.02,-0.12); g.add(rocket);
  const rocketTip = new THREE.Mesh(new THREE.ConeGeometry(0.045,0.12,12), gunMetal);
  rocketTip.rotation.x = Math.PI/2; rocketTip.position.set(0,0.02,-0.44); g.add(rocketTip);
  // Wooden stock at the back
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.12,0.28), gunWood);
  stock.position.set(0,-0.02,0.32); g.add(stock);
  const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.13,0.04), gunDark);
  stockPad.position.set(0,-0.02,0.46); g.add(stockPad);
  // Grip (angled)
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.16,0.09), gunDark);
  grip.position.set(0,-0.13,0.16); grip.rotation.x = 0.3; g.add(grip);
  // Trigger guard
  const tg = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.02,0.03), gunDark);
  tg.position.set(0,-0.07,0.05); g.add(tg);
  // Side rail / strap detail
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.02,0.02,0.5), gunMetal);
  rail.position.set(0,0.075,0); g.add(rail);
  return g;
}
const weaponModels = {
  pistol: buildPistol(),
  smg: buildSMG(),
  shotgun: buildShotgun(),
  rifle: buildRifle(),
  doubleShotgun: buildDoubleShotgun(),
  uzi: buildUzi(),
  m4a1: buildM4A1(),
  awp: buildAWP(),
  deagle: buildDeagle(),
  minigun: buildMinigun(),
  rpg: buildRPG()
};

// Scale weapon models for first-person view
Object.values(weaponModels).forEach(model => {
  model.scale.setScalar(1.5);
});

// Muzzle flash (single instance)
const flashMat = new THREE.MeshBasicMaterial({color:0xffd27a, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false});
const flash = new THREE.Mesh(new THREE.SphereGeometry(0.06,8,8), flashMat);
flash.position.set(0,0.035,-0.30); flash.visible=false; gun.add(flash);
// Bright muzzle flash sprite
const flashTex = new THREE.CanvasTexture((function(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32,32,0,32,32,32);
  grd.addColorStop(0,'rgba(255,240,200,1)');
  grd.addColorStop(0.3,'rgba(255,200,120,0.8)');
  grd.addColorStop(1,'rgba(255,150,50,0)');
  g.fillStyle = grd; g.fillRect(0,0,64,64);
  return c;
})());
const flashSpriteMat = new THREE.SpriteMaterial({map:flashTex, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false});
const flashSprite = new THREE.Sprite(flashSpriteMat);
flashSprite.position.set(0,0.035,-0.32);
flashSprite.scale.set(0.25,0.25,1);
flashSprite.visible = false;
gun.add(flashSprite);
const flashLight = new THREE.PointLight(0xffd27a, 0, 8, 2);
flashLight.position.set(0,0.035,-0.30); gun.add(flashLight);

// Player flashlight
const flashlight = new THREE.SpotLight(0xfff5e0, 1.5, 15, Math.PI/3, 0.3, 1);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(512,512);
flashlight.position.set(0,0,0);
flashlight.target.position.set(0,0,-1);
camera.add(flashlight);
camera.add(flashlight.target);
scene.add(camera);
