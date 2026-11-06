// ================= Core Constants & Graphics =================
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
// VW/VH: the game's pixel resolution. It follows the window (see fitScreen in ui.js); 320x240 is the minimum,
// and every menu is laid out in a 320x240 box that gets centred on screen.
let VW = 320, VH = 240;
const T = 16, SWING = 14, BAG = 20, WW = 210, WH = 90;   // overworld size in tiles (was 88x50, then 160x90)
// The world grew OX tiles to the WEST (the base's west wing, the mountain ridge with the road tunnel). Everything laid
// out before that sits OX tiles further east: positions written in the old tile numbers are shifted with + OX.
const OX = 50;
let MW = WW, MH = WH;   // current map size (overworld or dungeon floor)
const FONT = '8px "Press Start 2P", monospace', BIG = '16px "Press Start 2P", monospace';
ctx.imageSmoothingEnabled = false;
const R = Math.random, ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const PAL = { K:'#000000', W:'#ffffff', S:'#fcb494', A:'#9a9aac', H:'#d0d0e0', B:'#3a5ac8', Y:'#f8c838',
  R:'#c83030', G:'#58a838', g:'#7ad858', N:'#6c6c80', D:'#7a4a1c', O:'#4c8c3c', V:'#7040a0', E:'#ff3838',
  T:'#1e6a2a', t:'#3a9a3a', p:'#14482a', q:'#2a6a3a', M:'#5c5c6c',
  // Military post & biohazard foliage tones:
  d:'#4a2e12', k:'#121418', m:'#242830', l:'#5a6474', u:'#30343e', z:'#2d4625', y:'#486c36', w:'#709848', x:'#1a2a16' };
function mk(n = 16) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
function art(rows, s = 2, base, pal = PAL) {
  const c = base || mk(rows[0].length * s), g = c.getContext('2d');
  if (!base) c.height = rows.length * s;
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') { g.fillStyle = pal[r[x]]; g.fillRect(x*s, y*s, s, s); } });
  return c;
}
function paint(fn) { const c = mk(); fn(c.getContext('2d')); return c; }
function speck(g, c, n, s) {
  g.fillStyle = c; let v = s * 977;
  for (let i = 0; i < n; i++) {
    v = (v * 9301 + 49297) % 233280; const x = Math.floor(v / 233280 * 15);
    v = (v * 9301 + 49297) % 233280; const y = Math.floor(v / 233280 * 15);
    g.fillRect(x, y, i % 2 ? 1 : 2, 1);
  }
}
const gGrass = s => g => { g.fillStyle = '#386a2e'; g.fillRect(0, 0, 16, 16); speck(g, '#4c7e3c', 5, s); speck(g, '#284a20', 4, s + 7); speck(g, '#4e4232', 3, s + 13); };
const gDark  = s => g => { g.fillStyle = '#262e24'; g.fillRect(0, 0, 16, 16); speck(g, '#364234', 5, s); speck(g, '#1a2018', 4, s + 7); speck(g, '#3e3226', 3, s + 11); };
// Modern Asphalt Highway / Street with painted yellow dashed lines
const gPath  = s => g => {
  g.fillStyle = '#26292e'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#484c54'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); // concrete curbs
  g.fillStyle = '#e8b828'; g.fillRect(1, 7, 5, 2); g.fillRect(9, 7, 5, 2);    // yellow dashed centerline
  speck(g, '#383c44', 4, s); speck(g, '#1a1c20', 3, s + 3);
};
// Modern Concrete Sidewalk & Plaza slabs with expansion joints
const gRuin  = s => g => {
  g.fillStyle = '#6c7078'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#4c5058'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(s % 2 ? 5 : 9, 0, 1, 7); g.fillRect(s % 2 ? 11 : 3, 8, 1, 7);
  speck(g, '#848a94', 3, s);
  if (s === 1) { g.fillStyle = '#383c42'; g.fillRect(5, 5, 6, 6); g.fillStyle = '#585c64'; g.fillRect(6, 6, 4, 4); } // round steel manhole cover
};
// Overhauled 8x8 pixel-art trees: multi-layered foliage, shadow depth & rough bark trunks
// TREE: Lush deciduous quarantine zone oak with highlights, depth, and rooted wooden trunk
const TREE = [
  '..wwyy..',
  '.wyyyzy.',
  'wyyzzyzy',
  'yyzzxzzy',
  'yzzxxxzy',
  '.yyzzzy.',
  '..dDdd..',
  '..ddDd..'
];
// PINE: Dark tactical conifer with conical pine tiers, needles and needle shadow
const PINE = [
  '...qq...',
  '..qttq..',
  '..qqpp..',
  '.qqtppq.',
  '.qqppxp.',
  'qqtppxpq',
  '..dDdd..',
  '..ddDd..'
];
// Destroyed modern civilian vehicle / rusted roadblock
const CAR_WRECK = ['........','..KKKK..','.AEEREE.','AKEEEKEA','AEEEEEEA','AAAAAAAA','.KK..KK.','........'];

const TILES = {
  '.': [1, 2, 3].map(s => paint(gGrass(s))),
  // Battlefield shell crater, scorched mud & spent brass casings
  'f': [1, 2].map(s => paint(g => {
    gGrass(s + 3)(g);
    g.fillStyle = '#3c3024'; g.fillRect(2, 3, 12, 10); g.fillRect(4, 2, 8, 12);
    g.fillStyle = '#241e18'; g.fillRect(4, 5, 8, 6); g.fillRect(5, 4, 6, 8);
    g.fillStyle = '#14100e'; g.fillRect(6, 6, 4, 4);
    g.fillStyle = '#7a1c1c'; g.fillRect(s === 1 ? 3 : 10, 9, 3, 2); // bloodstain
    g.fillStyle = '#e8b828'; g.fillRect(2, 4, 2, 1); g.fillRect(12, 11, 2, 1); // spent brass shells
  })),
  ',': [1, 2, 3].map(s => paint(gDark(s))),
  '=': [1, 2].map(s => paint(gPath(s))),
  's': [1, 2, 3].map(s => paint(gRuin(s))),
  // River / canal / ponds: ordinary clean water (solid, deep). Two frames of drifting ripples.
  '~': [0, 1].map(f => paint(g => {
    g.fillStyle = '#1e4a9c'; g.fillRect(0, 0, 16, 16);                        // deep water
    g.fillStyle = '#2a5cb8'; g.fillRect(0, 2, 16, 5); g.fillRect(0, 9, 16, 5);  // lighter current bands
    g.fillStyle = '#6aa0e8';                                                    // ripples
    if (f) { g.fillRect(3, 4, 5, 1); g.fillRect(9, 11, 5, 1); }
    else   { g.fillRect(2, 5, 5, 1); g.fillRect(8, 10, 5, 1); }
    g.fillStyle = '#d0ecff';                                                    // glints of light
    if (f) { g.fillRect(5, 3, 2, 1); g.fillRect(12, 7, 1, 1); g.fillRect(3, 12, 1, 1); }
    else   { g.fillRect(10, 3, 2, 1); g.fillRect(4, 10, 1, 1); g.fillRect(12, 12, 1, 1); }
  })),
  // Walkable Toxic Biohazard Sludge Puddle (poisons & slows anyone wading through)
  'x': [0, 1].map(f => paint(g => {
    gDark(6)(g);
    g.fillStyle = '#1a3c1c'; g.fillRect(2, 3, 12, 10); g.fillRect(1, 5, 14, 6);
    g.fillStyle = '#389828'; g.fillRect(3, 4, 10, 8); g.fillRect(2, 6, 12, 4);
    g.fillStyle = '#68f040'; g.fillRect(5, 5, 6, 5);
    g.fillStyle = '#c0ff80'; // bubbling toxic gas
    if (f) { g.fillRect(6, 6, 2, 2); g.fillRect(10, 8, 1, 1); }
    else { g.fillRect(8, 5, 2, 2); g.fillRect(5, 9, 1, 1); }
  })),
  // Walkable Battlefield Barbed / Concertina Razor Wire Entanglement (slows & bleeds)
  'B': [1, 2].map(s => paint(g => {
    gGrass(s + 5)(g);
    g.fillStyle = '#3e3224'; g.fillRect(0, 5, 16, 7); // muddy trench strip beneath wire
    // wooden X-pickets / steel stakes at left & right
    g.fillStyle = '#5c3c20';
    g.fillRect(2, 3, 2, 10); g.fillRect(12, 3, 2, 10);
    g.fillStyle = '#3a2412';
    g.fillRect(1, 5, 4, 2); g.fillRect(11, 5, 4, 2);
    // coiled steel razor wire loops across the tile
    g.fillStyle = '#6e7684';
    g.fillRect(0, 6, 16, 4);
    g.fillStyle = '#a8b2c2';
    for (let wx = 1; wx < 15; wx += 3) { g.fillRect(wx, 4, 2, 2); g.fillRect(wx + 1, 9, 2, 2); }
    // razor-sharp barbs & bloodstains
    g.fillStyle = '#ffffff';
    g.fillRect(3, 4, 1, 1); g.fillRect(7, 5, 1, 1); g.fillRect(10, 4, 1, 1); g.fillRect(13, 6, 1, 1);
    g.fillRect(5, 9, 1, 1); g.fillRect(11, 9, 1, 1);
    g.fillStyle = '#981e1e';
    g.fillRect(6, 7, 2, 2); g.fillRect(12, 8, 2, 1);
  })),
  // Reinforced concrete highway overpass bridge with yellow line and steel crash barriers
  'b': [paint(g => {
    g.fillStyle = '#22252a'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#8a94a2'; g.fillRect(0, 0, 16, 2); g.fillRect(0, 14, 16, 2); // steel crash guardrails
    g.fillStyle = '#f8c838'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 9, 16, 1);   // double yellow dividing line
    g.fillStyle = '#ff4040'; g.fillRect(4, 0, 2, 2); g.fillRect(12, 0, 2, 2); g.fillRect(4, 14, 2, 2); g.fillRect(12, 14, 2, 2); // reflectors
  })],
  'T': [art(TREE, 2, paint(gGrass(5)))],
  'P': [art(PINE, 2, paint(gDark(5)))],
  'r': [art(CAR_WRECK, 2, paint(gRuin(5)))],
  // Collapsed modern reinforced concrete debris with exposed rebar
  '#': [paint(g => {
    g.fillStyle = '#3c4048'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#282b32'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(3, 8, 1, 7); g.fillRect(11, 8, 1, 7);
    g.fillStyle = '#a84c20'; g.fillRect(3, 4, 2, 5); g.fillRect(11, 2, 2, 6); // exposed rusted rebar
    g.fillStyle = '#e8b828'; g.fillRect(0, 0, 4, 2); g.fillRect(8, 0, 4, 2);   // yellow hazard stripe
  })],
  // Modern corrugated industrial metal roof with rooftop solar panels
  'R': [paint(g => {
    g.fillStyle = '#323842'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#22262e'; [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1));
    g.fillStyle = '#4c5664'; g.fillRect(3, 4, 10, 7); g.fillStyle = '#2080c0'; g.fillRect(4, 5, 8, 5);
  })],
};
const wall = g => {
  g.fillStyle = '#484e58'; g.fillRect(0, 0, 16, 16); // concrete prefab barrack wall
  g.fillStyle = '#32363e'; g.fillRect(0, 0, 2, 16); g.fillRect(14, 0, 2, 16); g.fillRect(0, 14, 16, 2);
  g.fillStyle = '#606874'; g.fillRect(2, 2, 12, 1);
};
TILES.W = [paint(wall)];
TILES.w = [paint(g => {
  wall(g);
  g.fillStyle = '#181c22'; g.fillRect(3, 3, 10, 8); // security window frame
  g.fillStyle = '#4080a8'; g.fillRect(4, 4, 8, 6); // reinforced glass
  g.fillStyle = '#a0d8ff'; g.fillRect(5, 5, 2, 2);
})];
TILES.D = [paint(g => {
  wall(g);
  g.fillStyle = '#262a32'; g.fillRect(4, 3, 8, 13); // steel blast security door
  g.fillStyle = '#7a8494'; g.fillRect(4, 3, 8, 1); g.fillRect(4, 3, 1, 13);
  g.fillStyle = '#58d858'; g.fillRect(10, 8, 1, 1); // access keypad
  g.fillStyle = '#e84030'; g.fillRect(10, 10, 1, 1);
})];
// Modern military sandbag fortification with yellow hazard tape
TILES.F = [paint(g => {
  gGrass(6)(g);
  g.fillStyle = '#8a785a'; g.fillRect(1, 4, 14, 10);
  g.fillStyle = '#6a5a40'; g.fillRect(1, 8, 14, 1); g.fillRect(6, 4, 1, 4); g.fillRect(11, 4, 1, 4);
  g.fillRect(4, 9, 1, 5); g.fillRect(9, 9, 1, 5);
  g.fillStyle = '#f8c838'; g.fillRect(0, 2, 16, 2); // hazard barricade tape
  g.fillStyle = '#1a1a20'; g.fillRect(2, 2, 3, 2); g.fillRect(8, 2, 3, 2); g.fillRect(14, 2, 2, 2);
})];
// Industrial fuel storage cistern / bio-decontamination tank
TILES.O = [paint(g => {
  gRuin(7)(g);
  g.fillStyle = '#3a4450'; g.fillRect(2, 2, 12, 12);
  g.fillStyle = '#566476'; g.fillRect(3, 3, 10, 10);
  g.fillStyle = '#262d36'; g.fillRect(2, 5, 12, 2); g.fillRect(2, 9, 12, 2);
  g.fillStyle = '#ffd838'; g.fillRect(6, 6, 4, 4); // biohazard symbol
  g.fillStyle = '#000000'; g.fillRect(7, 7, 2, 2);
})];
// High-security military perimeter security fence with chain-link mesh and double-coiled razor concertina wire
TILES.M = [paint(g => {
  gGrass(8)(g);
  // Ground dirt strip beneath security fence
  g.fillStyle = '#2c241a'; g.fillRect(0, 13, 16, 3);
  g.fillStyle = '#443828'; g.fillRect(0, 14, 16, 1);

  // Galvanized steel fence posts (tubular posts with Y-crank arm extension at top)
  g.fillStyle = '#545c68'; g.fillRect(1, 4, 2, 11); g.fillRect(14, 4, 2, 11);
  g.fillStyle = '#828e9e'; g.fillRect(1, 4, 1, 11); g.fillRect(14, 4, 1, 11);
  // Top, middle, bottom horizontal tension rails
  g.fillStyle = '#48505c'; g.fillRect(0, 5, 16, 1); g.fillRect(0, 9, 16, 1); g.fillRect(0, 13, 16, 1);
  g.fillStyle = '#7a8696'; g.fillRect(0, 5, 16, 1);

  // Heavy galvanized diamond chain-link wire mesh
  g.fillStyle = '#626c7a';
  for (let y = 6; y <= 13; y += 2) {
    for (let x = 0; x < 16; x += 2) {
      g.fillRect(x + (y % 4 === 0 ? 0 : 1), y, 1, 1);
    }
  }

  // Steel Y-bracket / outrigger arms at the top
  g.fillStyle = '#3a424e';
  g.fillRect(0, 3, 2, 2); g.fillRect(14, 3, 2, 2);
  g.fillRect(2, 4, 1, 1); g.fillRect(13, 4, 1, 1);

  // Large Coiled Razor Concertina Wire (Top coil & Lower coil rings - matching military perimeter spec)
  // Top prominent razor wire coil
  g.fillStyle = '#2a323c';
  g.fillRect(1, 1, 14, 4);
  g.fillStyle = '#8e9aa8';
  g.fillRect(2, 1, 12, 1); g.fillRect(1, 2, 14, 2); g.fillRect(2, 4, 12, 1);
  // Razor loops & spiral shading
  g.fillStyle = '#d2dce8';
  g.fillRect(3, 1, 3, 1); g.fillRect(8, 1, 3, 1); g.fillRect(13, 1, 2, 1);
  g.fillRect(2, 2, 2, 1); g.fillRect(7, 2, 2, 1); g.fillRect(12, 2, 2, 1);
  g.fillStyle = '#ffffff'; // razor blade glints
  g.fillRect(4, 2, 1, 1); g.fillRect(9, 2, 1, 1); g.fillRect(14, 2, 1, 1);
  g.fillRect(2, 4, 1, 1); g.fillRect(7, 4, 1, 1); g.fillRect(12, 4, 1, 1);

  // Lower secondary razor concertina wire coil attached to fence face
  g.fillStyle = '#3a4450';
  g.fillRect(1, 8, 14, 4);
  g.fillStyle = '#9aa8b8';
  g.fillRect(2, 8, 12, 1); g.fillRect(1, 9, 14, 2); g.fillRect(2, 11, 12, 1);
  g.fillStyle = '#e2ecf8';
  g.fillRect(4, 9, 2, 1); g.fillRect(9, 9, 2, 1); g.fillRect(14, 9, 1, 1);
  g.fillStyle = '#ffffff';
  g.fillRect(3, 10, 1, 1); g.fillRect(8, 10, 1, 1); g.fillRect(13, 10, 1, 1);

  // Tension wire strand & razor barb accents
  g.fillStyle = '#b8c4d2';
  g.fillRect(0, 0, 16, 1);
  g.fillStyle = '#ffffff';
  g.fillRect(3, 0, 1, 1); g.fillRect(7, 0, 1, 1); g.fillRect(11, 0, 1, 1); g.fillRect(15, 0, 1, 1);
})];
// Modern fortified military checkpoint bunker / outpost with steel slits & antenna (Tile 'Y')
TILES.Y = [paint(g => {
  gGrass(6)(g);
  // Camo concrete bunker walls
  g.fillStyle = '#252930'; g.fillRect(1, 2, 14, 13);
  g.fillStyle = '#3e463a'; g.fillRect(2, 3, 12, 11);
  g.fillStyle = '#4c5646'; g.fillRect(2, 3, 12, 3);
  // Emplacement embrasure slit (black vision slit)
  g.fillStyle = '#0e1014'; g.fillRect(4, 6, 8, 3);
  g.fillStyle = '#1c222a'; g.fillRect(5, 7, 6, 1);
  // Sandbag reinforcement skirting at the bottom
  g.fillStyle = '#8a785a'; g.fillRect(1, 10, 14, 5);
  g.fillStyle = '#6a5a40'; g.fillRect(1, 12, 14, 1); g.fillRect(5, 10, 1, 5); g.fillRect(10, 10, 1, 5);
  // Radio communications whip antenna
  g.fillStyle = '#9ea8b8'; g.fillRect(13, 0, 1, 4);
  g.fillStyle = '#ff4040'; g.fillRect(13, 0, 1, 1); // red beacon light on top
})];

// Modern steel observation watchtower with floodlight
TILES.G = [paint(g => {
  g.fillStyle = '#22252c'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#4c5260'; g.fillRect(1, 2, 14, 13);
  g.fillStyle = '#60e0ff'; g.fillRect(3, 4, 10, 3); // observation deck glass
  g.fillStyle = '#ffffff'; g.fillRect(7, 0, 2, 2); // halogen searchlight
  g.fillStyle = '#ffd838'; g.fillRect(5, 8, 6, 2); // hazard warning decal
  g.fillStyle = '#22252c'; g.fillRect(1, 12, 14, 3);
})];
// dungeon tiles: d floor, X wall, L torch wall, < up, > down, E overworld entrance, C/c chest
const gCrypt = s => g => {
  g.fillStyle = '#2c2a34'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#222028'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(s % 2 ? 5 : 9, 0, 1, 7); g.fillRect(s % 2 ? 11 : 3, 8, 1, 7);
  speck(g, '#3a3844', 3, s);
};
const cwall = g => {
  g.fillStyle = '#16141c'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#2a2634'; g.fillRect(0, 0, 7, 7); g.fillRect(8, 0, 8, 7); g.fillRect(0, 8, 3, 7); g.fillRect(4, 8, 7, 7); g.fillRect(12, 8, 4, 7);
  g.fillStyle = '#3a3646'; g.fillRect(0, 0, 7, 1); g.fillRect(8, 0, 8, 1); g.fillRect(4, 8, 7, 1);
};
TILES.d = [1, 2, 3].map(s => paint(gCrypt(s)));
TILES.X = [paint(cwall)];
TILES.L = [0, 1].map(f => paint(g => {
  cwall(g); g.fillStyle = '#7a4a1c'; g.fillRect(7, 8, 2, 6);
  g.fillStyle = '#ff6020'; g.fillRect(6, f ? 2 : 3, 4, 6); g.fillStyle = '#ffd040'; g.fillRect(7, f ? 4 : 5, 2, 3);
}));
const stairs = (base, down) => paint(g => {
  base(g);
  const cols = down ? ['#3a3646','#2a2634','#1c1a24','#0e0c14'] : ['#4a4660','#5a5670','#6a6680','#8a86a0'];
  for (let i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect(2, 2 + i * 3, 12, 3); }
});
TILES['<'] = [stairs(gCrypt(4), false)]; TILES['>'] = [stairs(gCrypt(4), true)]; TILES.E = [stairs(gRuin(4), true)];
const chest = open => paint(g => {
  gCrypt(5)(g);
  g.fillStyle = '#7a4a1c'; g.fillRect(2, 5, 12, 9); g.fillStyle = '#5a3010'; g.fillRect(2, 9, 12, 1);
  g.fillStyle = '#f8c838'; g.fillRect(2, 5, 1, 9); g.fillRect(13, 5, 1, 9); g.fillStyle = '#f8c838'; g.fillRect(7, 8, 2, 3);
  if (open) { g.fillStyle = '#0a0810'; g.fillRect(3, 5, 10, 4); g.fillStyle = '#7a4a1c'; g.fillRect(2, 1, 12, 4); }
});
TILES.C = [chest(false)]; TILES.c = [chest(true)];
// S is the personal Supply Depot crate in FOB Ironvale (olive drab with yellow ammo stencil)
TILES.S = [paint(g => {
  gRuin(6)(g);
  g.fillStyle = '#2d3b26'; g.fillRect(2, 5, 12, 9); g.fillStyle = '#1c2617'; g.fillRect(2, 9, 12, 1);
  g.fillStyle = '#f8c838'; g.fillRect(2, 5, 1, 9); g.fillRect(13, 5, 1, 9); g.fillRect(2, 5, 12, 1);
  g.fillStyle = '#f8c838'; g.fillRect(5, 7, 6, 2);
})];
// A/a is a Field Aid Station (military medical supply cache with red cross)
const shrine = active => paint(g => {
  gCrypt(6)(g);
  g.fillStyle = '#2d382b'; g.fillRect(2, 5, 12, 9);
  g.fillStyle = active ? '#ffffff' : '#687064'; g.fillRect(4, 6, 8, 7);
  g.fillStyle = active ? '#e83838' : '#884444';
  g.fillRect(7, 7, 2, 5); g.fillRect(5, 8, 6, 2);
  if (active) { g.fillStyle = '#58e858'; g.fillRect(2, 5, 2, 2); }
});
TILES.A = [shrine(true)]; TILES.a = [shrine(false)];
// ---- Abandoned city tiles (the east bank is a ruined city now; see world.js) ----
//   %  cracked street   :  faded crosswalk   ;  weeds through the pavement   "  scorched ground
//   (  rubble pile      )  wrecked taxi      {  tar roof   }  brick facade   [  boarded-up wall
//   ]  looted storefront   /  caved-in roof  !  broken street lamp   ?  dumpster   @  jersey barrier
const gCrack = s => g => {
  g.fillStyle = '#2a2d33'; g.fillRect(0, 0, 16, 16);
  speck(g, '#353940', 6, s); speck(g, '#1e2024', 4, s + 3);
  g.fillStyle = '#18191d';
  const v = (s * 37) % 11;
  g.fillRect(v % 8, 3 + (v % 5), 4, 1); g.fillRect(v % 8 + 3, 4 + (v % 5), 1, 3); g.fillRect(v % 8 + 4, 7 + (v % 5), 3, 1);
  if (s % 3 === 0) { g.fillStyle = '#4c6a34'; g.fillRect(v % 8 + 5, 6 + (v % 5), 1, 2); g.fillRect(v % 8 + 6, 7 + (v % 5), 1, 1); }
  if (s === 4) { g.fillStyle = '#141518'; g.fillRect(9, 10, 4, 3); g.fillStyle = '#22252a'; g.fillRect(10, 11, 2, 1); }   // pothole
};
TILES['%'] = [1, 2, 3, 4, 5, 6].map(s => paint(gCrack(s)));
TILES[':'] = [paint(g => { gCrack(2)(g); g.fillStyle = '#a8a8a0'; for (let x = 1; x < 16; x += 4) g.fillRect(x, 1, 2, 14); g.fillStyle = '#2a2d33'; g.fillRect(5, 6, 2, 3); g.fillRect(13, 10, 2, 2); })];
TILES[';'] = [1, 2, 3].map(s => paint(g => {
  gRuin(s + 2)(g);
  g.fillStyle = '#4c7e3c'; for (let i = 0; i < 5; i++) { const x = (s * 5 + i * 7) % 14, y = 1 + (s * 3 + i * 5) % 13; g.fillRect(x, y, 2, 1); g.fillRect(x + 1, y - 1, 1, 1); }
  g.fillStyle = '#386a2e'; g.fillRect((s * 4) % 12, 12, 4, 2); g.fillRect(2, (s * 6) % 12, 3, 2);
}));
TILES['"'] = [1, 2].map(s => paint(g => {
  gCrack(s + 2)(g);
  g.fillStyle = '#121214'; g.fillRect(2, 3, 12, 10); g.fillRect(4, 1, 8, 14); g.fillRect(0, 5, 16, 6);
  g.fillStyle = '#26262a'; g.fillRect(5, 5, 3, 2); g.fillRect(9, 9, 3, 2);
  g.fillStyle = '#5a5654'; g.fillRect(7, 7, 1, 1); g.fillRect(11, 4, 1, 1); g.fillRect(3, 9, 1, 1);
}));
TILES['('] = [1, 2].map(s => paint(g => {
  gRuin(s)(g);
  const chunk = (x, y, w, h) => { g.fillStyle = '#3e4148'; g.fillRect(x, y + 1, w, h); g.fillStyle = '#7a7e86'; g.fillRect(x, y, w, h - 1); g.fillStyle = '#9a9ea6'; g.fillRect(x, y, w, 1); };
  chunk(1, 6, 7, 6); chunk(7, 3, 7, 7); chunk(4, 10, 9, 5); chunk(s === 1 ? 10 : 0, 11, 5, 4);
  g.fillStyle = '#a84c20'; g.fillRect(9, 1, 1, 4); g.fillRect(12, 2, 1, 3); g.fillRect(3, 4, 1, 3);   // rebar
  g.fillStyle = '#2a2c30'; g.fillRect(6, 9, 2, 1); g.fillRect(11, 13, 2, 1);
}));
TILES[')'] = [paint(g => {
  gCrack(5)(g);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(1, 12, 15, 3);
  g.fillStyle = '#7a5a10'; g.fillRect(1, 4, 14, 9);
  g.fillStyle = '#d8b020'; g.fillRect(1, 4, 14, 7); g.fillStyle = '#f0d050'; g.fillRect(2, 4, 12, 1);
  g.fillStyle = '#141820'; g.fillRect(4, 5, 3, 4); g.fillRect(9, 5, 3, 4);               // smashed windows
  g.fillStyle = '#6a8aa0'; g.fillRect(4, 5, 1, 1); g.fillRect(10, 6, 1, 1);
  g.fillStyle = '#1a1a1a'; g.fillRect(6, 3, 4, 1); g.fillStyle = '#e8e8e8'; g.fillRect(7, 3, 2, 1);   // roof sign
  g.fillStyle = '#8a3a14'; g.fillRect(12, 8, 2, 2); g.fillRect(2, 9, 2, 1);               // rust
  g.fillStyle = '#101010'; g.fillRect(2, 12, 3, 2); g.fillRect(11, 12, 3, 2);             // tyres
})];
TILES['{'] = [1, 2].map(s => paint(g => {
  g.fillStyle = '#3e3430'; g.fillRect(0, 0, 16, 16);
  speck(g, '#4a3e38', 6, s); speck(g, '#2e2622', 4, s + 4);
  g.fillStyle = '#6a4e40'; g.fillRect(0, 0, 16, 1); g.fillStyle = '#2a201c'; g.fillRect(0, 15, 16, 1);
  if (s === 1) { g.fillStyle = '#6a6e76'; g.fillRect(4, 4, 6, 5); g.fillStyle = '#484c54'; g.fillRect(4, 8, 6, 1); g.fillStyle = '#2a2c30'; for (let x = 5; x < 10; x += 2) g.fillRect(x, 5, 1, 3); }   // dead AC unit
  else { g.fillStyle = '#5a6068'; g.fillRect(9, 3, 4, 4); g.fillStyle = '#2a2c30'; g.fillRect(10, 4, 2, 2); }                                                                  // roof vent
}));
const brick = g => {
  g.fillStyle = '#8a4a34'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#5e3224'; for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1);
  for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 2 : 6; x < 16; x += 8) g.fillRect(x, y, 1, 3);
  g.fillStyle = '#a05a40'; g.fillRect(0, 0, 16, 1);
};
const brickWindow = g => { brick(g); g.fillStyle = '#2a1a14'; g.fillRect(3, 4, 10, 8); g.fillStyle = '#10141a'; g.fillRect(4, 5, 8, 6); g.fillStyle = '#c8b8a0'; g.fillRect(3, 12, 10, 1); };
TILES['}'] = [1, 2].map(s => paint(g => {
  brickWindow(g);
  g.fillStyle = '#6a8aa0'; if (s === 1) { g.fillRect(4, 5, 2, 3); g.fillRect(6, 5, 1, 1); } else { g.fillRect(10, 8, 2, 3); }   // glass shards
}));
TILES['['] = [paint(g => {
  wall(g);
  g.fillStyle = '#181c22'; g.fillRect(3, 3, 10, 9);
  g.fillStyle = '#7a5a34'; g.fillRect(2, 4, 12, 2); g.fillRect(2, 9, 12, 2);                // boards nailed across
  g.fillStyle = '#5a4024'; g.fillRect(2, 5, 12, 1); g.fillRect(2, 10, 12, 1);
  g.fillStyle = '#b0b0b0'; g.fillRect(3, 4, 1, 1); g.fillRect(12, 9, 1, 1);
  g.fillStyle = '#c03030'; g.fillRect(5, 12, 6, 1); g.fillRect(7, 13, 1, 2);                // spray paint
})];
TILES[']'] = [1, 2].map(s => paint(g => {
  wall(g);
  for (let x = 0; x < 16; x += 4) { g.fillStyle = s === 1 ? '#a83030' : '#2a6a4a'; g.fillRect(x, 1, 2, 3); g.fillStyle = '#d8d0c0'; g.fillRect(x + 2, 1, 2, 3); }   // torn awning
  g.fillStyle = '#5a5a5a'; g.fillRect(s === 1 ? 10 : 2, 3, 4, 1);
  g.fillStyle = '#10141a'; g.fillRect(1, 6, 14, 8);                                          // looted shop window
  g.fillStyle = '#4a6a80'; g.fillRect(2, 7, 2, 4); g.fillRect(12, 6, 2, 2); g.fillRect(7, 12, 3, 2);   // broken glass
  g.fillStyle = '#2a2c30'; g.fillRect(5, 10, 3, 4);                                          // overturned shelf
}));
TILES['/'] = [paint(g => {
  g.fillStyle = '#323842'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#22262e'; [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1));
  g.fillStyle = '#0c0c10'; g.fillRect(3, 3, 10, 9); g.fillRect(5, 2, 6, 11);                // caved-in hole
  g.fillStyle = '#5a4030'; g.fillRect(2, 6, 12, 1); g.fillRect(8, 2, 1, 11);                 // broken beams
  g.fillStyle = '#4c5664'; g.fillRect(3, 12, 3, 2); g.fillRect(11, 3, 2, 2);
})];
TILES['!'] = [paint(g => {
  gRuin(3)(g);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(7, 13, 6, 2);
  g.fillStyle = '#3a3e46'; g.fillRect(6, 4, 2, 11); g.fillRect(5, 13, 4, 2);
  g.fillStyle = '#5a606a'; g.fillRect(6, 4, 1, 11);
  g.fillStyle = '#3a3e46'; g.fillRect(8, 2, 5, 2); g.fillRect(11, 4, 3, 2);                  // bent arm
  g.fillStyle = '#1a1a1a'; g.fillRect(12, 6, 2, 1);                                         // dead bulb
})];
TILES['?'] = [paint(g => {
  gRuin(4)(g);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(1, 13, 15, 2);
  g.fillStyle = '#1e3e28'; g.fillRect(1, 6, 13, 8); g.fillStyle = '#2e5a3a'; g.fillRect(1, 6, 13, 6);
  g.fillStyle = '#3e7a4a'; g.fillRect(0, 4, 15, 2);                                          // lid
  g.fillStyle = '#8a3a14'; g.fillRect(3, 9, 2, 2); g.fillRect(10, 8, 1, 3);
  g.fillStyle = '#141414'; g.fillRect(11, 11, 5, 4); g.fillStyle = '#2a2a2a'; g.fillRect(12, 11, 2, 1);   // trash bag
})];
TILES['@'] = [paint(g => {
  gCrack(1)(g);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 12, 16, 3);
  g.fillStyle = '#7a7a72'; g.fillRect(0, 6, 16, 7); g.fillStyle = '#b4b4aa'; g.fillRect(1, 4, 14, 4); g.fillStyle = '#d0d0c6'; g.fillRect(1, 4, 14, 1);
  g.fillStyle = '#e86a20'; g.fillRect(2, 8, 3, 2); g.fillRect(8, 8, 3, 2);                  // faded hazard paint
  g.fillStyle = '#4a4a44'; g.fillRect(5, 11, 1, 2); g.fillRect(12, 9, 2, 1);
})];
// secret: Q is a walk-through fake brick wall (looks just like '}' bar one mortar crack), K is the hidden crate
TILES.Q = [paint(g => { brickWindow(g); g.fillStyle = '#5e3224'; g.fillRect(13, 13, 1, 3); })];
// | : open bay door of the motor-pool vehicle garage (rolled-up shutter, dark bay, hazard-striped sill)
TILES['|'] = [paint(g => {
  g.fillStyle = '#16181c'; g.fillRect(0, 0, 16, 16);                                       // the bay inside
  g.fillStyle = '#20232a'; g.fillRect(0, 9, 16, 7);                                        // concrete floor
  g.fillStyle = '#7a808a'; g.fillRect(0, 0, 16, 4);                                        // rolled-up shutter
  g.fillStyle = '#4a505a'; g.fillRect(0, 1, 16, 1); g.fillRect(0, 3, 16, 1);
  g.fillStyle = '#ffe9a0'; g.fillRect(7, 5, 2, 1);                                         // ceiling lamp
  g.fillStyle = '#f8c838'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 15, 2, 1);        // hazard sill
  g.fillStyle = '#1a1a1a'; for (let x = 2; x < 16; x += 4) g.fillRect(x, 15, 2, 1);
})];
TILES.K = [paint(g => {
  gDark(6)(g);
  g.fillStyle = '#2a3224'; g.fillRect(2, 5, 12, 9); g.fillStyle = '#161c12'; g.fillRect(2, 9, 12, 1);
  g.fillStyle = '#f8c838'; g.fillRect(2, 5, 1, 9); g.fillRect(13, 5, 1, 9);
  g.fillStyle = '#ff9a30'; g.fillRect(6, 7, 4, 3);
})];
// Abyssal Rift tiles: u floor, U wall, V helipad
TILES.u = [1, 2, 3].map(s => paint(g => {
  g.fillStyle = '#181428'; g.fillRect(0, 0, 16, 16);
  speck(g, '#2a1a44', 8, s); speck(g, '#603090', 4, s + 1); speck(g, '#50c0e0', 2, s + 2);
}));
TILES.U = [paint(g => {
  g.fillStyle = '#0e0b1c'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#221538'; g.fillRect(1, 1, 14, 14);
  g.fillStyle = '#3a205a'; g.fillRect(2, 2, 12, 12);
  g.fillStyle = '#8a40d0'; g.fillRect(4, 3, 2, 10); g.fillRect(4, 7, 8, 2); g.fillRect(10, 5, 2, 8);
  g.fillStyle = '#50e0ff'; g.fillRect(4, 7, 2, 2); g.fillRect(10, 7, 2, 2);
})];
// V is the Extraction Helipad with yellow 'H' and runway beacons
TILES.V = [0, 1].map(f => paint(g => {
  g.fillStyle = '#262a34'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#383e4c'; g.fillRect(1, 1, 14, 14);
  g.fillStyle = '#f8c838';
  g.fillRect(4, 4, 2, 8); g.fillRect(10, 4, 2, 8); g.fillRect(6, 7, 4, 2);
  g.fillStyle = f ? '#ff3838' : '#ffaa30';
  g.fillRect(1, 1, 2, 2); g.fillRect(13, 1, 2, 2); g.fillRect(1, 13, 2, 2); g.fillRect(13, 13, 2, 2);
}));
// Bridge gate: J = closed steel gate (solid), j = open gateway (walkable). Toggled with E (world.js)
TILES.J = [paint(g => {
  g.fillStyle = '#22252a'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#4a505c'; g.fillRect(2, 0, 12, 16);                               // steel gate leaf
  g.fillStyle = '#2a2e36'; for (let x = 4; x < 14; x += 3) g.fillRect(x, 0, 1, 16); // vertical bars
  g.fillStyle = '#f8c838'; g.fillRect(2, 6, 12, 4);                                // hazard band
  g.fillStyle = '#181818'; for (let x = 2; x < 14; x += 4) g.fillRect(x, 6, 2, 4);
  g.fillStyle = '#8a94a2'; g.fillRect(0, 0, 2, 16); g.fillRect(14, 0, 2, 16);        // posts
  g.fillStyle = '#ff3030'; g.fillRect(0, 1, 2, 2); g.fillRect(14, 1, 2, 2);          // red "closed" lamps
})];
TILES.j = [paint(g => {
  g.fillStyle = '#22252a'; g.fillRect(0, 0, 16, 16);                                // bridge deck
  g.fillStyle = '#f8c838'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 9, 16, 1);
  g.fillStyle = '#8a94a2'; g.fillRect(0, 0, 2, 16);                                 // post
  g.fillStyle = '#4a505c'; g.fillRect(13, 0, 3, 16);                                // gate leaf slid open
  g.fillStyle = '#2a2e36'; g.fillRect(14, 0, 1, 16);
  g.fillStyle = '#40e060'; g.fillRect(0, 1, 2, 2);                                  // green "open" lamp
})];
// ---- FOB Ironvale military camp tiles ----
// g gravel yard · h motor-pool asphalt · H HESCO barrier wall · N barracks roof · I canvas tent
// p flagpole · 1/2 cargo truck (bed / cab) · z ammo crates · 5 fuel drums · 6 radio mast · 7 range target
const gGravel = s => g => {
  g.fillStyle = '#6c685a'; g.fillRect(0, 0, 16, 16);
  speck(g, '#827d6c', 7, s); speck(g, '#55524a', 6, s + 5); speck(g, '#948f7c', 3, s + 9);
};
TILES.g = [1, 2, 3].map(s => paint(gGravel(s)));
TILES.h = [1, 2, 3].map(s => paint(g => {
  g.fillStyle = '#33363c'; g.fillRect(0, 0, 16, 16);
  speck(g, '#3e4248', 5, s); speck(g, '#2a2c30', 4, s + 3);
  if (s === 2) { g.fillStyle = '#3a3d44'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 8, 16, 1); }   // slab joints
  if (s === 3) { g.fillStyle = '#1e2024'; g.fillRect(5, 6, 5, 3); g.fillRect(7, 9, 3, 2); }   // oil stain
}));
TILES.H = [1, 2].map(s => paint(g => {
  g.fillStyle = '#2a261c'; g.fillRect(0, 0, 16, 16);                             // gap / shadow between baskets
  g.fillStyle = '#b09a6a'; g.fillRect(0, 1, 16, 13);                             // sand-filled mesh basket
  g.fillStyle = '#cbb586'; g.fillRect(0, 1, 16, 3);                              // sunlit top fill
  g.fillStyle = '#857450'; g.fillRect(0, 11, 16, 3);
  g.fillStyle = '#5c5a52';                                                       // welded wire mesh
  for (let x = 0; x < 16; x += 4) g.fillRect(x, 1, 1, 13);
  for (let y = 5; y < 14; y += 4) g.fillRect(0, y, 16, 1);
  g.fillStyle = '#3a382e'; g.fillRect(s === 1 ? 15 : 7, 1, 1, 13);              // basket seam
  g.fillStyle = '#7a8a5a'; g.fillRect(2, 14, 3, 2); g.fillRect(10, 14, 4, 2);    // weeds at the base
}));
TILES.N = [1, 2].map(s => paint(g => {
  g.fillStyle = '#4a5636'; g.fillRect(0, 0, 16, 16);                             // olive corrugated roof
  g.fillStyle = '#5c6a44'; for (let x = 1; x < 16; x += 3) g.fillRect(x, 0, 1, 16);
  g.fillStyle = '#38422a'; for (let x = 2; x < 16; x += 3) g.fillRect(x, 0, 1, 16);
  g.fillStyle = '#6e7c52'; g.fillRect(0, 0, 16, 1);
  if (s === 2) { g.fillStyle = '#3a3e44'; g.fillRect(5, 5, 6, 5); g.fillStyle = '#5a6068'; g.fillRect(6, 6, 4, 3); }  // AC unit
}));
TILES.I = [1, 2].map(s => paint(g => {
  g.fillStyle = '#9c8a60'; g.fillRect(0, 0, 16, 16);                             // canvas tent
  g.fillStyle = '#b4a074'; g.fillRect(0, 0, 16, 7);                              // sunny slope
  g.fillStyle = '#6e5e3e'; g.fillRect(0, 7, 16, 2);                              // ridge pole
  g.fillStyle = '#86754e'; g.fillRect(s === 1 ? 4 : 11, 0, 1, 16);               // canvas seam
  g.fillStyle = '#5a4c30'; g.fillRect(0, 15, 16, 1);
}));
TILES.p = [0, 1].map(f => paint(g => {
  gGravel(4)(g);
  g.fillStyle = '#5a5850'; g.fillRect(5, 12, 6, 3);                              // concrete footing
  g.fillStyle = '#c8ccd4'; g.fillRect(7, 1, 2, 13);                              // pole
  g.fillStyle = '#ffd848'; g.fillRect(7, 0, 2, 1);
  g.fillStyle = '#3c5a2e'; g.fillRect(9, 1, f ? 6 : 5, 5); g.fillRect(9, 6, f ? 5 : 6, 1);   // waving olive flag
  g.fillStyle = '#ffd848'; g.fillRect(11, 3, 2, 2);                              // gold star
}));
const truck = cab => paint(g => {
  gGravel(5)(g);
  g.fillStyle = '#16181a'; g.fillRect(cab ? 1 : 2, 1, 5, 2); g.fillRect(cab ? 9 : 10, 1, 5, 2);    // tyres
  g.fillRect(cab ? 1 : 2, 13, 5, 2); g.fillRect(cab ? 9 : 10, 13, 5, 2);
  if (cab) {
    g.fillStyle = '#4c5a34'; g.fillRect(0, 3, 14, 10);                           // cab + hood (facing right)
    g.fillStyle = '#5e6e40'; g.fillRect(0, 3, 14, 2);
    g.fillStyle = '#28323a'; g.fillRect(3, 4, 4, 8);                             // windscreen
    g.fillStyle = '#6a8ca0'; g.fillRect(4, 5, 2, 3);
    g.fillStyle = '#2c3420'; g.fillRect(12, 4, 2, 8);                            // grille
    g.fillStyle = '#ffe070'; g.fillRect(13, 4, 1, 2); g.fillRect(13, 10, 1, 2);  // headlights
  } else {
    g.fillStyle = '#7e7050'; g.fillRect(1, 2, 15, 12);                           // canvas-covered cargo bed
    g.fillStyle = '#968660'; g.fillRect(1, 2, 15, 3);
    g.fillStyle = '#5e5238'; for (let x = 4; x < 16; x += 4) g.fillRect(x, 2, 1, 12);  // canvas hoops
    g.fillStyle = '#3a4426'; g.fillRect(0, 2, 1, 12);                            // tailgate
  }
});
TILES['1'] = [truck(false)]; TILES['2'] = [truck(true)];
TILES.z = [1, 2].map(s => paint(g => {
  gGravel(6)(g);
  const crate = (x, y, w, h) => {
    g.fillStyle = '#1e2616'; g.fillRect(x, y, w, h);
    g.fillStyle = '#3e4c2c'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = '#566640'; g.fillRect(x + 1, y + 1, w - 2, 1);
    g.fillStyle = '#e0b830'; g.fillRect(x + 2, y + Math.floor(h / 2), w - 4, 1);   // stencil band
  };
  crate(1, 7, 8, 8); crate(8, 8, 7, 7); crate(s === 1 ? 3 : 6, 1, 8, 7);
}));
TILES['5'] = [paint(g => {
  gGravel(7)(g);
  for (const [x, y, c] of [[1, 1, '#a83a2a'], [8, 1, '#3e4c2c'], [1, 8, '#3e4c2c'], [8, 8, '#a83a2a']]) {
    g.fillStyle = '#18181a'; g.fillRect(x, y, 7, 7);
    g.fillStyle = c; g.fillRect(x + 1, y + 1, 5, 5);
    g.fillStyle = '#d8d8d0'; g.fillRect(x + 2, y + 2, 1, 1);                      // bung cap
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 1, y + 1, 5, 1);
  }
})];
TILES['6'] = [0, 1].map(f => paint(g => {
  gGravel(8)(g);
  g.fillStyle = '#4a4c50'; g.fillRect(4, 11, 8, 4);                              // equipment shelter
  g.fillStyle = '#9aa0aa'; g.fillRect(7, 0, 2, 12);                              // lattice mast
  g.fillStyle = '#5a6068'; for (let y = 1; y < 12; y += 3) g.fillRect(6, y, 4, 1);
  g.fillStyle = '#c8ccd4'; g.fillRect(1, 15, 1, 1); g.fillRect(2, 13, 1, 2); g.fillRect(14, 15, 1, 1); g.fillRect(13, 13, 1, 2);  // guy wires
  g.fillStyle = f ? '#ff3030' : '#801818'; g.fillRect(7, 0, 2, 1);               // blinking aviation light
}));
TILES['7'] = [paint(g => {
  gGravel(9)(g);
  g.fillStyle = '#5a4026'; g.fillRect(2, 13, 2, 3); g.fillRect(12, 13, 2, 3);    // stand legs
  g.fillStyle = '#d8c89c'; g.fillRect(1, 1, 14, 12);                             // board
  g.fillStyle = '#26262a'; g.fillRect(6, 2, 4, 3); g.fillRect(4, 5, 8, 7);       // man-shaped silhouette
  g.fillStyle = '#d8c89c'; g.fillRect(7, 7, 2, 2);                               // scoring zone
  g.fillStyle = '#c03030'; g.fillRect(7, 3, 1, 1); g.fillRect(9, 9, 1, 1);       // bullet holes
})];
// ---- expansion tiles: 0 wheat field · 4 runway centreline (airfield) · 8 shipping container (harbor) ----
// Survivor farm (Sector 6): 0 ripe wheat · 3 vegetable beds · - dirt track · t wooden rail fence · ^ red barn roof
//   9 greenhouse · + scarecrow · * hay bales · & water tower · $ tractor   (walkable: 0 3 -)
TILES['0'] = [1, 2].map(s => paint(g => {
  g.fillStyle = '#6a5230'; g.fillRect(0, 0, 16, 16);                             // tilled soil between the rows
  for (let y = 0; y < 16; y += 4) {                                              // tidy rows of ripe golden wheat
    g.fillStyle = '#c8a440'; g.fillRect(0, y, 16, 3);
    g.fillStyle = '#e8c860'; for (let x = (y + s) % 2; x < 16; x += 2) g.fillRect(x, y, 1, 1);   // ears of grain
    g.fillStyle = '#9a7a2a'; g.fillRect(0, y + 2, 16, 1);
  }
}));
TILES['3'] = [1, 2, 3].map(s => paint(g => {
  g.fillStyle = '#5a4026'; g.fillRect(0, 0, 16, 16);                             // dark watered soil
  g.fillStyle = '#4a3420'; for (let y = 3; y < 16; y += 5) g.fillRect(0, y, 16, 1);   // furrows
  for (let y = 0; y < 16; y += 5) for (let x = (y + s) % 4; x < 16; x += 4) {    // leafy plants in rows
    g.fillStyle = '#3c8a30'; g.fillRect(x, y, 3, 3);
    g.fillStyle = '#6ac048'; g.fillRect(x, y, 2, 1);
    if (s === 3 && x % 8 === 0) { g.fillStyle = '#e04830'; g.fillRect(x + 1, y + 1, 1, 1); }  // ripe tomatoes
  }
}));
TILES['-'] = [1, 2].map(s => paint(g => {
  g.fillStyle = '#8a6c44'; g.fillRect(0, 0, 16, 16);                             // packed dirt track
  speck(g, '#a08058', 5, s); speck(g, '#6e5434', 5, s + 4);
  g.fillStyle = '#76603e'; g.fillRect(3, 0, 2, 16); g.fillRect(11, 0, 2, 16);    // cart wheel ruts
}));
TILES.t = [1, 2].map(s => paint(g => {
  gGrass(s + 3)(g);
  g.fillStyle = '#5a3a1c'; g.fillRect(1, 3, 3, 12); g.fillRect(12, 3, 3, 12);    // posts
  g.fillStyle = '#8a5a2c'; g.fillRect(0, 5, 16, 2); g.fillRect(0, 10, 16, 2);    // rails
  g.fillStyle = '#a87440'; g.fillRect(0, 5, 16, 1); g.fillRect(0, 10, 16, 1);
}));
TILES['^'] = [1, 2].map(s => paint(g => {
  g.fillStyle = '#8a2a20'; g.fillRect(0, 0, 16, 16);                             // red barn roof
  g.fillStyle = '#a83a2a'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 2, 16);
  g.fillStyle = '#c24a34'; g.fillRect(0, 0, 16, 1);
  if (s === 2) { g.fillStyle = '#d8d0c0'; g.fillRect(6, 5, 4, 5); g.fillStyle = '#5a4a3a'; g.fillRect(7, 6, 2, 3); }  // hay loft hatch
}));
TILES['9'] = [1, 2].map(s => paint(g => {
  g.fillStyle = '#2a3a2a'; g.fillRect(0, 0, 16, 16);                             // greenhouse frame
  g.fillStyle = '#9ad0b0'; g.fillRect(1, 1, 14, 14);                             // misted glass
  g.fillStyle = '#4c9a50'; for (let x = 2; x < 15; x += 4) g.fillRect(x, 6 + (x + s) % 3, 3, 6);   // plants inside
  g.fillStyle = '#d8f0e0'; g.fillRect(2, 2, 4, 1); g.fillRect(2, 2, 1, 3);       // glare
  g.fillStyle = '#2a3a2a'; g.fillRect(7, 1, 1, 14); g.fillRect(1, 7, 14, 1);
}));
TILES['+'] = [paint(g => {
  TILES['0'][0] && g.drawImage(TILES['0'][0], 0, 0);
  g.fillStyle = '#5a3a1c'; g.fillRect(7, 4, 2, 12); g.fillRect(2, 6, 12, 2);     // cross frame
  g.fillStyle = '#3a5aa0'; g.fillRect(5, 6, 6, 5);                                // old shirt
  g.fillStyle = '#e0c070'; g.fillRect(6, 1, 4, 4);                                // straw head
  g.fillStyle = '#c89a40'; g.fillRect(4, 0, 8, 2);                                // hat
  g.fillStyle = '#1a1a1a'; g.fillRect(7, 2, 1, 1); g.fillRect(9, 2, 1, 1);
})];
TILES['*'] = [paint(g => {
  gGrass(7)(g);
  for (const [x, y] of [[1, 6], [8, 7], [4, 1]]) {                              // stacked round-ish hay bales
    g.fillStyle = '#8a6a24'; g.fillRect(x, y, 7, 7);
    g.fillStyle = '#d8b850'; g.fillRect(x + 1, y + 1, 5, 5);
    g.fillStyle = '#b8942e'; g.fillRect(x + 1, y + 3, 5, 1);
  }
})];
TILES['&'] = [paint(g => {
  gGrass(8)(g);
  g.fillStyle = '#5a4026'; g.fillRect(2, 9, 2, 7); g.fillRect(12, 9, 2, 7); g.fillRect(7, 9, 2, 7);   // legs
  g.fillStyle = '#6a7a8a'; g.fillRect(1, 2, 14, 8);                               // steel tank
  g.fillStyle = '#8a9aaa'; g.fillRect(1, 2, 14, 2);
  g.fillStyle = '#4a5a6a'; g.fillRect(1, 9, 14, 1);
  g.fillStyle = '#4aa0e0'; g.fillRect(4, 5, 8, 2);                                // painted water band
})];
TILES['$'] = [paint(g => {
  gGrass(9)(g);
  g.fillStyle = '#16181a'; g.fillRect(1, 2, 5, 3); g.fillRect(1, 11, 5, 3);       // big rear wheels
  g.fillRect(11, 3, 3, 2); g.fillRect(11, 11, 3, 2);                               // front wheels
  g.fillStyle = '#b8302a'; g.fillRect(2, 5, 12, 6);                                // red tractor body
  g.fillStyle = '#d84a3a'; g.fillRect(2, 5, 12, 1);
  g.fillStyle = '#2a2c30'; g.fillRect(3, 6, 4, 4);                                 // seat / cab
  g.fillStyle = '#444'; g.fillRect(10, 4, 1, 2);                                   // exhaust stack
})];
TILES['4'] = [paint(g => {
  g.fillStyle = '#33363c'; g.fillRect(0, 0, 16, 16);
  speck(g, '#3e4248', 4, 11);
  g.fillStyle = '#e8e4d8'; g.fillRect(2, 6, 12, 4);                              // runway centreline dash
  g.fillStyle = '#2a2c30'; g.fillRect(6, 7, 2, 1); g.fillRect(11, 8, 1, 1);      // tyre scuffs
})];
TILES['8'] = ['#a83a2a', '#2a5a9a', '#3e6a3a', '#b0702a'].map(c => paint(g => {
  g.fillStyle = '#18181c'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = c; g.fillRect(0, 1, 16, 14);                                     // corrugated steel box
  g.fillStyle = 'rgba(0,0,0,.28)'; for (let x = 1; x < 16; x += 2) g.fillRect(x, 1, 1, 14);
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 1, 16, 2);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 13, 16, 2);
}));
const SOLID = new Set('TP~WwRD#FOrXLCcKMGSAaUJHNIp12z5678t^9+*&$(){}[]/!?@|');   // last group: abandoned-city ruins

// characters (8x8 art at 2x)
// Gives flat pixel art some volume: top-to-bottom light falloff, a rim light on top/left edges,
// shade on bottom/right edges and a dark 1px outline. pad=true grows the canvas 1px each side so
// the outline isn't clipped; drawSprite compensates via img.pad.
function dimensional(src, pad = true) {
  const P = pad ? 1 : 0, w = src.width + P * 2, h = src.height + P * 2, c = mk(); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(src, P, P);
  const img = g.getImageData(0, 0, w, h), d = img.data, out = new Uint8ClampedArray(d);
  const A = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  let top = h, bot = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (A(x, y)) { top = Math.min(top, y); bot = Math.max(bot, y); }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (A(x, y)) {
      if (d[i] + d[i + 1] + d[i + 2] < 40) continue;                 // keep eyes/black details crisp
      let f = 1.16 - 0.32 * (y - top) / Math.max(1, bot - top);
      if (!A(x, y - 1) || !A(x - 1, y)) f += 0.2;
      if (!A(x, y + 1) || !A(x + 1, y)) f -= 0.22;
      for (let k = 0; k < 3; k++) out[i + k] = d[i + k] * f + (f > 1 ? 10 : 0);
    } else if (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1)) {
      out[i] = 16; out[i + 1] = 12; out[i + 2] = 26; out[i + 3] = 255;
    }
  }
  g.putImageData(new ImageData(out, w, h), 0, 0);
  c.pad = P;
  return c;
}
const spriteW = img => img.width - 2 * (img.pad || 0), spriteH = img => img.height - 2 * (img.pad || 0);
// white silhouette for hit flashes (cached per sprite)
const whiteCache = new Map();
function whiteOf(img) {
  let w = whiteCache.get(img);
  if (!w) {
    w = mk(); w.width = img.width; w.height = img.height; w.pad = img.pad;
    const g = w.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, w.width, w.height);
    whiteCache.set(img, w);
  }
  return w;
}

// one palette-swapped template per class: a = hat/helm, c = highlight, b = body
// Military soldier templates: a = helmet/cap, c = highlight/visor, b = tactical uniform/vest
const CLASS_LOOK = {
  assault: { head: ['..aaaa..','.acccca.'], a:'#3d5236', c:'#657a55', b:'#32422c' }, // Camo Green Assault Commando
  sniper:  { head: ['...aa...','.aaaaaa.'], a:'#4a4e3c', c:'#7a7256', b:'#383d2e' }, // Ghillie / Sniper Infiltrator
  heavy:   { head: ['..aaaa..','.acccca.'], a:'#2c333d', c:'#4a5566', b:'#20252e' }, // Ballistic Shield / Heavy Juggernaut
  knight:  { head: ['..aaaa..','.acccca.'], a:'#3d5236', c:'#657a55', b:'#32422c' }, // Backwards compatibility aliases
  ranger:  { head: ['...aa...','.aaaaaa.'], a:'#4a4e3c', c:'#7a7256', b:'#383d2e' },
  mage:    { head: ['..aaaa..','.acccca.'], a:'#2c333d', c:'#4a5566', b:'#20252e' },
};
const HEROES = {};
for (const [k, L] of Object.entries(CLASS_LOOK)) {
  const pal = { ...PAL, a: L.a, c: L.c, b: L.b }, legs = ['..K..K..', '.K....K.'];
  HEROES[k] = {
    down: legs.map(l => dimensional(art([...L.head, '.aSKSKa.', '..SSSS..', '.bbYbbb.', 'S.bbbb.S', '..bbbb..', l], 2, null, pal))),
    up:   legs.map(l => dimensional(art([...L.head, '.aaaaaa.', '..aaaa..', '.bbbbbb.', 'S.bbbb.S', '..bbbb..', l], 2, null, pal))),
  };
}

// Military Base NPCs: Quartermaster, Commander, Drill Sergeant, Base Sentry, Defense Coordinator, Intel Officer
const MERCHANT   = dimensional(art(['...TT...','..TTTT..','.TTTTTT.','..SKSK..','..SSSS..','.DDYDDD.','S.DDDD.S','..K..K..'])); // Quartermaster Higgins
const ELDER_SPR  = dimensional(art(['..KKKK..','.KYYYYK.','.KSKSKK.','.KKKKKK.','.qqYYqq.','S.qqqq.S','..qqqq..','..K..K..'])); // Commander Vance (Officer Cap & Badges)
const HUNTER_SPR = dimensional(art(['.TTTTTT.','..TTTT..','..SKKK..','..SSSS..','.RTTTTR.','S.TTTT.S','..TTTT..','..K..K..'])); // Drill Sgt. Miller
const GUARD_SPR  = dimensional(art(['..AAAA.K','.AAAAAAK','.ASKSKAK','..SSSS.D','.AAAAAAD','S.AAAA.S','..AAAA.D','..K..K..'])); // Sentry with M4
const OUTPOST_GUARD_SPR = dimensional(art(['..AAAA.K','.AKKKAAK','.ASKSKAK','..SSSS.D','.qqqqqqD','S.qqqq.S','..qqqq.D','..K..K..'])); // Fortified Outpost Guard with Balaclava & Tac-Vest
const ARENA_SPR  = dimensional(art(['...RR...','..RRRR..','.RRKRRR.','..SKSK..','.DDDDDD.','S.DDDD.S','..DDDD..','..K..K..'])); // Major Briggs (Red Beret)
const SEER_SPR   = dimensional(art(['..KKKK..','.KYYYYK.','.KYKYK..','.KKKKKK.','.qqqqqq.','S.qqqq.S','..qqqq..','..D..D..'])); // Intel Officer Malakor

// Military Support Companions: K-9 War Dog, Recon Drone, Automated Sentry
const PET_SPR = {
  wolf:  [art(['........','........','.....DD.','D...DDKD','.DDDDDDD','..KKKK..','..D..D..','........']),
          art(['........','........','.....DD.','.D..DDKD','.DDDDDDD','..KKKK..','.D....D.','........'])].map(s => dimensional(s)), // K-9 War Dog with tactical vest
  fairy: [art(['K......K','.KK..KK.','..YYYY..','.YgWWgY.','..YYYY..','.KK..KK.','K......K','........']),
          art(['.K....K.','KK....KK','..YYYY..','.YgWWgY.','..YYYY..','KK....KK','.K....K.','........'])].map(s => dimensional(s)), // Recon Quadcopter Drone
  wyrm:  [art(['........','..KKKK..','.KKAAKK.','KKAAEEAA','..AAAA..','...AA...','..A..A..','.A....A.']),
          art(['........','..KKKK..','.KKAAKK.','AAEEAAKK','..AAAA..','...AA...','..A..A..','.A....A.'])].map(s => dimensional(s)), // Sentry Turret
};

// ================= Sculpted models: the zombie horde and the bosses =================
// Drawn pixel by pixel at native resolution (1 canvas px = 1 screen px) with three-tone materials,
// so they carry twice the detail of the old 8x8 art at the same size on screen. Every model faces
// right; frame 0 / frame 1 are the two steps of its walk cycle. dimensional() adds the outline.
function sculpt(w, h, fn) {
  const c = mk(); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rect = (x, y, rw, rh, col) => {
    if (rw <= 0 || rh <= 0) return;
    g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
  };
  const P = {
    rect,
    px: (x, y, col) => rect(x, y, 1, 1, col),
    ell(cx, cy, rx, ry, col) {                                    // filled ellipse, scanline by scanline
      if (rx < 0 || ry < 0) return;
      for (let y = -ry; y <= ry; y++) {
        const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)));
        rect(cx - hw, cy + y, hw * 2 + 1, 1, col);
      }
    },
    blob(cx, cy, rx, ry, [lit, mid, dark]) {                     // a shaded lump of flesh / cloth: light from top-left
      P.ell(cx, cy, rx, ry, dark);
      P.ell(cx - 1, cy - 1, rx - 1, ry - 1, mid);
      if (rx >= 3 && ry >= 3) P.ell(cx - Math.ceil(rx / 3), cy - Math.ceil(ry / 3), Math.floor(rx / 3), Math.floor(ry / 3), lit);
    },
    line(x0, y0, x1, y1, t, col) {                               // thick line (limbs, spikes, tentacles)
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) rect(x0 + (x1 - x0) * i / n - (t - 1) / 2, y0 + (y1 - y0) * i / n - (t - 1) / 2, t, t, col);
    },
  };
  fn(P);
  return c;
}
const twoFrames = (w, h, fn) => [0, 1].map(f => sculpt(w, h, P => fn(P, f)));

// materials: [light, mid, dark]
const MAT = {
  rot:    ['#b8d09c', '#8cab72', '#5e7e4c'],   // fresh walker skin
  ash:    ['#c8cab4', '#9a9e86', '#6a6e5a'],   // grey runner skin
  sick:   ['#b4dc78', '#84b050', '#587a36'],   // bloated spitter skin
  bruise: ['#c0a8c8', '#8e7a9c', '#5e4e6c'],   // tyrant / leaper skin
  flesh:  ['#dcae9c', '#ae7a6a', '#764a44'],   // flayed mutant flesh
  denim:  ['#6a8ad0', '#4a68a8', '#30487a'],
  khaki:  ['#8a7454', '#64523a', '#423626'],
  jeans:  ['#56607e', '#3c4460', '#262c40'],
  tank:   ['#d65a50', '#a83434', '#6e1e1e'],
  hazmat: ['#ffe060', '#e0b428', '#9a7414'],
  swat:   ['#5e6e90', '#3c4864', '#242c40'],
  coat:   ['#585868', '#363644', '#1e1e2a'],
  chitin: ['#c080f0', '#8a48c0', '#56247e'],
  bone:   ['#f4ecd4', '#d2c6a4', '#968a6a'],
  heart:  ['#ff7a6a', '#d83030', '#801414'],
  bile:   ['#d0ff70', '#88d838', '#4a8a1c'],
};
const BLOOD = '#8a1414', GORE = '#5a0c0c', MOUTH = '#3a0a0a', SOCKET = '#140a0a';

// ---- Shambling humanoid (16x16). Options pick the skin, clothes and pose; extra() adds the details. ----
function humanZombie(o) {
  return twoFrames(16, 16, (P, f) => {
    const skin = o.skin, [cl, cm, cd] = o.cloth, [pl, pm, pd] = o.pants || o.cloth, arm = o.arm || skin;
    const lean = o.lean ?? 1, hx = 6 + lean, hy = o.hunch ? 2 : 1, ay = 7 + f, shoe = o.shoe || '#2a2420';
    const x0 = o.wide ? 4 : 5, tw = o.wide ? 8 : 6;
    // legs scissor between the two frames; runners take longer strides
    const bl = o.run ? (f ? 4 : 6) : (f ? 7 : 5), fl = o.run ? (f ? 9 : 7) : (f ? 5 : 8);
    if (o.back) o.back(P, f);                                              // things behind the body (scythes, tentacles)
    // back arm reaches forward in shadow
    if (!o.noBackArm) { P.rect(8, ay - 1, 5, 2, arm[2]); P.px(13, ay, arm[2]); }
    // back leg
    P.rect(bl, 12, 2, 3, pd); P.rect(bl, 15, 3, 1, shoe);
    // torso
    P.rect(x0, 6, tw, 5, cm); P.rect(x0, 6, tw, 1, cl); P.rect(x0 + tw - 1, 6, 1, 5, cd);
    P.px(x0, 11, cm); P.px(x0 + 3, 11, cd);                               // ragged hem
    if (o.tear !== false) { P.px(x0 + 1, 8, skin[1]); P.px(x0 + 2, 9, skin[2]); P.px(x0 + 1, 9, BLOOD); }
    // pelvis + front leg
    P.rect(x0, 11, tw, 1, pm);
    P.rect(fl, 12, 2, 3, pm); P.px(fl, 12, pl); P.rect(fl, 15, 3, 1, shoe);
    if (o.ripped) P.px(fl + 1, 13, skin[1]);
    // head, tilted forward
    P.rect(hx, hy, 5, 5, skin[1]); P.rect(hx + 1, hy, 3, 1, skin[0]); P.rect(hx, hy + 4, 5, 1, skin[2]);
    if (o.hair) { P.rect(hx, hy, 4, 1, o.hair); P.rect(hx, hy + 1, 1, 2, o.hair); }
    P.px(hx + 2, hy + 2, SOCKET); P.px(hx + 4, hy + 2, o.eye || '#ff4030');
    P.rect(hx + 2, hy + 4, 3, 1, MOUTH); P.px(hx + 3, hy + 4, '#e8e0c0');
    if (o.gash) P.px(hx + 1, hy + 1, BLOOD);
    // front arm: sleeve, forearm, clawed hand
    P.rect(x0 + 3, ay, 3, 2, o.sleeve ? cm : arm[1]);
    P.rect(x0 + 6, ay, 3, 2, arm[1]); P.rect(x0 + 6, ay, 3, 1, arm[0]);
    P.px(x0 + 9, ay, arm[1]); P.px(x0 + 10, ay + 1, arm[2]);
    for (const [x, y] of o.blood || []) P.px(x, y, BLOOD);
    if (o.extra) o.extra(P, f, { hx, hy, ay, x0, tw, bl, fl });
  });
}

const SPR = {
  // Walker Zombie: a fresh civilian corpse in a torn blue shirt, shambling with both arms out
  slime: humanZombie({ skin: MAT.rot, cloth: MAT.denim, pants: MAT.khaki, hair: '#3a2a1a', gash: true, ripped: true,
    sleeve: true, blood: [[9, 7], [6, 10], [7, 6]] }),
  // Infected Runner: lean grey sprinter in a blood-soaked tank top, jaw hanging open, long strides
  wolf: humanZombie({ skin: MAT.ash, cloth: MAT.tank, pants: MAT.jeans, lean: 2, hunch: true, run: true, eye: '#ffe040',
    blood: [[7, 8], [8, 9], [6, 7]],
    extra(P, f, { hx, hy }) {
      P.rect(hx + 2, hy + 4, 3, 2, MOUTH); P.px(hx + 2, hy + 4, '#f0e8d0'); P.px(hx + 4, hy + 5, '#f0e8d0');   // gaping jaw
      P.px(hx + 4, hy + 6, BLOOD);
      P.px(15, 7 + f, '#e8e0c0'); P.px(15, 9 + f, '#e8e0c0');                                                 // claws
    } }),
  // Toxic Crawler: a severed torso dragging itself along on long arms, trailing guts, oozing toxin
  goblin: twoFrames(16, 16, (P, f) => {
    const [sl, sm, sd] = MAT.sick;
    P.rect(0, 14, 3, 1, '#c85a6a'); P.px(1, 13, '#e07a8a'); P.px(3, 14, BLOOD);                     // trailing entrails
    P.line(9, 11, f ? 12 : 11, 15, 2, sd); P.px(f ? 13 : 12, 15, sd);                                // planted back arm
    P.blob(7, 12, 5, 3, MAT.khaki);                                                                  // tattered shirt torso
    P.rect(2, 11, 2, 3, sd); P.rect(3, 13, 2, 1, BLOOD);                                             // torn-off waist
    P.px(6, 11, sm); P.px(8, 13, BLOOD);
    P.rect(10, 8, 4, 4, sm); P.rect(11, 8, 2, 1, sl); P.rect(10, 11, 4, 1, sd);                      // head low to the ground
    P.rect(10, 8, 2, 1, '#2a2018'); P.px(10, 9, '#2a2018');                                          // matted hair
    P.px(12, 9, SOCKET); P.px(13, 9, '#a0ff40'); P.rect(12, 11, 2, 1, MOUTH); P.px(13, 12, '#70e030'); // eye, jaw, toxic drool
    P.line(9, 10, f ? 15 : 14, f ? 13 : 14, 1, sm); P.line(9, 11, f ? 14 : 13, f ? 14 : 15, 1, sd);   // reaching front arm
    P.px(15, f ? 14 : 15, sl); P.px(14, f ? 12 : 13, sl);                                            // grasping fingers
    P.px(5, 10, '#60c020'); P.px(5, 15, '#60c020'); P.px(9, 15, '#60c020');                          // toxic boils
  }),
  // Infected Hazmat Soldier: torn yellow biohazard suit, cracked gas mask, black gloves and boots
  skel: humanZombie({ skin: MAT.rot, cloth: MAT.hazmat, arm: MAT.hazmat, sleeve: true, shoe: '#1c1c22', tear: false,
    extra(P, f, { hx, hy, x0 }) {
      const [hl, hm, hd] = MAT.hazmat;
      P.rect(hx - 1, hy - 1 < 0 ? 0 : hy - 1, 6, 6, hm); P.rect(hx, 0, 4, 1, hl); P.rect(hx - 1, hy + 4, 6, 1, hd);   // hood
      P.rect(hx + 1, hy + 1, 4, 3, '#1c2228'); P.px(hx + 2, hy + 2, '#ff3030'); P.px(hx + 4, hy + 2, '#ff3030');      // mask visor
      P.px(hx + 3, hy + 1, '#9ab8c8'); P.px(hx + 4, hy + 3, '#9ab8c8');                                              // cracked glass
      P.rect(hx + 2, hy + 4, 2, 2, '#3a3a42'); P.px(hx + 2, hy + 5, '#5a5a62');                                     // filter canister
      P.rect(x0 + 1, 8, 2, 2, MAT.rot[1]); P.px(x0 + 1, 9, BLOOD);                                                  // rip in the suit
      P.px(x0 + 2, 7, '#1c1c22'); P.px(x0 + 3, 6, '#1c1c22');                                                       // biohazard badge
      P.rect(x0 + 8, f + 7, 2, 2, '#1c1c22'); P.px(x0 + 10, f + 8, '#1c1c22'); P.rect(12, f + 6, 2, 1, '#1c1c22');  // black gloves
    } }),
  // Parasite Leaper: a crouched corpse with purple chitin scythes bursting out of its back
  spider: humanZombie({ skin: MAT.bruise, cloth: MAT.jeans, pants: MAT.jeans, lean: 2, hunch: true, eye: '#d080ff', tear: false,
    back(P, f) {
      const [cl, cm, cd] = MAT.chitin;
      P.line(6, 6, 3, f ? 1 : 2, 2, cm); P.line(3, f ? 1 : 2, 1, f ? 5 : 6, 1, cd); P.px(3, f ? 1 : 2, cl);   // rear scythe
      P.line(8, 6, 11, f ? 0 : 1, 2, cm); P.line(11, f ? 0 : 1, 15, f ? 3 : 4, 1, cl); P.px(15, f ? 4 : 5, cd); // forward scythe
    },
    extra(P) { P.px(6, 8, '#d070f0'); P.px(8, 9, '#d070f0'); P.px(5, 6, MAT.chitin[1]); } }),                // pustules, chitin bursting out

  // Riot Shield Juggernaut: a hulking SWAT corpse in body armour behind a cracked riot shield
  bknight: humanZombie({ skin: MAT.ash, cloth: MAT.swat, wide: true, lean: 0, noBackArm: true, shoe: '#16161c', tear: false,
    extra(P, f, { hx, hy }) {
      const [sl, sm, sd] = MAT.swat;
      P.rect(hx - 1, 0, 6, 3, '#20242e'); P.rect(hx, 0, 4, 1, '#3a4252'); P.rect(hx - 1, 3, 2, 2, '#20242e');  // helmet
      P.rect(hx + 2, 2, 4, 2, '#3a5468'); P.px(hx + 5, 2, '#a8c4d4');                                         // tinted visor
      P.px(hx + 3, 3, '#ff4030'); P.px(hx + 2, 4, MAT.ash[2]);                                                // eye glowing through
      P.rect(5, 7, 6, 2, sd); P.px(6, 7, '#e8e8e8'); P.px(8, 7, '#e8e8e8');                      // vest + POLICE strip
      // riot shield
      const sy = 4 + f;
      P.rect(11, sy, 4, 11, '#7a90a0'); P.rect(11, sy, 4, 1, '#b8ccd8'); P.rect(14, sy, 1, 11, '#4a5c6a');
      P.rect(11, sy + 3, 4, 1, '#f0f0f0'); P.px(12, sy + 6, '#c8dce8'); P.px(13, sy + 7, '#c8dce8');   // stripe + crack
      P.px(12, sy + 9, BLOOD); P.px(13, sy + 9, BLOOD);
    } }),
  // Toxic Acid Spitter: swollen sick-green body with a glowing venom sac ballooning out of its neck
  cultist: humanZombie({ skin: MAT.sick, cloth: ['#b0a080', '#867656', '#5a4e38'], pants: MAT.khaki, lean: 1, eye: '#ffff60',
    extra(P, f, { hx, hy }) {
      P.blob(8, 9, 4, 3 + f, ['#c8bc98', '#9c8c68', '#6a5c44']);                                   // bloated belly
      P.px(9, 9, MAT.sick[1]); P.px(10, 10, MAT.sick[2]);
      P.ell(hx + 1, hy + 5, 1 + f, 1, MAT.bile[2]); P.ell(hx + 1, hy + 5, f, 1, MAT.bile[1]); P.px(hx, hy + 5, '#f0ffb0');  // venom sac
      P.px(hx + 4, hy + 5, '#a0ff40'); P.px(hx + 4, hy + 6 + f, '#70d020');                       // drool
    } }),

  // ---- Bosses (40x40) ----
  // The Goliath Tank: a towering flayed mutant with an exposed heart and one monstrous bone-clawed arm
  orc: twoFrames(40, 40, (P, f) => {
    const F = MAT.flesh, B = MAT.bone;
    // back arm (shadowed) and legs
    P.line(13, 16, 9, 30 + f, 4, F[2]); P.blob(9, 31 + f, 3, 3, ['#8a5a50', F[2], '#4a2a26']);
    const bl = f ? 13 : 16, fl = f ? 22 : 19;
    P.rect(bl, 29, 6, 8, '#3e3428'); P.rect(bl, 37, 7, 2, F[2]);
    P.rect(fl, 29, 6, 8, '#5a4c3a'); P.rect(fl, 29, 6, 1, '#6e5e48'); P.rect(fl, 37, 7, 2, F[1]); P.px(fl + 6, 38, B[1]);
    P.rect(13, 27, 14, 4, '#4a3e30'); P.px(15, 30, '#2e261c'); P.px(22, 30, '#2e261c');           // tattered trousers
    // massive hunched torso
    P.blob(19, 19, 11, 10, F);
    P.line(9, 12, 5, 6, 2, B[1]); P.line(12, 9, 9, 3, 2, B[0]); P.line(16, 8, 15, 2, 2, B[1]);      // bone spines
    for (const [x, y] of [[12, 22], [14, 25], [26, 25]]) P.px(x, y, F[2]);                           // scars
    P.line(14, 15, 18, 13, 1, '#5a2a2a'); P.line(15, 17, 19, 15, 1, '#5a2a2a');
    // exposed, beating heart
    P.blob(22, 18, 3 + f, 3 + f, MAT.heart); P.px(22, 17, '#ffc0b0');
    P.line(19, 16, 17, 14, 1, '#b02020'); P.line(25, 19, 27, 17, 1, '#b02020');
    // small head sunk between the shoulders
    P.blob(25, 9, 4, 4, ['#c8a090', '#9a6c5c', '#643e36']);
    P.px(27, 8, '#ff3020'); P.px(28, 8, '#ffb040'); P.px(24, 8, SOCKET);
    P.rect(25, 11, 4, 1, MOUTH); P.px(26, 11, B[0]); P.px(28, 11, B[0]);
    // the monstrous arm: swollen shoulder, sinew forearm, bone claws
    P.blob(29, 15, 5, 5, F);
    P.blob(32, 25 + f, 5, 8, F); P.line(30, 20 + f, 34, 31 + f, 1, F[2]);
    P.rect(28, 31 + f, 10, 3, F[2]);
    for (let i = 0; i < 4; i++) { P.line(28 + i * 3, 33 + f, 27 + i * 3, 38, 2, B[1]); P.px(27 + i * 3, 38, B[0]); }
    P.px(31, 22 + f, BLOOD); P.px(34, 27 + f, BLOOD);
  }),
  // Nemesis Tyrant: a towering stitched bio-weapon in a black trench coat, writhing tentacle at its shoulder
  lich: twoFrames(40, 40, (P, f) => {
    const C = MAT.coat, S = MAT.bruise;
    // tentacle lashing behind the left shoulder
    const tw = f ? 2 : -2;
    P.line(14, 12, 9, 7 + tw, 3, '#a03060'); P.line(9, 7 + tw, 5, 10 - tw, 2, '#c04070'); P.line(5, 10 - tw, 3, 6, 1, '#e06090');
    P.px(3, 5, '#ffa0c0');
    // boots, legs and coat tails
    const bl = f ? 15 : 17, fl = f ? 22 : 20;
    P.rect(bl, 30, 4, 7, '#1a1a22'); P.rect(bl, 36, 6, 3, '#101014');
    P.rect(fl, 30, 4, 7, '#26262e'); P.rect(fl, 36, 6, 3, '#18181e'); P.rect(fl, 36, 6, 1, '#3a3a44');
    P.rect(12, 12, 16, 19, C[1]); P.rect(12, 12, 16, 2, C[0]); P.rect(26, 12, 2, 19, C[2]);     // trench coat
    P.rect(12, 28, 5, 5, C[1]); P.rect(23, 28, 5, 5, C[2]); P.px(12, 32, C[2]); P.px(27, 32, '#14141c');  // split tails
    P.line(20, 14, 20, 29, 1, C[2]);                                                             // coat seam
    P.line(14, 14, 25, 22, 1, '#2a2a20'); P.rect(18, 17, 2, 2, '#a89060');                        // bandolier + buckle
    for (const y of [16, 20, 24]) P.px(22, y, '#7a7a88');                                        // buttons
    // collar and head
    P.rect(14, 10, 12, 3, C[2]); P.rect(15, 10, 10, 1, C[0]);
    P.blob(21, 6, 5, 5, S);
    P.line(17, 3, 23, 3, 1, '#4a3a52'); P.px(19, 2, '#4a3a52'); P.px(21, 4, '#4a3a52');           // stitches across the scalp
    P.px(19, 6, SOCKET); P.px(18, 6, SOCKET); P.px(24, 6, '#ff2a2a'); P.px(25, 6, '#ff8060');     // one burning eye
    P.rect(19, 9, 6, 2, MOUTH); for (let x = 19; x < 25; x += 2) P.px(x, 9, '#f0e8d0');            // lipless grin
    // back fist hangs down; front arm swings a huge clawed fist
    P.line(13, 14, 11, 26, 3, C[2]); P.blob(11, 28, 2, 2, S);
    P.line(26, 14, 30, 22 + f, 4, C[1]); P.rect(28, 21 + f, 4, 2, C[0]);
    P.blob(32, 26 + f, 4, 4, S); P.px(34, 23 + f, '#f0e8d0');
    for (let i = 0; i < 3; i++) P.line(30 + i * 2, 29 + f, 30 + i * 2, 32 + f, 1, MAT.bone[1]);
    P.px(31, 25 + f, BLOOD); P.px(22, 26, BLOOD);
  }),
  dummy: [art(['...RR...','..RWWaR.','.RWWERR.','.RWEEWR.','.RWWERR.','..RWWaR.','...DD...','..DDDD..']),
          art(['...RR...','..RWWaR.','.RWWERR.','.RWEEWR.','.RWWERR.','..RWWaR.','...DD...','..DDDD..'])],
};
const ICON = {
  gel:   art(['........','..RRRR..','.RgggRR.','.RRRRRR.','.RgggRR.','..RRRR..','........','........']), // infected zombie flesh
  pelt:  art(['.YY..YY.','YYYYYYYY','YYKKKKYY','.YYYYYY.','.YYYYYY.','..YYYY..','..Y..Y..','........']), // biohazard contaminated fiber
  ear:   art(['........','..gggg..','.gYYYgg.','.gggggg.','.gYYYgg.','..gggg..','........','........']), // corrosive acid gland
  bone:  art(['........','.WWWWW..','.WEEEE..','.WWWWW..','.WWWWW..','..WWW...','...W....','........']), // mutated bone fragment
  crown: art(['........','..EEEE..','.EKKKKE.','EEEEEEEE','EREEEREE','EEEEEEEE','..EEEE..','........']), // titan goliath core
  silk:  art(['.VV..VV.','VVVVVVVV','VVEEEEVV','.VVVVVV.','.VVVVVV.','..VVVV..','..V..V..','........']), // necrotic parasite sinew
  tome:  art(['........','..KKKK..','.KYYYYK.','KKYYYYKK','KRYYRYKK','KKYYYYKK','..KKKK..','........']), // biohazard research drive
  phyl:  art(['..VVVV..','.VEEEEV.','VVEEEEVV','VVEEEEVV','VVEEEEVV','.VEEEEV.','..VVVV..','........']), // alpha tyrant mutagen canister
  sword: art(['........','.......K','..NNNNKK','.NNNNNK.','..NN.K..','..N..K..','.N......','K.......']), // assault rifle M4A1
  sword: art(['........','.......K','..NNNNKK','.NNNNNK.','..NN.K..','..N..K..','.N......','K.......']), // assault rifle M4A1
  staff: art(['........','....KKK.','...KKKKK','..KKKKK.','.NNAAN..','.N...N..','.N......','N.......']), // heavy machine gun M249
  bow:   art(['.......K','.....NNK','...NNNK.','.NNNK...','.N.K....','..NK....','.N......','K.......']), // sniper rifle AWM
  gun:   art(['........','......N.','DNNNNNNN','DDNDDDN.','D..N.K..','...N.K..','..N.....','........']), // pistol / AK-47
  armor: art(['.TT..TT.','TTTTTTTT','TTAAAATT','.TTTTTT.','.TTAATT.','.TTTTTT.','.TTTTTT.','........']), // Kevlar Tactical Vest
  helm:  art(['..TTTT..','.TTAATT.','TTTTTTTT','TTKKKKTT','TT.TT.TT','TT....TT','........','........']), // Combat Helmet
  boots: art(['........','..KKKK..','..K..K..','..K..K..','.KK..KK.','KKKKKKKK','NNNNNNNN','........']), // Combat Boots
  ring:  art(['...AA...','..AAAA..','..AYYA..','.AY..YA.','.A....A.','.AY..YA.','..AYYA..','........']), // Dog Tag / GPS Watch
  silk:  art(['K......K','.KK..KK.','..YYYY..','.YgWWgY.','..YYYY..','.KK..KK.','K......K','........']), // drone parts
  tome:  art(['........','.NNNNNN.','.NYNNNN.','.NNYYNN.','.NNNNYN.','.NNNNNN.','.WWWWWW.','........']), // encrypted intel disk
  phyl:  art(['...EE...','..ERRYE.','.EYYYYYE.','.EYWYYE.','.EYYYYYE.','..ERRYE.','...EE...','........']), // blackbox flight recorder
  potion:art(['..WWWW..','.WWRRWW.','.WRRRRW.','.WWRRWW.','.WWWWWW.','..WWWW..','........','........']), // Medkit (Red cross)
  mpot:  art(['...AA...','...AA...','..AAAA..','.AABBAA.','.AAABAA.','.AABBAA.','...AA...','...AA...']), // Adrenaline Syringe
  elixir:art(['..GGGG..','.GGYYGG.','.GYYYYG.','.GYYYYG.','.GYYYYG.','..GGGG..','........','........']), // Combat Stim / Ration
  scroll:art(['..AAAA..','.AYYYYA.','.AYWWYA.','.AYYYYA.','..AAAA..','...AA...','...AA...','........']), // Satellite Transponder Radio
  abyssal_shard:art(['....EE..','...EEW..','..EEEE..','.EEEEE..','.EEYEE..','..EEE...','...E....','........']),
  gold:  art(['........','..GGGG..','.GYYYYG.','GGYYYYGG','.GYYYYG.','..GGGG..','........','........']), // military cash/credits
};
for (const k in SPR) SPR[k] = SPR[k].map(s => dimensional(s));
for (const k in ICON) ICON[k] = dimensional(ICON[k], false);   // icons keep 16x16 so slot layouts don't move
