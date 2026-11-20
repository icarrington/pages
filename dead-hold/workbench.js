"use strict";
// Dead Hold: the workbench shop, attachments, upgrades and its menus
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ WORKBENCH ============================ */
const wbGroup = new THREE.Group();
const wbWoodMat = new THREE.MeshLambertMaterial({color:0x6b4a2a});
const wbWoodDark = new THREE.MeshLambertMaterial({color:0x4a3320});
// Workbench position: center of arena, in front of player spawn (0,0,0)
// Placed at (0, 0, 5) so it's immediately visible when the game starts
const WB = {x:0, z:5};
const WB_GROUND_Y = terrainHeight(WB.x, WB.z);
const wbMetalMat = new THREE.MeshLambertMaterial({color:0x555c66});
const wbMetalDark = new THREE.MeshLambertMaterial({color:0x33383f});
const wbToolMat = new THREE.MeshLambertMaterial({color:0x8890a0});
const wbLampMat = new THREE.MeshLambertMaterial({color:0x222a30});
const wbLampGlow = new THREE.MeshLambertMaterial({color:0xfff2c0, emissive:0xffd98a, emissiveIntensity:2.5});
const wbSignMat = new THREE.MeshLambertMaterial({color:0x1a2a12, emissive:0x2a4a1a, emissiveIntensity:0.6});
// Table top — 3 units wide, 1.5 deep, 1 unit tall (top at y=1.0)
const wbTop = new THREE.Mesh(new THREE.BoxGeometry(3.0,0.12,1.5), wbWoodMat); wbTop.position.set(0,0.94,0); wbGroup.add(wbTop);
// Table legs (4) — positioned at corners of the 3x1.5 table
[[-1.35,-0.6],[1.35,-0.6],[-1.35,0.6],[1.35,0.6]].forEach(l=>{
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.9,0.12), wbWoodDark);
  leg.position.set(l[0],0.45,l[1]); wbGroup.add(leg);
});
// Lower shelf
const wbShelf = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.06,1.0), wbWoodDark); wbShelf.position.set(0,0.35,0); wbGroup.add(wbShelf);
// Metal vise (right side)
const wbViseBase = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.18,0.3), wbMetalMat); wbViseBase.position.set(0.7,1.0,0.2); wbGroup.add(wbViseBase);
const wbViseJaw1 = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.3,0.22), wbMetalDark); wbViseJaw1.position.set(0.7,1.2,0.12); wbGroup.add(wbViseJaw1);
const wbViseJaw2 = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.3,0.22), wbMetalDark); wbViseJaw2.position.set(0.7,1.2,0.28); wbGroup.add(wbViseJaw2);
const wbViseScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.3,8), wbToolMat); wbViseScrew.rotation.x = Math.PI/2; wbViseScrew.position.set(0.7,1.2,0.2); wbGroup.add(wbViseScrew);
// Hanging work lamp (left side, on a stand)
const wbLampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.4,8), wbMetalDark); wbLampPole.position.set(-0.8,1.6,-0.3); wbGroup.add(wbLampPole);
const wbLampArm = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.06,0.06), wbMetalDark); wbLampArm.position.set(-0.55,2.25,-0.15); wbLampArm.rotation.z = 0.3; wbGroup.add(wbLampArm);
const wbLampShade = new THREE.Mesh(new THREE.ConeGeometry(0.18,0.2,12,1,true), wbLampMat); wbLampShade.position.set(-0.35,2.15,0); wbLampShade.rotation.z = 0.4; wbGroup.add(wbLampShade);
const wbLampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.1,10,10), wbLampGlow); wbLampBulb.position.set(-0.35,2.05,0); wbGroup.add(wbLampBulb);
// Scattered tools: wrench (L-shape)
const wbWrench1 = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.06), wbToolMat); wbWrench1.position.set(-0.2,0.98,0.1); wbWrench1.rotation.y = 0.4; wbGroup.add(wbWrench1);
const wbWrench2 = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.2), wbToolMat); wbWrench2.position.set(-0.35,0.98,0.15); wbGroup.add(wbWrench2);
// Hammer (head + handle)
const wbHammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.06,0.08), wbMetalMat); wbHammerHead.position.set(0.4,1.02,0.3); wbGroup.add(wbHammerHead);
const wbHammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.2,8), wbWoodMat); wbHammerHandle.rotation.z = Math.PI/2; wbHammerHandle.position.set(0.52,1.0,0.3); wbGroup.add(wbHammerHandle);
// Screwdriver
const wbScrew1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.25,8), wbToolMat); wbScrew1.rotation.z = Math.PI/2; wbScrew1.position.set(0.1,0.98,-0.15); wbGroup.add(wbScrew1);
const wbScrew2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.08,8), wbMetalDark); wbScrew2.rotation.z = Math.PI/2; wbScrew2.position.set(0.22,0.98,-0.15); wbGroup.add(wbScrew2);
// Small "WORKBENCH" sign (emissive plane)
const wbSignTex = new THREE.CanvasTexture((function(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#1a2a12'; g.fillRect(0,0,256,64);
  g.fillStyle = '#c8ff4d'; g.font = 'bold 30px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('WORKBENCH', 128, 32);
  return c;
})());
const wbSignMat2 = new THREE.MeshLambertMaterial({map:wbSignTex, emissive:0x334422, emissiveIntensity:0.8});
const wbSign = new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.45), wbSignMat2); wbSign.position.set(0,1.6,0.78); wbGroup.add(wbSign);
// Warm point light for the workbench
wbGroup.position.set(WB.x, WB_GROUND_Y, WB.z);
scene.add(wbGroup);
const wbLight = new THREE.PointLight(0xffd98a, 12.0, 15, 2);
wbLight.castShadow = false;
wbLight.position.set(0, 2.2, 0);
wbGroup.add(wbLight);
wbGroup.position.set(WB.x, 0, WB.z);
// Workbench collider — placed at (0,0,5), in front of player spawn (0,1.7,0)
// The table is 3 units wide, 1.5 deep, 1 unit tall
addCollider(0, 5, 1.5, 0.75, 1.0);
scene.add(wbGroup);

// Golf flag landmark — placed at (-30, -30), visible from spawn, in an open spot
const flagPoleMat = new THREE.MeshLambertMaterial({color:0xcccccc});
const flagGroundY = terrainHeight(-10, -10);
const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,4,8), flagPoleMat);
flagPole.position.set(-10, flagGroundY + 2, -10); scene.add(flagPole);
const flagMat = new THREE.MeshLambertMaterial({color:0xff3333, side:THREE.DoubleSide});
const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.5), flagMat);
flag.position.set(-9.6, flagGroundY + 3.7, -10); flag.rotation.y = Math.PI/4; scene.add(flag);
const flagBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,0.15,12), new THREE.MeshLambertMaterial({color:0x3a8a30}));
flagBase.position.set(-30,0.075,-30); scene.add(flagBase);
// Workbench attachment state: { weaponName: { redDot, extMag, suppressor, vGrip } }
const wbAttachments = {};
function wbGet(w){ if(!wbAttachments[w]) wbAttachments[w] = {redDot:false, extMag:false, suppressor:false, vGrip:false}; return wbAttachments[w]; }
// NOTE: all per-weapon attachment effects are nerfed ~40% (see the getters below and the
// extMag multiplier in refillMag/startReload/updateHUD/addWeapon).
let wbMenuOpen = false;
let wbNear = false;
const WB_ATTACH_DEFS = [
  {key:'redDot', name:'Red Dot Sight', cost:100, desc:'Rail-mounted optic with precise ADS reticle'},
  {key:'extMag', name:'Extended Magazine', cost:150, desc:'+50% max ammo'},
  {key:'suppressor', name:'Suppressor', cost:200, desc:'Smaller muzzle flash, quieter'},
  {key:'vGrip', name:'Vertical Grip', cost:250, desc:'-30% recoil spread'}
];

// Player stat upgrades (multi-level)
const WB_STAT_UPGRADES = [
  {key:'defense', name:'Defense Plating', baseCost:240, costMult:1.5, maxLevel:5, desc:'-6% damage taken per level'},
  {key:'speed', name:'Speed Boost', baseCost:300, costMult:1.5, maxLevel:5, desc:'+4.8% movement speed per level'},
  {key:'damage', name:'Damage Boost', baseCost:360, costMult:1.6, maxLevel:5, desc:'+9% weapon damage per level'},
  {key:'fireRate', name:'Fire Rate', baseCost:300, costMult:1.6, maxLevel:5, desc:'+7.2% trigger speed per level'},
  {key:'magSize', name:'Mag Size', baseCost:270, costMult:1.5, maxLevel:5, desc:'+1 round per level'},
  {key:'reloadSpeed', name:'Reload Speed', baseCost:240, costMult:1.5, maxLevel:5, desc:'-7.2% reload time per level'},
  {key:'headshot', name:'Headshot Bonus', baseCost:450, costMult:1.7, maxLevel:5, desc:'+0.6x headshot multiplier per level (base 2x)'},
  {key:'critChance', name:'Crit Chance', baseCost:390, costMult:1.6, maxLevel:5, desc:'+4.8% crit chance per level (2x damage)'},
  {key:'maxHealth', name:'Max Health', baseCost:300, costMult:1.5, maxLevel:5, desc:'+12 max HP per level'},
  {key:'regen', name:'Regen', baseCost:270, costMult:1.5, maxLevel:5, desc:'+2.4 HP/s regen per level'},
  {key:'armor', name:'Armor', baseCost:330, costMult:1.6, maxLevel:5, desc:'-1.8 flat damage per level'},
  {key:'staminaPool', name:'Stamina Pool', baseCost:240, costMult:1.5, maxLevel:5, desc:'+12 max stamina per level'},
  {key:'staminaRegen', name:'Stamina Regen', baseCost:210, costMult:1.5, maxLevel:5, desc:'+3 stamina/s regen per level'},
  {key:'pointMult', name:'Point Multiplier', baseCost:420, costMult:1.6, maxLevel:5, desc:'+12% points per kill per level'},

  {key:'discount', name:'Workbench Discount', baseCost:600, costMult:1.8, maxLevel:5, desc:'-6% upgrade cost per level'},
  {key:'startAmmo', name:'Starting Ammo', baseCost:300, costMult:1.5, maxLevel:5, desc:'+0.6 extra magazine per level'},
  {key:'zombieSlow', name:'Zombie Slow', baseCost:390, costMult:1.6, maxLevel:5, desc:'-6% zombie speed per level'},
  {key:'grenade', name:'Grenade Count', baseCost:480, costMult:1.7, maxLevel:5, desc:'+0.6 grenade per wave per level'},
  {key:'medkit', name:'Medkit Count', baseCost:450, costMult:1.7, maxLevel:5, desc:'+0.6 medkit per wave per level'},
  {key:'spawnShield', name:'Spawn Shield', baseCost:540, costMult:1.8, maxLevel:5, desc:'+0.3s invulnerability after hit per level'}
];
const statUpgrades = {defense:0, speed:0, damage:0, fireRate:0, magSize:0, reloadSpeed:0, headshot:0, critChance:0, maxHealth:0, regen:0, armor:0, staminaPool:0, staminaRegen:0, pointMult:0, discount:0, startAmmo:0, zombieSlow:0, grenade:0, medkit:0, spawnShield:0};
function getUpgradeCost(def, level){
  let cost = Math.floor(def.baseCost * Math.pow(def.costMult, level));
  const disc = statUpgrades.discount * 0.10;
  cost = Math.floor(cost * (1 - disc));
  return Math.max(1, cost);
}
// NOTE: every per-level effect below is nerfed ~40% (e.g. 0.10 -> 0.06, 0.15 -> 0.09, 2 -> 1, 0.12 -> 0.07, 20 -> 12, 4 -> 2.4, 3 -> 1.8, 5 -> 3, 0.20 -> 0.12).
function getDefenseReduction(){ return statUpgrades.defense * 0.036; }
function getSpeedMultiplier(){ return 1 + statUpgrades.speed * 0.0288; }
function getDamageMultiplier(){ return 1 + statUpgrades.damage * 0.054; }
function getFireRateMultiplier(){ return 1 + statUpgrades.fireRate * 0.0432; }
function getMagSizeBonus(){ return statUpgrades.magSize * 0.6; }
function getReloadSpeedMultiplier(){ return Math.max(0.2, 1 - statUpgrades.reloadSpeed * 0.0432); }
function getHeadshotMultiplier(){ return 2 + statUpgrades.headshot * 0.36; }
function getCritChance(){ return statUpgrades.critChance * 0.0288; }
function getMaxHealth(){ return 100 + statUpgrades.maxHealth * 7.2; }
function getRegenRate(){ return 10 + statUpgrades.regen * 1.44; }
function getArmorReduction(){ return statUpgrades.armor * 1.08; }
function getMaxStamina(){ return 100 + statUpgrades.staminaPool * 7.2; }
function getStaminaRegenRate(){ return 15 + statUpgrades.staminaRegen * 1.8; }
function getPointMultiplier(){ return 1 + statUpgrades.pointMult * 0.072; }

function getZombieSlowMultiplier(){ return Math.max(0.2, 1 - statUpgrades.zombieSlow * 0.036); }
function getGrenadeCount(){ return statUpgrades.grenade * 0.6; }
function getMedkitCount(){ return statUpgrades.medkit * 0.6; }
function getSpawnShieldDuration(){ return statUpgrades.spawnShield * 0.3; }
function getStartAmmoBonus(){ return statUpgrades.startAmmo * 0.6; }
function weaponIcon(w){
  const icons = {
    pistol:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M3 8h13v3H9l-1 6H5l1-6H3z"/></svg>',
    smg:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M2 9h16v3H8l-1 5H5l1-5H2z"/></svg>',
    shotgun:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M1 8h20v3H7l-1 6H4l1-6H1z"/></svg>',
    rifle:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M1 9h21v2H8l-1 5H5l1-5H1z"/></svg>',
    doubleShotgun:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M1 7h20v2H7l-1 6H4l1-6H1zM1 11h20v2H7l-1 6H4l1-6H1z"/></svg>',
    uzi:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M4 8h12v3H9l-1 6H6l1-6H4z"/></svg>',
    m4a1:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M1 9h21v2H8l-1 5H5l1-5H1z"/></svg>',
    awp:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M1 10h21v2H8l-1 5H5l1-5H1z"/><rect x="9" y="6" width="6" height="3" rx="1"/></svg>',
    deagle:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M3 7h14v4H9l-1 7H5l1-7H3z"/></svg>',
    minigun:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M2 8h18v2H8l-1 5H5l1-5H2zM2 11h18v2H8l-1 5H5l1-5H2z"/></svg>',
    rpg:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-2px;margin-right:6px;flex:none"><path d="M2 9h19v3H8l-1 5H5l1-5H2z"/><path d="M21 9l2 1.5L21 12z"/></svg>'
  };
  return icons[w] || '';
}
function wbToggleMenu(){
  if(!state.running) return;
  if(wbMenuOpen){ wbCloseMenu(); }
  else if(wbNear){ wbOpenMenu(); }
}
function wbOpenMenu(){
  // Rebuild + reset the gamepad/keyboard nav cursor to the first row on open.
  wbNavReset();
  wbNavBuild();
  wbNavApply();
  wbMenuOpen = true;
  state.running = false;
  if(document.pointerLockElement === canvas) document.exitPointerLock();
  wbNavReset();
  const w = activeWeapon;
  const att = wbGet(w);
  const cap = MAGS[w];
  
  // Weapon purchase rows
  const WEAPON_PRICES = {
    pistol: 0, // free, always owned
    smg: 450,
    shotgun: 600,
    rifle: 750,
    uzi: 540,
    m4a1: 900,
    awp: 1200,
    deagle: 660,
    minigun: 1500,
    rpg: 1050,
    doubleShotgun: 840
  };
  
  let weaponRowsHTML = '';
  const allWeapons = ['smg','shotgun','rifle','uzi','m4a1','awp','deagle','minigun','rpg','doubleShotgun'];
  const AMMO_COST = 150; // Cost for a full magazine of ammo (doubled)
  // Cost to install ALL missing attachments on one weapon at once (flat, fair price)
  const UPGRADE_COST = 750; // doubled
  for(const w of allWeapons){
    const owned = isOwned(w);
    const cost = WEAPON_PRICES[w] || 200;
    const canBuy = !owned && state.points >= cost;
    const cls = owned ? 'wb-row owned' : (canBuy ? 'wb-row avail' : 'wb-row poor');
    let right;
    if(owned){
      const canBuyAmmo = state.points >= AMMO_COST;
      right = '<span class="wb-cost" style="color:var(--accent)">AMMO: '+AMMO_COST+' pts</span>';
    } else {
      right = (canBuy ? '<span class="wb-cost">'+cost+' pts</span>' : '<span class="wb-cost">Need '+(cost-state.points)+' more pts</span>');
    }
    const wname = {smg:'SMG',shotgun:'Shotgun',rifle:'Rifle',uzi:'Uzi',m4a1:'M4A1',awp:'AWP',deagle:'Deagle',minigun:'Minigun',rpg:'RPG-7',doubleShotgun:'Double Shotgun'}[w] || w;
    const desc = owned ? 'Buy a full magazine of ammo' : 'Purchase this weapon';
    // Determine upgrade state for owned weapons: how many attachments are still missing
    let upgradeBtn = '';
    if(owned){
      const att = wbGet(w);
      const missing = WB_ATTACH_DEFS.filter(d=>!att[d.key]);
      if(missing.length === 0){
        upgradeBtn = '<button class="wb-upgrade-btn maxed" disabled>MAXED ✓</button>';
      } else {
        const canUpg = state.points >= UPGRADE_COST;
        upgradeBtn = '<button class="wb-upgrade-btn '+(canUpg?'':'locked')+'" data-upgrade="'+w+'" '+(canUpg?'':'disabled')+'>'+(canUpg?('UPGRADE ALL: '+UPGRADE_COST+' pts'):('Need '+(UPGRADE_COST-state.points)+' more'))+'</button>';
      }
    }
    weaponRowsHTML += '<div class="'+cls+'" data-weapon="'+w+'"><div class="wb-name" style="display:flex;align-items:center">'+weaponIcon(w)+wname+'</div><div class="wb-desc">'+desc+'</div><div class="wb-right" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'+right+upgradeBtn+'</div></div>';
  }
  
  // Stat upgrade rows grouped by category
  const categories = [
    {name:'COMBAT', keys:['damage','fireRate','magSize','reloadSpeed','headshot','critChance']},
    {name:'SURVIVAL', keys:['maxHealth','regen','armor','staminaPool','staminaRegen']},
    {name:'ECONOMY / META', keys:['pointMult','discount','startAmmo']},
    {name:'WILDCARD', keys:['zombieSlow','grenade','medkit','spawnShield']}
  ];
  
  let statRowsHTML = '';
  for(const cat of categories){
    let catRows = '';
    for(const key of cat.keys){
      const def = WB_STAT_UPGRADES.find(d=>d.key===key);
      if(!def) continue;
      const level = statUpgrades[def.key];
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : getUpgradeCost(def, level);
      const canBuy = !maxed && state.points >= cost;
      const cls = maxed ? 'wb-row owned' : (canBuy ? 'wb-row avail' : 'wb-row poor');
      const right = maxed ? '<span class="wb-check">MAXED ✓</span>' : (canBuy ? '<span class="wb-cost">'+cost+' pts</span>' : '<span class="wb-cost">Need '+(cost-state.points)+' more pts</span>');
      const levelText = 'Lv.' + level + '/' + def.maxLevel;
      catRows += '<div class="'+cls+'" data-statkey="'+def.key+'"><div class="wb-name">'+def.name+' <span style="color:var(--dim);font-size:11px">'+levelText+'</span></div><div class="wb-desc">'+def.desc+'</div><div class="wb-right">'+right+'</div></div>';
    }
    statRowsHTML += '<div style="margin-top:clamp(8px,1.5vw,12px);padding-top:clamp(8px,1.5vw,12px);border-top:1px solid var(--line)"><div class="wb-name" style="margin-bottom:clamp(4px,1vw,8px);color:var(--accent)">'+cat.name+'</div>' + catRows + '</div>';
  }
  
  const menu = document.getElementById('wbMenu');
  menu.querySelector('.wb-weapon').textContent = w.charAt(0).toUpperCase()+w.slice(1);
  menu.querySelector('.wb-mag').textContent = 'Mag: ' + (att.extMag ? Math.ceil(cap*1.3) : cap) + ' rounds';
  menu.querySelector('.wb-pts').textContent = 'Points: ' + state.points;
  menu.querySelector('.wb-rows').innerHTML = '<div style="margin-top:clamp(8px,1.5vw,12px);padding-top:clamp(8px,1.5vw,12px);border-top:1px solid var(--line);width:100%"><div class="wb-name" style="margin-bottom:clamp(4px,1vw,8px);color:var(--accent)">WEAPONS</div><div class="wb-weapon-grid" style="width:100%">' + weaponRowsHTML + '</div></div>' + statRowsHTML;
  // Ensure all weapon rows have proper event listeners
  menu.querySelectorAll('.wb-row[data-weapon]').forEach(r=>{
    r.addEventListener('click', (ev)=>{
      // If the click was on the UPGRADE button, handle it separately
      const upgBtn = ev.target.closest('.wb-upgrade-btn');
      if(upgBtn){
        const uw = upgBtn.dataset.upgrade;
        if(!uw) return;
        const UPGRADE_COST = 750;
        const att = wbGet(uw);
        const missing = WB_ATTACH_DEFS.filter(d=>!att[d.key]);
        if(missing.length === 0) return;
        if(state.points < UPGRADE_COST) return;
        state.points -= UPGRADE_COST;
        // Install every missing attachment at once
        for(const d of WB_ATTACH_DEFS){
          if(!att[d.key]){
            att[d.key] = true;
            if(d.key==='extMag'){ mags[uw] = Math.floor(MAGS[uw]*1.5); }
          }
        }
        ensureAudio();
        if(audioCtx){ const t=now(); const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(900,t); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.10); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.11); }
        const wnames = {smg:'SMG',shotgun:'Shotgun',rifle:'Rifle',uzi:'Uzi',m4a1:'M4A1',awp:'AWP',deagle:'Deagle',minigun:'Minigun',rpg:'RPG-7',doubleShotgun:'Double Shotgun'};
        showToast('Upgraded ' + (wnames[uw] || uw) + ' with all attachments!', 2200);
        updateRedDot();
        updateHUD();
        wbOpenMenu(); // refresh
        return;
      }
      const weaponKey = r.dataset.weapon;
      const WEAPON_PRICES = {smg:450,shotgun:600,rifle:750,uzi:540,m4a1:900,awp:1200,deagle:660,minigun:1500,rpg:1050,doubleShotgun:840};
      const AMMO_COST = 150;
      if(isOwned(weaponKey)){
        // Buy ammo for owned weapon
        if(state.points < AMMO_COST) return;
        state.points -= AMMO_COST;
        const cap = Math.floor((wbGet(weaponKey).extMag ? Math.ceil(MAGS[weaponKey]*1.5) : MAGS[weaponKey]) + getMagSizeBonus());
        reserves[weaponKey] = Math.floor(Math.max(0, reserves[weaponKey] + cap)); // Add one full magazine to reserve
        ensureAudio();
        if(audioCtx){ const t=now(); const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(800,t); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.09); }
        const wnames = {smg:'SMG',shotgun:'Shotgun',rifle:'Rifle',uzi:'Uzi',m4a1:'M4A1',awp:'AWP',deagle:'Deagle',minigun:'Minigun',rpg:'RPG-7',doubleShotgun:'Double Shotgun'};
        showToast('Bought ' + cap + ' rounds for ' + (wnames[weaponKey] || weaponKey), 2000);
        wbOpenMenu(); // refresh
        updateHUD();
        return;
      }
      // Buy new weapon
      const cost = WEAPON_PRICES[weaponKey] || 200;
      if(state.points < cost) return;
      state.points -= cost;
      addWeapon(weaponKey);
      ensureAudio();
      if(audioCtx){ const t=now(); const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(600,t); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.09); }
      wbOpenMenu(); // refresh
      updateHUD();
    });
  });
  
  // Dev Menu tab and panel - create ONCE and persist across menu opens
  if(!window._devMenuState) window._devMenuState = { unlocked: false, pinInput: '' };
  const devState = window._devMenuState;
  
  // Only create the dev menu DOM if it doesn't already exist
  if(!document.getElementById('devTab')){
    // Clear any previous dev action queue to prevent stacking
    if(window._devActionQueue) window._devActionQueue.length = 0;
    let devTabHTML = '<div class="wb-tabs"><button class="wb-tab ' + (devState.unlocked ? 'unlocked' : 'locked') + '" id="devTab"><span class="lock-ico">' + (devState.unlocked ? '🔓' : '🔒') + '</span><span style="font-size:9px;background:var(--accent);color:#000;padding:1px 4px;border-radius:3px;margin-left:4px;font-weight:800">DEV</span>Dev Menu</button></div>';
    let devPanelHTML = '<div class="wb-panel" id="devPanel" style="display:none"><div class="wb-pin" id="pinPad" style="display:none"><div class="wb-pin-display" id="pinDisplay"></div><div class="wb-pin-grid"><button class="wb-pin-btn" data-pin="1">1</button><button class="wb-pin-btn" data-pin="2">2</button><button class="wb-pin-btn" data-pin="3">3</button><button class="wb-pin-btn" data-pin="4">4</button><button class="wb-pin-btn" data-pin="5">5</button><button class="wb-pin-btn" data-pin="6">6</button><button class="wb-pin-btn" data-pin="7">7</button><button class="wb-pin-btn" data-pin="8">8</button><button class="wb-pin-btn" data-pin="9">9</button><button class="wb-pin-btn" data-pin="back">⌫</button><button class="wb-pin-btn" data-pin="0">0</button><button class="wb-pin-btn" data-pin="submit">OK</button></div><div class="wb-pin-msg" id="pinMsg"></div></div><div class="wb-dev-grid" id="devBtns" style="display:none"><button class="wb-dev-btn" data-dev="allWeapons">Give All Weapons</button><button class="wb-dev-btn" data-dev="pistol">Give Pistol</button><button class="wb-dev-btn" data-dev="smg">Give SMG</button><button class="wb-dev-btn" data-dev="m4a1">Give M4</button><button class="wb-dev-btn" data-dev="awp">Give Sniper</button><button class="wb-dev-btn" data-dev="rpg">Give RPG-7</button><button class="wb-dev-btn" data-dev="maxAmmo">Max Ammo</button><button class="wb-dev-btn" data-dev="fullHealth">Full Health</button><button class="wb-dev-btn" data-dev="spawn5">Spawn 5 Enemies</button><button class="wb-dev-btn" data-dev="spawnBoss">Spawn Boss</button><button class="wb-dev-btn" data-dev="nextWave">Start Next Wave</button><button class="wb-dev-btn" data-dev="give1000">Give 1000 Credits</button><button class="wb-dev-btn" data-dev="resetWave">Reset Wave</button><button class="wb-dev-btn" data-dev="teleportWB">Teleport to Workbench</button><button class="wb-dev-btn danger" data-dev="resetDev">Reset Dev</button><button class="wb-dev-btn" data-dev="godMode">God Mode Toggle</button></div><div class="wb-dev-msg" id="devMsg"></div></div>';
    
    // Insert dev tab and panel before the close button (only on first creation)
    const closeBtn = menu.querySelector('.wb-close');
    if(closeBtn){
      closeBtn.insertAdjacentHTML('beforebegin', devTabHTML + devPanelHTML);
    }
  }
  
  // Dev Menu logic
  const devTab = document.getElementById('devTab');
  const pinPad = document.getElementById('pinPad');
  const pinDisplay = document.getElementById('pinDisplay');
  const pinMsg = document.getElementById('pinMsg');
  const devBtns = document.getElementById('devBtns');
  const devMsg = document.getElementById('devMsg');
  
  // Attach event listeners ONLY ONCE (guard against duplicate listeners)
  if(!devTab._listenersAttached){
    devTab._listenersAttached = true;
    
    devTab.addEventListener('click', ()=>{
      devPanel.style.display = 'block';
      if(!devState.unlocked){
        pinPad.style.display = 'block';
        devBtns.style.display = 'none';
        devState.pinInput = '';
        pinDisplay.textContent = '';
        pinMsg.textContent = '';
        pinMsg.className = 'wb-pin-msg';
      } else {
        pinPad.style.display = 'none';
        devBtns.style.display = 'grid';
      }
    });
    
    document.querySelectorAll('.wb-pin-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = btn.dataset.pin;
        if(val === 'back'){
          devState.pinInput = devState.pinInput.slice(0, -1);
          pinDisplay.textContent = devState.pinInput;
        } else if(val === 'submit'){
          if(devState.pinInput === '1234'){
            devState.unlocked = true;
            devTab.classList.add('unlocked');
            devTab.querySelector('.lock-ico').textContent = '🔓';
            pinPad.style.display = 'none';
            devBtns.style.display = 'grid';
            pinMsg.textContent = 'Unlocked!';
            pinMsg.className = 'wb-pin-msg ok';
            setTimeout(()=>{ pinMsg.textContent = ''; }, 1500);
          } else {
            pinPad.classList.add('shake');
            setTimeout(()=>pinPad.classList.remove('shake'), 400);
            pinMsg.textContent = 'Wrong PIN';
            pinMsg.className = 'wb-pin-msg err';
            devState.pinInput = '';
            pinDisplay.textContent = '';
          }
        } else {
          devState.pinInput += val;
          pinDisplay.textContent = devState.pinInput;
        }
      });
    });
    
    document.querySelectorAll('.wb-dev-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        // Guard: each action fires exactly once per click
        if(btn._alreadyApplied) return;
        btn._alreadyApplied = true;
        
        const action = btn.dataset.dev;
        devMsg.textContent = '';
        devMsg.className = 'wb-dev-msg';
        
        if(action === 'allWeapons'){
          // Clear any existing weapons to prevent duplicates
          ownedWeapons.length = 0;
          ['pistol','smg','m4a1','awp','rpg'].forEach(w=>{
            addWeapon(w);
          });
          devMsg.textContent = 'All weapons granted!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'pistol' || action === 'smg' || action === 'm4a1' || action === 'awp'){
          // Check if already owned to prevent duplicates
          if(!isOwned(action)){
            addWeapon(action);
          }
          devMsg.textContent = action.toUpperCase() + ' granted!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'rpg'){
          // Check if already owned to prevent duplicates
          if(!isOwned('rpg')){
            addWeapon('rpg');
          }
          // Ensure full mag and reasonable reserve (set, not add)
          mags['rpg'] = 3;
          reserves['rpg'] = Math.max(reserves['rpg'], 6);
          // Switch to RPG immediately
          switchWeapon('rpg');
          devMsg.textContent = 'RPG-7 granted!';
          devMsg.className = 'wb-dev-msg ok';
          showToast('RPG-7 granted', 2000);
        } else if(action === 'maxAmmo'){
          ownedWeapons.forEach(w=>{
            const cap = (wbGet(w).extMag ? Math.ceil(MAGS[w]*1.5) : MAGS[w]) + getMagSizeBonus();
            mags[w] = cap;
            reserves[w] = MAGS[w] * 10;
          });
          devMsg.textContent = 'Ammo maxed!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'fullHealth'){
          state.health = getMaxHealth();
          devMsg.textContent = 'Health restored!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'spawn5'){
          for(let i=0;i<5;i++){
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 10;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            spawnZombie({x, z, type:'normal'});
          }
          devMsg.textContent = '5 enemies spawned!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'spawnBoss'){
          if(!state.boss || !state.boss.alive){
            spawnBoss(state.wave);
            devMsg.textContent = 'Boss spawned!';
            devMsg.className = 'wb-dev-msg ok';
          } else {
            devMsg.textContent = 'Boss already active';
            devMsg.className = 'wb-dev-msg err';
          }
        } else if(action === 'nextWave'){
          state.waveGap = 0;
          startWave(state.wave + 1);
          devMsg.textContent = 'Wave ' + (state.wave + 1) + ' started!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'give1000'){
          state.points += 1000;
          devMsg.textContent = '+1000 credits!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'resetWave'){
          for(const z of zombies) scene.remove(z.group);
          zombies.length = 0;
          spawnQueue.length = 0;
          if(state.boss) removeBoss();
          state.waveGap = 3.0;
          state.wave = Math.max(0, state.wave - 1);
          devMsg.textContent = 'Wave reset!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'teleportWB'){
          player.pos.set(0, 1.7, 0);
          player.vel.set(0,0,0);
          player.yaw = 0; player.pitch = 0;
          camera.position.set(0, 1.7, 0);
          devMsg.textContent = 'Teleported to workbench!';
          devMsg.className = 'wb-dev-msg ok';
        } else if(action === 'resetDev'){
          devState.unlocked = false;
          devTab.classList.remove('unlocked');
          devTab.querySelector('.lock-ico').textContent = '🔒';
          pinPad.style.display = 'block';
          devBtns.style.display = 'none';
          devState.pinInput = '';
          pinDisplay.textContent = '';
          pinMsg.textContent = 'Dev menu locked';
          pinMsg.className = 'wb-pin-msg';
        } else if(action === 'godMode'){
          state.godMode = !state.godMode;
          btn.classList.toggle('on', state.godMode);
          devMsg.textContent = 'God Mode ' + (state.godMode ? 'ON' : 'OFF');
          devMsg.className = 'wb-dev-msg ok';
        }
        
        updateHUD();
        
        // Reset the guard so the button can be clicked again
        setTimeout(()=>{ btn._alreadyApplied = false; }, 100);
      });
    });
  }
  
  // Ensure dev menu panel is not re-appended on subsequent opens
  const _devPanel = document.getElementById('devPanel');
  if(_devPanel && _devPanel.parentNode !== menu){
    menu.appendChild(_devPanel);
  }
  menu.querySelectorAll('.wb-row').forEach(r=>{
    r.addEventListener('click', ()=>{
      const key = r.dataset.key;
      const statKey = r.dataset.statkey;
      const weaponKey = r.dataset.weapon;
      if(weaponKey){
        const WEAPON_PRICES = {smg:450,shotgun:600,rifle:750,uzi:540,m4a1:900,awp:1200,deagle:660,minigun:1500,rpg:1050,doubleShotgun:840};
        const AMMO_COST = 150;
        if(isOwned(weaponKey)){
          // Buy ammo for owned weapon
          if(state.points < AMMO_COST) return;
          state.points -= AMMO_COST;
          const cap = Math.floor((wbGet(weaponKey).extMag ? Math.ceil(MAGS[weaponKey]*1.5) : MAGS[weaponKey]) + getMagSizeBonus());
          reserves[weaponKey] = Math.floor(Math.max(0, reserves[weaponKey] + cap)); // Add one full magazine to reserve
          ensureAudio();
          if(audioCtx){ const t=now(); const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(800,t); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.09); }
          const wnames = {smg:'SMG',shotgun:'Shotgun',rifle:'Rifle',uzi:'Uzi',m4a1:'M4A1',awp:'AWP',deagle:'Deagle',minigun:'Minigun',rpg:'RPG-7',doubleShotgun:'Double Shotgun'};
          showToast('Bought ' + cap + ' rounds for ' + (wnames[weaponKey] || weaponKey), 2000);
          wbOpenMenu(); // refresh
          updateHUD();
          return;
        }
        // Buy new weapon
        const cost = WEAPON_PRICES[weaponKey] || 200;
        if(state.points < cost) return;
        state.points -= cost;
        addWeapon(weaponKey);
        ensureAudio();
        if(audioCtx){ const t=now(); const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(600,t); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.09); }
        wbOpenMenu(); // refresh
        updateHUD();
        return;
      }
      if(statKey){
        // Stat upgrade purchase
        const def = WB_STAT_UPGRADES.find(d=>d.key===statKey);
        if(!def) return;
        const level = statUpgrades[statKey];
        if(level >= def.maxLevel) return;
        const cost = getUpgradeCost(def, level);
        if(state.points < cost) return;
        state.points -= cost;
        statUpgrades[statKey]++;
        ensureAudio();
        if(audioCtx){ const t=now(); const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(500,t); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.09); }
        wbOpenMenu(); // refresh
        updateHUD();
        return;
      }
      const def = WB_ATTACH_DEFS.find(d=>d.key===key);
      if(!def) return;
      const a = wbGet(w);
      if(a[key]) return;
      if(state.points < def.cost) return;
      state.points -= def.cost;
      a[key] = true;
      if(key==='extMag'){ mags[w] = Math.floor(MAGS[w]*1.5); }
      ensureAudio();
      // small click sound
      if(audioCtx){ const t=now(); const o=audioCtx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(400,t); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.09); }
      wbOpenMenu(); // refresh
      updateRedDot();
      updateHUD();
    });
  });
  menu.classList.remove('hidden');
}
function wbCloseMenu(){
  wbMenuOpen = false;
  state.running = true;
  document.getElementById('wbMenu').classList.add('hidden');
  wbNavReset();
  updateHUD();
}

/* ============================ GAMEPAD WORKBENCH NAV ============================ */
// Navigates the #wbMenu overlay with the gamepad while it is open.
// Left stick / D-pad move a selection cursor; A activates; B/Start close.
let wbNavIdx = -1;
let wbNavEls = [];
let wbNavLastMove = 0;
let wbNavLastDir = 0;
function wbNavReset(){
  wbNavIdx = -1;
  wbNavEls = [];
  wbNavLastMove = 0;
  wbNavLastDir = 0;
  const menu = document.getElementById('wbMenu');
  if(menu) menu.querySelectorAll('.wb-gp-sel').forEach(el=>el.classList.remove('wb-gp-sel'));
}
function wbNavBuild(){
  const menu = document.getElementById('wbMenu');
  if(!menu) return;
  // Rebuild from the live DOM each time the menu opens so the list always
  // matches the current rows (weapon rows + stat rows + upgrade buttons + close).
  const rows = Array.prototype.slice.call(menu.querySelectorAll('.wb-row'));
  const btns = Array.prototype.slice.call(menu.querySelectorAll('.wb-upgrade-btn'));
  const close = menu.querySelector('#wbCloseBtn');
  wbNavEls = rows.concat(btns);
  if(close) wbNavEls.push(close);
  if(wbNavIdx < 0) wbNavIdx = 0;
  if(wbNavIdx >= wbNavEls.length) wbNavIdx = wbNavEls.length - 1;
}
function wbNavApply(){
  const menu = document.getElementById('wbMenu');
  if(!menu) return;
  menu.querySelectorAll('.wb-gp-sel').forEach(el=>el.classList.remove('wb-gp-sel'));
  if(wbNavIdx < 0 || wbNavIdx >= wbNavEls.length) return;
  const el = wbNavEls[wbNavIdx];
  if(!el) return;
  el.classList.add('wb-gp-sel');
  const scroller = menu.querySelector('.wb-rows') || menu.querySelector('.wb-card') || menu;
  if(scroller && typeof el.scrollIntoView === 'function') el.scrollIntoView({block:'nearest'});
}
function wbNavMove(dir, dt){
  if(!wbMenuOpen) return;
  if(!wbNavEls.length) wbNavBuild();
  if(!wbNavEls.length) return;
  const t = performance.now();
  if(dir === wbNavLastDir){
    if(t - wbNavLastMove < 120) return; // repeat delay
  } else {
    if(t - wbNavLastMove < 300) return; // first-move delay
    wbNavLastDir = dir;
  }
  wbNavLastMove = t;
  wbNavIdx = Math.max(0, Math.min(wbNavEls.length - 1, wbNavIdx + dir));
  wbNavApply();
}
function wbNavActivate(){
  if(!wbMenuOpen) return;
  if(wbNavIdx < 0 || wbNavIdx >= wbNavEls.length) return;
  const el = wbNavEls[wbNavIdx];
  if(!el) return;
  // Activate the selected row/button by clicking it — reuses all existing
  // buy / upgrade / close logic. (A button = activate, not jump.)
  if(typeof el.click === 'function') el.click();
}
function wbNavClose(){
  if(!wbMenuOpen) return;
  wbCloseMenu();
}
function wbUpdateNear(){
  const dx = player.pos.x - WB.x;
  const dz = player.pos.z - WB.z;
  const d = Math.hypot(dx,dz);
  const near = d < 3.0;
  if(near !== wbNear){
    wbNear = near;
    const hint = document.getElementById('wbHint');
    if(near && state.running && !wbMenuOpen){
      hint.textContent = '[E] Open Workbench';
      hint.classList.add('show');
    } else if(!near){
      hint.classList.remove('show');
    }
  }
}
// Small sand bunkers
const bunkerMat2 = new THREE.MeshLambertMaterial({map:texBarrel()});
[[-21,-9],[9,-19.5],[21,16.5],[-15,20],[15,-20],[25,10],[-25,-10],[10,25],[40,20],[-40,20],[20,40],[-20,40],[40,-20],[-40,-20],[20,-40],[-20,-40]].forEach(p=>{
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.7,0.5,14), bunkerMat2);
  m.position.set(p[0],0.25,p[1]);
  scene.add(m);
  addCollider(p[0],p[1],0.5,0.5,0.5);
});
// Doorway markers (subtle glow strips) at the four wall gaps
const doorMat = new THREE.MeshLambertMaterial({color:0x111417, emissive:0x1a2a12, emissiveIntensity:1.5});
[[0,-45,0.6,0.6],[0,45,0.6,0.6],[-45,0,0.6,0.6],[45,0,0.6,0.6]].forEach(d=>{
  const m = new THREE.Mesh(new THREE.PlaneGeometry(d[2],0.4), doorMat);
  m.position.set(d[0],0.2,d[1]); m.rotation.x=-Math.PI/2; scene.add(m);
});
