// ================= Mountains =================
// A rocky mountain range along the north edge of the map (tile rows 0-5) and a ridge along the far west edge,
// with the road tunnel into the base's west wing bored through it. Each peak is
// one big pixel-art picture painted once at load (jagged ridge, lit west face, shaded east face, snow cap,
// grassy foothills), drawn over the ground tiles but under everyone walking around. The ground it stands on is
// stamped with the solid scree tile '`', so nobody can walk into the rock.
// Kept clear: the north road out of the base (x 12-13), the Frostpeak checkpoint at (30, 4) and its approach,
// the path along the base's north wall (rows 6-7) and the river fence/bunker (x 43+).

TILES['`'] = [1, 2, 3].map(s => paint(g => {                               // scree: rocky ground at the mountain foot
  gGrass(s)(g);
  g.fillStyle = '#5e574e'; g.fillRect(1, 2, 14, 12); g.fillRect(3, 1, 10, 14);
  speck(g, '#8a8276', 9, s); speck(g, '#3e3a34', 7, s + 5); speck(g, '#a49c8e', 4, s + 9);
}));
SOLID.add('`');
MINI_COL['`'] = '#7a7268';

const MOUNTAINS = [];
(function () {
  let seed = 913;
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const C = { lit: '#a29a8a', rock: '#7e766a', sh: '#5a544b', deep: '#3e3a35', crack: '#4a453e',
    snow: '#f2f6fa', snowSh: '#b6c4d6', grass: '#4e7a38', grassSh: '#34542a', line: '#1c1a1e' };

  // W x H px picture; returns { img, mask } (mask[y*W+x] = 1 where there is rock)
  function paintMountain(W, H) {
    const pk = Math.round(W * (0.38 + r() * 0.24));                     // where the summit sits
    const top = new Array(W);
    let n = 0;
    for (let x = 0; x < W; x++) {                                       // ridge line: a slope with jagged noise
      const side = x < pk ? pk : W - 1 - pk, t = Math.max(0, 1 - Math.abs(x - pk) / side);
      n = n * 0.8 + (r() - 0.5) * 2.4;
      const h = H * Math.pow(t, 0.85) + n * Math.min(1, t * 4) * 2.2;
      top[x] = Math.max(1, Math.min(H, Math.round(H - h)));
    }
    const peakY = top[pk], snowY = peakY + H * (0.24 + r() * 0.1), grassY = H - H * 0.16;
    const jag = Array.from({ length: W }, () => Math.round((r() - 0.5) * 5));
    const px = Array.from({ length: H }, () => new Array(W).fill(null));
    for (let x = 0; x < W; x++) for (let y = top[x]; y < H; y++) {
      const ridgeX = pk + (y - peakY) * 0.28;                           // the sun is to the west: the east face is in shadow
      const lit = x < ridgeX, edge = Math.abs(x - ridgeX) < 1;
      let c = edge ? C.deep : lit ? (y - top[x] < 2 ? C.lit : C.rock) : C.sh;
      if (y < snowY + jag[x]) c = lit ? C.snow : C.snowSh;
      else if (y > grassY + jag[x]) c = lit ? C.grass : C.grassSh;
      px[y][x] = c;
    }
    // cracks and rock strata running down the slopes
    for (let i = 0; i < W / 6; i++) {
      let x = Math.floor(r() * W), y = top[x] + 3 + Math.floor(r() * H * 0.5);
      const dir = x < pk ? -1 : 1, len = 3 + Math.floor(r() * 7);
      for (let k = 0; k < len; k++, y++) {
        if (k % 2) x += dir;
        if (y < H && x >= 0 && x < W && px[y][x] && px[y][x] !== C.snow && px[y][x] !== C.snowSh) px[y][x] = C.crack;
      }
    }
    for (let i = 0; i < W / 3; i++) {                                    // little boulders and tufts on the foothills
      const x = Math.floor(r() * W), y = Math.floor(grassY + 2 + r() * (H - grassY - 3));
      if (y < H && px[y][x]) px[y][x] = r() < 0.5 ? C.rock : '#6a9a48';
    }
    const c = mk(); c.width = W; c.height = H; const g = c.getContext('2d'), mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[y][x]) { g.fillStyle = px[y][x]; g.fillRect(x, y, 1, 1); mask[y * W + x] = 1; }
    g.fillStyle = C.line;                                                 // dark outline along the ridge and flanks
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (px[y][x]) continue;
      if ((x > 0 && px[y][x - 1]) || (x < W - 1 && px[y][x + 1]) || (y < H - 1 && px[y + 1][x])) g.fillRect(x, y, 1, 1);
    }
    return { img: c, mask };
  }

  // [left tile, width in tiles, height px, base row] in NEW tile numbers; painted back (north) to front (south)
  const PEAKS = [
    // north range over the new west strip
    [0, 6, 86, 5], [5, 7, 94, 5], [11, 6, 80, 5], [16, 7, 92, 5], [22, 6, 84, 5], [27, 7, 96, 5], [33, 6, 82, 5], [38, 7, 94, 5], [44, 6, 80, 5],
    [3, 4, 50, 5], [14, 4, 48, 5], [25, 4, 52, 5], [36, 4, 46, 5], [47, 4, 50, 5],
    // the old north range (old tile numbers + OX)
    ...[[1, 6, 88], [5, 6, 92], [3, 4, 52], [7, 4, 48], [15, 6, 80], [19, 7, 94], [23, 4, 70], [17, 4, 50], [22, 4, 44],
      [34, 5, 78], [37, 6, 92], [35, 4, 46], [39, 4, 54]].map(([x, w, h]) => [x + OX, w, h, 5]),
    // the west ridge along the map edge (x 0-9); the road tunnel is bored through the big peak standing on row 28
    [0, 9, 104, 13], [1, 9, 96, 19], [0, 10, 140, 28], [1, 9, 100, 35], [0, 9, 108, 42], [1, 9, 96, 48],
    [0, 9, 104, 55], [1, 9, 96, 62], [0, 9, 108, 69], [1, 9, 100, 76], [0, 9, 104, 83], [1, 8, 84, 88],
  ];
  const free = ch => ch === '.' || ch === 'T' || ch === 'f' || ch === '`';
  for (const [tx, tw, H, base] of PEAKS) {
    const W = tw * T, { img, mask } = paintMountain(W, H);
    const sx = tx * T, sy = (base + 1) * T - H;
    MOUNTAINS.push({ img, mask, x: sx, y: sy, w: W, h: H });
    // every ground tile whose middle is covered by rock becomes solid scree (roads and walls are left alone)
    for (let ty = Math.max(1, Math.floor(sy / T)); ty <= base; ty++) for (let x = tx; x < tx + tw; x++) {
      const mx = x * T + 8 - sx, my = ty * T + 8 - sy;
      if (my >= 0 && my < H && x >= 0 && x < WW && mask[my * W + mx] && free(world[ty][x])) world[ty][x] = '`';
    }
  }
  MOUNTAINS.sort((a, b) => (a.y + a.h) - (b.y + b.h));
})();

// ---- the road tunnel through the west ridge (TUNNEL, world.js) ----
// Where the rock covers the avenue is the bore: actors inside it are hidden under the mountain (drawTunnelRoof,
// called after the actors), with a row of ceiling lamps showing the way through. Concrete portals with hazard
// stripes and lamps mark both mouths.
const TUNNEL_BORE = (() => {
  const yMid = (TUNNEL.y0 + 1) * T, out = { x0: Infinity, x1: -Infinity };
  for (const m of MOUNTAINS) {
    const my = Math.round(yMid - m.y);
    if (my < 0 || my >= m.h) continue;
    for (let px = Math.max(m.x, TUNNEL.x0 * T); px < Math.min(m.x + m.w, (TUNNEL.x1 + 1) * T); px++)
      if (m.mask[my * m.w + (px - m.x)]) { out.x0 = Math.min(out.x0, px); out.x1 = Math.max(out.x1, px); }
  }
  return out.x0 < out.x1 ? out : { x0: TUNNEL.x0 * T, x1: (TUNNEL.x1 + 1) * T };
})();
function drawTunnelRoof(cx, cy) {
  const b = TUNNEL_BORE, x0 = b.x0 - cx, x1 = b.x1 - cx, top = (TUNNEL.y0 - 1.5) * T - cy, bot = (TUNNEL.y1 + 1) * T - cy;
  if (x1 < -20 || x0 > VW + 20 || bot < -20 || top > VH + 20) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, bot - top); ctx.clip();
  for (const m of MOUNTAINS) if (m.x < b.x1 && m.x + m.w > b.x0 && m.y < (TUNNEL.y1 + 1) * T && m.y + m.h > (TUNNEL.y0 - 1.5) * T) ctx.drawImage(m.img, m.x - cx, m.y - cy);
  ctx.restore();
  // ceiling lamps seen through the rock: the route through the bore
  const ly = Math.round((TUNNEL.y0 + 1) * T - cy);
  for (let x = b.x0 + 8; x < b.x1 - 4; x += 12) { ctx.fillStyle = 'rgba(255,214,110,.55)'; ctx.fillRect(Math.round(x - cx), ly - 1, 3, 2); }
  for (const [mx, dir] of [[b.x0, -1], [b.x1, 1]]) drawPortal(Math.round(mx - cx), dir, cy);
  const pc = { x: b.x1 + 8, y: (TUNNEL.y0 - 0.5) * T };
  if (mode === 'play' && Math.hypot(p.x - pc.x, p.y - pc.y) < 140) text('WEST TUNNEL', Math.round(pc.x - cx), Math.round(pc.y - cy) - 20, '#f8c838', 'center');
}
// a concrete headwall across the road at a tunnel mouth; dir: -1 west mouth, 1 east mouth
function drawPortal(x, dir, cy) {
  const y0 = Math.round(TUNNEL.y0 * T - cy), h = (TUNNEL.y1 - TUNNEL.y0 + 1) * T;
  const wx = dir > 0 ? x - 4 : x - 2;
  ctx.fillStyle = '#100c1a'; ctx.fillRect(wx - 1, y0 - 9, 8, h + 14);                   // outline
  ctx.fillStyle = '#8a8e92'; ctx.fillRect(wx, y0 - 8, 6, h + 12);                       // headwall
  ctx.fillStyle = '#a8acb0'; ctx.fillRect(wx, y0 - 8, 6, 2);
  ctx.fillStyle = '#5c6064'; ctx.fillRect(wx + (dir > 0 ? 5 : 0), y0 - 6, 1, h + 10);
  for (let i = 0; i < h + 8; i += 6) { ctx.fillStyle = '#f8c838'; ctx.fillRect(wx + 1, y0 - 6 + i, 4, 3); ctx.fillStyle = '#1a1a1a'; ctx.fillRect(wx + 1, y0 - 3 + i, 4, 3); }   // hazard stripes
  ctx.fillStyle = '#100c1a'; ctx.fillRect(wx - 1, y0 + 1, 8, h - 2);                    // the dark opening the road runs into
  ctx.fillStyle = '#26262a'; ctx.fillRect(wx, y0 + 2, 6, h - 4);
  const glow = Math.floor(frame / 30) % 2 ? '#ffe070' : '#d8b040';                      // lamps over the mouth
  for (const ly of [y0 - 5, y0 + h + 1]) { ctx.fillStyle = 'rgba(255,224,112,.25)'; ctx.fillRect(wx - 2, ly - 2, 10, 6); ctx.fillStyle = glow; ctx.fillRect(wx + 2, ly, 2, 2); }
}

function drawMountains(cx, cy) {
  for (const m of MOUNTAINS) {
    const x = m.x - cx, y = m.y - cy;
    if (x > VW || y > VH || x + m.w < 0 || y + m.h < 0) continue;
    ctx.drawImage(m.img, x, y);
  }
}
