// ================= State, Save/Load & Gameplay =================
const SAVE_KEY = 'ironvale-save-v1';
let guardTip = 0;
let mode = 'title', frame = 0, camx = 0, camy = 0, p, enemies = [], pickups = [], floats = [], parts = [], msgs = [];
let projs = [], rings = [], classCur = 0;
let swingId = 0, bossCD = 0, invCur = 0, shopCur = 0, shopMsg = '', dialogQ = [], banner = null, zoneName = '', lostGold = 0, shake = 0;
let petObj = { x: 0, y: 0, cd: 60, face: 1, anim: 0 };
const addShake = n => { shake = Math.max(shake, n); };
const keys = {};

function freshPlayer(cls) {
  const wt = CLASS_WT[cls];
  return { x: 12 * T + 2, y: 24 * T + 2, w: 12, h: 12, dir: 'down', anim: 0, cls, lvl: 1, xp: 0, gold: 0, potions: 3, hp: 999, mp: 999,
    inv: [{ kind:'use', id:'mpot', count:1 }, { kind:'use', id:'scroll', count:1 }], stash: [],
    weapon: { kind:'weapon', wt, name: WEAPONS[wt][0][0], stat:2, rar:0, plus:0, value:10 },
    armor: { kind:'armor', name:'Cloth Tunic', stat:1, rar:0, plus:0, value:5 },
    helm: null, boots: null, ring: null,
    atkT: 0, cd: 0, hurtT: 0, kx: 0, ky: 0, skillCd: [0, 0], buffT: 0, elixirT: 0, dashT: 0, spinT: 0, target: null,
    rollT: 0, rollCd: 0, rollVx: 0, rollVy: 0, combo: 0, comboT: 0, slowT: 0,
    story: 0, sq: false, sprog: 0, bounty: null, sp: 0, tree: {}, skillLv: [1, 1], critT: 0, buffMul: 1.5, kills: {}, quickId: 'mpot',
    pet: 'wolf', bestWave: 0, bestRift: 0, achieve: {}, title: null, stats: { rolls: 0, rerolls: 0, wellWishes: 0, riftsEntered: 0 } };
}
const C = () => CLASSES[p.cls];
const atk = () => Math.round((3 + p.lvl * 2 + (p.weapon ? itemStat(p.weapon) : 0) + (p.ring ? Math.ceil(itemStat(p.ring) * 0.6) : 0) + titleBonus('atk'))
  * C().atk * (p.buffT > 0 ? p.buffMul : 1) * (p.elixirT > 0 ? 1.25 : 1) * (1 + titleBonus('atkPct') * 0.01));
const def = () => Math.floor(p.lvl / 2) + C().def + (p.armor ? itemStat(p.armor) : 0) + (p.helm ? itemStat(p.helm) : 0) + (p.boots ? itemStat(p.boots) : 0) + titleBonus('def');
const maxHp = () => Math.round((C().hp[0] + p.lvl * C().hp[1] + (p.helm ? itemStat(p.helm) * 4 : 0) + titleBonus('hp')) * (1 + 0.08 * rank('hp')));
const maxMp = () => C().mp[0] + p.lvl * C().mp[1] + (p.ring ? itemStat(p.ring) * 3 : 0) + titleBonus('mp');
const critRate = () => p.critT > 0 ? 1 : Math.min(0.85, 0.1 + (p.ring ? 0.02 * (p.ring.rar + 1) + 0.005 * p.ring.plus : 0) + gearBonus('crit') * 0.01 + (p.elixirT > 0 ? 0.15 : 0) + titleBonus('crit') * 0.01 + (typeof rift !== 'undefined' && rift && riftMod && riftMod.crit ? riftMod.crit * 0.01 : 0));
const spdBonus = () => 0.08 * rank('spd') + (p.boots ? Math.min(0.25, 0.03 + itemStat(p.boots) * 0.01) : 0) + (p.elixirT > 0 ? 0.12 : 0) + titleBonus('spd') * 0.01 + (typeof rift !== 'undefined' && rift && riftMod && riftMod.playerSpd ? riftMod.playerSpd * 0.01 : 0);
const xpNeed = l => Math.floor(20 * l ** 1.6);

function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.lvl ? s : null; } catch (e) { return null; } }
function save() {
  try {
    const { cls, lvl, xp, gold, potions, hp, mp, inv, stash, weapon, armor, helm, boots, ring, story, sq, sprog, bounty, sp, tree, skillLv, akFound, kills, quickId, pet, bestWave, bestRift, achieve, title, stats } = p;
    const { x, y } = (dungeon || arena) ? dungeonReturn : rift ? riftReturn : region ? regionReturn : p;   // always save a main-world position
    localStorage.setItem(SAVE_KEY, JSON.stringify({ cls, lvl, xp, gold, potions, hp, mp, inv, stash, weapon, armor, helm, boots, ring, x, y, story, sq, sprog, bounty, sp, tree, skillLv, akFound, kills, quickId, pet, bestWave, bestRift, achieve, title, stats }));
  } catch (e) {}
}
let saved = loadSave();

function mkEnemy(type, x, y, zone, scale = 1, forceElite = false) {
  const b = ETYPES[type], hm = DIFF().hp;                // difficulty scales enemy HP
  const elite = forceElite ? (typeof forceElite === 'string' ? forceElite : ELITE_KEYS[ri(0, ELITE_KEYS.length - 1)])
    : (!b.boss && !b.dummy && R() < 0.12 ? ELITE_KEYS[ri(0, ELITE_KEYS.length - 1)] : null);
  const em = elite ? ELITE_MODS[elite] : null;
  const d = (scale === 1 && hm === 1 && !em) ? b : {
    ...b,
    name: em ? `${em.name} ${b.name}` : b.name,
    hp: Math.round(b.hp * scale * hm * (em ? em.hp : 1)),
    atk: Math.round(b.atk * scale * (em ? em.atk : 1)),
    spd: b.spd * (em ? em.spd : 1),
    xp: Math.round(b.xp * scale * (em ? em.xp : 1)),
    gold: em ? [Math.round(b.gold[0] * em.gold), Math.round(b.gold[1] * em.gold)] : b.gold,
  };
  return { type, d, elite, x, y, w: d.w || 12, h: d.h || 12, hp: d.hp, zone, face: 1, anim: R() * 40, wt: 0, wx: 0, wy: 0,
    kx: 0, ky: 0, stun: 0, flash: 0, hitId: -1, dead: false, slam: 0, slamCD: 120, shootCD: ri(40, 100), phase: 0, specCD: 220, enraged: false };
}

function fireEnemy(e, ux, uy) {
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2, shot = (a, s) => eprojs.push({ x: ex, y: ey, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 160, atk: e.d.atk, c: e.d.shotColor || (e.type === 'lich' ? '#60ff90' : '#c040ff') });
  const a = Math.atan2(uy, ux);
  if (e.type === 'lich' || e.d.pattern === 'nova') {
    if (++e.phase % 3 === 0) for (let i = 0; i < 10; i++) shot(i / 10 * Math.PI * 2, 1.6);
    else for (const da of [-0.25, 0, 0.25]) shot(a + da, 2.2);
    e.shootCD = 70;
  } else { shot(a, 2); e.shootCD = ri(90, 130); }
  tone(500, 0.12, 'square', 0.08, 200);
}
function updateEprojs() {
  for (const q of eprojs) {
    q.x += q.vx; q.y += q.vy; q.life--;
    const tx = Math.floor(q.x / T), ty = Math.floor(q.y / T);
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH || (SOLID.has(map[ty][tx]) && map[ty][tx] !== '~')) q.life = 0;
    else if (p.hurtT <= 0 && overlap({ x: q.x - 3, y: q.y - 3, w: 6, h: 6 }, p)) { q.life = 0; hurtPlayer({ d: { atk: q.atk }, x: q.x, y: q.y, w: 0, h: 0 }); }
  }
  eprojs = eprojs.filter(q => q.life > 0);
}
function spawnOne(type, zone, anywhere) {
  const d = ETYPES[type], w = d.w || 12, h = d.h || 12;
  for (let i = 0; i < 30; i++) {
    const x = ri(zone.x0, zone.x1) * T + 2, y = ri(2, MH - 3) * T + 2;
    if (blocked(x, y, w, h, true)) continue;
    if (!anywhere && Math.hypot(x - p.x, y - p.y) < 200) continue;
    enemies.push(mkEnemy(type, x, y, zone.name)); return;
  }
}
function populate() {
  enemies = []; pickups = [];
  for (const z of ZONES) for (const [type, n] of z.mobs) for (let i = 0; i < n; i++) spawnOne(type, z, true);
  enemies.push(mkEnemy('dummy', 20 * T + 2, 22 * T + 2, 'Ironvale Village'));
  bossCD = 0;
}
function startGame(fromSave, cls) {
  dungeon = 0; arena = 0; arenaWait = 0; rift = 0; riftMod = null; region = null; map = world; MW = WW; MH = WH; worldState = null; torches = []; eprojs = [];
  p = freshPlayer(fromSave && saved ? saved.cls || 'knight' : cls);
  if (fromSave && saved) Object.assign(p, saved, { cls: saved.cls || 'knight' });
  p.stash = p.stash || []; p.kills = p.kills || {}; p.quickId = p.quickId || 'mpot';
  p.pet = p.pet || 'wolf'; p.bestWave = p.bestWave || 0; p.bestRift = p.bestRift || 0;
  p.achieve = p.achieve || {}; p.title = p.title || null;
  p.stats = p.stats || { rolls: 0, rerolls: 0, wellWishes: 0, riftsEntered: 0 };
  if (fromSave && saved && saved.sp === undefined) { p.sp = p.lvl - 1; p.tree = {}; }   // saves from before the skill tree
  if (fromSave && saved && !saved.skillLv) p.sp += p.lvl - 1;      // levels now give 2 points: back-pay older saves
  if (blocked(p.x, p.y, p.w, p.h, false)) { p.x = 12 * T + 2; p.y = 24 * T + 2; }
  petObj = { x: p.x - 14, y: p.y + 4, cd: 60, face: 1, anim: 0 };
  world[4][63] = p.akFound ? ',' : 'K'; miniFor = null;           // the secret chest only opens once per save
  p.hp = Math.min(p.hp, maxHp()); p.mp = Math.min(p.mp ?? 999, maxMp());
  populate(); floats = []; parts = []; msgs = []; projs = []; rings = [];
  zoneName = zoneAt(p.x); banner = { txt: zoneName, t: 150 };
  checkAchievements();
  if (fromSave) mode = 'play';
  else {
    say(ELDER,
      `Welcome, young ${C().name.toLowerCase()}! I am Brann, elder of Ironvale. Monsters plague the lands east of our village.`,
      'Talk to me when you see a ! over my head. Mira the hunter posts bounties, and the merchant buys your loot.',
      'At LV 2 and LV 5 you will learn class skills: press K and L. Press T to train them.');
    dialogDone = () => { if (!helpSeen()) openHelp(); };
    save();
  }
  startMusic();
}

// ---- Effects & Helpers ----
function msg(txt, c = '#fff') { msgs.push({ txt, c, t: 240 }); if (msgs.length > 5) msgs.shift(); }
function float(x, y, txt, c) { floats.push({ x, y, txt, c, t: 45 }); }
function burst(x, y, c, n = 8) { for (let i = 0; i < n; i++) { const a = R() * 6.28, s = 0.5 + R() * 2; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 20 + ri(0, 15), c }); } }
const dirVec = () => ({ left:[-1,0], right:[1,0], up:[0,-1], down:[0,1] })[p.dir];
function npcMark(n) {
  if (n === ELDER) return !storyQ() ? null : !p.sq ? ['!', '#f8c838'] : storyReady() ? ['?', '#f8c838'] : ['?', '#808090'];
  if (n === HUNTER) return !p.bounty ? ['!', '#f8c838'] : p.bounty.prog >= p.bounty.n ? ['?', '#f8c838'] : ['?', '#808090'];
  return null;
}
const nearNpc = () => NPCS.find(n => Math.hypot(p.x - n.x, p.y - n.y) < 28);

// ---- Dialog & Quests ----
let dialogDone = null;
function say(who, ...pages) { dialogQ = pages.map(txt => ({ who, txt })); dialogDone = null; mode = 'dialog'; }
const matCount = id => p.inv.filter(i => i.kind === 'mat' && i.id === id).reduce((s, i) => s + i.count, 0);
function removeMats(id, n) {
  for (const it of p.inv) if (it.kind === 'mat' && it.id === id && n > 0) { const k = Math.min(n, it.count); it.count -= k; n -= k; }
  p.inv = p.inv.filter(i => i.kind !== 'mat' || i.count > 0);
}
const storyQ = () => STORY[p.story];
const qProg = q => q.type === 'collect' ? Math.min(q.n, matCount(q.target)) : p.sprog;
const storyReady = () => p.sq && storyQ() && qProg(storyQ()) >= storyQ().n;
const goalText = q => q.type === 'kill' ? `Slay ${q.n} ${q.n > 1 ? PLURAL[q.target] : ETYPES[q.target].name}`
  : q.type === 'collect' ? `Bring ${q.n} ${MATS[q.target].name}s` : `Visit the ${q.target}`;
function onKill(type) {
  p.kills[type] = (p.kills[type] || 0) + 1;
  if (p.kills[type] === masteryGoal(type)) {
    msg(`★ Mastery: ${ETYPES[type].name}! (+15% DMG)`, '#f8c838'); sfx('lvl');
  }
  const q = storyQ();
  if (p.sq && q && q.type === 'kill' && q.target === type && p.sprog < q.n) {
    p.sprog++; msg(`${q.name} ${p.sprog}/${q.n}`, '#f0e0b0');
    if (p.sprog >= q.n) { msg('Quest complete! Return to the Elder.', '#58d858'); sfx('quest'); }
  }
  const b = p.bounty;
  if (b && b.target === type && b.prog < b.n) {
    b.prog++;
    if (b.prog >= b.n) { msg('Bounty complete! Return to Mira.', '#58d858'); sfx('quest'); }
  }
  checkAchievements();
}
function unlockAchievement(id) {
  if (!p) return;
  p.achieve = p.achieve || {};
  if (p.achieve[id]) return;
  const ach = ACHIEVEMENTS[id];
  if (!ach) return;
  p.achieve[id] = Date.now();
  if (!p.title) p.title = id;
  burst(p.x + 6, p.y + 6, ach.color || '#f8c838', 22);
  rings.push({ x: p.x + 6, y: p.y + 6, r: 6, max: 54, c: ach.color || '#f8c838', t: 24 });
  sfx('rare');
  banner = { txt: `🏆 ${ach.name}!`, t: 160 };
  msg(`🏆 Achievement: [${ach.title}] ${ach.name}!`, ach.color || '#ffd838');
  float(p.x + 6, p.y - 14, `🏆 [${ach.title}]`, ach.color || '#ffd838');
  save();
}
function checkAchievements() {
  if (!p || mode === 'title' || mode === 'class' || mode === 'dead') return;
  p.achieve = p.achieve || {};
  for (const k of ACHIEVE_KEYS) {
    if (!p.achieve[k] && ACHIEVEMENTS[k].check()) {
      unlockAchievement(k);
    }
  }
}
function giveReward(r) {
  p.gold += r.gold; float(p.x + 6, p.y - 14, `+${r.gold}G`, '#f8c838');
  if (r.potions) { p.potions += r.potions; msg(`+${r.potions} Potions`, '#ff8080'); }
  if (r.gear) {
    const it = rollGear(r.gear[0], r.gear[1], true);
    if (p.inv.length < BAG) p.inv.push(it); else drop(p.x + 6, p.y + 6, { kind:'gear', item: it });
    msg(`Received ${itemName(it)}!`, RAR[it.rar].c);
  }
  gainXp(r.xp); msg(`+${r.gold}G  +${r.xp} XP`, '#f8c838'); sfx('rare'); save();
}
function newBounty() {
  const pool = BOUNTIES.filter(b => b.lvl <= p.lvl), b = pool[Math.max(0, pool.length - 1 - ri(0, Math.min(2, pool.length - 1)))], d = ETYPES[b.target];
  return { target: b.target, n: b.n, prog: 0, gold: Math.round(d.gold[1] * b.n * 1.5), xp: Math.round(d.xp * b.n * 0.8) };
}
function talk(n) {
  if (n === MERCH) return openShop();
  if (n.id === 'guard') { say(n, GUARD_TIPS[guardTip++ % GUARD_TIPS.length]); return; }
  if (n.id === 'seer') {
    const best = p.bestRift || 0;
    return say(n,
      'The cosmic fabric is tearing apart... Beyond this swirling rift lies the infinite Abyss.',
      'Each depth is darker and more treacherous than the last, warped by shifting cosmic anomalies.',
      `Every 5th depth awakens an Abyssal Guardian with untold treasures. Deepest descent: Depth ${best}.`,
      'Step onto the Abyssal Rift (V) when you are prepared. May the stars guide your blade.');
  }
  if (n === ELDER) {
    const q = storyQ();
    if (!q) return say(ELDER, 'Ironvale is at peace thanks to you, hero. Mira still pays for monster bounties if you want work.');
    if (!p.sq) { p.sq = true; p.sprog = 0; sfx('quest'); save(); return say(ELDER, q.intro, `NEW QUEST: ${q.name}. ${goalText(q)}. Reward: ${q.gold}G, ${q.xp} XP.`); }
    if (storyReady()) {
      if (q.type === 'collect') removeMats(q.target, q.n);
      p.story++; p.sq = false; p.sprog = 0;
      say(ELDER, q.done); dialogDone = () => giveReward(q);
      return;
    }
    return say(ELDER, `${goalText(q)}. Progress: ${qProg(q)}/${q.n}. Do not give up!`);
  }
  if (n === HUNTER) {
    const b = p.bounty;
    if (!b) {
      p.bounty = newBounty(); sfx('quest'); save();
      return say(HUNTER, 'Need coin? I pay for every beast you put down out there.',
        `BOUNTY: Slay ${p.bounty.n} ${PLURAL[p.bounty.target]}. Reward: ${p.bounty.gold}G, ${p.bounty.xp} XP.`);
    }
    if (b.prog >= b.n) { p.bounty = null; say(HUNTER, `Clean work! Here is your ${b.gold}G. Come back for more.`); dialogDone = () => giveReward(b); return; }
    return say(HUNTER, `Still hunting? ${PLURAL[b.target]}: ${b.prog}/${b.n}.`);
  }
  if (n === ARENA_NPC) {
    say(ARENA_NPC, `Hail, gladiator! Test your might in the Endless Colosseum! (Best Wave: ${p.bestWave || 0})`,
      'Waves grow stronger and every 5th wave unleashes a Boss! Step on the stairs (<) anytime to leave with your spoils.');
    dialogDone = () => enterArena();
    return;
  }
}

// ---- Combat & Skills ----
function dodgeRoll() {
  if (p.rollCd > 0 || p.rollT > 0 || p.dashT > 0) return;
  p.stats = p.stats || {}; p.stats.rolls = (p.stats.rolls || 0) + 1;
  let dx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  let dy = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
  if (!dx && !dy) [dx, dy] = dirVec();
  const l = Math.hypot(dx, dy) || 1;
  p.rollVx = dx / l * 3.8; p.rollVy = dy / l * 3.8;
  p.rollT = 10; p.rollCd = 90; p.hurtT = Math.max(p.hurtT, 14);
  burst(p.x + 6, p.y + 10, '#d8d0c0', 6); sfx('roll');
  checkAchievements();
}
function attack() {
  if (p.cd > 0 || p.dashT > 0 || p.rollT > 0) return;
  if (hasGun()) {                                    // secret AK: rapid auto-aimed bullets with slight spread
    shoot('bullet', 6.5, 0.45 * (1 + 0.1 * rank('atk')), (R() - 0.5) * 0.12);
    p.cd = 6; p.atkT = 4; sfx('gun');
    const q = projs[projs.length - 1];
    parts.push({ x: q.x, y: q.y, vx: 0, vy: 0, t: 3, c: '#fff6a0' }, { x: q.x + q.vx * 0.4, y: q.y + q.vy * 0.4, vx: 0, vy: 0, t: 3, c: '#ffb020' });
    return;
  }
  if (p.cls === 'knight') {
    p.combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0;
    p.comboT = 42;
    p.aimA = aimAngle(); p.atkT = SWING; p.cd = p.combo === 2 ? 25 : 19; swingId++;
    if (p.combo === 2) {
      sfx('combo'); addShake(3);
      rings.push({ x: p.x + 6 + Math.cos(p.aimA) * 14, y: p.y + 6 + Math.sin(p.aimA) * 14, r: 4, max: 26, c: '#f8c838', t: 12 });
    } else sfx('swing');
  }
  else if (p.cls === 'mage') { shoot('bolt', 3.2, 1 + 0.1 * rank('atk')); p.cd = 26; p.atkT = 8; sfx('zap'); }
  else { shoot('arrow', 4.5, 0.8 * (1 + 0.1 * rank('atk'))); p.cd = 18; p.atkT = 8; sfx('bow'); }
}
const hasGun = () => p.weapon && p.weapon.wt === 'gun';
const isRanged = () => p.cls !== 'knight' || hasGun();
const AIM_RANGE = 170, MELEE_AIM_RANGE = 110;
function findTarget() {
  const cx = p.x + 6, cy = p.y + 6, [fx, fy] = dirVec(), range = isRanged() ? AIM_RANGE : MELEE_AIM_RANGE;
  let best = null, bestScore = Infinity;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.x + e.w / 2 - cx, dy = e.y + e.h / 2 - cy, d = Math.hypot(dx, dy);
    if (d > range) continue;
    const score = d - (dx * fx + dy * fy) / (d || 1) * 30;
    if (score < bestScore) { bestScore = score; best = e; }
  }
  return best;
}
function aimAngle() {
  const t = p.target = findTarget();
  if (!t || t.dead) { const [vx, vy] = dirVec(); return Math.atan2(vy, vx); }
  const a = Math.atan2(t.y + t.h / 2 - (p.y + 6), t.x + t.w / 2 - (p.x + 6));
  p.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 'left' : 'right') : (Math.sin(a) < 0 ? 'up' : 'down');
  return a;
}
function shoot(kind, spd, mult, ang = 0) {
  const base = aimAngle(), a = base + ang;
  p.aimA = base;                                     // the held bow/staff/gun points this way while firing
  projs.push({ kind, mult, x: p.x + 6 + Math.cos(a) * 6, y: p.y + 6 + Math.sin(a) * 6,
    vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: Math.round(170 / spd) });
}
function areaHit(x, y, r, mult, onHit) {
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.x + e.w / 2 - x, dy = e.y + e.h / 2 - y, d = Math.hypot(dx, dy);
    if (d < r + e.w / 2) { damageEnemy(e, dx / (d || 1), dy / (d || 1), mult); if (onHit && !e.dead) onHit(e); }
  }
}
function explode(x, y, mult) {
  const r = rank('s1x') ? 48 : 32;
  areaHit(x, y, r, mult);
  rings.push({ x, y, r: 4, max: r, c: '#ff8030', t: 16 }); burst(x, y, '#ff9030', 14); sfx('boom'); addShake(4);
}
const PCOL = { bolt: '#8060ff', fire: '#ff8030', ice: '#80e8ff' };
function updateProjs() {
  for (const q of projs) {
    q.x += q.vx; q.y += q.vy; q.life--;
    if (PCOL[q.kind]) parts.push({ x: q.x, y: q.y, vx: 0, vy: 0, t: 8, c: PCOL[q.kind] });
    const tx = Math.floor(q.x / T), ty = Math.floor(q.y / T);
    const wallHit = tx < 0 || ty < 0 || tx >= MW || ty >= MH || (SOLID.has(map[ty][tx]) && map[ty][tx] !== '~');
    const box = { x: q.x - 3, y: q.y - 3, w: 6, h: 6 }, e = enemies.find(e => !e.dead && overlap(box, e));
    if (e && q.kind !== 'fire') {
      const l = Math.hypot(q.vx, q.vy) || 1;
      damageEnemy(e, q.vx / l, q.vy / l, q.mult);
      if (q.kind === 'ice' && !e.dead) { e.frozen = Math.max(e.frozen || 0, e.d.boss ? 25 : 70); burst(e.x + e.w / 2, e.y + e.h / 2, '#90e8ff', 6); }
      q.life = 0;
    }
    else if (e || wallHit || q.life <= 0) { if (q.kind === 'fire') explode(q.x, q.y, q.mult); q.life = 0; }
  }
  projs = projs.filter(q => q.life > 0);
}
function useSkill(i) {
  if (p.dashT > 0) return;
  const s = C().skills[i];
  if (p.lvl < s.lvl) { msg(`${s.name} unlocks at LV ${s.lvl}`, '#a0a8e0'); return sfx('no'); }
  if (p.skillCd[i] > 0) return sfx('no');
  if (p.mp < s.mp) { msg('Not enough MP!', '#60c0ff'); return sfx('no'); }
  // skill level (T > SKILLS): +20% power and -6% cooldown per level above 1
  const lv = p.skillLv[i], lvMul = 1 + 0.2 * (lv - 1);
  p.mp -= s.mp; p.skillCd[i] = Math.round(s.cd * (1 - 0.2 * rank(i ? 's2c' : 's1c')) * (1 - 0.06 * (lv - 1)) * (1 - Math.min(0.45, gearBonus('cdr') * 0.01)) * ((typeof rift !== 'undefined' && rift && riftMod && riftMod.playerCdr) ? 0.75 : 1));
  const cx = p.x + 6, cy = p.y + 6, pow = (1 + 0.25 * rank('s1p')) * lvMul;
  switch (s.name) {
    case 'Whirlwind': {
      const r = rank('s1x') ? 50 : 34;
      p.spinT = 18; swingId++; areaHit(cx, cy, r, 1.5 * pow);
      rings.push({ x: cx, y: cy, r: 6, max: r, c: '#e0e0ff', t: 14 }); sfx('whirl'); addShake(3); break;
    }
    case 'War Cry': {
      const h = Math.round(maxHp() * (0.3 + 0.05 * (lv - 1))), fury = rank('s2x');
      p.buffT = (fury ? 720 : 480) + 60 * (lv - 1); p.buffMul = fury ? 1.75 : 1.5; p.hp = Math.min(maxHp(), p.hp + h);
      float(cx, p.y - 12, 'ATK UP', '#ff9040'); float(cx, p.y + 2, '+' + h, '#58d858');
      rings.push({ x: cx, y: cy, r: 4, max: 44, c: '#ff9040', t: 20 }); sfx('cry'); break;
    }
    case 'Fireball': shoot('fire', 2.6, 2 * pow); sfx('fire'); break;
    case 'Frost Nova': {
      const deep = rank('s2x'), r = deep ? 80 : 60;
      areaHit(cx, cy, r, 1.2 * lvMul, e => { e.frozen = e.d.boss ? 60 : (deep ? 300 : 180) + 20 * (lv - 1); });
      rings.push({ x: cx, y: cy, r: 6, max: r, c: '#a0e0ff', t: 20 }); burst(cx, cy, '#c0f0ff', 20); sfx('frost'); addShake(4); break;
    }
    case 'Multishot': {
      const n = rank('s1x') ? 7 : 5;
      for (let k = 0; k < n; k++) shoot('arrow', 4.5, 0.8 * pow, (k - (n - 1) / 2) * 0.18);
      sfx('bow'); break;
    }
    case 'Dash': p.dashT = 12 + 2 * (lv - 1); p.hurtT = Math.max(p.hurtT, 20); if (rank('s2x')) p.critT = 180; sfx('dash'); break;
  }
}
function swingHits() {
  const [dx, dy] = dirVec(), a = p.aimA ?? Math.atan2(dy, dx), vx = Math.cos(a), vy = Math.sin(a);
  const fin = p.combo === 2, sz = fin ? 28 : 22, half = sz / 2;
  const cMul = [1.0, 1.15, 1.5][p.combo || 0];
  const hb = { x: p.x + 6 + vx * (fin ? 16 : 14) - half, y: p.y + 6 + vy * (fin ? 16 : 14) - half, w: sz, h: sz };
  for (const e of enemies) if (!e.dead && e.hitId !== swingId && overlap(hb, e)) {
    e.hitId = swingId; damageEnemy(e, vx * (fin ? 1.8 : 1), vy * (fin ? 1.8 : 1), cMul * (1 + 0.1 * rank('atk')));
    if (fin) float(e.x + e.w / 2, e.y - 12, 'COMBO!', '#ff9a30');
    // slash sparks fly out across the swing
    for (let k = 0; k < (fin ? 10 : 6); k++) parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: -vy * (k - 2.5) * 0.7 + vx * 1.5, vy: vx * (k - 2.5) * 0.7 + vy * 1.5, t: 10, c: k % 2 ? '#ffffff' : '#fff6a0' });
  }
}
function damageEnemy(e, vx, vy, mult = 1) {
  const crit = R() < critRate(), mMul = hasMastery(e.type) ? 1.15 : 1;
  const bMul = (e.d.boss && titleBonus('bossDmg')) ? (1 + titleBonus('bossDmg') * 0.01) : 1;
  let dmg = Math.max(1, Math.round(atk() * mult * mMul * bMul * (0.85 + R() * 0.3)) - e.d.def);
  if (crit) {
    const cMul = (typeof rift !== 'undefined' && rift && riftMod && riftMod.critDmg) ? riftMod.critDmg : 2;
    dmg *= cMul; addShake(2); burst(e.x + e.w / 2, e.y + e.h / 2, '#f8c838', 6);
  }
  e.hp -= dmg; e.flash = 10; e.stun = e.d.boss ? 4 : 12;
  const kb = e.d.dummy ? 0 : e.d.boss ? 1 : 3; e.kx = vx * kb; e.ky = vy * kb;
  float(e.x + e.w / 2, e.y - 4, dmg + (crit ? '!' : ''), crit ? '#f8c838' : '#fff');
  if (e.d.dummy) { e.hp = e.d.hp; sfx('hit'); return; }
  const vamp = gearBonus('vamp') + ((typeof rift !== 'undefined' && rift && riftMod && riftMod.lifesteal) ? Math.round(riftMod.lifesteal * 100) : 0);
  if (vamp > 0 && p.hp < maxHp()) {
    const h = Math.max(1, Math.round(dmg * vamp / 100));
    p.hp = Math.min(maxHp(), p.hp + h); float(p.x + 6, p.y - 10, '+' + h, '#58d858');
  }
  const frost = gearBonus('frost');
  if (frost > 0 && e.hp > 0 && R() * 100 < frost) {
    e.frozen = Math.max(e.frozen || 0, e.d.boss ? 25 : 65);
    burst(e.x + e.w / 2, e.y + e.h / 2, '#a0e0ff', 6);
  }
  sfx('hit');
  if (e.hp <= 0) killEnemy(e);
}
function drop(x, y, o) { pickups.push(Object.assign({ x, y, vx: (R() - 0.5) * 3, vy: (R() - 0.5) * 3, t: 0, life: 9000 }, o)); }
function killEnemy(e) {
  e.dead = true; sfx('kill');
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, d = e.d;
  burst(cx, cy, e.type === 'slime' ? '#7ad858' : e.type === 'skel' ? '#ffffff' : '#c83030', d.boss ? 30 : 10);
  gainXp(Math.round(d.xp * DIFF().xp));
  drop(cx, cy, { kind:'gold', amt: Math.round(ri(d.gold[0], d.gold[1]) * DIFF().gold) });
  if (R() < d.drop[1]) drop(cx, cy, { kind:'mat', id: d.drop[0] });
  onKill(e.type);
  if (typeof rift !== 'undefined' && rift) {
    p.stats = p.stats || {}; p.stats.riftKills = (p.stats.riftKills || 0) + 1;
    if (d.boss) {
      for (let i = 0; i < ri(3, 5); i++) drop(cx, cy, { kind: 'mat', id: 'abyssal_shard' });
      msg('★ Abyssal Guardian Defeated! The rift stirs...', '#c080ff'); sfx('rare');
    } else if (e.elite) {
      for (let i = 0; i < ri(1, 2); i++) drop(cx, cy, { kind: 'mat', id: 'abyssal_shard' });
    } else if (R() < 0.35 + Math.min(0.35, rift * 0.02)) {
      drop(cx, cy, { kind: 'mat', id: 'abyssal_shard' });
    }
  }
  if (R() < d.gear) drop(cx, cy, { kind:'gear', item: rollGear(d.tier, d.boss ? 2 : 0) });
  if (e.elite) {
    const em = ELITE_MODS[e.elite];
    burst(cx, cy, em.c, 22); rings.push({ x: cx, y: cy, r: 4, max: 32, c: em.c, t: 16 });
    if (R() < 0.45 || em.extraLoot) drop(cx, cy, { kind:'gear', item: rollGear(d.tier, em.extraLoot ? 1 : 0) });
    if (em.extraLoot) {
      for (let i = 0; i < 3; i++) drop(cx, cy, { kind:'gold', amt: Math.round(ri(d.gold[0], d.gold[1]) * 0.55 * DIFF().gold) });
      msg('★ Treasure Champion slain! Bonus spoils!', '#ffd838'); sfx('rare');
    }
  }
  if (d.boss) {
    drop(cx, cy, { kind:'gear', item: rollGear(d.tier, e.type === 'lich' ? 3 : 2) });
    drop(cx, cy, { kind:'use', id:'elixir' });
    msg(`The ${d.name} has fallen!`, '#f8c838');
    if (e.type === 'orc' && inWorld()) bossCD = 3 * 60 * 60;
    else if (dungeon) msg('Take the stairs back up to the surface.', '#c0a0ff');
    if (region) onRegionBossKilled(e);
  }
  if (R() < 0.06) drop(cx, cy, { kind:'potion' });
  else if (R() < (d.tier >= 2 ? 0.09 : 0.04)) drop(cx, cy, { kind:'use', id: R() < 0.5 ? 'mpot' : R() < 0.5 ? 'scroll' : 'elixir' });
}
function gainXp(n) {
  if (typeof rift !== 'undefined' && rift && riftMod && riftMod.xp) n = Math.round(n * riftMod.xp);
  p.xp += Math.round(n * (1 + titleBonus('xp') * 0.01));
  while (p.xp >= xpNeed(p.lvl)) {
    p.xp -= xpNeed(p.lvl); p.lvl++; p.sp += 2; p.hp = maxHp();
    msg(`LEVEL UP! LV ${p.lvl}  +2 skill points (T)`, '#f8c838'); float(p.x + 6, p.y - 10, 'LEVEL UP', '#f8c838'); sfx('lvl'); save();
  }
  checkAchievements();
}
function hurtPlayer(e, mult = 1) {
  const rMul = (typeof rift !== 'undefined' && rift && riftMod && riftMod.foeAtk) ? riftMod.foeAtk : 1;
  const dmg = Math.max(1, Math.round(e.d.atk * mult * rMul * DIFF().dmg * (0.85 + R() * 0.3)) - def());
  p.hp -= dmg; p.hurtT = 50; addShake(4);
  const dx = p.x - e.x - (e.w - p.w) / 2, dy = p.y - e.y - (e.h - p.h) / 2, l = Math.hypot(dx, dy) || 1;
  p.kx = dx / l * 3; p.ky = dy / l * 3;
  float(p.x + 6, p.y - 4, '-' + dmg, '#ff5050'); sfx('hurt');
  const th = gearBonus('thorns');
  if (th > 0 && e.hp !== undefined && !e.dead) {
    const td = Math.max(1, Math.round(dmg * th / 100));
    e.hp -= td; e.flash = 8; float(e.x + e.w / 2, e.y - 4, String(td), '#ff9040');
    if (e.hp <= 0) killEnemy(e);
  }
  if (p.hp <= 0) {
    p.hp = 0; lostGold = Math.floor(p.gold * DIFF().loss); p.gold -= lostGold;
    mode = 'dead'; stopMusic(); sfx('die'); burst(p.x + 6, p.y + 6, '#3a5ac8', 16);
  }
}
function respawn() {
  if (typeof rift !== 'undefined' && rift) exitRift();
  if (dungeon) exitDungeon();
  if (arena) leaveArena();
  if (region) leaveRegion();
  p.x = 12 * T + 2; p.y = 24 * T + 2; p.hp = maxHp(); p.hurtT = 60; p.kx = p.ky = 0;
  mode = 'play'; save(); startMusic();
}
function drinkPotion() {
  if (p.potions <= 0) { msg('No potions left!', '#ff8080'); sfx('no'); return; }
  if (p.hp >= maxHp()) { msg('HP is already full.'); return; }
  const heal = Math.round(maxHp() * 0.5);
  p.potions--; p.hp = Math.min(maxHp(), p.hp + heal); p.mp = Math.min(maxMp(), p.mp + Math.round(maxMp() * 0.3));
  float(p.x + 6, p.y - 4, '+' + heal, '#58d858'); sfx('potion');
}
function addStack(kind, id, n = 1) {
  const s = p.inv.find(i => i.kind === kind && i.id === id);
  if (s) { s.count += n; return true; }
  if (p.inv.length >= BAG) return false;
  p.inv.push({ kind, id, count:n }); return true;
}
function addMat(id, n = 1) { return addStack('mat', id, n); }
const canCarry = pk => pk.kind === 'gold' || pk.kind === 'potion' || p.inv.length < BAG
  || ((pk.kind === 'mat' || pk.kind === 'use') && p.inv.some(i => i.kind === pk.kind && i.id === pk.id));
function collect(pk) {
  if (pk.kind === 'gold') {
    const rGoldMul = (typeof rift !== 'undefined' && rift && riftMod && riftMod.gold) ? riftMod.gold : 1;
    pk.amt = Math.round(pk.amt * (1 + 0.2 * rank('gold') + gearBonus('greed') * 0.01 + titleBonus('gold') * 0.01) * rGoldMul);
    p.gold += pk.amt; float(pk.x, pk.y - 8, `+${pk.amt}G`, '#f8c838'); sfx('coin'); checkAchievements();
  }
  else if (pk.kind === 'potion') { p.potions++; msg('Found a Potion!', '#ff8080'); sfx('item'); }
  else if (pk.kind === 'use') {
    addStack('use', pk.id); msg(`Got ${CONSUMABLES[pk.id].name}!`, CONSUMABLES[pk.id].color); sfx('item');
  } else if (pk.kind === 'mat') {
    addMat(pk.id); msg(`Got ${MATS[pk.id].name}`, '#c0c0d0'); sfx('item');
    const q = storyQ();
    if (p.sq && q && q.type === 'collect' && q.target === pk.id && matCount(pk.id) === q.n) { msg('Quest complete! Return to the Elder.', '#58d858'); sfx('quest'); }
  }
  else { p.inv.push(pk.item); msg(`Found ${itemName(pk.item)}!`, RAR[pk.item.rar].c); sfx(pk.item.rar >= 2 ? 'rare' : 'item'); }
}

// ---- Update Loop ----
function updatePlayer() {
  let dx = 0, dy = 0;
  if (keys.ArrowLeft || keys.KeyA) dx--;
  if (keys.ArrowRight || keys.KeyD) dx++;
  if (keys.ArrowUp || keys.KeyW) dy--;
  if (keys.ArrowDown || keys.KeyS) dy++;
  if (p.rollCd > 0) p.rollCd--;
  if (p.comboT > 0) p.comboT--;
  if (p.slowT > 0) p.slowT--;
  if (p.dashT > 0) {
    const [vx, vy] = dirVec();
    p.dashT--; move(p, vx * 5, 0); move(p, 0, vy * 5);
    parts.push({ x: p.x + 6, y: p.y + 6, vx: 0, vy: 0, t: 12, c: '#7ad858' });
  } else if (p.rollT > 0) {
    p.rollT--; move(p, p.rollVx, 0); move(p, 0, p.rollVy);
    if (p.rollT % 2 === 0) parts.push({ x: p.x + 6, y: p.y + 8, vx: 0, vy: 0, t: 10, c: '#d0d8f0' });
  } else if (dx || dy) {
    const l = Math.hypot(dx, dy), s = 1.4 * (1 + spdBonus()) * (p.atkT > 0 ? 0.5 : 1) * (p.slowT > 0 ? 0.65 : 1);
    move(p, dx / l * s, 0); move(p, 0, dy / l * s);
    if (p.atkT <= 0) p.dir = dx ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    p.anim++;
  }
  if (p.kx || p.ky) {
    move(p, p.kx, 0); move(p, 0, p.ky); p.kx *= 0.8; p.ky *= 0.8;
    if (Math.abs(p.kx) < 0.1) p.kx = 0; if (Math.abs(p.ky) < 0.1) p.ky = 0;
  }
  if (p.hurtT > 0) p.hurtT--;
  if (p.cd > 0) p.cd--;
  if (p.atkT > 0) { p.atkT--; if (p.cls === 'knight' && !hasGun() && p.atkT <= SWING - 2 && p.atkT >= 3) swingHits(); }
  if ((keys.Space || keys.KeyJ) && p.cd <= 0) attack();
  p.skillCd = p.skillCd.map(c => Math.max(0, c - 1));
  if (frame % 6 === 0) p.target = findTarget();
  if (p.spinT > 0) p.spinT--;
  if (p.critT > 0) p.critT--;
  if (p.elixirT > 0 && --p.elixirT % 8 === 0) parts.push({ x: p.x + ri(0, 12), y: p.y + 10, vx: 0, vy: -0.7, t: 16, c: '#d080ff' });
  if (p.buffT > 0 && --p.buffT % 6 === 0) parts.push({ x: p.x + ri(0, 12), y: p.y + 10, vx: 0, vy: -0.8, t: 18, c: '#ff9040' });
  const inVillage = inWorld() && p.x < 26 * T;
  if (p.stairCD > 0) p.stairCD--;
  else {
    const ch = map[Math.floor((p.y + 6) / T)][Math.floor((p.x + 6) / T)];
    if (ch === 'V') return enterRift(1);
    if (ch === 'Z') return usePortal(Math.floor((p.x + 6) / T), Math.floor((p.y + 6) / T));
    if (ch === 'E') return enterDungeon(1);
    if (ch === '>') return (typeof rift !== 'undefined' && rift) ? enterRift(rift + 1) : enterDungeon(dungeon + 1);
    if (ch === '<') {
      if (arena) { leaveArena(); msg('You leave the Colosseum.'); return; }
      if (typeof rift !== 'undefined' && rift) { exitRift(); msg('You step through the rift portal back to the village.'); return; }
      exitDungeon(); msg('You climb back to the surface.'); return;
    }
  }
  const regMul = titleBonus('regen') || 1;
  if (p.hp < maxHp() && frame % Math.max(2, Math.round((inVillage ? 6 : 150) / regMul)) === 0) p.hp++;
  if (p.mp < maxMp() && frame % Math.max(2, Math.round((inVillage ? 4 : p.cls === 'mage' ? 12 : 20) / regMul)) === 0) p.mp++;
}
function updateEnemies() {
  const pcx = p.x + 6, pcy = p.y + 6;
  for (const e of enemies) {
    if (e.dead) continue;
    if (Math.abs(e.x - p.x) > VW + 64 || Math.abs(e.y - p.y) > VH + 64) continue;   // sleep when far away
    if (e.flash > 0) e.flash--;
    if (e.d.dummy) { if (e.stun > 0) e.stun--; continue; }
    if (e.frozen > 0) { e.frozen--; continue; }
    e.anim++;
    if (e.stun > 0) { e.stun--; move(e, e.kx, 0, true); move(e, 0, e.ky, true); e.kx *= 0.8; e.ky *= 0.8; continue; }
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2, dx = pcx - ex, dy = pcy - ey, d = Math.hypot(dx, dy) || 1;
    let vx = 0, vy = 0;
    if (e.type === 'orc') {
      if (e.hp < e.d.hp * 0.5 && !e.enraged) {
        e.enraged = true; float(ex, e.y - 10, 'ENRAGED!', '#ff4040');
        rings.push({ x: ex, y: ey, r: 4, max: 48, c: '#ff4040', t: 20 }); sfx('cry'); addShake(4);
      }
      if (e.slamCD > 0) e.slamCD--;
      if (e.slam > 0) {
        if (--e.slam === 0) {
          burst(ex, ey, '#c8a070', 24); noise(0.3, 0.5); tone(80, 0.3, 'square', 0.5, 40); addShake(6);
          if (d < 52 && p.hurtT <= 0) hurtPlayer(e, e.enraged ? 1.5 : 1.3);
        }
        continue;
      }
      if (d < 70 && e.slamCD <= 0) { e.slam = 45; e.slamCD = e.enraged ? 115 : 160; continue; }
    } else if (e.type === 'frostwyrm') {
      if (e.slamCD > 0) e.slamCD--;
      if (e.slam > 0) {
        if (--e.slam === 0) {
          burst(ex, ey, '#a0f0ff', 28); rings.push({ x: ex, y: ey, r: 6, max: 62, c: '#60e0ff', t: 18 }); sfx('frost'); addShake(5);
          if (d < 62 && p.hurtT <= 0) { hurtPlayer(e, 1.25); p.slowT = 180; float(p.x + 6, p.y - 12, 'CHILLED!', '#80e0ff'); }
        }
        continue;
      }
      if (d < 78 && e.slamCD <= 0) { e.slam = 50; e.slamCD = 200; continue; }
    } else if (e.type === 'infernal') {
      if (e.hp < e.d.hp * 0.6 && !e.enraged) {
        e.enraged = true; float(ex, e.y - 10, 'ENRAGED!', '#ff6020');
        rings.push({ x: ex, y: ey, r: 4, max: 56, c: '#ff6020', t: 20 }); sfx('cry'); addShake(5);
        for (const ox of [-22, 22]) if (!blocked(ex + ox, ey, 12, 12, true)) {
          enemies.push(mkEnemy('fireimp', ex + ox, ey, 'emberfall'));
          burst(ex + ox + 6, ey + 6, '#ff8020', 14);
        }
      }
      if (e.slamCD > 0) e.slamCD--;
      if (e.slam > 0) {
        if (--e.slam === 0) {
          burst(ex, ey, '#ff8020', 30); rings.push({ x: ex, y: ey, r: 6, max: 60, c: '#ff6020', t: 18 }); sfx('boom'); addShake(6);
          if (d < 60 && p.hurtT <= 0) hurtPlayer(e, e.enraged ? 1.5 : 1.35);
        }
        continue;
      }
      if (d < 78 && e.slamCD <= 0) { e.slam = 48; e.slamCD = e.enraged ? 130 : 180; continue; }
    } else if (e.type === 'lich' && e.hp < e.d.hp * 0.65) {
      if (--e.specCD <= 0) {
        e.specCD = 320;
        if (enemies.filter(m => !m.dead && m.type === 'skel').length < 4) {
          for (const ox of [-20, 20]) if (!blocked(ex + ox, ey, 12, 12, true)) {
            enemies.push(mkEnemy('skel', ex + ox, ey, 'crypt'));
            burst(ex + ox + 6, ey + 6, '#60ff90', 12);
          }
          float(ex, e.y - 10, 'SUMMON!', '#60ff90'); rings.push({ x: ex, y: ey, r: 4, max: 40, c: '#60ff90', t: 18 }); sfx('frost');
        }
      }
    }
    const rfSpd = (typeof rift !== 'undefined' && rift && riftMod && riftMod.foeSpd) ? riftMod.foeSpd : 1;
    const spd = e.d.spd * (e.enraged ? 1.25 : 1) * rfSpd;
    const engaged = (arena || (typeof rift !== 'undefined' && rift) || d < e.d.aggro) && (dungeon || region || arena || (typeof rift !== 'undefined' && rift) || p.x > 26 * T - 8);
    if (engaged && e.d.ranged) {                     // casters keep their distance and shoot
      if (--e.shootCD <= 0) fireEnemy(e, dx / d, dy / d);
      const want = e.d.boss ? 80 : 100, s = d < want - 20 ? -1 : d > want + 20 ? 1 : 0;
      vx = dx / d * spd * s; vy = dy / d * spd * s;
    } else if (engaged) { vx = dx / d * spd; vy = dy / d * spd; }
    else {
      if (--e.wt <= 0) { e.wt = ri(60, 180); const a = R() * 6.28, s = R() < 0.3 ? 0 : e.d.spd * 0.5; e.wx = Math.cos(a) * s; e.wy = Math.sin(a) * s; }
      vx = e.wx; vy = e.wy;
    }
    move(e, vx, 0, true); move(e, 0, vy, true);
    if (Math.abs(vx) > 0.05) e.face = Math.sign(vx);
    if (p.hurtT <= 0 && overlap(e, p)) hurtPlayer(e);
    if (mode !== 'play') return;
  }
  enemies = enemies.filter(e => !e.dead);
}
function updatePickups() {
  const cx = p.x + 6, cy = p.y + 6;
  for (const pk of pickups) {
    pk.t++; pk.life--; pk.x += pk.vx; pk.y += pk.vy; pk.vx *= 0.88; pk.vy *= 0.88;
    if (pk.t < 25) continue;
    const d = Math.hypot(cx - pk.x, cy - pk.y);
    if (!canCarry(pk)) { if (d < 14 && frame % 120 === 0) msg('Your bag is full! Sell at the merchant.', '#ff8080'); continue; }
    if (d < 40) { pk.x += (cx - pk.x) * 0.15; pk.y += (cy - pk.y) * 0.15; }
    if (d < 10) { collect(pk); pk.gone = true; }
  }
  pickups = pickups.filter(pk => !pk.gone && pk.life > 0);
}
function cyclePet() {
  const avail = PET_KEYS.filter(k => p.lvl >= PETS[k].lvl);
  p.pet = avail[(avail.indexOf(p.pet) + 1) % avail.length];
  const pt = PETS[p.pet];
  burst(petObj.x + 6, petObj.y + 6, pt.c, 12); sfx('item');
  const next = PET_KEYS.find(k => p.lvl < PETS[k].lvl);
  msg(`Companion: ${pt.name} — ${pt.desc}${next ? ` (Next at LV ${PETS[next].lvl})` : ''}`, pt.c);
  save();
}
function updatePet() {
  if (!p || !p.pet) return;
  if (!PETS[p.pet] || p.lvl < PETS[p.pet].lvl) p.pet = 'wolf';
  const [fx, fy] = dirVec(), tx = p.x - fx * 15, ty = p.y - fy * 15;
  const dx = tx - petObj.x, dy = ty - petObj.y, dist = Math.hypot(dx, dy);
  if (dist > 160) { petObj.x = tx; petObj.y = ty; }
  else if (dist > 6) {
    petObj.x += dx * 0.14; petObj.y += dy * 0.14;
    if (Math.abs(dx) > 0.4) petObj.face = Math.sign(dx);
  }
  petObj.anim++;
  const px = petObj.x + 6, py = petObj.y + 6, pcx = p.x + 6, pcy = p.y + 6;
  for (const pk of pickups) if (pk.t >= 18 && canCarry(pk)) {
    const pd = Math.hypot(px - pk.x, py - pk.y);
    if (pd < 85) { pk.x += (pcx - pk.x) * 0.18; pk.y += (pcy - pk.y) * 0.18; }
  }
  if (--petObj.cd <= 0) {
    let best = null, bestD = 125;
    for (const e of enemies) if (!e.dead && !e.d.dummy) {
      const ed = Math.hypot(e.x + e.w / 2 - pcx, e.y + e.h / 2 - pcy);
      if (ed < bestD) { bestD = ed; best = e; }
    }
    if (p.pet === 'wolf' && best) {
      const ex = best.x + best.w / 2, ey = best.y + best.h / 2;
      petObj.x = ex - 6; petObj.y = ey - 6;
      damageEnemy(best, 0, 0, 0.45);
      burst(ex, ey, '#ffd090', 7);
      petObj.cd = 95;
    } else if (p.pet === 'fairy') {
      let acted = false;
      if (p.hp < maxHp() || p.mp < maxMp()) {
        const hh = Math.max(2, Math.round(maxHp() * 0.04)), hm = Math.max(1, Math.round(maxMp() * 0.05));
        p.hp = Math.min(maxHp(), p.hp + hh); p.mp = Math.min(maxMp(), p.mp + hm);
        burst(pcx, pcy, '#60e8ff', 8); float(pcx, p.y - 8, `+${hh}`, '#60e8ff');
        acted = true;
      }
      if (best) {
        const a = Math.atan2(best.y + best.h / 2 - py, best.x + best.w / 2 - px);
        projs.push({ kind:'bolt', mult: 0.5, x: px, y: py, vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5, life: 45 });
        acted = true;
      }
      petObj.cd = acted ? 110 : 30;
    } else if (p.pet === 'wyrm' && best) {
      const a = Math.atan2(best.y + best.h / 2 - py, best.x + best.w / 2 - px);
      projs.push({ kind:'ice', mult: 0.65, x: px, y: py, vx: Math.cos(a) * 3.6, vy: Math.sin(a) * 3.6, life: 45 });
      sfx('frost'); petObj.cd = 100;
    } else petObj.cd = 25;
  }
}
function updateArena() {
  if (enemies.length > 0) return;
  if (arenaWait > 0) {
    if (--arenaWait === 0) {
      const scale = 1 + (arena - 1) * 0.18;
      const pool = arena < 3 ? ['slime', 'wolf', 'goblin']
        : arena < 6 ? ['wolf', 'goblin', 'skel', 'spider']
        : ['skel', 'spider', 'cultist', 'bknight', 'icewolf', 'magmaslime'].filter(k => ETYPES[k]);
      const count = Math.min(9, 3 + Math.floor(arena * 0.8));
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + R() * 0.4;
        const tx = clamp(Math.round(14 + Math.cos(a) * ri(5, 8)), 5, 22);
        const ty = clamp(Math.round(10 + Math.sin(a) * ri(3, 5)), 4, 15);
        const type = pool[ri(0, pool.length - 1)];
        enemies.push(mkEnemy(type, tx * T + 2, ty * T + 2, 'arena', scale, R() < 0.2 + arena * 0.03));
        burst(tx * T + 8, ty * T + 8, '#ffd838', 10);
      }
      if (arena % 5 === 0) {
        const bosses = ['orc', 'lich', 'frostwyrm', 'infernal'].filter(k => ETYPES[k]);
        const bType = bosses[(Math.floor(arena / 5) - 1) % bosses.length];
        enemies.push(mkEnemy(bType, 14 * T - 12, 9 * T - 12, 'arena', scale));
        rings.push({ x: 14 * T + 8, y: 9 * T + 8, r: 6, max: 54, c: '#ff5030', t: 22 });
      }
      banner = { txt: `Wave ${arena}!`, t: 110 }; sfx('cry');
    }
    return;
  }
  const wGold = 40 * arena, wXp = 35 * arena;
  p.gold += wGold; gainXp(wXp);
  p.hp = Math.min(maxHp(), p.hp + Math.round(maxHp() * 0.25));
  p.mp = Math.min(maxMp(), p.mp + Math.round(maxMp() * 0.25));
  p.bestWave = Math.max(p.bestWave || 0, arena);
  msg(`★ Wave ${arena} Cleared! +${wGold}G +${wXp}XP (Best: W${p.bestWave})`, '#ffd838');
  sfx('quest');
  arena++; zoneName = zoneAt(p.x); arenaWait = 110; save();
}
function spawner() {
  if (arena) return updateArena();
  if (dungeon) return;                                  // crypt floors don't respawn
  if (region) return regionSpawner();                   // map packs use their own spawn table
  if (frame % 120 === 0) {
    for (const z of ZONES) for (const [type, n] of z.mobs) {
      if (enemies.filter(e => e.type === type && e.zone === z.name).length < n) spawnOne(type, z, false);
    }
  }
  if (bossCD > 0) bossCD--;
  else if (!enemies.some(e => e.d.boss)) { enemies.push(mkEnemy('orc', 80 * T - 4, 24 * T, 'Old Ruins')); bossCD = 1e9; }
}

function update() {
  frame++;
  if (shake > 0) shake = Math.max(0, shake - 0.5);
  for (const f of floats) { f.y -= 0.4; f.t--; } floats = floats.filter(f => f.t > 0);
  for (const q of parts) { q.x += q.vx; q.y += q.vy; q.vx *= 0.9; q.vy *= 0.9; q.t--; } parts = parts.filter(q => q.t > 0);
  for (const r of rings) { r.r += (r.max - r.r) * 0.3; r.t--; } rings = rings.filter(r => r.t > 0);
  if (mode === 'title') {
    camx = (Math.sin(frame * 0.002) + 1) / 2 * (MW * T - VW);
    camy = (MH * T - VH) / 2 + Math.sin(frame * 0.003) * 120;
    return;
  }
  if (mode !== 'play') return;
  for (const m of msgs) m.t--; msgs = msgs.filter(m => m.t > 0);
  if (banner && --banner.t <= 0) banner = null;
  updatePlayer();
  updatePet();
  updateEnemies();
  if (mode !== 'play') return;
  updateProjs();
  updateEprojs();
  if (mode !== 'play') return;
  updatePickups();
  spawner();
  const z = zoneAt(p.x);
  if (z !== zoneName) {
    zoneName = z; banner = { txt: z, t: 150 };
    const q = storyQ();
    if (p.sq && q && q.type === 'visit' && q.target === z && p.sprog < 1) { p.sprog = 1; msg('Quest complete! Return to the Elder.', '#58d858'); sfx('quest'); }
  }
  if (frame % 30 === 0) checkAchievements();
  if (frame % 600 === 0) save();
  if (frame % 6 === 0) { syncMini(); revealAround(); }
  camx += (p.x + 6 - VW / 2 - camx) * 0.15; camy += (p.y + 6 - VH / 2 - camy) * 0.15;
  camx = clamp(camx, 0, MW * T - VW); camy = clamp(camy, 0, MH * T - VH);
}
