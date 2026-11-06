// ================= M198 howitzer battery =================
// Five M198 155 mm towed howitzers dug in on gravel pads on the REAR line: the south end of the base's west wing,
// about 60 tiles back from the river. During a zombie invasion they lob shells in a high arc onto the horde beyond the river: bosses
// first, otherwise the densest pack. They never fire danger-close (near soldiers, bots or the player), and
// only at targets east of the river fence. Each gun has a two-man crew who load between shots.
// Close support: when the line calls for reinforcements (inv.supportT, invasion.js) the battery fires twice as fast
// and shells the packs pressing on the soldiers at the river (still never within HOW_SAFE of a friendly).
// FPV kamikaze drones: during a raid, drone operators at the HQ helipad send small quadcopters at the bosses
// and the thickest packs; each dives in and blows up (DRONES below).

const HOW_SPOTS = [[14, 45], [21, 45], [35, 45], [42, 45], [48, 45]];   // tile under the gun's axle (new tile numbers: the west wing)
const HOW_RANGE = 2600, HOW_MIN_X = (45 + OX) * T, HOW_SAFE = 72;            // px; targets must be east of the river fence
const HOW_SUPPORT_X = (34 + OX) * T, HOW_SUPPORT_R = 200;                    // close support: zombies within 200 px of a soldier, from x 34
const HOW_RELOAD = 60 * 6, HOW_DMG = 3000, HOW_SPLASH = 56;
const HOW_SPREAD = 110;                                               // px: a gun won't aim within this of a round already falling
// guns can be destroyed: zombies that get inside the sandbag ring tear at them (hitVehicle, raidforce.js).
// A destroyed gun is a burnt wreck until a replacement is towed in HOW_REBUILD after the raid.
const HOW_HP = 2500, HOW_REBUILD = 60 * 30;
const HOWITZERS = HOW_SPOTS.map(([tx, ty], i) => ({ howitzer: true, veh: true, label: 'M198 HOWITZER', x: tx * T - 18, y: ty * T + 2, w: 40, h: 12,
  cd: 60 * 2 + i * 50, fireT: 0, recoil: 0, elev: -0.5, load: 0, hp: HOW_HP, max: HOW_HP, hitT: 0, dead: false, rebuildT: 0 }));
let howShells = [];

(function digIn() {                                                   // gravel gun pads (trees cleared) inside a sandbag ring
  const soft = c => '.Tfg'.includes(c);
  for (const [tx, ty] of HOW_SPOTS) {
    for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 2; x <= tx + 2; x++) if (world[y] && soft(world[y][x])) world[y][x] = 'g';
    for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 3; x <= tx + 3; x++) {
      const edge = y === ty - 2 || y === ty + 2 || x === tx - 3 || x === tx + 3;
      if (x === tx - 3 && y === ty) { if (world[y] && 'Tf'.includes(world[y][x])) world[y][x] = 'g'; continue; }   // one opening at the back for the crew
      if (!edge) continue;
      if (world[y] && soft(world[y][x])) world[y][x] = 'F';          // sandbags: breakable, rebuilt by the engineers (invasion.js)
    }
  }
})();
let HOW_WRECK = null;                                                 // burnt carriage, made on first use (charred: recovery.js)
function destroyHowitzer(h) {
  h.dead = true; h.hp = 0; h.rebuildT = HOW_REBUILD; h.fireT = 0; h.recoil = 0; h.load = 0;
  const c = howPivot(h);
  tankFx.push({ kind: 'boom', x: c.x, y: c.y + 8, t: 30, max: 30, chunks: Array.from({ length: 20 }, () => ({ dx: (R() - 0.5) * 20, dy: (R() - 0.5) * 12, s: 3 + ri(0, 5), vx: (R() - 0.5) * 2, vy: -R() * 1.2, hot: R() })), tongues: [] });
  burst(c.x, c.y, '#ff8020', 20); burst(c.x, c.y, '#3a3430', 12);
  addCorpse(h.x - 10, h.y - 2, true);                                   // the crew didn't make it
  if (Math.hypot(c.x - p.x, c.y - p.y) < 500) { sfx('boom'); addShake(5); }
  msg('An M198 howitzer has been destroyed!', '#ff7050');
}
const howPivot = h => ({ x: h.x + 18, y: h.y - 2 });                 // barrel trunnion, world px
const howBlocks = (x, y, w, h) => HOWITZERS.some(g => x < g.x + g.w && x + w > g.x && y < g.y + g.h && y + h > g.y);

// ---- sprites: carriage (split trails, wheel, shield) painted once; the barrel is drawn rotated ----
const HOW_COL = { a: '#8a9058', b: '#6b7046', c: '#4a4e30', k: '#1c1e16', w: '#2a2a2e', h: '#7a7a82' };
const HOW_CARRIAGE = (() => {
  const c = mk(); c.width = 40; c.height = 16; const g = c.getContext('2d'), C = HOW_COL;
  const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  for (let i = 0; i < 16; i++) { r(C.b, 2 + i, 12 - Math.floor(i / 3), 2, 2); r(C.c, 4 + i, 13 - Math.floor(i / 4), 2, 1); }  // split trail legs
  r(C.c, 0, 12, 4, 3); r(C.k, 0, 15, 5, 1);                           // trail spades dug into the ground
  r(C.b, 15, 3, 9, 6); r(C.a, 15, 3, 9, 1); r(C.c, 15, 8, 9, 1);      // cradle + shield
  r(C.c, 22, 1, 2, 8);                                                 // shield edge
  r(C.w, 13, 7, 10, 8); r(C.w, 12, 8, 12, 6);                          // wheel
  r(C.h, 16, 9, 4, 4); r(C.k, 17, 10, 2, 2);                           // hub
  r(C.b, 24, 10, 6, 2); r(C.c, 30, 11, 3, 3);                          // firing jack
  return dimensional(c);
})();

function updateArtillery() {
  const active = typeof inv !== 'undefined' && inv.state === 'wave';
  for (const h of HOWITZERS) {
    if (h.hitT > 0) h.hitT--;
    if (h.dead) {                                                       // burning wreck; a new gun arrives after the raid
      if (frame % 6 === 0) tankFx.push({ kind: 'smoke', x: h.x + 18 + ri(-6, 6), y: h.y, vx: (R() - 0.5) * 0.3, vy: -0.5, r: 3, t: 50, max: 50, c: '#2a2624' });
      if (!active && inv.state === 'idle' && --h.rebuildT <= 0) {
        Object.assign(h, { dead: false, hp: HOW_HP, cd: 60 * 3 });
        msg('A replacement M198 howitzer has been towed into position.', '#9ad868');
      }
      continue;
    }
    if (h.fireT > 0) h.fireT--;
    if (h.recoil > 0) h.recoil = Math.max(0, h.recoil - 0.25);
    if (h.load > 0) h.load--;
    if (h.cd > 0) h.cd--;
    if (!active || h.cd > 0) continue;
    const tgt = howTarget(h);
    if (!tgt) { h.cd = 30; continue; }
    fireHowitzer(h, tgt);
    if (support()) h.cd = Math.round(h.cd * 0.5);                    // fire for effect
    if (typeof c2OnStation === 'function' && c2OnStation()) h.cd = Math.round(h.cd * 0.75);   // coordinated by the C2 Black Hawk
  }
  updateDrones(active);
  for (const s of howShells) {
    s.t++;
    if (s.t >= s.dur) { howBlast(s); s.done = true; }
    else if (s.t % 3 === 0) { const q = howShellPos(s); tankFx.push({ kind: 'smoke', x: q.x, y: q.y - q.h, vx: 0, vy: -0.1, r: 1.2, t: 12, max: 12, c: '#a8a296' }); }
  }
  howShells = howShells.filter(s => !s.done);
}
// a spot is safe to shell when no friendly stands near it
function howSafe(x, y) {
  if (mode === 'play' && !spec && Math.hypot(p.x + 6 - x, p.y + 6 - y) < HOW_SAFE) return false;
  if (SOLDIERS.some(s => s.state !== 'down' && Math.hypot(s.x + 6 - x, s.y + 6 - y) < HOW_SAFE)) return false;
  if (bots.some(b => botAlive(b) && Math.hypot(b.x + 6 - x, b.y + 6 - y) < HOW_SAFE)) return false;
  return true;
}
const support = () => typeof inv !== 'undefined' && inv.supportT > 0;
const nearLine = (x, y) => SOLDIERS.some(s => s.state !== 'down' && Math.hypot(s.x + 6 - x, s.y + 6 - y) < HOW_SUPPORT_R);
function howTarget(h) {
  const pv = howPivot(h), sup = support();
  const ok = e => {
    if (e.dead || !e.horde) return false;
    const x = e.x + e.w / 2, y = e.y + e.h / 2;
    return x > (sup ? HOW_SUPPORT_X : HOW_MIN_X) && Math.hypot(x - pv.x, y - pv.y) < HOW_RANGE && howSafe(x, y);
  };
  let pool = enemies.filter(ok);
  if (!pool.length) return null;
  if (sup) {                                                            // close support: the packs on top of the soldiers first
    const close = pool.filter(e => nearLine(e.x + e.w / 2, e.y + e.h / 2));
    if (close.length) pool = close;
  }
  // spread the fire: skip anything a round is already falling on, so the battery covers many points at once
  const covered = e => howShells.some(s => Math.hypot(e.x + e.w / 2 - s.tx, e.y + e.h / 2 - s.ty) < HOW_SPREAD);
  const bosses = pool.filter(e => e.d.boss);
  if (bosses.length && !(sup && R() < 0.5)) {
    const open = bosses.filter(b => !covered(b));
    if (open.length || R() < 0.3) { const list = open.length ? open : bosses; return list[ri(0, list.length - 1)]; }
  }
  const step = Math.max(1, Math.floor(pool.length / 40)), cands = [];
  for (let i = 0; i < pool.length; i += step) {
    const c = pool[i];
    if (covered(c)) continue;
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    let n = 0; for (const o of pool) if (Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) < HOW_SPLASH) n++;
    cands.push({ c, n });
  }
  if (!cands.length) return pool[ri(0, pool.length - 1)];              // everything's under fire already: anywhere in range
  cands.sort((a, b) => b.n - a.n);
  return cands[ri(0, Math.min(3, cands.length) - 1)].c;                // one of the top few packs, not always the same one
}
function fireHowitzer(h, e) {
  const pv = howPivot(h), tx = e.x + e.w / 2 + ri(-18, 18), ty = e.y + e.h / 2 + ri(-12, 12);   // a little dispersion per round
  const dist = Math.hypot(tx - pv.x, ty - pv.y);
  h.elev = -(0.35 + 0.45 * Math.min(1, dist / HOW_RANGE));
  h.cd = HOW_RELOAD + ri(0, 60); h.fireT = 12; h.recoil = 7; h.load = 90;
  const mx = pv.x + Math.cos(h.elev) * 30, my = pv.y + Math.sin(h.elev) * 30;
  howShells.push({ x0: mx, y0: my, tx, ty, t: 0, dur: Math.round(50 + dist / 12), arc: Math.min(420, 60 + dist * 0.3) });
  tankFx.push({ kind: 'blast', x: mx, y: my, ang: h.elev, t: 10, max: 10 });
  for (let i = 0; i < 10; i++) {
    const a = h.elev + (R() - 0.5) * 1.8, s = 0.5 + R() * 1.6;
    tankFx.push({ kind: 'smoke', x: mx, y: my, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.2, r: 3 + R() * 2, t: 40 + ri(0, 20), max: 60, c: R() < 0.5 ? '#8a847a' : '#b4aea2' });
  }
  tankFx.push({ kind: 'smoke', x: h.x + 20, y: h.y + 12, vx: -0.6, vy: -0.2, r: 4, t: 30, max: 30, c: '#9a8c6a' });   // dust kicked up by the blast
  burst(mx, my, '#ffd060', 10);
  const near = Math.hypot(pv.x - p.x, pv.y - p.y);
  if (near < 420) { sfx('cannon'); addShake(near < 160 ? 4 : 2); }
  if (near < 260 && R() < 0.4) float(pv.x, h.y - 26, 'FIRE MISSION!', '#ffb040');
}
function howShellPos(s) {
  const k = s.t / s.dur;
  return { x: s.x0 + (s.tx - s.x0) * k, y: s.y0 + (s.ty - s.y0) * k, h: Math.sin(k * Math.PI) * s.arc };
}
function howBlast(s) {
  addCrater(s.tx, s.ty, 14);                                     // 155 mm: a bigger crater (tank.js)
  const chunks = [], tongues = [];
  for (let i = 0; i < 30; i++) {
    const a = R() * 6.28, d = R() * 16;
    chunks.push({ dx: Math.cos(a) * d * 1.3, dy: Math.sin(a) * d * 0.8 - R() * 6, s: 3 + ri(0, 6),
      vx: Math.cos(a) * (0.4 + R() * 1.3), vy: Math.sin(a) * 0.6 - 0.5 - R() * 0.6, hot: R() });
  }
  for (let i = 0; i < 8; i++) tongues.push({ a: -Math.PI / 2 + (R() - 0.5) * 3.4, len: 16 + ri(0, 18), w: 2 + ri(0, 2) });
  tankFx.push({ kind: 'boom', x: s.tx, y: s.ty, t: 30, max: 30, chunks, tongues });
  for (let i = 0; i < 14; i++) {
    const a = R() * 6.28, sp = 0.4 + R() * 1.4;
    tankFx.push({ kind: 'smoke', x: s.tx + Math.cos(a) * 6, y: s.ty + Math.sin(a) * 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 0.45,
      r: 4 + R() * 3, t: 50 + ri(0, 30), max: 80, c: R() < 0.5 ? '#4a4642' : '#6a645c' });
  }
  burst(s.tx, s.ty, '#ff8020', 24); burst(s.tx, s.ty, '#ffe070', 14); burst(s.tx, s.ty, '#3a3430', 14);
  rings.push({ x: s.tx, y: s.ty, r: 6, max: HOW_SPLASH, c: '#ffb040', t: 16 });
  const near = Math.hypot(s.tx - p.x, s.ty - p.y);
  if (near < 420) { sfx('boom'); addShake(near < 160 ? 5 : 2); }
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2, d = Math.hypot(ex - s.tx, ey - s.ty);
    if (d > HOW_SPLASH + Math.max(e.w, e.h) / 2) continue;
    const dmg = Math.max(1, Math.round(HOW_DMG * (d < 16 + Math.max(e.w, e.h) / 2 ? 1 : 0.6)) - e.d.def);
    e.hp -= dmg; e.flash = 6;
    if (near < 420) float(ex, e.y - 2, String(dmg), '#ffb040');
    if (e.hp <= 0) { if (e.d.boss) killEnemy(e); else { e.dead = true; burst(ex, ey, '#a01818', 10); } }
  }
}

// ---- drawing ----
function drawHowitzer(h, cx, cy) {
  const x = Math.round(h.x - cx), y = Math.round(h.y - cy);
  if (x < -60 || x > VW + 60 || y < -60 || y > VH + 40) return;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 2, y + 11, 44, 4);
  const pv = howPivot(h), px = Math.round(pv.x - cx), py = Math.round(pv.y - cy), C = HOW_COL, b = -h.recoil, L = 30;
  if (h.dead) {                                                         // wreck: charred carriage, barrel drooped into the dirt
    if (!HOW_WRECK) HOW_WRECK = charred(HOW_CARRIAGE);
    ctx.save(); ctx.translate(px, py); ctx.rotate(0.25);
    ctx.fillStyle = '#100c1a'; ctx.fillRect(-9, -3, L + 4, 6); ctx.fillStyle = '#2e2a26'; ctx.fillRect(-8, -2, L + 2, 4);
    ctx.restore();
    drawSprite(HOW_WRECK, x - 1, y - 6, false);
    for (let i = 0; i < 3; i++) { const fh = 3 + ((frame + i * 5) % 7); ctx.fillStyle = flameCol(((frame + i * 3) % 10) / 14); ctx.fillRect(x + 12 + i * 6, y - 4 - fh, 3, fh); }
    if (mode === 'play' && Math.hypot(p.x + 6 - pv.x, p.y + 6 - pv.y) < 80) text('DESTROYED', x + 20, y - 30, '#ff7050', 'center');
    return;
  }
  // barrel: long 155 mm tube with recuperators and a double-baffle muzzle brake
  ctx.save(); ctx.translate(px, py); ctx.rotate(h.elev);
  ctx.fillStyle = '#100c1a'; ctx.fillRect(-9 + b, -3, L + 10, 6); ctx.fillRect(L - 3 + b, -4, 6, 8);   // outline
  ctx.fillStyle = C.b; ctx.fillRect(-8 + b, -2, L + 8, 4);
  ctx.fillStyle = C.a; ctx.fillRect(-8 + b, -2, L + 8, 1);
  ctx.fillStyle = C.c; ctx.fillRect(-8, 1, 16, 2);                                                   // recuperator cylinders (don't recoil)
  ctx.fillStyle = C.c; ctx.fillRect(L - 2 + b, -3, 4, 6); ctx.fillStyle = C.k; ctx.fillRect(L - 1 + b, -3, 1, 6);   // muzzle brake
  ctx.restore();
  drawSprite(h.hitT > 0 && h.hitT % 4 < 2 ? whiteOf(HOW_CARRIAGE) : HOW_CARRIAGE, x - 1, y - 6, false);
  if (h.hp < h.max) bar(x + 6, y - 16, 28, 2, h.hp / h.max, '#58d858', '#203820');
  // crew: the loader works the breech, the gunner kneels by the trail
  const loadBob = h.load > 0 ? -(Math.floor(h.load / 8) % 2) : 0;
  drawSprite(SOLDIER_SPR[0], x - 12, y - 6 + loadBob, false);
  drawSprite(SOLDIER_SPR[h.load > 40 ? 1 : 0], x + 2, y + 4, false);
  if (h.load > 30) { ctx.fillStyle = '#c8a440'; ctx.fillRect(x - 2, y - 2 + loadBob, 6, 3); ctx.fillStyle = '#8a7030'; ctx.fillRect(x + 3, y - 2 + loadBob, 1, 3); }   // 155 mm round in his arms
  if (mode === 'play' && Math.hypot(p.x + 6 - pv.x, p.y + 6 - pv.y) < 80) {
    text('M198 HOWITZER', x + 20, y - 34, '#c8d870', 'center');
    bar(x + 6, y - 24, 28, 2, 1 - h.cd / HOW_RELOAD, '#ffb040', '#402810');
  }
}
function drawArtilleryShells(cx, cy) {
  drawDrones(cx, cy);
  for (const s of howShells) {
    const q = howShellPos(s), x = Math.round(q.x - cx), y = Math.round(q.y - cy);
    if (x < -20 || x > VW + 20 || y - q.h > VH + 20 || y + 20 < 0) continue;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 2, y, 4, 2);                                   // shadow on the ground
    const k = s.t / s.dur, a = Math.atan2((s.ty - s.y0) / s.dur - Math.cos(k * Math.PI) * Math.PI * s.arc / s.dur, (s.tx - s.x0) / s.dur);
    ctx.save(); ctx.translate(x, Math.round(y - q.h)); ctx.rotate(a);
    ctx.fillStyle = '#100c1a'; ctx.fillRect(-4, -2, 8, 4);
    ctx.fillStyle = '#6a6e5a'; ctx.fillRect(-3, -1, 6, 2); ctx.fillStyle = '#c8a440'; ctx.fillRect(2, -1, 2, 2);
    ctx.restore();
  }
}

// ================= FPV kamikaze drones =================
// Launched one at a time from the HQ helipad while a raid is on (up to DRONE_MAX in the air). Each flies fast
// toward its target (a boss first, else the densest pack across or in the river), re-picks if the target
// dies, then dives in and detonates.
const DRONE_PAD = { x: 42.5 * T, y: 36.5 * T };                            // pad 4 of the airfield (world.js / raidforce.js)
const DRONE_MAX = 6, DRONE_EVERY = 60 * 1.5, DRONE_SPD = 3.2, DRONE_DMG = 2000, DRONE_SPLASH = 40, DRONE_LIFE = 60 * 25;
let DRONES = [], droneT = 60 * 3;
function droneTarget() {
  const pool = enemies.filter(e => e.horde && !e.dead && e.x + e.w / 2 > (38 + OX) * T);
  if (!pool.length) return null;
  const bosses = pool.filter(e => e.d.boss);
  if (bosses.length && R() < 0.6) return bosses[ri(0, bosses.length - 1)];
  const step = Math.max(1, Math.floor(pool.length / 30));
  let best = null, bn = -1;
  for (let i = 0; i < pool.length; i += step) {
    const c = pool[i], cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    let n = 0; for (const o of pool) if (Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) < DRONE_SPLASH) n++;
    if (n > bn) { bn = n; best = c; }
  }
  return best;
}
function updateDrones(active) {
  if (active && --droneT <= 0) {
    droneT = (support() ? DRONE_EVERY / 2 : DRONE_EVERY) * (typeof c2OnStation === 'function' && c2OnStation() ? 0.75 : 1);
    const tgt = DRONES.length < DRONE_MAX ? droneTarget() : null;
    if (tgt) {
      DRONES.push({ x: DRONE_PAD.x, y: DRONE_PAD.y, alt: 0, tgt, t: 0, wob: R() * 6.28, a: 0 });
      if (Math.hypot(DRONE_PAD.x - p.x, DRONE_PAD.y - p.y) < 260) float(DRONE_PAD.x, DRONE_PAD.y - 20, 'FPV LAUNCH!', '#80e0ff');
    }
  }
  for (const d of DRONES) {
    d.t++;
    d.alt = Math.min(18, d.alt + 0.6);                                  // climbs off the pad
    if (!d.tgt || d.tgt.dead) d.tgt = droneTarget();
    if (!d.tgt || d.t > DRONE_LIFE) { droneBlast(d); continue; }       // nothing left to hit: it self-destructs where it is
    const tx = d.tgt.x + d.tgt.w / 2, ty = d.tgt.y + d.tgt.h / 2, dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
    if (dist < 8) { d.x = tx; d.y = ty; droneBlast(d); continue; }
    d.a = Math.atan2(dy, dx);
    const sp = Math.min(dist, DRONE_SPD), wob = Math.sin(d.t * 0.2 + d.wob) * 0.6;
    d.x += Math.cos(d.a) * sp - Math.sin(d.a) * wob; d.y += Math.sin(d.a) * sp + Math.cos(d.a) * wob;
    if (dist < 60) d.alt = Math.max(0, d.alt - 0.8);                   // the terminal dive
  }
  DRONES = DRONES.filter(d => !d.done);
}
function droneBlast(d) {
  d.done = true;
  const x = d.x, y = d.y, chunks = [];
  for (let i = 0; i < 14; i++) {
    const a = R() * 6.28, r = R() * 9;
    chunks.push({ dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.7, s: 2 + ri(0, 4), vx: Math.cos(a) * (0.3 + R()), vy: Math.sin(a) * 0.5 - 0.4, hot: R() });
  }
  tankFx.push({ kind: 'boom', x, y, t: 20, max: 20, chunks, tongues: [] });
  for (let i = 0; i < 5; i++) tankFx.push({ kind: 'smoke', x, y, vx: (R() - 0.5) * 1.2, vy: -0.4 - R() * 0.4, r: 3 + R() * 2, t: 40, max: 40, c: '#5a5450' });
  burst(x, y, '#ffb040', 14); burst(x, y, '#2a2a2e', 6);
  const near = Math.hypot(x - p.x, y - p.y);
  if (near < 360) { sfx('boom'); if (near < 140) addShake(2); }
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2, dd = Math.hypot(ex - x, ey - y);
    if (dd > DRONE_SPLASH + Math.max(e.w, e.h) / 2) continue;
    const dmg = Math.max(1, Math.round(DRONE_DMG * (dd < 10 + Math.max(e.w, e.h) / 2 ? 1 : 0.6)) - e.d.def);
    e.hp -= dmg; e.flash = 6;
    if (near < 360) float(ex, e.y - 2, String(dmg), '#80e0ff');
    if (e.hp <= 0) { if (e.d.boss) killEnemy(e); else { e.dead = true; burst(ex, ey, '#a01818', 8); } }
  }
}
function drawDrones(cx, cy) {
  for (const d of DRONES) {
    const x = Math.round(d.x - cx), y = Math.round(d.y - cy), h = Math.round(d.alt);
    if (x < -20 || x > VW + 20 || y < -40 || y > VH + 20) continue;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 3, y, 6, 2);                         // shadow on the ground
    const by = y - h;
    ctx.fillStyle = '#100c1a'; ctx.fillRect(x - 4, by - 2, 8, 4);                          // body + outline
    ctx.fillStyle = '#4a4e56'; ctx.fillRect(x - 3, by - 1, 6, 2);
    ctx.fillStyle = '#c8a440'; ctx.fillRect(x - 1, by + 1, 2, 2);                          // strapped-on charge
    const spin = Math.floor(frame / 2) % 2;                                                 // blurred props on four arms
    ctx.fillStyle = 'rgba(200,210,220,.7)';
    for (const [ax, ay] of [[-5, -3], [3, -3], [-5, 2], [3, 2]]) ctx.fillRect(x + ax + (spin ? 0 : 1), by + ay, spin ? 3 : 1, 1);
    if (Math.floor(frame / 6) % 2) { ctx.fillStyle = '#ff3030'; ctx.fillRect(x + (Math.cos(d.a) > 0 ? 3 : -4), by - 1, 1, 1); }   // nav LED
  }
}

// red impact marks: where each incoming 155 mm round will land, so nobody is surprised. The mark tightens and pulses
// faster as the shell comes down, and shows the blast radius. Drawn after the night tint (ui.js draw) so it always shows.
function drawImpactMarks(cx, cy) {
  for (const s of howShells) {
    const x = Math.round(s.tx - cx), y = Math.round(s.ty - cy), k = s.t / s.dur;
    if (x < -70 || x > VW + 70 || y < -70 || y > VH + 70) continue;
    const pulse = Math.floor(s.t / (k > 0.75 ? 3 : 8)) % 2, r = HOW_SPLASH * (1 - 0.35 * k);
    ctx.fillStyle = `rgba(255,30,30,${0.16 + 0.22 * k})`;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = pulse ? '#ff4040' : `rgba(230,30,30,${0.7 + 0.3 * k})`; ctx.lineWidth = pulse ? 2 : 1;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = pulse ? '#ff3030' : '#a01010';                                       // crosshair + centre dot
    ctx.fillRect(x - 7, y, 5, 1); ctx.fillRect(x + 3, y, 5, 1); ctx.fillRect(x, y - 5, 1, 4); ctx.fillRect(x, y + 2, 1, 4);
    ctx.fillRect(x - 1, y - 1, 3, 3);
    if (k > 0.6 && pulse && Math.hypot(s.tx - p.x, s.ty - p.y) < 220) text('!', x, y - r * 0.62 - 10, '#ff4040', 'center');
  }
}
