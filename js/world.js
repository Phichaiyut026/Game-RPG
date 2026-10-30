// ================= Overworld Map & Dungeon =================
let map = Array.from({ length: MH }, () => Array(MW).fill('.'));
const world = map;
(function gen() {
  let seed = 7;
  const sr = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < MW && y < MH) map[y][x] = c; };
  const disc = (cx, cy, r, c) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1) set(x, y, c); };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    let c = '.';
    if (x >= 26 && x < 48) { const r = sr(); c = r < 0.07 ? 'T' : r < 0.13 ? 'f' : '.'; }
    else if (x >= 48 && x < 68) c = sr() < 0.42 ? 'P' : ',';
    else if (x >= 68) { const r = sr(); c = r < 0.05 ? '#' : r < 0.09 ? 'r' : 's'; }
    map[y][x] = c;
  }
  disc(36, 11, 3, '~'); disc(32, 38, 2, '~');
  for (let i = 0; i < 10; i++) {                                    // carve forest trails
    let x = 49 + Math.floor(sr() * 18), y = 3 + Math.floor(sr() * 44);
    for (let s = 0; s < 140; s++) {
      disc(x, y, 1, ',');
      const d = Math.floor(sr() * 4); x = clamp(x + [1,-1,0,0][d], 49, 66); y = clamp(y + [0,0,1,-1][d], 3, MH - 4);
    }
  }
  [[54,12],[60,36],[63,20]].forEach(([x, y]) => disc(x, y, 3, ','));
  for (let y = 25; y <= 36; y++) { set(60, y, ','); set(61, y, ','); }   // southern trail to Emberfall portal
  // secret grove: a walled ring of pines in the far north of the forest. A faint trail runs up from
  // the road and dead-ends at (63,6), a fake pine you can walk through. The secret chest sits inside.
  for (let y = 2; y <= 7; y++) for (let x = 60; x <= 66; x++) set(x, y, 'P');
  for (let y = 3; y <= 5; y++) for (let x = 61; x <= 65; x++) set(x, y, ',');
  for (let y = 7; y <= 23; y++) set(63, y, ',');
  set(63, 6, 'Q'); set(63, 4, 'K');
  const room = (x0, y0, w, h) => {
    for (let x = x0; x < x0 + w; x++) { if (sr() < 0.8) set(x, y0, '#'); if (sr() < 0.8) set(x, y0 + h - 1, '#'); }
    for (let y = y0; y < y0 + h; y++) { if (sr() < 0.8) set(x0, y, '#'); if (sr() < 0.8) set(x0 + w - 1, y, '#'); }
  };
  room(71, 5, 8, 7); room(72, 36, 9, 8); room(78, 13, 6, 5);
  disc(80, 25, 5, 's');
  disc(74, 18, 2, 's'); set(74, 18, 'E');               // crypt entrance
  const riverX = y => 46 + Math.round(Math.sin(y * 0.25));
  for (let y = 0; y < MH; y++) { set(riverX(y), y, '~'); set(riverX(y) + 1, y, '~'); }
  for (let x = 2; x < MW - 1; x++) for (const y of [24, 25]) set(x, y, map[y][x] === '~' ? 'b' : '=');
  for (const by of [8, 41]) { const rx = riverX(by); set(rx, by, 'b'); set(rx + 1, by, 'b'); set(rx - 1, by, '.'); set(rx + 2, by, ','); set(rx + 3, by, ','); }

  // ================= Expanded Fortified Village (x: 1..25, y: 8..41) =================
  // Central stone plaza & N-S / E-W avenues
  for (let y = 21; y <= 28; y++) for (let x = 9; x <= 16; x++) set(x, y, 's');
  for (let y = 6; y <= 43; y++) for (const x of [12, 13]) set(x, y, '=');
  for (let x = 2; x <= 25; x++) for (const y of [24, 25]) set(x, y, '=');
  // Fortress perimeter walls (M) & Gatehouse / Watchtowers (G)
  for (let x = 1; x <= 25; x++) {
    if (x !== 12 && x !== 13) { set(x, 8, 'M'); set(x, 41, 'M'); }
  }
  for (let y = 8; y <= 41; y++) {
    set(1, y, 'M');
    if (y !== 24 && y !== 25) set(25, y, 'M');
  }
  // Watchtowers & Gate Bastions
  for (const gx of [1, 6, 11, 14, 19, 25]) { set(gx, 8, 'G'); set(gx, 41, 'G'); }
  for (const gy of [16, 24, 25, 33]) set(1, gy, 'G');
  for (const gy of [14, 22, 23, 26, 27, 34]) set(25, gy, 'G');
  // 8 Village houses across 4 districts
  const house = (x, y) => { for (let i = 0; i < 5; i++) { set(x + i, y, 'R'); set(x + i, y + 1, 'R'); set(x + i, y + 2, ['W','w','D','w','W'][i]); } };
  house(3, 11); house(3, 16); house(17, 11); house(17, 16);
  house(3, 29); house(3, 34); house(17, 29); house(17, 34);
  // Inner courtyard fences, town well, stash chest, and flower gardens
  for (const x of [3, 4, 8, 9, 16, 17, 21, 22]) { set(x, 20, 'F'); set(x, 28, 'F'); }
  set(15, 21, 'O'); set(9, 22, 'S'); set(10, 16, 'V');
  [[5,14],[19,14],[5,19],[19,19],[5,32],[19,32],[5,37],[19,37],[9,21],[16,21],[9,28],[15,28]].forEach(([x, y]) => set(x, y, 'f'));

  for (let x = 0; x < MW; x++) { const c = x < 48 ? 'T' : x < 68 ? 'P' : '#'; set(x, 0, c); set(x, MH - 1, c); }
  for (let y = 0; y < MH; y++) { set(0, y, 'T'); set(MW - 1, y, '#'); }
})();
const solidAt = (tx, ty) => tx < 0 || ty < 0 || tx >= MW || ty >= MH || SOLID.has(map[ty][tx]);
function blocked(x, y, w, h, isEnemy) {
  const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 1) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty) || (isEnemy && inWorld() && tx <= 25)) return true;
  return false;
}
function move(o, dx, dy, isEnemy) {
  if (dx) {
    if (!blocked(o.x + dx, o.y, o.w, o.h, isEnemy)) o.x += dx;
    else if (!isEnemy && !dy) {                       // slide around corners
      for (const n of [1, -1]) for (let k = 1; k <= 6; k++) if (!blocked(o.x + dx, o.y + n * k, o.w, o.h)) { o.y += n; return; }
    }
  }
  if (dy) {
    if (!blocked(o.x, o.y + dy, o.w, o.h, isEnemy)) o.y += dy;
    else if (!isEnemy && !dx) {
      for (const n of [1, -1]) for (let k = 1; k <= 6; k++) if (!blocked(o.x + n * k, o.y + dy, o.w, o.h)) { o.x += n; return; }
    }
  }
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ================= Dungeon (Crypt beneath the ruins) & Colosseum Arena =================
let dungeon = 0, arena = 0, arenaWait = 0, rift = 0, riftMod = null, riftReturn = null, worldState = null, dungeonReturn = null, torches = [], eprojs = [];
const FLOOR_MOBS = { 1: ['spider', 'spider', 'cultist'], 2: ['spider', 'cultist', 'bknight'], 3: ['bknight', 'cultist', 'spider', 'bknight'] };
const RIFT_MODS = [
  { id: 'surge', name: 'Void Surge', desc: '+25% Foe Speed, +35% Gold', col: '#ff9040', foeSpd: 1.25, gold: 35 },
  { id: 'greed', name: 'Abyssal Greed', desc: '+50% Chest Loot, +25% Foe ATK', col: '#ffd838', foeAtk: 1.25, loot: 50 },
  { id: 'fortitude', name: 'Cosmic Fortitude', desc: '+35% Foe HP, +50% XP Gain', col: '#60e8ff', foeHp: 1.35, xp: 50 },
  { id: 'flux', name: 'Chrono Flux', desc: '-25% Skill Cooldown, +15% Move Speed', col: '#c080ff', playerCdr: 25, playerSpd: 15 },
  { id: 'blood', name: 'Blood Curse', desc: 'All hits grant 8% Lifesteal', col: '#ff6070', lifesteal: 8 },
  { id: 'frenzy', name: 'Void Frenzy', desc: '+15% Crit Rate, +50% Crit Damage', col: '#f8c838', crit: 15, critDmg: 50 }
];
function genDungeon(floor) {
  const w = 48, h = 36, m = Array.from({ length: h }, () => Array(w).fill('X')), rooms = [];
  for (let i = 0; i < 300 && rooms.length < 9; i++) {
    const rw = ri(6, 10), rh = ri(5, 8), x = ri(2, w - rw - 2), y = ri(2, h - rh - 2);
    if (rooms.some(r => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y)) continue;
    rooms.push({ x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1) });
  }
  rooms.sort((a, b) => a.cx - b.cx);
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) m[y][x] = 'd';
  const dig = (x, y) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && m[y][x] === 'X') m[y][x] = 'd'; };
  for (let i = 1; i < rooms.length; i++) {                 // 2-wide L-shaped corridors
    const a = rooms[i - 1], b = rooms[i];
    for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx) + 1; x++) { dig(x, a.cy); dig(x, a.cy + 1); }
    for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy) + 1; y++) { dig(b.cx, y); dig(b.cx + 1, y); }
  }
  const tl = [];
  for (const r of rooms) for (const x of [r.x + 1, r.x + r.w - 2]) if (m[r.y - 1][x] === 'X') { m[r.y - 1][x] = 'L'; tl.push({ x: x * T + 8, y: r.y * T }); }
  const start = rooms[0], end = rooms[rooms.length - 1], scale = 1 + 0.15 * (floor - 1), es = [];
  m[start.cy][start.cx] = '<';
  const mid = rooms.slice(1, -1).sort(() => R() - 0.5);
  for (const r of mid.slice(0, floor === 3 ? 3 : 2)) m[r.y + 1][r.x + 1] = 'C';
  if (mid.length) { const sr = mid[mid.length - 1]; m[sr.cy][sr.cx] = 'A'; tl.push({ x: sr.cx * T + 8, y: sr.cy * T + 8 }); }
  const place = (type, r) => es.push(mkEnemy(type, ri(r.x + 1, r.x + r.w - 2) * T + 2, ri(r.y + 1, r.y + r.h - 2) * T + 2, 'crypt', scale));
  for (const r of rooms.slice(1)) {
    const pool = FLOOR_MOBS[floor];
    for (let i = 0, n = ri(2, 3) + (floor > 1 ? 1 : 0); i < n; i++) place(pool[ri(0, pool.length - 1)], r);
  }
  if (floor < 3) m[end.cy][end.cx] = '>';
  else es.push(mkEnemy('lich', end.cx * T - 4, end.cy * T - 4, 'crypt'));
  return { m, w, h, sx: start.cx * T + 2, sy: (start.cy + 1) * T + 2, es, tl };
}
function enterDungeon(floor) {
  if (!dungeon) { worldState = { enemies, pickups }; dungeonReturn = { x: p.x, y: p.y + 20 }; }
  dungeon = floor;
  const g = genDungeon(floor);
  map = g.m; MW = g.w; MH = g.h; enemies = g.es; torches = g.tl; pickups = []; projs = []; eprojs = [];
  p.x = g.sx; p.y = g.sy; p.stairCD = 40; p.target = null;
  camx = p.x - VW / 2; camy = p.y - VH / 2;
  zoneName = zoneAt(p.x); banner = { txt: zoneName, t: 150 }; sfx('stairs');
  if (floor === 1) msg('A cold wind rises from below... (LV 8+ advised)', '#c0a0ff');
  if (floor === 3) msg('You feel a terrible presence on this floor.', '#ff8080');
}
function exitDungeon() {
  dungeon = 0; map = world; MW = WW; MH = WH; torches = []; projs = []; eprojs = [];
  ({ enemies, pickups } = worldState); worldState = null;
  p.x = dungeonReturn.x; p.y = dungeonReturn.y; p.stairCD = 40; p.target = null;
  zoneName = zoneAt(p.x); banner = { txt: zoneName, t: 150 };
}
function genArena() {
  const w = 28, h = 22, cx = 14, cy = 11, m = Array.from({ length: h }, () => Array(w).fill('X')), tl = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const d2 = ((x - cx) / 11.5) ** 2 + ((y - cy) / 8.5) ** 2;
    if (d2 <= 1.0) m[y][x] = d2 > 0.78 ? 's' : '=';
    else if (d2 <= 1.24) m[y][x] = 'M';
  }
  for (const [tx, ty] of [[8, 4], [19, 4], [4, 10], [23, 10], [8, 17], [19, 17]]) {
    m[ty][tx] = 'G'; tl.push({ x: tx * T + 8, y: ty * T + 8 });
  }
  m[cy][cx - 4] = 'G'; m[cy][cx + 4] = 'G';
  m[17][cx] = '<';
  return { m, w, h, sx: cx * T + 2, sy: 15 * T + 2, tl };
}
function enterArena() {
  if (inWorld()) { worldState = { enemies, pickups }; dungeonReturn = { x: p.x, y: p.y + 12 }; }
  arena = 1; arenaWait = 90;
  const g = genArena();
  map = g.m; MW = g.w; MH = g.h; enemies = []; torches = g.tl; pickups = []; projs = []; eprojs = [];
  p.x = g.sx; p.y = g.sy; p.stairCD = 45; p.target = null;
  camx = p.x - VW / 2; camy = p.y - VH / 2;
  zoneName = zoneAt(p.x); banner = { txt: 'Colosseum Arena!', t: 150 }; sfx('stairs');
  msg('Welcome to the Colosseum! Survive Endless Waves! Step on < to leave.', '#ffd838');
}
function leaveArena() {
  arena = 0; arenaWait = 0; map = world; MW = WW; MH = WH; torches = []; projs = []; eprojs = [];
  ({ enemies, pickups } = worldState); worldState = null;
  p.x = dungeonReturn.x; p.y = dungeonReturn.y; p.stairCD = 40; p.target = null;
  zoneName = zoneAt(p.x); banner = { txt: zoneName, t: 150 }; sfx('stairs');
}
function genRift(depth) {
  const w = 48, h = 36, m = Array.from({ length: h }, () => Array(w).fill('U')), rooms = [];
  for (let i = 0; i < 300 && rooms.length < 10; i++) {
    const rw = ri(6, 11), rh = ri(5, 9), x = ri(2, w - rw - 2), y = ri(2, h - rh - 2);
    if (rooms.some(r => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y)) continue;
    rooms.push({ x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1) });
  }
  rooms.sort((a, b) => a.cx - b.cx);
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) m[y][x] = 'u';
  const dig = (x, y) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && m[y][x] === 'U') m[y][x] = 'u'; };
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx) + 1; x++) { dig(x, a.cy); dig(x, a.cy + 1); }
    for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy) + 1; y++) { dig(b.cx, y); dig(b.cx + 1, y); }
  }
  const tl = [];
  for (const r of rooms) for (const x of [r.x + 1, r.x + r.w - 2]) if (m[r.y - 1][x] === 'U') { m[r.y - 1][x] = 'L'; tl.push({ x: x * T + 8, y: r.y * T }); }
  const start = rooms[0], end = rooms[rooms.length - 1];
  const scale = 1 + (depth - 1) * 0.16 + Math.floor(depth / 5) * 0.2;
  const es = [];
  m[start.cy][start.cx] = '<';
  const mid = rooms.slice(1, -1).sort(() => R() - 0.5);
  for (const r of mid.slice(0, Math.min(3, mid.length))) m[r.y + 1][r.x + 1] = 'C';
  if (mid.length) { const sr = mid[mid.length - 1]; m[sr.cy][sr.cx] = 'A'; tl.push({ x: sr.cx * T + 8, y: sr.cy * T + 8 }); }

  const pool = depth <= 4 ? ['slime', 'goblin', 'wolf', 'skel', 'spider']
             : depth <= 8 ? ['skel', 'spider', 'bknight', 'cultist', 'icewolf']
             : depth <= 12 ? ['bknight', 'cultist', 'icewolf', 'yeti', 'fireimp', 'magmaslime']
             : ['cultist', 'bknight', 'yeti', 'fireimp', 'lavagolem'];

  const place = (type, r) => es.push(mkEnemy(type, ri(r.x + 1, r.x + r.w - 2) * T + 2, ri(r.y + 1, r.y + r.h - 2) * T + 2, 'rift', scale));
  for (const r of rooms.slice(1)) {
    const numFoes = ri(2, 3) + (depth >= 6 ? 1 : 0);
    for (let i = 0; i < numFoes; i++) place(pool[ri(0, pool.length - 1)], r);
  }

  m[end.cy][end.cx] = '>';
  // Boss on every 5th depth!
  if (depth % 5 === 0) {
    const bosses = ['orc', 'lich', 'frostwyrm', 'infernal'];
    const bType = bosses[Math.min(bosses.length - 1, Math.floor(depth / 5) - 1)];
    const boss = mkEnemy(bType, end.cx * T - 4, end.cy * T - 4, 'rift', scale * 1.25);
    boss.d.hp = Math.round(boss.d.hp * scale * 1.15);
    boss.d.atk = Math.round(boss.d.atk * Math.sqrt(scale));
    boss.abyssal = true;
    es.push(boss);
  }

  return { m, w, h, sx: start.cx * T + 2, sy: (start.cy + 1) * T + 2, es, tl };
}
function enterRift(depth) {
  if (inWorld()) { worldState = { enemies, pickups }; riftReturn = { x: p.x, y: p.y + 16 }; }
  p.stats = p.stats || {};
  p.stats.riftsEntered = (p.stats.riftsEntered || 0) + 1;
  p.bestRift = Math.max(p.bestRift || 0, depth);
  rift = depth;
  riftMod = RIFT_MODS[(depth - 1 + ri(0, RIFT_MODS.length - 1)) % RIFT_MODS.length];
  const g = genRift(depth);
  map = g.m; MW = g.w; MH = g.h; enemies = g.es; torches = g.tl; pickups = []; projs = []; eprojs = [];
  p.x = g.sx; p.y = g.sy; p.stairCD = 45; p.target = null;
  camx = p.x - VW / 2; camy = p.y - VH / 2;
  zoneName = 'Abyssal Rift D' + depth;
  banner = { txt: 'Abyssal Rift - Depth ' + depth, t: 150 }; sfx('stairs');
  msg(`Rift Depth ${depth}! Modifier: ${riftMod.name} (${riftMod.desc})`, riftMod.col);
  if (depth % 5 === 0) msg('A terrifying Abyssal Guardian guards this depth!', '#ff5050');
  checkAchievements();
  save();
}
function exitRift() {
  rift = 0; riftMod = null; map = world; MW = WW; MH = WH; torches = []; projs = []; eprojs = [];
  if (worldState) { ({ enemies, pickups } = worldState); worldState = null; }
  p.x = riftReturn ? riftReturn.x : 10 * T + 2; p.y = riftReturn ? riftReturn.y : 16 * T + 2;
  p.stairCD = 40; p.target = null;
  zoneName = zoneAt(p.x); banner = { txt: zoneName, t: 150 }; sfx('stairs');
}
function nearRiftPortal() {
  if (!inWorld()) return null;
  const cx = Math.floor((p.x + 6) / T), cy = Math.floor((p.y + 6) / T);
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) if (map[y] && map[y][x] === 'V') return [x, y];
  return null;
}
function nearChest() {
  const cx = Math.floor((p.x + 6) / T), cy = Math.floor((p.y + 6) / T);
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) if (map[y] && (map[y][x] === 'C' || map[y][x] === 'K')) return [x, y];
  return null;
}
function nearStash() {
  if (!inWorld()) return null;
  const cx = Math.floor((p.x + 6) / T), cy = Math.floor((p.y + 6) / T);
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) if (map[y] && map[y][x] === 'S') return [x, y];
  return null;
}
function nearWell() {
  if (!inWorld()) return null;
  const cx = Math.floor((p.x + 6) / T), cy = Math.floor((p.y + 6) / T);
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) if (map[y] && map[y][x] === 'O') return [x, y];
  return null;
}
function nearShrine() {
  if (!dungeon && !rift) return null;
  const cx = Math.floor((p.x + 6) / T), cy = Math.floor((p.y + 6) / T);
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) if (map[y] && map[y][x] === 'A') return [x, y];
  return null;
}
function useWell([x, y]) {
  p.hp = maxHp(); p.mp = maxMp();
  burst(x * T + 8, y * T + 8, '#60c0ff', 14); sfx('potion');
  if (p.elixirT <= 0 && p.gold >= 10) {
    p.gold -= 10; p.elixirT = 1800;
    p.stats = p.stats || {}; p.stats.wellWishes = (p.stats.wellWishes || 0) + 1;
    float(p.x + 6, p.y - 10, 'BLESSED!', '#60e0ff');
    msg('Tossed 10G into the well! HP/MP full & blessed for 30s!', '#60e0ff');
    if (typeof checkAchievements === 'function') checkAchievements();
  } else {
    float(p.x + 6, p.y - 10, 'REFRESHED!', '#58d858');
    msg('Drank from the well. HP & MP fully restored!', '#60c0ff');
  }
  save();
}
function useShrine([x, y]) {
  map[y][x] = 'a'; syncMini(); miniPixel(x, y);
  p.hp = maxHp(); p.mp = maxMp();
  burst(x * T + 8, y * T + 8, '#60f0ff', 24);
  rings.push({ x: x * T + 8, y: y * T + 8, r: 4, max: 44, c: '#60f0ff', t: 18 });
  sfx('lvl');
  const roll = ri(0, 2), px = p.x + 6, py = p.y + 6;
  if (roll === 0) {
    p.buffT = 1800; p.buffMul = 1.6;
    float(px, p.y - 12, 'SHRINE!', '#ff9040');
    msg('Shrine of Fury! Full HP/MP & ATK +60% for 30s!', '#ff9040');
  } else if (roll === 1) {
    p.elixirT = 2400; p.critT = 360;
    float(px, p.y - 12, 'SHRINE!', '#d080ff');
    msg('Shrine of Valor! Full HP/MP, Elixir & 100% Crit!', '#d080ff');
  } else {
    drop(px, py, { kind:'gold', amt: ri(60, 120) * (dungeon || Math.max(1, Math.floor((rift || 0) / 3) + 1)) });
    drop(px, py, { kind:'gear', item: rollGear(Math.min(4, 1 + (dungeon || Math.max(1, Math.floor((rift || 0) / 3) + 1))), 2, true) });
    float(px, p.y - 12, 'SHRINE!', '#f8c838');
    msg('Shrine of Fortune! Full HP/MP & ancient treasure!', '#f8c838');
  }
}
function openChest([x, y]) {
  const secret = map[y][x] === 'K';
  map[y][x] = secret ? ',' : 'c'; syncMini(); miniPixel(x, y);
  const px = p.x + 6, py = p.y + 6;
  if (secret) {
    const ak = SECRET_AK();                               // straight into the bag so a reload can't lose it
    if (p.inv.length < BAG) p.inv.push(ak); else drop(px, py, { kind:'gear', item: ak });
    p.akFound = true; save();
    burst(x * T + 8, y * T + 8, '#ff9a30', 30); sfx('rare');
    banner = { txt: 'Secret found!', t: 180 }; msg('A strange weapon from another world... AK-47!', '#ff9a30');
    return;
  }
  const tier = rift ? Math.min(4, Math.floor(rift / 3) + 1) : dungeon || (region && MAPS[region].chestTier) || 1;
  const goldBonus = (rift && riftMod && riftMod.loot) ? 1.5 : 1;
  drop(px, py, { kind:'gold', amt: Math.round(ri(30, 80) * tier * goldBonus) });
  if (R() < 0.75) drop(px, py, { kind:'gear', item: rollGear(Math.min(4, 1 + tier), tier >= 2 ? 1 : 0) });
  if (R() < 0.5) drop(px, py, { kind:'potion' });
  if (R() < 0.65) drop(px, py, { kind:'use', id: ['mpot', 'elixir', 'scroll'][ri(0, 2)] });
  if (rift || R() < 0.25) drop(px, py, { kind:'mat', id:'abyssal_shard', count: ri(1, 2 + Math.floor((rift || 0) / 4)) });
  burst(x * T + 8, y * T + 8, '#f8c838', 16); sfx('chest');
}

// ---- Minimap & Fog of War ----
const MINI_COL = { '.':'#3e8a34', f:'#3e8a34', ',':'#2a5a2c', '=':'#c8a060', s:'#5c5c6c', '~':'#2a5ab8', b:'#8a5a2a',
  T:'#1e6a2a', P:'#14482a', r:'#787890', '#':'#34344a', R:'#c84a3a', W:'#d8c8a0', w:'#d8c8a0', D:'#d8c8a0', F:'#8a5a2a',
  M:'#8a90a8', G:'#d8a848', O:'#8a8a9a', S:'#60c0ff', E:'#ff60ff', Q:'#14482a', K:'#14482a', d:'#4a4858', L:'#ff9030', '<':'#a0e0ff', '>':'#ff60ff', C:'#f8c838', c:'#806020', A:'#60f0ff', a:'#506070',
  u:'#241838', U:'#5a3478', V:'#c040ff' };
let miniC = null, miniFor = null, seen = null;
function miniPixel(x, y) {
  const g = miniC.getContext('2d'), c = MINI_COL[map[y][x]];
  g.fillStyle = c || '#14121c'; g.fillRect(x, y, 1, 1);
}
function syncMini() {
  if (miniFor === map) return;
  miniFor = map; miniC = mk(); miniC.width = MW; miniC.height = MH;
  const g = miniC.getContext('2d'); g.fillStyle = '#06060c'; g.fillRect(0, 0, MW, MH);
  if (dungeon || rift) { seen = Array.from({ length: MH }, () => Array(MW).fill(false)); return; }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) miniPixel(x, y);
}
function revealAround() {
  if (!dungeon && !rift) return;
  const px = Math.floor((p.x + 6) / T), py = Math.floor((p.y + 6) / T), r = 7;
  for (let y = Math.max(0, py - r); y <= Math.min(MH - 1, py + r); y++)
    for (let x = Math.max(0, px - r); x <= Math.min(MW - 1, px + r); x++)
      if (!seen[y][x] && (x - px) ** 2 + (y - py) ** 2 <= r * r) { seen[y][x] = true; miniPixel(x, y); }
}
function drawMap(bx, by, bw, bh, scale) {
  syncMini();
  const mw = MW * scale, mh = MH * scale;
  const ox = clamp(Math.round((p.x + 6) / T * scale - bw / 2), 0, Math.max(0, mw - bw)), oy = clamp(Math.round((p.y + 6) / T * scale - bh / 2), 0, Math.max(0, mh - bh));
  const dx = bx + Math.max(0, (bw - mw) >> 1), dy = by + Math.max(0, (bh - mh) >> 1);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  ctx.fillStyle = '#06060c'; ctx.fillRect(bx, by, bw, bh);
  ctx.drawImage(miniC, dx - ox, dy - oy, mw, mh);
  const dot = (wx, wy, c, s) => { ctx.fillStyle = c; ctx.fillRect(Math.round(dx - ox + wx / T * scale - s / 2), Math.round(dy - oy + wy / T * scale - s / 2), s, s); };
  for (const e of enemies) {
    if (e.dead) continue;
    const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h / 2) / T);
    if ((dungeon || rift) && !(seen[ty] && seen[ty][tx])) continue;
    dot(e.x + e.w / 2, e.y + e.h / 2, e.d.boss ? '#ff40ff' : '#ff4040', e.d.boss ? scale + 3 : Math.max(1, scale));
  }
  if (inWorld() && typeof bots !== 'undefined') for (const b of bots) if (botAlive(b)) dot(b.x + 6, b.y + 6, '#60e0ff', Math.max(2, scale));
  if (inWorld()) for (const n of NPCS) { const mk = npcMark(n); dot(n.x + 6, n.y + 6, mk && mk[1] === '#f8c838' ? '#f8f848' : '#c0a040', Math.max(2, scale)); }
  if (frame % 40 < 30) dot(p.x + 6, p.y + 6, '#ffffff', Math.max(2, scale + 1));
  ctx.restore();
}
