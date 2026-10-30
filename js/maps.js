// ================= Map packs (maps/*.js) =================
// Each file in maps/ calls registerMap({...}) with everything the area needs: its tile art, its
// monsters, its loot and an ASCII layout. This file turns that data into game objects and handles
// travelling between the main world and those areas through portal tiles ('Z').
//
// Map file format (see maps/frostpeak.js for a full example):
//   id, name, level            unique id, display name, recommended level
//   entrance: { x, y }         tile on the MAIN WORLD where the portal to this map is placed
//   spawn: { x, y }            tile where the player arrives in this map
//   palette: { A:'#rrggbb' }   extra colours for the sprite/icon art below (merged over PAL)
//   tiles: { ch: spec }        new tile chars. spec = { base, speck:[[colour,count]], variants, on, art, solid, mini }
//   mats:  { id: { name, value, icon:[8 rows] } }
//   enemies: { id: { ...stats like ETYPES, plural, frames:[[8 rows],[8 rows]], scale } }
//   mobs: [{ type, n, area:[x0,y0,x1,y1] }]   kept topped up while you're in the map
//   boss: { type, x, y, respawn }             respawn in frames
//   tint, weather              optional screen tint colour and 'snow'
//   grid: [ 'row', ... ]       the layout, one character per tile ('Z' = portal back to the world)

const MAPS = {};
let region = null, regionReturn = null;
const inWorld = () => !dungeon && !region && !arena && !rift;

// portal: a swirling ring of stone, two animation frames
TILES.Z = [0, 1].map(f => paint(g => {
  g.fillStyle = '#3a3a52'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#6a6a88'; g.fillRect(2, 2, 12, 12);
  g.fillStyle = f ? '#a060ff' : '#6040e0'; g.fillRect(4, 4, 8, 8);
  g.fillStyle = f ? '#60e0ff' : '#c080ff'; g.fillRect(6, 5, 4, 2); g.fillRect(5, 9, 2, 2); g.fillRect(9, 8, 2, 3);
  g.fillStyle = '#ffffff'; g.fillRect(f ? 7 : 8, 7, 2, 2);
}));
MINI_COL.Z = '#ff60ff';

function registerMap(def) {
  const pal = { ...PAL, ...(def.palette || {}) };

  // tiles: build canvases, mark solids, give them a minimap colour
  for (const [ch, s] of Object.entries(def.tiles || {})) {
    TILES[ch] = Array.from({ length: s.variants || 1 }, (_, v) => {
      const c = paint(g => {
        const b = s.on ? def.tiles[s.on] : s;
        g.fillStyle = b.base; g.fillRect(0, 0, 16, 16);
        (b.speck || []).forEach(([col, n], i) => speck(g, col, n, v * 13 + i * 7 + 1));
      });
      return s.art ? art(s.art, 2, c, pal) : c;
    });
    if (s.solid) SOLID.add(ch);
    MINI_COL[ch] = s.mini || s.base;
  }
  // loot and monsters
  for (const [id, m] of Object.entries(def.mats || {})) {
    MATS[id] = { name: m.name, value: m.value };
    ICON[id] = dimensional(art(m.icon, 2, null, pal), false);
  }
  for (const [id, e] of Object.entries(def.enemies || {})) {
    const { frames, plural, scale, ...stats } = e;
    ETYPES[id] = stats;
    SPR[id] = frames.map(rows => dimensional(art(rows, scale || 2, null, pal)));
    PLURAL[id] = plural || stats.name + 's';
  }
  // layout: pad/trim every row to the widest row so a ragged edit can't break the map
  const w = Math.max(...def.grid.map(r => r.length));
  def.grid = def.grid.map(r => [...r.padEnd(w, def.edge || r[r.length - 1])]);
  def.w = w; def.h = def.grid.length; def.bossCD = 0;
  MAPS[def.id] = def;

  // stamp the portal into the main world, in a small clearing
  const { x, y } = def.entrance, fl = def.clearing || '.';
  for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++)
    if (world[yy] && world[yy][xx] !== undefined && (xx - x) ** 2 + (yy - y) ** 2 <= 5) world[yy][xx] = fl;
  world[y][x] = 'Z';
}

function spawnRegionMob(def, m, anywhere) {
  const d = ETYPES[m.type], w = d.w || 12, h = d.h || 12;
  for (let i = 0; i < 30; i++) {
    const x = ri(m.area[0], m.area[2]) * T + 2, y = ri(m.area[1], m.area[3]) * T + 2;
    if (blocked(x, y, w, h, true)) continue;
    if (!anywhere && Math.hypot(x - p.x, y - p.y) < 200) continue;
    enemies.push(mkEnemy(m.type, x, y, `${def.id}:${m.type}`)); return;
  }
}
function regionSpawner() {
  const def = MAPS[region];
  if (frame % 120 === 0) for (const m of def.mobs || [])
    if (enemies.filter(e => !e.dead && e.zone === `${def.id}:${m.type}`).length < m.n) spawnRegionMob(def, m, false);
  if (!def.boss) return;
  if (def.bossCD > 0) def.bossCD--;
  else if (!enemies.some(e => e.type === def.boss.type)) {
    enemies.push(mkEnemy(def.boss.type, def.boss.x * T, def.boss.y * T, def.id));
    def.bossCD = 1e9;                                    // reset when the boss dies (see onRegionBossKilled)
  }
}
function onRegionBossKilled(e) {
  const def = region && MAPS[region];
  if (def && def.boss && def.boss.type === e.type) def.bossCD = def.boss.respawn || 3 * 60 * 60;
}

function enterRegion(id) {
  const def = MAPS[id];
  worldState = { enemies, pickups };
  regionReturn = { x: def.entrance.x * T + 2, y: (def.entrance.y + 1) * T + 4 };
  region = id; map = def.grid; MW = def.w; MH = def.h;
  enemies = []; pickups = []; projs = []; eprojs = []; torches = [];
  for (const m of def.mobs || []) for (let i = 0; i < m.n; i++) spawnRegionMob(def, m, true);
  if (def.boss && def.bossCD <= 0) { enemies.push(mkEnemy(def.boss.type, def.boss.x * T, def.boss.y * T, def.id)); def.bossCD = 1e9; }
  p.x = def.spawn.x * T + 2; p.y = def.spawn.y * T + 2; p.stairCD = 40; p.target = null;
  camx = clamp(p.x - VW / 2, 0, MW * T - VW); camy = clamp(p.y - VH / 2, 0, MH * T - VH);
  zoneName = def.name; banner = { txt: def.name, t: 150 }; sfx('stairs');
  if (def.level && p.lvl < def.level) msg(`Dangerous area! (LV ${def.level}+ advised)`, '#ff9090');
}
function leaveRegion() {
  region = null; map = world; MW = WW; MH = WH; torches = []; projs = []; eprojs = [];
  ({ enemies, pickups } = worldState); worldState = null;
  p.x = regionReturn.x; p.y = regionReturn.y; p.stairCD = 40; p.target = null;
  zoneName = zoneAt(p.x); banner = { txt: zoneName, t: 150 }; sfx('stairs');
}
// called when the player steps on a portal tile
function usePortal(tx, ty) {
  if (region) return leaveRegion();
  const def = Object.values(MAPS).find(m => m.entrance.x === tx && m.entrance.y === ty);
  if (def) enterRegion(def.id);
}

// weather + tint drawn over the region (snow drifts with the camera so it feels anchored to the ground)
function drawRegionFx(cx, cy) {
  const def = MAPS[region];
  if (def.tint) { ctx.fillStyle = def.tint; ctx.fillRect(0, 0, VW, VH); }
  if (def.weather === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 70; i++) {
      const sp = 0.4 + (i % 3) * 0.25;
      const x = ((i * 53 + frame * 0.25 * (1 + i % 2) + Math.sin(frame * 0.02 + i) * 6 - cx * 0.3) % VW + VW) % VW;
      const y = ((i * 97 + frame * sp - cy * 0.3) % VH + VH) % VH;
      ctx.fillRect(Math.round(x), Math.round(y), i % 4 ? 1 : 2, i % 4 ? 1 : 2);
    }
  } else if (def.weather === 'ash') {
    for (let i = 0; i < 55; i++) {
      const sp = 0.35 + (i % 3) * 0.2;
      const x = ((i * 61 + frame * 0.15 + Math.sin(frame * 0.03 + i) * 8 - cx * 0.3) % VW + VW) % VW;
      const y = ((i * 89 - frame * sp - cy * 0.3) % VH + VH) % VH;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,180,60,.85)' : 'rgba(255,90,30,.75)';
      ctx.fillRect(Math.round(x), Math.round(y), i % 4 ? 1 : 2, i % 4 ? 1 : 2);
    }
  }
}
