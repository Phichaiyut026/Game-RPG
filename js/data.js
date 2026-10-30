// ================= Game Data (Items, Classes, Enemies, Quests) =================
const MATS = {
  gel:  { name:'Slime Gel', value:2 }, pelt:{ name:'Wolf Pelt', value:7 }, ear:{ name:'Goblin Ear', value:10 },
  bone: { name:'Old Bone', value:16 }, crown:{ name:'Warlord Crown', value:250 },
  silk: { name:'Spider Silk', value:14 }, tome:{ name:'Cursed Tome', value:25 }, phyl:{ name:'Phylactery', value:600 },
  abyssal_shard: { name:'Abyssal Shard', value:80 },
};
const CONSUMABLES = {
  mpot:   { name:'Mana Potion', value:10, color:'#60c0ff', desc:'Restores 60% of Max MP.' },
  elixir: { name:'Hero Elixir', value:25, color:'#d080ff', desc:'ATK +25%, Crit +15%, SPD +12% (30s).' },
  scroll: { name:'Town Scroll', value:18, color:'#f8e090', desc:'Teleports back to Ironvale Village.' },
};
const WEAPONS = {
  sword: [['Wooden Sword',2],['Iron Sword',5],['Steel Axe',9],['Knight Blade',14],['Rune Sword',21]],
  staff: [['Oak Staff',2],['Apprentice Rod',5],['Crystal Staff',9],['Arcane Scepter',14],['Staff of Stars',21]],
  bow:   [['Short Bow',2],['Hunter Bow',5],['Longbow',9],['Elven Bow',14],['Storm Bow',21]],
};
const CLASS_WT = { knight:'sword', mage:'staff', ranger:'bow' };
const WT_CLASS = { sword:'KNIGHT', staff:'MAGE', bow:'RANGER', gun:'ANY' };
// hp/mp = [base, per level]; skills unlock at the listed level, cd in frames
const CLASSES = {
  knight: { name:'Knight', hp:[50,14], mp:[30,3], atk:1.0,  def:2, desc:'Tough melee fighter.',
    skills:[{ name:'Whirlwind', tag:'WW', mp:15, cd:180, lvl:2 }, { name:'War Cry', tag:'WC', mp:25, cd:900, lvl:5 }] },
  mage:   { name:'Mage',   hp:[34,9],  mp:[60,8], atk:1.15, def:0, desc:'Fragile caster of magic bolts.',
    skills:[{ name:'Fireball', tag:'FB', mp:15, cd:120, lvl:2 }, { name:'Frost Nova', tag:'FN', mp:30, cd:600, lvl:5 }] },
  ranger: { name:'Ranger', hp:[42,11], mp:[40,5], atk:0.95, def:1, desc:'Swift archer with long range.',
    skills:[{ name:'Multishot', tag:'MS', mp:12, cd:120, lvl:2 }, { name:'Dash', tag:'DA', mp:10, cd:240, lvl:5 }] },
};
const CLASS_KEYS = Object.keys(CLASSES);

// ---- skill levels (T > SKILLS): Lv1..5, each level +20% power / -6% cooldown ----
const SKILL_MAX = 5;
const SKILL_DESC = {
  Whirlwind:'Spins and hits every foe around you.', 'War Cry':'Heals and raises ATK for a while.',
  Fireball:'Hurls an exploding ball of fire.', 'Frost Nova':'Damages and freezes foes around you.',
  Multishot:'Fires a fan of arrows.', Dash:'Dashes forward, untouchable.',
};
const skillReqLv = (s, lv) => s.lvl + (lv - 1) * 3;        // player level needed to reach skill level lv
// numbers shown on the upgrade card for skill s at level lv (matches useSkill in gameplay.js)
function skillInfo(s, lv) {
  const mul = 1 + 0.2 * (lv - 1), cd = (s.cd / 60 * (1 - 0.06 * (lv - 1))).toFixed(1) + 's', pct = v => Math.round(v * mul * 100) + '%';
  const rows = { Whirlwind: [['DAMAGE', pct(1.5)]], Fireball: [['DAMAGE', pct(2)]], Multishot: [['DAMAGE', pct(0.8)], ['ARROWS', '5']],
    'Frost Nova': [['DAMAGE', pct(1.2)], ['FREEZE', ((180 + 20 * (lv - 1)) / 60).toFixed(1) + 's']],
    'War Cry': [['HEAL', Math.round((0.3 + 0.05 * (lv - 1)) * 100) + '%'], ['BUFF TIME', (8 + (lv - 1)) + 's']],
    Dash: [['DASH', (12 + 2 * (lv - 1)) * 5 + 'px']] }[s.name];
  return [...rows, ['COOLDOWN', cd], ['MP COST', String(s.mp)]];
}

// ---- skill tree: 3 columns (body / skill 1 / skill 2+attack) x 3 tiers ----
const TIER_LVL = [1, 4, 8];
const TREE_SPECIAL = {
  knight: [['Wide Arc', 'Whirlwind radius +50%.'], ['Battle Fury', 'War Cry lasts 12s and gives ATK +75%.']],
  mage:   [['Inferno', 'Fireball blast radius +50%.'], ['Deep Freeze', 'Frost Nova is larger and freezes for 5s.']],
  ranger: [['Volley', 'Multishot fires 7 arrows.'], ['Shadow Step', 'After a Dash, every hit crits for 3s.']],
};
function treeNodes(cls) {
  const [s1, s2] = CLASSES[cls].skills.map(s => s.name), sp = TREE_SPECIAL[cls];
  return [
    { id:'hp',   col:0, tier:0, max:3, name:'Vitality',  desc:'+8% max HP per rank.' },
    { id:'spd',  col:0, tier:1, max:2, name:'Swiftness', desc:'+8% move speed per rank.' },
    { id:'gold', col:0, tier:2, max:2, name:'Fortune',   desc:'+20% gold from all sources per rank.' },
    { id:'s1p',  col:1, tier:0, max:3, name:`${s1}+`,    desc:`${s1} deals +25% damage per rank.` },
    { id:'s1c',  col:1, tier:1, max:2, name:'Focus',     desc:`${s1} cooldown -20% per rank.` },
    { id:'s1x',  col:1, tier:2, max:1, name:sp[0][0],    desc:sp[0][1] },
    { id:'atk',  col:2, tier:0, max:3, name:'Mastery',   desc:'Basic attacks deal +10% damage per rank.' },
    { id:'s2c',  col:2, tier:1, max:2, name:'Tempo',     desc:`${s2} cooldown -20% per rank.` },
    { id:'s2x',  col:2, tier:2, max:1, name:sp[1][0],    desc:sp[1][1] },
  ];
}
const rank = id => (p.tree && p.tree[id]) || 0;
const ARMORS  = [['Cloth Tunic',1],['Leather Vest',3],['Chain Mail',6],['Plate Armor',10],['Dragon Mail',15]];
const HELMS   = [['Leather Cap',1],['Iron Helm',2],['Visored Helm',4],['Knight Crown',7],['Dragon Visage',11]];
const BOOTS   = [['Cloth Shoes',1],['Leather Boots',2],['Chain Greaves',4],['Plate Sabatons',6],['Windwalkers',10]];
const RINGS   = [['Copper Ring',2],['Silver Ring',4],['Ruby Band',7],['Signet of Power',11],['Astral Loop',16]];
const GEAR_SLOTS = ['weapon', 'helm', 'armor', 'boots', 'ring'];
const SLOT_LBL = { weapon:'WPN', helm:'HLM', armor:'ARM', boots:'BTS', ring:'RNG' };
const isGear = it => it && GEAR_SLOTS.includes(it.kind);
const RAR = [
  { n:'',      c:'#e0e0e0', m:1.0, w:60, tag:'COMMON' }, { n:'Fine ', c:'#58d858', m:1.3, w:28, tag:'FINE' },
  { n:'Rare ', c:'#58a0ff', m:1.7, w:10, tag:'RARE' },   { n:'Epic ', c:'#c070ff', m:2.3, w:2,  tag:'EPIC' },
  { n:'',      c:'#ff9a30', m:3.0, w:0,  tag:'LEGEND' },   // never rolled: secret items only
];
// the secret weapon, found in a hidden grove in the Dark Forest; any class can wield it
const SECRET_AK = () => ({ kind:'weapon', wt:'gun', name:'AK-47', stat:28, rar:4, plus:0, value:1500, aff:[['crit', 10], ['vamp', 6]] });
const canWield = it => it.wt === 'gun' || (it.wt || 'sword') === CLASS_WT[p.cls];

// ---- Random Gear Affixes & Boss Crafting Recipes ----
const AFFIXES = {
  vamp:   { lbl:'Lifesteal',   range:[4, 8],   c:'#ff7090' },
  frost:  { lbl:'Frost Touch', range:[15, 25], c:'#80e0ff' },
  crit:   { lbl:'Crit Rate',   range:[4, 8],   c:'#f8c838' },
  cdr:    { lbl:'Skill Haste', range:[6, 12],  c:'#a0d8ff' },
  greed:  { lbl:'Gold Find',   range:[10, 22], c:'#f8e070' },
  thorns: { lbl:'Thorns',      range:[15, 30], c:'#d090ff' },
};
const AFFIX_KEYS = Object.keys(AFFIXES);
const affixText = ([k, v]) => `${AFFIXES[k].lbl} +${v}%`;
function gearBonus(id) {
  let sum = 0;
  for (const s of GEAR_SLOTS) if (p[s] && p[s].aff) for (const [k, v] of p[s].aff) if (k === id) sum += v;
  return sum;
}
function rollAffixes(rar) {
  const n = rar >= 3 ? 2 : rar === 2 ? 1 : rar === 1 && R() < 0.5 ? 1 : 0;
  if (!n) return undefined;
  const pool = [...AFFIX_KEYS], out = [];
  for (let i = 0; i < n; i++) {
    const k = pool.splice(ri(0, pool.length - 1), 1)[0], [lo, hi] = AFFIXES[k].range;
    out.push([k, ri(lo, hi)]);
  }
  return out;
}
const RECIPES = [
  { name:"Hunter's Striders", kind:'boots',  rar:2, stat:5,  gold:80,   mats:[['pelt', 3], ['ear', 2]],              aff:[['crit', 6], ['cdr', 8]] },
  { name:'Silkweave Tunic',   kind:'armor',  rar:2, stat:9,  gold:160,  mats:[['silk', 4], ['tome', 2]],             aff:[['cdr', 10], ['vamp', 5]] },
  { name:"Warlord's Helm",    kind:'helm',   rar:3, stat:10, gold:320,  mats:[['crown', 1], ['bone', 4]],            aff:[['vamp', 7], ['thorns', 25]] },
  { name:'Lich Soulband',     kind:'ring',   rar:3, stat:15, gold:500,  mats:[['phyl', 1], ['tome', 3]],             aff:[['vamp', 8], ['cdr', 12]] },
  { name:'Frostwyrm Arms',    kind:'weapon', rar:4, stat:25, gold:800,  mats:[['wyrmscale', 1], ['shard', 3], ['fur', 2]], aff:[['frost', 25], ['crit', 8]] },
  { name:'Infernal Plate',    kind:'armor',  rar:4, stat:22, gold:1000, mats:[['iheart', 1], ['molten', 3], ['core', 3]],  aff:[['thorns', 30], ['vamp', 8]] },
  { name:'Voidwalker Arms',   kind:'weapon', rar:4, stat:32, gold:1500, mats:[['abyssal_shard', 6], ['crown', 1], ['phyl', 1]], aff:[['crit', 10], ['vamp', 8]] },
  { name:'Abyssal Voidcloak', kind:'armor',  rar:4, stat:28, gold:1200, mats:[['abyssal_shard', 5], ['tome', 3], ['silk', 4]],  aff:[['cdr', 14], ['thorns', 35]] },
];
function makeRecipeItem(rec) {
  const wt = CLASS_WT[p.cls];
  let name = rec.name;
  if (rec.kind === 'weapon') {
    if (rec.name === 'Frostwyrm Arms') name = { sword:'Frostwyrm Blade', staff:'Frostwyrm Staff', bow:'Frostwyrm Bow' }[wt];
    else if (rec.name === 'Voidwalker Arms') name = { sword:'Voidwalker Blade', staff:'Voidwalker Scepter', bow:'Voidwalker Bow' }[wt];
  }
  const it = { kind: rec.kind, name, stat: rec.stat, rar: rec.rar, plus: 0, value: Math.round(rec.gold * 0.7), aff: rec.aff.map(a => [...a]) };
  if (rec.kind === 'weapon') it.wt = wt;
  return it;
}
const ETYPES = {
  slime: { name:'Slime',       hp:14,  atk:4,  def:0, spd:0.45, xp:6,   gold:[1,3],     aggro:60,  drop:['gel',0.6],   gear:0.04, tier:0 },
  wolf:  { name:'Wolf',        hp:34,  atk:9,  def:1, spd:1.05, xp:16,  gold:[3,8],     aggro:100, drop:['pelt',0.5],  gear:0.07, tier:1 },
  goblin:{ name:'Goblin',      hp:44,  atk:11, def:2, spd:0.75, xp:22,  gold:[5,12],    aggro:90,  drop:['ear',0.5],   gear:0.12, tier:1 },
  skel:  { name:'Skeleton',    hp:80,  atk:17, def:5, spd:0.8,  xp:45,  gold:[8,18],    aggro:100, drop:['bone',0.5],  gear:0.12, tier:2 },
  spider:  { name:'Cave Spider', hp:60,   atk:15, def:3,  spd:1.2, xp:35,   gold:[6,14],    aggro:110, drop:['silk',0.5],  gear:0.1,  tier:2 },
  bknight: { name:'Bone Knight', hp:140,  atk:22, def:8,  spd:0.6, xp:70,   gold:[12,25],   aggro:100, drop:['bone',0.6],  gear:0.15, tier:3 },
  cultist: { name:'Cultist',     hp:70,   atk:18, def:2,  spd:0.5, xp:55,   gold:[10,20],   aggro:150, drop:['tome',0.4],  gear:0.15, tier:3, ranged:true },
  lich:    { name:'Lich King',   hp:1400, atk:32, def:10, spd:0.5, xp:1500, gold:[400,700], aggro:220, drop:['phyl',1],    gear:1,    tier:4, boss:true, ranged:true, w:24, h:24 },
  orc:   { name:'Orc Warlord', hp:500, atk:26, def:8, spd:0.7,  xp:350, gold:[120,220], aggro:140, drop:['crown',1],   gear:1,    tier:3, boss:true, w:24, h:24 },
  dummy: { name:'Training Dummy', hp:999, atk:0, def:2, spd:0, xp:0, gold:[0,0], aggro:0, drop:['gel',0], gear:0, tier:0, dummy:true },
};
const bestiaryKeys = () => Object.keys(ETYPES).filter(k => !ETYPES[k].dummy);
const masteryGoal  = k => ETYPES[k]?.boss ? 1 : 10;
const killCount    = k => (p && p.kills && p.kills[k]) || 0;
const hasMastery   = k => killCount(k) >= masteryGoal(k);
const ELITE_MODS = {
  blazing:    { name: 'Blazing',    c: '#ff5030', hp: 2.2, atk: 1.4, spd: 1.25, xp: 2.5, gold: 2.5 },
  juggernaut: { name: 'Juggernaut', c: '#d070ff', hp: 3.2, atk: 1.6, spd: 0.9,  xp: 3.0, gold: 3.0 },
  treasure:   { name: 'Treasure',   c: '#ffd838', hp: 2.0, atk: 1.1, spd: 1.35, xp: 2.5, gold: 5.0, extraLoot: true },
};
const ELITE_KEYS = Object.keys(ELITE_MODS);
const PETS = {
  wolf:  { name: 'Wolf Pup',        lvl: 1, c: '#d09050', desc: 'Fetches loot & bites nearby foes' },
  fairy: { name: 'Spirit Fairy',    lvl: 5, c: '#60e8ff', desc: 'Fetches loot, zaps foes & heals you' },
  wyrm:  { name: 'Frost Hatchling', lvl: 9, c: '#90d8ff', desc: 'Fetches loot & breathes chilling ice' },
};
const PET_KEYS = Object.keys(PETS);

// ---- Achievements & Titles System ----
const ACHIEVEMENTS = {
  first_blood: {
    id: 'first_blood', name: 'First Blood', desc: 'Slay your first monster in the wild.',
    title: 'Novice', color: '#a0d8ff', bonus: { xp: 5 }, bonusDesc: '+5% XP Gain', secret: false,
    check: () => Object.values((p && p.kills) || {}).reduce((a, b) => a + b, 0) >= 1
  },
  apprentice: {
    id: 'apprentice', name: 'Path of Power', desc: 'Reach Player Level 5.',
    title: 'Apprentice', color: '#60e8ff', bonus: { mp: 15 }, bonusDesc: '+15 Max MP', secret: false,
    check: () => p && p.lvl >= 5
  },
  veteran: {
    id: 'veteran', name: 'Ironvale Veteran', desc: 'Reach Player Level 10.',
    title: 'Veteran', color: '#7ad858', bonus: { hp: 40 }, bonusDesc: '+40 Max HP', secret: false,
    check: () => p && p.lvl >= 10
  },
  warlord_slayer: {
    id: 'warlord_slayer', name: "Warlord's Bane", desc: 'Defeat the Orc Warlord in the Old Ruins.',
    title: 'Warlord Slayer', color: '#ff9040', bonus: { atk: 5 }, bonusDesc: '+5 Flat ATK', secret: false,
    check: () => (p?.kills?.orc || 0) >= 1
  },
  crypt_breaker: {
    id: 'crypt_breaker', name: 'Crypt Breaker', desc: 'Defeat the Lich King on Floor B3 of the Crypt.',
    title: 'Crypt Breaker', color: '#c080ff', bonus: { crit: 5 }, bonusDesc: '+5% Crit Rate', secret: false,
    check: () => (p?.kills?.lich || 0) >= 1
  },
  dragon_slayer: {
    id: 'dragon_slayer', name: 'Dragon Slayer', desc: 'Slay the ancient Frost Wyrm at Frostpeak Pass.',
    title: 'Dragon Slayer', color: '#80e8ff', bonus: { bossDmg: 12 }, bonusDesc: '+12% Boss DMG', secret: false,
    check: () => (p?.kills?.frostwyrm || 0) >= 1
  },
  infernal_conqueror: {
    id: 'infernal_conqueror', name: 'Lord of Flames', desc: 'Conquer the Infernal Lord in Emberfall Crater.',
    title: 'Lord of Flames', color: '#ff4030', bonus: { atkPct: 8 }, bonusDesc: '+8% Total ATK', secret: false,
    check: () => (p?.kills?.infernal || 0) >= 1
  },
  gladiator: {
    id: 'gladiator', name: 'Arena Gladiator', desc: 'Survive to Wave 5 in the Colosseum.',
    title: 'Gladiator', color: '#ffd838', bonus: { def: 4 }, bonusDesc: '+4 DEF', secret: false,
    check: () => (p?.bestWave || 0) >= 5
  },
  arena_champion: {
    id: 'arena_champion', name: 'Grand Champion', desc: 'Survive to Wave 15 in the Colosseum.',
    title: 'Grand Champion', color: '#f8c838', bonus: { atk: 4, def: 3, hp: 30 }, bonusDesc: '+4 ATK, +3 DEF, +30 HP', secret: true,
    check: () => (p?.bestWave || 0) >= 15
  },
  millionaire: {
    id: 'millionaire', name: 'Hoarder of Gold', desc: 'Accumulate 3,000 Gold in your purse.',
    title: 'The Wealthy', color: '#ffd700', bonus: { gold: 20 }, bonusDesc: '+20% Gold Find', secret: false,
    check: () => (p?.gold || 0) >= 3000
  },
  blacksmith: {
    id: 'blacksmith', name: 'Master of the Forge', desc: 'Upgrade any piece of gear to +5 or higher.',
    title: 'Master Smith', color: '#ffb050', bonus: { atk: 3, def: 2 }, bonusDesc: '+3 ATK, +2 DEF', secret: false,
    check: () => GEAR_SLOTS.some(s => p && p[s] && p[s].plus >= 5)
  },
  enchanter: {
    id: 'enchanter', name: 'Rune Enchanter', desc: 'Reroll equipment affixes at the Merchant.',
    title: 'Enchanter', color: '#d080ff', bonus: { spd: 5 }, bonusDesc: '+5% Move Speed', secret: false,
    check: () => (p?.stats?.rerolls || 0) >= 1
  },
  beast_master: {
    id: 'beast_master', name: 'Beast Master', desc: 'Unlock Hunter Mastery (★) for 4 different monsters.',
    title: 'Beast Master', color: '#58d858', bonus: { bossDmg: 8, spd: 5 }, bonusDesc: '+8% Boss DMG, +5% SPD', secret: false,
    check: () => Object.keys(ETYPES).filter(k => (p?.kills?.[k] || 0) >= (ETYPES[k].boss ? 1 : 10)).length >= 4
  },
  secret_agent: {
    id: 'secret_agent', name: 'Secret Hunter', desc: 'Find the hidden chest in the secret grove.',
    title: 'Secret Agent', color: '#ff9a30', bonus: { crit: 8 }, bonusDesc: '+8% Crit Rate', secret: true,
    check: () => !!(p && p.akFound)
  },
  blessed: {
    id: 'blessed', name: 'Blessed Soul', desc: 'Make 3 wishes with gold at the Village Well.',
    title: 'Blessed', color: '#60f0ff', bonus: { regen: 2 }, bonusDesc: '2x Health & Mana Regen', secret: true,
    check: () => (p?.stats?.wellWishes || 0) >= 3
  },
  untouchable: {
    id: 'untouchable', name: 'Ghost Walker', desc: 'Perform 30 dodge rolls.',
    title: 'Ghost', color: '#d0d8f0', bonus: { spd: 10 }, bonusDesc: '+10% Move Speed', secret: true,
    check: () => (p?.stats?.rolls || 0) >= 30
  },
  rift_initiate: {
    id: 'rift_initiate', name: 'Void Seeker', desc: 'Enter the Abyssal Rift for the first time.',
    title: 'Void Seeker', color: '#a090ff', bonus: { gold: 15 }, bonusDesc: '+15% Gold Find', secret: false,
    check: () => (p?.stats?.riftsEntered || 0) >= 1 || (p?.bestRift || 0) >= 1
  },
  rift_walker: {
    id: 'rift_walker', name: 'Rift Walker', desc: 'Reach Depth 5 in the Abyssal Rift.',
    title: 'Rift Walker', color: '#c080ff', bonus: { spd: 8, crit: 5 }, bonusDesc: '+8% Speed, +5% Crit', secret: false,
    check: () => (p?.bestRift || 0) >= 5
  },
  abyss_conqueror: {
    id: 'abyss_conqueror', name: 'Abyss Conqueror', desc: 'Conquer Depth 10 in the Abyssal Rift.',
    title: 'Abyss Conqueror', color: '#9060ff', bonus: { bossDmg: 15, atk: 6 }, bonusDesc: '+15% Boss DMG, +6 ATK', secret: false,
    check: () => (p?.bestRift || 0) >= 10
  },
  void_lord: {
    id: 'void_lord', name: 'Lord of the Void', desc: 'Descend to Depth 20 in the Abyssal Rift.',
    title: 'Void Lord', color: '#ff50e0', bonus: { atkPct: 12, hp: 50, mp: 25 }, bonusDesc: '+12% ATK, +50 HP, +25 MP', secret: true,
    check: () => (p?.bestRift || 0) >= 20
  }
};
const ACHIEVE_KEYS = Object.keys(ACHIEVEMENTS);
const titleBonus = kind => (p && p.title && ACHIEVEMENTS[p.title]?.bonus?.[kind]) || 0;
const ZONES = [
  { name:'Meadow',      x0:27, x1:44, mobs:[['slime',14]] },
  { name:'Dark Forest', x0:49, x1:67, mobs:[['wolf',8],['goblin',7]] },
  { name:'Old Ruins',   x0:69, x1:85, mobs:[['skel',10]] },
];
const zoneAt = px => { if (typeof rift !== 'undefined' && rift) return `Abyssal Rift D${rift}`; if (typeof arena !== 'undefined' && arena) return `Colosseum W${arena}`; if (dungeon) return `Crypt B${dungeon}`; if (region) return MAPS[region].name; const tx = px / T; return tx < 26 ? 'Ironvale Village' : tx < 47 ? 'Meadow' : tx < 68 ? 'Dark Forest' : 'Old Ruins'; };

function rollGear(tier, minR = 0, own = false) {
  const pick = R();
  const kind = pick < 0.34 ? 'weapon' : pick < 0.60 ? 'armor' : pick < 0.75 ? 'helm' : pick < 0.88 ? 'boots' : 'ring';
  const wt = own || R() < 0.6 ? CLASS_WT[p.cls] : ['sword', 'staff', 'bow'][ri(0, 2)];
  const table = kind === 'weapon' ? WEAPONS[wt] : kind === 'armor' ? ARMORS : kind === 'helm' ? HELMS : kind === 'boots' ? BOOTS : RINGS;
  const base = table[Math.min(4, tier + (R() < 0.25 ? 1 : 0))];
  let roll = R() * 100, r = 0;
  while (roll > RAR[r].w && r < 3) { roll -= RAR[r].w; r++; }
  r = Math.max(r, minR);
  const stat = Math.max(1, Math.round(base[1] * RAR[r].m));
  const aff = rollAffixes(r);
  const it = { kind, name: RAR[r].n + base[0], stat, rar: r, plus: 0, value: Math.round(stat * 5 * RAR[r].m) };
  if (aff) it.aff = aff;
  if (kind === 'weapon') it.wt = wt;
  return it;
}
const itemStat  = it => it.stat + it.plus * Math.max(1, Math.ceil(it.stat * 0.15));
const itemName  = it => it.kind === 'mat' ? MATS[it.id].name + (it.count > 1 ? ' x' + it.count : '')
  : it.kind === 'use' ? CONSUMABLES[it.id].name + (it.count > 1 ? ' x' + it.count : '')
  : it.name + (it.plus ? ' +' + it.plus : '');
const itemValue = it => it.kind === 'mat' ? MATS[it.id].value * it.count
  : it.kind === 'use' ? CONSUMABLES[it.id].value * it.count
  : it.value + it.plus * 15;
const itemColor = it => it.kind === 'mat' ? '#e0e0e0' : it.kind === 'use' ? CONSUMABLES[it.id].color : RAR[it.rar].c;
const itemIcon   = it => it.kind === 'mat' || it.kind === 'use' ? ICON[it.id] : it.kind === 'weapon' ? ICON[it.wt || 'sword'] : ICON[it.kind] || ICON.armor;
const upCost     = it => Math.round(20 * (it.plus + 1) ** 1.6 + it.stat * 6);
const rerollCost = it => Math.round(35 + it.stat * 8 + (it.rar || 1) * 45);

// ---- NPCs & Quests ----
const npc = (id, name, spr, tx, ty, flip = false) => ({ id, name, spr, x: tx * T + 2, y: ty * T + 2, w: 12, h: 12, flip });
const MERCH     = npc('merchant', 'MERCHANT', MERCHANT, 11, 22);
const ELDER     = npc('elder', 'ELDER BRANN', ELDER_SPR, 8, 20);
const HUNTER    = npc('hunter', 'MIRA THE HUNTER', HUNTER_SPR, 16, 27, true);
const ARENA_NPC = npc('arena', 'ARENA MASTER', ARENA_SPR, 14, 15, true);
const SEER      = npc('seer', 'VOID SEER MALAKOR', SEER_SPR, 10, 15, true);
const GUARD     = npc('guard', 'CAPTAIN VORN', GUARD_SPR, 23, 22);
const GUARDS = [
  GUARD,
  npc('guard', 'EAST GATE GUARD', GUARD_SPR, 23, 27),
  npc('guard', 'NORTH WALL GUARD', GUARD_SPR, 23, 14),
  npc('guard', 'SOUTH WALL GUARD', GUARD_SPR, 23, 34),
  npc('guard', 'NORTH GATE GUARD', GUARD_SPR, 10, 10),
  npc('guard', 'NORTH SENTRY', GUARD_SPR, 15, 10, true),
  npc('guard', 'SOUTH GATE GUARD', GUARD_SPR, 10, 39),
  npc('guard', 'SOUTH SENTRY', GUARD_SPR, 15, 39, true),
];
const NPCS = [MERCH, ELDER, HUNTER, ARENA_NPC, SEER, ...GUARDS];

const PLURAL = { slime:'Slimes', wolf:'Wolves', goblin:'Goblins', skel:'Skeletons', orc:'Orc Warlord',
  spider:'Cave Spiders', bknight:'Bone Knights', cultist:'Cultists', lich:'Lich King' };
const STORY = [
  { name:'Slime Trouble', type:'kill', target:'slime', n:5, gold:50, xp:40, potions:2,
    intro:'Slimes are eating our crops in the Meadow east of here. Please slay 5 of them.', done:'The fields are safe again. Take this, with my thanks.' },
  { name:'Warm Pelts', type:'collect', target:'pelt', n:3, gold:120, xp:100,
    intro:'Winter is coming. Bring me 3 Wolf Pelts from the Dark Forest across the river.', done:'Fine pelts! The children will be warm this winter.' },
  { name:'Goblin Raiders', type:'kill', target:'goblin', n:6, gold:200, xp:200, gear:[1, 2],
    intro:'Goblins raided our caravan in the Dark Forest. Teach 6 of them a lesson.', done:'They will think twice now. Take this gear from my old adventuring days.' },
  { name:'Into the Ruins', type:'visit', target:'Old Ruins', n:1, gold:100, xp:150,
    intro:'Strange lights glow in the Old Ruins far to the east. Go and see what lurks there.', done:'Skeletons walk again? Dark magic is at work...' },
  { name:'Bones of Old', type:'kill', target:'skel', n:8, gold:400, xp:500,
    intro:'Put 8 of those restless skeletons back to sleep.', done:'You grow stronger every day. I am proud of you.' },
  { name:'The Warlord', type:'kill', target:'orc', n:1, gold:1000, xp:1500, gear:[3, 3],
    intro:'The Orc Warlord commands the dead from the heart of the ruins. End him, and Ironvale is free.', done:'You did it! Songs will be sung of you. Take this treasure, hero.' },
  { name:'The Depths', type:'kill', target:'lich', n:1, gold:2500, xp:3000, gear:[4, 3],
    intro:'The dead still stir... A stairway in the Old Ruins leads to an ancient crypt. On its third floor sleeps the Lich King. Destroy him.', done:'The curse is broken at last. You are the true hero of Ironvale!' },
  { name:'Frozen Pass', type:'kill', target:'yeti', n:5, gold:1500, xp:1800,
    intro:'A mystic portal opened north of the Meadow, leading to Frostpeak Pass. Slay 5 Yetis to secure the mountain trail.', done:'Even the mountain beasts bow to your might! Prepare yourself for what rules the peak.' },
  { name:'The Frost Wyrm', type:'kill', target:'frostwyrm', n:1, gold:3500, xp:4000, gear:[4, 3],
    intro:'At the summit of Frostpeak nests the ancient Frost Wyrm. Slay the beast before its blizzard buries Ironvale!', done:'Incredible! You have slain a dragon of legend. Yet a fiery tremor now shakes the southern forest...' },
  { name:'Emberfall Lord', type:'kill', target:'infernal', n:1, gold:5000, xp:6000, gear:[4, 4],
    intro:'A fiery rift in the southern Dark Forest leads to Emberfall Crater. Defeat the Infernal Lord at its heart!', done:'Ice and fire alike have fallen before you. Your name will echo through eternity, Champion of Ironvale!' },
];
const BOUNTIES = [
  { target:'slime', n:8, lvl:1 }, { target:'wolf', n:6, lvl:3 }, { target:'goblin', n:6, lvl:4 },
  { target:'spider', n:6, lvl:6 }, { target:'skel', n:6, lvl:7 }, { target:'icewolf', n:6, lvl:8 },
  { target:'yeti', n:5, lvl:9 }, { target:'magmaslime', n:6, lvl:10 }, { target:'lavagolem', n:4, lvl:11 },
];
const GUARD_TIPS = [
  'Cross the river by the main road, or the small bridges to the north and south.',
  'Wolves are fast. Do not try to outrun them, stand and fight!',
  'The merchant pays well for loot. Sell often and upgrade your gear at his anvil.',
  'Rest inside the village walls. Your wounds and mana heal quickly here.',
  'They say the Orc Warlord slams the ground. Step back when you see the red ring!',
  'A stairway in the Old Ruins leads down to a dark crypt. Its chests hold great treasure.',
  'Press T to open your skill tree. Every level gives you a skill point.',
  'Hunters whisper of a trail in the Dark Forest that ends at a pine... that is not really a pine.',
  'Mystic portals north of the Meadow and south of the Dark Forest lead to Frostpeak and Emberfall.',
];
