// Frostpeak Pass: a frozen mountain pass reached through a military checkpoint in the north of the Meadow.
// Everything about this area lives in this file; js/maps.js loads it via registerMap().
registerMap({
  id: 'frostpeak',
  name: 'Frostpeak Bio-Research Station',
  level: 9,
  entrance: { x: 30, y: 4 },      // checkpoint tile on the main world (north Meadow)
  spawn: { x: 6, y: 28 },         // where you appear in this map
  tint: 'rgba(150,190,255,0.08)',
  weather: 'snow',
  chestTier: 3,                   // chests here roll loot like crypt floor 3

  // extra colours used by the art below (merged over the global PAL)
  palette: { i:'#a8d8f0', j:'#5a90c8', u:'#eef6ff', z:'#2a4a7a', e:'#60e0ff', t:'#404c38', a:'#283424', s:'#6a7862', k:'#182016', d:'#801818', g:'#44604a', b:'#2d4034' },

  // n snow · i ice · l frozen lake (solid) · y snowy pine (solid) · k ice rock (solid)
  tiles: {
    n: { base:'#dfe8f2', speck:[['#ffffff', 6], ['#b8c8dc', 4]], variants:3, mini:'#e4ecf6' },
    i: { base:'#a8d0f0', speck:[['#e0f4ff', 5], ['#88b4e0', 3]], variants:2, mini:'#a8d0f0' },
    l: { base:'#4a7ac0', speck:[['#a8d0ff', 4], ['#3a64a8', 3]], variants:2, solid:true, mini:'#4a7ac0' },
    y: { on:'n', solid:true, mini:'#2a5a5a',
         art:['...uu...','..uppu..','..puup..','.uppppu.','.ppuppp.','uppppppu','...DD...','...DD...'] },
    k: { on:'n', solid:true, mini:'#7a98b8',
         art:['........','..jjjj..','.jiiijj.','jiuiijjj','jiiiijzj','.jjjjzz.','........','........'] },
  },

  mats: {
    fang:      { name:'Cryo Gland',            value:18,  icon:['........','...e....','...ee...','...eee..','...eee..','..eee...','..ee....','........'] },
    fur:       { name:'Insulated Bio-Pelt',    value:30,  icon:['........','.u....u.','.uuuuuu.','..uiiu..','..uiiu..','.uuuuuu.','.u....u.','........'] },
    shard:     { name:'Cryo Bio-Crystal',      value:35,  icon:['....e...','...eie..','...iii..','..eiiie.','..iiiii.','...iii..','....i...','........'] },
    wyrmscale: { name:'Cryo Titan Carapace',   value:800, icon:['........','..jjjj..','.jiiiij.','.jiuuij.','.jiiiij.','..jiij..','...jj...','........'] },
  },

  enemies: {
    icewolf: { name:'Cryo Ghoul Hound', plural:'Cryo Ghoul Hounds', hp:75, atk:19, def:4, spd:1.15, xp:42, gold:[8,16], aggro:110,
      drop:['fang', 0.5], gear:0.1, tier:2,
      frames:[['........','......g.','g....ggg','.ggggege','.gjjdggg','.ggggg..','.g.g.g.g','........'],
              ['........','......g.','.g...ggg','g.gggege','.gjjdggg','.ggggg..','g.g.g.g.','........']] },
    yeti: { name:'Cryo Brute Zombie', plural:'Cryo Brute Zombies', hp:170, atk:25, def:7, spd:0.65, xp:90, gold:[14,28], aggro:100,
      drop:['fur', 0.5], gear:0.15, tier:3,
      frames:[['..gggg..','.gugggu.','gueeegug','gujjjjue','guuWWuug','gguudugg','.gg..gg.','.jj..jj.'],
              ['..gggg..','.gugggu.','gueeegug','gujjjjue','guuWWuug','gguudugg','.gg..gg.','jj....jj']] },
    wraith: { name:'Screamer Banshee', plural:'Screamer Banshees', hp:90, atk:21, def:3, spd:0.55, xp:70, gold:[12,22], aggro:150,
      drop:['shard', 0.4], gear:0.15, tier:3, ranged:true, shotColor:'#90e8ff',
      frames:[['...gg...','..geeg..','.gKKKKg.','.ggeeggg','jddjjdjj','.jddddj.','..i..i..','........'],
              ['...gg...','..geeg..','.gKKKKg.','.ggeeggg','jddjjdjj','.jddddj.','.i....i.','........']] },
    frostwyrm: { name:'Cryo Abomination Titan', plural:'Cryo Abomination Titans', hp:1800, atk:34, def:10, spd:0.5, xp:1800, gold:[500,800], aggro:200,
      drop:['wyrmscale', 1], gear:1, tier:4, boss:true, ranged:true, pattern:'nova', shotColor:'#a0f0ff', w:24, h:24, scale:2,
      // a frozen hulk of a zombie, its hide split by ice crystals, frost pouring from its jaw
      model: twoFrames(40, 40, (P, f) => {
        const S = ['#c8dcec', '#90aac4', '#5a7490'], I = ['#f0ffff', '#a0e8ff', '#4ab0e0'], B = MAT.bone;
        const bl = f ? 12 : 15, fl = f ? 23 : 20;
        P.rect(bl, 29, 6, 8, S[2]); P.rect(bl - 1, 36, 8, 3, '#3a5068');
        P.rect(fl, 29, 6, 8, S[1]); P.rect(fl, 29, 6, 1, S[0]); P.rect(fl - 1, 36, 8, 3, '#4a6480');
        P.line(fl + 1, 31, fl + 1, 35, 1, I[1]);
        P.line(12, 16, 7, 28 + f, 4, S[2]); P.blob(7, 30 + f, 3, 3, S);                        // back arm
        P.blob(19, 20, 11, 10, S);                                                             // hulking torso
        P.rect(13, 27, 13, 3, '#3c4860');                                                      // torn lab trousers
        for (const [x, y, h] of [[9, 12, 7], [14, 9, 9], [20, 8, 8], [26, 10, 6]]) {           // ice crystals on the back
          P.line(x, y, x - 2, y - h, 3, I[2]); P.line(x - 1, y - 1, x - 2, y - h, 1, I[0]);
        }
        P.blob(17, 21, 3, 3, I); P.blob(12, 24, 2, 2, I);                                      // frozen growths
        P.line(14, 15, 22, 18, 1, S[2]); P.line(21, 24, 27, 22, 1, S[2]);
        P.blob(27, 10, 5, 4, S);                                                               // head
        P.px(29, 9, '#60f0ff'); P.px(30, 9, '#ffffff'); P.px(25, 9, '#20303a');
        P.rect(26, 12, 6, 2, '#1a2a3a'); for (let x = 26; x < 32; x += 2) P.px(x, 12, B[0]);
        for (let i = 0; i < 4; i++) P.px(33 + i + f, 12 + (i % 2), i % 2 ? '#d0f8ff' : '#80e0ff');   // frost breath
        P.blob(30, 16, 4, 4, S);                                                               // shoulder
        P.line(31, 18, 33, 27 + f, 5, S[1]); P.line(30, 18, 32, 27 + f, 1, S[0]);              // front arm
        P.blob(33, 29 + f, 4, 3, I);                                                           // ice-encased fist
        for (let i = 0; i < 3; i++) P.line(31 + i * 2, 31 + f, 30 + i * 2, 35 + f, 1, I[2]);   // icicle claws
      }) },
  },

  mobs: [
    { type:'icewolf', n:7, area:[2, 12, 16, 30] },
    { type:'wraith',  n:4, area:[14, 1, 34, 12] },
    { type:'yeti',    n:5, area:[28, 14, 46, 30] },
  ],
  boss: { type:'frostwyrm', x:40, y:6, respawn: 4 * 60 * 60 },   // Wyrm's Roost, top-right

  // Z checkpoint home · = trail · b bridge over the lake · C chest (two hidden in the pine woods)
  grid: [
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'kyyyyyynyyyyynnnnnnynnnnnnnnnnnnnnnnnnnnnnnnnnnk',
    'kyynnnyyyyyyyiiinnnnnnnnynnnnnnnnnynnnnkkkkknynk',
    'kynnnnnyyyyyyiiiiinnknnnnnnnnnnnnnnnnnkkiiikknnk',
    'kynnCnnnyynnyiiiiiinnnnnnnnnnnnnnnnnnkiiiiiiiknk',
    'kynnnnnyyyyynyiiiiinnnnnnnnnynnnnnnnkkiiiiiiikkk',
    'knynnnynyyyynniiiiinnnknnnnynynnnnnniiiiiiiiiikk',
    'kyyynyyyyyyyynniiinnnnnnnynnnnnn=====iiiiiiiiikk',
    'kyynnnyynnyyynnnnnnnnnnnnnnnnnnn=nnkniiiiiiiiikk',
    'kyyynyyyyyyynnnnnkynnnnnnnnynnnn=nnnkkiiiiiiikkk',
    'kyyynnyyynnynknnynnnnnnnnnnnnnnn=ynnnkiiiiiiiknk',
    'knnknnynnnnnnyiiinnnnnnnnyniiinn=ynnkikkiiikknnk',
    'knnnnynnnnnnnniiinnnnlllllniiinn=nnnyiikkkkkinnk',
    'knnnnnknnnnnnniiinnillllllliiinn=iinkiiiniiinnnk',
    'knnnnnnnnnnnnnnnnnnlllllllllnnni=iiikknnknnnnnnk',
    'knnnnnnnnnnnnnnnnnnlllllllllnnni=iiinnnnynnnynnk',
    'knnnnnnnnnnnnnnnnnlllllllllllnyi=iiiinnnnnnnnnnk',
    'knnnknnknnnnnnnnnklllllllllllnnn=iiiinynnnnnynnk',
    'knnnnnnnnnnnnn====bbbbbbbbbbb====niiinnnnynnnnnk',
    'knnnnnnnnnnnnn=nnnlllllllllllnnnnnnnnnnnnnnnnnnk',
    'knnnnnnkynnnnn=nnnlllllllllllniiinnnnnnnnnnnnnnk',
    'knnnnnnynnnnnn=ynnilllllllllnniyynnyyyyynynynyyk',
    'knnnnyynnnnnnn=nnnilllllllllyniiynynnnnkyynyyyyk',
    'knnnnnnnnnknnn=ynniilllllllnnyyynyyyynnnyynyyyyk',
    'knnnnnnnnnnnny=nnnnnylllllknnnyyyyyyynnykynyyynk',
    'kniiiynnnnnnyn=nnnnkynnnnnnnnnyyynynyyyyynnnynnk',
    'kiinnnnnnnnnnn=kniiinnnnnnnnnnynyynyyynnnnnnnyyk',
    'kinnnnnnnnnnnn=niiiiinnnnnnnnnynyyykyyyynnCnnyyk',
    'kinnZnn========niiiiinnnnnnnnnynyynynnnnnnnnnyyk',
    'knnnnnnnnnnnnnnniiiiinnnnnnnnnynnyyynnynynnnyyyk',
    'knnnnnnnnnnnnnnnniiinnnnnnnynnyyynyyyyynyyyyynnk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  ],
});
