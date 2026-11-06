// ================= Gun models =================
// One pixel-art model per firearm (16x8, muzzle pointing right). Each is pre-rendered once with the
// same outline + shading pass as the characters, then used both for the gun held in hand (rotated
// to the aim, flipped so it stays upright when facing left) and for its bag/HUD icon.
//   g: pistol-grip pixel the hand holds   m: muzzle pixel   fx: muzzle flash style

const GUN_PAL = { ...PAL,
  m:'#34363e', n:'#4a4d58', l:'#6c707c', h:'#a8aebc',             // black / gunmetal / light metal / bright steel
  w:'#9a6430', v:'#603c1c', o:'#5c6440', t:'#b8a070', q:'#7a9a98', // wood / dark wood / olive / tan / smoky polymer
  c:'#60e8ff', r:'#ff4848', b:'#4aa0ff', p:'#c070ff', g:'#e0a828', y:'#ffe070' };

const GUN_MODELS = {
  // ---- assault rifles ----
  'Carbine M4A1': { fx:'rifle', mag:30, reload:48, g:[6, 4], m:[15, 2], rows:[
    '.....mmmc.......', 'nn..nnnnnnnnn.m.', 'nnnnnnnnllnnnnnh', 'nn.nmnnnnnnnn...',
    'n....mm.nn......', '.....mm.nn......', '......m..n......', '................'] },
  'Assault Rifle AK-74': { fx:'rifle', mag:30, reload:52, g:[6, 4], m:[15, 2], rows:[
    '................', 'w......m....m...', 'wwwwnnnnnwwwwnnh', 'vwwvnnnnnvvvv...',
    '.....mm.mm......', '.....mm..mm.....', '......m...mm....', '................'] },
  'Tactical SCAR-H': { fx:'rifle', mag:24, reload:45, g:[6, 4], m:[15, 2], rows:[
    '......mmmc......', 'tt..tttttttttm..', 'tttttttllttttnnh', 'tt.tttttttttt...',
    't....mm.mm......', '.....mm.mm......', '......m.........', '................'] },
  'G36 Battle Rifle': { fx:'rifle', mag:30, reload:44, g:[6, 4], m:[15, 2], rows:[
    '....mmmmmmc.....', 'oo...m....m.....', 'ooooooooooooonnh', 'oo.oooooooooo...',
    'o....mm.qq......', '.....mm.qq......', '......m..qq.....', '................'] },
  'Prototype Rail-Rifle': { fx:'rail', mag:25, reload:40, g:[6, 4], m:[15, 2], rows:[
    '....hhhhhh......', 'hh..lbbbbbbl.ll.', 'hlllllllllllbbbc', 'hh..lbbbbbbl.ll.',
    'h....ll.bb......', '.....ll.bb......', '......l.........', '................'] },
  // ---- sniper rifles ----
  'Hunting Rifle .308': { fx:'sniper', mag:5, reload:56, g:[5, 4], m:[15, 2], rows:[
    '...mmmmmmc......', '....m...m.......', 'wwwwwwnnnnnnnnnh', 'vwwwwwwwwww.....',
    'vv..wwm.........', '.....ww.........', '................', '................'] },
  'Scout Rifle SVD': { fx:'sniper', mag:10, reload:50, g:[6, 4], m:[15, 2], rows:[
    '....mmmmmc......', 'ww...m..m.......', 'w.wwnnnnwwwwnnnh', 'wwwwnnnnvvvv....',
    'w....mmnn.......', '.....mm.nn......', '......m.........', '................'] },
  'AWM Precision Sniper': { fx:'sniper', mag:6, reload:60, g:[6, 4], m:[15, 2], rows:[
    '..mmmmmmmc......', '...m....m.......', 'ooooooonnnnnnnnh', 'o.ooooooooo.....',
    'oo...mm.m..m.m..', '.....mm....m.m..', '......m....m..m.', '................'] },
  'Anti-Materiel .50 Cal': { fx:'sniper', mag:5, reload:68, g:[6, 4], m:[15, 2], rows:[
    '..mmmmmmmmc.....', 'mm.m......m...ll', 'mnnnnnnnnnnnnlhh', 'mnnnnnnnnnnnnlhh',
    'mm...mm.nn....ll', '.....mm.nn..m.m.', '......m....m...m', '................'] },
  'Gauss Long-Rifle': { fx:'rail', mag:8, reload:48, g:[6, 4], m:[15, 2], rows:[
    '....hhhhc.......', 'hh..llllll......', 'hlllpbpbpbpbpbhc', 'hh..lllllllllll.',
    'h....ll.........', '.....ll.........', '......l.........', '................'] },
  // ---- heavy weapons ----
  'Combat Shotgun 12G': { fx:'shotgun', mag:8, reload:54, g:[6, 4], m:[15, 1], rows:[
    '.......m........', 'ww..nnnnnnnnnnnh', 'wwwwnnnnvvvvvmmm', 'ww..mm...vvvv...',
    '.....mm.........', '.....mm.........', '......m.........', '................'] },
  'Submachine MP5': { fx:'rifle', mag:32, reload:38, g:[6, 4], m:[13, 2], rows:[
    '....m....m......', 'm...nnnnnnn.....', 'mmmmnnnnnnnnnh..', 'm..nnnnnn.nn....',
    '.....mmnn.......', '.....mm..n......', '......m...n.....', '................'] },
  'M249 Light Machine Gun': { fx:'heavy', mag:60, reload:74, g:[6, 4], m:[15, 2], rows:[
    '.....lll...m....', 'oo..oooooo......', 'oooooooooonnnnnh', 'oo...mmoooon....',
    '.....mmgyyo..m..', '......mgyyo.m.m.', '...........m...m', '................'] },
  'Rotary Minigun': { fx:'heavy', mag:90, reload:84, g:[6, 4], m:[15, 2], rows:[
    '....lllll.......', 'mm.nnnnnnmhhhhhh', 'mnnnnnnnnnmllllh', 'mm.nnnnnnmhhhhhh',
    '.....mmgy.......', '.....mm.gy......', '......m..gy.....', '................'] },
  'Plasma Cannon': { fx:'plasma', mag:18, reload:56, g:[6, 4], m:[15, 2], rows:[
    '...hhhhhhh......', 'hh.hppppppphh...', 'hlllppppWppplppc', 'hh.hppppppphh...',
    'h....ll.pp......', '.....ll.........', '......l.........', '................'] },
  // ---- boss-crafted weapons (Cryo Goliath & Abyssal Omega) ----
  'Goliath Battle Rifle': { fx:'rail', mag:36, reload:40, g:[6, 4], m:[15, 2], rows:[
    '....llcccll.....', 'hh..lbbbbbblhh..', 'hlllccccccccbbbc', 'hh..lbbbbbblcc..',
    'h....ll.bb......', '.....ll.bc......', '......l..bb.....', '................'] },
  'Goliath Heavy Sniper': { fx:'rail', mag:10, reload:46, g:[6, 4], m:[15, 2], rows:[
    '...llllcccl.....', 'hh..l.....l.....', 'hlllcbcbcbcbcbhc', 'hhhhllllllllll..',
    'h....ll.bc..l.l.', '.....ll.bb..l.l.', '......l.....l..l', '................'] },
  'Goliath Heavy Autocannon': { fx:'rail', mag:75, reload:64, g:[6, 4], m:[15, 2], rows:[
    '....hhhhhhh.....', 'll.lccccccchhhhh', 'llllbbbbbbbblllc', 'll.lccccccchhhhh',
    '.....llbbbb.....', '.....llbccb.....', '......lbbbb.....', '................'] },
  'Omega Assault Rifle': { fx:'plasma', mag:40, reload:38, g:[6, 4], m:[15, 2], rows:[
    '....mmpppmm.....', 'mm..nrprprpnmm..', 'mnnnpppppppprrry', 'mm..nrprprpnmm..',
    'm....mm.pp......', '.....mm.pr......', '......m..pp.....', '................'] },
  'Omega Rail-Sniper': { fx:'plasma', mag:12, reload:44, g:[6, 4], m:[15, 2], rows:[
    '...mmmmpppr.....', 'mm..m.....m.....', 'mnnnprprprprprpy', 'mmmmnnnnnnnnnn..',
    'm....mm.pr..m.m.', '.....mm.pp..m.m.', '......m.....m..m', '................'] },
  'Omega Rotary Minigun': { fx:'plasma', mag:100, reload:68, g:[6, 4], m:[15, 2], rows:[
    '....ggggggg.....', 'mm.nppppppmrrrrr', 'mnnnrrrrrrrmpppy', 'mm.nppppppmrrrrr',
    '.....mmggy......', '.....mm.ggy.....', '......m..ggy....', '................'] },
  // ---- secret ----
  'Legendary AK-47 Golden': { fx:'rifle', mag:45, reload:34, g:[6, 4], m:[15, 2], rows:[
    '................', 'v......y....y...', 'vvvvggggyvvvvggy', 'vvvvgggggvvvv...',
    '.....gg.yg......', '.....gg..yg.....', '......g...yg....', '................'] },
};
// default model for each weapon type (old saves, bots, unknown names)
const GUN_DEFAULT = { rifle:'Carbine M4A1', sword:'Carbine M4A1', sniper:'Hunting Rifle .308', staff:'Hunting Rifle .308',
  heavy:'Combat Shotgun 12G', bow:'Combat Shotgun 12G', gun:'Legendary AK-47 Golden' };

for (const m of Object.values(GUN_MODELS)) {
  m.img = dimensional(art(m.rows, 1, null, GUN_PAL));                 // held model (18x10 with outline)
  const ic = mk(); ic.getContext('2d').drawImage(art(m.rows, 1, null, GUN_PAL), 0, 4);
  m.icon = dimensional(ic, false);                                     // 16x16 bag icon, centred vertically
}
// which model a weapon item uses: match its base name (rarity prefixes like "Fine " are ignored)
function gunModel(it, kind) {
  if (it && it.name) {
    for (const name in GUN_MODELS) if (it.name === name || it.name.endsWith(' ' + name) || it.name.includes(name)) return GUN_MODELS[name];
  }
  const defKey = kind || (it && it.wt) || (typeof p !== 'undefined' && p ? CLASS_WT[p.cls] : 'rifle');
  return GUN_MODELS[GUN_DEFAULT[defKey] || 'Carbine M4A1'];
}
function maxAmmo(it = typeof p !== 'undefined' && p ? p.weapon : null, kind) {
  return gunModel(it, kind).mag || 30;
}
function reloadFrames(it = typeof p !== 'undefined' && p ? p.weapon : null, kind) {
  return gunModel(it, kind).reload || 48;
}

// draw a gun with its grip at (x,y) aimed along ang; it == the weapon item (for model + rarity glow)
function drawGun(it, kind, x, y, ang, holstered, firing) {
  const m = gunModel(it, kind), flip = Math.cos(ang) < 0;
  const reloading = !holstered && typeof p !== 'undefined' && p && it === p.weapon && p.reloadT > 0;
  const tilt = reloading ? (flip ? 0.45 : -0.45) + Math.sin(p.reloadT * 0.35) * 0.08 : 0;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang + tilt);
  if (flip) ctx.scale(1, -1);                                          // keep the gun upright when aiming left
  const plus = it ? it.plus || 0 : 0;
  if (!holstered && plus >= 5) {                                       // +5 / +9 upgrade aura
    ctx.globalAlpha = 0.25 + Math.sin(frame * 0.15) * 0.12;
    ctx.fillStyle = plus >= 9 ? '#ff70ff' : '#ffd848';
    ctx.fillRect(-m.g[0] - 2, -m.g[1] - 2, 20, 12);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(m.img, -m.g[0] - 1, -m.g[1] - 1);
  if (reloading) {                                                     // magazine insert / bolt slide glint
    const prog = 1 - p.reloadT / (p.reloadMax || 48);
    const magY = prog < 0.5 ? 2 + prog * 8 : 6 - (prog - 0.5) * 8;
    ctx.fillStyle = '#ffd848';
    ctx.fillRect(2, Math.round(magY), 2, 3);
  } else if (firing && !holstered) {
    drawMuzzle(m.fx, m.m[0] - m.g[0] + 1, m.m[1] - m.g[1]);
  }
  ctx.restore();
}
function drawMuzzle(fx, x, y) {
  const f = frame % 4 < 2;
  if (fx === 'sniper') {                                               // long supersonic streak
    ctx.fillStyle = '#fff6c0'; ctx.fillRect(x, y - 1, 8, 2); ctx.fillStyle = '#ffd060'; ctx.fillRect(x + 2, y - 2, 3, 4);
  } else if (fx === 'shotgun' || fx === 'heavy') {                     // wide blast
    ctx.fillStyle = '#ff9a30'; ctx.fillRect(x, y - 3, f ? 5 : 4, 6);
    ctx.fillStyle = '#fff6a0'; ctx.fillRect(x, y - 1, f ? 4 : 3, 3);
  } else if (fx === 'rail') {                                          // blue energy bolt
    ctx.fillStyle = '#4aa0ff'; ctx.fillRect(x, y - 1, 7, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 5, 1);
  } else if (fx === 'plasma') {                                        // purple orb
    ctx.fillStyle = '#c070ff'; ctx.fillRect(x, y - 2, 5, 5); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 1, y - 1, 3, 3);
  } else {                                                             // rifle star
    ctx.fillStyle = '#fff6a0'; ctx.fillRect(x, y - 1, f ? 4 : 3, 3);
    ctx.fillStyle = '#ff8020'; ctx.fillRect(x + 1, y - 2, 1, 5); ctx.fillRect(x + 3, y, 2, 1);
  }
}
