"use strict";
// Dead Hold: touch controls for phones and tablets
// Loaded in this order by index.html: core, world, guns-1, guns-2, weapons, rpg, zombies, boss,
// workbench, mobile, game, main. Code that runs when the page loads can only
// use things from files loaded before it; functions used later (in the main loop, on clicks) can live anywhere.

/* ============================ MOBILE TOUCH ============================ */
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
const touchUI = document.getElementById('touchUI');
const joyBase = document.getElementById('joyBase');
const joyThumb = document.getElementById('joyThumb');
const lookArea = document.getElementById('lookArea');
const btnFire = document.getElementById('btnFire');
const btnJump = document.getElementById('btnJump');
const btnReload = document.getElementById('btnReload');
const btnWorkbench = document.getElementById('btnWorkbench');
const tSlots = document.getElementById('tSlots');
let joyVec = {x:0, y:0};
let joyActive = false;
let lookId = null;
let lookLast = {x:0, y:0};
let fireHeld = false;
let touchWeaponList = ['pistol','smg','shotgun','rifle'];

function buildTouchSlots(){
  const list = weaponList();
  tSlots.innerHTML = list.map((w,i)=>{
    const empty = (mags[w] <= 0 && reserves[w] <= 0);
    return '<div class="tslot'+(w===activeWeapon?' active':'')+(empty?' empty':'')+'" data-w="'+w+'">'+(i+1)+'</div>';
  }).join('');
  tSlots.querySelectorAll('.tslot').forEach(el=>{
    el.addEventListener('touchstart', e=>{ e.preventDefault(); switchWeapon(el.dataset.w); }, {passive:false});
    el.addEventListener('click', ()=>{ switchWeapon(el.dataset.w); });
  });
}
function updateTouchSlots(){
  tSlots.querySelectorAll('.tslot').forEach(el=>{
    el.classList.toggle('active', el.dataset.w===activeWeapon);
  });
}
function joySetVec(dx, dy){
  joyVec.x = dx; joyVec.y = dy;
  joyThumb.style.transform = 'translate(calc(-50% + '+(dx*42)+'px), calc(-50% + '+(dy*42)+'px))';
}
function joyReset(){
  joyActive = false;
  joyVec.x = 0; joyVec.y = 0;
  joyThumb.style.transform = 'translate(-50%,-50%)';
}
function bindTouch(el, onDown, onUp){
  if(!el) return;
  el.addEventListener('touchstart', e=>{ e.preventDefault(); onDown(e); }, {passive:false});
  el.addEventListener('touchend', e=>{ e.preventDefault(); onUp && onUp(e); }, {passive:false});
  el.addEventListener('touchcancel', e=>{ e.preventDefault(); onUp && onUp(e); }, {passive:false});
}
let _touchInited = false;
function initTouch(){
  if(!isTouch || _touchInited) return;
  _touchInited = true;
  touchUI.classList.add('active');
  buildTouchSlots();
  // Joystick
  joyBase.addEventListener('touchstart', e=>{
    e.preventDefault();
    joyActive = true;
    const t = e.changedTouches[0];
    joyMove(t);
  }, {passive:false});
  joyBase.addEventListener('touchmove', e=>{
    e.preventDefault();
    if(!joyActive) return;
    const t = e.changedTouches[0];
    joyMove(t);
  }, {passive:false});
  joyBase.addEventListener('touchend', e=>{ e.preventDefault(); joyReset(); }, {passive:false});
  joyBase.addEventListener('touchcancel', e=>{ e.preventDefault(); joyReset(); }, {passive:false});
  function joyMove(t){
    const r = joyBase.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    let dx = (t.clientX - cx) / (r.width/2);
    let dy = (t.clientY - cy) / (r.height/2);
    const len = Math.hypot(dx, dy);
    if(len > 1){ dx = dx/len; dy = dy/len; }
    joySetVec(dx, dy);
  }
  // Look area
  lookArea.addEventListener('touchstart', e=>{
    e.preventDefault();
    ensureAudio();
    if(!state.running) return;
    const t = e.changedTouches[0];
    lookId = t.identifier;
    lookLast.x = t.clientX; lookLast.y = t.clientY;
  }, {passive:false});
  lookArea.addEventListener('touchmove', e=>{
    e.preventDefault();
    if(lookId===null || !state.running) return;
    for(const t of e.changedTouches){
      if(t.identifier !== lookId) continue;
      const sens = 0.004 * (adsActive ? ADS_SENS : 1);
      player.yaw   -= (t.clientX - lookLast.x) * sens;
      player.pitch -= (t.clientY - lookLast.y) * sens;
      player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
      lookLast.x = t.clientX; lookLast.y = t.clientY;
    }
  }, {passive:false});
  lookArea.addEventListener('touchend', e=>{
    e.preventDefault();
    for(const t of e.changedTouches){ if(t.identifier===lookId) lookId = null; }
  }, {passive:false});
  lookArea.addEventListener('touchcancel', e=>{
    e.preventDefault();
    for(const t of e.changedTouches){ if(t.identifier===lookId) lookId = null; }
  }, {passive:false});
  // Fire
  bindTouch(btnFire, e=>{ e.preventDefault(); ensureAudio(); fireHeld = true; if(state.running && !isAuto()) shoot(); btnFire.classList.add('pressed'); },
    e=>{ e.preventDefault(); fireHeld = false; btnFire.classList.remove('pressed'); });
  // Jump
  bindTouch(btnJump, e=>{ e.preventDefault(); ensureAudio(); tryJump(); btnJump.classList.add('pressed'); },
    e=>{ e.preventDefault(); btnJump.classList.remove('pressed'); });
  // Reload
  bindTouch(btnReload, e=>{ e.preventDefault(); ensureAudio(); startReload(); btnReload.classList.add('pressed'); },
    e=>{ e.preventDefault(); btnReload.classList.remove('pressed'); });
  // Workbench
  bindTouch(btnWorkbench, e=>{
    e.preventDefault(); ensureAudio();
    if(wbMenuOpen) wbCloseMenu(); else wbOpenMenu();
    btnWorkbench.classList.add('pressed');
  }, e=>{ e.preventDefault(); btnWorkbench.classList.remove('pressed'); });
  // Cycle weapon (equivalent to Q / wheel)
  const btnCycle = document.getElementById('btnCycle');
  // Crouch (toggle, equivalent to C key)
  const btnCrouch = document.getElementById('btnCrouch');
  if(btnCrouch){
    bindTouch(btnCrouch, e=>{
      e.preventDefault(); ensureAudio();
      if(state.running) setCrouch(!crouching);
      btnCrouch.classList.add('pressed');
    }, e=>{ e.preventDefault(); btnCrouch.classList.remove('pressed'); });
  }
  if(btnCycle){
    bindTouch(btnCycle, e=>{
      e.preventDefault(); ensureAudio();
      if(state.running && !wbMenuOpen) cycleWeapon();
      btnCycle.classList.add('pressed');
    }, e=>{ e.preventDefault(); btnCycle.classList.remove('pressed'); });
  }
  // Dash / Sprint (uses stamina, equivalent to Shift)
  const btnDash = document.getElementById('btnDash');
  if(btnDash){
    let dashHeld = false;
    btnDash.addEventListener('touchstart', e=>{
      e.preventDefault(); ensureAudio(); dashHeld = true;
      if(state.running && !wbMenuOpen){
        // Toggle a sprint flag that isSprinting() can read
        if(window._touchSprint === undefined) window._touchSprint = false;
        window._touchSprint = true;
      }
      btnDash.classList.add('pressed');
    }, {passive:false});
    btnDash.addEventListener('touchend', e=>{
      e.preventDefault(); dashHeld = false;
      if(window._touchSprint !== undefined) window._touchSprint = false;
      btnDash.classList.remove('pressed');
    }, {passive:false});
    btnDash.addEventListener('touchcancel', e=>{
      e.preventDefault(); dashHeld = false;
      if(window._touchSprint !== undefined) window._touchSprint = false;
      btnDash.classList.remove('pressed');
    }, {passive:false});
  }
  // Scope / ADS toggle (equivalent to RMB)
  const btnScope = document.getElementById('btnScope');
  if(btnScope){
    bindTouch(btnScope, e=>{
      e.preventDefault(); ensureAudio();
      if(state.running && !wbMenuOpen){
        adsActive = !adsActive;
      }
      btnScope.classList.add('pressed');
    }, e=>{ e.preventDefault(); btnScope.classList.remove('pressed'); });
  }
  // Double-tap on look area toggles ADS (alternative to SCOPE button)
  let lookTapCount = 0, lookTapTimer = null;
  lookArea.addEventListener('touchend', e=>{
    e.preventDefault();
    for(const t of e.changedTouches){ if(t.identifier===lookId) lookId = null; }
    if(state.running && !wbMenuOpen){
      lookTapCount++;
      if(lookTapCount === 1){
        lookTapTimer = setTimeout(()=>{ lookTapCount = 0; }, 300);
      } else if(lookTapCount >= 2){
        clearTimeout(lookTapTimer);
        lookTapCount = 0;
        adsActive = !adsActive;
      }
    }
  }, {passive:false});
  // Touch weapon slots: tap to switch
  tSlots.addEventListener('touchstart', e=>{
    const slot = e.target.closest('.tslot');
    if(!slot || !state.running || wbMenuOpen) return;
    e.preventDefault();
    ensureAudio();
    const w = slot.dataset.weapon;
    if(w && isOwned(w)) switchWeapon(w);
  }, {passive:false});
  // Prevent double-tap zoom / scroll on canvas
  canvas.addEventListener('touchstart', e=>{ e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchmove', e=>{ e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchend', e=>{ e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchcancel', e=>{ e.preventDefault(); }, {passive:false});
  // Prevent page zoom
  document.addEventListener('gesturestart', e=>{ e.preventDefault(); });
  document.addEventListener('dblclick', e=>{ e.preventDefault(); });
  // Block iOS double-tap zoom + pinch zoom globally (also covers non-touch UI)
  document.addEventListener('touchstart', e=>{ if(e.touches && e.touches.length>1) e.preventDefault(); }, {passive:false});
  document.addEventListener('touchend', e=>{
    const t = e.changedTouches && e.changedTouches[0];
    if(t && Date.now() - (t._lastTap||0) < 300 && e.target.closest('button,.tslot,.wb-row,.wb-close')){
      e.preventDefault(); // stop iOS double-tap zoom on UI taps
    }
    if(t) t._lastTap = Date.now();
  }, {passive:false});
  document.addEventListener('touchmove', e=>{ if(e.target.closest('#touchUI')||e.target===canvas) e.preventDefault(); }, {passive:false});
}
function onResize(){
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', ()=>{ setTimeout(onResize, 120); });
if(window.visualViewport){ window.visualViewport.addEventListener('resize', onResize); }
initTouch();

// (The render loop is started once, at the end of start-up in main.js.)

document.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if(k==='shift'){ keys['shift']=true; }
  if(k==='e'){
    if(wbMenuOpen){ wbCloseMenu(); }
    else if(wbNear){ wbOpenMenu(); }
  }
  if(k==='escape' && wbMenuOpen){ wbCloseMenu(); }
  if(k==='1'){ switchWeapon('pistol'); }
  if(k==='2'){ switchWeapon('smg'); }
  if(k==='3'){ switchWeapon('shotgun'); }
  if(k==='4'){ switchWeapon('rifle'); }
  if(k==='5' && state.hasDoubleShotgun){ switchWeapon('doubleShotgun'); }
  if(k==='r'){ startReload(); }
  if(k==='q'){ cycleWeapon(); }
  if(k===' '){ tryJump(); }
  keys[k]=true;
  if(['w','a','s','d',' '].includes(k)) e.preventDefault();
});
document.getElementById('wbCloseBtn').addEventListener('click', wbCloseMenu);
function tryJump(){
  if(!state.running) return;
  if(player.grounded){
    player.vel.y = JUMP_V;
    player.grounded = false;
    playJump();
  }
}
function switchWeapon(w){
  if(!isOwned(w)) return;
  if(w===activeWeapon) return;
  activeWeapon = w;
  state.reloading = false;
  updateRedDot();
  updateWeaponSlots(); // refresh the bottom-right WEAPONS list so the active slot glows green
  updateHUD();        // refresh the bottom-left weapon name label + ammo
}
function isAuto(){ return activeWeapon==='smg' || activeWeapon==='rifle' || activeWeapon==='uzi' || activeWeapon==='m4a1' || activeWeapon==='minigun'; }
function fireRate(){
  // Automatic weapons: significantly faster — 20-25 shots/sec (40-50ms between shots)
  // Semi-auto weapons: 8 shots/sec (unchanged)
  // Rifles (rifle, m4a1) slowed further for balance
  const base = {smg:22, rifle:10, uzi:25, m4a1:15, minigun:25, pistol:8, shotgun:8, doubleShotgun:8, awp:8, deagle:8, rpg:12};
  const rate = (base[activeWeapon] || 8) * getFireRateMultiplier();
  return rate;
}
function cycleWeapon(){
  const list = weaponList();
  let i = list.indexOf(activeWeapon);
  switchWeapon(list[(i+1)%list.length]);
}
document.addEventListener('keydown', e=>{
  const k = e.key;
  if(k>='1'&&k<='9'){
    const list = weaponList();
    const idx = parseInt(k)-1;
    if(idx < list.length) switchWeapon(list[idx]);
  }
  if(k==='c' || k==='C'){
    if(state.running) setCrouch(!crouching);
  }
});
document.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()]=false; });

canvas.addEventListener('mousedown', e=>{
  if(e.button===2){
    if(state.running) adsActive = true;
    return;
  }
  if(e.button!==0) return;
  ensureAudio();
  if(!state.running) return;
  if(!pointerLocked){
    canvas.requestPointerLock && canvas.requestPointerLock();
    return;
  }
  mouseDown = true;
  if(!isAuto()) shoot();
});
window.addEventListener('mouseup', e=>{
  if(e.button===0) mouseDown=false;
  if(e.button===2) adsActive=false;
});
window.addEventListener('blur', ()=>{ mouseDown=false; adsActive=false; });
canvas.addEventListener('contextmenu', e=>{ e.preventDefault(); });
document.addEventListener('pointerlockchange', ()=>{
  pointerLocked = (document.pointerLockElement === canvas);
  updateHint();
});
document.addEventListener('mousemove', e=>{
  if(!pointerLocked || !state.running) return;
  const sens = 0.0022 * (adsActive ? ADS_SENS : 1);
  player.yaw   -= e.movementX * sens;
  player.pitch -= e.movementY * sens;
  player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
});
document.addEventListener('wheel', e=>{
  if(!state.running) return;
  const list = weaponList();
  let i = list.indexOf(activeWeapon);
  i = (i + (e.deltaY>0?1:-1) + list.length) % list.length;
  switchWeapon(list[i]);
}, {passive:true});
