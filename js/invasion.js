// ================= Zombie Invasion =================
// Every few minutes a horde of 500 marches on the base from the east, in 3 waves. Each raid is led by 10
// bosses spread over the waves, and wave 3 also drags the world boss (Behemoth Prime) along. The M1A1s
// and the M198 battery (artillery.js) engage them. Raid zombies are tougher than field zombies (INV_TOUGH).
// Horde zombies ignore the usual "stay out of the base" rule: they SWIM across the river (slowed, half
// under water) and SMASH their way through fences, walls and gates: every wall tile has HP, and once it
// is beaten down it becomes a rubble gap the horde (and everyone else) can pour through. Bosses tear
// walls down far faster. After the raid, combat engineers come out of the base and rebuild every
// breach and patch every damaged wall (WALLS / ENGINEERS below). Trees, houses and bunkers still block them.
// When the sirens sound, a squad of soldiers runs out of the base to defensive posts along the river
// fence and just inside the base wall, builds a sandbag emplacement and opens fire on the horde.
// Zombies that reach a soldier attack him; soldiers who fall are left where they died (corpses: recovery.js).

const INV_FIRST = 60 * 90, INV_EVERY = 60 * 60 * 4;       // first raid after ~1.5 min, then every ~4 min
const INV_WARN = 60 * 12;                                   // siren countdown before the first wave
// reinforcements: once fewer than 60% of the posts are still manned, a fresh squad runs out to refill the empty
// posts and the M198 battery fires close support on the river line (artillery.js). Up to 5 squads per raid.
const REINF_LEFT = 0.6, REINF_SIZE = 10, REINF_MAX = 5, REINF_CD = 60 * 20, SUPPORT_T = 60 * 20;
const INV_WAVES = 3, INV_MAX_T = 60 * 60 * 9;               // an invasion gives up after 9 minutes
// MASS HORDE: 150 + 170 + 180 = 500 zombies per raid. The waves don't wait for each other: the next one
// pours in right behind the last, so most of the 500 are swarming the river and the wall at the peak.
const INV_COUNTS = [150, 170, 180], INV_TOUGH = 2.5, INV_BURST = 3, INV_BURST_T = 6;   // 3 zombies every 6 frames = 30 a second
const INV_NEXT = 60 * 8;                                             // next wave 8 s after the last one started
const HORDE_SWIM = new Set('~');
// wall HP per tile: fence / watchtower / steel gate / sandbags / HESCO wall / jersey barrier
const WALL_MAX = { M: 500, G: 1100, J: 1400, F: 350, H: 900, '@': 700 };
const BREACH = "'";                                          // rubble left where a wall was smashed down (passable)
const WALLS = new Map();                                     // "x,y" -> { x, y, ch, hp, max, broken } for damaged / broken walls
const DEFENCE_X = 47 + OX;                                        // walls up to here (base + river fence) must be smashed; city clutter beyond is climbed
// the 10 bosses leading each raid, by wave (HP before the +15% per later raid)
const BOSS_HP = { orc: 60000, lich: 90000, frostwyrm: 90000, infernal: 120000 };
const INV_BOSSES = { 1: ['orc', 'orc'], 2: ['orc', 'lich', 'frostwyrm'], 3: ['orc', 'lich', 'lich', 'frostwyrm', 'infernal'] };
const INV_TITAN_HP = 300000;                                 // the world boss that joins wave 3
const BASE_PLAZA = { x: (12.5 + OX) * T, y: 24.5 * T };
const inv = { state: 'idle', cd: INV_FIRST, t: 0, wave: 0, queue: [], spawnT: 0, waveT: 0, total: 0, breachMsg: false };
let SOLDIERS = [];

// ---- soldier sprites (helmet, olive fatigues, dark plate carrier); two frames for running ----
const SOLDIER_SPR = ['..K..K..', '.K....K.'].map(feet => dimensional(art(
  ['..zzzz..', '.zyyyyz.', '..SKSK..', '..SSSS..', '.yuuuuy.', 'S.yuuy.S', '..yyyy..', feet])));
const SOLDIER_GUNS = ['Carbine M4A1', 'Assault Rifle AK-74', 'G36 Battle Rifle', 'Tactical SCAR-H', 'M249 Light Machine Gun'];

const hordeAlive = () => enemies.filter(e => e.horde && !e.dead);
const hordeInBase = () => inv.state !== 'idle' && enemies.some(e => e.horde && !e.dead && inBasePx(e.x, e.y));

// ---- defensive posts: two tiles behind the river fence, plus three just inside the base wall ----
function invasionPosts() {
  const posts = [];
  const free = (x, y) => x > 0 && y > 0 && x < MW && y < MH && !SOLID.has(world[y][x]) && !tankBlocks(x * T + 2, y * T + 2, 12, 12);
  for (const y of [4, 7, 11, 13, 15, 19, 21, 28, 31, 33, 35, 38, 44, 46]) {   // a firing line along the whole river fence
    let fx = 0; for (let x = 36 + OX; x < 52 + OX; x++) if ('MJ'.includes(world[y][x])) { fx = x; break; }
    if (!fx) continue;
    let n = 0;                                                        // two riflemen per post, one a step behind the other
    for (let x = fx - 2; x > fx - 9 && n < 2; x--) if (free(x, y)) { posts.push({ x, y, river: true }); n++; x--; }
  }
  for (const y of [11, 17, 21, 28, 31, 35, 38]) if (free(23 + OX, y)) posts.push({ x: 23 + OX, y, river: false });   // the inner line at the base wall
  return posts;
}
function mkSoldier(pt, i) {
  const px = pt.x * T + 2, py = pt.y * T + 2;
  // run out through the east gate, along the highway, then up/down the field to the post
  const path = pt.river ? [[24.5 + OX, 24.5], [pt.x + 0.5, 24.5], [pt.x + 0.5, pt.y + 0.5]] : [[22.5 + OX, 24.5], [23.5 + OX, pt.y + 0.5]];
  const gun = SOLDIER_GUNS[i % SOLDIER_GUNS.length];
  return { soldier: true, pt, x: (13 + OX) * T + ri(-8, 8), y: 23 * T + ri(0, 16), w: 12, h: 12, post: { x: px, y: py },
    path: path.map(([x, y]) => ({ x: x * T - 6, y: y * T - 6 })), state: 'move', gun, fx: GUN_MODELS[gun].fx,
    hp: 60 + p.lvl * 10, maxHp: 60 + p.lvl * 10, cd: ri(0, 30), aim: 0, flip: false, fireT: 0, build: 0, anim: 0, downT: 0, hurtT: 0 };
}
function deploySoldiers() {
  inv.posts = invasionPosts();
  SOLDIERS = inv.posts.map(mkSoldier);
}
const manned = pt => SOLDIERS.some(s => s.pt === pt && s.state !== 'down' && s.state !== 'return');
// too many men down: send a fresh squad to the empty posts and call the guns in on the river line
function checkReinforce() {
  if (inv.reinfCD > 0) { inv.reinfCD--; return; }
  if (!inv.posts || inv.reinf >= REINF_MAX) return;
  const empty = inv.posts.filter(pt => !manned(pt));
  if (inv.posts.length - empty.length >= inv.posts.length * REINF_LEFT || !empty.length) return;
  const squad = empty.slice(0, REINF_SIZE).map((pt, i) => mkSoldier(pt, i + inv.reinf * 3));
  squad.forEach((s, i) => { s.y += i * 3; });
  SOLDIERS.push(...squad);
  inv.reinf++; inv.reinfCD = REINF_CD; inv.supportT = SUPPORT_T;
  banner = { txt: 'REINFORCEMENTS!', t: 150 }; sfx('quest');
  msg(`Reinforcements: ${squad.length} soldiers are moving up to the line!`, '#9ad868');
  msg('Artillery: fire for effect on the river line!', '#ffb040');
}

// ---- schedule & waves ----
function startInvasion() {
  if (!inWorld() || inv.state !== 'idle') return;
  inv.num = (inv.num || 0) + 1;
  Object.assign(inv, { state: 'warn', t: INV_WARN, wave: 0, queue: [], spawnT: 0, waveT: 0, total: 0, breachMsg: false, elapsed: 0,
    reinf: 0, reinfCD: 0, supportT: 0, wallMsg: false });
  deploySoldiers();
  banner = { txt: 'ZOMBIE INVASION!', t: 220 }; sfx('siren'); addShake(3);
  msg('Sirens! A zombie horde is marching on the base from the east!', '#ff6040');
  msg('Soldiers are moving to defensive positions!', '#9ad868');
}
function queueWave(n) {
  const lvlScale = (2.6 + Math.max(0, p.lvl - 3) * 0.12) * (1 + 0.15 * Math.min(6, inv.num - 1));   // tougher than field zombies; each raid hits harder
  const mix = n === 1 ? ['slime', 'slime', 'slime', 'wolf'] : n === 2 ? ['slime', 'slime', 'wolf', 'goblin'] : ['slime', 'wolf', 'goblin', 'skel'];
  inv.queue = Array.from({ length: INV_COUNTS[n - 1] }, () => ({ type: mix[ri(0, mix.length - 1)], scale: lvlScale }));
  const more = 1 + 0.15 * Math.min(6, inv.num - 1), bscale = 1 + Math.max(0, p.lvl - 3) * 0.08;
  (INV_BOSSES[n] || []).forEach((type, i) => {                       // the bosses leading the horde, spread through the wave
    if (ETYPES[type]) inv.queue.splice(Math.min(inv.queue.length, 6 + i * 25 + ri(0, 10)), 0, { type, scale: bscale, bossHp: Math.round(BOSS_HP[type] * more) });
  });
  if (n === INV_WAVES && !worldBoss()) inv.queue.splice(20, 0, { type: 'titan', scale: 1, bossHp: Math.round(INV_TITAN_HP * more), world: true });
  inv.wave = n; inv.waveT = 0; inv.total += inv.queue.length;
  banner = { txt: `WAVE ${n}!`, t: 120 }; sfx('cry');
}
function spawnHordeZombie(o) {
  const d = ETYPES[o.type], w = d.w || 12, h = d.h || 12;
  for (let i = 0; i < 30; i++) {
    const x = ri(62 + OX, 72 + OX) * T + 2, y = ri(3, 46) * T + 2;
    if (hordeBlocked(x, y, w, h)) continue;
    const e = mkEnemy(o.type, x, y, 'Invasion', o.scale);
    if (o.bossHp) {                                                 // a boss: huge HP pool, announced to everyone
      e.d = { ...e.d, hp: o.bossHp }; e.hp = o.bossHp; e.invBoss = true;
      banner = { txt: o.world ? 'WORLD BOSS JOINS THE HORDE!' : 'BOSS INCOMING!', t: 180 }; sfx('cry'); addShake(o.world ? 8 : 4);
      msg(`${e.d.name} is leading the horde!`, '#ff4060');
    } else { e.d = { ...e.d, hp: Math.round(e.d.hp * INV_TOUGH) }; e.hp = e.d.hp; }   // raid zombies are tougher
    e.horde = true; e.goalY = clamp(y + ri(-48, 48), 10 * T, 39 * T); e.lx = x; e.ly = y; e.stuckT = 0; e.detourT = 0; e.biteCD = 0; e.bestX = x; e.noProg = 0; e.ghostT = 0;
    enemies.push(e);
    return;
  }
}
function endInvasion(win) {
  if (win) {
    const g = 100 + p.lvl * 25, xp = 80 + p.lvl * 30;
    p.gold += g; gainXp(xp);
    banner = { txt: 'INVASION REPELLED!', t: 220 }; sfx('quest');
    msg(`The horde was repelled! +${g}G +${xp} XP`, '#f8c838');
    float(p.x + 6, p.y - 16, `+${g}G`, '#f8c838');
  } else if (win === false) msg('The horde dispersed back into the wastes.', '#c0a080');
  for (const s of SOLDIERS) if (s.state !== 'down') { s.state = 'return'; s.path = [{ x: (24 + OX) * T, y: 24 * T + 2 }, { x: (13 + OX) * T, y: 24 * T + 2 }]; }
  inv.state = 'idle'; inv.cd = INV_EVERY; inv.supportT = 0;
  engCD = 60 * 4;                                                    // the engineers roll out a few seconds later
}
// called every frame from update(): leaving the overworld (bunker, rift, another map) swaps the enemy
// list, so the horde is gone; call the raid off quietly (menus and dialogs don't count)
function invasionWatch() {
  if (inv.state !== 'idle' && !inWorld()) { inv.state = 'idle'; inv.cd = INV_EVERY; SOLDIERS = []; }
}
function updateInvasion() {
  updateSoldiers(); updateMines();
  updateEngineers();
  if (inv.state === 'idle') {
    if (WALLS.size && !ENGINEERS.length && --engCD <= 0) dispatchEngineers();
    if (mode === 'play' && --inv.cd <= 0) startInvasion();
    return;
  }
  inv.elapsed++;
  if (inv.state === 'warn') {
    if (inv.t % 100 === 0) sfx('siren');
    if (--inv.t <= 0) { inv.state = 'wave'; queueWave(1); }
    return;
  }
  // feed the current wave in a zombie at a time
  if (inv.queue.length && --inv.spawnT <= 0) { for (let i = 0; i < INV_BURST && inv.queue.length; i++) spawnHordeZombie(inv.queue.shift()); inv.spawnT = INV_BURST_T; }
  inv.waveT++;
  checkReinforce();
  if (inv.supportT > 0) inv.supportT--;
  const alive = hordeAlive().length;
  if (!inv.queue.length) {
    if (inv.wave < INV_WAVES && (alive <= 40 || inv.waveT > INV_NEXT)) queueWave(inv.wave + 1);
    else if (inv.wave >= INV_WAVES && alive === 0) endInvasion(true);
  }
  if (!inv.breachMsg && hordeInBase()) { inv.breachMsg = true; msg('The horde broke through the base wall!', '#ff5040'); sfx('cry'); }
  if (inv.elapsed > INV_MAX_T) { for (const e of hordeAlive()) e.dead = true; endInvasion(false); }
}

// ---- horde zombie movement & attacks (called from updateEnemies for e.horde) ----
function hordeBlocked(x, y, w, h) {
  const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 1) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tx < 1 || ty < 1 || tx >= MW - 1 || ty >= MH - 1) return true;
    const c = map[ty][tx];
    if (SOLID.has(c) && !HORDE_SWIM.has(c) && !(tx > DEFENCE_X && WALL_MAX[c])) return true;   // defence walls must be smashed down first
    if (buildSolidAt(tx, ty)) return true;                           // player-built walls: they must smash through (build.js)
  }
  return tankBlocks(x, y, w, h);
}
function hordeMove(e, vx, vy) {
  if (e.ghostT > 0) {                                                // crashing through brush (but never through a wall)
    const nx = clamp(e.x + vx, T, (MW - 2) * T), ny = clamp(e.y + vy, T, (MH - 2) * T);
    if (!wallIn(nx, e.y, e.w, e.h)) e.x = nx;
    if (!wallIn(e.x, ny, e.w, e.h)) e.y = ny;
    return;
  }
  if (vx && !hordeBlocked(e.x + vx, e.y, e.w, e.h)) e.x += vx;
  if (vy && !hordeBlocked(e.x, e.y + vy, e.w, e.h)) e.y += vy;
}
function hordeAI(e) {
  if (e.flash > 0) e.flash--;
  if (e.frozen > 0) { e.frozen--; return; }
  e.anim++;
  if (e.biteCD > 0) e.biteCD--;
  if (e.stun > 0) { e.stun--; hordeMove(e, e.kx, e.ky); e.kx *= 0.8; e.ky *= 0.8; return; }
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  const tile = map[clamp(Math.floor(ey / T), 0, MH - 1)][clamp(Math.floor(ex / T), 0, MW - 1)];
  e.swim = HORDE_SWIM.has(tile);
  if (e.swim && frame % 12 === 0) parts.push({ x: ex + ri(-5, 5), y: e.y + e.h - 2, vx: 0, vy: 0.1, t: 14, c: '#a0d8ff' });
  // pick a target: any defender close by (player, bots, soldiers), else march on the base
  let tx, ty, tgt = null, bd = 110;
  const consider = (o, x, y) => { const d = Math.hypot(x - ex, y - ey); if (d < bd) { bd = d; tgt = o; tx = x; ty = y; } };
  if (mode === 'play' && !spec && p.hp > 0) consider(p, p.x + 6, p.y + 6);
  for (const b of bots) if (botAlive(b)) consider(b, b.x + 6, b.y + 6);
  for (const s of SOLDIERS) if (s.state !== 'down' && s.state !== 'return') consider(s, s.x + 6, s.y + 6);
  for (const v of vehicleTargets()) consider(v, v.x + v.w / 2, v.y + v.h / 2);   // gun trucks, Abrams, howitzers (raidforce.js)
  if (!tgt) {
    if (ex > (26 + OX) * T) { tx = (13 + OX) * T; ty = e.goalY; }                // head west toward the base
    else { tx = BASE_PLAZA.x; ty = BASE_PLAZA.y; }                   // inside: converge on the plaza
    if (Math.hypot(tx - ex, ty - ey) < 24) { tx = ex + Math.cos(e.anim * 0.05) * 20; ty = ey + Math.sin(e.anim * 0.07) * 20; }
  }
  if (e.ghostT > 0) e.ghostT--;
  if (!tgt && ex > (26 + OX) * T) {                                         // marching but not getting any further west: smash through
    if (e.x < e.bestX - 4) { e.bestX = e.x; e.noProg = 0; } else if (++e.noProg > 300) { e.noProg = 0; e.ghostT = 90; }
  }
  const dx = tx - ex, dy = ty - ey, d = Math.hypot(dx, dy) || 1;
  const spd = e.d.spd * (e.enraged ? 1.25 : 1) * (e.swim ? 0.7 : 1) * (tile === 'B' ? 0.5 : 1) * (inCrater(ex, ey) ? CRATER_SLOW : 1) * buildSlow(e) * (1 + NIGHT.spd * nightK());
  let vx = dx / d * spd, vy = dy / d * spd;
  if (e.detourT > 0) { e.detourT--; vx *= 0.3; vy = e.detourVy * spd; }      // sidestep around a tree / house
  hordeMove(e, vx, vy);
  if (Math.abs(vx) > 0.05) e.face = Math.sign(vx);
  const wall = Math.hypot(e.x - e.lx, e.y - e.ly) < 0.3 * spd + 0.02 ? wallAhead(e, vx, vy) : null;
  if (wall) {                                                        // a wall in the way: smash it
    e.stuckT = 0; e.detourT = 0;
    if (e.biteCD <= 0) hitWall(e, wall);
  } else if (Math.hypot(e.x - e.lx, e.y - e.ly) < 0.08 * spd + 0.02) {
    if (++e.stuckT > 25) { e.stuckT = 0; e.detourT = 40; e.detourVy = R() < 0.5 ? -1 : 1; }
  } else e.stuckT = 0;
  if (e.invBoss && e.d.ranged && tgt && bd < 140 && --e.shootCD <= 0) fireEnemy(e, tx - ex, ty - ey);   // the Tyrant spits volleys
  e.lx = e.x; e.ly = e.y;
  // bites
  if (p.hurtT <= 0 && mode === 'play' && overlap(e, p)) hurtPlayer(e);
  if (tgt && tgt.bot && overlap(e, tgt)) hurtBot(tgt, e);
  if (tgt && tgt.soldier && e.biteCD <= 0 && overlap(e, tgt)) hurtSoldier(tgt, e);
  if (tgt && tgt.veh && e.biteCD <= 0 && e.x - 4 < tgt.x + tgt.w && e.x + e.w + 4 > tgt.x && e.y - 4 < tgt.y + tgt.h && e.y + e.h + 4 > tgt.y) hitVehicle(tgt, e);
}

// ---- soldiers ----
function hurtSoldier(s, e) {
  e.biteCD = 40;
  const dmg = Math.max(1, Math.round(e.d.atk * (e.d.boss ? BOSS_DMG : 1) * DIFF().dmg * (0.85 + R() * 0.3) * nightAtk()) - Math.floor(p.lvl / 2));
  s.hp -= dmg; s.hurtT = 16;
  float(s.x + 6, s.y - 4, '-' + dmg, '#ff9090');
  if (s.hp <= 0) {
    s.hp = 0; s.state = 'down'; s.downT = 150;
    burst(s.x + 6, s.y + 6, '#a01818', 12);
    if (Math.hypot(s.x - p.x, s.y - p.y) < 360) msg('Soldier down! KIA!', '#ff9090');
  }
}
function updateSoldiers() {
  for (const s of SOLDIERS) {
    if (s.fireT > 0) s.fireT--;
    if (s.hurtT > 0) s.hurtT--;
    if (s.state === 'down') { if (--s.downT <= 0) { s.gone = true; addCorpse(s.x, s.y); } continue; }   // he stays where he fell (recovery.js)
    if (s.state === 'move' || s.state === 'return') {                // run along the waypoints (no collision)
      const wp = s.path[0] || (s.state === 'move' ? s.post : null);
      if (!wp) { s.gone = true; continue; }
      const dx = wp.x - s.x, dy = wp.y - s.y, d = Math.hypot(dx, dy), sp = 1.35;
      if (d <= sp) { s.x = wp.x; s.y = wp.y; if (s.path.length) s.path.shift(); else s.state = 'deploy'; }
      else { s.x += dx / d * sp; s.y += dy / d * sp; s.anim++; if (Math.abs(dx) > 0.3) s.flip = dx < 0; }
      if (s.state === 'return' && !s.path.length && d <= sp) s.gone = true;
      if (s.state !== 'move') continue;
    }
    if (s.state === 'deploy') {                                       // stack the sandbags
      s.flip = false;
      if (++s.build >= 70) { s.state = 'hold'; if (Math.hypot(s.x - p.x, s.y - p.y) < 220) float(s.x + 6, s.y - 12, 'IN POSITION!', '#9ad868'); }
      continue;
    }
    if (s.state !== 'hold' && s.state !== 'move') continue;
    // shoot: horde zombies first (swimmers & climbers are easy targets), then anything else close
    if (--s.cd > 0) continue;
    const sx = s.x + 6, sy = s.y + 6;
    let best = null, bd = s.state === 'hold' ? 150 : 110;
    for (const e of enemies) {
      if (e.dead || e.d.dummy) continue;
      const d = Math.hypot(e.x + e.w / 2 - sx, e.y + e.h / 2 - sy) - (e.horde ? 20 : 0);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) { s.cd = 15; continue; }
    s.aim = Math.atan2(best.y + best.h / 2 - sy, best.x + best.w / 2 - sx);
    s.flip = Math.cos(s.aim) < 0; s.fireT = 8;
    s.cd = s.fx === 'heavy' ? 18 : s.fx === 'sniper' ? 70 : 34;
    guardShots.push({ x: sx + Math.cos(s.aim) * 10, y: sy + Math.sin(s.aim) * 10, e: best, life: 60, dmg: guardDmg(s.fx), fx: s.fx });
    if (Math.hypot(sx - p.x, sy - p.y) < 200 && R() < 0.5) sfx(s.fx === 'heavy' ? 'heavy_mg' : 'rifle');
  }
  SOLDIERS = SOLDIERS.filter(s => !s.gone);
}

// ---- drawing ----
function drawSandbags(x, y, n) {                                      // low U-shaped wall around the soldier's legs
  const bags = [[-5, 10], [-1, 9], [3, 9], [7, 9], [11, 9], [15, 10], [-5, 6], [15, 6], [-1, 12], [3, 12], [7, 12], [11, 12]];
  for (let i = 0; i < Math.min(n, bags.length); i++) {
    const [bx, by] = bags[i];
    ctx.fillStyle = '#4a3c22'; ctx.fillRect(x + bx - 1, y + by - 1, 6, 5);
    ctx.fillStyle = '#b49a64'; ctx.fillRect(x + bx, y + by, 4, 3);
    ctx.fillStyle = '#d2bc8a'; ctx.fillRect(x + bx, y + by, 4, 1);
  }
}
function drawSoldier(s, cx, cy) {
  const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 1, y + 10, 10, 3);
  if (s.state === 'down') {                                           // lying on the ground
    ctx.save(); ctx.translate(x + 6, y + 8); ctx.rotate(Math.PI / 2); drawSprite(SOLDIER_SPR[0], -8, -8, false); ctx.restore();
    return;
  }
  const running = s.state === 'move' || s.state === 'return';
  const spr = SOLDIER_SPR[running ? Math.floor(s.anim / 8) % 2 : 0];
  const bob = running ? -(Math.floor(s.anim / 4) % 2) : 0;
  drawSprite(s.hurtT > 0 && s.hurtT % 4 < 2 ? whiteOf(spr) : spr, x - 2, y - 4 + bob, s.flip);
  const aim = s.state === 'hold' || s.fireT > 0 ? s.aim : (s.flip ? Math.PI : 0) + 0.5 * (s.flip ? -1 : 1);
  drawWeapon('rifle', x - 2 + (s.flip ? 3 : 13), y - 4 + 12 + bob, aim, false, { name: s.gun, plus: 0 }, s.fireT > 4);
  const bagN = s.state === 'hold' ? 12 : s.state === 'deploy' ? Math.floor(s.build / 70 * 12) : 0;
  if (bagN) drawSandbags(x, y, bagN);
  if (s.state === 'deploy' && Math.hypot(s.x - p.x, s.y - p.y) < 160) text('DEPLOYING', x + 6, y - 16, '#d2bc8a', 'center');
  if (s.hp < s.maxHp) bar(x, y - 8, 12, 2, s.hp / s.maxHp, '#58d858', '#203820');
}
// swimming: only the top half shows above the water
function drawHordeBody(e, img, sx, sy, iw, ih) {
  const keep = Math.round(ih * 0.55), bob = Math.round(Math.sin(e.anim * 0.15));
  ctx.save(); ctx.beginPath(); ctx.rect(Math.round(sx) - 2, Math.round(sy) - 4, iw + 4, keep + 4); ctx.clip();
  drawSprite(img, sx, sy + 3 + bob, e.face < 0);
  ctx.restore();
  ctx.fillStyle = 'rgba(200,236,255,.75)';                           // ripple around the waterline
  const wy = Math.round(sy + keep + 2), wx = Math.round(sx);
  ctx.fillRect(wx - 2, wy, iw + 4, 1);
  if (Math.floor(e.anim / 10) % 2) { ctx.fillRect(wx - 4, wy + 1, 3, 1); ctx.fillRect(wx + iw + 1, wy + 1, 3, 1); }
}
function drawInvasionHud() {
  if (!inWorld() || inv.state === 'idle') return;
  if (inv.state === 'warn') {
    if (Math.floor(frame / 20) % 2) text(`ZOMBIE INVASION IN ${Math.ceil(inv.t / 60)}s`, VW / 2, 34, '#ff5040', 'center');
    text('Soldiers are moving to defensive positions!', VW / 2, 46, '#9ad868', 'center');
    return;
  }
  const left = hordeAlive().length + inv.queue.length;
  const s = `INVASION · WAVE ${inv.wave}/${INV_WAVES} · ${left} LEFT`, w = textW(s) + 12;
  panel(Math.round(VW / 2 - w / 2), 30, w, 14, '#ff5040', 0.85);
  text(s, VW / 2, 33, '#ffb0a0', 'center');
  if (typeof c2OnStation === 'function' && c2OnStation()) text('C2 ON STATION · FIRE MISSIONS COORDINATED', VW / 2, 66, '#80e0ff', 'center');
  const bosses = enemies.filter(e => e.invBoss && !e.dead);          // the nearest boss: name + HP bar, and how many are left
  if (bosses.length) {
    const d = e => Math.hypot(e.x - p.x, e.y - p.y), boss = bosses.reduce((a, b) => d(b) < d(a) ? b : a);
    text(`${boss.d.name.toUpperCase()}  (${bosses.length} BOSSES)`, VW / 2, 48, '#ff6080', 'center');
    bar(Math.round(VW / 2 - 60), 58, 120, 4, boss.hp / boss.d.hp, '#ff3050', '#401018');
  }
}

// ================= Breakable walls =================
// Wall tiles have no HP of their own until something hits them: the first hit adds them to WALLS.
// At 0 HP the tile turns into rubble (BREACH, passable). A bridge gate breaks as a whole and stays open
// until it is rebuilt. The engineers below put everything back.
TILES[BREACH] = [1, 2].map(s => paint(g => {
  g.fillStyle = '#5a4e3c'; g.fillRect(0, 0, 16, 16);                               // churned dirt
  speck(g, '#6e604a', 6, s); speck(g, '#3e3428', 5, s + 4);
  g.fillStyle = '#8a7a52'; g.fillRect(1, 9, 5, 3); g.fillRect(10, 3, 4, 3);          // torn sandbags / HESCO
  g.fillStyle = '#b09a6a'; g.fillRect(1, 9, 5, 1); g.fillRect(10, 3, 4, 1);
  g.fillStyle = '#4a505a'; g.fillRect(6, 5, 1, 7); g.fillRect(7, 11, 6, 1);           // bent posts and wire
  g.fillStyle = '#7a828e'; g.fillRect(3, 3, 6, 1); g.fillRect(9, 13, 5, 1);
  g.fillStyle = '#2a2420'; g.fillRect(12, 8, 2, 2); g.fillRect(4, 13, 2, 2);          // chunks of debris
}));
MINI_COL[BREACH] = '#c86030';

const wallKey = (x, y) => x + ',' + y;
const breakable = (x, y) => x > 0 && y > 0 && x <= DEFENCE_X && y < WH - 1 && WALL_MAX[world[y][x]] !== undefined;
function wallIn(x, y, w, h) {                                        // does this box touch an intact breakable wall?
  const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 1) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (breakable(tx, ty)) return true;
  return false;
}
// the wall tile just in front of a zombie, in the direction it's pushing
function wallAhead(e, vx, vy) {
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  const probes = [];
  const span = (n, half) => { const o = []; for (let k = -half + 1; k <= half - 1; k += 8) o.push(k); o.push(half - 1); return o; };   // across the whole front, so a big boss widens the gap
  if (Math.abs(vx) > 0.01) for (const o of span(0, e.h / 2)) probes.push([ex + Math.sign(vx) * (e.w / 2 + 3), ey + o]);
  if (Math.abs(vy) > 0.01) for (const o of span(0, e.w / 2)) probes.push([ex + o, ey + Math.sign(vy) * (e.h / 2 + 3)]);
  for (const [px, py] of probes) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    if (breakable(tx, ty)) return { x: tx, y: ty };
  }
  return null;
}
const gateAt = (x, y) => GATES.find(g => g.xs ? g.y === y && g.xs.includes(x) : g.x === x && g.ys.includes(y));
const gateTiles = g => g.xs ? g.xs.map(x => [x, g.y]) : g.ys.map(y => [g.x, y]);
function hitWall(e, t) {
  const k = wallKey(t.x, t.y), ch = world[t.y][t.x];
  let w = WALLS.get(k);
  if (!w) { w = { x: t.x, y: t.y, ch, hp: WALL_MAX[ch], max: WALL_MAX[ch], broken: false }; WALLS.set(k, w); }
  const dmg = Math.max(1, Math.round(e.d.atk * (e.d.boss ? 12 : 1)));
  w.hp -= dmg; e.biteCD = e.d.boss ? 30 : 40;
  const cx = t.x * T + 8, cy = t.y * T + 8, near = Math.hypot(cx - p.x, cy - p.y) < 260;
  if (frame % 2 === 0) parts.push({ x: cx + ri(-6, 6), y: cy + ri(-6, 4), vx: (R() - 0.5) * 1.6, vy: -R() * 1.4, t: 14, c: R() < 0.5 ? '#8a7a52' : '#5a5a62' });
  if (e.d.boss && near) addShake(2);
  if (w.hp <= 0) breakWall(w, near);
}
function breakWall(w, near) {
  const g = gateAt(w.x, w.y);
  const tiles = g ? gateTiles(g) : [[w.x, w.y]];
  if (g) { g.broken = true; g.open = true; }
  for (const [x, y] of tiles) {                                     // a gate falls as one piece
    const k = wallKey(x, y), o = WALLS.get(k) || { x, y, ch: 'J', max: WALL_MAX.J };
    o.hp = 0; o.broken = true; WALLS.set(k, o);
    world[y][x] = BREACH;
    burst(x * T + 8, y * T + 8, '#8a7a52', 14); burst(x * T + 8, y * T + 8, '#3a3430', 8);
  }
  miniFor = null;
  if (near) { sfx('boom'); addShake(3); float(w.x * T + 8, w.y * T - 4, 'BREACH!', '#ff7050'); }
  if (!inv.wallMsg) { inv.wallMsg = true; msg('The horde smashed a hole in the wall!', '#ff5040'); }
}

// ================= Combat engineers =================
// After a raid (won or lost), engineers in hard hats and hi-vis vests leave the base square, walk (around
// buildings, on a tile path) to each damaged or broken wall, weld / stack it back together, then go home.
const ENG_N = 4, ENG_SPD = 1.1, ENG_FIX = 60 * 4;                 // up to 4 engineers; a full rebuild takes ~4 s
let ENGINEERS = [], engCD = 0;
const ENGINEER_SPR = ['..K..K..', '.K....K.'].map(feet => dimensional(art(
  ['..zzzz..', '.zzzzzz.', '..SKSK..', '..SSSS..', '.yuuuuy.', 'S.yuuy.S', '..yyyy..', feet], 2, null,
  { ...PAL, z: '#f0c020', u: '#ff8a20', y: '#486c36' })));
const engNeed = w => w.broken ? ENG_FIX : Math.max(30, Math.round(ENG_FIX * 0.5 * (1 - w.hp / w.max)));
// shortest walk over open tiles from (sx, sy) to any tile next to (gx, gy); returns world-px waypoints
function engPath(sx, sy, gx, gy) {
  const W = WW, open = (x, y) => x > 0 && y > 0 && x < WW - 1 && y < WH - 1 && (!SOLID.has(world[y][x]) || world[y][x] === 'J');   // gates: they open them
  const goal = new Set([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [gx + dx, gy + dy])   // beside the gap, not in it
    .filter(([x, y]) => open(x, y)).map(([x, y]) => y * W + x));
  if (!goal.size) return null;
  const prev = new Int32Array(WW * WH).fill(-1), start = sy * W + sx, q = [start];
  prev[start] = start;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    if (goal.has(c)) {
      const out = []; for (let n = c; n !== start; n = prev[n]) out.push({ x: (n % W) * T + 2, y: Math.floor(n / W) * T + 2 });
      return out.reverse();
    }
    const x = c % W, y = (c - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * W + nx;
      if (prev[n] === -1 && open(nx, ny)) { prev[n] = c; q.push(n); }
    }
  }
  return null;
}
function dispatchEngineers() {
  const jobs = [...WALLS.values()].filter(w => !w.claimed).length;
  if (!jobs) return;
  const n = Math.min(ENG_N, jobs);
  for (let i = 0; i < n; i++) ENGINEERS.push({ engineer: true, x: (13 + OX) * T + ri(-8, 8), y: 23 * T + ri(0, 12), w: 12, h: 12,
    state: 'idle', job: null, path: [], fixT: 0, anim: 0, flip: false });
  msg(`Combat engineers are heading out to repair ${WALLS.size} wall sections.`, '#9ad868');
}
function finishRepair(w) {
  const g = gateAt(w.x, w.y);
  world[w.y][w.x] = g ? 'J' : w.ch;
  WALLS.delete(wallKey(w.x, w.y));
  if (g && !gateTiles(g).some(([x, y]) => WALLS.has(wallKey(x, y)))) { g.broken = false; setGate(g, false); }   // the whole gate is back on its hinges
  miniFor = null;
}
function updateEngineers() {
  for (const n of ENGINEERS) {
    if (n.state === 'idle') {                                       // take the nearest wall nobody is fixing yet
      let best = null, bd = 1e9;
      for (const w of WALLS.values()) if (!w.claimed) { const d = Math.hypot(w.x * T - n.x, w.y * T - n.y); if (d < bd) { bd = d; best = w; } }
      const sx = Math.floor((n.x + 6) / T), sy = Math.floor((n.y + 6) / T);
      if (best) {
        best.claimed = true; n.job = best;
        n.path = engPath(sx, sy, best.x, best.y) || [{ x: best.x * T - 14, y: best.y * T + 2 }];
        n.state = 'walk';
      } else {                                                      // all done: back to the base square
        n.job = null; n.path = engPath(sx, sy, 13 + OX, 24) || []; n.path.push({ x: (13 + OX) * T, y: 24 * T }); n.state = 'home';
      }
    }
    if (n.state === 'walk' || n.state === 'home') {
      const wp = n.path[0];
      if (!wp) { if (n.state === 'home') n.gone = true; else { n.state = 'fix'; n.fixT = 0; } continue; }
      const dx = wp.x - n.x, dy = wp.y - n.y, d = Math.hypot(dx, dy);
      if (d <= ENG_SPD) { n.x = wp.x; n.y = wp.y; n.path.shift(); }
      else { n.x += dx / d * ENG_SPD; n.y += dy / d * ENG_SPD; n.anim++; if (Math.abs(dx) > 0.3) n.flip = dx < 0; }
      openGatesNear(n.x + 6, n.y + 6);
      continue;
    }
    if (n.state === 'fix') {
      const w = n.job, wx = w.x * T + 8, wy = w.y * T + 8;
      n.flip = wx < n.x + 6;
      if (frame % 4 === 0) parts.push({ x: wx + ri(-5, 5), y: wy + ri(-6, 2), vx: (R() - 0.5) * 1.5, vy: -R() * 1.2, t: 10, c: R() < 0.5 ? '#ffe070' : '#ffffff' });   // welding sparks
      if (frame % 20 === 0 && Math.hypot(wx - p.x, wy - p.y) < 220) sfx('hit');
      // don't wall anyone in: wait until the gap is clear
      const box = { x: w.x * T, y: w.y * T, w: T, h: T };
      const busy = (mode === 'play' && overlap(box, p)) || enemies.some(e => !e.dead && overlap(box, e)) || bots.some(b => botAlive(b) && overlap(box, b));
      if (++n.fixT >= engNeed(w) && !(w.broken && busy)) {
        finishRepair(w);
        if (Math.hypot(wx - p.x, wy - p.y) < 260) float(wx, wy - 12, 'REPAIRED!', '#9ad868');
        n.state = 'idle';
        if (!WALLS.size) msg('The engineers have rebuilt every wall.', '#9ad868');
      }
    }
  }
  ENGINEERS = ENGINEERS.filter(n => !n.gone);
}
function drawEngineer(n, cx, cy) {
  const x = Math.round(n.x - cx), y = Math.round(n.y - cy);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 1, y + 10, 10, 3);
  const walking = n.state === 'walk' || n.state === 'home';
  const spr = ENGINEER_SPR[walking ? Math.floor(n.anim / 8) % 2 : 0], bob = walking ? -(Math.floor(n.anim / 4) % 2) : 0;
  drawSprite(spr, x - 2, y - 4 + bob, n.flip);
  const a = n.state === 'fix' ? Math.sin(frame * 0.4) * 0.8 : 0.6, hx = x + (n.flip ? 1 : 11), hy = y + 8 + bob;   // wrench, swung while working
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(n.flip ? Math.PI - a : a);
  ctx.fillStyle = '#1c1a1e'; ctx.fillRect(0, -1, 8, 3); ctx.fillStyle = '#a8b0bc'; ctx.fillRect(1, 0, 6, 1); ctx.fillRect(6, -1, 2, 3);
  ctx.restore();
  if (n.state === 'fix') {
    bar(x - 2, y - 8, 16, 2, Math.min(1, n.fixT / engNeed(n.job)), '#f0c020', '#403010');
    if (Math.hypot(n.x - p.x, n.y - p.y) < 160) text('REPAIRING', x + 6, y - 18, '#f0c020', 'center');
  }
}
// cracks on damaged walls (worse as the HP drops)
function drawWallDamage(cx, cy) {
  for (const w of WALLS.values()) {
    if (w.broken) continue;
    const x = w.x * T - cx, y = w.y * T - cy;
    if (x < -T || y < -T || x > VW || y > VH) continue;
    const k = 1 - w.hp / w.max;
    ctx.fillStyle = '#1a1614';
    ctx.fillRect(x + 7, y + 2, 1, 5); ctx.fillRect(x + 6, y + 6, 1, 4);
    if (k > 0.35) { ctx.fillRect(x + 3, y + 9, 4, 1); ctx.fillRect(x + 10, y + 4, 1, 6); ctx.fillRect(x + 11, y + 9, 3, 1); }
    if (k > 0.65) { ctx.fillRect(x + 2, y + 3, 3, 1); ctx.fillRect(x + 4, y + 12, 1, 3); ctx.fillRect(x + 12, y + 12, 2, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y, T, T); }
  }
}

// ================= River mines =================
// Contact mines float at anchor in the river in front of the base: two staggered rows along the north half (where the
// horde crosses), clear of the three bridges. A horde zombie that swims into one sets it off: a column of water and
// a blast that hits everything in MINE_SPLASH. Spent mines are re-laid by the engineers MINE_REARM after a raid.
const MINE_DMG = 2500, MINE_SPLASH = 40, MINE_TRIGGER = 12, MINE_REARM = 60 * 20;
const MINES = (() => {
  const out = [], skip = new Set([7, 8, 9, 10, 23, 24, 25, 26, 39, 40, 41, 42]);
  for (let y = 2; y <= 48; y += 2) {
    if (skip.has(y)) continue;
    let x0 = -1, x1 = -1;                                   // the water span on this row, in front of the base
    for (let x = 40 + OX; x < 62 + OX; x++) if (world[y][x] === '~') { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 < 0) continue;
    const st = (y / 2) % 2 ? 1 : 0;                         // stagger the rows
    for (const tx of [x0 + 2 + st, x1 - 2 - st]) out.push({ x: tx * T + 8, y: y * T + 8, armed: true, t: 0, bob: (tx * 7 + y) % 40 });
  }
  return out;
})();
let mineRearmT = 0;
function updateMines() {
  if (inv.state === 'idle') {                                // between raids the engineers re-lay the spent ones
    if (MINES.some(m => !m.armed) && ++mineRearmT >= MINE_REARM) {
      for (const m of MINES) m.armed = true;
      mineRearmT = 0; msg('Engineers have re-laid the river mines.', '#9ad868');
    }
    return;
  }
  mineRearmT = 0;
  if (frame % 2) return;
  for (const m of MINES) {
    if (!m.armed) continue;
    for (const e of enemies) {
      if (e.dead || !e.horde) continue;
      if (Math.abs(e.x + e.w / 2 - m.x) < MINE_TRIGGER + e.w / 2 && Math.abs(e.y + e.h / 2 - m.y) < MINE_TRIGGER + e.h / 2) { detonateMine(m); break; }
    }
  }
}
function detonateMine(m) {
  m.armed = false;
  for (let i = 0; i < 26; i++) parts.push({ x: m.x + ri(-10, 10), y: m.y, vx: (R() - 0.5) * 2.4, vy: -1.5 - R() * 3, t: 24 + ri(0, 14), c: R() < 0.6 ? '#d0ecff' : '#6aa0e8' });   // water column
  tankFx.push({ kind: 'boom', x: m.x, y: m.y, t: 22, max: 22, chunks: Array.from({ length: 16 }, () => ({ dx: (R() - 0.5) * 18, dy: (R() - 0.5) * 10, s: 3 + ri(0, 4), vx: (R() - 0.5) * 1.6, vy: -R(), hot: R() })), tongues: [] });
  rings.push({ x: m.x, y: m.y, r: 6, max: MINE_SPLASH + 10, c: '#d0ecff', t: 18 });
  const near = Math.hypot(m.x - p.x, m.y - p.y);
  if (near < 420) { sfx('boom'); addShake(near < 160 ? 4 : 2); }
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2, d = Math.hypot(ex - m.x, ey - m.y);
    if (d > MINE_SPLASH + Math.max(e.w, e.h) / 2) continue;
    const dmg = Math.max(1, Math.round(MINE_DMG * (d < 12 + Math.max(e.w, e.h) / 2 ? 1 : 0.6)) - e.d.def);
    e.hp -= dmg; e.flash = 6;
    if (near < 420) float(ex, e.y - 2, String(dmg), '#80d0ff');
    if (e.hp <= 0) { if (e.d.boss) killEnemy(e); else { e.dead = true; burst(ex, ey, '#a01818', 8); } }
  }
}
function drawMines(cx, cy) {
  for (const m of MINES) {
    if (!m.armed) continue;
    const x = Math.round(m.x - cx), y = Math.round(m.y - cy + Math.sin((frame + m.bob * 9) * 0.05));
    if (x < -10 || y < -10 || x > VW + 10 || y > VH + 10) continue;
    ctx.fillStyle = 'rgba(200,236,255,.5)'; ctx.fillRect(x - 5, y + 3, 10, 1);                    // ripple at the waterline
    ctx.fillStyle = '#100c1a'; ctx.fillRect(x - 3, y - 4, 7, 7);                                     // the sphere + horns
    ctx.fillStyle = '#3a3e44'; ctx.fillRect(x - 2, y - 3, 5, 5); ctx.fillStyle = '#5c626a'; ctx.fillRect(x - 2, y - 3, 2, 1);
    ctx.fillStyle = '#100c1a'; ctx.fillRect(x, y - 6, 1, 2); ctx.fillRect(x - 5, y, 2, 1); ctx.fillRect(x + 4, y, 2, 1);
    if (Math.floor((frame + m.bob * 5) / 25) % 2) { ctx.fillStyle = '#ff3030'; ctx.fillRect(x, y - 7, 1, 1); }   // arming light
  }
}
