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

/* ============================ GAMEPAD / CONTROLLER ============================ */
// Standard Xbox-style layout. Combines with (never replaces) keyboard/mouse/touch.
// Hold-state (fire/sprint/crouch/ADS) uses the current button value; discrete
// actions (reload/jump/cycle/pause) fire only on the rising edge.
const GP_DEADZONE = 0.15;
const GP_LOOK_SENS = 0.0038; // radians per unit of stick (≈2.2° per full unit)
let gpFire = false;      // current held fire (A)
let gpSprint = false;    // current held sprint (L3)
let gpCrouch = false;    // current held crouch (R3)
let gpAds = false;       // current held ADS (RT)
let gpPrev = {};         // previous frame button states (for rising edges)
let gpConnected = false; // a pad was seen
let gpToastShown = false;

function gpDeadzone(v){
  if(Math.abs(v) < GP_DEADZONE) return 0;
  return Math.sign(v) * (Math.abs(v) - GP_DEADZONE) / (1 - GP_DEADZONE);
}
function gpButtonVal(gp, i){
  const b = gp.buttons[i];
  return b ? (b.pressed ? 1 : (b.value || 0)) : 0;
}
function gpRising(gp, i){
  const now = gpButtonVal(gp, i) > 0;
  const was = !!gpPrev[i];
  gpPrev[i] = now;
  return now && !was;
}
function gpFalling(gp, i){
  const now = gpButtonVal(gp, i) > 0;
  const was = !!gpPrev[i];
  gpPrev[i] = now;
  return !now && was;
}
function gpFindPad(){
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for(const p of pads){ if(p && p.connected) return p; }
  return null;
}
function gpAnyActive(gp){
  for(let i=0;i<gp.axes.length;i++){ if(Math.abs(gp.axes[i]) > GP_DEADZONE) return true; }
  for(let i=0;i<gp.buttons.length;i++){ if(gp.buttons[i].pressed) return true; }
  return false;
}
function gpClear(){
  gpFire = false; gpSprint = false; gpCrouch = false; gpAds = false;
  gpPrev = {};
  if(window._touchSprint !== undefined) window._touchSprint = false;
  if(crouching) setCrouch(false);
  if(adsActive) adsActive = false;
}
function gpToast(){
  if(!gpToastShown){
    gpToastShown = true;
    showToast('Controller connected', 2.5);
  }
}
function pollGamepad(dt){
  if(!navigator.getGamepads) return;
  const gp = gpFindPad();
  if(!gp){
    if(gpConnected){ gpConnected = false; gpClear(); }
    return;
  }
  if(!gpConnected){ gpConnected = true; gpPrev = {}; }
  if(gpAnyActive(gp)) gpToast();

  // While the workbench menu is open, the gamepad drives MENU navigation only.
  // Suppress all normal gameplay actions (fire, jump, reload, cycle, ADS, sprint)
  // so they don't fire accidentally. Menu nav is handled in the main loop.
  if(typeof wbMenuOpen !== 'undefined' && wbMenuOpen){
    gpFire = false; gpSprint = false; gpCrouch = false; gpAds = false;
    if(window._touchSprint !== undefined) window._touchSprint = false;
    return;
  }

  // Hold-state (continuous)
  gpFire   = gpButtonVal(gp, 7) > 0;   // RT = FIRE
  gpSprint = gpButtonVal(gp, 10) > 0;  // L3 = sprint
  gpCrouch = gpButtonVal(gp, 11) > 0;  // R3 = crouch
  gpAds    = gpButtonVal(gp, 6) > 0;   // LT = ADS

  // Explicit edge-triggered sprint fallback (L3 = button 10):
  // press starts sprinting, release stops it immediately.
  if(gpRising(gp, 10)){ if(window._touchSprint === undefined) window._touchSprint = false; window._touchSprint = true; }
  if(gpFalling(gp, 10)){ if(window._touchSprint !== undefined) window._touchSprint = false; }

  // Discrete actions — rising edge only (call the same paths the keys use)
  if(gpRising(gp, 0)) tryJump();                 // A = jump
  if(gpRising(gp, 1)) startReload();             // B = reload
  if(gpRising(gp, 2)) startReload();             // X = reload (same as R key)
  if(gpRising(gp, 3)) cycleWeapon();             // Y = cycle weapon
  if(gpRising(gp, 4)){                           // LB = previous weapon
    const list = weaponList();
    let i = list.indexOf(activeWeapon);
    switchWeapon(list[(i-1+list.length)%list.length]);
  }
  if(gpRising(gp, 5)){                           // RB = next weapon
    const list = weaponList();
    let i = list.indexOf(activeWeapon);
    switchWeapon(list[(i+1)%list.length]);
  }
  if(gpRising(gp, 9)){                           // Start = open/close calibration (or close workbench)
    if(wbMenuOpen) wbCloseMenu();
    else if(typeof calibToggleMenu === 'function') calibToggleMenu();
  }
  // Fire: RT (button 7) — for semi-auto weapons, fire on rising edge
  if(gpRising(gp, 7) && state.running && !wbMenuOpen && !isAuto()){
    shoot();
  }
}
function applyGamepad(dt){
  if(!gpConnected) return;
  const gp = gpFindPad();
  if(!gp) return;
  // LEFT STICK (axes 0,1) = MOVEMENT: X=strafe, Y=forward/back
  let mx = gpDeadzone(gp.axes[0] || 0);
  let my = gpDeadzone(gp.axes[1] || 0);
  // Apply user axis flips + movement sensitivity
  if(typeof calib !== 'undefined' && calib){
    if(calib.flipLX) mx = -mx;
    if(calib.flipLY) my = -my;
    mx *= calib.moveSens;
    my *= calib.moveSens;
  }
  if(mx || my){
    // Combine with keyboard: whichever axis value is larger in magnitude wins.
    const kx = (keys['d']?1:0) - (keys['a']?1:0);
    const ky = (keys['s']?1:0) - (keys['w']?1:0);
    if(Math.abs(mx) > Math.abs(kx)) keys['gpX'] = mx; else keys['gpX'] = kx;
    if(Math.abs(my) > Math.abs(ky)) keys['gpY'] = my; else keys['gpY'] = ky;
  } else {
    keys['gpX'] = 0; keys['gpY'] = 0;
  }
  // RIGHT STICK (axes 2,3) = LOOK: X=yaw, Y=pitch
  let rx = gpDeadzone(gp.axes[2] || 0);
  let ry = gpDeadzone(gp.axes[3] || 0);
  // Apply user axis flips
  if(typeof calib !== 'undefined' && calib){
    if(calib.flipRX) rx = -rx;
    if(calib.flipRY) ry = -ry;
    if(rx || ry){
      player.yaw   -= rx * calib.lookSens;
      player.pitch -= ry * calib.lookSens;
      player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
    }
  }
  // Sprint: hold L3 (direct assignment so isSprinting() always reads the right value)
  if(window._touchSprint === undefined) window._touchSprint = false;
  window._touchSprint = gpSprint;

  // Crouch: hold R3 (toggle on while held, release when not)
  if(gpCrouch && !crouching) setCrouch(true);
  else if(!gpCrouch && crouching) setCrouch(false);
  // LEFT TRIGGER (button 6) = ADS: hold to aim, release to un-aim
  if(gpAds) adsActive = true;
  else adsActive = false;
  // RIGHT TRIGGER (button 7) = FIRE: hold to keep firing
  if(gpFire && state.running && !wbMenuOpen){
    if(isAuto()){
      // Auto weapons: fire continuously
      shoot();
    } else {
      // Semi-auto: fire on press (already handled by rising edge in pollGamepad)
    }
  }
}

/* ============================ CONTROLLER CALIBRATION ============================ */
// User-tunable gamepad mapping. Persisted to localStorage under "deadhold_calibration".
const CALIB_DEFAULTS = { flipLX:false, flipLY:false, flipRX:false, flipRY:false, lookSens:0.0038, moveSens:1.0 };
const CALIB_KEY = 'deadhold_calibration';
let calib = Object.assign({}, CALIB_DEFAULTS);
function loadCalib(){
  try{
    const raw = localStorage.getItem(CALIB_KEY);
    if(raw){
      const o = JSON.parse(raw);
      if(o && typeof o === 'object'){
        ['flipLX','flipLY','flipRX','flipRY'].forEach(k=>{ if(typeof o[k]==='boolean') calib[k]=o[k]; });
        if(isFinite(+o.lookSens)) calib.lookSens = Math.min(0.02, Math.max(0.001, +o.lookSens));
        if(isFinite(+o.moveSens)) calib.moveSens = Math.min(2.0, Math.max(0.1, +o.moveSens));
      }
    }
  }catch(e){ calib = Object.assign({}, CALIB_DEFAULTS); }
}
function saveCalib(){
  try{ localStorage.setItem(CALIB_KEY, JSON.stringify(calib)); }catch(e){}
}
let calibOpen = false;
function calibSyncUI(){
  const set = (id, v)=>{ const el = document.getElementById(id); if(el) el.checked = v; };
  set('calibFlipLX', calib.flipLX);
  set('calibFlipLY', calib.flipLY);
  set('calibFlipRX', calib.flipRX);
  set('calibFlipRY', calib.flipRY);
  const ls = document.getElementById('calibLookSens');
  if(ls){ ls.value = calib.lookSens; const v=document.getElementById('calibLookSensVal'); if(v) v.textContent = (+calib.lookSens).toFixed(4); }
  const ms = document.getElementById('calibMoveSens');
  if(ms){ ms.value = calib.moveSens; const v=document.getElementById('calibMoveSensVal'); if(v) v.textContent = (+calib.moveSens).toFixed(2); }
}
function calibOpenMenu(){
  const el = document.getElementById('calibMenu');
  if(!el) return;
  calibOpen = true;
  calibSyncUI();
  el.classList.remove('hidden');
}
function calibCloseMenu(){
  const el = document.getElementById('calibMenu');
  if(!el) return;
  calibOpen = false;
  el.classList.add('hidden');
}
function calibToggleMenu(){ if(calibOpen) calibCloseMenu(); else calibOpenMenu(); }
function calibUpdateSticks(){
  if(!calibOpen) return;
  const gp = gpFindPad();
  const a = gp ? gp.axes : [0,0,0,0];
  const fmt = (v)=> (v>=0?'+':'') + (+v).toFixed(2);
  const set = (id, v)=>{ const el = document.getElementById(id); if(el) el.textContent = v; };
  set('calibLX', 'X ' + fmt(a[0]||0));
  set('calibLY', 'Y ' + fmt(a[1]||0));
  set('calibRX', 'X ' + fmt(a[2]||0));
  set('calibRY', 'Y ' + fmt(a[3]||0));
}
function initCalib(){
  loadCalib();
  const bind = (id, fn)=>{ const el = document.getElementById(id); if(el) el.addEventListener('change', fn); };
  bind('calibFlipLX', ()=>{ calib.flipLX = document.getElementById('calibFlipLX').checked; saveCalib(); });
  bind('calibFlipLY', ()=>{ calib.flipLY = document.getElementById('calibFlipLY').checked; saveCalib(); });
  bind('calibFlipRX', ()=>{ calib.flipRX = document.getElementById('calibFlipRX').checked; saveCalib(); });
  bind('calibFlipRY', ()=>{ calib.flipRY = document.getElementById('calibFlipRY').checked; saveCalib(); });
  const ls = document.getElementById('calibLookSens');
  if(ls) ls.addEventListener('input', ()=>{ calib.lookSens = +ls.value; const v=document.getElementById('calibLookSensVal'); if(v) v.textContent = calib.lookSens.toFixed(4); saveCalib(); });
  const ms = document.getElementById('calibMoveSens');
  if(ms) ms.addEventListener('input', ()=>{ calib.moveSens = +ms.value; const v=document.getElementById('calibMoveSensVal'); if(v) v.textContent = calib.moveSens.toFixed(2); saveCalib(); });
  const close = document.getElementById('calibCloseBtn');
  if(close) close.addEventListener('click', ()=>{ ensureAudio(); calibCloseMenu(); });
  const reset = document.getElementById('calibResetBtn');
  if(reset) reset.addEventListener('click', ()=>{ calib = Object.assign({}, CALIB_DEFAULTS); saveCalib(); calibSyncUI(); });
  // On-screen "Calibrate" button (works with mouse/touch too)
  const host = document.getElementById('touchUI');
  if(host && !document.getElementById('btnCalibrate')){
    const b = document.createElement('div');
    b.className = 'tbtn';
    b.id = 'btnCalibrate';
    b.textContent = 'CALIBRATE';
    b.style.right = '200px';
    b.style.bottom = '272px';
    b.style.width = '72px';
    b.style.height = '48px';
    b.style.fontSize = '9px';
    b.style.borderRadius = '10px';
    b.addEventListener('click', ()=>{ ensureAudio(); calibToggleMenu(); });
    b.addEventListener('touchstart', e=>{ e.preventDefault(); ensureAudio(); calibToggleMenu(); }, {passive:false});
    host.appendChild(b);
  }
}

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

/* ---- Workbench menu: keyboard navigation (arrows + Enter + Escape) ----
   Works alongside mouse/touch clicks. Only active while the menu is open. */
document.addEventListener('keydown', function(e){
  if(typeof wbMenuOpen === 'undefined' || !wbMenuOpen) return;
  const k = e.key;
  if(k === 'ArrowDown' || k === 'ArrowUp'){
    e.preventDefault();
    if(!wbNavEls.length) wbNavBuild();
    wbNavMove(k === 'ArrowDown' ? 1 : -1, 0);
  } else if(k === 'Enter' || k === ' '){
    e.preventDefault();
    wbNavActivate();
  } else if(k === 'Escape' || k === 'Backspace'){
    e.preventDefault();
    wbNavClose();
  }
});
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

// Initialize calibration AFTER all const declarations (CALIB_DEFAULTS, gpConnected, etc.)
// are fully initialized to avoid TDZ "Cannot access before initialization" errors.
initCalib();
