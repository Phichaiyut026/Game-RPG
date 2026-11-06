// ================= BTR-80 patrols =================
// Two BTR-80 armoured personnel carriers (callsigns ALPHA and BRAVO) park in the motor-pool garage. Every few
// minutes one drives out through the east gate with a 3-man squad aboard and loops the abandoned city:
// ALPHA sweeps the north (Sectors 2-3), BRAVO the flooded district (Sector 7). At each street corner it
// halts, the squad dismounts to grab any loot lying around (scrap piles, gold, drops) and to scavenge the
// ruins, while the 14.5 mm KPVT turret covers them. Back at base the cargo goes to the player: scrap, gold
// and potions straight away, items into the supply locker (stash).
// A BTR can be knocked out like a tank (recovery.js): the cargo is lost, its crew dies, the squad holds the
// wreck until the recovery truck drags it home, and after the repair it drives back into its garage bay.

const BTR_HP = 1800, BTR_SPD = 1.1, BTR_RANGE = 150, SQUAD = 3;
const PATROL_FIRST = [60 * 30, 60 * 80], PATROL_EVERY = 60 * 60 * 2, STOP_MAX = 60 * 10, PICK_R = 150;
const LANE = 25.4;                                           // the eastbound lane of the avenue / highway (tile rows)
const tp = (x, y) => ({ x: (x + OX) * T, y: y * T });   // old tile numbers → world px
const PATROL_LOOPS = {
  ALPHA: [[58, LANE], [58, 9], [78, 9], [78, 17], [87, 17], [87, 41], [68, 41], [68, 33], [58, 33], [58, LANE]].map(([x, y]) => tp(x, y)),
  BRAVO: [[55, LANE], [55, 59], [71, 59], [71, 68], [91, 68], [91, 77], [61, 77], [61, 86], [55, 86], [55, LANE]].map(([x, y]) => tp(x, y)),   // clear of the wider river
};
// garage: roof x3-11 / y27-29, open bays x4-6 and x8-10 on row 30 (world.js). Each BTR backs into its bay.
const GARAGE = { x0: 3 + OX, x1: 11 + OX, y0: 27, y1: 29 };
const BTRS = [['ALPHA', 5.5, 1], ['BRAVO', 9.5, 0]].map(([call, gx, i]) => {
  const home = tp(gx, 30.5), b = { btr: true, tank: false, call, label: `BTR-80 ${call}`, w: 46, h: 16, hp: BTR_HP, max: BTR_HP, state: 'ok', hitT: 0,
    face: 1, anim: 0, aim: 0, fireT: 0, cd: 0, patrol: 'garage', patrolT: PATROL_FIRST[i % 2], wp: 0, stopT: 0, squad: [], cargo: null };
  setTankC(b, home.x, home.y); b.home = { x: b.x, y: b.y };
  b.route = [home, tp(gx, LANE), ...PATROL_LOOPS[call], tp(gx, LANE), home];
  b.towRoute = () => btrTowRoute(b);
  return b;
});

// ---- BTR-80 model: 8-wheeled boat-shaped hull (46x18, faces right); the turret is drawn on top ----
const BTR_SPR = twoFrames(46, 18, (P, f) => {
  const G = ['#7a8650', '#5a6638', '#3a4424'];
  P.rect(2, 8, 42, 6, G[1]); P.rect(2, 13, 42, 1, '#2a3218');                          // lower hull
  P.rect(6, 4, 34, 5, G[0]); P.rect(6, 4, 34, 1, '#9aa66a');                           // upper deck
  P.line(40, 4, 45, 9, 1, G[1]); P.rect(40, 5, 4, 4, G[1]); P.rect(44, 8, 1, 4, G[2]);   // sloped nose
  P.line(6, 4, 2, 8, 1, G[1]); P.rect(3, 6, 3, 2, G[1]);                               // sloped tail
  for (const [x, y, w] of [[9, 9, 5], [24, 5, 6], [33, 10, 4], [14, 5, 3]]) P.rect(x, y, w, 2, '#3e4a28');   // camo
  for (const [x, y, w] of [[17, 10, 4], [35, 6, 3]]) P.rect(x, y, w, 2, '#8a8656');
  P.rect(20, 7, 5, 5, G[2]); P.rect(21, 8, 3, 3, '#4a5630');                           // side hatch
  for (const x of [10, 14, 30, 36]) P.px(x, 6, '#80c0d0');                             // vision blocks
  P.rect(27, 9, 8, 2, '#f0f0e0'); P.px(29, 9, '#c03030');                              // ID band
  P.rect(44, 9, 1, 2, '#f8e070');                                                      // headlight
  for (const wx of [8, 15, 30, 37]) {
    P.ell(wx, 14, 3, 3, '#151515'); P.ell(wx, 14, 1, 1, '#5a5a5a');
    P.px(wx + (f ? 1 : -1), 14 + (f ? 1 : -1), '#8a8a8a');
  }
}).map(c => dimensional(c));
const BTR_WRECK = BTR_SPR.map(charred);

// ---- tow route for a wreck: from the motor pool along the highway into the loop, the short way round ----
function btrTowRoute(b) {
  const c = tankC(b), out = [{ x: BAY.x, y: AVENUE_Y }], L = PATROL_LOOPS[b.call], i = b.wp, n = b.route.length;
  if (i <= 2 || i >= n - 2) return [...out, { x: c.x, y: c.y }];                       // it fell on the highway
  const j = i - 2, len = pts => pts.reduce((s, q, k) => k ? s + Math.hypot(q.x - pts[k - 1].x, q.y - pts[k - 1].y) : 0, 0);
  const fwd = L.slice(1, j), back = L.slice(j, L.length - 1).reverse();
  const via = len([L[0], ...fwd, c]) <= len([L[0], ...back, c]) ? fwd : back;
  return [...out, { x: L[0].x, y: AVENUE_Y }, ...via, { x: c.x, y: c.y }];
}

// ---- squad ----
const PATROL_GUNS = ['Assault Rifle AK-74', 'Carbine M4A1', 'M249 Light Machine Gun'];
function newSquad(b, n = SQUAD) {
  return Array.from({ length: n }, (_, i) => ({ soldier: true, patrolMan: true, state: 'ride', x: 0, y: 0, w: 12, h: 12,
    gun: PATROL_GUNS[i % 3], fx: GUN_MODELS[PATROL_GUNS[i % 3]].fx, hp: 60 + p.lvl * 10, maxHp: 60 + p.lvl * 10, cd: ri(0, 30), aim: 0, flip: false,
    fireT: 0, anim: 0, downT: 0, hurtT: 0, build: 0, slot: i }));
}
const door = b => ({ x: b.x + 17, y: b.y + 2 });
const patrolMenInView = () => [...BTRS, ...QRFS].flatMap(b => b.squad.filter(s => s.state !== 'ride'));
// guard posts in a ring around a vehicle centre
const ringPost = (c, i, n, r = 30) => { const a = i / Math.max(1, n) * Math.PI * 2 + 0.4; return { x: c.x - 6 + Math.cos(a) * r, y: c.y - 6 + Math.sin(a) * r * 0.75 }; };
function runTo(s, x, y, sp = 1.3) {
  const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
  if (d <= sp) { s.x = x; s.y = y; return true; }
  s.x += dx / d * sp; s.y += dy / d * sp; s.anim++; if (Math.abs(dx) > 0.3) s.flip = dx < 0;
  return false;
}
function squadShoot(s, range) {
  if (s.fireT > 0) s.fireT--;
  if (--s.cd > 0) return;
  const sx = s.x + 6, sy = s.y + 6;
  let best = null, bd = range;
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const d = Math.hypot(e.x + e.w / 2 - sx, e.y + e.h / 2 - sy);
    if (d < bd) { bd = d; best = e; }
  }
  if (!best) { s.cd = 15; return; }
  s.aim = Math.atan2(best.y + best.h / 2 - sy, best.x + best.w / 2 - sx); s.flip = Math.cos(s.aim) < 0; s.fireT = 8;
  s.cd = s.fx === 'heavy' ? 18 : 34;
  guardShots.push({ x: sx + Math.cos(s.aim) * 10, y: sy + Math.sin(s.aim) * 10, e: best, life: 60, dmg: guardDmg(s.fx), fx: s.fx });
  if (Math.hypot(sx - p.x, sy - p.y) < 200 && R() < 0.5) sfx(s.fx === 'heavy' ? 'heavy_mg' : 'rifle');
}
// zombies that reach a dismounted soldier bite him (hurtSoldier in invasion.js); the fallen stay as corpses
function squadHurt(b) {
  if (b === BTRS[0]) for (const e of enemies) if (e.biteCD > 0 && !e.horde) e.biteCD--;   // once a frame (the horde ticks its own)
  for (const s of b.squad) {
    if (s.hurtT > 0) s.hurtT--;
    if (s.state === 'ride' || s.state === 'down') continue;
    for (const e of enemies) if (!e.dead && !e.d.dummy && !(e.biteCD > 0) && overlap(e, s)) { hurtSoldier(s, e); break; }
  }
  for (const s of b.squad) if (s.state === 'down' && --s.downT <= 0) { s.gone = true; addCorpse(s.x, s.y); }
  b.squad = b.squad.filter(s => !s.gone);
}
// what a soldier picked up / scavenged goes into the BTR's cargo hold
function stow(b, pk, s) {
  const c = b.cargo;
  if (pk.kind === 'gold') c.gold += pk.amt;
  else if (pk.kind === 'scrap') c.scrap += pk.amt;
  else if (pk.kind === 'potion') c.potions++;
  else if (pk.kind === 'mat' || pk.kind === 'use') c.items.push({ kind: pk.kind, id: pk.id, count: 1 });
  else if (pk.kind === 'gear') c.items.push(pk.item);
  if (Math.hypot(s.x - p.x, s.y - p.y) < 260) float(s.x + 6, s.y - 10, pk.kind === 'scrap' ? `+${pk.amt} SCRAP` : pk.kind === 'gold' ? `+${pk.amt}G` : 'LOOT!', '#c8d870');
}
function scavengeFind() {
  const r = R();
  return r < 0.6 ? { kind: 'scrap', amt: ri(2, 5) } : r < 0.85 ? { kind: 'gold', amt: ri(5, 15) + p.lvl }
    : r < 0.9 ? { kind: 'potion' } : { kind: 'mat', id: pick1(['gel', 'pelt', 'ear', 'bone']) };
}
const pick1 = a => a[Math.floor(R() * a.length)];

// ---- one halt: dismount, collect, scavenge, cover, remount. Returns true when everyone is back aboard ----
function patrolStop(b) {
  const c = tankC(b), dr = door(b);
  b.stopT--;
  if (b.stopT === STOP_MAX - 1) {                                       // dismount and hand out jobs
    const free = pickups.filter(pk => !pk.claimed && Math.hypot(pk.x - c.x, pk.y - c.y) < PICK_R)
      .sort((a, z) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(z.x - c.x, z.y - c.y));
    b.squad.forEach((s, i) => {
      s.x = dr.x + ri(-2, 2); s.y = dr.y + ri(-2, 2);
      const pk = free.shift();
      if (pk) { pk.claimed = true; s.job = { pk }; s.state = 'move'; }
      else if (i === 0 || R() < 0.5) {                                  // nothing lying around: search the ruins
        for (let k = 0; k < 12; k++) {
          const tx = c.x + ri(-56, 56), ty = c.y + ri(-48, 48);
          if (!solidAt(Math.floor((tx + 6) / T), Math.floor((ty + 6) / T))) { s.job = { search: { x: tx, y: ty }, t: 70 }; s.state = 'move'; break; }
        }
        if (!s.job) s.state = 'guard';
      } else s.state = 'guard';
      s.post = { x: c.x - 30 + s.slot * 22, y: c.y + 14 };
    });
  }
  let aboard = true;
  for (const s of b.squad) {
    if (s.state === 'down' || s.state === 'ride') continue;
    squadShoot(s, 120);
    if (s.state === 'move') {
      const j = s.job, tgt = j.pk || j.search;
      if (j.pk && !pickups.includes(j.pk)) { s.job = null; s.state = 'guard'; }          // someone else took it
      else if (runTo(s, tgt.x - 6, tgt.y - 6)) {
        if (j.pk) { pickups.splice(pickups.indexOf(j.pk), 1); stow(b, j.pk, s); s.job = null; s.state = 'guard'; }
        else if (--j.t <= 0) { stow(b, scavengeFind(), s); s.job = null; s.state = 'guard'; }
        else if (j.t % 20 === 0 && Math.hypot(s.x - p.x, s.y - p.y) < 220) float(s.x + 6, s.y - 12, 'SEARCHING', '#a8b0c8');
      }
    } else if (s.state === 'guard') runTo(s, s.post.x, s.post.y, 1);
    if (b.stopT <= 0 && s.state !== 'ride') {                           // mount up
      if (s.job && s.job.pk) s.job.pk.claimed = false;
      s.job = null; s.state = 'back';
    }
    if (s.state === 'back' && runTo(s, dr.x, dr.y, 1.5)) s.state = 'ride';
    if (s.state !== 'ride' && s.state !== 'down') aboard = false;
  }
  // the halt ends early once every job is done and the squad has nothing left to do
  if (b.stopT > 0 && b.stopT < STOP_MAX - 150 && b.squad.every(s => s.state === 'guard' || s.state === 'down')) b.stopT = 0;
  return b.stopT <= 0 && aboard;
}

// ---- BTR turret: 14.5 mm heavy machine gun, any zombie in range while it is outside the walls ----
function btrTurret(b) {
  if (b.fireT > 0) b.fireT--;
  if (--b.cd > 0) return;
  const c = tankC(b);
  if (safeAt(c.x, c.y)) { b.cd = 20; return; }
  let best = null, bd = BTR_RANGE;
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const d = Math.hypot(e.x + e.w / 2 - c.x, e.y + e.h / 2 - c.y);
    if (d < bd) { bd = d; best = e; }
  }
  if (!best) { b.cd = 15; return; }
  b.aim = Math.atan2(best.y + best.h / 2 - (b.y - 1), best.x + best.w / 2 - c.x); b.fireT = 5; b.cd = 10;
  guardShots.push({ x: c.x + Math.cos(b.aim) * 12, y: b.y - 1 + Math.sin(b.aim) * 12, e: best, life: 60, dmg: Math.round(guardDmg('heavy') * 1.5), fx: 'heavy' });
  if (Math.hypot(c.x - p.x, c.y - p.y) < 240 && frame % 2 === 0) sfx('heavy_mg');
}

// ---- cargo handed over back at the garage ----
function unloadCargo(b) {
  const c = b.cargo; if (!c) return;
  let sold = 0, stored = 0;
  p.gold += c.gold; p.scrap = (p.scrap || 0) + c.scrap; p.potions += c.potions;
  for (const it of c.items) {
    const stack = (it.kind === 'mat' || it.kind === 'use') && p.stash.find(s => s.kind === it.kind && s.id === it.id);
    if (stack) { stack.count += it.count; stored++; }
    else if (p.stash.length < BAG) { p.stash.push(it); stored++; }
    else { const v = Math.max(1, Math.round(itemValue(it) * 0.7)); p.gold += v; sold += v; }
  }
  msg(`${b.label} is back: +${c.scrap} scrap, +${c.gold + sold}G${c.potions ? `, +${c.potions} medkit` : ''}${stored ? `, ${stored} item(s) to the supply locker` : ''}`, '#c8d870');
  b.cargo = null; save();
}

// ---- per-frame update (from updateTanks, overworld only) ----
function updatePatrols() {
  for (const b of BTRS) {
    updateTankLife(b);                                                  // damage / wreck / tow / repair / drive home
    squadHurt(b);
    if (b.state !== 'ok') {
      if (b.patrol !== 'lost') { b.patrol = 'lost'; b.cargo = null; }
      for (const s of b.squad) if (s.state !== 'down') {                // the squad holds the wreck until it is towed off
        if (b.state === 'towing' && b.truck && b.truck.phase === 'drag') s.gone = true;
        else { s.state = 'guard'; s.post = s.post || { x: b.x + s.slot * 18, y: b.y + 18 }; runTo(s, s.post.x, s.post.y, 1); squadShoot(s, 120); }
      }
      b.squad = b.squad.filter(s => !s.gone);
      continue;
    }
    if (b.patrol === 'lost') { b.patrol = 'garage'; b.patrolT = PATROL_EVERY; b.squad = []; }
    if (b.patrol === 'garage') {
      if (--b.patrolT <= 0) {
        b.patrol = 'out'; b.wp = 1; b.squad = newSquad(b); b.cargo = { scrap: 0, gold: 0, potions: 0, items: [] };
        b.called = false; b.hold = false;
        msg(`${b.label} heading out on patrol to sweep the city.`, '#c8d870');
      }
      continue;
    }
    if (!b.called && !QRFS.length && needsHelp(b)) { b.called = true; msg(`${b.label} requests reinforcements! Press F to send the QRF.`, '#ff9060'); }
    if (b.hold && (b.patrol === 'out' || b.patrol === 'stop')) {          // the QRF is on its way: dig in and wait for it
      b.holdNext = b.patrol === 'stop' ? 1 : 0; b.patrol = 'hold';
      const c0 = tankC(b), dr = door(b);
      b.squad.forEach(s => {
        if (s.state === 'down') return;
        if (s.state === 'ride') { s.x = dr.x; s.y = dr.y; }
        if (s.job && s.job.pk) s.job.pk.claimed = false;
        s.job = null; s.state = 'guard'; s.post = ringPost(c0, s.slot, SQUAD);
      });
    }
    btrTurret(b);
    if (b.patrol === 'hold') {
      for (const s of b.squad) if (s.state === 'guard') { runTo(s, s.post.x, s.post.y, 1.2); squadShoot(s, 130); }
      if (!b.hold) b.patrol = 'regroup';
      continue;
    }
    if (b.patrol === 'regroup') {                                          // mount up again and carry on with the loop
      const dr = door(b); let aboard = true;
      for (const s of b.squad) {
        if (s.state === 'down' || s.state === 'ride') continue;
        s.state = 'back'; squadShoot(s, 120);
        if (runTo(s, dr.x, dr.y, 1.5)) s.state = 'ride'; else aboard = false;
      }
      if (aboard) { b.patrol = 'out'; b.wp += b.holdNext || 0; }
      continue;
    }
    if (b.patrol === 'stop') { if (patrolStop(b)) { b.patrol = 'out'; b.wp++; } continue; }
    // drive to the next waypoint
    const c = tankC(b), wp = b.route[b.wp];
    if (!wp) { b.patrol = 'garage'; b.patrolT = PATROL_EVERY; unloadCargo(b); b.squad = []; b.x = b.home.x; b.y = b.home.y; continue; }
    openGatesNear(c.x, c.y);
    const dx = wp.x - c.x, dy = wp.y - c.y, d = Math.hypot(dx, dy);
    b.anim++;
    if (Math.abs(dx) > 0.3) b.face = Math.sign(dx);
    if (d > BTR_SPD) { setTankC(b, c.x + dx / d * BTR_SPD, c.y + dy / d * BTR_SPD); if (frame % 8 === 0) tankFx.push({ kind: 'smoke', x: c.x - b.face * 24, y: c.y + 2, vx: 0, vy: -0.3, r: 2, t: 26, max: 26, c: '#6a645c' }); continue; }
    setTankC(b, wp.x, wp.y);
    const cityStop = b.wp > 2 && b.wp < b.route.length - 3;   // halt at every corner of the loop
    if (cityStop && b.squad.some(s => s.state !== 'down')) { b.patrol = 'stop'; b.stopT = STOP_MAX; }
    else b.wp++;
  }
  if (qrfCD > 0) qrfCD--;
  for (const q of QRFS) updateQRF(q);
  QRFS = QRFS.filter(q => !q.gone);
}

// ================= QRF: quick reaction force =================
// Press F (or use the dashboard) to send reinforcements to a patrol in trouble: a third BTR-80, CHARLIE,
// rolls out of the motor pool with 4 fresh soldiers. The patrol it is sent to stops and digs in until it
// arrives. On arrival the QRF patches the BTR up (+40% HP), replaces its fallen soldiers, and fights beside
// it until the area is quiet (or 20 s), then everyone mounts up: the patrol carries on and the QRF drives
// home. If the patrol's BTR is already a wreck, the QRF guards it until the recovery truck drags it away.
// One QRF at a time, 45 s to rearm after it gets back. The QRF can be knocked out and towed home too.
const QRF_CD = 60 * 45, QRF_FIGHT = 60 * 20, QRF_SPD = BTR_SPD * 1.3;
let QRFS = [], qrfCD = 0;
const aliveMen = b => b.squad.filter(s => s.state !== 'down').length;
const inField = b => b.state === 'ok' ? ['out', 'stop', 'hold', 'regroup'].includes(b.patrol)
  : b.state === 'wrecked' || (b.state === 'towing' && !(b.truck && b.truck.phase === 'drag'));
const needsHelp = b => inField(b) && (b.state !== 'ok' || b.hp < b.max * 0.6 || aliveMen(b) < 2);
function sendQRF(call) {
  const no = s => { msg(s, '#ff9090'); sfx('no'); return false; };
  if (!inWorld()) return no('Reinforcements can only be sent in the main world.');
  if (QRFS.length) return no('The QRF is already deployed.');
  if (qrfCD > 0) return no(`The QRF is rearming: ready in ${Math.ceil(qrfCD / 60)}s.`);
  const field = BTRS.filter(inField);
  const need = b => (b.state !== 'ok' ? 0 : 1) + b.hp / b.max + aliveMen(b) / SQUAD;   // lower = worse off
  const tgt = call ? field.find(b => b.call === call) : field.sort((a, z) => need(a) - need(z))[0];
  if (!tgt) return no(call ? `BTR-80 ${call} is not out in the field.` : 'No patrol is out in the field.');
  const route = btrTowRoute(tgt), last = route[route.length - 1], prev = route[route.length - 2];
  const d = Math.hypot(last.x - prev.x, last.y - prev.y) || 1, stop = Math.min(48, d);
  route[route.length - 1] = { x: last.x + (prev.x - last.x) / d * stop, y: last.y + (prev.y - last.y) / d * stop };   // pull up beside it
  const q = { btr: true, qrf: true, call: 'CHARLIE', label: 'QRF BTR-80 CHARLIE', w: 46, h: 16, hp: BTR_HP, max: BTR_HP, state: 'ok', hitT: 0,
    face: 1, anim: 0, aim: 0, fireT: 0, cd: 0, patrol: 'qrf', mission: 'go', target: tgt, path: route.slice(), sent: route.slice(), legs: 0, quietT: 0 };
  setTankC(q, BAY.x, BAY.y); q.home = { x: q.x, y: q.y };
  q.squad = newSquad(q, 4);
  q.towRoute = () => [...q.sent.slice(0, q.legs), { x: tankC(q).x, y: tankC(q).y }];
  if (tgt.state === 'ok') tgt.hold = true;
  QRFS.push(q);
  msg(`QRF dispatched to ${tgt.label}! Hold on!`, '#9ad868'); sfx('quest');
  return true;
}
function updateQRF(q) {
  updateTankLife(q); squadHurt(q);
  const t = q.target;
  if (q.state !== 'ok') {                                                   // knocked out: hold the wreck until it is towed
    if (q.mission !== 'lost') { q.mission = 'lost'; if (t) t.hold = false; if (t && t.state === 'ok') t.called = false; }
    for (const s of q.squad) if (s.state !== 'down') {
      if (q.state === 'towing' && q.truck && q.truck.phase === 'drag') s.gone = true;
      else { s.state = 'guard'; s.post = s.post || ringPost(tankC(q), s.slot, 4); runTo(s, s.post.x, s.post.y, 1); squadShoot(s, 120); }
    }
    q.squad = q.squad.filter(s => !s.gone);
    return;
  }
  if (q.mission === 'lost') { q.gone = true; qrfCD = QRF_CD; return; }    // repaired and driven home: stand down
  btrTurret(q);
  const c = tankC(q);
  if (q.mission === 'go' || q.mission === 'home') {
    const wp = q.path[0];
    if (!wp) {
      if (q.mission === 'home') { q.gone = true; qrfCD = QRF_CD; msg('The QRF is back at base.', '#9ad868'); return; }
      q.mission = 'fight'; q.fightT = QRF_FIGHT;                        // arrived: dismount and reinforce
      const tc = tankC(t), dr = door(q);
      q.squad.forEach(s => { if (s.state === 'ride') { s.x = dr.x; s.y = dr.y; s.state = 'guard'; s.post = ringPost(tc, s.slot + 0.5, 4, 52); } });
      if (t.state === 'ok') {
        t.hp = Math.min(t.max, t.hp + t.max * 0.4);
        const missing = SQUAD - aliveMen(t);
        if (missing > 0) {
          t.squad = t.squad.filter(s => s.state !== 'down');
          const fresh = newSquad(t, SQUAD).slice(0, missing);
          fresh.forEach((s, i) => { s.slot = t.squad.length + i; s.x = dr.x; s.y = dr.y; s.state = t.patrol === 'hold' ? 'guard' : 'back'; s.post = ringPost(tc, s.slot, SQUAD); });
          t.squad.push(...fresh);
        }
        float(tc.x, t.y - 20, 'REINFORCED!', '#9ad868');
      }
      msg(`QRF has reached ${t.label}.`, '#9ad868');
      return;
    }
    openGatesNear(c.x, c.y);
    const dx = wp.x - c.x, dy = wp.y - c.y, d = Math.hypot(dx, dy);
    q.anim++; if (Math.abs(dx) > 0.3) q.face = Math.sign(dx);
    if (d > QRF_SPD) { setTankC(q, c.x + dx / d * QRF_SPD, c.y + dy / d * QRF_SPD); if (frame % 8 === 0) tankFx.push({ kind: 'smoke', x: c.x - q.face * 24, y: c.y + 2, vx: 0, vy: -0.3, r: 2, t: 26, max: 26, c: '#6a645c' }); }
    else { setTankC(q, wp.x, wp.y); q.path.shift(); if (q.mission === 'go') q.legs++; }
    return;
  }
  if (q.mission === 'fight' || q.mission === 'board') {
    const tc = tankC(t);
    const quiet = !enemies.some(e => !e.dead && !e.d.dummy && Math.hypot(e.x + e.w / 2 - tc.x, e.y + e.h / 2 - tc.y) < 170);
    q.quietT = quiet ? q.quietT + 1 : 0;
    const towedAway = t.state !== 'ok' && !(t.state === 'wrecked' || (t.state === 'towing' && !(t.truck && t.truck.phase === 'drag')));
    if (q.mission === 'fight' && (--q.fightT <= 0 || q.quietT > 180 || towedAway)) { q.mission = 'board'; if (t.state === 'ok') t.hold = false; }
    const dr = door(q); let aboard = true;
    for (const s of q.squad) {
      if (s.state === 'down' || s.state === 'ride') continue;
      squadShoot(s, 130);
      if (q.mission === 'fight') runTo(s, s.post.x, s.post.y, 1.3);
      else { s.state = 'back'; if (runTo(s, dr.x, dr.y, 1.5)) s.state = 'ride'; else aboard = false; }
    }
    if (q.mission === 'board' && aboard) {
      q.mission = 'home'; q.path = q.sent.slice(0, q.legs).reverse(); q.path.push({ x: BAY.x, y: BAY.y });
      if (t.state === 'ok') t.called = false;
    }
  }
}

// ---- drawing ----
// the garage roof is drawn again over the actors, so a vehicle driving through the garage disappears under it
function drawGarageRoof(cx, cy) {
  for (let ty = GARAGE.y0; ty <= GARAGE.y1; ty++) for (let tx = GARAGE.x0; tx <= GARAGE.x1; tx++) {
    const arr = TILES[world[ty][tx]];
    if (arr) ctx.drawImage(arr[tileHash(tx, ty) % arr.length], tx * T - cx, ty * T - cy);
  }
}
function drawBTR(b, cx, cy) {
  const x = Math.round(b.x - cx), y = Math.round(b.y - cy);
  if (x < -60 || x > VW + 60 || y < -40 || y > VH + 40) return;
  const wreck = b.state === 'wrecked' || b.state === 'towing', face = b.state === 'return' || b.state === 'towing' ? (b.flip ? -1 : 1) : b.face;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 1, y + 13, 44, 4);
  const spr = (wreck ? BTR_WRECK : BTR_SPR)[Math.floor(b.anim / 6) % 2];
  drawSprite(b.hitT > 0 && b.hitT % 4 < 2 ? whiteOf(spr) : spr, x, y - 3, face < 0);
  // turret: small cone with the KPVT barrel, swung toward its target
  const px = x + (face < 0 ? 46 - 28 : 28), py = y - 1;
  ctx.fillStyle = '#100c1a'; ctx.fillRect(px - 5, py - 3, 10, 6);
  ctx.fillStyle = wreck ? '#2e2a26' : '#5a6638'; ctx.fillRect(px - 4, py - 2, 8, 4);
  ctx.fillStyle = wreck ? '#3a3430' : '#7a8650'; ctx.fillRect(px - 4, py - 2, 8, 1);
  const aim = b.patrol === 'garage' || wreck ? (face < 0 ? Math.PI : 0) + (wreck ? 0.3 * face : 0) : b.aim;
  ctx.save(); ctx.translate(px, py); ctx.rotate(aim);
  ctx.fillStyle = '#100c1a'; ctx.fillRect(2, -1.5, 14, 3);
  ctx.fillStyle = wreck ? '#3a3430' : '#3a3e34'; ctx.fillRect(3, -1, 12, 2);
  if (b.fireT > 2) { ctx.fillStyle = '#fff6a0'; ctx.fillRect(15, -2, 3, 4); ctx.fillStyle = '#ff9020'; ctx.fillRect(18, -1, 2, 2); }
  ctx.restore();
  drawTankStatus(b, x, y);
  if (mode === 'play' && b.state === 'ok' && Math.hypot(p.x - b.x - 17, p.y - b.y) < 90) {
    text(b.label, x + 23, y - 22, '#c8d870', 'center');
    const st = b.qrf ? (b.mission === 'fight' ? 'REINFORCING' : b.mission === 'home' ? 'RETURNING TO BASE' : 'QRF EN ROUTE') : b.patrol === 'hold' ? 'HOLDING: WAITING FOR QRF' : b.patrol === 'garage' ? `NEXT PATROL ${Math.ceil(b.patrolT / 60)}s` : b.patrol === 'stop' ? 'SECURING AREA' : 'ON PATROL';
    text(st, x + 23, y - 12, '#a8b0c8', 'center');
  }
}
