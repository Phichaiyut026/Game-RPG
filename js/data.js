// ================= Game Data (Items, Classes, Enemies, Quests) =================
const MATS = {
  gel:  { name:'Infected Flesh', value:2 }, pelt:{ name:'Biohazard Fiber', value:7 }, ear:{ name:'Corrosive Acid Gland', value:10 },
  bone: { name:'Mutated Bone Shard', value:16 }, crown:{ name:'Goliath Tank Core', value:250 },
  silk: { name:'Necrotic Sinew', value:14 }, tome:{ name:'Biohazard Intel', value:25 }, phyl:{ name:'Alpha Tyrant Organ', value:600 },
  abyssal_shard: { name:'Dark Bio-Mutagen', value:80 },
};
const CONSUMABLES = {
  mpot:   { name:'Energy Cell', value:10, color:'#60c0ff', desc:'Restores 60% of Max Power/Energy.' },
  elixir: { name:'Combat Stimpack', value:25, color:'#d080ff', desc:'ATK +25%, Crit +15%, SPD +12% (30s).' },
  scroll: { name:'Tactical Beacon', value:18, color:'#f8e090', desc:'Rapid evac back to Quarantine Outpost Alpha.' },
};
const WEAPONS = {
  rifle:  [['Carbine M4A1',2],['Assault Rifle AK-74',5],['Tactical SCAR-H',9],['G36 Battle Rifle',14],['Prototype Rail-Rifle',21]],
  sniper: [['Hunting Rifle .308',2],['Scout Rifle SVD',5],['AWM Precision Sniper',9],['Anti-Materiel .50 Cal',14],['Gauss Long-Rifle',21]],
  heavy:  [['Combat Shotgun 12G',2],['Submachine MP5',5],['M249 Light Machine Gun',9],['Rotary Minigun',14],['Plasma Cannon',21]],
  // Backward compatibility aliases
  sword:  [['Carbine M4A1',2],['Assault Rifle AK-74',5],['Tactical SCAR-H',9],['G36 Battle Rifle',14],['Prototype Rail-Rifle',21]],
  staff:  [['Hunting Rifle .308',2],['Scout Rifle SVD',5],['AWM Precision Sniper',9],['Anti-Materiel .50 Cal',14],['Gauss Long-Rifle',21]],
  bow:    [['Combat Shotgun 12G',2],['Submachine MP5',5],['M249 Light Machine Gun',9],['Rotary Minigun',14],['Plasma Cannon',21]],
};
const CLASS_WT = {
  assault:'rifle', sniper:'sniper', heavy:'heavy',
  knight:'rifle', mage:'sniper', ranger:'heavy'
};
const WT_CLASS = {
  rifle:'ASSAULT', sniper:'SNIPER', heavy:'HEAVY GUNNER', gun:'ANY',
  sword:'ASSAULT', staff:'SNIPER', bow:'HEAVY GUNNER'
};
// hp/mp = [base, per level]; cd in frames
const CLASSES = {
  assault: { name:'Assault Specialist', hp:[50,14], mp:[30,3], atk:1.0,  def:2, role:'Assault Rifle', desc:'Frontline operative with automatic rifle bursts and high armor.', skills:[] },
  sniper:  { name:'Recon Sniper',       hp:[34,9],  mp:[60,8], atk:1.15, def:0, role:'Sniper Rifle', desc:'Long-range sharpshooter firing high-velocity piercing rounds.', skills:[] },
  heavy:   { name:'Heavy Gunner',       hp:[42,11], mp:[40,5], atk:0.95, def:1, role:'Shotgun / Heavy', desc:'Suppressive fire specialist with heavy shotgun spread and combat roll.', skills:[] },
};
// Aliases for legacy saves
CLASSES.knight = CLASSES.assault;
CLASSES.mage = CLASSES.sniper;
CLASSES.ranger = CLASSES.heavy;

const CLASS_KEYS = ['assault', 'sniper', 'heavy'];

// ---- tactical training tree: 3 columns (Survival / Ballistics / Tactics) x 3 tiers ----
const TIER_LVL = [1, 4, 8];
const TREE_SPECIAL = {
  assault: [['Shrapnel Rounds', 'Rifle bullets cause +25% explosive area damage.'], ['Combat Trance', 'Rapid kills grant +25% move speed and instant reload for 4s.']],
  sniper:  [['Piercing Core', 'Sniper rounds pierce through all enemies without damage drop.'], ['Deadly Focus', 'Scoped shots gain +35% critical strike damage.']],
  heavy:   [['Lead Storm', 'Shotguns fire 2 extra heavy buckshot pellets.'], ['Shadow Breach', 'After a combat roll, shots gain 100% critical strike chance for 3s.']],
  knight:  [['Shrapnel Rounds', 'Rifle bullets cause +25% explosive area damage.'], ['Combat Trance', 'Rapid kills grant +25% move speed and instant reload for 4s.']],
  mage:    [['Piercing Core', 'Sniper rounds pierce through all enemies without damage drop.'], ['Deadly Focus', 'Scoped shots gain +35% critical strike damage.']],
  ranger:  [['Lead Storm', 'Shotguns fire 2 extra heavy buckshot pellets.'], ['Shadow Breach', 'After a combat roll, shots gain 100% critical strike chance for 3s.']],
};
function treeNodes(cls) {
  const normCls = (cls === 'knight') ? 'assault' : (cls === 'mage') ? 'sniper' : (cls === 'ranger') ? 'heavy' : cls;
  const sp = TREE_SPECIAL[normCls];
  return [
    { id:'hp',   col:0, tier:0, max:3, name:'Conditioning', desc:'+8% max HP/Armor per rank.' },
    { id:'spd',  col:0, tier:1, max:2, name:'Mobility',     desc:'+8% move speed per rank.' },
    { id:'gold', col:0, tier:2, max:2, name:'Bounty Pay',   desc:'+20% combat pay & loot from all sources per rank.' },
    { id:'atk',  col:1, tier:0, max:3, name:'Firearm Training', desc:'Basic firearm attacks deal +10% damage per rank.' },
    { id:'s2c',  col:1, tier:1, max:2, name:'Quick Reload', desc:'Firearm reload time -12% per rank.' },
    { id:'s1x',  col:1, tier:2, max:1, name:sp[0][0],       desc:sp[0][1] },
    { id:'crit', col:2, tier:0, max:3, name:'Targeting Visor', desc:'+5% firearm critical strike chance per rank.' },
    { id:'roll', col:2, tier:1, max:2, name:'Combat Evasion', desc:'Combat roll cooldown -20% per rank.' },
    { id:'s2x',  col:2, tier:2, max:1, name:sp[1][0],       desc:sp[1][1] },
  ];
}
const rank = id => (p.tree && p.tree[id]) || 0;
const ARMORS  = [['Fatigue Webbing',1],['Tactical Kevlar Vest',3],['Ballistic Flak Vest',6],['Exosuit Body Armor',10],['Titanium Dreadnought Frame',15]];
const HELMS   = [['Field Beret',1],['Kevlar Helmet',2],['PASGT Ballistic Helmet',4],['Night Vision Visor (NVG)',7],['Tactical HUD Targeting Visor',11]];
const BOOTS   = [['Standard Boots',1],['Tactical Combat Boots',2],['Reinforced Assault Greaves',4],['Hydraulic Jump-Boots',6],['Nano-Fiber Striders',10]];
const RINGS   = [['Field Dog Tags',2],['Radio Transponder',4],['Laser Aiming Module',7],['Spec-Ops Comm Unit',11],['Quantum Sensor Band',16]];
const GEAR_SLOTS = ['weapon', 'helm', 'armor', 'boots', 'ring'];
const SLOT_LBL = { weapon:'WPN', helm:'HLM', armor:'ARM', boots:'BTS', ring:'TAC' };
const isGear = it => it && GEAR_SLOTS.includes(it.kind);
const RAR = [
  { n:'',      c:'#e0e0e0', m:1.0, w:60, tag:'STANDARD' }, { n:'Spec-Ops ', c:'#58d858', m:1.3, w:28, tag:'SPEC-OPS' },
  { n:'Tactical ', c:'#58a0ff', m:1.7, w:10, tag:'TACTICAL' }, { n:'Elite ', c:'#c070ff', m:2.3, w:2,  tag:'ELITE' },
  { n:'',      c:'#ff9a30', m:3.0, w:0,  tag:'PROTOTYPE' },   // never rolled: secret items only
];
// the secret weapon, found in a hidden weapons cache in the Blackwood Valley
const SECRET_AK = () => ({ kind:'weapon', wt:'gun', name:'Legendary AK-47 Golden', stat:28, rar:4, plus:0, value:1500, aff:[['crit', 10], ['vamp', 6]] });
const canWield = it => it.wt === 'gun' || (it.wt || 'rifle') === CLASS_WT[p.cls];

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
  { name:"Biohazard Stalker Boots", kind:'boots',  rar:2, stat:5,  gold:80,   mats:[['pelt', 3], ['ear', 2]],              aff:[['crit', 6], ['cdr', 8]] },
  { name:'Chem-Resistant Kevlar',   kind:'armor',  rar:2, stat:9,  gold:160,  mats:[['silk', 4], ['tome', 2]],             aff:[['cdr', 10], ['vamp', 5]] },
  { name:"Bio-Colossus Helmet",     kind:'helm',   rar:3, stat:10, gold:320,  mats:[['crown', 1], ['bone', 4]],            aff:[['vamp', 7], ['thorns', 25]] },
  { name:'Alpha Tyrant Sensor Band',kind:'ring',   rar:3, stat:15, gold:500,  mats:[['phyl', 1], ['tome', 3]],             aff:[['vamp', 8], ['cdr', 12]] },
  { name:'Goliath Tank-Buster Arms',kind:'weapon', rar:4, stat:25, gold:800,  mats:[['wyrmscale', 1], ['shard', 3], ['fur', 2]], aff:[['frost', 25], ['crit', 8]] },
  { name:'Volcanic Titan Exosuit',  kind:'armor',  rar:4, stat:22, gold:1000, mats:[['iheart', 1], ['molten', 3], ['core', 3]],  aff:[['thorns', 30], ['vamp', 8]] },
  { name:'Omega Rail-Cannon Arms',  kind:'weapon', rar:4, stat:32, gold:1500, mats:[['abyssal_shard', 6], ['crown', 1], ['phyl', 1]], aff:[['crit', 10], ['vamp', 8]] },
  { name:'Tactical Biohazard Cloak',kind:'armor',  rar:4, stat:28, gold:1200, mats:[['abyssal_shard', 5], ['tome', 3], ['silk', 4]],  aff:[['cdr', 14], ['thorns', 35]] },
];
function makeRecipeItem(rec) {
  const wt = CLASS_WT[p.cls] || 'rifle';
  let name = rec.name;
  if (rec.kind === 'weapon') {
    if (rec.name.includes('Goliath') || rec.name.includes('Frostwyrm')) {
      name = { rifle:'Goliath Battle Rifle', sniper:'Goliath Heavy Sniper', heavy:'Goliath Heavy Autocannon', sword:'Goliath Battle Rifle', staff:'Goliath Heavy Sniper', bow:'Goliath Heavy Autocannon' }[wt] || rec.name;
    } else if (rec.name.includes('Omega') || rec.name.includes('Voidwalker')) {
      name = { rifle:'Omega Assault Rifle', sniper:'Omega Rail-Sniper', heavy:'Omega Rotary Minigun', sword:'Omega Assault Rifle', staff:'Omega Rail-Sniper', bow:'Omega Rotary Minigun' }[wt] || rec.name;
    }
  }
  const it = { kind: rec.kind, name, stat: rec.stat, rar: rec.rar, plus: 0, value: Math.round(rec.gold * 0.7), aff: rec.aff.map(a => [...a]) };
  if (rec.kind === 'weapon') it.wt = wt;
  return it;
}
const ETYPES = {
  slime: { name:'Walker Zombie',         hp:14,  atk:4,  def:0, spd:0.45, xp:6,   gold:[1,3],     aggro:60,  drop:['gel',0.6],   gear:0.04, tier:0 },
  wolf:  { name:'Infected Runner',       hp:34,  atk:9,  def:1, spd:1.05, xp:16,  gold:[3,8],     aggro:100, drop:['pelt',0.5],  gear:0.07, tier:1 },
  goblin:{ name:'Toxic Crawler',         hp:44,  atk:11, def:2, spd:0.75, xp:22,  gold:[5,12],    aggro:90,  drop:['ear',0.5],   gear:0.12, tier:1 },
  skel:  { name:'Infected Hazmat Soldier', hp:80, atk:17, def:5, spd:0.8,  xp:45,  gold:[8,18],    aggro:100, drop:['bone',0.5],  gear:0.12, tier:2 },
  spider:  { name:'Parasite Leaper',     hp:60,   atk:15, def:3,  spd:1.2, xp:35,   gold:[6,14],    aggro:110, drop:['silk',0.5],  gear:0.1,  tier:2 },
  bknight: { name:'Riot Shield Juggernaut', hp:140, atk:22, def:8, spd:0.6, xp:70,   gold:[12,25],   aggro:100, drop:['bone',0.6],  gear:0.15, tier:3 },
  cultist: { name:'Toxic Acid Spitter',  hp:70,   atk:18, def:2,  spd:0.5, xp:55,   gold:[10,20],   aggro:150, drop:['tome',0.4],  gear:0.15, tier:3, ranged:true, shotColor:'#60ff40' },
  lich:    { name:'Nemesis Tyrant',      hp:1400, atk:32, def:10, spd:0.5, xp:1500, gold:[400,700], aggro:220, drop:['phyl',1], gear:1, tier:4, boss:true, ranged:true, w:24, h:24 },
  orc:   { name:'The Goliath Tank',      hp:500, atk:26, def:8, spd:0.7, xp:350, gold:[120,220], aggro:140, drop:['crown',1], gear:1, tier:3, boss:true, w:24, h:24 },
  dummy: { name:'Target Firing Board',   hp:999, atk:0, def:2, spd:0, xp:0, gold:[0,0], aggro:0, drop:['gel',0], gear:0, tier:0, dummy:true },
};
const bestiaryKeys = () => Object.keys(ETYPES).filter(k => !ETYPES[k].dummy);
const masteryGoal  = k => ETYPES[k]?.boss ? 1 : 10;
const killCount    = k => (p && p.kills && p.kills[k]) || 0;
const hasMastery   = k => killCount(k) >= masteryGoal(k);
const ELITE_MODS = {
  blazing:    { name: 'Incendiary', c: '#ff5030', hp: 2.2, atk: 1.4, spd: 1.25, xp: 2.5, gold: 2.5 },
  juggernaut: { name: 'Juggernaut', c: '#d070ff', hp: 3.2, atk: 1.6, spd: 0.9,  xp: 3.0, gold: 3.0 },
  treasure:   { name: 'Supply Convoy', c: '#ffd838', hp: 2.0, atk: 1.1, spd: 1.35, xp: 2.5, gold: 5.0, extraLoot: true },
};
const ELITE_KEYS = Object.keys(ELITE_MODS);
const PETS = {
  wolf:  { name: 'K-9 War Dog',        lvl: 1, c: '#d09050', desc: 'Fetches supplies & bites enemy hostiles' },
  fairy: { name: 'Recon Drone',        lvl: 5, c: '#60e8ff', desc: 'Fetches supplies, scans targets & repairs armor' },
  wyrm:  { name: 'Sentry Turret',      lvl: 9, c: '#90d8ff', desc: 'Fetches supplies & fires cryo-suppressive rounds' },
};
const PET_KEYS = Object.keys(PETS);

// ---- Achievements & Titles System ----
const ACHIEVEMENTS = {
  first_blood: {
    id: 'first_blood', name: 'First Blood', desc: 'Neutralize your first infected zombie in the field.',
    title: 'Recruit', color: '#a0d8ff', bonus: { xp: 5 }, bonusDesc: '+5% Combat XP', secret: false,
    check: () => Object.values((p && p.kills) || {}).reduce((a, b) => a + b, 0) >= 1
  },
  apprentice: {
    id: 'apprentice', name: 'Field Promotion', desc: 'Reach Operative Level 5.',
    title: 'Corporal', color: '#60e8ff', bonus: { mp: 15 }, bonusDesc: '+15 Max Energy', secret: false,
    check: () => p && p.lvl >= 5
  },
  veteran: {
    id: 'veteran', name: 'Outpost Veteran', desc: 'Reach Operative Level 10.',
    title: 'Sergeant', color: '#7ad858', bonus: { hp: 40 }, bonusDesc: '+40 Max Armor/HP', secret: false,
    check: () => p && p.lvl >= 10
  },
  warlord_slayer: {
    id: 'warlord_slayer', name: "Goliath Neutralizer", desc: 'Neutralize The Goliath Tank mutant at Ruined City Center.',
    title: 'Tank Slayer', color: '#ff9040', bonus: { atk: 5 }, bonusDesc: '+5 Flat Firearm ATK', secret: false,
    check: () => (p?.kills?.orc || 0) >= 1
  },
  crypt_breaker: {
    id: 'crypt_breaker', name: 'Tyrant Exterminator', desc: 'Neutralize the Nemesis Tyrant bio-weapon in Bunker B3.',
    title: 'Tyrant Slayer', color: '#c080ff', bonus: { crit: 5 }, bonusDesc: '+5% Crit Rate', secret: false,
    check: () => (p?.kills?.lich || 0) >= 1
  },
  dragon_slayer: {
    id: 'dragon_slayer', name: 'Titan Vanquisher', desc: 'Demolish the Cryo Abomination Titan at Frostpeak Bio-Research Station.',
    title: 'Titan Slayer', color: '#80e8ff', bonus: { bossDmg: 12 }, bonusDesc: '+12% Heavy Target DMG', secret: false,
    check: () => (p?.kills?.frostwyrm || 0) >= 1
  },
  infernal_conqueror: {
    id: 'infernal_conqueror', name: 'Nemesis Omega Buster', desc: 'Neutralize Bio-Hazard Nemesis Omega at Emberfall Bio-Incinerator.',
    title: 'Omega Slayer', color: '#ff4030', bonus: { atkPct: 8 }, bonusDesc: '+8% Total Firepower', secret: false,
    check: () => (p?.kills?.infernal || 0) >= 1
  },
  gladiator: {
    id: 'gladiator', name: 'Outpost Defense Line', desc: 'Survive to Wave 5 in the Quarantine Perimeter Defense.',
    title: 'Commando', color: '#ffd838', bonus: { def: 4 }, bonusDesc: '+4 Ballistic DEF', secret: false,
    check: () => (p?.bestWave || 0) >= 5
  },
  arena_champion: {
    id: 'arena_champion', name: 'Iron Defender', desc: 'Survive to Wave 15 in the Quarantine Perimeter Defense.',
    title: 'Iron Commando', color: '#f8c838', bonus: { atk: 4, def: 3, hp: 30 }, bonusDesc: '+4 ATK, +3 DEF, +30 HP', secret: true,
    check: () => (p?.bestWave || 0) >= 15
  },
  millionaire: {
    id: 'millionaire', name: 'War Budget Hoarder', desc: 'Accumulate 3,000 Combat Funds in reserve.',
    title: 'Quartermaster', color: '#ffd700', bonus: { gold: 20 }, bonusDesc: '+20% Funds Find', secret: false,
    check: () => (p?.gold || 0) >= 3000
  },
  blacksmith: {
    id: 'blacksmith', name: 'Armory Gunsmith', desc: 'Upgrade any firearm or combat gear to +5 or higher.',
    title: 'Master Gunsmith', color: '#ffb050', bonus: { atk: 3, def: 2 }, bonusDesc: '+3 ATK, +2 DEF', secret: false,
    check: () => GEAR_SLOTS.some(s => p && p[s] && p[s].plus >= 5)
  },
  enchanter: {
    id: 'enchanter', name: 'Tactical Weapon Modder', desc: 'Calibrate gear attachments at the Quartermaster.',
    title: 'Field Engineer', color: '#d080ff', bonus: { spd: 5 }, bonusDesc: '+5% Move Speed', secret: false,
    check: () => (p?.stats?.rerolls || 0) >= 1
  },
  beast_master: {
    id: 'beast_master', name: 'Threat Intel Expert', desc: 'Complete combat intelligence (★) for 4 hostile unit types.',
    title: 'Recon Specialist', color: '#58d858', bonus: { bossDmg: 8, spd: 5 }, bonusDesc: '+8% Boss DMG, +5% SPD', secret: false,
    check: () => Object.keys(ETYPES).filter(k => (p?.kills?.[k] || 0) >= (ETYPES[k].boss ? 1 : 10)).length >= 4
  },
  secret_agent: {
    id: 'secret_agent', name: 'Black-Ops Cache', desc: 'Locate the hidden weapons cache in the Blackwood Valley.',
    title: 'Secret Agent', color: '#ff9a30', bonus: { crit: 8 }, bonusDesc: '+8% Crit Rate', secret: true,
    check: () => !!(p && p.akFound)
  },
  blessed: {
    id: 'blessed', name: 'Base Supply Drop', desc: 'Request 3 supply drops at the FOB Water Cistern.',
    title: 'Combat Ready', color: '#60f0ff', bonus: { regen: 2 }, bonusDesc: '2x Health & Power Regen', secret: true,
    check: () => (p?.stats?.wellWishes || 0) >= 3
  },
  untouchable: {
    id: 'untouchable', name: 'Tactical Roll Master', desc: 'Perform 30 combat dodge rolls under fire.',
    title: 'Ghost Operative', color: '#d0d8f0', bonus: { spd: 10 }, bonusDesc: '+10% Move Speed', secret: true,
    check: () => (p?.stats?.rolls || 0) >= 30
  },
  rift_initiate: {
    id: 'rift_initiate', name: 'Rift Infiltrator', desc: 'Infiltrate the Abyssal Rift dimension for the first time.',
    title: 'Rift Infiltrator', color: '#a090ff', bonus: { gold: 15 }, bonusDesc: '+15% Scrap Find', secret: false,
    check: () => (p?.stats?.riftsEntered || 0) >= 1 || (p?.bestRift || 0) >= 1
  },
  rift_walker: {
    id: 'rift_walker', name: 'Deep Breach', desc: 'Reach Sector Depth 5 in the Abyssal Rift.',
    title: 'Rift Commando', color: '#c080ff', bonus: { spd: 8, crit: 5 }, bonusDesc: '+8% Speed, +5% Crit', secret: false,
    check: () => (p?.bestRift || 0) >= 5
  },
  abyss_conqueror: {
    id: 'abyss_conqueror', name: 'Omega Cleanse', desc: 'Clear Sector Depth 10 in the Abyssal Rift.',
    title: 'Omega Specialist', color: '#9060ff', bonus: { bossDmg: 15, atk: 6 }, bonusDesc: '+15% Boss DMG, +6 ATK', secret: false,
    check: () => (p?.bestRift || 0) >= 10
  },
  void_lord: {
    id: 'void_lord', name: 'Supreme Commander', desc: 'Survive to Sector Depth 20 in the Abyssal Rift.',
    title: 'Supreme Commander', color: '#ff50e0', bonus: { atkPct: 12, hp: 50, mp: 25 }, bonusDesc: '+12% ATK, +50 HP, +25 MP', secret: true,
    check: () => (p?.bestRift || 0) >= 20
  }
};
const ACHIEVE_KEYS = Object.keys(ACHIEVEMENTS);
const titleBonus = kind => (p && p.title && ACHIEVEMENTS[p.title]?.bonus?.[kind]) || 0;
const ZONES = [
  // x0..x1 / y0..y1 in tiles: where the zone's monsters spawn · scale: extra HP/ATK/XP for the far sectors
  { name:'Sector 1: Suburban Quarantine',   x0:50, x1:56, y0:2, y1:47, mobs:[['slime',14]] },   // east bank: the grass field by the base stays clear
  { name:'Sector 2: Infected Industrial',   x0:49, x1:67, y0:2, y1:47, mobs:[['wolf',8],['goblin',7]] },
  { name:'Sector 3: Ruined City Center',    x0:69, x1:86, y0:2, y1:47, mobs:[['skel',10]] },
  { name:'Sector 4: Abandoned Airfield',    x0:89, x1:121, y0:2, y1:47, mobs:[['spider',9],['skel',7]], scale:1.3 },
  { name:'Sector 5: Quarantine Hospital',   x0:123, x1:157, y0:2, y1:47, mobs:[['bknight',8],['cultist',8]], scale:1.6 },
  { name:'Sector 7: Flooded District',           x0:50, x1:100, y0:52, y1:87, mobs:[['goblin',8],['spider',8],['skel',4]], scale:1.7 },
  { name:'Sector 8: Harbor Docks',          x0:103, x1:151, y0:52, y1:80, mobs:[['skel',8],['bknight',6],['cultist',6]], scale:2 },
];
for (const z of ZONES) { z.x0 += OX; z.x1 += OX; }                // the world grew west (graphics.js)
const zoneAt = (px, py = (typeof p !== 'undefined' && p ? p.y : 0)) => {
  if (typeof rift !== 'undefined' && rift) return `Abyssal Rift D${rift}`;
  if (typeof arena !== 'undefined' && arena) return `Perimeter Defense W${arena}`;
  if (dungeon) return `Underground Bunker B${dungeon}`;
  if (region) return MAPS[region].name;
  const tx = px / T - OX;                  // zone borders below are in the old tile numbers
  const ty = py / T;
  if (tx < 0) return ty >= 50 ? 'Western Woods' : 'Quarantine Outpost Alpha';   // the west wing / the woods west of the farm
  if (ty >= 50) return tx < 47 ? 'Survivor Farm (Safe Zone)' : tx < 102 ? 'Sector 7: Flooded District' : 'Sector 8: Harbor Docks';
  if (tx >= 26 && tx < 42 && ty < 49) return 'Perimeter Field (Safe Zone)';
  return tx < 26 && ty < 43 ? 'Quarantine Outpost Alpha' : tx < 47 ? 'Sector 1: Suburban Quarantine' : tx < 68 ? 'Sector 2: Infected Industrial'
    : tx < 88 ? 'Sector 3: Ruined City Center' : tx < 122 ? 'Sector 4: Abandoned Airfield' : 'Sector 5: Quarantine Hospital';
};

function rollGear(tier, minR = 0, own = false) {
  const pick = R();
  const kind = pick < 0.34 ? 'weapon' : pick < 0.60 ? 'armor' : pick < 0.75 ? 'helm' : pick < 0.88 ? 'boots' : 'ring';
  const wt = own || R() < 0.6 ? CLASS_WT[p.cls] : ['rifle', 'sniper', 'heavy'][ri(0, 2)];
  const table = kind === 'weapon' ? (WEAPONS[wt] || WEAPONS.rifle) : kind === 'armor' ? ARMORS : kind === 'helm' ? HELMS : kind === 'boots' ? BOOTS : RINGS;
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
const itemIcon   = it => it.kind === 'mat' || it.kind === 'use' ? ICON[it.id] : it.kind === 'weapon' ? gunModel(it).icon : ICON[it.kind] || ICON.armor;
const upCost     = it => Math.round(20 * (it.plus + 1) ** 1.6 + it.stat * 6);
const rerollCost = it => Math.round(35 + it.stat * 8 + (it.rar || 1) * 45);

// ---- NPCs & Quests ----
const npc = (id, name, spr, tx, ty, flip = false) => ({ id, name, spr, x: (tx + OX) * T + 2, y: ty * T + 2, w: 12, h: 12, flip });   // tx in the old tile numbers
const MERCH     = npc('merchant', 'QUARTERMASTER HIGGINS', MERCHANT, 18, 33);
const ELDER     = npc('elder', 'COMMANDER VANCE', ELDER_SPR, 18, 13);
const HUNTER    = npc('hunter', 'DRILL SGT. MILLER', HUNTER_SPR, 16, 27, true);
const ARENA_NPC = npc('arena', 'MAJOR BRIGGS', ARENA_SPR, 14, 15, true);
const SEER      = npc('seer', 'INTEL OFFICER MALAKOR', SEER_SPR, 21, 13, true);
const GUARD     = npc('guard', 'BASE SENTRY VORN', GUARD_SPR, 23, 22);
// [tileX, tileY, name, gun] — world.js builds a bunker tile at each spot
const BUNKER_SPOTS = [
  [24, 21, 'ALPHA BUNKER GUNNER', 'M249 Light Machine Gun'], [24, 28, 'BRAVO BUNKER GUNNER', 'M249 Light Machine Gun'],
  [41, 22, 'BRIDGE REDOUBT SENTRY', 'Tactical SCAR-H'],      [42, 27, 'HIGHWAY CHECKPOINT SNIPER', 'AWM Precision Sniper'],
  [43, 6, 'NORTH BRIDGE RIFLEMAN', 'Assault Rifle AK-74'],    [42, 11, 'NORTH BRIDGE SPOTTER', 'Scout Rifle SVD'],
  [41, 38, 'SOUTH BRIDGE RIFLEMAN', 'G36 Battle Rifle'],      [41, 43, 'SOUTH BRIDGE HEAVY', 'Combat Shotgun 12G'],
];
const GUARDS = [
  GUARD,
  npc('guard', 'EAST PERIMETER SENTRY', GUARD_SPR, 23, 27),
  npc('guard', 'NORTH WALL SENTRY', GUARD_SPR, 23, 14),
  npc('guard', 'SOUTH WALL SENTRY', GUARD_SPR, 23, 34),
  npc('guard', 'NORTH GATE SENTRY', GUARD_SPR, 11, 9),
  npc('guard', 'NORTH WATCHTOWER SENTRY', GUARD_SPR, 14, 9, true),
  npc('guard', 'SOUTH GATE SENTRY', GUARD_SPR, 10, 39),
  npc('guard', 'SOUTH WATCHTOWER SENTRY', GUARD_SPR, 15, 39, true),
  // Bunker garrisons: every bunker sits on the safe (west) bank of the river guarding a gated bridge,
  // or inside the base's east gate. The gunners shoot zombies that come close (updateGuards in bots.js).
  ...BUNKER_SPOTS.map(([x, y, name, gun]) => Object.assign(npc('outpost_guard', name, OUTPOST_GUARD_SPR, x, y), { gun, cd: ri(0, 40), aim: 0, fireT: 0 })),
];
// ---- Survivor Farm (Sector 6): farmers wander their plots and stop to chat (updateFarmers) ----
const FARMER_SPRS = [
  dimensional(art(['.YYYYYY.','..YYYY..','..SKSK..','..SSSS..','.RBBBBR.','S.BBBB.S','..BBBB..','..D..D..'])),   // straw hat, overalls
  dimensional(art(['..DDDD..','.DDYYDD.','..SKSK..','..SSSS..','.gOOOOg.','S.OOOO.S','..OOOO..','..K..K..'])),   // headscarf, green smock
  dimensional(art(['..RRRR..','.RRRRRR.','..SKSK..','..SSSS..','.YDDDDY.','S.DDDD.S','..BBBB..','..K..K..'])),   // red cap, work jacket
];
const FARM_LINES = [
  'The fields feed the whole base. Every sack of grain goes to the mess hall at FOB Ironvale.',
  'Zombies cannot cross our fence. The militia at the bridge keeps the city crawlers out.',
  'The greenhouses grow tomatoes and greens all year, even when the toxic rain comes.',
  'The orchard trees survived the outbreak. We still pick apples every harvest.',
  'The tractor runs on diesel salvaged from the airfield. Do not tell the Quartermaster!',
  'Rest here if you are hurt, soldier. Nothing gets past the farm fence.',
];
const farmer = (name, spr, x, y, area) => Object.assign(npc('farmer', name, spr, x, y),
  { area: [area[0] + OX, area[1], area[2] + OX, area[3]], goal: null, wait: ri(0, 200), lines: FARM_LINES, tip: ri(0, FARM_LINES.length - 1), lx: 0, ly: 0, stuck: 0 });
const FARMERS = [
  farmer('FARMER BEN',        FARMER_SPRS[0], 18, 56, [15, 52, 25, 60]),
  farmer('FARMER MALI',       FARMER_SPRS[1], 32, 54, [29, 52, 40, 60]),
  farmer('GROWER DANG',       FARMER_SPRS[2],  6, 67, [3, 64, 10, 73]),
  farmer('GROWER NOK',        FARMER_SPRS[1], 20, 68, [15, 64, 25, 73]),
  farmer('ORCHARD KEEPER JO', FARMER_SPRS[0], 18, 82, [14, 78, 26, 87]),
  farmer('FARMER LEK',        FARMER_SPRS[2],  6, 57, [2, 55, 10, 61]),
  farmer('BARN HAND TAN',     FARMER_SPRS[0], 33, 84, [29, 83, 40, 87]),
];
const FARM_GUARD = Object.assign(npc('outpost_guard', 'FARM MILITIA', OUTPOST_GUARD_SPR, 14, 50, true), { gun: 'Combat Shotgun 12G', cd: 0, aim: 0, fireT: 0 });
GUARDS.push(FARM_GUARD);                                       // shoots anything coming over the farm bridge (updateGuards)
const NPCS = [MERCH, ELDER, HUNTER, ARENA_NPC, SEER, ...GUARDS, ...FARMERS];
function updateFarmers() {
  for (const f of FARMERS) {
    if (Math.hypot(p.x - f.x, p.y - f.y) < 30) { f.flip = p.x < f.x; continue; }   // stop to face the player
    if (f.wait > 0) { f.wait--; continue; }
    if (!f.goal) {
      const [x0, y0, x1, y1] = f.area;
      for (let i = 0; i < 12 && !f.goal; i++) {
        const gx = ri(x0, x1) * T + 2, gy = ri(y0, y1) * T + 2;
        if (!blocked(gx, gy, 12, 12, false)) f.goal = { x: gx, y: gy };
      }
      if (!f.goal) { f.wait = 60; continue; }
    }
    const dx = f.goal.x - f.x, dy = f.goal.y - f.y, d = Math.hypot(dx, dy);
    if (d < 1) { f.goal = null; f.wait = ri(120, 360); continue; }                     // arrived: work the plot a while
    move(f, dx / d * 0.35, 0); move(f, 0, dy / d * 0.35);
    if (Math.abs(dx) > 0.5) f.flip = dx < 0;
    if (Math.hypot(f.x - f.lx, f.y - f.ly) < 0.05) { if (++f.stuck > 60) { f.goal = null; f.stuck = 0; } } else f.stuck = 0;
    f.lx = f.x; f.ly = f.y;
  }
}

const PLURAL = {
  slime:'Walker Zombies', wolf:'Infected Runners', goblin:'Toxic Crawlers',
  skel:'Infected Hazmat Soldiers', orc:'The Goliath Tank', spider:'Parasite Leapers',
  bknight:'Riot Shield Juggernauts', cultist:'Toxic Acid Spitters', lich:'Nemesis Tyrants'
};

const STORY = [
  { name:'Perimeter Sweep', type:'kill', target:'slime', n:5, gold:50, xp:40, potions:2,
    intro:'Walker Zombies have breached the quarantine perimeter east of Outpost Alpha. Eliminate 5 of them.',
    done:'Area secured. Excellent shooting, soldier. Take these medical rations.' },
  { name:'Biohazard Samples', type:'collect', target:'pelt', n:3, gold:120, xp:100,
    intro:'Our medical unit needs research specimens. Recover 3 Biohazard Fibers from Infected Runners across the highway.',
    done:'Outstanding. Our lab will use this tissue to engineer protective treatments.' },
  { name:'Crawler Infestation', type:'kill', target:'goblin', n:6, gold:200, xp:200, gear:[1, 2],
    intro:'Toxic Crawlers are dragging themselves through the industrial sector. Neutralize 6 of them immediately.',
    done:'Route cleared. Take this tactical military gear from our forward armory.' },
  { name:'Scout Ruined City', type:'visit', target:'Sector 3: Ruined City Center', n:1, gold:100, xp:150,
    intro:'Recon mission: Advance far east past the collapsed highway and survey the Ruined City Center.',
    done:'Heavy viral mutation detected in the city center. Prepare for heavy combat.' },
  { name:'Infected Hazmat Cleanse', type:'kill', target:'skel', n:8, gold:400, xp:500,
    intro:'Infiltrate the city ruins and eliminate 8 Infected Hazmat Soldiers to clear the sector.',
    done:'Hazmat squad neutralized. You are proving to be our elite quarantine operative.' },
  { name:'Neutralize Goliath Tank', type:'kill', target:'orc', n:1, gold:1000, xp:1500, gear:[3, 3],
    intro:'A colossal mutated brute known as "The Goliath Tank" is rampaging at the city square. Neutralize it!',
    done:'The Goliath has fallen! The ground shook as it collapsed. Outstanding work, Commando!' },
  { name:'Bunker B3 Bio-Weapon', type:'kill', target:'lich', n:1, gold:2500, xp:3000, gear:[4, 3],
    intro:'Underground Bunker B3 hosts an illegal biological laboratory. The Nemesis Tyrant has broken containment. Neutralize it!',
    done:'Nemesis Tyrant terminated! Alpha containment successful. Outstanding marksmanship!' },
  { name:'Operation Frostpeak', type:'kill', target:'yeti', n:5, gold:1500, xp:1800,
    intro:'A military checkpoint north of Sector 1 leads to Frostpeak Bio-Research Station. Eliminate 5 Cryo Brute Zombies.',
    done:'Mountain facility perimeter secured! Thermal scans show a colossal mutated bio-horror ahead...' },
  { name:'Cryo Titan Vanquisher', type:'kill', target:'frostwyrm', n:1, gold:3500, xp:4000, gear:[4, 3],
    intro:'A colossal Cryo Abomination Titan is freezing the research station. Annihilate it with heavy firepower!',
    done:'Cryo Titan shattered into pieces! Mountain facility liberated. Exceptional work, soldier!' },
  { name:'Operation Omega Nemesis', type:'kill', target:'infernal', n:1, gold:5000, xp:6000, gear:[4, 4],
    intro:'Southern breach leads to Emberfall Bio-Incinerator. The ultimate Bio-Hazard Nemesis Omega is unleashed. Destroy it to save humanity!',
    done:'Nemesis Omega obliterated! Full quarantine mission accomplished. You are the legendary savior of humanity!' },
];

const BOUNTIES = [
  { target:'slime', n:8, lvl:1 }, { target:'wolf', n:6, lvl:3 }, { target:'goblin', n:6, lvl:4 },
  { target:'spider', n:6, lvl:6 }, { target:'skel', n:6, lvl:7 }, { target:'icewolf', n:6, lvl:8 },
  { target:'yeti', n:5, lvl:9 }, { target:'magmaslime', n:6, lvl:10 }, { target:'lavagolem', n:4, lvl:11 },
];

const GUARD_TIPS = [
  'Cross the river via the modern highway bridge or perimeter barricades.',
  'Infected runners sprint quickly! Keep your distance, aim for the head, and use dodge roll!',
  'The Quartermaster pays top dollar for biohazard loot and tech. Upgrade weapons at his gunsmith station.',
  'Rest inside Quarantine Outpost Alpha. Medics and repair stations restore armor and energy rapidly.',
  'The Goliath Tank unleashes devastating ground smashes. Watch out for red telegraph rings and roll away!',
  'An elevator in the Ruined City leads down to Bunker B3. High-grade military supply crates await below.',
  'Press T to open your Tactical Training Tree. Each combat level awards 1 specialization point.',
  'Recon scouts whisper of a hidden weapons cache walled up behind a cracked brick wall in the warehouse district.',
  'Tactical jump transponders lead to Frostpeak Bio-Research Station and Emberfall Bio-Incinerator.',
  'All forward military combat outposts are manned and fortified. Fall back to our bunker line if overwhelmed by the horde!',
  'Bunkers are reinforced with heavy sandbags and radio transmitters. Keep your magazines topped off with [R]!',
  'Watch your fire around barbed wire and toxic sludge puddles. Lure the infected into them to thin the herd!',
];
