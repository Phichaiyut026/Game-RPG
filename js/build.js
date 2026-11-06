// ================= Base Construction (B) =================
// Press B in the main world to enter build mode: a green/red grid cursor (the tile in front of you,
// or under the mouse) and a build bar along the bottom. Structures cost Scrap (dropped by zombies and
// lying around the map in scrap piles) plus Gold, and are saved with the game.
//   Defenses: Sandbags (cover: -30% damage, slows zombies) · Razor Wire (bleed + 50% slow)
//             HESCO Wall / Steel Wall (block the path: zombies have to smash through)
//   Turrets:  Sentry Gun .50 (auto-aims and fires) · Flame Trap / Acid Trap (burn / melt crowds)
//   Support:  Ammo Cache (instant refill when you stand next to it) · Searchlight (lights up the night)
// Zombies that touch a structure attack it; at 0 HP it is destroyed. Turret kills give no loot.

const BUILD_RANGE = 5;                         // tiles from the player (square)
const BUILD_MAX = 80, SENTRY_MAX = 8;
const BUILD_TYPES = [
  { id:'sandbag', name:'Sandbags',       cost:[3, 10],   hp:160,  solid:false, low:true, desc:'Cover: -30% damage taken next to it. Zombies crossing slow down.' },
  { id:'wire',    name:'Razor Wire',     cost:[4, 15],   hp:90,   solid:false, floor:true, desc:'Zombies on the wire bleed and move 50% slower.' },
  { id:'hesco',   name:'HESCO Wall',     cost:[8, 30],   hp:450,  solid:true,  desc:'Blocks the path. Zombies must smash through it.' },
  { id:'steel',   name:'Steel Wall',     cost:[16, 80],  hp:1000, solid:true,  desc:'Armoured wall. Takes a horde a long time to break.' },
  { id:'sentry',  name:'Sentry Gun .50', cost:[25, 200], hp:260,  solid:true,  desc:'Turns and fires on zombies within range.' },
  { id:'flame',   name:'Flame Trap',     cost:[15, 120], hp:220,  solid:false, floor:true, desc:'Burns every zombie that comes close. Put it in a chokepoint.' },
  { id:'acid',    name:'Acid Trap',      cost:[12, 100], hp:220,  solid:false, floor:true, desc:'Sprays acid: damage over time and 50% slow.' },
  { id:'ammo',    name:'Ammo Cache',     cost:[10, 80],  hp:200,  solid:true,  desc:'Stand next to it to refill your magazine instantly.' },
  { id:'light',   name:'Searchlight',    cost:[8, 60],   hp:160,  solid:true,  desc:'Lights up the area around it at night.' },
];
const BTYPE = Object.fromEntries(BUILD_TYPES.map(t => [t.id, t]));
const BUILD_BAN = new Set('ZVE<>KCQjJB');      // checkpoints, helipad, stairs, chests, gates, old wire
let BUILDS = [], BUILD_AT = new Map();
const build = { on: false, sel: 0, mouse: null, mouseT: 0, note: '', noteT: 0 };
const bKey = (tx, ty) => ty * 1000 + tx;

// ---- art (sculpted like the zombies; tall structures are 16x24 and stand on their tile) ----
const BUILD_ART = {
  sandbag: sculpt(16, 16, P => {
    const bag = (x, y) => { P.rect(x, y, 6, 4, '#4a3c22'); P.rect(x, y, 5, 3, '#b49a64'); P.rect(x, y, 5, 1, '#d2bc8a'); P.px(x + 2, y + 1, '#9a8250'); };
    for (const x of [0, 5, 10]) bag(x, 11);
    for (const x of [2, 7]) bag(x, 7);
    bag(12, 7);
  }),
  wire: sculpt(16, 16, P => {
    for (const x of [1, 13]) { P.line(x, 4, x + 2, 14, 1, '#6a4a28'); P.line(x + 2, 4, x, 14, 1, '#4a3218'); }
    for (const cx of [4, 8, 12]) for (let a = 0; a < 16; a++) {
      const ang = a / 16 * Math.PI * 2;
      P.px(cx + Math.round(Math.cos(ang) * 3), 9 + Math.round(Math.sin(ang) * 3), a % 4 === 0 ? '#ffffff' : a % 2 ? '#a8b0b8' : '#7a828a');
    }
  }),
  hesco: sculpt(16, 24, P => {
    P.rect(0, 4, 16, 20, '#b8a070'); P.rect(0, 4, 16, 2, '#6a5232'); P.rect(0, 6, 16, 1, '#d4c08c'); P.rect(13, 6, 3, 18, '#8a7448');
    for (const x of [0, 5, 10, 15]) P.rect(x, 6, 1, 18, '#5a5a5a');
    for (const y of [11, 16, 21]) P.rect(0, y, 16, 1, '#5a5a5a');
    P.px(3, 8, '#8a7448'); P.px(8, 13, '#8a7448'); P.px(11, 19, '#8a7448');
  }),
  steel: sculpt(16, 24, P => {
    P.rect(0, 2, 16, 22, '#6a7280'); P.rect(0, 2, 16, 2, '#a8b0bc'); P.rect(14, 4, 2, 20, '#4a505c');
    P.rect(7, 4, 1, 20, '#4a505c');
    for (const [x, y] of [[2, 6], [12, 6], [2, 14], [12, 14], [5, 10], [10, 10]]) { P.px(x, y, '#c8d0dc'); P.px(x + 1, y + 1, '#3a404a'); }
    for (let x = 0; x < 16; x += 4) { P.rect(x, 18, 2, 3, '#f8c838'); P.rect(x + 2, 18, 2, 3, '#1a1a1a'); }
  }),
  sentry: sculpt(16, 24, P => {
    P.line(8, 14, 2, 23, 1, '#3a3e46'); P.line(8, 14, 14, 23, 1, '#3a3e46'); P.line(8, 14, 8, 23, 1, '#4a505a');
    P.rect(4, 11, 8, 5, '#4a5a3a'); P.rect(4, 11, 8, 1, '#6a7a52'); P.rect(11, 12, 1, 4, '#2e3a24');
    P.rect(5, 13, 2, 2, '#c8a040');                                     // ammo box
  }),
  ammo: sculpt(16, 24, P => {
    P.rect(1, 10, 14, 13, '#5a6a3a'); P.rect(1, 10, 14, 2, '#7a8a52'); P.rect(13, 12, 2, 11, '#3a4626');
    P.rect(1, 8, 14, 3, '#4a5830'); for (let x = 3; x < 13; x += 2) { P.rect(x, 6, 1, 3, '#d8a838'); P.px(x, 5, '#f0d070'); }   // open lid, brass rounds
    P.rect(4, 15, 8, 3, '#1e2414'); P.rect(5, 16, 6, 1, '#f8c838');                                                            // stencil
  }),
  light: sculpt(16, 24, P => {
    P.line(8, 12, 3, 23, 1, '#3a3e46'); P.line(8, 12, 13, 23, 1, '#3a3e46'); P.rect(7, 8, 2, 16, '#4a505a');
    P.blob(8, 6, 5, 5, ['#8a929e', '#5a626e', '#3a404a']);
    P.ell(9, 6, 3, 3, '#fff6c0'); P.ell(9, 6, 1, 1, '#ffffff');
  }),
  flame: sculpt(16, 16, P => {
    P.rect(1, 5, 14, 10, '#3a3e46'); P.rect(1, 5, 14, 1, '#6a707a'); P.rect(13, 6, 2, 9, '#2a2e34');
    for (const x of [4, 8, 12]) { P.rect(x - 1, 7, 3, 3, '#1a1c20'); P.px(x, 8, '#ff7020'); }
    P.rect(2, 12, 12, 1, '#f8c838');
  }),
  acid: sculpt(16, 16, P => {
    P.rect(1, 8, 14, 7, '#3a3e46'); P.rect(1, 8, 14, 1, '#6a707a');
    P.blob(8, 7, 4, 5, ['#b0ff70', '#5ab830', '#2e6a18']); P.rect(6, 2, 4, 1, '#2a2e34');
    P.px(7, 6, '#1a1a1a'); P.px(9, 6, '#1a1a1a'); P.px(8, 8, '#1a1a1a');     // hazard mark
  }),
};
for (const k in BUILD_ART) BUILD_ART[k] = dimensional(BUILD_ART[k]);
MATS.scrap = { name:'Scrap', value:2 };
ICON.scrap = dimensional(art(['..AHHA..', '.AHNNHA.', 'AHN..NHA', 'HN.KK.NH', 'HN.KK.NH', 'AHN..NHA', '.AHNNHA.', '..AHHA..']), false);

// ---- grid lookups (only the main world has structures) ----
const buildAt = (tx, ty) => (map === world ? BUILD_AT.get(bKey(tx, ty)) : null) || null;
const buildSolidAt = (tx, ty) => { const b = buildAt(tx, ty); return !!(b && BTYPE[b.id].solid); };
function addBuild(id, tx, ty, hp) {
  const t = BTYPE[id];
  const b = { structure: true, id, tx, ty, x: tx * T, y: ty * T, w: T, h: T, hp: hp ?? t.hp, max: t.hp, cd: 0, aim: 0, fireT: 0, fx: 0 };
  BUILDS.push(b); BUILD_AT.set(bKey(tx, ty), b);
  return b;
}
function removeBuild(b) {
  BUILDS = BUILDS.filter(o => o !== b); BUILD_AT.delete(bKey(b.tx, b.ty));
}
function loadBuilds(list) {
  BUILDS = []; BUILD_AT = new Map(); build.on = false;
  for (const [id, tx, ty, hp] of list || []) if (BTYPE[id] && world[ty] && !SOLID.has(world[ty][tx])) addBuild(id, tx, ty, hp);
}
const saveBuilds = () => BUILDS.map(b => [b.id, b.tx, b.ty, Math.round(b.hp)]);

// ---- build mode ----
function toggleBuild() {
  if (!inWorld()) { msg('You can only build in the main world.', '#ff9090'); return sfx('no'); }
  build.on = !build.on;
  if (build.on && p.auto) toggleAuto();
  msg(build.on ? 'BUILD MODE: ON' : 'BUILD MODE: OFF', build.on ? '#58e858' : '#a0a0b0'); sfx('menu');
}
function buildCursor() {
  if (build.mouseT > 0 && build.mouse) return [Math.floor(build.mouse.x / T), Math.floor(build.mouse.y / T)];
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, 1];
  return [Math.floor((p.x + 6) / T) + dx, Math.floor((p.y + 6) / T) + dy];
}
const boxHit = (o, tx, ty) => o.x < (tx + 1) * T && o.x + o.w > tx * T && o.y < (ty + 1) * T && o.y + o.h > ty * T;
// why a structure can't go here ('' = it can)
function buildProblem(tx, ty, t = BUILD_TYPES[build.sel]) {
  if (!inWorld()) return 'Only in the main world';
  if (tx < 1 || ty < 1 || tx >= WW - 1 || ty >= WH - 1) return 'Out of bounds';
  if (Math.max(Math.abs(tx - Math.floor((p.x + 6) / T)), Math.abs(ty - Math.floor((p.y + 6) / T))) > BUILD_RANGE) return 'Too far away';
  const ch = world[ty][tx];
  if (SOLID.has(ch) || BUILD_BAN.has(ch) || buildAt(tx, ty)) return 'Blocked';
  if (t.solid) {
    if (boxHit(p, tx, ty)) return 'You are standing there';
    if (enemies.some(e => !e.dead && boxHit(e, tx, ty)) || NPCS.some(n => boxHit(n, tx, ty)) || bots.some(b => botAlive(b) && boxHit(b, tx, ty))) return 'Someone is in the way';
    if (typeof tankBlocks === 'function' && tankBlocks(tx * T, ty * T, T, T)) return 'Someone is in the way';
  }
  if (BUILDS.length >= BUILD_MAX) return 'Build limit reached';
  if (t.id === 'sentry' && BUILDS.filter(b => b.id === 'sentry').length >= SENTRY_MAX) return 'Sentry limit reached';
  if ((p.scrap || 0) < t.cost[0]) return 'Not enough scrap';
  if (p.gold < t.cost[1]) return 'Not enough gold';
  return '';
}
function buildNote(s, c = '#ff9090') { build.note = s; build.noteC = c; build.noteT = 90; }
function placeBuild() {
  const [tx, ty] = buildCursor(), t = BUILD_TYPES[build.sel], why = buildProblem(tx, ty, t);
  if (why) { buildNote(why); return sfx('no'); }
  p.scrap -= t.cost[0]; p.gold -= t.cost[1];
  addBuild(t.id, tx, ty);
  burst(tx * T + 8, ty * T + 12, '#c8b080', 10); sfx('item');
  float(tx * T + 8, ty * T - 4, t.name, '#9ad868');
}
function demolishBuild() {
  const [tx, ty] = buildCursor(), b = buildAt(tx, ty);
  if (!b) { buildNote('Nothing to remove here'); return sfx('no'); }
  const t = BTYPE[b.id], back = [Math.floor(t.cost[0] / 2), Math.floor(t.cost[1] / 2)];
  p.scrap = (p.scrap || 0) + back[0]; p.gold += back[1];
  removeBuild(b); burst(tx * T + 8, ty * T + 8, '#9a9aac', 10); sfx('coin');
  float(tx * T + 8, ty * T - 4, `+${back[0]} SCRAP +${back[1]}G`, '#c8c8b0');
}
// returns true when build mode used the key
function buildInput(code) {
  if (!build.on) return false;
  const n = /^Digit([1-9])$/.exec(code);
  if (n) { build.sel = Math.min(BUILD_TYPES.length - 1, +n[1] - 1); sfx('menu'); return true; }
  if (code === 'KeyQ') { build.sel = (build.sel + BUILD_TYPES.length - 1) % BUILD_TYPES.length; sfx('menu'); return true; }
  if (code === 'KeyE') { build.sel = (build.sel + 1) % BUILD_TYPES.length; sfx('menu'); return true; }
  if (code === 'Space' || code === 'Enter' || code === 'KeyJ') { build.mouseT = 0; placeBuild(); return true; }
  if (code === 'KeyX' || code === 'Delete' || code === 'Backspace') { build.mouseT = 0; demolishBuild(); return true; }
  if (code === 'KeyB' || code === 'Escape') { toggleBuild(); return true; }
  return false;
}
// mouse: the cursor follows the pointer; left click builds, right click removes, wheel picks
function pointerWorld(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * VW + Math.round(camx), y: (e.clientY - r.top) / r.height * VH + Math.round(camy) };
}
cv.addEventListener('pointermove', e => { if (build.on) { build.mouse = pointerWorld(e); build.mouseT = 240; } });
cv.addEventListener('pointerdown', e => {
  if (!build.on || mode !== 'play') return;
  build.mouse = pointerWorld(e); build.mouseT = 240;
  if (e.button === 2) demolishBuild(); else if (e.button === 0) placeBuild();
});
cv.addEventListener('contextmenu', e => { if (build.on) e.preventDefault(); });
cv.addEventListener('wheel', e => {
  if (!build.on || mode !== 'play') return;
  e.preventDefault();
  build.sel = (build.sel + (e.deltaY > 0 ? 1 : BUILD_TYPES.length - 1)) % BUILD_TYPES.length; sfx('menu');
}, { passive: false });

// ---- effects on zombies and the player ----
// movement multiplier for an enemy standing on (tx, ty): sandbags and wire slow, acid slows
function buildSlow(e, tile) {
  let m = e.acidT > 0 ? 0.5 : 1;
  const b = buildAt(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h / 2) / T));
  if (b) m *= b.id === 'wire' ? 0.5 : b.id === 'sandbag' ? 0.6 : 1;
  return m;
}
// sandbag cover: 30% less damage while one is next to you
function coverMul() {
  if (!inWorld() || !BUILDS.length) return 1;
  const tx = Math.floor((p.x + 6) / T), ty = Math.floor((p.y + 6) / T);
  for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) { const b = buildAt(x, y); if (b && b.id === 'sandbag') return 0.7; }
  return 1;
}
function buildHurtEnemy(e, dmg, col) {
  if (e.dead || e.d.dummy) return;
  dmg = Math.max(1, Math.round(dmg * nightTaken(e)) - Math.floor(e.d.def / 2));
  e.hp -= dmg; e.flash = 6;
  float(e.x + e.w / 2, e.y - 2, String(dmg), col);
  if (e.hp <= 0) { if (e.d.boss) killEnemy(e); else { e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, '#a01818', 10); } }
}
const nearCenter = (e, b, r) => Math.hypot(e.x + e.w / 2 - (b.x + 8), e.y + e.h / 2 - (b.y + 8)) < r;

// ---- scrap piles lying around the map (outside the base, farm and field) ----
function spawnScrapPile() {
  for (let i = 0; i < 20; i++) {
    const tx = ri(44, WW - 3), ty = ri(2, WH - 3), ch = world[ty][tx];
    if (SOLID.has(ch) || BUILD_BAN.has(ch) || ch === '~' || safeAt(tx * T, ty * T)) continue;
    pickups.push({ kind: 'scrap', amt: ri(3, 6), pile: true, x: tx * T + 8, y: ty * T + 8, vx: 0, vy: 0, t: 0, life: 1e9 });
    return;
  }
}

// ---- per-frame update (from update() in gameplay.js) ----
function updateBuilds() {
  if (build.noteT > 0) build.noteT--;
  if (build.mouseT > 0) build.mouseT--;
  if (!inWorld()) { build.on = false; return; }
  if (frame % 300 === 0 && pickups.filter(pk => pk.pile).length < 14) spawnScrapPile();
  for (const e of enemies) if (e.acidT > 0) e.acidT--;
  const dead = [];
  for (const b of BUILDS) {
    if (b.fireT > 0) b.fireT--;
    if (b.cd > 0) b.cd--;
    const bx = b.x + 8, by = b.y + 8;
    if (b.id === 'sentry') {
      let best = null, bd = 150;
      for (const e of enemies) {
        if (e.dead || e.d.dummy) continue;
        const d = Math.hypot(e.x + e.w / 2 - bx, e.y + e.h / 2 - by);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        const want = Math.atan2(best.y + best.h / 2 - by, best.x + best.w / 2 - bx);
        let da = want - b.aim; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
        b.aim += clamp(da, -0.18, 0.18);
        if (b.cd <= 0 && Math.abs(da) < 0.3) {
          b.cd = 9; b.fireT = 5;
          guardShots.push({ x: bx + Math.cos(b.aim) * 10, y: b.y + 3 + Math.sin(b.aim) * 10, e: best, life: 60, dmg: Math.round(guardDmg('heavy') * 1.3), fx: 'heavy' });
          if (Math.hypot(bx - p.x, by - p.y) < 220 && frame % 2 === 0) sfx('heavy_mg');
        }
      } else b.aim += 0.01;                                   // idle sweep
    } else if (b.id === 'flame' || b.id === 'acid') {
      const r = 26, near = enemies.filter(e => !e.dead && !e.d.dummy && nearCenter(e, b, r));
      b.fx = near.length ? 30 : Math.max(0, b.fx - 1);
      if (near.length && b.cd <= 0) {
        b.cd = b.id === 'flame' ? 12 : 20;
        for (const e of near) {
          if (b.id === 'flame') buildHurtEnemy(e, 6 + p.lvl * 2, '#ff9040');
          else { buildHurtEnemy(e, 4 + p.lvl * 1.5, '#a0ff60'); e.acidT = 90; }
        }
      }
      if (b.fx > 0 && frame % 2 === 0) for (let i = 0; i < 3; i++) {
        const a = R() * 6.28, s = 0.6 + R() * 1.4;
        parts.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.4, t: 14,
          c: b.id === 'flame' ? (i ? '#ff8020' : '#ffe060') : (i ? '#70e030' : '#c0ff80') });
      }
    } else if (b.id === 'wire' && frame % 40 === 0) {
      for (const e of enemies) if (!e.dead && !e.d.dummy && boxHit(e, b.tx, b.ty)) {
        buildHurtEnemy(e, Math.max(2, e.d.hp * (e.d.boss ? 0.01 : 0.06)), '#ff5050');
        burst(e.x + e.w / 2, e.y + e.h, '#a01818', 3); b.hp -= 3;
      }
    } else if (b.id === 'ammo' && b.cd <= 0 && mode === 'play' && Math.hypot(p.x + 6 - bx, p.y + 6 - by) < 26 && p.ammo < maxAmmo(p.weapon)) {
      p.ammo = maxAmmo(p.weapon); p.reloadT = 0; b.cd = 45;
      float(p.x + 6, p.y - 12, 'AMMO FULL!', '#f8c838'); sfx('item');
    }
    // zombies chew on whatever they touch
    if (frame % 30 === 0) for (const e of enemies) {
      if (e.dead || e.d.dummy || e.frozen > 0) continue;
      if (e.x - 3 < b.x + T && e.x + e.w + 3 > b.x && e.y - 3 < b.y + T && e.y + e.h + 3 > b.y) {
        if (e.horde) { e.noProg = 0; e.ghostT = 0; }          // the horde has to break it, not phase through it
        const dmg = Math.max(1, Math.round(e.d.atk * (e.d.boss ? 2 : 0.8) * nightAtk()));
        b.hp -= dmg; b.hitT = 8;
        if (Math.hypot(bx - p.x, by - p.y) < 260) float(bx, b.y - 6, '-' + dmg, '#ffb080');
      }
    }
    if (b.hitT > 0) b.hitT--;
    if (b.hp <= 0) dead.push(b);
  }
  for (const b of dead) {
    removeBuild(b); burst(b.x + 8, b.y + 8, '#c8a070', 18); addShake(2);
    if (Math.hypot(b.x - p.x, b.y - p.y) < 300) { msg(`${BTYPE[b.id].name} destroyed!`, '#ff9060'); sfx('boom'); }
  }
}

// ---- drawing ----
function drawBuildFloor(cx, cy) {                                       // flat structures, under everyone
  for (const b of BUILDS) {
    if (!BTYPE[b.id].floor || b.x + T < cx || b.x > cx + VW || b.y + T < cy || b.y > cy + VH) continue;
    drawSprite(b.hitT > 0 && b.hitT % 4 < 2 ? whiteOf(BUILD_ART[b.id]) : BUILD_ART[b.id], b.x - cx, b.y - cy, false);
    if (b.id === 'flame' && Math.floor(frame / 4) % 2) for (const x of [4, 8, 12]) { ctx.fillStyle = '#ffd040'; ctx.fillRect(b.x + x - cx, b.y + 7 - cy, 1, 1); }
    buildHpBar(b, cx, cy, 0);
  }
}
const buildsInView = (cx, cy) => BUILDS.filter(b => !BTYPE[b.id].floor && b.x + T > cx - 16 && b.x < cx + VW + 16 && b.y + T > cy - 24 && b.y < cy + VH + 16);
function drawStructure(b, cx, cy) {                                     // y-sorted with the actors
  const img = BUILD_ART[b.id], x = b.x - cx, y = b.y - cy;
  const tall = img.height - 2 > T ? img.height - 2 - T : 0;
  drawSprite(b.hitT > 0 && b.hitT % 4 < 2 ? whiteOf(img) : img, x, y - tall, false);
  if (b.id === 'sentry') {                                              // rotating gun head
    ctx.save(); ctx.translate(Math.round(x + 8), Math.round(y - tall + 9)); ctx.rotate(b.aim);
    ctx.fillStyle = '#1a1e14'; ctx.fillRect(-4, -3, 8, 6);
    ctx.fillStyle = '#5a6a42'; ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = '#2a2e34'; ctx.fillRect(3, -1, 9, 2);
    ctx.fillStyle = '#8a929e'; ctx.fillRect(3, -1, 9, 1);
    if (b.fireT > 2) { ctx.fillStyle = '#fff6a0'; ctx.fillRect(12, -2, 3, 4); ctx.fillStyle = '#ff9020'; ctx.fillRect(15, -1, 2, 2); }
    ctx.restore();
  }
  buildHpBar(b, cx, cy, tall);
}
function buildHpBar(b, cx, cy, tall) {
  if (b.hp < b.max) bar(Math.round(b.x - cx + 2), Math.round(b.y - cy - tall - 4), 12, 2, b.hp / b.max, '#58d858', '#203820');
}
// searchlights: warm pools of light plus a slow sweeping beam, added on top of the night tint
function drawBuildLights(cx, cy, k) {
  ctx.globalCompositeOperation = 'lighter';
  for (const b of BUILDS) {
    if (b.id !== 'light') continue;
    const x = b.x + 8 - cx, y = b.y - 2 - cy;
    if (x < -150 || x > VW + 150 || y < -150 || y > VH + 150) continue;
    let g = ctx.createRadialGradient(x, y + 10, 4, x, y + 10, 80);
    g.addColorStop(0, `rgba(255,240,190,${0.38 * k})`); g.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y + 10, 80, 0, 6.28); ctx.fill();
    const a = frame * 0.012 + b.tx, L = 150;
    g = ctx.createRadialGradient(x, y, 2, x, y, L);
    g.addColorStop(0, `rgba(255,250,220,${0.42 * k})`); g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.arc(x, y, L, a - 0.22, a + 0.22); ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}
// grid + ghost of the selected structure at the cursor
function drawBuildCursor(cx, cy) {
  if (!build.on || mode !== 'play') return;
  const ptx = Math.floor((p.x + 6) / T), pty = Math.floor((p.y + 6) / T);
  ctx.fillStyle = 'rgba(120,255,140,.07)';
  ctx.fillRect((ptx - BUILD_RANGE) * T - cx, (pty - BUILD_RANGE) * T - cy, (BUILD_RANGE * 2 + 1) * T, (BUILD_RANGE * 2 + 1) * T);
  ctx.fillStyle = 'rgba(120,255,140,.16)';
  for (let i = -BUILD_RANGE; i <= BUILD_RANGE + 1; i++) {
    ctx.fillRect((ptx + i) * T - cx, (pty - BUILD_RANGE) * T - cy, 1, (BUILD_RANGE * 2 + 1) * T);
    ctx.fillRect((ptx - BUILD_RANGE) * T - cx, (pty + i) * T - cy, (BUILD_RANGE * 2 + 1) * T, 1);
  }
  const [tx, ty] = buildCursor(), t = BUILD_TYPES[build.sel], ok = !buildProblem(tx, ty, t), x = tx * T - cx, y = ty * T - cy;
  const img = BUILD_ART[t.id], tall = img.height - 2 > T ? img.height - 2 - T : 0;
  ctx.globalAlpha = 0.6; drawSprite(img, x, y - tall, false); ctx.globalAlpha = 1;
  ctx.fillStyle = ok ? 'rgba(80,255,110,.3)' : 'rgba(255,60,60,.35)'; ctx.fillRect(x, y, T, T);
  ctx.strokeStyle = ok ? '#58ff70' : '#ff4040'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
  const b = buildAt(tx, ty);
  if (b) text('X: REMOVE', x + 8, y - tall - 12, '#ffb080', 'center');
}
// the build bar (screen space, above the hotbar); sized to the screen, text wrapped to fit
function drawBuildUI() {
  if (!build.on || mode !== 'play') return;
  const n = BUILD_TYPES.length, w = Math.min(VW - 8, 420), sw = Math.min(30, Math.floor((w - 12) / n)), cols = Math.floor((w - 12) / 8);
  const t = BUILD_TYPES[build.sel], info = build.noteT > 0 ? [build.note] : wrap(t.desc, cols).slice(0, 2);
  const h = 54 + info.length * 11, x0 = Math.round(VW / 2 - w / 2), y0 = VH - 44 - h;
  const hint = wrap('1-9 Q E: PICK · SPACE/CLICK: BUILD · X/RIGHT-CLICK: REMOVE · B: EXIT', cols);
  hint.forEach((l, i) => text(l, VW / 2, y0 - 11 * (hint.length - i), '#9ad868', 'center'));
  panel(x0, y0, w, h, '#58e858', 0.9);
  text('BUILD MODE', x0 + 6, y0 + 4, '#58e858');
  ctx.drawImage(ICON.scrap, x0 + w - 6 - textW(`${p.scrap || 0}  ${p.gold}G`) - 18, y0 + 1);
  text(`${p.scrap || 0}  ${p.gold}G`, x0 + w - 6, y0 + 4, '#c8c8b0', 'right');
  const bx = Math.round(x0 + w / 2 - n * sw / 2);
  BUILD_TYPES.forEach((bt, i) => {
    const sx = bx + i * sw, sy = y0 + 15, sel = i === build.sel, afford = (p.scrap || 0) >= bt.cost[0] && p.gold >= bt.cost[1];
    ctx.fillStyle = sel ? '#58e858' : '#3c4430'; ctx.fillRect(sx, sy, sw - 2, sw - 2);
    ctx.fillStyle = sel ? '#1a3a20' : '#14180e'; ctx.fillRect(sx + 1, sy + 1, sw - 4, sw - 4);
    const img = BUILD_ART[bt.id], s = Math.min(1, (sw - 6) / img.height);
    ctx.globalAlpha = afford ? 1 : 0.4;
    ctx.drawImage(img, Math.round(sx + (sw - 2) / 2 - img.width * s / 2), Math.round(sy + (sw - 2) / 2 - img.height * s / 2), Math.round(img.width * s), Math.round(img.height * s));
    ctx.globalAlpha = 1;
    text(String(i + 1), sx + 2, sy + 1, sel ? '#ffffff' : '#9a9a78');
  });
  const ly = y0 + 17 + sw;
  text(t.name, x0 + 6, ly, GOLD);
  const gs = `${t.cost[1]}G`, ss = `${t.cost[0]} SCRAP`;
  text(gs, x0 + w - 6, ly, p.gold >= t.cost[1] ? GOLD : '#ff7060', 'right');
  text(ss, x0 + w - 14 - textW(gs), ly, (p.scrap || 0) >= t.cost[0] ? '#d0d0e0' : '#ff7060', 'right');
  info.forEach((l, i) => text(l, x0 + w / 2, ly + 13 + i * 11, build.noteT > 0 ? build.noteC : '#b0b49a', 'center'));
}
