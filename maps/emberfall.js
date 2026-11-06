// Emberfall Crater: a scorched volcanic caldera reached through a military checkpoint in the city's warehouse district.
// Loaded via registerMap() in js/maps.js.
registerMap({
  id: 'emberfall',
  name: 'Emberfall Bio-Incinerator',
  level: 11,
  entrance: { x: 60, y: 36 },     // checkpoint tile inside the Sector 2 checkpoint compound
  clearing: 's',
  spawn: { x: 6, y: 27 },         // where you appear in this map
  tint: 'rgba(255,80,20,0.09)',
  weather: 'ash',
  chestTier: 4,                   // chests here roll end-game loot

  palette: { v:'#2c242e', e:'#ff6820', m:'#ff3810', f:'#ffd040', o:'#46384c', g:'#44604a', d:'#801818', b:'#2d4034' },

  // v basalt floor · e ember-cracked rock · m molten lava (solid) · o obsidian spire (solid) · q basalt boulder (solid)
  tiles: {
    v: { base:'#2c242e', speck:[['#3e3242', 6], ['#1c161e', 4]], variants:3, mini:'#302634' },
    e: { base:'#382628', speck:[['#ff6820', 5], ['#ffd040', 2]], variants:2, mini:'#583028' },
    m: { base:'#d83810', speck:[['#ff9020', 6], ['#ffd840', 3]], variants:2, solid:true, mini:'#e84818' },
    o: { on:'v', solid:true, mini:'#584064',
         art:['...oo...','..oooo..','..ofoo..','.oooooo.','.oofooo.','oooooooo','..KKKK..','........'] },
    q: { on:'v', solid:true, mini:'#483844',
         art:['........','..oooo..','.ovvvoo.','ovevvooo','ovvvvovo','.ooooKK.','........','........'] },
  },

  mats: {
    core:   { name:'Unstable Bio-Cell',        value:45,   icon:['........','..mmmm..','.mffffm.','.mfWWfm.','.mffffm.','..mmmm..','........','........'] },
    horn:   { name:'Calcified Flame Spike',    value:55,   icon:['......f.','.....ff.','....fem.','...feem.','..feeem.','.feeem..','.mmmm...','........'] },
    molten: { name:'Slag Bio-Carapace',        value:75,   icon:['........','..oooo..','.ommmmo.','omffffmo','omfWWfmo','.ommmmo.','..oooo..','........'] },
    iheart: { name:'Nemesis Omega Heart',      value:1200, icon:['.mm..mm.','mmmmmmmm','mffffffm','mfWWWWfm','.mffffm.','..mmmm..','...mm...','........'] },
  },

  enemies: {
    magmaslime: { name:'Combustion Boomer', plural:'Combustion Boomers', hp:130, atk:24, def:6, spd:0.65, xp:75, gold:[14,26], aggro:105,
      drop:['core', 0.55], gear:0.12, tier:3,
      frames:[['........','..mmmm..','.meffem.','meWWffem','meeffeem','mmmmmmmm','........','........'],
              ['........','........','..mmmm..','.meffem.','meWWffem','mmmmmmmm','........','........']] },
    fireimp: { name:'Charred Stalker', plural:'Charred Stalkers', hp:115, atk:27, def:4, spd:0.9, xp:85, gold:[16,30], aggro:155,
      drop:['horn', 0.45], gear:0.15, tier:3, ranged:true, shotColor:'#ff7020',
      frames:[['.f....f.','.mm..mm.','..mmmm..','.mfeefm.','mmmmm.mm','.mdggdm.','..m..m..','........'],
              ['.f....f.','.mm..mm.','..mmmm..','.mfeefm.','mm.mmmmm','.mdggdm.','.m....m.','........']] },
    lavagolem: { name:'Volcanic Bio-Titan', plural:'Volcanic Bio-Titans', hp:260, atk:32, def:11, spd:0.55, xp:140, gold:[22,42], aggro:105,
      drop:['molten', 0.5], gear:0.18, tier:4,
      frames:[['..oooo..','.oommoo.','ooKffKoo','oomddmoo','ooggmmoo','oooooooo','.oo..oo.','.mm..mm.'],
              ['..oooo..','.oommoo.','ooKffKoo','oomddmoo','ooggmmoo','oooooooo','.oo..oo.','mm....mm']] },
    infernal: { name:'Bio-Hazard Nemesis Omega', plural:'Bio-Hazard Nemesis Omegas', hp:2500, atk:40, def:12, spd:0.55, xp:2600, gold:[800,1200], aggro:210,
      drop:['iheart', 1], gear:1, tier:4, boss:true, ranged:true, pattern:'nova', shotColor:'#ff6020', w:24, h:24, scale:2,
      // a charred colossus split by molten cracks, its ribcage cradling a burning core, skull wreathed in fire
      model: twoFrames(40, 40, (P, f) => {
        const C = ['#5a4a46', '#3a2e2c', '#221a1a'], L = ['#fff080', '#ffa020', '#d04010'], B = MAT.bone;
        const bl = f ? 12 : 15, fl = f ? 23 : 20;
        P.rect(bl, 29, 6, 8, C[2]); P.rect(bl - 1, 36, 8, 3, '#140e0e');
        P.rect(fl, 29, 6, 8, C[1]); P.rect(fl - 1, 36, 8, 3, '#1a1212'); P.line(fl + 2, 30, fl + 3, 35, 1, L[1]);
        P.line(12, 16, 7, 28 + f, 4, C[2]); P.blob(7, 30 + f, 3, 3, C); P.px(7, 31 + f, L[2]);     // back arm
        P.blob(19, 20, 11, 10, C);                                                             // charred torso
        for (const [x0, y0, x1, y1] of [[10, 16, 14, 22], [14, 22, 12, 27], [24, 12, 28, 18], [26, 24, 23, 28], [12, 12, 16, 10]])
          P.line(x0, y0, x1, y1, 1, f && x0 < 20 ? L[0] : L[1]);                                 // molten cracks
        for (let i = 0; i < 4; i++) P.line(15, 15 + i * 3, 23, 15 + i * 3, 1, B[2]);              // exposed ribs
        P.blob(19, 19, 3 + f, 3 + f, L);                                                       // burning core
        for (const [x, y] of [[9, 9], [15, 6], [22, 5]]) P.line(x, y + 4, x - 1, y - 2 - f, 2, f ? L[0] : L[1]);   // flames off the back
        P.blob(27, 10, 5, 4, ['#d8c8a8', '#a89878', '#6a5a44']);                              // bare skull
        P.px(25, 9, '#ff6020'); P.px(29, 9, '#ffe060'); P.px(30, 9, '#ff6020');
        P.rect(26, 12, 6, 2, '#1a0e0a'); for (let x = 26; x < 32; x += 2) P.px(x, 12, B[0]);
        for (let i = 0; i < 4; i++) P.px(25 + i * 2, 5 - (i + f) % 2, i % 2 ? L[0] : L[1]);    // flaming crown
        P.blob(30, 16, 4, 4, C);
        P.line(31, 18, 33, 27 + f, 5, C[1]); P.line(32, 20, 33, 26 + f, 1, L[1]);              // front arm
        P.blob(33, 29 + f, 4, 3, ['#ffc060', L[2], '#801c08']);                                // molten fist
        for (let i = 0; i < 3; i++) P.line(31 + i * 2, 31 + f, 30 + i * 2, 35 + f, 1, B[1]);
      }) },
  },

  mobs: [
    { type:'magmaslime', n:7, area:[2, 14, 18, 30] },
    { type:'fireimp',    n:5, area:[14, 2, 34, 14] },
    { type:'lavagolem',  n:5, area:[28, 14, 46, 30] },
  ],
  boss: { type:'infernal', x:40, y:6, respawn: 4 * 60 * 60 },   // Caldera Throne, top-right

  // Z checkpoint home · = trail · b bridge over lava · C chest
  grid: [
    'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
    'qooooovooooovvvvvvovvvvvvvvvvvvvvvvvvvvvvvvvvvvq',
    'qoovvvoooooooeeevvvvvvvovvvvvvvvvovvvvqqqqqvovq',
    'qovvvvvooooooeeeeevvqvvvvvvvvvvvvvvvvvqqeeeqqvvq',
    'qovvCvvvoovvoeeeeeevvvvvvvvvvvvvvvvvvvqeeeeeeqvq',
    'qovvvvvooooovoeeeeevvvvvvvvovvvvvvvvqqeeeeeeeqqq',
    'qvoovvovoooovveeeeevvvqvvvovovvvvvvveeeeeeeeeeqq',
    'qooovoooooooovveeevvvvvvovvvvvvv=====eeeeeeeeeqq',
    'qoovvvoovvooovvvvvvvvvvvvvvvvvvv=vvqveeeeeeeeeqq',
    'qooovooooooovvvvvqovvvvvvvovvvvv=vvvqqeeeeeeeqqq',
    'qooovvooovvovqvvoovvvvvvvvvvvvvv=ovvvqeeeeeeeqvq',
    'qvvqvvovvvvvvoeeevvvvvvvovveeevv=vvqeqqeeeqqvvq',
    'qvvvvovvvvvvvveeevvvvmmmmmvveeevv=vvvoeeqqqqqevvq',
    'qvvvvvqvvvvvvveeevveemmmmmeeeevv=eevqeeevveevvvq',
    'qvvvvvvvvvvvvvvvvvvmmmmmmmmmvvve=eeeqqvvqvvvvvvq',
    'qvvvvvvvvvvvvvvvvvvmmmmmmmmmvvve=eeevvvvovvvovvq',
    'qvvvvvvvvvvvvvvvvvmmmmmmmmmmmvoo=eeeevvvvvvvvvvq',
    'qvvvqvvqvvvvvvvvvqmmmmmmmmmmmvvv=eeeevovvvvvovvq',
    'qvvvvvvvvvvvvv====bbbbbbbbbbb====veeevvvvovvvvvq',
    'qvvvvvvvvvvvvv=vvvmmmmmmmmmmmvvvvvvvvvvvvvvvvvvq',
    'qvvvvvvqovvvvv=vvvmmmmmmmmmmmvveeevvvvvvvvvvvvvq',
    'qvvvvvvovvvvvv=ovvemmmmmmmmmvveoovvooooovovovooq',
    'qvvvvoovvvvvvv=vvvemmmmmmmmmovveoovovvvvqooovooq',
    'qvvvvvvvvvqvvv=ovveemmmmmmmvvooovoooovvvooovoooq',
    'qvvvvvvvvvvvvo=vvvvvommmmmqvvvoooooovvoqovoooovq',
    'qveeeovvvvvvov=vvvvqovvvvvvvvvooovovooooovvvovvq',
    'qeevvvvvvvvvvv=qveeevvvvvvvvvvovooovooovvvvvvooq',
    'qevvvvvvvvvvvv=veeeeevvvvvvvvvovoooqoooovvCvvooq',
    'qevvZvv========veeeeevvvvvvvvvovooovovvvvvvvvooq',
    'qvvvvvvvvvvvvvvveeeeevvvvvvvvvovvoooovvovovvvooq',
    'qvvvvvvvvvvvvvvvveeevvvvvvovvvooovooooovooooovvq',
    'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
  ],
});
