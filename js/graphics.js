// ================= Core Constants & Graphics =================
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
// VW/VH: the game's pixel resolution. It follows the window (see fitScreen in ui.js); 320x240 is the minimum,
// and every menu is laid out in a 320x240 box that gets centred on screen.
let VW = 320, VH = 240;
const T = 16, SWING = 14, BAG = 20, WW = 88, WH = 50;
let MW = WW, MH = WH;   // current map size (overworld or dungeon floor)
const FONT = '8px "Press Start 2P", monospace', BIG = '16px "Press Start 2P", monospace';
ctx.imageSmoothingEnabled = false;
const R = Math.random, ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const PAL = { K:'#000000', W:'#ffffff', S:'#fcb494', A:'#9a9aac', H:'#d0d0e0', B:'#3a5ac8', Y:'#f8c838',
  R:'#c83030', G:'#58a838', g:'#7ad858', N:'#6c6c80', D:'#7a4a1c', O:'#4c8c3c', V:'#7040a0', E:'#ff3838',
  T:'#1e6a2a', t:'#3a9a3a', p:'#14482a', q:'#2a6a3a', M:'#5c5c6c' };
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
const gGrass = s => g => { g.fillStyle = '#3e8a34'; g.fillRect(0, 0, 16, 16); speck(g, '#5aa848', 6, s); speck(g, '#2e6a28', 4, s + 7); };
const gDark  = s => g => { g.fillStyle = '#2a5a2c'; g.fillRect(0, 0, 16, 16); speck(g, '#3a7038', 6, s); speck(g, '#1e4420', 4, s + 7); };
const gPath  = s => g => { g.fillStyle = '#b8945a'; g.fillRect(0, 0, 16, 16); speck(g, '#9a7844', 6, s); speck(g, '#d0ac70', 4, s + 7); };
const gRuin  = s => g => {
  g.fillStyle = '#5c5c6c'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#48485a'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(s % 2 ? 5 : 9, 0, 1, 7); g.fillRect(s % 2 ? 11 : 3, 8, 1, 7);
  speck(g, '#70708a', 3, s);
};
const TREE = ['..TTTT..','.TTtTTT.','TTTTTtTT','TtTTTTTT','TTTTTTtT','.TTTTTT.','...DD...','...DD...'];
const PINE = ['...pp...','..pppp..','..pqpp..','.pppppp.','.ppqppp.','pppppppp','...DD...','...DD...'];
const ROCK = ['........','..AAAA..','.AHHAAA.','AHAAAAAN','AAAAAANN','.AAAANN.','........','........'];

const TILES = {
  '.': [1, 2, 3].map(s => paint(gGrass(s))),
  'f': [paint(g => { gGrass(4)(g); [[3,4,'#e84848'],[10,9,'#f8d848'],[6,11,'#e84848'],[12,3,'#f0f0ff']].forEach(([x,y,c]) => { g.fillStyle = c; g.fillRect(x, y, 2, 2); }); })],
  ',': [1, 2, 3].map(s => paint(gDark(s))),
  '=': [1, 2].map(s => paint(gPath(s))),
  's': [1, 2, 3].map(s => paint(gRuin(s))),
  '~': [0, 1].map(f => paint(g => {
    g.fillStyle = '#2a5ab8'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#6a9ae8';
    if (f) { g.fillRect(4, 4, 4, 1); g.fillRect(10, 11, 4, 1); } else { g.fillRect(2, 5, 4, 1); g.fillRect(8, 10, 4, 1); }
  })),
  'b': [paint(g => {
    g.fillStyle = '#8a5a2a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#5a3a1a';
    [3, 7, 11, 15].forEach(x => g.fillRect(x, 0, 1, 16)); g.fillStyle = '#4a2a10'; g.fillRect(0, 0, 16, 2); g.fillRect(0, 14, 16, 2);
  })],
  'T': [art(TREE, 2, paint(gGrass(5)))],
  'P': [art(PINE, 2, paint(gDark(5)))],
  'r': [art(ROCK, 2, paint(gRuin(5)))],
  '#': [paint(g => {
    g.fillStyle = '#3c3c4c'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#28283a';
    g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(3, 8, 1, 7); g.fillRect(11, 8, 1, 7);
    g.fillStyle = '#5a5a70'; g.fillRect(0, 0, 7, 1); g.fillRect(8, 0, 8, 1); g.fillRect(4, 8, 7, 1);
  })],
  'R': [paint(g => {
    g.fillStyle = '#a83a2a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#7a2418';
    [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1)); speck(g, '#c85a3a', 5, 3);
  })],
};
const wall = g => { g.fillStyle = '#d8c8a0'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, 2, 16); g.fillRect(14, 0, 2, 16); g.fillRect(0, 14, 16, 2); };
TILES.W = [paint(wall)];
TILES.w = [paint(g => { wall(g); g.fillStyle = '#3a5a9a'; g.fillRect(4, 4, 8, 7); g.fillStyle = '#6a4a2a'; g.fillRect(7, 4, 2, 7); g.fillRect(4, 7, 8, 1); })];
TILES.D = [paint(g => { wall(g); g.fillStyle = '#6a3a1a'; g.fillRect(4, 3, 8, 13); g.fillStyle = '#f8c838'; g.fillRect(9, 9, 2, 2); })];
TILES.F = [paint(g => { gGrass(6)(g); g.fillStyle = '#8a5a2a'; g.fillRect(2, 3, 2, 12); g.fillRect(12, 3, 2, 12); g.fillRect(0, 6, 16, 2); g.fillRect(0, 10, 16, 2); })];
TILES.O = [paint(g => { gRuin(7)(g); g.fillStyle = '#8a8a9a'; g.fillRect(2, 3, 12, 11); g.fillStyle = '#5a5a6a'; g.fillRect(2, 12, 12, 2); g.fillStyle = '#2a5ab8'; g.fillRect(4, 5, 8, 6); })];
// village fortress wall (M) and gatehouse tower (G)
TILES.M = [paint(g => {
  gGrass(8)(g);
  g.fillStyle = '#303242'; g.fillRect(0, 2, 16, 14);
  g.fillStyle = '#7c8098'; g.fillRect(0, 4, 16, 10);
  // top battlements (merlons)
  g.fillStyle = '#9ea4bc';
  g.fillRect(0, 1, 4, 3); g.fillRect(6, 1, 4, 3); g.fillRect(12, 1, 4, 3);
  g.fillStyle = '#b8bed6';
  g.fillRect(0, 1, 4, 1); g.fillRect(6, 1, 4, 1); g.fillRect(12, 1, 4, 1);
  // brick mortar lines & base shadow
  g.fillStyle = '#484a5e';
  g.fillRect(0, 8, 16, 1); g.fillRect(0, 12, 16, 1);
  g.fillRect(4, 4, 1, 4); g.fillRect(11, 4, 1, 4);
  g.fillRect(7, 9, 1, 3); g.fillRect(14, 9, 1, 3);
  g.fillStyle = '#262836'; g.fillRect(0, 14, 16, 2);
})];
TILES.G = [paint(g => {
  g.fillStyle = '#262836'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#8a8ea8'; g.fillRect(1, 2, 14, 13);
  // tower battlements
  g.fillStyle = '#b8bed6';
  g.fillRect(1, 0, 3, 3); g.fillRect(6, 0, 4, 3); g.fillRect(12, 0, 3, 3);
  // dark stone trim & arrow slit / banner
  g.fillStyle = '#484a5e'; g.fillRect(1, 5, 14, 1); g.fillRect(1, 13, 14, 2);
  g.fillStyle = '#d8a848'; g.fillRect(5, 6, 6, 1);
  g.fillStyle = '#c83030'; g.fillRect(6, 7, 4, 5);
  g.fillStyle = '#f8c838'; g.fillRect(7, 8, 2, 2);
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
// S is the personal Town Stash chest in Ironvale Village (blue & gold)
TILES.S = [paint(g => {
  gRuin(6)(g);
  g.fillStyle = '#244888'; g.fillRect(2, 5, 12, 9); g.fillStyle = '#142852'; g.fillRect(2, 9, 12, 1);
  g.fillStyle = '#f8c838'; g.fillRect(2, 5, 1, 9); g.fillRect(13, 5, 1, 9); g.fillRect(2, 5, 12, 1); g.fillRect(7, 8, 2, 3);
})];
// A/a is an Ancient Shrine in the dungeon (glowing crystal altar / used altar)
const shrine = active => paint(g => {
  gCrypt(6)(g);
  g.fillStyle = '#4a4862'; g.fillRect(3, 11, 10, 4); g.fillStyle = '#6a6888'; g.fillRect(4, 9, 8, 3);
  g.fillStyle = active ? '#40c8ff' : '#485068'; g.fillRect(6, 3, 4, 6); g.fillRect(5, 5, 6, 3);
  if (active) { g.fillStyle = '#e0ffff'; g.fillRect(7, 4, 2, 3); g.fillStyle = '#f8c838'; g.fillRect(4, 10, 8, 1); }
});
TILES.A = [shrine(true)]; TILES.a = [shrine(false)];
// secret: Q is a walk-through fake pine, K is the hidden chest (on forest floor)
TILES.Q = TILES.P;
TILES.K = [paint(g => {
  gDark(6)(g);
  g.fillStyle = '#4a2a10'; g.fillRect(2, 5, 12, 9); g.fillStyle = '#2a1608'; g.fillRect(2, 9, 12, 1);
  g.fillStyle = '#c0c0d0'; g.fillRect(2, 5, 1, 9); g.fillRect(13, 5, 1, 9); g.fillStyle = '#ff9a30'; g.fillRect(7, 8, 2, 3);
})];
// Abyssal Rift tiles: u floor, U wall, V portal
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
TILES.V = [0, 1].map(f => paint(g => {
  g.fillStyle = '#1c1634'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#3c2468'; g.fillRect(2, 2, 12, 12);
  g.fillStyle = f ? '#8030e0' : '#5020a0'; g.fillRect(4, 4, 8, 8);
  g.fillStyle = f ? '#c060ff' : '#60e0ff'; g.fillRect(5, 5, 3, 3); g.fillRect(8, 8, 3, 3);
  g.fillStyle = '#ffffff'; g.fillRect(f ? 7 : 8, 7, 2, 2);
}));
const SOLID = new Set('TP~WwRD#FOrXLCcKMGSAaU');

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
const CLASS_LOOK = {
  knight: { head: ['..aaaa..','.acccca.'], a:'#9a9aac', c:'#d0d0e0', b:'#3a5ac8' },
  mage:   { head: ['...aa...','.aaaaaa.'], a:'#5030a0', c:'#7050c8', b:'#7040a0' },
  ranger: { head: ['..aaaa..','.aaccaa.'], a:'#2a6a3a', c:'#3a8a4a', b:'#7a4a1c' },
};
const HEROES = {};
for (const [k, L] of Object.entries(CLASS_LOOK)) {
  const pal = { ...PAL, a: L.a, c: L.c, b: L.b }, legs = ['..K..K..', '.K....K.'];
  HEROES[k] = {
    down: legs.map(l => dimensional(art([...L.head, '.aSKSKa.', '..SSSS..', '.bbYbbb.', 'S.bbbb.S', '..bbbb..', l], 2, null, pal))),
    up:   legs.map(l => dimensional(art([...L.head, '.aaaaaa.', '..aaaa..', '.bbbbbb.', 'S.bbbb.S', '..bbbb..', l], 2, null, pal))),
  };
}
const MERCHANT = dimensional(art(['...RR...','..RRRR..','.RRRRRR.','..SKSK..','..SSSS..','.VVYVVV.','S.VVVV.S','..K..K..']));
const ELDER_SPR  = dimensional(art(['..WWWW..','.WWWWWW.','.WSKSKW.','.WWWWWW.','.qqWWqq.','S.qqqq.S','..qqqq..','..D..D..']));
const HUNTER_SPR = dimensional(art(['.DDDDDD.','..DDDD..','..SKSK..','..SSSS..','.RDDDDR.','S.DDDD.S','..DDDD..','..K..K..']));
const GUARD_SPR  = dimensional(art(['..AAAA.H','.AHHHHAH','.ASKSKAH','..SSSS.D','.RRYRRRD','S.RRRR.S','..RRRR.D','..K..K..']));
const ARENA_SPR  = dimensional(art(['...RR...','..YYYY..','.YYKKYY.','..SKSK..','.YYYYYY.','S.RRRR.S','..YYYY..','..K..K..']));
const SEER_SPR   = dimensional(art(['..VVVV..','.VVVVVV.','.VKVKV..','.VVVVVV.','.qqVVqq.','S.VVVV.S','..VVVV..','..D..D..']));
const PET_SPR = {
  wolf:  [art(['........','........','.....DD.','D...DDKD','.DDDDDDD','..DDDD..','..D..D..','........']),
          art(['........','........','.....DD.','.D..DDKD','.DDDDDDD','..DDDD..','.D....D.','........'])].map(s => dimensional(s)),
  fairy: [art(['........','.W....W.','WW.YY.WW','.WWYYWW.','..WYYW..','...YY...','........','........']),
          art(['.W....W.','WW.YY.WW','..WYYW..','.WWYYWW.','...YY...','........','........','........'])].map(s => dimensional(s)),
  wyrm:  [art(['........','B......B','BB.HH.BB','.BHHHHB.','..HBHB..','..HHHH..','...BB...','........']),
          art(['B......B','.B.HH.B.','BBHHHHBB','..HBHB..','..HHHH..','..B..B..','........','........'])].map(s => dimensional(s)),
};
const SPR = {
  slime: [art(['........','........','..gggg..','.gggggg.','ggWKgWKg','gggggggg','gggggggg','.gggggg.']),
          art(['........','........','........','.gggggg.','ggWKgWKg','gggggggg','gggggggg','gggggggg'])],
  wolf:  [art(['........','......N.','N....NNN','.NNNNNEN','.NNNNNNN','.NNNNN..','.N.N.N.N','........']),
          art(['........','......N.','.N...NNN','N.NNNNEN','.NNNNNNN','.NNNNN..','N.N.N.N.','........'])],
  goblin:[art(['........','G.GGGG.G','.GEGGEG.','..GGGG..','.DDDDDD.','G.DDDD.G','..DDDD..','..D..D..']),
          art(['........','G.GGGG.G','.GEGGEG.','..GGGG..','.DDDDDD.','G.DDDD.G','..DDDD..','.D....D.'])],
  skel:  [art(['..WWWW..','.WKWWKW.','.WWWWWW.','..WKKW..','...WW...','.WWWWWW.','W..WW..W','..W..W..']),
          art(['..WWWW..','.WKWWKW.','.WWWWWW.','..WKKW..','...WW...','.WWWWWW.','W..WW..W','.W....W.'])],
  spider:[art(['N......N','.N.NN.N.','..NNNN..','NNEKKENN','..NNNN..','.N.NN.N.','N......N','........']),
          art(['........','N..NN..N','.NNNNNN.','.NEKKEN.','NNNNNNNN','N.N..N.N','........','........'])],
  bknight:[art(['.NNNNNN.','.NWWWWN.','.NWKKWN.','..WWWW..','ANNNNNNA','A.NNNN.A','..NNNN..','..W..W..']),
           art(['.NNNNNN.','.NWWWWN.','.NWKKWN.','..WWWW..','ANNNNNNA','A.NNNN.A','..NNNN..','.W....W.'])],
  cultist:[art(['...VV...','..VVVV..','.VKKKKV.','.VKEKEV.','.VVVVVV.','S.VVVV.S','.VVVVVV.','VVVVVVVV']),
           art(['...VV...','..VVVV..','.VKKKKV.','.VKEKEV.','.VVVVVV.','S.VVVV.S','.VVVVVV.','.VVVVVV.'])],
  lich: [
    art([
      '......Y..YY..Y......',
      '.....YY.YYYY.YY.....',
      '.....YYYYYYYYYY.....',
      '....V..WWWWWW..V....',
      '...VV.WWKKKKWW.VV...',
      '...VV.WKggKKggW.V..g',
      '....V.WWWWWWWW..V.gg',
      '......WW.WW.WW...ggW',
      '..YYY..WWWWWW..YYggg',
      '.YVVVY.VVYVVV.YVVgD.',
      'YVVVVVVVVYYVVVVVV.D.',
      'VVV.VVVVVYYVVVVV..D.',
      'SS..VVVVYYYYVVVV..D.',
      '....VVVVVVVVVVVV..D.',
      '...VVVVVVgVVVVVVV.D.',
      '...VVVVVgggVVVVVV.D.',
      '..VVVVVV.g.VVVVVV.D.',
      '..VV.VVV...VVV.VV.D.',
      '.VV...VV...VV...V.D.',
      '......V.....V.....D.',
    ], 2),
    art([
      '......Y..YY..Y.....g',
      '.....YY.YYYY.YY...gg',
      '.....YYYYYYYYYY..ggW',
      '....V..WWWWWW..V.ggg',
      '...VV.WWKKKKWW.VV.D.',
      '...VV.WKggKKggW.V.D.',
      '....V.WWWWWWWW..V.D.',
      '......WW.WW.WW....D.',
      '..YYY..WWWWWW..YYYD.',
      '.YVVVY.VVYVVV.YVVVD.',
      'YVVVVVVVVYYVVVVVVVD.',
      'VVV.VVVVVYYVVVVV..D.',
      'SS..VVVVYYYYVVVV..D.',
      '....VVVVVVVVVVVV..D.',
      '...VVVVVVgVVVVVVV.D.',
      '...VVVVVgggVVVVVV.D.',
      '..VVVVVV.g.VVVVVV.D.',
      '..VVV.VV...VV.VVV.D.',
      '...VV..V...V..VV..D.',
      '..................D.',
    ], 2),
  ],
  orc: [
    art([
      '...W....Y..Y....W...',
      '..WW...YYYYYY...WW..',
      '..WW..YYRYYRYY..WW.H',
      '...WW.OOOOOOOO.WW.HH',
      '....OOOOOOOOOOOO.HHH',
      '....OOKKEOOEKKOO.HAA',
      '....OOOOOOOOOOOO.DAA',
      '...W.OOWOOOOOWO..D.A',
      '..WW.OOOOOOOOOO..D..',
      '.HAAH.RRRRRRRR.HADD.',
      'HAAAAARRRYYRRRRAAAAD',
      'AAAAAARYYYYYYRRAAAAD',
      'OONNAAORRYYRROAANNO.',
      'OOOOO.RRRRRRRR.OOOO.',
      '.OOO..RRRRRRRR..OOD.',
      '......DDDDDDDD....D.',
      '.....DDDD..DDDD...D.',
      '....AAAA....AAAA..D.',
      '....KKKK....KKKK....',
      '...KKKKK....KKKKK...',
    ], 2),
    art([
      '...W....Y..Y....W.HH',
      '..WW...YYYYYY...WHHH',
      '..WW..YYRYYRYY..WHAA',
      '...WW.OOOOOOOO.W.DAA',
      '....OOOOOOOOOOOO.D.A',
      '....OOKKEOOEKKOO.D..',
      '....OOOOOOOOOOOO.D..',
      '...W.OOWOOOOOWO..D..',
      '..WW.OOOOOOOOOO..D..',
      '.HAAH.RRRRRRRR.HADD.',
      'HAAAAARRRYYRRRRAAAAD',
      'AAAAAARYYYYYYRRAAAAD',
      'OONNAAORRYYRROAANNO.',
      'OOOOO.RRRRRRRR.OOOD.',
      '.OOO..RRRRRRRR..OOD.',
      '......DDDDDDDD....D.',
      '....DDDD....DDDD....',
      '...AAAA......AAAA...',
      '...KKKK......KKKK...',
      '..KKKKK......KKKKK..',
    ], 2),
  ],
  dummy: [art(['...YY...','..YKKY..','..YYYY..','DDYYYYDD','.YYRRYY.','..YYYY..','...DD...','..DDDD..']),
          art(['...YY...','..YKKY..','..YYYY..','DDYYYYDD','.YYRRYY.','..YYYY..','...DD...','..DDDD..'])],
};
const ICON = {
  gel:   art(['........','...gg...','..gggg..','.ggWggg.','.gggggg.','..gggg..','........','........']),
  pelt:  art(['........','.N....N.','.NNNNNN.','..NAAN..','..NAAN..','.NNNNNN.','.N....N.','........']),
  ear:   art(['........','......G.','.....GG.','....GGG.','...GGGG.','..GGGG..','.GGG....','........']),
  bone:  art(['........','.WW.....','.WWW....','...WW...','....WW..','.....WWW','.....WW.','........']),
  crown: art(['........','Y..Y..Y.','YY.YY.YY','YYYYYYYY','YRYYRYYY','YYYYYYYY','........','........']),
  sword: art(['......WH','.....WH.','....WH..','...WH...','D.WH....','.DD.....','.YD.....','Y..D....']),
  staff: art(['.....VV.','....VWEV','....VEEV','...D.VV.','..D.....','.D......','D.......','........']),
  bow:   art(['...DD...','..D..W..','.D...W..','D....WWY','.D...W..','..D..W..','...DD...','........']),
  gun:   art(['........','......N.','DNNNNNNN','DDNDDDN.','D..N.K..','...N.K..','..N.....','........']),
  armor: art(['.AA..AA.','AAAAAAAA','AAHAAHAA','.AAAAAA.','.AAHHAA.','.AAAAAA.','.AAAAAA.','........']),
  helm:  art(['..AAAA..','.AAHHAA.','AAAAAAAA','AAKKKKAA','AA.AA.AA','AA....AA','........','........']),
  boots: art(['........','..DDDD..','..D..D..','..D..D..','.DD..DD.','DDDDDDDD','NNNNNNNN','........']),
  ring:  art(['...EE...','..EWWY..','..YYYY..','.YY..YY.','.Y....Y.','.YY..YY.','..YYYY..','........']),
  silk:  art(['........','.WWWW...','W....W..','W.WW.W..','W.W..W..','.W..W...','..WW....','........']),
  tome:  art(['........','.VVVVVV.','.VYVVVV.','.VVYYVV.','.VVVVYV.','.VVVVVV.','.WWWWWW.','........']),
  phyl:  art(['...YY...','..YggY..','.YggggY.','.YgWggY.','.YggggY.','..YggY..','...YY...','........']),
  potion:art(['...DD...','...WW...','..WRRW..','.WRRRRW.','.WRRWRW.','.WRRRRW.','..WWWW..','........']),
  mpot:  art(['...DD...','...WW...','..WBBW..','.WBBBBW.','.WBBWBW.','.WBBBBW.','..WWWW..','........']),
  elixir:art(['...YY...','...WW...','..WVVW..','.WVYVVW.','.WVVYVW.','.WVYVVW.','..YYYY..','........']),
  scroll:art(['.YYYYYY.','.WWWWWW.','..WWWW..','..WEEW..','..WWWW..','.WWWWWW.','.YYYYYY.','........']),
  abyssal_shard:art(['....VV..','...VVW..','..VVVV..','.VVVVV..','.VVYVV..','..VVV...','...V....','........']),
  gold:  art(['........','........','...YY...','..YWYY..','.YYYYYY.','YYWYYYYY','.YYYYYY.','........']),
};
for (const k in SPR) SPR[k] = SPR[k].map(s => dimensional(s));
for (const k in ICON) ICON[k] = dimensional(ICON[k], false);   // icons keep 16x16 so slot layouts don't move
