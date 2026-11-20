"use strict";
// Dead Hold: the map: terrain, objects, colliders, lights
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ WORLD ============================ */
const HALF = 15;
const colliders = []; // {minX,maxX,minZ,maxZ}
function addCollider(x,z,hw,hd,h){ colliders.push({minX:x-hw,maxX:x+hw,minZ:z-hd,maxZ:z+hd,height:h||1.5}); }

/* ---- Canvas texture generators (256x256) ---- */
function makeTex(draw, rx, ry){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  draw(g, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx||1, ry||1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function texWall(){
  return makeTex(function(g,s){
    g.fillStyle='#5a9a4a'; g.fillRect(0,0,s,s);
    // grass blades
    g.strokeStyle='#6ab050'; g.lineWidth=1;
    for(let i=0;i<120;i++){ const x=Math.random()*s, y=Math.random()*s; g.beginPath(); g.moveTo(x,y); g.lineTo(x+1,y-3); g.stroke(); }
    for(let i=0;i<40;i++){
      g.fillStyle='rgba(106,106,122,'+(0.15+Math.random()*0.3)+')';
      const r=8+Math.random()*30;
      g.beginPath(); g.arc(Math.random()*s,Math.random()*s,r,0,7); g.fill();
    }
    g.strokeStyle='rgba(90,90,106,0.5)'; g.lineWidth=1;
    for(let i=0;i<14;i++){
      g.beginPath();
      let x=Math.random()*s, y=Math.random()*s; g.moveTo(x,y);
      for(let j=0;j<6;j++){ x+=(Math.random()-0.5)*40; y+=(Math.random()-0.5)*40; g.lineTo(x,y); }
      g.stroke();
    }
    g.strokeStyle='rgba(70,70,86,0.45)'; g.lineWidth=2;
    for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64,s); g.stroke(); g.beginPath(); g.moveTo(0,i*64); g.lineTo(s,i*64); g.stroke(); }
  },2,2);
}
function texFloor(){
  return makeTex(function(g,s){
    // bright green golf-course grass
    g.fillStyle='#5fbf4a'; g.fillRect(0,0,s,s);
    g.fillStyle='#6fd058';
    for(let i=0;i<160;i++){ g.fillRect(Math.random()*s, Math.random()*s, 2, 2); }
    g.fillStyle='#4fa83c';
    for(let i=0;i<120;i++){ g.fillRect(Math.random()*s, Math.random()*s, 2, 2); }
    // subtle mowing stripes
    g.fillStyle='rgba(255,255,255,0.05)';
    for(let i=0;i<s;i+=16){ g.fillRect(0,i,s,8); }
    for(let i=0;i<50;i++){
      g.fillStyle='rgba(90,90,106,'+(0.15+Math.random()*0.35)+')';
      const r=4+Math.random()*22;
      g.beginPath(); g.arc(Math.random()*s,Math.random()*s,r,0,7); g.fill();
    }
    g.strokeStyle='rgba(106,106,122,0.5)'; g.lineWidth=1;
    for(let i=0;i<24;i++){
      const x=Math.random()*s, y=Math.random()*s, a=Math.random()*Math.PI;
      g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*30, y+Math.sin(a)*30); g.stroke();
    }
    g.strokeStyle='rgba(60,60,74,0.4)'; g.lineWidth=1;
    for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64,s); g.stroke(); g.beginPath(); g.moveTo(0,i*64); g.lineTo(s,i*64); g.stroke(); }
  },16,16);
}
function texCrate(){
  // sand bunker texture (light tan/yellow)
  return makeTex(function(g,s){
    g.fillStyle='#e8d5a0'; g.fillRect(0,0,s,s);
    g.fillStyle='#f0e0b0';
    for(let i=0;i<60;i++){ g.beginPath(); g.arc(Math.random()*s, Math.random()*s, 3, 0, Math.PI*2); g.fill(); }
    g.fillStyle='#d8c488';
    for(let i=0;i<40;i++){ g.beginPath(); g.arc(Math.random()*s, Math.random()*s, 2, 0, Math.PI*2); g.fill(); }
    for(let i=0;i<6;i++){
      const y=i*42;
      g.fillStyle='rgba(106,74,42,0.9)'; g.fillRect(0,y,s,3);
      g.fillStyle='rgba(138,106,58,'+(0.2+Math.random()*0.3)+')'; g.fillRect(0,y+3,s,39);
    }
    g.fillStyle='rgba(74,58,26,0.9)';
    for(let i=0;i<40;i++){ g.beginPath(); g.arc(Math.random()*s,Math.random()*s,1.5,0,7); g.fill(); }
    g.save(); g.translate(s/2,s/2); g.rotate(-0.05);
    g.fillStyle='rgba(60,44,20,0.85)'; g.font='bold 34px monospace'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText('SUPPLIES',0,0);
    g.restore();
  },1,1);
}
function texBarrel(){
  // sand bunker texture (slightly darker tan)
  return makeTex(function(g,s){
    g.fillStyle='#dcc48c'; g.fillRect(0,0,s,s);
    g.fillStyle='#e8d5a0';
    for(let i=0;i<40;i++){ g.beginPath(); g.arc(Math.random()*s, Math.random()*s, 4, 0, Math.PI*2); g.fill(); }
    g.fillStyle='#c8b078';
    for(let i=0;i<30;i++){ g.beginPath(); g.arc(Math.random()*s, Math.random()*s, 2, 0, Math.PI*2); g.fill(); }
    for(let i=0;i<26;i++){
      g.fillStyle='rgba(138,74,42,'+(0.25+Math.random()*0.4)+')';
      const r=6+Math.random()*20;
      g.beginPath(); g.arc(Math.random()*s,Math.random()*s,r,0,7); g.fill();
    }
    g.fillStyle='#aaaa2a'; g.fillRect(0,s*0.42,s,s*0.16);
    g.fillStyle='rgba(40,40,40,0.5)';
    for(let i=0;i<10;i++){ g.fillRect(0,s*0.42+i*2,s,1); }
    g.fillStyle='rgba(74,74,74,0.9)';
    for(let i=0;i<30;i++){ g.beginPath(); g.arc(Math.random()*s,Math.random()*s,1.5,0,7); g.fill(); }
  },1,1);
}
function texCeiling(){
  // clear blue sky with white clouds
  return makeTex(function(g,s){
    const grd = g.createLinearGradient(0,0,0,s);
    grd.addColorStop(0,'#4a90d9'); grd.addColorStop(1,'#a8d8f0');
    g.fillStyle=grd; g.fillRect(0,0,s,s);
    // white clouds
    g.fillStyle='rgba(255,255,255,0.9)';
    for(let c=0;c<5;c++){
      const cx=Math.random()*s, cy=Math.random()*s*0.6, r=10+Math.random()*14;
      for(let b=0;b<6;b++){ g.beginPath(); g.arc(cx+(b-2.5)*r*0.5, cy+(Math.random()-0.5)*r*0.4, r*(0.6+Math.random()*0.4), 0, Math.PI*2); g.fill(); }
    }
    for(let i=0;i<5;i++){
      const cx=Math.random()*s, cy=Math.random()*s*0.5, r=20+Math.random()*15;
      g.beginPath(); g.ellipse(cx,cy,r,r*0.6,0,0,Math.PI*2); g.fill();
      g.beginPath(); g.ellipse(cx-r*0.5,cy+r*0.2,r*0.7,r*0.5,0,0,Math.PI*2); g.fill();
      g.beginPath(); g.ellipse(cx+r*0.5,cy+r*0.1,r*0.8,r*0.5,0,0,Math.PI*2); g.fill();
    }
    for(let i=0;i<12;i++){
      const x=Math.random()*s, y=Math.random()*s;
      g.fillRect(x,y,18,10);
      g.strokeStyle='rgba(58,61,65,0.9)'; g.lineWidth=1;
      for(let j=1;j<4;j++){ g.beginPath(); g.moveTo(x,y+j*2.5); g.lineTo(x+18,y+j*2.5); g.stroke(); }
    }
  },2,2);
}

const concrete = new THREE.MeshLambertMaterial({map:texWall(), visible:false}); // hedges (green walls removed)
const concreteDark = new THREE.MeshLambertMaterial({map:texFloor()}); // grass
const wood = new THREE.MeshLambertMaterial({map:texCrate()}); // sand bunker
const metal = new THREE.MeshLambertMaterial({map:texBarrel()}); // sand bunker
const ceilMat = new THREE.MeshLambertMaterial({map:texCeiling(), side:THREE.FrontSide}); // sky
const outerWallMat = new THREE.MeshLambertMaterial({map:texWall()}); // outer arena walls
/* Workbench "Upgrade All Attachments" button styles */
(function(){
  const st = document.createElement('style');
  st.textContent = '.wb-upgrade-btn{cursor:pointer;border:1px solid var(--accent);background:rgba(0,0,0,.25);color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.4px;padding:4px 8px;border-radius:4px;text-transform:uppercase;white-space:nowrap;transition:background .12s,transform .08s}.wb-upgrade-btn:hover:not(:disabled){background:var(--accent);color:#000}.wb-upgrade-btn:active:not(:disabled){transform:scale(.96)}.wb-upgrade-btn:disabled,.wb-upgrade-btn.locked,.wb-upgrade-btn.maxed{cursor:not-allowed;opacity:.55;border-color:var(--dim);color:var(--dim);background:rgba(0,0,0,.15)}.wb-upgrade-btn.maxed{border-color:var(--ok,#4caf50);color:var(--ok,#4caf50);opacity:.8}.wb-gp-sel{outline:2px solid #4cff4c !important;outline-offset:-2px;background:rgba(76,255,76,0.18) !important;box-shadow:0 0 12px rgba(76,255,76,0.45),inset 0 0 8px rgba(76,255,76,0.15);border-color:#4cff4c !important}';
  document.head.appendChild(st);
})();

function box(w,h,d,mat,x,y,z){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z); scene.add(m); return m;
}

// Floor — sized to extend well beyond the outer walls (±60) so the grass
// covers the ENTIRE playable area and beyond with no gaps or bare ground.
/* ---- Terrain heightmap: gentle rolling hills over the arena ---- */
const TERRAIN_SIZE = 160; // covers the whole arena + margin
const TERRAIN_RES = 64;   // grid resolution (64x64 vertices)
function terrainHeight(x, z){
  // Layered sine waves create smooth, natural-looking rolling hills
  // Exaggerated amplitudes for steeper, more dramatic slopes
  const h1 = Math.sin(x * 0.08) * Math.cos(z * 0.06) * 3.2;
  const h2 = Math.sin(x * 0.15 + 1.3) * Math.sin(z * 0.12 + 0.7) * 2.2;
  const h3 = Math.cos(x * 0.04 + 2.1) * Math.sin(z * 0.05 + 1.5) * 4.5;
  const h4 = Math.sin(x * 0.25 + 0.5) * Math.cos(z * 0.22 + 2.0) * 1.1;
  // Flatten near the center (workbench area) so it sits on stable ground
  const centerDist = Math.hypot(x, z);
  const flatten = Math.max(0, 1 - centerDist / 8);
  const raw = h1 + h2 + h3 + h4;
  return raw * (1 - flatten * 0.85);
}
// Build terrain geometry with vertex colors for subtle variation
const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_RES, TERRAIN_RES);
terrainGeo.rotateX(-Math.PI / 2);
const tPos = terrainGeo.attributes.position;
const tColors = new Float32Array(tPos.count * 3);
const grassBase = new THREE.Color(0x3a7a30);
const grassLight = new THREE.Color(0x5a9a48);
const grassDark = new THREE.Color(0x2a5a22);
for(let i = 0; i < tPos.count; i++){
  const x = tPos.getX(i), z = tPos.getZ(i);
  const h = terrainHeight(x, z);
  tPos.setY(i, h);
  // Color variation based on height: higher = lighter, lower = darker
  // Adjusted range for the steeper terrain (hills now span roughly -8 to +8)
  const t = Math.max(0, Math.min(1, (h + 8) / 16));
  const c = grassDark.clone().lerp(grassLight, t);
  tColors[i*3] = c.r; tColors[i*3+1] = c.g; tColors[i*3+2] = c.b;
}
terrainGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
terrainGeo.computeVertexNormals();
const terrainMat = new THREE.MeshLambertMaterial({vertexColors: true});
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
scene.add(terrain);
// Grass ring extends beyond the terrain for visual continuity
const grassRing = new THREE.Mesh(new THREE.PlaneGeometry(420,420), concreteDark);
grassRing.rotation.x = -Math.PI/2; grassRing.position.y = -3.5; scene.add(grassRing);
// Sky (inverted plane above)
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALF*2,HALF*2), ceilMat);
ceil.rotation.x = -Math.PI/2; ceil.position.y = 25; scene.add(ceil);

// Walls (with door gaps)
function wallSeg(x,z,thick,depth,rotY){
  const m = box(thick,4.2,depth,concrete,x,2.1,z);
  if(rotY) m.rotation.y = rotY;
  return m;
}
// Inner walls at ±45 removed: player can walk freely to the outer fence at ±60

// ============================ VISIBLE FENCE (border) ============================
// The player is clamped to +/-60 in resolveCollision(). This fence is a purely
// VISUAL barrier placed exactly on that boundary so the edge reads as a real
// fence instead of an invisible wall. It is NOT added to `colliders` (the
// existing boundary clamp already blocks movement), so it never changes gameplay.
// Low-poly flat-shaded boxes to match the rest of the scene.
// FENCE REMOVED (dead hold): the visible perimeter fence is no longer rendered.
// It was purely visual (never added to `colliders`), so no collision changes are
// needed — the player already moves freely to the map edge.



// Sand bunkers (low mounds) — obstacles, spread over the larger arena
const bunkerDefs = [
  [-18,-18,1.6,1.6,wood],[18,-12,1.8,1.8,metal],
  [-12,15,1.4,1.4,wood],[15,18,1.6,1.6,metal],
  [0,6,1.5,1.5,wood],[-24,24,1.6,1.6,metal],
  [24,0,1.4,1.4,wood],[6,-24,1.7,1.7,metal],
  [-30,10,1.5,1.5,wood],[30,-10,1.6,1.6,metal],
  [10,30,1.4,1.4,wood],[-10,-30,1.8,1.8,metal],
  [35,25,1.5,1.5,wood],[-35,-25,1.6,1.6,metal],
  [20,35,1.4,1.4,metal],[-20,-35,1.5,1.5,wood]
];
bunkerDefs.forEach(c=>{
  const s=c[2], h=s*0.5;
  const gy = terrainHeight(c[0], c[1]);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(s*0.6, s*0.85, h, 18), c[5]);
  m.position.set(c[0], gy + h/2, c[1]); scene.add(m);
  addCollider(c[0],c[1],s*0.6+0.2,s*0.6+0.2,h);
});
// Stylized trees (green canopy + brown trunk) scattered around the edges of the larger arena
const trunkMat = new THREE.MeshLambertMaterial({color:0x6b4a2a});
const canopyMat = new THREE.MeshLambertMaterial({color:0x3a8a30});
const treeDefs = [
  [-36,-36],[36,-36],[-36,36],[36,36],
  [-39,0],[39,0],[0,-39],[0,39],
  [-20,-20],[20,-20],[-20,20],[20,20],
  [-30,15],[30,15],[-15,-30],[15,30],
  [25,-25],[-25,25],[10,35],[-10,-35],
  [35,10],[-35,-10],[15,25],[-15,-25],
  // extra trees out toward the larger arena edges
  [-55,-55],[55,-55],[-55,55],[55,55],
  [-58,0],[58,0],[0,-58],[0,58],
  [-48,24],[48,24],[-48,-24],[48,-24],
  [24,48],[-24,48],[24,-48],[-24,-48],
  [-52,36],[52,36],[-52,-36],[52,-36]
];
treeDefs.forEach(p=>{
  const groundY = terrainHeight(p[0], p[1]);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,2.2,10), trunkMat);
  trunk.position.set(p[0], groundY + 1.1, p[1]); scene.add(trunk);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.6,2.6,12), canopyMat);
  canopy.position.set(p[0], groundY + 3.4, p[1]); scene.add(canopy);
  addCollider(p[0],p[1],0.5,0.5,4.2);
});

// Scattered small sand mounds, spread over the larger arena
const debrisMat = new THREE.MeshLambertMaterial({map:texCrate()});
const debrisDefs = [
  [-7.5,-9,0.5,0.4,0.6],[-9,10.5,0.4,0.3,0.5],[10.5,-15,0.6,0.5,0.7],
  [12,6,0.4,0.35,0.5],[-15,3,0.5,0.4,0.5],[3,19.5,0.45,0.3,0.55],
  [-3,-21,0.5,0.4,0.6],[19.5,9,0.4,0.3,0.5],
  [-25,-15,0.5,0.4,0.6],[25,15,0.4,0.3,0.5],[-15,25,0.6,0.5,0.7],
  [15,-25,0.4,0.35,0.5],[30,5,0.5,0.4,0.5],[-5,30,0.45,0.3,0.55],
  [5,-30,0.5,0.4,0.6],[-30,-5,0.4,0.3,0.5],[20,30,0.5,0.4,0.6],
  [-20,-30,0.4,0.3,0.5],[30,-20,0.6,0.5,0.7],[-30,20,0.4,0.35,0.5]
];
debrisDefs.forEach(d=>{
  const groundY = terrainHeight(d[0], d[1]);
  const m = box(d[2],d[3],d[4],debrisMat,d[0],groundY + d[3]/2,d[1]);
  m.rotation.y = Math.random()*Math.PI;
  // Low collision footprint so the player can jump over the debris
  addCollider(d[0],d[1],Math.max(d[2],d[4])/2+0.15,Math.max(d[2],d[4])/2+0.15,d[3]);
});

/* ============================ LIGHTS ============================ */
scene.add(new THREE.AmbientLight(0x8899aa, 3.2));
const hemi = new THREE.HemisphereLight(0x667788, 0x334455, 2.6); scene.add(hemi);

const flickerLights = [];
function makeLight(x,z,color,intensity){
  const l = new THREE.PointLight(color, intensity, 40, 2);
  l.castShadow = false;
  l.position.set(x,3.6,z); scene.add(l);
  // small bulb with emissive glow
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8), new THREE.MeshLambertMaterial({color:color, emissive:color, emissiveIntensity:1.5}));
  bulb.position.copy(l.position); scene.add(bulb);
  flickerLights.push({light:l, base:intensity, phase:Math.random()*10, next:0});
  return l;
}
makeLight(-6,-6,0xffb36b,7.0);
makeLight(6,4,0xffd27a,7.0);
