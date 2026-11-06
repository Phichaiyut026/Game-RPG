// ================= Tank damage, recovery & the fallen =================
// Tanks can now be knocked out. Zombies that press against a tank claw at it and enemy spit/bolts hit it;
// at 0 HP it brews up (a cook-off blast that also hurts nearby monsters), the crew is killed and the hull
// sits burning. A few seconds later an M984 recovery truck drives out of the motor pool, hooks the wreck
// up, and drags it back to the repair bay. After the repair the tank drives itself back to its post.
//   tank.state: 'ok' → 'wrecked' → 'towing' (truck on its way / hooking / dragging) → 'repair' → 'return' → 'ok'
// Soldiers who fall no longer vanish: they stay where they died as corpses for a few minutes, and the
// city streets are littered with the bodies of the soldiers who fought there before the base was built.

const TANK_HP = 9000;                          // the M1A1s are hard to kill
const WRECK_WAIT = 60 * 5, HOOK_TIME = 90, REPAIR_TIME = 60 * 20;
const TOW_SPD = 1.3, DRAG_SPD = 0.8, DRIVE_SPD = 0.7, ROPE = 40;
const BAY = { x: (7 + OX) * T, y: 31.9 * T };          // repair bay: the motor pool apron, in front of the garage
const AVENUE_Y = 24.5 * T;                      // the base's east-west avenue / the highway
const CORPSE_LIFE = 60 * 60 * 4, CORPSE_MAX = 40;
let TOW_TRUCKS = [], CORPSES = [];

for (const t of TANKS) Object.assign(t, { hp: TANK_HP, max: TANK_HP, state: 'ok', hitT: 0, home: { x: t.x, y: t.y } });
const tankC = t => ({ x: t.x + 23, y: t.y + 8 });               // hull centre
const setTankC = (t, x, y) => { t.x = x - 23; t.y = y - 8; };
// motor pool → avenue → the tank's post (vehicle centres, world px); reversed for the trip home
function tankRoute(t) {
  const h = { x: t.home.x + 23, y: t.home.y + 8 };
  return [{ x: BAY.x, y: AVENUE_Y }, { x: h.x, y: AVENUE_Y }, h];
}

// ---- charred sprites for the wreck ----
const charred = src => {
  const c = mk(); c.width = src.width; c.height = src.height; const g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(24,18,14,.72)'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = 'rgba(255,110,30,.5)'; for (let i = 0; i < 6; i++) g.fillRect((i * 13) % (c.width - 3), (i * 7) % (c.height - 2), 2, 1);   // glowing embers
  c.pad = src.pad; return c;
};
const TANK_HULL_WRECK = charred(TANK_HULL), TANK_TURRET_WRECK = charred(TANK_TURRET);

// ---- M984 recovery truck (34x18, faces right; two frames turn the wheels) ----
const TOW_SPR = twoFrames(34, 18, (P, f) => {
  const O = ['#7a8a52', '#5a6a3a', '#3a4626'];
  P.rect(2, 11, 31, 3, '#24281e');                                         // chassis
  P.rect(3, 7, 19, 4, O[1]); P.rect(3, 7, 19, 1, O[0]); P.rect(20, 7, 2, 4, O[2]);   // rear bed
  P.line(16, 8, 4, 1, 2, '#4a4e56'); P.line(16, 7, 4, 0, 1, '#7a808a');    // crane boom
  P.rect(14, 6, 4, 3, '#3a3e46');
  P.line(3, 1, 1, 7, 1, '#202020'); P.rect(0, 7, 3, 2, '#8a8a8a');         // cable + hook
  P.rect(23, 3, 10, 8, O[1]); P.rect(23, 3, 10, 1, O[0]); P.rect(31, 4, 2, 7, O[2]);   // cab
  P.rect(27, 4, 4, 3, '#a0c8e0'); P.px(27, 4, '#e0f4ff');                  // windscreen
  P.rect(33, 8, 1, 3, '#f8e070');                                          // headlight
  for (let x = 0; x < 3; x++) P.px(x, 10 + (x % 2), x % 2 ? '#1a1a1a' : '#f8c838');   // rear hazard stripes
  for (const wx of [7, 19, 28]) {
    P.ell(wx, 14, 3, 3, '#141414'); P.ell(wx, 14, 1, 1, '#6a6a72');
    P.px(wx + (f ? 1 : -1), 14 + (f ? -1 : 1), '#9a9aa2');
  }
}).map(c => dimensional(c));

// ---- damage ----
function damageTank(t, dmg) {
  if (t.state !== 'ok' || dmg <= 0) return;
  t.hp -= dmg; t.hitT = 8;
  const c = tankC(t);
  if (Math.hypot(c.x - p.x, c.y - p.y) < 300) float(c.x + ri(-10, 10), t.y - 14, '-' + Math.round(dmg), '#ffb080');
  if (t.hp <= 0) wreckTank(t);
}
function wreckTank(t) {
  const c = tankC(t);
  t.hp = 0; t.state = 'wrecked'; t.wreckT = WRECK_WAIT; t.fireT = 0; t.recoil = 0;
  tankBlast({ tx: c.x, ty: c.y - 4 });                                      // ammunition cook-off
  rings.push({ x: c.x, y: c.y, r: 6, max: 70, c: '#ff8020', t: 24 });
  for (const ox of [-30, 30]) addCorpse(c.x + ox + ri(-4, 4), c.y + ri(-2, 8), true);   // the crew didn't make it out
  if (Math.hypot(c.x - p.x, c.y - p.y) < 600 || t.btr) { msg(`${t.label || 'M1A1 Abrams'} knocked out! Recovery truck on the way.`, '#ff8040'); addShake(6); }
}
// zombies pressing against a tank and enemy shots that hit it
function tankDamageTick(t) {
  if (frame % 30 === 0) for (const e of enemies) {
    if (e.dead || e.d.dummy || e.frozen > 0) continue;
    if (e.x - 3 < t.x + t.w && e.x + e.w + 3 > t.x && e.y - 3 < t.y + t.h && e.y + e.h + 3 > t.y - 4)
      damageTank(t, Math.max(1, Math.round(e.d.atk * (e.d.boss ? 3 : 0.5) * nightAtk())));
  }
  for (const q of eprojs) if (q.life > 0 && q.x > t.x && q.x < t.x + t.w && q.y > t.y - 10 && q.y < t.y + t.h) {
    q.life = 0; damageTank(t, Math.round(q.atk * 0.5)); burst(q.x, q.y, '#ffd060', 4);
  }
}

// vehicles open the bridge gates they drive up to (they close again on their own once the way is clear)
function openGatesNear(x, y) {
  for (const g of GATES) {
    const c = gateCenter(g);
    if (Math.abs(x - c.x) < 44 && Math.abs(y - c.y) < 30) { if (!g.open) setGate(g, true); g.idle = 0; }
  }
}

// ---- the recovery cycle (called for every tank, every frame, from updateTanks) ----
function updateTankLife(t) {
  if (t.hitT > 0) t.hitT--;
  const c = tankC(t);
  if (t.state === 'ok') { tankDamageTick(t); return; }
  if (t.state === 'wrecked' || (t.state === 'towing' && t.truck && t.truck.phase !== 'drag')) {
    if (frame % 5 === 0) tankFx.push({ kind: 'smoke', x: c.x + ri(-8, 8), y: t.y - 10, vx: (R() - 0.5) * 0.3, vy: -0.5 - R() * 0.4,
      r: 3 + R() * 2, t: 60, max: 60, c: R() < 0.5 ? '#2a2624' : '#4a4440' });
    if (frame % 3 === 0) parts.push({ x: c.x + ri(-12, 12), y: t.y - 4, vx: (R() - 0.5) * 0.4, vy: -0.6 - R() * 0.6, t: 12, c: R() < 0.5 ? '#ff8020' : '#ffd040' });
  }
  if (t.state === 'wrecked' && inv.state !== 'idle') {                     // no recovery truck drives into a horde:
    t.wreckT = Math.max(t.wreckT, 60 * 3);                                  // it rolls out ~3 s after the invasion ends
    if (!t.holdMsg) { t.holdMsg = true; if (Math.hypot(c.x - p.x, c.y - p.y) < 600) msg('Recovery will roll out once the invasion is over.', '#c8d870'); }
  } else if (t.state === 'wrecked' && --t.wreckT <= 0) {
    t.holdMsg = false;
    const route = t.towRoute ? t.towRoute() : tankRoute(t);           // a BTR is towed from wherever it fell (patrol.js)
    t.towPath = route;
    const truck = { tow: true, tank: t, x: BAY.x, y: BAY.y, w: 34, h: 14, path: route.slice(), phase: 'out', anim: 0, face: 1, hookT: 0,
      hp: TOW_HP, max: TOW_HP, hitT: 0 };
    truck.path[truck.path.length - 1] = { x: c.x + 30, y: c.y - 2 };       // park just ahead of the wreck's nose
    t.state = 'towing'; t.truck = truck; TOW_TRUCKS.push(truck);
    if (Math.hypot(c.x - p.x, c.y - p.y) < 600) msg('Recovery truck dispatched from the motor pool.', '#c8d870');
  }
  if (t.state === 'repair') {
    if (frame % 6 === 0) parts.push({ x: c.x + ri(-16, 16), y: c.y - ri(4, 14), vx: (R() - 0.5) * 2, vy: -R() * 1.5, t: 10, c: R() < 0.5 ? '#ffffff' : '#ffd060' });
    if (Math.hypot(c.x - BAY.x, c.y - BAY.y) > 1) {                        // settle into the bay
      const dx = BAY.x - c.x, dy = BAY.y - c.y, d = Math.hypot(dx, dy), s = Math.min(0.5, d);
      setTankC(t, c.x + dx / d * s, c.y + dy / d * s);
    }
    t.hp = Math.min(t.max, t.hp + t.max / REPAIR_TIME);
    if (t.hp >= t.max) {
      t.state = 'return'; t.path = tankRoute(t);
      if (Math.hypot(c.x - p.x, c.y - p.y) < 400) msg('Tank repaired! Rolling back to its post.', '#9ad868');
    }
  }
  if (t.state === 'return') {
    const wp = t.path[0];
    if (!wp) { t.state = 'ok'; t.x = t.home.x; t.y = t.home.y; t.hp = t.max; t.cd = 30; return; }
    openGatesNear(c.x, c.y);
    const dx = wp.x - c.x, dy = wp.y - c.y, d = Math.hypot(dx, dy);
    if (d <= DRIVE_SPD) { setTankC(t, wp.x, wp.y); t.path.shift(); }
    else { setTankC(t, c.x + dx / d * DRIVE_SPD, c.y + dy / d * DRIVE_SPD); t.aim = Math.atan2(dy, dx); t.flip = dx < 0; }
    if (frame % 8 === 0) tankFx.push({ kind: 'smoke', x: c.x - Math.sign(dx || 1) * 24, y: c.y - 2, vx: 0, vy: -0.3, r: 2, t: 30, max: 30, c: '#6a645c' });   // exhaust
  }
}
// the recovery truck can be destroyed too: zombies clawing at it, enemy shots. Its wreck burns where it died and
// is salvaged after TOW_SALVAGE; the vehicle it came for goes back to waiting for the next truck.
const TOW_HP = 1200, TOW_SALVAGE = 60 * 60;
function towDamageTick(k) {
  if (frame % 30 === 0) for (const e of enemies) {
    if (e.dead || e.d.dummy || e.frozen > 0) continue;
    if (Math.abs(e.x + e.w / 2 - k.x) < 17 + e.w / 2 + 3 && Math.abs(e.y + e.h / 2 - (k.y - 3)) < 9 + e.h / 2 + 3)
      hurtTow(k, Math.max(1, Math.round(e.d.atk * (e.d.boss ? 3 : 1) * nightAtk())));
  }
  for (const q of eprojs) if (q.life > 0 && Math.abs(q.x - k.x) < 17 && q.y > k.y - 14 && q.y < k.y + 6) {
    q.life = 0; hurtTow(k, Math.round(q.atk * 0.5)); burst(q.x, q.y, '#ffd060', 4);
  }
}
function hurtTow(k, dmg) {
  if (k.phase === 'wreck' || dmg <= 0) return;
  k.hp -= dmg; k.hitT = 8;
  if (Math.hypot(k.x - p.x, k.y - p.y) < 300) float(k.x, k.y - 16, '-' + dmg, '#ffb080');
  if (k.hp > 0) return;
  k.hp = 0; k.phase = 'wreck'; k.salvageT = TOW_SALVAGE; k.path = [];
  tankBlast({ tx: k.x, ty: k.y - 4 });                                     // fuel tank goes up
  addCorpse(k.x - 8, k.y, true);                                           // the driver
  const t = k.tank;                                                        // the wreck it came for waits for another truck
  if (t && t.truck === k) { t.truck = null; t.state = 'wrecked'; t.wreckT = WRECK_WAIT; t.holdMsg = false; }
  msg('The recovery truck has been destroyed! Another one will be sent.', '#ff7050');
}
function updateTowTrucks() {
  for (const k of TOW_TRUCKS) {
    const t = k.tank, cx = k.x, cy = k.y;
    if (k.hitT > 0) k.hitT--;
    if (k.phase === 'wreck') {                                               // burning hulk until it's salvaged
      if (frame % 6 === 0) tankFx.push({ kind: 'smoke', x: k.x + ri(-6, 6), y: k.y - 10, vx: (R() - 0.5) * 0.3, vy: -0.5, r: 3, t: 50, max: 50, c: '#2a2624' });
      if (--k.salvageT <= 0) k.gone = true;
      continue;
    }
    towDamageTick(k);
    if (k.phase === 'wreck') continue;
    if (k.phase === 'hook') {
      if (--k.hookT <= 0) { k.phase = 'drag'; k.path = (t.towPath || tankRoute(t)).slice().reverse().slice(1); k.path.push({ x: BAY.x, y: BAY.y + ROPE }); }
      continue;
    }
    const wp = k.path[0];
    if (!wp) {
      if (k.phase === 'out') { k.phase = 'hook'; k.hookT = HOOK_TIME; k.face = tankC(t).x < k.x ? -1 : 1; }
      else if (k.phase === 'drag') { t.state = 'repair'; t.truck = null; k.gone = true; }
      continue;
    }
    openGatesNear(k.x, k.y);
    const sp = k.phase === 'drag' ? DRAG_SPD : TOW_SPD, dx = wp.x - cx, dy = wp.y - cy, d = Math.hypot(dx, dy);
    if (d <= sp) { k.x = wp.x; k.y = wp.y; k.path.shift(); }
    else { k.x += dx / d * sp; k.y += dy / d * sp; if (Math.abs(dx) > 0.2) k.face = Math.sign(dx); }
    k.anim++;
    if (k.phase === 'drag') {                                                // the wreck follows on the tow cable
      const tc = tankC(t), rx = k.x - tc.x, ry = k.y - tc.y, rd = Math.hypot(rx, ry);
      if (rd > ROPE) setTankC(t, tc.x + rx / rd * (rd - ROPE), tc.y + ry / rd * (rd - ROPE));
      if (frame % 6 === 0) parts.push({ x: tc.x + ri(-14, 14), y: tc.y + 8, vx: 0, vy: -0.2, t: 10, c: '#8a7a5a' });   // dust off the tracks
    }
  }
  TOW_TRUCKS = TOW_TRUCKS.filter(k => !k.gone);
}

// ---- corpses ----
function addCorpse(x, y, burnt = false) {
  CORPSES.push({ corpse: true, x, y, flip: R() < 0.5, burnt, t: 0, life: CORPSE_LIFE });
  if (CORPSES.length > CORPSE_MAX) CORPSES.shift();
}
// the city's dead: soldiers who held these streets before the base was built (fixed, they never fade)
const CITY_DEAD = (() => {
  let s = 77; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const out = [];
  for (let i = 0; i < 600 && out.length < 28; i++) {
    const tx = 52 + OX + Math.floor(r() * 50), ty = 2 + Math.floor(r() * 86);   // the abandoned city (east of the river)
    const ch = world[ty] && world[ty][tx];
    if (!'%":s;'.includes(ch) || SOLID.has(ch)) continue;
    let nearCover = false;                                                  // they fell beside wrecks and barricades
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ('r)(@F'.includes(world[ty + dy]?.[tx + dx])) nearCover = true;
    if (!nearCover && r() < 0.7) continue;
    out.push({ corpse: true, x: tx * T + 2 + Math.floor(r() * 4), y: ty * T + 4, flip: r() < 0.5, burnt: r() < 0.2, t: 0, life: Infinity, old: true });
  }
  return out;
})();
let corpseSpr = null;
function corpseSprites() {                                                  // soldier lying on his back, rifle dropped beside him
  const make = burnt => {
    const c = mk(); c.width = 24; c.height = 16; const g = c.getContext('2d');
    g.save(); g.translate(12, 8); g.rotate(-Math.PI / 2); g.drawImage(SOLDIER_SPR[0], -SOLDIER_SPR[0].width / 2, -SOLDIER_SPR[0].height / 2); g.restore();
    g.fillStyle = '#1e1e22'; g.fillRect(4, 13, 11, 2); g.fillStyle = '#4a4e56'; g.fillRect(5, 13, 9, 1);   // rifle
    if (burnt) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,14,10,.78)'; g.fillRect(0, 0, 24, 16); }
    return c;
  };
  corpseSpr = [make(false), make(true)];
}
function drawCorpses(cx, cy) {
  if (!corpseSpr) corpseSprites();
  for (const list of [CITY_DEAD, CORPSES]) for (const c of list) {
    const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
    if (x < -30 || x > VW + 30 || y < -30 || y > VH + 30) continue;
    ctx.globalAlpha = c.life === Infinity ? 1 : Math.min(1, (c.life - c.t) / 120);
    ctx.fillStyle = c.old ? '#3a1410' : '#6a0c0c';                         // blood pool (dried brown on the old ones)
    ctx.fillRect(x - 2, y + 6, 16, 6); ctx.fillRect(x, y + 4, 12, 9); ctx.fillRect(x + 12, y + 9, 5, 3);
    const img = corpseSpr[c.burnt ? 1 : 0];
    if (c.flip) { ctx.save(); ctx.translate(x + 18, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
    else ctx.drawImage(img, x - 6, y);
  }
  ctx.globalAlpha = 1;
}
function updateCorpses() {
  for (const c of CORPSES) c.t++;
  CORPSES = CORPSES.filter(c => c.t < c.life);
}

// ---- drawing the truck, the tow cable and the tank's status ----
let TOW_WRECK = null;
function drawTowTruck(k, cx, cy) {
  const x = Math.round(k.x - cx), y = Math.round(k.y - cy), img = TOW_SPR[Math.floor(k.anim / 6) % 2];
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 16, y + 4, 34, 3);
  if (k.phase === 'wreck') {                                                // charred hulk with flames
    if (!TOW_WRECK) TOW_WRECK = charred(TOW_SPR[0]);
    drawSprite(TOW_WRECK, x - 17, y - 12, k.face < 0);
    for (let i = 0; i < 3; i++) { const fh = 3 + ((frame + i * 5) % 7); ctx.fillStyle = flameCol(((frame + i * 3) % 10) / 14); ctx.fillRect(x - 9 + i * 7, y - 12 - fh, 3, fh); }
    return;
  }
  drawSprite(k.hitT > 0 && k.hitT % 4 < 2 ? whiteOf(img) : img, x - 17, y - 12, k.face < 0);
  if (k.hp < k.max) bar(x - 14, y - 18, 28, 2, k.hp / k.max, '#58d858', '#203820');
  if (Math.floor(frame / 10) % 2) { ctx.fillStyle = '#ffb020'; ctx.fillRect(x + (k.face < 0 ? -9 : 7), y - 10, 2, 2); }   // amber beacon
  if (k.phase === 'hook' || k.phase === 'drag') {                           // tow cable from the boom to the tank
    const tc = tankC(k.tank), bx = x + (k.face < 0 ? 14 : -14), by = y - 11;
    ctx.strokeStyle = '#202020'; ctx.lineWidth = 1; ctx.beginPath();
    const sag = k.phase === 'hook' ? 6 : 2;
    ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + tc.x - cx) / 2, (by + tc.y - cy) / 2 + sag, Math.round(tc.x - cx), Math.round(tc.y - cy - 4)); ctx.stroke();
  }
  if (k.phase === 'hook' && Math.hypot(k.x - p.x, k.y - p.y) < 220) text('HOOKING UP', x, y - 24, '#f8c838', 'center');
}
function drawTankStatus(t, x, y) {
  if (t.state === 'ok') { if (t.hp < t.max) bar(x + 7, y - 20, 32, 2, t.hp / t.max, '#58d858', '#203820'); return; }
  const near = Math.hypot(t.x - p.x, t.y - p.y) < 260;
  if (t.state === 'wrecked' || t.state === 'towing') {
    for (let i = 0; i < 4; i++) {                                           // flames licking out of the hatches
      const fx = x + 10 + i * 8, fh = 3 + ((frame + i * 5) % 7);
      ctx.fillStyle = flameCol(((frame + i * 3) % 10) / 14); ctx.fillRect(fx, y - 10 - fh, 3, fh);
    }
    if (near && t.state === 'wrecked') text('KNOCKED OUT', x + t.w / 2, y - 28, '#ff7050', 'center');
  } else if (t.state === 'repair') {
    if (near) text('REPAIRING', x + t.w / 2, y - 30, '#9ad868', 'center');
    bar(x + 7, y - 20, 32, 2, t.hp / t.max, '#9ad868', '#203820');
  }
}
