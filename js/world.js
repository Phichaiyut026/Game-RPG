// ================= Overworld Map & Dungeon =================
// the old 160-column world is generated first, exactly as before (old coordinates), then embedded OX columns east
MW = WW - OX;
let map = Array.from({ length: MH }, () => Array(MW).fill('.'));
const GATES = [];            // bridge gates: { x, ys:[rows], open, idle } — filled in by gen() below
const RIVER_W = 9;           // river width in tiles (was 5: widened eastward, the base-side bank didn't move)
(function gen() {
  let seed = 7;
  const sr = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < MW && y < MH) map[y][x] = c; };
  const disc = (cx, cy, r, c) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1) set(x, y, c); };
  const OLD_W = 88, OLD_H = 50;                                     // the original map, generated exactly as before
  for (let y = 0; y < OLD_H; y++) for (let x = 0; x < OLD_W; x++) {
    let c = '.';
    if (x >= 26 && x < 48) { const r = sr(); c = r < 0.07 ? 'T' : r < 0.13 ? 'f' : '.'; }
    else if (x >= 48 && x < 68) c = sr() < 0.42 ? 'P' : ',';
    else if (x >= 68) { const r = sr(); c = r < 0.05 ? '#' : r < 0.09 ? 'r' : 's'; }
    map[y][x] = c;
  }
  disc(36, 11, 3, '~'); disc(32, 38, 2, '~');
  // ================= Expansion: the world grew from 88x50 to WW x WH tiles =================
  // The original map (x < OLD_W, y < OLD_H) is generated exactly as before. New sectors, with their own RNG:
  //   east:  Sector 4 abandoned airfield (x 88-121) · Sector 5 hospital district ruins (x 122+)
  //   south: Sector 6 farmland (west of the river) · Sector 7 toxic swamp · Sector 8 harbor docks (x 102+)
  let seed2 = 4242;
  const sr2 = () => { seed2 = (seed2 * 1664525 + 1013904223) >>> 0; return seed2 / 4294967296; };
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const facade = (x0, y, pat) => [...pat].forEach((c, i) => set(x0 + i, y, c));
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (x < OLD_W && y < OLD_H) continue;
    let c; const r = sr2();
    if (y < OLD_H) c = x < 122 ? (r < 0.55 ? 'g' : r < 0.6 ? 'f' : r < 0.62 ? 'T' : '.')      // airfield: gravel + dry grass
                               : (r < 0.05 ? '#' : r < 0.09 ? 'r' : 's');                       // hospital district ruins
    else if (x < 47) c = r < 0.06 ? 'T' : r < 0.1 ? 'f' : '.';                                  // farmland
    else if (x < 102) c = r < 0.3 ? 'P' : r < 0.36 ? 'x' : ',';                                 // swamp
    else c = r < 0.03 ? '#' : r < 0.06 ? 'z' : r < 0.08 ? '5' : 's';                           // harbor docks
    map[y][x] = c;
  }
  // -- Sector 4: airfield -- runway with centreline, taxiway to the highway, hangars, control tower, wrecks
  fill(91, 11, 119, 15, 'h'); for (let x = 92; x <= 118; x += 2) set(x, 13, '4');
  fill(104, 16, 105, 23, 'h');
  for (const hx of [92, 100, 108]) { fill(hx, 30, hx + 6, 33, 'R'); facade(hx, 34, 'WDDDDDW'); }
  fill(91, 35, 116, 37, 'h');                                   // apron in front of the hangars
  set(116, 19, 'G'); set(117, 19, '6');                         // control tower + radar mast
  for (const [x, y] of [[98, 12], [99, 12], [99, 13], [100, 13], [112, 14], [113, 14]]) set(x, y, 'r');
  set(106, 12, '#'); set(107, 14, '#');
  fill(94, 41, 97, 42, '5');                                    // fuel depot
  for (let x = 89; x <= 121; x++) { if (sr2() < 0.7) set(x, 3, 'H'); if (sr2() < 0.7) set(x, 46, 'H'); }   // broken HESCO perimeter
  for (const y of [8, 19, 28]) for (let x = 90; x <= 120; x++) if (sr2() < 0.35 && map[y][x] !== 'h') set(x, y, 'B');
  // -- Sector 5: hospital district -- street grid, the quarantine hospital, apartment blocks, field hospital
  for (let y = 1; y <= 48; y++) for (const x of [129, 130, 146, 147]) set(x, y, '=');
  for (const y of [10, 11, 38, 39]) for (let x = 122; x <= 158; x++) set(x, y, '=');
  fill(132, 3, 143, 6, 'R'); facade(132, 7, 'WwwwwDDwwwwW');
  const block = (x0, y0, w) => { fill(x0, y0, x0 + w - 1, y0 + 1, 'R'); facade(x0, y0 + 2, 'W' + 'w'.repeat(w - 3) + 'D'); };
  for (const [x, y, w] of [[122, 3, 6], [149, 3, 8], [122, 14, 6], [132, 14, 5], [138, 14, 6], [149, 14, 8],
    [122, 30, 6], [133, 30, 9], [149, 30, 8], [122, 42, 6], [133, 42, 9], [149, 42, 8]]) block(x, y, w);
  fill(132, 19, 135, 20, 'I'); fill(138, 19, 141, 20, 'I'); fill(134, 34, 137, 35, 'I'); fill(139, 34, 142, 35, 'I');
  for (let i = 0; i < 28; i++) { const x = 122 + Math.floor(sr2() * 36), y = 2 + Math.floor(sr2() * 46); if (map[y][x] === 's') set(x, y, 'x'); }
  // -- Sector 6: Survivor Farm (safe zone) -- the food supply for FOB Ironvale. A fenced, working farm:
  //    farmhouse + water tower + hay, wheat fields with scarecrows, vegetable beds, greenhouses, an orchard,
  //    the big red barn with its tractor, dirt tracks between the plots. Farmers (data.js FARMERS) tend it.
  fill(1, 50, 41, 88, '.');
  for (let x = 1; x <= 41; x++) { if (x !== 12 && x !== 13) set(x, 50, 't'); set(x, 88, 't'); }   // rail fence, gate on the road
  for (let y = 50; y <= 88; y++) { set(1, y, 't'); set(41, y, 't'); } // fully fenced on west and east sides (no open bridge crossing)
  // Farm entrance gate on the base side (x12-13, y50)
  set(12, 50, 'J'); set(13, 50, 'J');
  set(11, 50, 'F'); set(14, 50, 'F');                           // sandbags flanking the farm entrance gate
  GATES.push({ xs: [12, 13], y: 50, open: false, idle: 0 });
  for (let x = 2; x <= 41; x++) set(x, 62, '-');                // east-west dirt track between the plots
  for (let y = 51; y <= 87; y++) set(27, y, '-');               // north-south dirt track
  fill(3, 52, 9, 53, '^'); facade(3, 54, 'WwwDwwW');            // farmhouse
  set(10, 53, '&');                                             // water tower
  for (const [x, y] of [[3, 57], [4, 57], [3, 58]]) set(x, y, '*');
  fill(15, 52, 25, 60, '0'); fill(29, 52, 40, 60, '0');        // north wheat fields
  fill(3, 64, 10, 73, '3'); fill(15, 64, 25, 73, '3');         // vegetable beds
  fill(29, 64, 40, 73, '0');                                    // south wheat field
  for (const [x, y] of [[20, 56], [34, 56], [34, 68]]) set(x, y, '+');   // scarecrows
  fill(3, 79, 10, 81, '9'); fill(3, 84, 10, 86, '9');          // greenhouses
  for (let y = 79; y <= 87; y += 2) for (let x = 15; x <= 25; x += 2) set(x, y, 'T');   // orchard rows
  fill(30, 79, 37, 81, '^'); facade(30, 82, 'WwwDDwwW');       // the big red barn
  for (const [x, y] of [[38, 80], [39, 80], [38, 81]]) set(x, y, '*');
  set(39, 84, '&'); set(33, 85, '$');                           // grain silo, tractor
  // -- Sector 7: toxic swamp -- stagnant ponds, sludge and winding trails through the dead pines
  for (let i = 0; i < 12; i++) disc(52 + Math.floor(sr2() * 46), 54 + Math.floor(sr2() * 30), 2 + Math.floor(sr2() * 3), '~');
  for (let i = 0; i < 10; i++) disc(52 + Math.floor(sr2() * 46), 54 + Math.floor(sr2() * 30), 1, 'x');
  for (let i = 0; i < 9; i++) {
    let x = 52 + Math.floor(sr2() * 46), y = 53 + Math.floor(sr2() * 32);
    for (let s = 0; s < 160; s++) {
      disc(x, y, 1, ',');
      const d = Math.floor(sr2() * 4); x = clamp(x + [1, -1, 0, 0][d], 50, 99); y = clamp(y + [0, 0, 1, -1][d], 52, MH - 4);
    }
  }
  // -- Sector 8: harbor -- the sea along the south and east edge, piers, container stacks, warehouses, cranes
  fill(102, 82, 158, MH - 2, '~'); fill(153, 50, 158, MH - 2, '~');
  for (const x of [110, 118, 126, 134, 142]) fill(x, 81, x + 1, 87, 'b');
  for (const [x0, y0] of [[106, 54], [106, 59], [114, 54], [114, 59], [124, 63], [132, 63], [140, 55], [140, 60]]) fill(x0, y0, x0 + 4, y0 + 2, '8');
  fill(104, 66, 112, 69, 'R'); facade(104, 70, 'WwwDDDwwW');
  fill(137, 68, 147, 71, 'R'); facade(137, 72, 'WwwwDDDwwwW');
  for (const x of [114, 130, 146]) { set(x, 80, 'G'); set(x + 1, 80, '6'); }
  // ================= The abandoned city (east bank) =================
  // Across the river from the base lies the dead city the base was built to hold. It replaces the old
  // forest, ruins and swamp: cracked streets on a grid with sidewalks, and city blocks of
  //   Sector 1 (x52-56) suburban houses · Sector 2 (x59-66) warehouses · Sector 3 (x69-85) downtown towers
  //   Sector 7 (south, y50-88) a flooded residential district with water standing in the blocks.
  // Landmarks kept at their old tiles: the secret courtyard (Q fake wall 63,6 / K crate 63,4), the
  // bunker elevator E (74,18) and the Emberfall checkpoint (60,36, stamped by maps.js).
  let seed3 = 2025;
  const sr3 = () => { seed3 = (seed3 * 1664525 + 1013904223) >>> 0; return seed3 / 4294967296; };
  const pick = a => a[Math.floor(sr3() * a.length)];
  const STYLE = {
    house:     { roof: () => pick(['^', '^', '{']), face: (i, w) => i === (w >> 1) ? 'D' : pick(['w', 'w', 'W', '[']) },
    apartment: { roof: () => '{', face: (i, w) => i === (w >> 1) ? 'D' : pick(['}', '}', '}', '[']) },
    warehouse: { roof: () => pick(['N', 'R']), face: (i, w) => i > 0 && i < w - 1 && i % 3 !== 0 ? 'D' : pick(['W', 'W', '[']) },
    tower:     { roof: () => pick(['R', '{', '{', 'N']), face: () => pick([']', ']', 'w', '[', 'D']) },
  };
  // a building: `rows` rows of roof, then its facade along the south side; some have partly collapsed
  const ruin = (x0, y0, w, rows, style) => {
    const st = STYLE[style], roof = st.roof();
    for (let y = y0; y < y0 + rows; y++) for (let x = x0; x < x0 + w; x++) set(x, y, roof !== '^' && sr3() < 0.1 ? '/' : roof);
    for (let x = x0; x < x0 + w; x++) set(x, y0 + rows, st.face(x - x0, w));
    if (w >= 3 && sr3() < 0.3) {                                    // a corner has caved in
      const cx = sr3() < 0.5 ? x0 : x0 + w - 2;
      for (let y = y0; y < y0 + Math.min(rows, 2); y++) for (let x = cx; x < cx + 2; x++) set(x, y, sr3() < 0.75 ? '(' : '"');
    }
  };
  const sidewalkDeco = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (map[y][x] === 's' && sr3() < 0.14) set(x, y, ';');
    if (sr3() < 0.6) set(sr3() < 0.5 ? x0 : x1, y0, '!');                   // street lamps on the corners
    if (sr3() < 0.4) set(sr3() < 0.5 ? x0 : x1, y1, '!');
  };
  const cityBlock = (x0, y0, x1, y1, kind) => {
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (kind === 'suburb') {                                        // houses on overgrown lawns, cars left in the drive
      fill(x0, y0, x1, y1, ',');
      for (let y = y0; y + 2 <= y1; y += 4) {
        const hw = Math.min(w, 3 + Math.floor(sr3() * 2)), hx = x0 + Math.floor(sr3() * (w - hw + 1));
        ruin(hx, y, hw, 2, 'house');
        if (y + 3 <= y1 && sr3() < 0.5) set(hx + (hw >> 1) + 1, y + 3, 'r');
      }
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (map[y][x] === ',' && sr3() < 0.1) set(x, y, pick(['T', ';', ';', '?']));
      return;
    }
    fill(x0, y0, x1, y1, 's');
    const ix0 = x0 + 1, iy0 = y0 + 1, iw = w - 2, ih = h - 2;
    if (kind === 'industrial') {                                    // a warehouse and its yard of containers, drums and crates
      const ww = Math.max(3, iw - 2 - Math.floor(sr3() * 2)), wx = sr3() < 0.5 ? ix0 : ix0 + iw - ww;
      ruin(wx, iy0, ww, ih - 1, 'warehouse');
      for (let y = iy0; y < iy0 + ih; y++) for (let x = ix0; x < ix0 + iw; x++)
        if (map[y][x] === 's' && sr3() < 0.45) set(x, y, pick(['8', '8', '5', 'z', '(', '?', 'g']));
    } else if (kind === 'downtown' || kind === 'flooded') {         // one or two buildings with an alley between
      const style = kind === 'downtown' ? 'tower' : pick(['apartment', 'apartment', 'house']);
      if (iw >= 7) {
        const a = Math.floor((iw - 1) / 2);
        ruin(ix0, iy0, a, ih - 1, style); ruin(ix0 + a + 1, iy0, iw - a - 1, ih - 1, kind === 'downtown' ? 'tower' : pick(['apartment', 'house']));
        for (let y = iy0; y < iy0 + ih; y++) set(ix0 + a, y, sr3() < 0.2 ? '?' : ';');
      } else ruin(ix0, iy0, iw, ih - 1, style);
    }
    sidewalkDeco(x0, y0, x1, y1);
  };
  const streets = (X0, X1, Y0, Y1, xs, ys) => {
    fill(X0, Y0, X1, Y1, '%');
    for (const x of xs) for (const y of ys) for (const yy of [y - 1, y + 2]) for (const xx of [x, x + 1])   // crosswalks
      if (yy >= Y0 && yy <= Y1) set(xx, yy, ':');
  };
  // street clutter: wrecks, rubble, scorch marks and craters, never two solids side by side (streets stay open)
  const clutter = (X0, X1, Y0, Y1) => {
    for (let y = Y0; y <= Y1; y++) for (let x = Math.max(X0, 54); x <= X1; x++) {
      if (map[y][x] !== '%') continue;
      const r = sr3();
      if (r < 0.03) { set(x, y, '"'); continue; }
      if (r > 0.045) continue;
      let crowded = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (SOLID.has(map[y + dy]?.[x + dx])) crowded = true;
      if (!crowded) set(x, y, pick(['r', 'r', ')', '(', '@']));
    }
  };
  // -- north: Sectors 1-3 --
  const NX = [52, 59, 69, 79], NW = [5, 8, 8, 7], NY = [1, 10, 18, 26, 34, 42], NH = [7, 6, 6, 6, 6, 6];
  streets(50, 87, 1, 49, [50, 57, 67, 77, 86], [8, 16, 24, 32, 40, 48]);
  NX.forEach((bx, c) => NY.forEach((by, r) =>
    cityBlock(bx, by, bx + NW[c] - 1, by + NH[r] - 1, c === 0 ? 'suburb' : c === 1 ? 'industrial' : 'downtown')));
  // the secret courtyard (where the hidden grove was): a walled yard, entered through a fake brick wall Q
  fill(59, 1, 66, 7, 's');
  for (let y = 2; y <= 6; y++) { set(60, y, '{'); set(66, y, '{'); }
  for (let x = 60; x <= 66; x++) { set(x, 2, '{'); set(x, 6, '}'); }
  fill(61, 3, 65, 5, ',');
  set(63, 6, 'Q'); set(63, 4, 'K'); set(59, 1, '!'); set(65, 7, '?');
  // bunker elevator plaza (crypt entrance E)
  fill(69, 18, 76, 23, 's');
  for (let y = 19; y <= 23; y++) for (let x = 69; x <= 76; x++) if (sr3() < 0.3) set(x, y, ';');
  set(74, 18, 'E'); set(69, 18, '!'); set(76, 23, '!'); set(70, 22, '('); set(71, 22, '('); set(75, 21, 'r');
  // Emberfall checkpoint compound: barriers and sandbags around the convoy checkpoint (maps.js stamps Z at 60,36)
  fill(59, 34, 66, 39, 's');
  for (let y = 34; y <= 39; y++) if (y !== 36 && y !== 37) set(66, y, '@');
  for (const x of [62, 63]) { set(x, 34, 'F'); set(x, 39, 'F'); }
  set(64, 35, 'I'); set(65, 35, 'I'); set(64, 38, 'z');
  // a dead city park downtown: dry grass, trees, a crater
  fill(79, 34, 85, 39, ',');
  for (let y = 34; y <= 39; y++) for (let x = 79; x <= 85; x++) if (sr3() < 0.22) set(x, y, 'T');
  for (let x = 79; x <= 85; x++) set(x, 36, ';'); set(82, 38, 'f');
  clutter(50, 87, 1, 49);
  // -- south: Sector 7, the flooded district --
  const SX = [52, 62, 72, 82, 92], SY = [50, 60, 69, 78, 87], SH = [8, 7, 7, 7, 2];
  streets(50, 101, 50, 88, [50, 60, 70, 80, 90, 100], [58, 67, 76, 85]);
  SX.forEach(bx => SY.forEach((by, r) => {
    if (SH[r] < 4) { fill(bx, by, bx + 7, by + SH[r] - 1, 's'); for (let x = bx; x <= bx + 7; x++) if (sr3() < 0.3) set(x, by, pick(['(', ';', '?'])); }
    else cityBlock(bx, by, bx + 7, by + SH[r] - 1, 'flooded');
  }));
  for (let i = 0; i < 11; i++) disc(53 + Math.floor(sr3() * 46), 52 + Math.floor(sr3() * 34), 1 + Math.floor(sr3() * 2), '~');   // flood water
  for (let i = 0; i < 9; i++) disc(53 + Math.floor(sr3() * 46), 52 + Math.floor(sr3() * 34), 1, 'x');                           // toxic runoff
  clutter(50, 101, 50, 88);
  // a wide river (RIVER_W tiles) runs the full height of the map: the base side is everything west of it
  const riverX = y => 48 + Math.round(Math.sin(y * 0.25)), half = RIVER_W >> 1;   // west bank = riverX - half (unchanged)
  for (let y = 0; y < MH; y++) for (let dx = -half; dx <= half; dx++) set(riverX(y) + dx, y, '~');
  // Battlefield hazards: Barbed Wire entanglements (B) & Toxic Biohazard Sludge puddles (x)
  for (const [bx, y0, y1] of [[27, 10, 15], [27, 18, 22], [27, 27, 31], [27, 34, 39]]) {
    for (let y = y0; y <= y1; y++) set(bx, y, 'B');
  }
  for (const [y, x0, x1] of [[19, 33, 37], [30, 38, 42], [17, 52, 56], [31, 55, 59], [21, 70, 73], [28, 70, 73], [31, 76, 79]]) {
    for (let x = x0; x <= x1; x++) if (!SOLID.has(map[y][x])) set(x, y, 'B');
  }
  // Toxic biohazard spillover around drainage ponds, canal banks, industrial park & city ruins
  for (const [tx, ty] of [[33,10],[33,11],[39,11],[39,12],[36,8],[36,14], [30,38],[34,38],[32,36],[32,40],
    [53,21],[54,21],[54,22],[55,22], [57,14],[58,14],[58,15], [75,10],[76,10],[76,11], [82,32],[83,32],[83,33]]) {
    if (!SOLID.has(map[ty][tx])) set(tx, ty, 'x');
  }
  for (const y of [13, 14, 19, 20, 29, 30, 35, 36]) {
    const rx = riverX(y); set(rx + half + 1, y, 'x');     // sludge on the far (zombie) bank only
  }
  for (let x = 2; x < MW - 1; x++) for (const y of [24, 25]) set(x, y, map[y][x] === '~' ? 'b' : '=');
  // two smaller bridges (2 rows wide) to the north and south
  for (const rows of [[8, 9], [40, 41]]) for (const by of rows) {
    const rx = riverX(by);
    for (let dx = -half; dx <= half; dx++) set(rx + dx, by, 'b');
    set(rx - half - 1, by, '.'); set(rx + half + 1, by, '%'); set(rx + half + 2, by, '%');
  }
  // a closed steel gate on the base-side end of every bridge (J closed / j open, toggled with E)
  for (const ys of [[8, 9], [24, 25], [40, 41]]) {
    const gx = Math.min(...ys.map(y => riverX(y) - half));
    for (const y of ys) set(gx, y, 'J');
    GATES.push({ x: gx, ys, open: false, idle: 0 });
  }
  // a fence wall (M) runs along the whole base-side river bank; the only ways across are the gated bridges
  const bridgeRows = new Set(GATES.filter(g => g.ys).flatMap(g => g.ys));
  for (let y = 1; y < MH - 1; y++) if (!bridgeRows.has(y)) set(riverX(y) - half - 1, y, 'M');
  // south road: out of the base's south gate, down into the farm through the farm gate
  for (let y = 42; y <= 49; y++) for (const x of [12, 13]) set(x, y, '=');
  for (let y = 51; y <= 62; y++) for (const x of [12, 13]) set(x, y, '-');
  for (let x = 54; x <= 151; x++) for (const y of [76, 77]) set(x, y, map[y][x] === '~' ? 'b' : '=');   // starts on the (wider) river's east bank

  // ================= FOB Ironvale: forward operating base (x: 1..25, y: 8..41) =================
  // Laid out like a real camp: HESCO perimeter with watchtowers and three gates, a gravel parade
  // ground with the flagpole at the crossroads, barracks rows (NW), HQ + radio mast + helipad (NE),
  // motor pool + medical tents (SW), supply depot + firing range (SE).
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const front = (x0, y, pat) => [...pat].forEach((c, i) => set(x0 + i, y, c));   // building facade
  rect(2, 9, 24, 40, '.');                                     // grass verges
  rect(2, 9, 11, 22, 'g'); rect(14, 9, 24, 14, 'g');           // barracks yard / HQ yard
  rect(6, 21, 19, 28, 'g');                                    // parade ground
  rect(2, 27, 11, 34, 'g'); rect(2, 35, 11, 40, 'g');          // motor pool apron / medical area
  rect(14, 29, 24, 34, 'g'); rect(14, 36, 23, 40, 'g');        // supply depot yard / firing range
  for (let y = 6; y <= 43; y++) for (const x of [12, 13]) set(x, y, '=');   // main N-S avenue (gate to gate)
  for (let x = 2; x <= 25; x++) for (const y of [24, 25]) set(x, y, '=');   // E-W avenue to the east gate
  // perimeter: HESCO barrier wall (H) with watchtowers (G); gates N/S at x12-13 and E at y24-25
  for (let x = 1; x <= 25; x++) if (x !== 12 && x !== 13) { set(x, 8, 'H'); set(x, 41, 'H'); }
  for (let y = 8; y <= 41; y++) { set(1, y, 'H'); if (y !== 24 && y !== 25) set(25, y, 'H'); }
  for (const gx of [1, 6, 11, 14, 19, 25]) { set(gx, 8, 'G'); set(gx, 41, 'G'); }
  for (const gy of [16, 33]) set(1, gy, 'G');
  for (const gy of [14, 23, 26, 34]) set(25, gy, 'G');
  // NW: three barracks blocks (2-row olive roof + facade with windows and doors)
  for (const y of [10, 14, 18]) { rect(3, y, 10, y + 1, 'N'); front(3, y + 2, 'WwwDwwwW'); }
  set(9, 22, 'S');                                             // supply locker (personal stash)
  // NE: headquarters, radio mast and the helipad (the Abyssal Rift extraction pad)
  rect(15, 10, 21, 11, 'R'); front(15, 12, 'WwwDwwW');
  set(22, 10, '6');
  rect(15, 15, 19, 19, 's'); set(17, 17, 'V');                // concrete helipad
  // parade ground: flagpole at the crossroads
  set(15, 22, 'p');
  // SW: motor pool: the vehicle garage (two drive-through bays where the BTR-80s park, patrol.js), the asphalt
  // apron with the repair bay (recovery.js), parked cargo trucks and fuel drums; then the medical station
  rect(3, 28, 10, 33, 'h');
  rect(3, 27, 11, 29, 'N');                                     // garage roof (redrawn over vehicles inside: drawGarageRoof)
  front(3, 30, 'W|||W|||W');                                    // facade with the two open bay doors
  for (const [tx, ty] of [[3, 33], [8, 33]]) { set(tx, ty, '1'); set(tx + 1, ty, '2'); }
  set(10, 31, '5'); set(10, 32, '5');
  rect(3, 36, 6, 37, 'I'); rect(3, 39, 6, 40, 'I');            // medical / quarters tents
  set(8, 37, 'O');                                             // decon & aid station (heals)
  // SE: supply depot (Quartermaster) with ammo crates, and the firing range
  rect(15, 30, 21, 31, 'R'); front(15, 32, 'WwwDwwW');
  for (const x of [15, 16, 21]) set(x, 33, 'z');
  set(22, 30, 'z');
  for (const y of [36, 38, 40]) set(16, y, 'F');               // firing-line sandbags
  set(22, 37, '7'); set(22, 39, '7');                          // targets

  // ================= FOB Ironvale expansion: the outer yard =================
  // The base now runs all the way east to the river fence and south to the farm fence: the old grass field and the
  // gun line south of the base are inside the walls (about twice the old area). The inner compound (x1-25, y8-41)
  // keeps its buildings, but its east and south walls came down. Outer HESCO wall: north on row 8 (gate x29-31 to
  // the Frostpeak checkpoint), south on row 49 (gate x12-13 to the farm), west on column 1; the river fence with
  // its gated bridges is the east wall. Keep x >= 36 open: it's the firing line along the fence (soldier posts,
  // tanks, Humvees, bunkers). Gameplay-wise the yard works like the old field: safe unless a raid / world boss.
  const fenceX = y => riverX(y) - half - 1;
  for (let y = 9; y <= 48; y++) for (let x = 26; x < fenceX(y); x++) if ('BxfT'.includes(map[y][x])) set(x, y, '.');   // clear the yard
  for (let y = 42; y <= 48; y++) for (let x = 2; x <= 25; x++) if ('BxfT'.includes(map[y][x])) set(x, y, '.');
  for (let y = 36; y <= 40; y++) for (let x = 30; x <= 34; x++) if (map[y][x] === '~') set(x, y, '.');   // the small pond is filled in
  for (let y = 9; y <= 41; y++) if (y !== 24 && y !== 25) set(25, y, '.');                  // old inner east wall down
  for (let x = 2; x <= 25; x++) set(x, 41, '.');                                           // old inner south wall down
  // roads: north gate → south road (x29-30), and an east-west road along the old south wall (rows 41-42)
  for (let y = 9; y <= 42; y++) for (const x of [29, 30]) if (map[y][x] !== '~') set(x, y, '=');
  for (let x = 2; x <= 36; x++) for (const y of [41, 42]) set(x, y, '=');
  // outer wall + watchtowers
  const wallRow = (y, x0, x1, gaps) => { for (let x = x0; x <= x1; x++) if (!gaps.includes(x) && map[y][x] !== '~') set(x, y, 'H'); };
  let northEnd = 26; while (northEnd < 60 && map[8][northEnd + 1] !== 'J') northEnd++;      // up to the north bridge gate
  wallRow(8, 26, northEnd, [29, 30, 31]);
  wallRow(49, 1, fenceX(49) - 1, [12, 13]);
  for (let y = 41; y <= 49; y++) set(1, y, 'H');
  for (const x of [26, 33, 39]) if (map[8][x] === 'H') set(x, 8, 'G');
  for (const x of [1, 7, 18, 26, 34, 40]) set(x, 49, 'G');
  set(1, 45, 'G');
  // new buildings in the yard
  rect(31, 15, 35, 16, 'N'); front(31, 17, 'WwDwW');          // two more barracks blocks
  rect(31, 19, 35, 20, 'N'); front(31, 21, 'WwDwW');
  for (const y of [13, 16, 19]) { set(26, y, '1'); set(27, y, '2'); }   // vehicle park: cargo trucks
  set(27, 10, '6');                                            // second radio mast
  rect(31, 27, 35, 28, 'R'); front(31, 29, 'WDDDW');          // Apache hangar
  rect(31, 31, 35, 33, 's');                                   // forward helipad (the Apaches fly from the airfield)
  for (const [x, y] of [[26, 28], [27, 28], [26, 30], [27, 30]]) set(x, y, '5');                       // fuel depot
  for (const [x, y] of [[26, 33], [27, 33], [26, 35], [27, 35], [28, 35]]) set(x, y, 'z');           // ammo dump
  rect(31, 36, 33, 37, 'I'); rect(31, 39, 33, 40, 'I');        // field hospital tents
  // east defences: a sandbag wall right behind the river fence (rows next to the bridges stay open for the roads),
  // plus short sandbag wings beside the bridge exits. Zombies must break the fence AND the sandbags; the engineers
  // rebuild both after a raid (they're breakable walls, invasion.js).
  for (let y = 10; y <= 48; y++) {
    if ([24, 25, 40, 41].includes(y)) continue;
    const x = fenceX(y) - 1; if ('.g'.includes(map[y][x])) set(x, y, 'F');
  }
  for (const y of [10, 23, 39]) for (let k = 1; k <= 2; k++) { const x = fenceX(y) - k; if ('.g'.includes(map[y][x])) set(x, y, 'F'); }
  // second line: a HESCO wall with watchtowers 4 tiles behind the fence, so the riflemen fight from a trench between
  // the sandbags and the wall. Gaps are left for the bridge roads and where the tanks / Humvees stand.
  // The line is continuous now: the only openings are the two tank positions (the tank itself plugs the gap) and the
  // roads, where a steel gate (J, in GATES) is the way through (row 9: north bridge road, 24-25: the avenue, 40-41: south).
  const gap = new Set([24, 25, 26, 27, 40, 41, 42, 43]);
  for (let y = 10; y <= 48; y++) { if (gap.has(y)) continue; const x = fenceX(y) - 4; if ('.g='.includes(map[y][x])) set(x, y, y % 6 === 0 ? 'G' : 'H'); }
  const roadGate = ys => { const x = Math.min(...ys.map(fenceX)) - 4; for (const y of ys) set(x, y, 'J'); GATES.push({ x, ys, open: false, idle: 0 }); };
  roadGate([9]); roadGate([24, 25]); roadGate([40, 41]);
  // the gaps in the outer north wall get gates too: the old north gate (x12-13) and the Frostpeak gate (x29-31)
  for (const xs of [[12, 13], [29, 30, 31]]) { for (const x of xs) set(x, 8, 'J'); GATES.push({ xs, y: 8, open: false, idle: 0 }); }
  // a band of barbed wire along the far bank: the horde wades out of the river into it and slows right down
  for (let y = 2; y <= 48; y++) { if ([8, 9, 24, 25, 40, 41].includes(y)) continue; const x = riverX(y) + half + 1; if (!SOLID.has(map[y][x])) set(x, y, 'B'); }
  // the logistics yard (the old gun line south of the compound): warehouses, ammo, fuel, water, the maintenance hangar
  rect(2, 43, 11, 48, 'h'); rect(15, 43, 29, 48, 'h');
  rect(15, 43, 21, 44, 'R'); front(15, 45, 'WwDDDwW'); rect(23, 43, 29, 44, 'R'); front(23, 45, 'WwwDDwW');   // warehouses
  for (let x = 3; x <= 10; x += 2) set(x, 47, 'z'); set(3, 44, '5'); set(4, 44, '5'); set(9, 44, '&'); set(16, 48, 'z'); set(26, 48, 'z');
  rect(30, 43, 35, 44, 'R'); front(30, 45, 'WDDDDW');           // maintenance hangar

  // Bunkers (Y): inside the base's east gate and on the safe bank beside each gated bridge (BUNKER_SPOTS in data.js)
  for (const [bx, by] of BUNKER_SPOTS) set(bx, by, 'Y');

  for (let x = 0; x < MW; x++) { const c = x < 48 ? 'T' : '#'; set(x, 0, c); set(x, MH - 1, c); }
  for (let y = 0; y < MH; y++) { set(0, y, 'T'); set(MW - 1, y, '#'); }
})();
MW = WW;
map = map.map(row => [...Array(OX).fill('.'), ...row]);
for (const g of GATES) { if (g.xs) g.xs = g.xs.map(x => x + OX); else g.x += OX; }
const world = map;
// ================= The west wing (new land, x 0 .. OX-1, NEW coordinates) =================
// FOB Ironvale's west wing fills the new ground between the old compound and a mountain ridge (x 1-9) on the far
// west edge. The only way in from the west is the road tunnel bored through that ridge (rows 24-25, TUNNEL), which
// carries the main avenue in from the edge of the map. Layout of the wing (x 11-50, y 9-48):
//   NW brigade HQ + barracks · NE vehicle depot (hangars, trucks, fuel) · SW training ground (range, obstacle lines,
//   tents) · SE: Ironvale Army Airfield (the base's centre) · south: the M198 artillery park (rear line). Roads: the avenue (rows 24-25),
//   a north-south road (x 30-31), the east-west road (rows 41-42). The old compound's west wall (x 51) came down.
const TUNNEL = { x0: 1, x1: 9, y0: 24, y1: 25 };            // tiles: the road through the ridge (mountains.js draws the bore)
(function genWest() {
  let seed = 5150;
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < WW && y < WH) world[y][x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const front = (x0, y, pat) => [...pat].forEach((c, i) => set(x0 + i, y, c));
  // ground: open grass in the north half, the western woods south of the base
  for (let y = 1; y < WH - 1; y++) for (let x = 1; x <= OX; x++) set(x, y, y >= 50 ? (r() < 0.3 ? 'T' : '.') : '.');
  for (let y = 0; y < WH; y++) set(0, y, 'T');
  for (let x = 0; x <= OX; x++) { set(x, 0, 'T'); set(x, WH - 1, 'T'); }
  // the old compound's west wall and the old map edge are gone: the base is one long compound now
  for (let y = 9; y <= 48; y++) set(OX + 1, y, '.');
  for (let y = 50; y < WH - 1; y++) if (world[y][OX + 1] !== 't') set(OX + 1, y, 't');       // the farm keeps its west fence
  // west wing walls: north (row 8) and south (row 49) run on from the old ones, the west wall stands on x 10
  for (let x = 10; x <= OX + 1; x++) { set(x, 8, 'H'); set(x, 49, 'H'); }
  for (let y = 8; y <= 49; y++) set(10, y, 'H');
  for (const x of [10, 18, 26, 34, 42, 50]) { set(x, 8, 'G'); set(x, 49, 'G'); }
  for (const y of [16, 23, 26, 33, 41]) set(10, y, 'G');
  for (const y of [24, 25]) set(10, y, 'J');                     // the steel gate where the tunnel road enters the base
  // roads: the avenue in from the tunnel, the north-south road, the east-west road
  for (let x = 0; x <= OX + 1; x++) for (const y of [24, 25]) if (x !== 10) set(x, y, '=');
  GATES.push({ x: 10, ys: [24, 25], open: false, idle: 0 });
  for (let y = 9; y <= 48; y++) for (const x of [30, 31]) set(x, y, '=');
  for (let x = 11; x <= OX + 1; x++) for (const y of [41, 42]) set(x, y, '=');
  // NW: brigade HQ, two barracks blocks and a flagpole
  rect(13, 10, 27, 11, 'R'); front(13, 12, 'WwwwwwwDwwwwwwW');
  rect(13, 15, 19, 16, 'N'); front(13, 17, 'WwwDwwW');
  rect(21, 15, 27, 16, 'N'); front(21, 17, 'WwwDwwW');
  rect(13, 19, 27, 22, 'g'); set(20, 20, 'p');                  // parade ground + flag
  // NE: vehicle depot
  rect(33, 10, 40, 11, 'R'); front(33, 12, 'WDDDDDDW');
  rect(42, 10, 48, 11, 'R'); front(42, 12, 'WDDDDDW');
  rect(33, 14, 48, 21, 'h');                                    // asphalt apron
  for (const x of [34, 37, 40, 43]) { set(x, 16, '1'); set(x + 1, 16, '2'); }
  for (const [x, y] of [[46, 18], [47, 18], [46, 20], [47, 20]]) set(x, y, '5');
  // SW: training ground (firing lanes, obstacle lines) and the training company's tents
  rect(12, 27, 28, 39, 'g');
  for (let y = 28; y <= 34; y += 3) for (let x = 14; x <= 22; x += 4) set(x, y, 'F');
  for (const y of [28, 31, 34]) set(27, y, '7');
  rect(13, 37, 16, 38, 'I'); rect(19, 37, 22, 38, 'I'); rect(25, 37, 27, 38, 'I');
  // centre of the base: Ironvale Army Airfield (x 33-49, y 26-40). A concrete apron with four marked helipads
  // (HELI_PADS, raidforce.js: two AH-64Ds, the UH-60 C2 command helicopter, the FPV drone team), the aviation
  // hangar, the control tower with its radar mast, and the aviation fuel point
  rect(33, 26, 49, 40, 's');
  rect(46, 27, 49, 28, 'R'); front(46, 29, 'WDDW');              // hangar
  set(47, 32, 'G'); set(48, 32, '6');                            // control tower + radar
  for (const [x, y] of [[46, 37], [47, 37], [46, 39], [47, 39]]) set(x, y, '5');   // aviation fuel
  // south (rows 43-47): the artillery park, the M198 gun pits and their sandbag rings (artillery.js)
  // the tunnel's gatehouse: sandbags flanking the road where it leaves the west wall
  for (const y of [22, 27]) for (let x = 11; x <= 13; x++) set(x, y, 'F');
})();
// inside FOB Ironvale (the base and the strip north of it), in world pixels
const inBasePx = (px, py) => px < (26 + OX) * T && py < 43 * T;   // includes the whole west wing
// the outer yard of the expanded base: from the inner compound east to the river fence, plus the gun line south of
// the compound down to the farm fence (and the strip north of the base). It plays like the old grass field.
const inFieldPx = (px, py) => (px >= (26 + OX) * T && px < (43 + OX) * T && py < 49 * T) || (px < (26 + OX) * T && py >= 43 * T && py < 50 * T);
// safe zone: the base, plus the grass field while no world boss or zombie invasion is fighting there.
// Safe = weapon holstered, fast HP/MP regen, free ammo refill, and monsters won't go after you.
// the Survivor Farm: everything west of the river in the south half (Sector 6)
const inFarmPx = (px, py) => px < (42 + OX) * T && py >= 50 * T;   // (the western woods count as the farm's safe ground)
const safeAt = (px, py) => inWorld() && (inBasePx(px, py) || inFarmPx(px, py) || (inFieldPx(px, py)
  && !(typeof worldBoss === 'function' && worldBoss()) && !(typeof inv !== 'undefined' && inv.state !== 'idle')));
const solidAt = (tx, ty) => tx < 0 || ty < 0 || tx >= MW || ty >= MH || SOLID.has(map[ty][tx])
  || (typeof buildSolidAt === 'function' && buildSolidAt(tx, ty));      // walls, turrets etc. built by the player
function blocked(x, y, w, h, isEnemy) {
  const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 1) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty) || (isEnemy && inWorld() && ((tx <= 25 + OX && ty <= 42) || (tx <= 41 + OX && ty >= 50)))) return true;   // monsters never enter the base or the farm
  if (inWorld() && typeof TANKS !== 'undefined' && tankBlocks(x, y, w, h)) return true;
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

// ---- Bridge gates ----
// Closed gates (J) are solid for everyone, so zombies can't cross. Stand next to one and press E to
// open it; it swings shut on its own once nobody has stood in the gateway for a few seconds.
// The player's auto farm opens a gate itself when it walks up to one; bots never leave the safe side.
const GATE_IDLE_CLOSE = 300;
const gateBox = g => g.xs
  ? ({ x: g.xs[0] * T, y: g.y * T, w: g.xs.length * T, h: T })
  : ({ x: g.x * T, y: g.ys[0] * T, w: T, h: g.ys.length * T });
const gateCenter = g => g.xs
  ? ({ x: (g.xs[0] + g.xs.length / 2) * T, y: g.y * T + 8 })
  : ({ x: g.x * T + 8, y: (g.ys[0] + g.ys.length / 2) * T });
function nearGate() {
  if (!inWorld()) return null;
  const cx = p.x + 6, cy = p.y + 6;
  return GATES.find(g => { const c = gateCenter(g); return Math.abs(c.x - cx) < 28 && Math.abs(c.y - cy) < 26; }) || null;
}
function setGate(g, open) {
  if (g.broken) return;                                  // smashed by the horde: a rubble gap until the engineers rebuild it (invasion.js)
  g.open = open; g.idle = 0;
  if (g.xs) for (const x of g.xs) world[g.y][x] = open ? 'j' : 'J';
  else for (const y of g.ys) world[y][g.x] = open ? 'j' : 'J';
  miniFor = null;                                        // repaint the minimap
}
function gateBusy(g) {                                   // someone standing in the gateway?
  const b = gateBox(g);
  if (mode === 'play' && overlap(b, p)) return true;
  if (enemies.some(e => !e.dead && overlap(b, e))) return true;
  return typeof bots !== 'undefined' && bots.some(o => o.state !== 'dead' && overlap(b, o));
}
function toggleGate(g) {
  if (g.open && gateBusy(g)) { float(p.x + 6, p.y - 10, 'BLOCKED!', '#ff8080'); return sfx('no'); }
  setGate(g, !g.open);
  const c = gateCenter(g);
  float(c.x, c.y - 18, g.open ? 'GATE OPEN' : 'GATE CLOSED', g.open ? '#58e858' : '#ff9060');
  sfx(g.open ? 'unsheathe' : 'sheathe'); addShake(2);
}
// called every frame on the overworld: helpers open gates they walk up to, idle gates close
function updateGates() {
  for (const g of GATES) {
    if (g.broken) continue;
    const c = gateCenter(g);
    if (!g.open) {
      const near = o => Math.abs(o.x + 6 - c.x) < 26 && Math.abs(o.y + 6 - c.y) < 24;
      if (p.auto && mode === 'play' && near(p)) setGate(g, true);
      if (typeof bots !== 'undefined' && bots.some(b => b.state === 'raid' && near(b))) setGate(g, true);   // a raid party crossing to the world boss
      continue;
    }
    if (gateBusy(g)) g.idle = 0;
    else if (++g.idle > GATE_IDLE_CLOSE) { setGate(g, false); if (Math.hypot(p.x - c.x, p.y - c.y) < 200) { float(c.x, c.y - 18, 'GATE CLOSED', '#ff9060'); sfx('sheathe'); } }
  }
}

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
  p.x = riftReturn ? riftReturn.x : (17 + OX) * T + 2; p.y = riftReturn ? riftReturn.y : 18 * T + 2;
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
const MINI_COL = { '3':'#3c8a30', '-':'#8a6c44', t:'#8a5a2c', '^':'#a83a2a', '9':'#9ad0b0', '+':'#c8a440', '*':'#d8b850', '&':'#6a7a8a', '$':'#b8302a', '0':'#c8a440', '4':'#e8e4d8', '8':'#a83a2a', g:'#6c685a', h:'#33363c', H:'#b09a6a', N:'#4a5636', I:'#9c8a60', p:'#c8ccd4', '1':'#7e7050', '2':'#4c5a34', z:'#3e4c2c', '5':'#a83a2a', '6':'#9aa0aa', '7':'#d8c89c', '.':'#386a2e', f:'#4e3c2a', ',':'#262e24', '=':'#484c54', s:'#6c7078', '~':'#2a5cb8', J:'#ff9040', j:'#8a94a2', Y:'#3e463a', x:'#68f040', B:'#a8b2c2', b:'#8a94a2',
  T:'#2d4625', P:'#1a2a16', r:'#787890', '#':'#34344a', R:'#323842', W:'#606874', w:'#606874', D:'#606874', F:'#8a785a',
  M:'#7a8696', G:'#d8a848', Y:'#4c5646', O:'#8a8a9a', S:'#60c0ff', E:'#ff60ff', Q:'#14482a', K:'#14482a', d:'#4a4858', L:'#ff9030', '<':'#a0e0ff', '>':'#ff60ff', C:'#f8c838', c:'#806020', A:'#60f0ff', a:'#506070',
  u:'#241838', U:'#5a3478', V:'#c040ff', '|':'#16181c',
  '%':'#2e3136', ':':'#5a5c60', ';':'#5a6a50', '"':'#18181a', '(':'#7a7e86', ')':'#d8b020', '{':'#4a3a34', '}':'#8a4a34', '[':'#5a606a',
  ']':'#a83030', '/':'#1a1c22', '!':'#9aa0aa', '?':'#2e5a3a', '@':'#b4b4aa' };
let miniC = null, miniFor = null, seen = null;
function miniPixel(x, y) {
  const g = miniC.getContext('2d'), c = MINI_COL[map[y][x]];
  g.fillStyle = c || '#14121c'; g.fillRect(x, y, 1, 1);
}
function syncMini() {
  if (miniFor === map) return;
  miniFor = map; miniC = mk(); miniC.width = MW; miniC.height = MH;
  const g = miniC.getContext('2d'); g.fillStyle = '#060a04'; g.fillRect(0, 0, MW, MH);
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
  if (bw > 100) drawMap.last = { bx, by, bw, bh, dx, dy, ox, oy, scale };   // the big map: lets the observer click to jump (spectator.js)
  ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  ctx.fillStyle = '#060a04'; ctx.fillRect(bx, by, bw, bh);
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
  if (typeof spec !== 'undefined' && spec) {                          // observer: the camera's view box instead of a "you" dot
    ctx.strokeStyle = '#60e0ff'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(dx - ox + camx / T * scale) + 0.5, Math.round(dy - oy + camy / T * scale) + 0.5, Math.round(VW / T * scale), Math.round(VH / T * scale));
  } else if (frame % 40 < 30) dot(p.x + 6, p.y + 6, '#ffffff', Math.max(2, scale + 1));
  ctx.restore();
}
