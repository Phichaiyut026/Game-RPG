// ================= Raid force: Humvee gun trucks, extra Abrams, AH-64D Apache =================
// When the sirens sound, the motor pool sends out extra firepower for the length of the raid:
//   4 M1114 Humvees with a .50 cal M2 turret park behind the river fence and hose down the horde,
//   2 more M1A1 Abrams roll out to the field and engage bosses / packs with the 120 mm (updateTank, tank.js),
//   1 AH-64D Apache lifts off its helipad by the hangar in the outer yard and circles the river: 30 mm chain gun on the packs, Hellfires on bosses.
// EVERYTHING CAN BREAK: zombies that reach a vehicle or gun tear at it (hitVehicle), boss-thrown shots and big
// bosses clawing at the low-flying Apache bring it down. A destroyed vehicle burns as a wreck until the raid is
// over and is then salvaged (removed); the next raid brings fresh ones. Survivors drive / fly home after the raid.

const HV_HP = 1600, HV_RANGE = 180, HV_CD = 7;
const HV_POSTS = [[37, 15], [37, 21], [37, 32], [37, 39]].map(([x, y]) => [x + OX, y]);         // tile, on the firing line behind the river fence
const RT_POSTS = [[33, 18], [33, 35]].map(([x, y]) => [x + OX, y]);   // behind the HESCO line                               // extra Abrams on the firing line
// Ironvale Army Airfield, in the centre of the base (world.js): four helipads, world px centres (new tile numbers).
// Pads 1-2: the AH-64Ds · pad 3: the UH-60 C2 command helicopter · pad 4: the FPV drone team.
const HELI_PADS = [[36.5, 30.5], [42.5, 30.5], [36.5, 36.5], [42.5, 36.5]].map(([x, y], i) => ({ x: x * T, y: y * T, n: i + 1 }));
const HELI_HP = 5000, HELI_ALT = 34, HELI_SPD = 1.7;
const SALVAGE_T = 60 * 20;                                           // wrecks are cleared 20 s after the raid
let HUMVEES = [], RAID_TANKS = [], heliShots = [];
// two AH-64Ds, parked on their pads until the sirens sound; they lift off from there and land back there
const HELI_REBUILD = 60 * 40;                                        // a replacement is flown in 40 s after a raid
const mkApache = i => ({ heli: true, pad: HELI_PADS[i], ph: i * Math.PI, x: HELI_PADS[i].x, y: HELI_PADS[i].y, alt: 0, hp: HELI_HP, max: HELI_HP,
  state: 'parked', face: 1, t: i * 300, gunCD: 0, msl: 120 + i * 60, hitT: 0, clawCD: 0, rotor: 0, rebuildT: 0 });
let APACHES = [0, 1].map(mkApache);

// nearest spot where a w x h tile footprint sits on open ground
function openSpot(tx, ty, w, h) {
  for (let r = 0; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    let ok = true;
    for (let y = ty + dy; y < ty + dy + h && ok; y++) for (let x = tx + dx; x < tx + dx + w; x++) if (!world[y] || SOLID.has(world[y][x])) { ok = false; break; }
    if (ok) return [tx + dx, ty + dy];
  }
  return [tx, ty];
}
// motor pool → avenue → east along it → up/down the field to the post (vehicle centres, world px)
const motorRoute = (x, y) => [{ x: BAY.x, y: AVENUE_Y }, { x, y: AVENUE_Y }, { x, y }];

// ---- M1114 Humvee (32x16, faces right); the M2 is drawn on the roof ring, swung to its target ----
const HV_SPR = twoFrames(32, 16, (P, f) => {
  const C = ['#c2ac7a', '#9a8656', '#6a5a38'];
  P.rect(1, 6, 30, 6, C[1]); P.rect(1, 6, 30, 1, C[0]); P.rect(1, 11, 30, 1, C[2]);   // body
  P.rect(22, 4, 9, 3, C[1]); P.rect(22, 4, 9, 1, C[0]);                              // hood
  P.rect(8, 1, 14, 6, C[1]); P.rect(8, 1, 14, 1, C[0]);                             // armoured cab
  P.rect(10, 2, 4, 3, '#4a6070'); P.rect(16, 2, 4, 3, '#4a6070'); P.px(10, 2, '#9ac0d0'); P.px(16, 2, '#9ac0d0');   // windows
  P.rect(13, 0, 5, 1, '#3a3a34');                                                    // turret ring
  P.rect(30, 7, 1, 2, '#f8e070'); P.rect(1, 7, 1, 2, '#c03030');                    // lights
  P.rect(4, 8, 3, 2, C[2]); P.rect(25, 9, 3, 1, '#2a2a2a');                         // jerrycan, grille
  for (const wx of [7, 25]) { P.ell(wx, 12, 3, 3, '#151515'); P.ell(wx, 12, 1, 1, '#6a6a6a'); P.px(wx + (f ? 1 : -1), 12 + (f ? 1 : -1), '#9a9a9a'); }
}).map(c => dimensional(c));
let HV_WRECK = null;

function deployRaidForce() {
  HUMVEES = HV_POSTS.map(([tx, ty], i) => {
    const [px, py] = openSpot(tx, ty, 2, 1);
    return { humvee: true, veh: true, label: 'HUMVEE M2', x: BAY.x - 16 + i * 4, y: BAY.y - 6, w: 32, h: 12, path: motorRoute(px * T + 16, py * T + 8),
      state: 'move', hp: HV_HP, max: HV_HP, hitT: 0, aim: 0, face: 1, cd: ri(0, 20), fireT: 0, anim: 0, wreckT: 0 };
  });
  RAID_TANKS = RT_POSTS.map(([tx, ty]) => {
    const [px, py] = openSpot(tx, ty, 3, 1);
    const t = { tank: true, raid: true, veh: true, name: 'M1A1 ABRAMS', x: 0, y: 0, w: 46, h: 16, aim: 0, flip: false, cd: 60, fireT: 0, recoil: 0,
      hp: 15000, max: 15000, state: 'move', hitT: 0, path: motorRoute(px * T + 23, py * T + 8) };
    setTankC(t, BAY.x, BAY.y);
    return t;
  });
  for (const a of APACHES) if (a.state === 'parked') a.state = 'takeoff';           // scramble from the airfield
  if (C2.state === 'parked') C2.state = 'takeoff';                                 // the command helicopter goes up too
  msg('Motor pool: Humvee gun trucks and two more Abrams are rolling out! Apache lifting off!', '#9ad868');
}
// vehicles and guns the horde goes after (invasion.js hordeAI)
const vehicleTargets = () => [...HUMVEES.filter(h => h.state !== 'wreck' && h.state !== 'move'), ...RAID_TANKS.filter(t => t.state === 'ok'), ...HOWITZERS.filter(h => !h.dead)];
function hitVehicle(v, e) {
  const dmg = Math.max(1, Math.round(e.d.atk * (e.d.boss ? 6 : 1)));
  e.biteCD = 40;
  if (v.tank) return damageTank(v, dmg);                                 // Abrams: wreckTank at 0 (recovery.js)
  v.hp -= dmg; v.hitT = 8;
  if (Math.hypot(v.x - p.x, v.y - p.y) < 300) float(v.x + v.w / 2, v.y - 10, '-' + dmg, '#ffb080');
  if (v.hp > 0) return;
  if (v.howitzer) destroyHowitzer(v); else wreckHumvee(v);
}
function wreckHumvee(v) {
  v.state = 'wreck'; v.hp = 0; v.fireT = 0;
  const cx = v.x + 16, cy = v.y + 6;
  tankBlast({ tx: cx, ty: cy });                                         // fuel and ammo cook off
  addCorpse(cx - 14, cy + 4, true);
  msg('A Humvee gun truck has been destroyed!', '#ff7050');
}

function updateRaidForce() {
  const raid = typeof inv !== 'undefined' && inv.state !== 'idle';
  if (raid && !inv.forceOut && inv.state === 'wave') { inv.forceOut = true; deployRaidForce(); }
  if (!raid && inv.forceOut) {                                           // raid over: everyone heads home, wrecks get salvaged
    inv.forceOut = false; inv.salvageT = SALVAGE_T;
    for (const h of HUMVEES) if (h.state !== 'wreck') { h.state = 'home'; h.path = [{ x: h.x + 16, y: AVENUE_Y }, { x: BAY.x, y: AVENUE_Y }, { x: BAY.x, y: BAY.y }]; }
    for (const t of RAID_TANKS) if (t.state === 'ok' || t.state === 'move') { t.state = 'home'; const c = tankC(t); t.path = [{ x: c.x, y: AVENUE_Y }, { x: BAY.x, y: AVENUE_Y }, { x: BAY.x, y: BAY.y }]; }
    for (const a of APACHES) if (['takeoff', 'patrol'].includes(a.state)) a.state = 'rtb';
    if (C2.state === 'takeoff' || C2.state === 'station') C2.state = 'rtb';
  }
  if (!raid && inv.salvageT > 0 && --inv.salvageT === 0) {
    HUMVEES = HUMVEES.filter(h => h.state !== 'wreck'); RAID_TANKS = RAID_TANKS.filter(t => t.state !== 'wrecked');
    for (const a of APACHES) if (a.state === 'wreck') { a.state = 'rebuild'; a.rebuildT = HELI_REBUILD; }   // wreck cleared
    if (C2.state === 'wreck') { C2.state = 'rebuild'; C2.rebuildT = HELI_REBUILD; }
  }
  for (const h of HUMVEES) updateHumvee(h);
  HUMVEES = HUMVEES.filter(h => !h.gone);
  for (const t of RAID_TANKS) updateRaidTank(t);
  RAID_TANKS = RAID_TANKS.filter(t => !t.gone);
  for (const a of APACHES) updateApache(a);
  updateC2(C2);
  updateHeliShots();
}
// drive along a path of centre points; true once it's at the end
function drivePath(v, centre, setCentre, spd) {
  const wp = v.path[0];
  if (!wp) return true;
  const c = centre(v), dx = wp.x - c.x, dy = wp.y - c.y, d = Math.hypot(dx, dy);
  if (Math.abs(dx) > 0.3) v.face = Math.sign(dx);
  if (d <= spd) { setCentre(v, wp.x, wp.y); v.path.shift(); }
  else setCentre(v, c.x + dx / d * spd, c.y + dy / d * spd);
  if (typeof openGatesNear === 'function') openGatesNear(c.x, c.y);
  v.anim = (v.anim || 0) + 1;
  return false;
}
const hvC = h => ({ x: h.x + 16, y: h.y + 6 }), setHvC = (h, x, y) => { h.x = x - 16; h.y = y - 6; };
function updateHumvee(h) {
  if (h.hitT > 0) h.hitT--;
  if (h.fireT > 0) h.fireT--;
  if (h.state === 'wreck') {
    if (frame % 6 === 0) tankFx.push({ kind: 'smoke', x: h.x + 16 + ri(-6, 6), y: h.y, vx: (R() - 0.5) * 0.3, vy: -0.5, r: 3, t: 50, max: 50, c: '#2a2624' });
    return;
  }
  if (h.state === 'move') { if (drivePath(h, hvC, setHvC, 1.6)) { h.state = 'hold'; h.face = 1; } return; }
  if (h.state === 'home') { if (drivePath(h, hvC, setHvC, 1.6)) h.gone = true; return; }
  // hold: .50 cal bursts at the nearest horde zombie (bosses count double-close)
  if (--h.cd > 0) return;
  const gx = h.x + 15, gy = h.y - 2;
  let best = null, bd = HV_RANGE;
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const d = Math.hypot(e.x + e.w / 2 - gx, e.y + e.h / 2 - gy) - (e.d.boss ? 40 : 0);
    if (d < bd) { bd = d; best = e; }
  }
  if (!best) { h.cd = 15; return; }
  h.aim = Math.atan2(best.y + best.h / 2 - gy, best.x + best.w / 2 - gx);
  h.cd = HV_CD; h.fireT = 4;
  guardShots.push({ x: gx + Math.cos(h.aim) * 12, y: gy + Math.sin(h.aim) * 12, e: best, life: 60, dmg: Math.round(guardDmg('heavy') * 1.8), fx: 'heavy' });
  if (Math.hypot(gx - p.x, gy - p.y) < 220 && frame % 3 === 0) sfx('heavy_mg');
}
function updateRaidTank(t) {
  if (t.hitT > 0) t.hitT--;
  if (t.state === 'wrecked') {
    if (frame % 5 === 0) tankFx.push({ kind: 'smoke', x: t.x + 23 + ri(-8, 8), y: t.y - 10, vx: (R() - 0.5) * 0.3, vy: -0.5, r: 3, t: 60, max: 60, c: '#2a2624' });
    return;
  }
  if (t.state === 'move' || t.state === 'home') {
    const done = drivePath(t, tankC, setTankC, 1.2);
    t.flip = t.face < 0; t.aim = t.flip ? Math.PI : 0;
    if (frame % 8 === 0) tankFx.push({ kind: 'smoke', x: tankC(t).x - (t.face || 1) * 24, y: tankC(t).y - 2, vx: 0, vy: -0.3, r: 2, t: 30, max: 30, c: '#6a645c' });
    if (done) { if (t.state === 'home') t.gone = true; else { t.state = 'ok'; t.flip = false; t.aim = 0; } }
    return;
  }
  tankDamageTick(t);                                                     // zombies pressing on it, enemy shots (recovery.js)
  if (t.state === 'ok') updateTank(t);
}

// ---- AH-64D Apache ----
function updateApache(a) {
  if (a.state === 'parked') { a.hitT = 0; return; }                    // on its pad, rotors still
  if (a.state === 'rebuild') {                                           // waiting for the replacement airframe
    if (--a.rebuildT <= 0) { Object.assign(a, mkApache(APACHES.indexOf(a)), { t: 0 }); msg(`A replacement AH-64D has landed on pad ${a.pad.n}.`, '#9ad868'); }
    return;
  }
  a.t++; a.rotor++;
  if (a.hitT > 0) a.hitT--;
  if (a.state === 'wreck') { if (frame % 4 === 0) tankFx.push({ kind: 'smoke', x: a.x + ri(-8, 8), y: a.y - 4, vx: (R() - 0.5) * 0.4, vy: -0.6, r: 4, t: 60, max: 60, c: '#2a2624' }); return; }
  if (a.state === 'crash') {                                             // spinning down, trailing fire and smoke
    a.alt -= 0.45; a.x += Math.cos(a.t * 0.3) * 1.2; a.y += Math.sin(a.t * 0.3) * 0.6;
    if (frame % 2 === 0) tankFx.push({ kind: 'smoke', x: a.x, y: a.y - a.alt, vx: 0, vy: -0.3, r: 3, t: 40, max: 40, c: R() < 0.5 ? '#2a2624' : '#ff8020' });
    if (a.alt <= 0) {
      a.alt = 0; a.state = 'wreck';
      tankBlast({ tx: a.x, ty: a.y });                                   // the crash takes zombies with it
      msg('The Apache is down!', '#ff5040');
    }
    return;
  }
  const flyTo = (tx, ty, spd) => {
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.5) a.face = Math.sign(dx);
    if (d > spd) { a.x += dx / d * spd; a.y += dy / d * spd; return false; }
    a.x = tx; a.y = ty; return true;
  };
  if (a.state === 'takeoff') { a.alt += 0.5; if (a.alt >= HELI_ALT) a.state = 'patrol'; return; }
  if (a.state === 'rtb') {
    if (flyTo(a.pad.x, a.pad.y, HELI_SPD * 1.2)) {                      // over its pad: settle down, ground crew patch it up
      a.alt -= 0.5;
      if (a.alt <= 0) { a.alt = 0; a.state = 'parked'; a.hp = a.max; a.face = 1; a.rotor = 0; }
    }
    return;
  }
  // patrol: a figure-of-eight over the river, where the horde crosses
  flyTo((46 + OX) * T + Math.cos(a.t * 0.004 + a.ph) * 8 * T, 24 * T + Math.sin(a.t * 0.008 + a.ph) * 17 * T, HELI_SPD);   // the two fly opposite loops
  // getting hurt: enemy shots that pass under it, bosses swatting at it when it flies over them
  for (const q of eprojs) if (q.life > 0 && Math.hypot(q.x - a.x, q.y - a.y) < 12) { q.life = 0; hurtApache(a, Math.round(q.atk * 2)); }
  if (--a.clawCD <= 0) {
    a.clawCD = 45;
    for (const e of enemies) if (!e.dead && e.d.boss && Math.hypot(e.x + e.w / 2 - a.x, e.y + e.h / 2 - a.y) < 60) hurtApache(a, Math.round(e.d.atk * 3));
  }
  if (a.state !== 'patrol') return;
  // 30 mm chain gun: short bursts into the nearest pack under the nose
  if (--a.gunCD <= 0) {
    let best = null, bd = 210;
    for (const e of enemies) if (e.horde && !e.dead && e.x > (36 + OX) * T) { const d = Math.hypot(e.x + e.w / 2 - a.x, e.y + e.h / 2 - a.y); if (d < bd) { bd = d; best = e; } }
    if (best && howSafe(best.x + best.w / 2, best.y + best.h / 2)) {
      a.gunCD = 6;
      heliShots.push({ kind: 'gun', x: a.x + a.face * 29, y: a.y - a.alt + 9, tx: best.x + best.w / 2 + ri(-6, 6), ty: best.y + best.h / 2 + ri(-6, 6), t: 0, dur: 8 });
      if (Math.hypot(a.x - p.x, a.y - p.y) < 260 && frame % 2 === 0) sfx('heavy_mg');
    } else a.gunCD = 20;
  }
  // AGM-114 Hellfire: one at a time at a boss in range
  if (--a.msl <= 0) {
    const bosses = enemies.filter(e => !e.dead && e.horde && e.d.boss && Math.hypot(e.x - a.x, e.y - a.y) < 340);
    if (bosses.length) {
      const b = bosses[ri(0, bosses.length - 1)];
      heliShots.push({ kind: 'msl', x: a.x + a.face * 2, y: a.y - a.alt + 7, e: b, t: 0, ang: 0 });
      a.msl = 60 * 3;
      if (Math.hypot(a.x - p.x, a.y - p.y) < 300) sfx('cannon');
    } else a.msl = 30;
  }
}
function hurtApache(a, dmg) {
  if (a.state === 'crash' || a.state === 'wreck') return;
  a.hp -= dmg; a.hitT = 8;
  if (a.hp <= 0) { a.hp = 0; a.state = 'crash'; msg('Apache hit! It\'s going down!', '#ff5040'); sfx('cry'); }
}
function updateHeliShots() {
  for (const s of heliShots) {
    s.t++;
    if (s.kind === 'gun') {
      if (s.t < s.dur) continue;
      s.done = true;                                                     // 30 mm HEDP: a small burst
      burst(s.tx, s.ty, '#ffd060', 5); burst(s.tx, s.ty, '#5a4a3a', 3);
      for (const e of enemies) {
        if (e.dead || e.d.dummy) continue;
        if (Math.hypot(e.x + e.w / 2 - s.tx, e.y + e.h / 2 - s.ty) > 14 + Math.max(e.w, e.h) / 2) continue;
        const dmg = Math.max(1, 260 - e.d.def); e.hp -= dmg; e.flash = 6;
        if (e.hp <= 0) { if (e.d.boss) killEnemy(e); else { e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, '#a01818', 6); } }
      }
      continue;
    }
    // Hellfire: homes on its boss
    if (s.e.dead) { s.done = true; tankBlast({ tx: s.x, ty: s.y }); continue; }
    const tx = s.e.x + s.e.w / 2, ty = s.e.y + s.e.h / 2, dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
    s.ang = Math.atan2(dy, dx);
    if (d < 8) {
      s.done = true;
      tankFx.push({ kind: 'boom', x: tx, y: ty, t: 30, max: 30, chunks: Array.from({ length: 22 }, () => ({ dx: (R() - 0.5) * 24, dy: (R() - 0.5) * 16, s: 3 + ri(0, 5), vx: (R() - 0.5) * 2, vy: -R() * 1.2, hot: R() })), tongues: [] });
      burst(tx, ty, '#ff8020', 18);
      const dmg = Math.max(1, 8000 - s.e.d.def); s.e.hp -= dmg; s.e.flash = 8;
      if (Math.hypot(tx - p.x, ty - p.y) < 400) { float(tx, s.e.y - 4, String(dmg), '#ff9030'); sfx('boom'); addShake(3); }
      if (s.e.hp <= 0) killEnemy(s.e);
      continue;
    }
    const sp = Math.min(d, 5 + s.t * 0.1);
    s.x += dx / d * sp; s.y += dy / d * sp;
    if (s.t % 2 === 0) tankFx.push({ kind: 'smoke', x: s.x, y: s.y, vx: 0, vy: -0.1, r: 1.5, t: 18, max: 18, c: '#c8c2b6' });
    if (s.t > 200) { s.done = true; tankBlast({ tx: s.x, ty: s.y }); }
  }
  heliShots = heliShots.filter(s => !s.done);
}

// ---- drawing ----
function drawHumvee(h, cx, cy) {
  const x = Math.round(h.x - cx), y = Math.round(h.y - cy);
  if (x < -40 || x > VW + 40 || y < -30 || y > VH + 30) return;
  const wreck = h.state === 'wreck';
  if (wreck && !HV_WRECK) HV_WRECK = HV_SPR.map(charred);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 1, y + 11, 30, 3);
  const spr = (wreck ? HV_WRECK : HV_SPR)[Math.floor((h.anim || 0) / 6) % 2];
  drawSprite(h.hitT > 0 && h.hitT % 4 < 2 ? whiteOf(spr) : spr, x - 1, y - 4, h.face < 0);
  if (wreck) {
    for (let i = 0; i < 3; i++) { const fh = 3 + ((frame + i * 5) % 7); ctx.fillStyle = flameCol(((frame + i * 3) % 10) / 14); ctx.fillRect(x + 8 + i * 6, y - 6 - fh, 3, fh); }
    return;
  }
  // gunner + M2 on the roof ring
  const gx = x + 15, gy = y - 5, aim = h.state === 'hold' ? h.aim : (h.face < 0 ? Math.PI : 0);
  ctx.fillStyle = '#2d4625'; ctx.fillRect(gx - 2, gy - 3, 5, 4); ctx.fillStyle = '#486c36'; ctx.fillRect(gx - 2, gy - 3, 5, 1);   // helmet
  ctx.save(); ctx.translate(gx, gy); ctx.rotate(aim);
  ctx.fillStyle = '#100c1a'; ctx.fillRect(0, -2, 13, 4); ctx.fillStyle = '#3a3e34'; ctx.fillRect(1, -1, 11, 2);
  ctx.fillStyle = '#5a5e54'; ctx.fillRect(-1, -3, 4, 6);                                                   // gun shield
  if (h.fireT > 1) { ctx.fillStyle = '#fff6a0'; ctx.fillRect(12, -2, 3, 4); ctx.fillStyle = '#ff9020'; ctx.fillRect(15, -1, 2, 2); }
  ctx.restore();
  if (h.hp < h.max) bar(x + 2, y - 14, 28, 2, h.hp / h.max, '#58d858', '#203820');
  if (mode === 'play' && Math.hypot(p.x - h.x - 10, p.y - h.y) < 80) text('HUMVEE M2', x + 16, y - 24, '#c8d870', 'center');
}
// ---- AH-64D Apache Longbow model (72x30, faces right / nose at x 71). Sculpted once; the 4-blade main rotor
// and the 4-blade tail rotor are drawn on top every frame so they spin. Landmarks (model px):
//   Longbow radar dome on the mast (36,3) · rotor hub (36,9) · tail rotor hub (6,6) · chin gun muzzle (64,24)
const APACHE_W = 72, APACHE_H = 30, APACHE_HUB = { x: 36, y: 5 }, APACHE_TR = { x: 6, y: 6 };
const APACHE_SPR = (() => {
  const c = sculpt(APACHE_W, APACHE_H, P => {
    const G = { lit: '#66714c', mid: '#4e573a', sh: '#3a412b', deep: '#262b1c' };          // olive drab
    const M = { lit: '#8a8e8c', mid: '#5c6062', sh: '#3c3f40' };                            // bare metal
    const K = '#141414', GL = '#22323a', GH = '#8fb6c6';                                   // black, glass, glint
    // -- tail: boom, swept fin, stabilator, tail wheel
    P.rect(8, 13, 16, 4, G.mid); P.rect(8, 13, 16, 1, G.lit); P.rect(8, 16, 16, 1, G.sh);   // tail boom (thinner at the back)
    P.rect(20, 12, 6, 6, G.mid); P.rect(20, 12, 6, 1, G.lit);
    P.line(9, 15, 4, 2, 3, G.mid); P.line(10, 15, 6, 3, 2, G.lit);                         // vertical fin, swept back
    P.rect(3, 1, 4, 3, G.mid); P.rect(3, 1, 4, 1, G.lit);                                 // fin cap / tail-rotor gearbox
    P.rect(2, 16, 11, 2, G.sh); P.rect(2, 16, 11, 1, G.mid);                               // horizontal stabilator
    P.line(11, 17, 11, 20, 1, M.sh); P.ell(11, 21, 1, 1, K);                              // tail wheel
    // -- main fuselage
    P.rect(24, 11, 34, 10, G.mid); P.rect(24, 11, 34, 2, G.lit); P.rect(24, 19, 34, 2, G.sh);
    P.rect(26, 21, 28, 1, G.deep);                                                         // belly
    // engine nacelles on the shoulders, "black hole" IR-suppressed exhausts pointing aft
    P.rect(27, 7, 17, 5, G.mid); P.rect(27, 7, 17, 1, G.lit); P.rect(29, 11, 13, 1, G.sh);
    P.rect(24, 8, 4, 3, K); P.rect(25, 9, 2, 1, '#3a2a22');                               // exhaust
    for (const x of [31, 35, 39]) P.rect(x, 9, 2, 1, G.deep);                             // intake louvres
    P.rect(44, 6, 2, 1, G.deep); P.rect(44, 9, 2, 2, G.sh); P.rect(42, 8, 3, 3, G.mid);   // intake
    // spine fairing, rotor mast, IR jammer ("disco ball") behind the mast
    P.rect(30, 6, 12, 2, G.mid); P.rect(30, 6, 12, 1, G.lit);
    P.rect(26, 5, 3, 3, M.mid); P.px(27, 5, M.lit);                                        // ALQ-144 jammer
    P.rect(34, 5, 4, 3, M.sh); P.rect(35, 4, 2, 1, M.mid);                                 // mast
    // Longbow fire-control radar dome on top of the mast (the "D" model)
    P.ell(36, 2, 5, 2, G.sh); P.ell(36, 2, 4, 1, G.mid); P.rect(33, 1, 5, 1, G.lit);
    // cockpit: stepped tandem canopy, pilot behind and above the gunner
    P.rect(46, 8, 8, 5, G.mid);                                                            // pilot station hump
    P.rect(47, 8, 6, 4, GL); P.rect(47, 8, 6, 1, G.sh); P.rect(50, 8, 1, 4, G.sh);         // pilot canopy + frame
    P.px(48, 9, GH); P.px(49, 9, GH);
    P.rect(53, 11, 7, 4, GL); P.rect(53, 11, 7, 1, G.sh); P.rect(56, 11, 1, 4, G.sh);      // gunner canopy, lower
    P.px(54, 12, GH); P.px(57, 12, GH);
    P.rect(46, 13, 14, 1, G.sh);                                                           // canopy sill
    // nose with the TADS/PNVS sensor turret
    P.rect(58, 13, 7, 7, G.mid); P.rect(58, 13, 7, 1, G.lit); P.rect(65, 14, 2, 5, G.mid); P.rect(67, 15, 1, 3, G.sh);
    P.ell(66, 12, 2, 1, M.mid); P.px(67, 12, GL);                                          // PNVS night-vision ball on top
    P.ell(66, 20, 4, 3, M.sh); P.ell(66, 19, 3, 2, M.mid);                                 // TADS turret under the nose
    P.rect(68, 18, 2, 2, GL); P.px(69, 18, GH); P.rect(68, 21, 2, 1, GL);                 // sensor windows
    // avionics "cheek" bays along the side, panel lines and rivets
    P.rect(44, 15, 13, 4, G.lit); P.rect(44, 18, 13, 1, G.sh); P.rect(50, 15, 1, 4, G.sh);
    for (const x of [30, 38]) P.rect(x, 12, 1, 8, G.sh);
    for (let x = 26; x < 56; x += 4) P.px(x, 13, G.deep);
    P.rect(33, 14, 4, 3, G.sh); P.rect(34, 15, 2, 1, G.lit);                               // access panel
    // M230 30 mm chain gun under the chin
    P.rect(53, 21, 4, 3, M.sh); P.rect(54, 22, 2, 1, M.mid);                               // turret mount
    P.rect(56, 23, 9, 1, K); P.rect(57, 22, 6, 1, M.sh); P.px(64, 23, M.lit);             // barrel
    // stub wings with weapons: 4 Hellfires on the inner pylon, a 19-shot Hydra pod on the outer
    P.rect(36, 17, 13, 2, G.sh); P.rect(36, 17, 13, 1, G.mid);                             // wing (edge-on)
    P.rect(37, 19, 2, 2, G.deep); P.rect(45, 19, 2, 2, G.deep);                            // pylons
    for (const y of [21, 23]) {                                                            // AGM-114 Hellfires on their rails
      P.rect(32, y, 10, 2, '#cfc8ac'); P.rect(32, y, 10, 1, '#e6e0c6'); P.rect(41, y, 2, 2, '#5a5a4a');
      P.px(32, y + 1, '#8a8470'); P.rect(34, y - 1, 1, 1, '#9a947c');                      // tail fins
    }
    P.rect(43, 21, 8, 5, G.sh); P.rect(43, 21, 8, 1, G.mid); P.rect(50, 21, 1, 5, G.deep); // rocket pod
    for (const y of [22, 24]) P.px(50, y, K);                                              // tube mouths
    // landing gear: main wheel under the wing, struts
    P.line(49, 21, 50, 25, 1, M.sh); P.ell(50, 26, 2, 2, K); P.px(50, 26, M.mid);
    P.line(55, 21, 56, 25, 1, M.sh); P.ell(56, 26, 2, 2, K); P.px(56, 26, M.mid);
    // little markings: white tail number, navigation lights
    P.rect(14, 14, 1, 1, '#d8d8c8'); P.rect(16, 14, 2, 1, '#d8d8c8');
    P.px(7, 3, '#ff3030'); P.px(58, 21, '#30ff60');
  });
  return dimensional(c);
})();
const APACHE_WRECK = charred(APACHE_SPR);
const APACHE_PAD = Math.round((APACHE_SPR.width - APACHE_W) / 2);   // outline padding added by dimensional()

// spinning rotors, drawn in model space (origin = model top-left), so they flip with the helicopter
function drawApacheRotors(t) {
  const hx = APACHE_HUB.x, hy = APACHE_HUB.y, R = 34;
  ctx.fillStyle = 'rgba(200,206,210,.14)'; ctx.fillRect(hx - R, hy - 1, R * 2, 3);             // the blur disc, edge-on
  ctx.fillStyle = 'rgba(200,206,210,.3)'; ctx.fillRect(hx - R, hy, R * 2, 1);
  for (let k = 0; k < 4; k++) {                                                              // 4 blades seen from the side
    const a = t * 0.55 + k * Math.PI / 2, len = Math.round(Math.cos(a) * R), near = Math.sin(a) > 0, lift = near ? 0 : -1;
    ctx.fillStyle = near ? '#1a1c18' : 'rgba(26,28,24,.6)';
    const x0 = len >= 0 ? hx : hx + len, w = Math.abs(len);
    ctx.fillRect(x0, hy + lift, w, near ? 2 : 1);
    if (w > R - 5) { ctx.fillStyle = '#e0c840'; ctx.fillRect(len >= 0 ? hx + len - 2 : hx + len, hy + lift, 2, 1); }   // painted tips
  }
  ctx.fillStyle = '#1a1c18'; ctx.fillRect(hx - 2, hy - 1, 5, 3); ctx.fillStyle = '#5c6062'; ctx.fillRect(hx - 1, hy - 1, 3, 1);   // hub
  const tx = APACHE_TR.x, ty = APACHE_TR.y;                                                  // tail rotor: blur disc + a spinning X
  ctx.fillStyle = 'rgba(200,206,210,.2)'; ctx.beginPath(); ctx.arc(tx + 0.5, ty + 0.5, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(tx + 0.5, ty + 0.5); ctx.rotate(t * 0.9);
  ctx.fillStyle = '#1a1c18'; ctx.fillRect(-5, -0.5, 10, 1); ctx.fillRect(-0.5, -5, 1, 10);
  ctx.restore();
  ctx.fillStyle = '#3c3f40'; ctx.fillRect(tx - 1, ty - 1, 3, 3);
}
function drawApache(a, cx, cy) {
  if (a.state === 'rebuild') return;
  const x = Math.round(a.x - cx), gy = Math.round(a.y - cy), y = gy - Math.round(a.alt);
  if (x < -80 || x > VW + 80 || y < -60 || gy > VH + 40) return;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x - 26, gy - 1, 52, 4); ctx.fillRect(x - 18, gy - 2, 36, 6);   // shadow on the ground
  const wreck = a.state === 'wreck';
  ctx.save(); ctx.translate(x, y); if (a.face < 0) ctx.scale(-1, 1);
  if (a.state === 'crash' || wreck) ctx.rotate(wreck ? 0.3 : Math.sin(a.t * 0.4) * 0.5);
  else ctx.rotate(a.state === 'patrol' ? 0.08 : 0);                                         // nose down a touch in forward flight
  ctx.translate(-APACHE_W / 2, -APACHE_H / 2);
  const img = wreck ? APACHE_WRECK : a.hitT > 0 && a.hitT % 4 < 2 ? whiteOf(APACHE_SPR) : APACHE_SPR;
  ctx.drawImage(img, -APACHE_PAD, -APACHE_PAD);
  if (!wreck) drawApacheRotors(a.state === 'parked' ? 0.4 : a.rotor);   // parked: blades tied down
  if (!wreck && a.state === 'patrol' && a.gunCD > 3) {                                      // chin-gun muzzle flash
    ctx.fillStyle = '#fff6a0'; ctx.fillRect(65, 22, 3, 3); ctx.fillStyle = '#ff9020'; ctx.fillRect(68, 23, 2, 1);
  }
  ctx.restore();
  if (wreck) {
    for (let i = 0; i < 4; i++) { const fh = 3 + ((frame + i * 5) % 7); ctx.fillStyle = flameCol(((frame + i * 3) % 10) / 14); ctx.fillRect(x - 14 + i * 8, y - 8 - fh, 3, fh); }
    return;
  }
  if (a.hp < a.max) bar(x - 18, y - 22, 36, 2, a.hp / a.max, '#58d858', '#203820');
  if (mode === 'play' && Math.hypot(p.x - a.x, p.y - a.y) < 120) text('AH-64D APACHE', x, y - 32, '#c8d870', 'center');
}
function drawRaidAir(cx, cy) {
  for (const s of heliShots) {
    if (s.kind === 'gun') {                                                  // tracer from the chin gun
      const k = s.t / s.dur, x = Math.round(s.x + (s.tx - s.x) * k - cx), y = Math.round(s.y + (s.ty - s.y) * k - cy);
      ctx.fillStyle = '#ffe070'; ctx.fillRect(x - 1, y - 1, 3, 2);
    } else {
      const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
      ctx.save(); ctx.translate(x, y); ctx.rotate(s.ang);
      ctx.fillStyle = '#100c1a'; ctx.fillRect(-5, -2, 10, 4); ctx.fillStyle = '#c8c8b8'; ctx.fillRect(-4, -1, 8, 2);
      ctx.fillStyle = '#ff9020'; ctx.fillRect(-7, -1, 2, 2);
      ctx.restore();
    }
  }
  for (const a of APACHES) drawApache(a, cx, cy);
  drawC2(cx, cy);
}
// the helipad markings on the airfield aprons: yellow touchdown circle, white H, pad number and edge lights
function drawHelipads(cx, cy) {
  for (const pd of HELI_PADS) {
    const x = Math.round(pd.x - cx), y = Math.round(pd.y - cy);
    if (x < -50 || x > VW + 50 || y < -50 || y > VH + 50) continue;
    ctx.strokeStyle = '#e8c838'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 34, 30, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,200,56,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 38, 34, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e8e8e0'; ctx.fillRect(x - 10, y - 12, 4, 24); ctx.fillRect(x + 6, y - 12, 4, 24); ctx.fillRect(x - 6, y - 2, 12, 4);   // H
    ctx.fillStyle = '#e8c838'; ctx.fillRect(x + 22, y + 18, 6, 1); text(String(pd.n), x + 25, y + 20, '#e8c838', 'center');
    const on = Math.floor((frame + pd.n * 20) / 30) % 2;                                       // edge lights
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ctx.fillStyle = on ? '#60ff80' : '#2a6a38'; ctx.fillRect(Math.round(x + Math.cos(a) * 40) - 1, Math.round(y + Math.sin(a) * 36) - 1, 2, 2); }
  }
  // windsock by the hangar
  const wx = Math.round(49.5 * T - cx), wy = Math.round(34 * T - cy), sw = Math.sin(frame * 0.05) * 2;
  ctx.fillStyle = '#5c6064'; ctx.fillRect(wx, wy - 18, 1, 18);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#f0f0e8' : '#ff6020'; ctx.fillRect(wx + 1 + i * 3, wy - 18 + Math.round(sw * i / 4), 3, 3 - (i >> 1)); }
}

// ================= UH-60 C2 Black Hawk: the command helicopter =================
// Parked on pad 3 of the airfield. When a raid starts it lifts off and orbits high over the outer yard and the river
// as the airborne command post: while it's ON STATION the M198s reload 25% faster and the FPV drones launch 25% more
// often (c2OnStation, artillery.js). It flies high, so bosses can't claw it, but enemy fire can still bring it down;
// a replacement lands HELI_REBUILD after the raid. After the raid it lands back on its pad.
const C2_HP = 4000, C2_ALT = 52, C2_SPD = 1.3;
const UH60_W = 70, UH60_H = 28, UH60_HUB = { x: 40, y: 3 }, UH60_TR = { x: 4, y: 5 };
const UH60_SPR = (() => dimensional(sculpt(UH60_W, UH60_H, P => {
  const G = { lit: '#57634a', mid: '#3e4834', sh: '#2c3426', deep: '#1c2218' };       // dark green
  const M = { lit: '#8a8e8c', mid: '#5c6062', sh: '#3c3f40' }, K = '#141414', GL = '#22323a', GH = '#8fb6c6';
  // tail: boom, pylon, stabilator, tail wheel
  P.rect(8, 11, 22, 4, G.mid); P.rect(8, 11, 22, 1, G.lit); P.rect(8, 14, 22, 1, G.sh);
  P.line(9, 12, 3, 2, 3, G.mid); P.line(10, 12, 5, 3, 2, G.lit);                       // swept tail pylon
  P.rect(1, 13, 12, 2, G.sh); P.rect(1, 13, 12, 1, G.mid);                              // stabilator
  P.line(13, 15, 13, 18, 1, M.sh); P.ell(13, 19, 1, 1, K);                              // tail wheel
  // the big cabin and the cockpit
  P.rect(28, 8, 32, 13, G.mid); P.rect(28, 8, 32, 2, G.lit); P.rect(28, 19, 32, 2, G.sh);
  P.rect(30, 21, 26, 1, G.deep);
  P.rect(60, 11, 5, 9, G.mid); P.rect(60, 11, 5, 1, G.lit); P.rect(65, 13, 3, 6, G.mid); P.rect(68, 15, 1, 3, G.sh);   // nose
  P.rect(56, 9, 9, 5, GL); P.rect(56, 9, 9, 1, G.sh); P.rect(60, 9, 1, 5, G.sh); P.px(57, 10, GH); P.px(62, 10, GH);   // cockpit glass
  P.rect(37, 10, 12, 9, G.sh); P.rect(38, 11, 4, 3, GL); P.rect(44, 11, 4, 3, GL); P.px(39, 11, GH); P.px(45, 11, GH);  // open cabin door + windows
  P.rect(49, 10, 1, 9, G.deep); P.rect(31, 11, 4, 3, GL);                                // door rail, rear window
  // engines on the roof, exhausts, mast
  P.rect(32, 4, 20, 5, G.mid); P.rect(32, 4, 20, 1, G.lit); P.rect(30, 5, 3, 3, K);
  for (const x of [36, 40, 44]) P.rect(x, 6, 2, 1, G.deep);
  P.rect(38, 1, 4, 3, M.sh);
  // C2 kit: antenna farm on the boom and the roof, a satcom dome
  for (const x of [14, 19, 24]) P.rect(x, 7, 1, 4, M.lit);
  P.rect(52, 3, 1, 5, M.lit); P.ell(29, 7, 2, 1, M.mid);
  // landing gear and markings
  P.line(52, 21, 53, 24, 1, M.sh); P.ell(53, 25, 2, 2, K); P.px(53, 25, M.mid);
  P.rect(33, 16, 3, 1, '#d8d8c8'); P.rect(33, 18, 3, 1, '#d8d8c8');                      // "C2" ID stripes
  P.px(3, 2, '#ff3030'); P.px(60, 20, '#30ff60');
})))();
const UH60_WRECK = charred(UH60_SPR), UH60_PAD = Math.round((UH60_SPR.width - UH60_W) / 2);
const mkC2 = () => ({ heli: true, c2: true, pad: HELI_PADS[2], x: HELI_PADS[2].x, y: HELI_PADS[2].y, alt: 0, hp: C2_HP, max: C2_HP,
  state: 'parked', face: 1, t: 0, hitT: 0, rotor: 0, rebuildT: 0 });
let C2 = mkC2();
const c2OnStation = () => C2.state === 'station';
function updateC2(a) {
  if (a.state === 'parked') return;
  if (a.state === 'rebuild') { if (--a.rebuildT <= 0) { C2 = mkC2(); msg('A replacement UH-60 C2 has landed on pad 3.', '#9ad868'); } return; }
  a.t++; a.rotor++;
  if (a.hitT > 0) a.hitT--;
  if (a.state === 'wreck') { if (frame % 4 === 0) tankFx.push({ kind: 'smoke', x: a.x + ri(-8, 8), y: a.y - 4, vx: 0, vy: -0.6, r: 4, t: 60, max: 60, c: '#2a2624' }); return; }
  if (a.state === 'crash') {
    a.alt -= 0.5; a.x += Math.cos(a.t * 0.3) * 1.2; a.y += Math.sin(a.t * 0.3) * 0.6;
    if (frame % 2 === 0) tankFx.push({ kind: 'smoke', x: a.x, y: a.y - a.alt, vx: 0, vy: -0.3, r: 3, t: 40, max: 40, c: R() < 0.5 ? '#2a2624' : '#ff8020' });
    if (a.alt <= 0) { a.alt = 0; a.state = 'wreck'; tankBlast({ tx: a.x, ty: a.y }); msg('The C2 Black Hawk is down! Fire missions uncoordinated.', '#ff5040'); }
    return;
  }
  const flyTo = (tx, ty, spd) => {
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.5) a.face = Math.sign(dx);
    if (d > spd) { a.x += dx / d * spd; a.y += dy / d * spd; return false; }
    a.x = tx; a.y = ty; return true;
  };
  if (a.state === 'takeoff') { a.alt += 0.5; if (a.alt >= C2_ALT) { a.state = 'station'; msg('C2 Black Hawk on station: fire missions coordinated.', '#80e0ff'); } return; }
  if (a.state === 'rtb') {
    if (flyTo(a.pad.x, a.pad.y, C2_SPD * 1.3)) { a.alt -= 0.5; if (a.alt <= 0) { a.alt = 0; a.state = 'parked'; a.hp = a.max; a.face = 1; a.rotor = 0; } }
    return;
  }
  // on station: a wide, slow orbit over the outer yard and the river
  flyTo((36 + OX) * T + Math.cos(a.t * 0.003) * 12 * T, 24 * T + Math.sin(a.t * 0.003) * 14 * T, C2_SPD);
  for (const q of eprojs) if (q.life > 0 && Math.hypot(q.x - a.x, q.y - a.y) < 12) { q.life = 0; hurtC2(a, Math.round(q.atk * 2)); }
}
function hurtC2(a, dmg) {
  if (a.state !== 'station' && a.state !== 'takeoff' && a.state !== 'rtb') return;
  a.hp -= dmg; a.hitT = 8;
  if (a.hp <= 0) { a.hp = 0; a.state = 'crash'; msg('C2 Black Hawk hit! It\'s going down!', '#ff5040'); sfx('cry'); }
}
function drawUH60Rotors(t) {
  const hx = UH60_HUB.x, hy = UH60_HUB.y, R = 36;
  ctx.fillStyle = 'rgba(200,206,210,.14)'; ctx.fillRect(hx - R, hy - 1, R * 2, 3);
  ctx.fillStyle = 'rgba(200,206,210,.3)'; ctx.fillRect(hx - R, hy, R * 2, 1);
  for (let k = 0; k < 4; k++) {
    const ang = t * 0.5 + k * Math.PI / 2, len = Math.round(Math.cos(ang) * R), near = Math.sin(ang) > 0;
    ctx.fillStyle = near ? '#1a1c18' : 'rgba(26,28,24,.6)';
    ctx.fillRect(len >= 0 ? hx : hx + len, hy + (near ? 0 : -1), Math.abs(len), near ? 2 : 1);
  }
  ctx.fillStyle = '#1a1c18'; ctx.fillRect(hx - 2, hy - 1, 5, 3);
  const tx = UH60_TR.x, ty = UH60_TR.y;
  ctx.fillStyle = 'rgba(200,206,210,.2)'; ctx.beginPath(); ctx.arc(tx + 0.5, ty + 0.5, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(tx + 0.5, ty + 0.5); ctx.rotate(t * 0.9);
  ctx.fillStyle = '#1a1c18'; ctx.fillRect(-5, -0.5, 10, 1); ctx.fillRect(-0.5, -5, 1, 10);
  ctx.restore();
}
function drawC2(cx, cy) {
  const a = C2;
  if (a.state === 'rebuild') return;
  const x = Math.round(a.x - cx), gy = Math.round(a.y - cy), y = gy - Math.round(a.alt);
  if (x < -80 || x > VW + 80 || y < -80 || gy > VH + 40) return;
  ctx.fillStyle = `rgba(0,0,0,${a.alt > 30 ? 0.18 : 0.28})`; ctx.fillRect(x - 26, gy - 1, 52, 4); ctx.fillRect(x - 18, gy - 2, 36, 6);
  const wreck = a.state === 'wreck';
  ctx.save(); ctx.translate(x, y); if (a.face < 0) ctx.scale(-1, 1);
  if (a.state === 'crash' || wreck) ctx.rotate(wreck ? 0.3 : Math.sin(a.t * 0.4) * 0.5);
  else ctx.rotate(a.state === 'station' ? 0.06 : 0);
  ctx.translate(-UH60_W / 2, -UH60_H / 2);
  ctx.drawImage(wreck ? UH60_WRECK : a.hitT > 0 && a.hitT % 4 < 2 ? whiteOf(UH60_SPR) : UH60_SPR, -UH60_PAD, -UH60_PAD);
  if (!wreck) drawUH60Rotors(a.state === 'parked' ? 0.4 : a.rotor);
  if (!wreck && a.state === 'station' && Math.floor(frame / 20) % 2) { ctx.fillStyle = '#ff3030'; ctx.fillRect(3, 1, 2, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(52, 1, 1, 1); }   // strobes
  ctx.restore();
  if (wreck) { for (let i = 0; i < 4; i++) { const fh = 3 + ((frame + i * 5) % 7); ctx.fillStyle = flameCol(((frame + i * 3) % 10) / 14); ctx.fillRect(x - 14 + i * 8, y - 8 - fh, 3, fh); } return; }
  if (a.hp < a.max) bar(x - 18, y - 22, 36, 2, a.hp / a.max, '#58d858', '#203820');
  if (mode === 'play' && Math.hypot(p.x - a.x, p.y - a.y) < 120) text('UH-60 C2 BLACK HAWK', x, y - 32, '#80e0ff', 'center');
}
