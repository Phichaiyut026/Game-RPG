// ================= M1A1 Abrams =================
// Friendly main battle tanks: one just inside the base's east wall (beside the Alpha bunker) and one at
// the river fence beside each of the three bridges. They only engage big monsters (bosses, the world
// boss included) with a 120mm cannon: a muzzle blast on firing and a big fireball where the shell lands.
// Each shell hits for a flat 10,000 (TANK_SHELL_DMG). The tank is solid at its post. It can be
// knocked out and is then towed away for repair: see js/recovery.js.

// [tileX, tileY] of the hull's left column; the hull sits on the lower of the two rows
const TANK_SPOTS = [[22, 18], [40, 6], [38, 26], [38, 42]].map(([x, y]) => [x + OX, y]);
const TANKS = TANK_SPOTS.map(([tx, ty], i) => ({ tank: true, name: 'M1A1 ABRAMS', x: tx * T + 1, y: ty * T + 14, w: 46, h: 16,
  aim: 0, flip: false, cd: 60 + i * 25, fireT: 0, recoil: 0 }));
const TANK_RANGE = 320, TANK_RELOAD = 120, TANK_SPLASH = 44, TANK_BARREL = 32;
let tankShells = [], tankFx = [];

// ---- sprites (painted once, then given the same outline + shading pass as everything else) ----
const TANK_COL = { a: '#d2bc8a', b: '#ae9866', c: '#7e6c46', d: '#5c4e34', k: '#26262a', g: '#55555c', h: '#8c8c94' };
const TANK_HULL = (() => {
  const c = mk(); c.width = 46; c.height = 16; const g = c.getContext('2d'), C = TANK_COL;
  const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  r(C.b, 3, 1, 41, 8);   r(C.a, 4, 1, 39, 1);                    // armoured hull + side skirt
  r(C.b, 1, 3, 2, 6);    r(C.b, 44, 3, 2, 5); r(C.a, 44, 3, 1, 1); // rear deck / sloped glacis
  for (let x = 9; x < 42; x += 7) r(C.c, x, 3, 1, 5);           // skirt panel seams
  r(C.c, 3, 8, 41, 1);
  r(C.d, 5, 4, 3, 2);                                            // rear stowage box
  r(C.k, 1, 9, 44, 6);  r(C.k, 3, 15, 40, 1);                   // track
  for (let i = 0; i < 7; i++) { const x = 5 + i * 6; r(C.g, x, 10, 4, 4); r(C.h, x + 1, 11, 2, 2); } // road wheels
  r(C.g, 1, 10, 3, 3); r(C.g, 42, 10, 3, 3);                     // idler / drive sprocket
  return dimensional(c);
})();
const TANK_TURRET = (() => {
  const c = mk(); c.width = 26; c.height = 10; const g = c.getContext('2d'), C = TANK_COL;
  const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  r(C.b, 0, 3, 22, 7);  r(C.a, 1, 3, 20, 1);                     // flat, wide turret
  r(C.b, 22, 4, 3, 5);  r(C.a, 22, 4, 2, 1);                     // angled front armour
  r(C.c, 0, 8, 22, 1);  r(C.d, 1, 5, 4, 3);                      // bustle rack
  r(C.c, 6, 1, 6, 2);   r(C.a, 7, 1, 4, 1);                      // commander's cupola
  r(C.k, 9, 0, 6, 1);                                            // .50 cal on the cupola
  r(C.k, 16, 2, 3, 1);                                           // gunner's sight
  return dimensional(c);
})();
const tankPivot = t => ({ x: t.x + 23, y: t.y - 3 });     // gun mantlet, in world px


// only tanks standing at their post block (a tank being dragged, repaired or driving home doesn't trap anyone)
const tankParked = t => !t.state || t.state === 'ok' || t.state === 'wrecked' || (t.state === 'towing' && t.truck && t.truck.phase !== 'drag');
function tankBlocks(x, y, w, h) {
  return TANKS.some(TANK => tankParked(TANK) && x < TANK.x + TANK.w && x + w > TANK.x && y < TANK.y + TANK.h && y + h > TANK.y - 4)
    || (typeof howBlocks === 'function' && howBlocks(x, y, w, h));        // the M198 guns are solid too (artillery.js)
}
const TANK_SHELL_DMG = 10000;                                 // 120mm round: 10,000 per hit (60% at the edge of the blast)
function tankDmg() { return TANK_SHELL_DMG; }

function updateTanks() {
  for (const t of TANKS) { updateTankLife(t); if (t.state === 'ok') updateTank(t); }   // damage / wreck / tow / repair (recovery.js)
  updateTowTrucks(); updateCorpses(); updateMedics(); updatePatrols(); updateAirstrikes();   // medics recover the fallen (medic.js)   // bomber runs called by the bots (airstrike.js)   // BTR-80 patrols (patrol.js)
  updateTankShells(); updateCraters();
  for (const f of tankFx) {
    f.t--;
    if (f.kind === 'smoke') { f.x += f.vx; f.y += f.vy; f.vx *= 0.94; f.vy *= 0.94; f.r += 0.12; }
  }
  tankFx = tankFx.filter(f => f.t > 0);
}
// Bosses first (nearest in range). During a zombie invasion the tanks also shell the horde itself.
function updateTank(TANK) {
  if (TANK.fireT > 0) TANK.fireT--;
  if (TANK.recoil > 0) TANK.recoil = Math.max(0, TANK.recoil - 0.3);
  if (TANK.cd > 0) TANK.cd--;
  const pv = tankPivot(TANK);
  let tgt = null, bd = TANK_RANGE;
  for (const e of enemies) {
    if (e.dead || !e.d.boss) continue;
    const d = Math.hypot(e.x + e.w / 2 - pv.x, e.y + e.h / 2 - pv.y);
    if (d < bd) { bd = d; tgt = e; }
  }
  // during an invasion the tanks also shell the horde: they pick the spot where the most zombies are bunched
  // inside the blast radius (re-checked every 10 frames while the gun is reloading)
  if (!tgt && typeof inv !== 'undefined' && inv.state !== 'idle') {
    const h = TANK.hordeTgt, inRange = e => Math.hypot(e.x + e.w / 2 - pv.x, e.y + e.h / 2 - pv.y) < TANK_RANGE;
    tgt = h && !h.dead && inRange(h) && (TANK.cd > 20 || frame % 10) ? h : (TANK.hordeTgt = bestHordeShot(pv));
  }
  TANK.tgt = tgt;                                      // who it is engaging (dashboard situation map)
  if (!tgt) return;
  TANK.aim = Math.atan2(tgt.y + tgt.h / 2 - pv.y, tgt.x + tgt.w / 2 - pv.x);
  TANK.flip = Math.cos(TANK.aim) < 0;
  if (TANK.cd <= 0) fireTankGun(TANK, tgt);
}
function bestHordeShot(pv) {
  const near = enemies.filter(e => e.horde && !e.dead && Math.hypot(e.x + e.w / 2 - pv.x, e.y + e.h / 2 - pv.y) < TANK_RANGE);
  if (!near.length) return null;
  const step = Math.max(1, Math.floor(near.length / 40));            // score at most ~40 candidate aim points
  let best = null, bn = -1, bd = 1e9;
  for (let i = 0; i < near.length; i += step) {
    const c = near[i], cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    let n = 0; for (const o of near) if (Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) < TANK_SPLASH) n++;
    const d = Math.hypot(cx - pv.x, cy - pv.y);
    if (n > bn || (n === bn && d < bd)) { bn = n; bd = d; best = c; }
  }
  return best;
}
function updateTankShells() {
  // 120mm shells fly to the spot they were aimed at, then explode
  for (const s of tankShells) {
    const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
    if (d <= 12) { tankBlast(s); s.life = 0; continue; }
    s.ang = Math.atan2(dy, dx);
    s.x += dx / d * 12; s.y += dy / d * 12;
    tankFx.push({ kind: 'smoke', x: s.x, y: s.y, vx: 0, vy: -0.15, r: 1.5, t: 16, max: 16, c: '#a8a296' });   // smoke trail
    if (--s.life <= 0) { tankBlast(s); s.life = 0; }
  }
  tankShells = tankShells.filter(s => s.life > 0);
}
function fireTankGun(TANK, e) {
  const pv = tankPivot(TANK), ca = Math.cos(TANK.aim), sa = Math.sin(TANK.aim);
  const mx = pv.x + ca * TANK_BARREL, my = pv.y + sa * TANK_BARREL;
  TANK.cd = TANK_RELOAD; TANK.fireT = 12; TANK.recoil = 6;
  tankShells.push({ x: mx, y: my, tx: e.x + e.w / 2, ty: e.y + e.h / 2, ang: TANK.aim, life: 60 });
  // muzzle blast: fireball cone, side jets from the muzzle brake, a ring of smoke and a shockwave
  tankFx.push({ kind: 'blast', x: mx, y: my, ang: TANK.aim, t: 10, max: 10 });
  for (let i = 0; i < 9; i++) {
    const a = TANK.aim + (R() - 0.5) * 1.6, s = 0.6 + R() * 1.6;
    tankFx.push({ kind: 'smoke', x: mx, y: my, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.2, r: 3 + R() * 2, t: 40 + ri(0, 20), max: 60, c: R() < 0.5 ? '#8a847a' : '#b4aea2' });
  }
  for (const side of [-1, 1]) {                                  // muzzle brake side jets
    const a = TANK.aim + side * 1.4;
    tankFx.push({ kind: 'smoke', x: mx, y: my, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8, r: 3, t: 30, max: 30, c: '#9a9488' });
  }
  burst(mx, my, '#ffd060', 12);
  const near = Math.hypot(pv.x - p.x, pv.y - p.y);
  if (near < 360) { sfx('cannon'); addShake(near < 160 ? 4 : 2); }
  float(pv.x, TANK.y - 30, 'FIRE!', '#ffb040');
}
function tankBlast(s) {
  addCrater(s.tx, s.ty, 10);                                     // a crater where it lands (filled back in over time)
  // impact: a jagged burst of flame chunks and flame tongues that burns out into rising smoke, plus debris
  const chunks = [];
  for (let i = 0; i < 26; i++) {
    const a = R() * 6.28, d = R() * 14;
    chunks.push({ dx: Math.cos(a) * d * 1.3, dy: Math.sin(a) * d * 0.8 - R() * 6, s: 3 + ri(0, 6),
      vx: Math.cos(a) * (0.4 + R() * 1.2), vy: Math.sin(a) * 0.6 - 0.5 - R() * 0.6, hot: R() });
  }
  const tongues = [];
  for (let i = 0; i < 7; i++) tongues.push({ a: -Math.PI / 2 + (R() - 0.5) * 3.4, len: 14 + ri(0, 16), w: 2 + ri(0, 2) });
  tankFx.push({ kind: 'boom', x: s.tx, y: s.ty, t: 30, max: 30, chunks, tongues });
  for (let i = 0; i < 14; i++) {
    const a = R() * 6.28, sp = 0.4 + R() * 1.4;
    tankFx.push({ kind: 'smoke', x: s.tx + Math.cos(a) * 6, y: s.ty + Math.sin(a) * 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 0.45,
      r: 4 + R() * 3, t: 50 + ri(0, 30), max: 80, c: R() < 0.5 ? '#4a4642' : '#6a645c' });
  }
  burst(s.tx, s.ty, '#ff8020', 24); burst(s.tx, s.ty, '#ffe070', 14); burst(s.tx, s.ty, '#3a3430', 14);
  const near = Math.hypot(s.tx - p.x, s.ty - p.y);
  if (near < 360) { sfx('boom'); addShake(near < 140 ? 5 : 3); }
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2, d = Math.hypot(ex - s.tx, ey - s.ty);
    if (d > TANK_SPLASH + Math.max(e.w, e.h) / 2) continue;
    const fall = d < 14 + Math.max(e.w, e.h) / 2 ? 1 : 0.6;      // full damage near the centre
    const dmg = Math.max(1, Math.round(tankDmg() * fall) - e.d.def);
    e.hp -= dmg; e.flash = 6;
    float(ex, e.y - 2, String(dmg), '#ff9030');
    if (e.hp <= 0) {
      if (e.d.boss) killEnemy(e);                                 // bosses still drop their spoils for the player
      else { e.dead = true; burst(ex, ey, '#a01818', 10); }
    }
  }
}

function drawTank(TANK, cx, cy) {
  const x = Math.round(TANK.x - cx), y = Math.round(TANK.y - cy);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + TANK.h - 2, TANK.w, 4);
  const wreck = TANK.state === 'wrecked' || TANK.state === 'towing';
  if (TANK.state === 'towing' && TANK.truck && TANK.truck.phase === 'drag') TANK.aim = TANK.flip ? Math.PI + 0.3 : 0.3;   // gun drooping
  else if (TANK.state === 'wrecked') TANK.aim = TANK.flip ? Math.PI - 0.35 : 0.35;
  const hull = wreck ? TANK_HULL_WRECK : TANK.hitT > 0 && TANK.hitT % 4 < 2 ? whiteOf(TANK_HULL) : TANK_HULL;
  ctx.drawImage(hull, x - 1, y - 1);
  // turret faces the target's side; the gun tube elevates/traverses toward it
  const pv = tankPivot(TANK), px = Math.round(pv.x - cx), py = Math.round(pv.y - cy);
  const tx = TANK.flip ? x + TANK.w - 34 : x + 8;
  ctx.save();
  const tur = wreck ? TANK_TURRET_WRECK : TANK_TURRET;
  if (TANK.flip) { ctx.translate(tx + 26, 0); ctx.scale(-1, 1); ctx.drawImage(tur, -1, y - 11); }
  else ctx.drawImage(tur, tx - 1, y - 11);
  ctx.restore();
  // 120mm smoothbore cannon: thick tube, thermal sleeve bands, bore evacuator and a muzzle reference block
  ctx.save(); ctx.translate(px, py); ctx.rotate(TANK.aim);
  const b = -TANK.recoil, L = TANK_BARREL;
  ctx.fillStyle = '#100c1a'; ctx.fillRect(2 + b, -3, L - 1, 6); ctx.fillRect(L - 4 + b, -4, 5, 8);  // outline
  ctx.fillStyle = wreck ? '#3a3230' : TANK_COL.b; ctx.fillRect(3 + b, -2, L - 3, 4);
  ctx.fillStyle = TANK_COL.a; ctx.fillRect(3 + b, -2, L - 3, 1);
  ctx.fillStyle = TANK_COL.c; ctx.fillRect(3 + b, 1, L - 3, 1);
  for (const bx of [9, 20]) { ctx.fillStyle = TANK_COL.c; ctx.fillRect(bx + b, -2, 1, 4); }      // sleeve bands
  ctx.fillStyle = TANK_COL.d; ctx.fillRect(13 + b, -3, 5, 6);                                      // bore evacuator
  ctx.fillStyle = TANK_COL.c; ctx.fillRect(14 + b, -3, 3, 1);
  ctx.fillStyle = TANK_COL.d; ctx.fillRect(L - 3 + b, -3, 3, 6);                                   // muzzle
  ctx.fillStyle = '#100c1a'; ctx.fillRect(L - 1 + b, -1, 1, 2);                                    // bore
  ctx.restore();
  // name + reload bar when the player stands nearby
  drawTankStatus(TANK, x, y);
  if (TANK.state === 'ok' && mode === 'play' && Math.hypot(p.x + 6 - pv.x, p.y + 6 - pv.y) < 90) {
    text('M1A1 ABRAMS', x + TANK.w / 2, y - 26, '#d2bc8a', 'center');
    bar(x + 7, y - 16, 32, 2, 1 - TANK.cd / TANK_RELOAD, '#ffb040', '#402810');
  }
}
// irregular smoke clump: a few overlapping squares at fixed random offsets (no round shapes)
function smokeClump(f, x, y) {
  if (!f.lumps) { f.lumps = []; for (let i = 0; i < 3; i++) f.lumps.push([(R() - 0.5) * 1.6, (R() - 0.5) * 1.2, 0.6 + R() * 0.7]); }
  ctx.fillStyle = f.c;
  for (const [ox, oy, sz] of f.lumps) {
    const s = Math.max(1, Math.round(f.r * sz * 1.5));
    ctx.fillRect(Math.round(x + ox * f.r - s / 2), Math.round(y + oy * f.r - s / 2), s, s);
  }
}
// flame colour by heat: white-hot → yellow → orange → red → soot
const FLAME = ['#fffbe0', '#ffe070', '#ffb030', '#ff7a1c', '#d03a10', '#5a2a18'];
const flameCol = h => FLAME[Math.max(0, Math.min(FLAME.length - 1, Math.floor(h * FLAME.length)))];
function drawTankShells(cx, cy) {
  for (const f of tankFx) if (f.kind === 'smoke') {               // smoke under the fire
    ctx.globalAlpha = Math.min(0.75, f.t / f.max * 1.1);
    smokeClump(f, f.x - cx, f.y - cy);
  }
  ctx.globalAlpha = 1;
  for (const f of tankFx) {
    const x = Math.round(f.x - cx), y = Math.round(f.y - cy), k = 1 - f.t / f.max;   // k: 0 → 1 over its life
    if (f.kind === 'blast') {                                      // muzzle flame: a flickering jagged tongue + side jets
      ctx.save(); ctx.translate(x, y); ctx.rotate(f.ang);
      const len = 6 + Math.round(Math.sin(k * Math.PI) * 16);
      for (let i = 0; i < len; i += 2) {
        const w = Math.max(1, Math.round((1 - i / len) * 7 + (R() - 0.5) * 4));
        ctx.fillStyle = flameCol(i / len * 0.8 + k * 0.4);
        ctx.fillRect(i, -w / 2 + Math.round((R() - 0.5) * 2), 2, w);
      }
      for (const s of [-1, 1]) for (let i = 0; i < len * 0.5; i += 2) {           // muzzle-brake side jets
        ctx.fillStyle = flameCol(0.3 + i / len + k * 0.3);
        ctx.fillRect(Math.round((R() - 0.5) * 2), s * (3 + i), 2, 2);
      }
      ctx.restore();
    } else if (f.kind === 'boom') {                                // impact: jagged flame chunks + flame tongues
      const grow = Math.min(1, k * 4), fade = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
      ctx.globalAlpha = Math.max(0, fade);
      if (k < 0.45) for (const tg of f.tongues) {                  // spiky flame tongues shooting out
        const L = Math.round(tg.len * Math.min(1, k * 5)), ca = Math.cos(tg.a), sa = Math.sin(tg.a);
        for (let i = 0; i < L; i += 2) {
          const w = Math.max(1, Math.round(tg.w * (1 - i / L) + 1));
          ctx.fillStyle = flameCol(i / L * 0.7 + k);
          ctx.fillRect(Math.round(x + ca * i - w / 2), Math.round(y + sa * i - w / 2), w, w);
        }
      }
      for (const c of f.chunks) {                                  // blocky fire chunks drifting up and cooling
        const s = Math.max(1, Math.round(c.s * (0.5 + grow * 0.7) * (1 - k * 0.5)));
        const t = f.max - f.t;
        ctx.fillStyle = flameCol(c.hot * 0.4 + k * 1.1);
        ctx.fillRect(Math.round(x + c.dx * grow + c.vx * t * 0.5 - s / 2), Math.round(y + c.dy * grow + c.vy * t * 0.5 - s / 2), s, s);
      }
      ctx.globalAlpha = 1;
    }
  }
  for (const s of tankShells) {                                    // the shell: a hot tracer with a glow
    const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
    ctx.save(); ctx.translate(x, y); ctx.rotate(s.ang || 0);
    ctx.fillStyle = '#ff8a20'; ctx.fillRect(-10, -1, 8, 3);
    ctx.fillStyle = '#ffe070'; ctx.fillRect(-3, -2, 6, 5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-1, -1, 3, 3);
    ctx.restore();
  }
}

// ================= Shell craters =================
// A 120 mm tank shell or a 155 mm artillery round blows a crater into the ground where it lands: a scorched pit with
// a rim of thrown-up dirt. Zombies wading through one are slowed. Over CRATER_LIFE the earth settles back: the pit
// fades out until the ground is as it was. Craters are an overlay drawn on top of the tiles (walls and roads are
// never changed); shells landing in water make a splash instead.
const CRATER_LIFE = 60 * 45, CRATER_MAX = 260, CRATER_SLOW = 0.7;
let CRATERS = [];
const CRATER_TILES = new Map();                 // "tx,ty" -> number of craters over that tile (zombie slow-down)
const craterSpr = {};
function craterSprite(r, v) {                   // painted once per size / variant
  const key = r + ':' + v;
  if (craterSpr[key]) return craterSpr[key];
  const S = r * 2 + 6, c = mk(S), g = c.getContext('2d'), m = S / 2;
  let seed = r * 31 + v * 7 + 1; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const blob = (rx, ry, col, jag) => {          // a ragged, slightly squashed disc
    g.fillStyle = col;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)) + (rnd() - 0.5) * jag);
      if (w > 0) g.fillRect(Math.round(m - w), Math.round(m + y), w * 2, 1);
    }
  };
  blob(r + 2, Math.round((r + 2) * 0.8), 'rgba(30,22,16,.45)', 3);      // scorch
  blob(r, Math.round(r * 0.78), '#6e5a40', 2);                           // thrown-up rim
  blob(r - 2, Math.round((r - 2) * 0.72), '#3e3024', 2);                 // crater wall
  blob(r - 4, Math.round((r - 4) * 0.68), '#22190f', 1);                 // the pit
  for (let i = 0; i < r * 2; i++) {                                     // clods and stones on the rim
    const a = rnd() * 6.28, d = r * (0.8 + rnd() * 0.5);
    g.fillStyle = rnd() < 0.5 ? '#8a7656' : '#4e4232';
    g.fillRect(Math.round(m + Math.cos(a) * d), Math.round(m + Math.sin(a) * d * 0.8), 1 + (rnd() < 0.3 ? 1 : 0), 1);
  }
  return (craterSpr[key] = c);
}
function craterTiles(c, add) {
  const r = c.r - 2, x0 = Math.floor((c.x - r) / T), x1 = Math.floor((c.x + r) / T), y0 = Math.floor((c.y - r) / T), y1 = Math.floor((c.y + r) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const k = tx + ',' + ty, n = (CRATER_TILES.get(k) || 0) + (add ? 1 : -1);
    if (n > 0) CRATER_TILES.set(k, n); else CRATER_TILES.delete(k);
  }
}
function addCrater(x, y, r) {
  if (!inWorld()) return;
  const tx = Math.floor(x / T), ty = Math.floor(y / T), ch = world[ty] && world[ty][tx];
  if (ch === undefined) return;
  if (ch === '~' || ch === 'b') {                                      // into the river: a column of spray instead
    for (let i = 0; i < 16; i++) parts.push({ x: x + ri(-6, 6), y, vx: (R() - 0.5) * 1.6, vy: -1 - R() * 2.2, t: 20 + ri(0, 10), c: R() < 0.5 ? '#d0ecff' : '#6aa0e8' });
    return;
  }
  const c = { x, y, r, v: ri(0, 2), t: 0 };
  CRATERS.push(c); craterTiles(c, true);
  if (CRATERS.length > CRATER_MAX) craterTiles(CRATERS.shift(), false);   // the oldest settle first
}
function updateCraters() {
  for (const c of CRATERS) if (++c.t >= CRATER_LIFE) { c.gone = true; craterTiles(c, false); }
  if (CRATERS.some(c => c.gone)) CRATERS = CRATERS.filter(c => !c.gone);
}
const inCrater = (px, py) => CRATER_TILES.has(Math.floor(px / T) + ',' + Math.floor(py / T));
function drawCraters(cx, cy) {
  for (const c of CRATERS) {
    const x = c.x - cx, y = c.y - cy;
    if (x < -c.r - 8 || y < -c.r - 8 || x > VW + c.r + 8 || y > VH + c.r + 8) continue;
    const k = c.t / CRATER_LIFE, img = craterSprite(c.r, c.v);
    ctx.globalAlpha = k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.4);   // the earth settles back over the last 40%
    const s = k < 0.6 ? 1 : 1 - (k - 0.6) * 0.5;                        // and the pit shrinks a little as it fills
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
    if (c.t < 90 && c.t % 6 < 3) { ctx.globalAlpha = 0.5 * (1 - c.t / 90); ctx.fillStyle = '#ff8a30'; ctx.fillRect(Math.round(x - 2), Math.round(y - 1), 4, 2); }   // embers in the fresh pit
  }
  ctx.globalAlpha = 1;
}
