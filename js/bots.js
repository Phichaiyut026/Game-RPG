// ================= Auto-farm, Bot Players & World Boss =================
// Overworld only. Bots are simulated "other players": they roam the zones that suit their level,
// fight monsters, level up, chat, get knocked out and respawn in the village. Every few minutes the
// Ancient Titan wakes up in the Meadow; it heals itself unless at least 3 heroes are fighting it,
// so the player has to raid it together with the bots.

const BOSS_DMG = 1.5;                       // every boss hits this much harder than its listed ATK
const RAID_MIN = 3;                         // heroes needed near the Titan to stop its regeneration
const WB_FIRST = 60 * 90, WB_RESPAWN = 60 * 60 * 5;
const TITAN_LEASH = { x0: 30, x1: 43, y0: 4, y1: 44 };   // tiles: the Meadow, well clear of the village wall
let bots = [], botShots = [], wbTimer = WB_FIRST;

// ---- World boss data (registered like any monster) ----
ETYPES.titan = { name:'Ancient Titan', hp:45000, atk:38, def:12, spd:0.4, xp:5000, gold:[1200, 2000], aggro:260,
  drop:['titan_core', 1], gear:1, tier:4, boss:true, world:true, w:40, h:40 };
SPR.titan = [
  ['.AA..AA.','AAGAAGAA','AEAAAAEA','AAAWWAAA','NAAAAAAN','NAGAAGAN','.AA..AA.','.NN..NN.'],
  ['.AA..AA.','AAGAAGAA','AEAAAAEA','AAAWWAAA','NAAAAAAN','NAGAAGAN','.AA..AA.','NN....NN'],
].map(rows => dimensional(art(rows, 6)));
PLURAL.titan = 'Ancient Titan';
MATS.titan_core = { name:'Titan Core', value:1500 };
ICON.titan_core = dimensional(art(['...EE...','..EYYE..','.EYWYYE.','EYYYYYYE','EYYYYYYE','.EYYYYE.','..EYYE..','...EE...']), false);

// ---- Bots ----
const BOT_ROSTER = [
  ['NongMint', 'mage'], ['DarkKnight99', 'knight'], ['Ranger_Boy', 'ranger'],
  ['PloyPloy', 'mage'], ['ArmTH', 'knight'], ['xXFahXx', 'ranger'],
];
const BOT_CHAT = ['ฟาร์มต่อ ๆ', 'ใครไปบอสบ้าง', 'lol', 'gg', 'ดรอปไม่ออกเลย 555', 'need party!', 'เลเวลอัปแล้ว!',
  'ตีสไลม์เพลินจัง', 'มีใครขายดาบไหม', 'afk แป๊บ', 'brb', 'บอสโลกมาเมื่อไหร่นะ'];
const BOT_COLOR = { knight:'#a0c8ff', mage:'#d0a0ff', ranger:'#a0f0a0' };
function botStats(b) {
  const c = CLASSES[b.cls];
  b.maxHp = c.hp[0] + b.lvl * c.hp[1]; b.atk = 4 + b.lvl * 3; b.def = Math.floor(b.lvl / 2) + c.def;
}
function initBots() {
  botShots = []; wbTimer = WB_FIRST;
  const base = p ? p.lvl : 1;
  bots = BOT_ROSTER.map(([name, cls], i) => {
    const b = { bot: true, name, cls, lvl: Math.max(1, base + ri(-1, 3) + (i % 3)), x: (8 + i * 2) * T + 2, y: 24 * T + 2, w: 12, h: 12,
      dir: 'down', anim: 0, cd: ri(0, 30), atkT: 0, hurtT: 0, state: 'roam', goal: null, goalT: 0, target: null,
      respawnT: 0, say: '', sayT: 0, chatCD: ri(600, 2400), xp: 0, stuck: 0, lx: 0, ly: 0 };
    botStats(b); b.hp = b.maxHp;
    return b;
  });
}
const worldBoss = () => inWorld() ? enemies.find(e => e.type === 'titan' && !e.dead) : null;
const botAlive = b => b.state !== 'dead';
function botZone(b) { return ZONES[b.lvl < 4 ? 0 : b.lvl < 8 ? 1 : 2] || ZONES[0]; }
function botSay(b, s, t = 180) { b.say = s; b.sayT = t; }

function moveBot(b, tx, ty, spd) {
  const cx = b.x + 6, cy = b.y + 6, dx = tx - cx, dy = ty - cy, d = Math.hypot(dx, dy);
  if (d < 1) return true;
  const s = Math.min(spd, d);
  move(b, dx / d * s, 0); move(b, 0, dy / d * s);
  b.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  b.anim++;
  // stuck on a tree or wall: nudge sideways, then give up on that goal
  if (Math.hypot(b.x - b.lx, b.y - b.ly) < 0.2) { if (++b.stuck > 40) { b.goal = null; b.stuck = 0; move(b, ri(-6, 6), ri(-6, 6)); } }
  else b.stuck = 0;
  b.lx = b.x; b.ly = b.y;
  return false;
}
function pickGoal(b) {
  const z = botZone(b);
  for (let i = 0; i < 20; i++) {
    const x = ri(z.x0, z.x1) * T + 2, y = ri(3, MH - 4) * T + 2;
    if (!blocked(x, y, 12, 12)) return { x: x + 6, y: y + 6 };
  }
  return { x: 30 * T, y: 24 * T };
}
function botAttack(b, e) {
  b.cd = b.cls === 'knight' ? 34 : 46; b.atkT = 12;
  const cx = b.x + 6, cy = b.y + 6;
  if (b.cls === 'knight') botHit(b, e);
  else botShots.push({ x: cx, y: cy, e, b, kind: b.cls === 'mage' ? 'bolt' : 'arrow', life: 90 });
}
function botHit(b, e) {
  if (e.dead) return;
  const raid = e.type === 'titan';
  const dmg = Math.max(1, Math.round(b.atk * (0.85 + R() * 0.3) * (raid ? 2.2 : 1)) - e.d.def);
  e.hp -= dmg; e.flash = 6;
  float(e.x + e.w / 2, e.y - 2, String(dmg), BOT_COLOR[b.cls]);
  if (e.hp > 0) return;
  if (raid) { killEnemy(e); return; }                   // the Titan's spoils go to everyone (the player loots them)
  e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, '#c83030', 8);
  b.xp += e.d.xp;
  if (b.xp >= 20 * b.lvl ** 1.6) {
    b.xp = 0; b.lvl++; botStats(b); b.hp = b.maxHp;
    float(b.x + 6, b.y - 14, 'LEVEL UP', '#f8c838');
    if (R() < 0.5) botSay(b, 'เลเวลอัปแล้ว!');
  }
}
function hurtBot(b, e, mult = 1) {
  if (b.hurtT > 0 || !botAlive(b)) return;
  const dmg = Math.max(1, Math.round(e.d.atk * mult * (e.d.boss ? BOSS_DMG : 1) * DIFF().dmg * (0.85 + R() * 0.3)) - b.def);
  b.hp -= dmg; b.hurtT = 40;
  float(b.x + 6, b.y - 4, '-' + dmg, '#ff9090');
  if (b.hp <= 0) {
    b.hp = 0; b.state = 'dead'; b.respawnT = 600; b.target = null;
    burst(b.x + 6, b.y + 6, BOT_COLOR[b.cls], 14);
    if (Math.hypot(b.x - p.x, b.y - p.y) < 400) msg(`${b.name} was knocked out!`, '#ff9090');
  }
}
function updateBots() {
  if (wbTimer > 0) wbTimer--;
  if (!inWorld()) return;
  if (wbTimer <= 0 && !worldBoss()) spawnWorldBoss();
  const titan = worldBoss();
  for (const b of bots) {
    if (b.state === 'dead') {
      if (--b.respawnT <= 0) { b.state = 'roam'; b.hp = b.maxHp; b.x = (10 + ri(0, 6)) * T + 2; b.y = (23 + ri(0, 2)) * T + 2; b.goal = null; }
      continue;
    }
    if (b.cd > 0) b.cd--;
    if (b.atkT > 0) b.atkT--;
    if (b.hurtT > 0) b.hurtT--;
    if (b.sayT > 0) b.sayT--;
    if (--b.chatCD <= 0) { b.chatCD = ri(1500, 4200); if (R() < 0.6) botSay(b, BOT_CHAT[ri(0, BOT_CHAT.length - 1)]); }
    const cx = b.x + 6, cy = b.y + 6;
    // target: the Titan during a raid, otherwise the nearest monster close by
    let tgt = titan;
    if (!tgt) {
      if (b.target && !b.target.dead && Math.hypot(b.target.x - b.x, b.target.y - b.y) < 220) tgt = b.target;
      else {
        let best = 150;
        for (const e of enemies) {
          if (e.dead || e.d.dummy || (e.d.boss && b.lvl < 10)) continue;
          const d = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy);
          if (d < best) { best = d; tgt = e; }
        }
      }
    }
    b.target = tgt;
    if (tgt) {
      b.state = tgt === titan ? 'raid' : 'fight';
      const tx = tgt.x + tgt.w / 2, ty = tgt.y + tgt.h / 2, d = Math.hypot(tx - cx, ty - cy);
      const range = b.cls === 'knight' ? 10 + tgt.w / 2 : 85;
      if (d > range) moveBot(b, tx, ty, b.state === 'raid' && d > 200 ? 1.6 : 1.15);
      else if (b.cls !== 'knight' && d < 40) moveBot(b, cx - (tx - cx), cy - (ty - cy), 0.9);   // kite
      else b.dir = Math.abs(tx - cx) > Math.abs(ty - cy) ? (tx < cx ? 'left' : 'right') : (ty < cy ? 'up' : 'down');
      if (d <= range + 8 && b.cd <= 0) botAttack(b, tgt);
    } else {
      b.state = 'roam';
      if (!b.goal || --b.goalT <= 0) { b.goal = pickGoal(b); b.goalT = ri(600, 1400); }
      if (moveBot(b, b.goal.x, b.goal.y, 0.9)) b.goal = null;
      if (b.hp < b.maxHp && frame % 20 === 0) b.hp++;
    }
  }
  // bot projectiles home in on their target
  for (const s of botShots) {
    if (s.e.dead) { s.life = 0; continue; }
    const tx = s.e.x + s.e.w / 2, ty = s.e.y + s.e.h / 2, dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
    if (d < 5) { botHit(s.b, s.e); s.life = 0; continue; }
    s.x += dx / d * 4; s.y += dy / d * 4; s.ang = Math.atan2(dy, dx);
    if (--s.life <= 0) s.life = 0;
  }
  botShots = botShots.filter(s => s.life > 0);
}

// ---- Enemy targeting: monsters go for whichever hero is closest (player or bot) ----
function enemyTarget(e, ex, ey) {
  const pcx = p.x + 6, pcy = p.y + 6;
  let best = { x: pcx, y: pcy, bot: null }, bestD = Math.hypot(pcx - ex, pcy - ey);
  if (!inWorld()) return best;
  for (const b of bots) {
    if (!botAlive(b) || b.x < 26 * T) continue;            // the village stays safe for bots too
    const d = Math.hypot(b.x + 6 - ex, b.y + 6 - ey);
    if (d < bestD && d < e.d.aggro) { bestD = d; best = { x: b.x + 6, y: b.y + 6, bot: b }; }
  }
  return best;
}

// ---- World boss ----
function spawnWorldBoss() {
  const t = mkEnemy('titan', 38 * T - 12, 24 * T - 12, 'Meadow');
  t.slamCD = 180; t.shootCD = 200; t.sum1 = t.sum2 = false;
  enemies.push(t);
  wbTimer = 1e9;
  banner = { txt: 'WORLD BOSS!', t: 200 }; sfx('cry'); addShake(6);
  msg('The Ancient Titan has awakened in the Meadow! Gather a party!', '#ff6040');
  for (const b of bots) if (R() < 0.5) botSay(b, R() < 0.5 ? 'บอสโลกมาแล้ว! ไปตีกัน!' : 'raid boss! go go!');
}
function heroesNear(x, y, r) {
  let n = 0;
  if (mode === 'play' && p.hp > 0 && Math.hypot(p.x + 6 - x, p.y + 6 - y) < r) n++;
  for (const b of bots) if (botAlive(b) && Math.hypot(b.x + 6 - x, b.y + 6 - y) < r) n++;
  return n;
}
// Titan behaviour; returns true because it handles its own movement and contact damage
function titanAI(e, ex, ey) {
  e.raiders = heroesNear(ex, ey, 180);
  if (e.raiders < RAID_MIN && e.hp < e.d.hp && frame % 30 === 0) {
    e.hp = Math.min(e.d.hp, e.hp + Math.round(e.d.hp * 0.004));
    if (frame % 120 === 0) float(ex, e.y - 6, '+REGEN', '#60ff90');
  }
  const summon = () => {
    for (const ox of [-34, 34]) enemies.push(mkEnemy(R() < 0.5 ? 'goblin' : 'skel', ex + ox, ey, 'Meadow', 1.6));
    float(ex, e.y - 10, 'SUMMON!', '#ff8040'); rings.push({ x: ex, y: ey, r: 6, max: 60, c: '#ff8040', t: 20 }); sfx('cry');
  };
  if (!e.sum1 && e.hp < e.d.hp * 0.5) { e.sum1 = true; summon(); }
  if (!e.sum2 && e.hp < e.d.hp * 0.25) { e.sum2 = true; summon(); }
  if (!e.enraged && e.hp < e.d.hp * 0.3) {
    e.enraged = true; float(ex, e.y - 12, 'ENRAGED!', '#ff4040'); rings.push({ x: ex, y: ey, r: 6, max: 80, c: '#ff4040', t: 24 }); addShake(6);
  }
  if (e.slamCD > 0) e.slamCD--;
  // ground slam: 1s red warning ring, then heavy damage to every hero inside it
  if (e.slam > 0) {
    if (--e.slam === 0) {
      burst(ex, ey, '#c8a070', 40); rings.push({ x: ex, y: ey, r: 8, max: 80, c: '#ffb060', t: 22 }); addShake(8);
      noise(0.4, 0.6); tone(60, 0.4, 'square', 0.5, 30);
      if (Math.hypot(p.x + 6 - ex, p.y + 6 - ey) < 76 && p.hurtT <= 0) hurtPlayer(e, 1.8);
      for (const b of bots) if (botAlive(b) && Math.hypot(b.x + 6 - ex, b.y + 6 - ey) < 76) hurtBot(b, e, 1.8);
    }
    return true;
  }
  if (e.slamCD <= 0 && heroesNear(ex, ey, 90) > 0) { e.slam = 60; e.slamCD = e.enraged ? 150 : 230; return true; }
  // rock barrage in every direction
  if (--e.shootCD <= 0) {
    const n = e.enraged ? 18 : 14, off = R() * 6.28;
    for (let i = 0; i < n; i++) {
      const a = off + i / n * Math.PI * 2;
      eprojs.push({ x: ex, y: ey, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8, life: 170, atk: e.d.atk * BOSS_DMG, c: '#b08860' });
    }
    e.shootCD = e.enraged ? 110 : 170; tone(140, 0.2, 'square', 0.2, 60);
  }
  // lumber toward the nearest hero (ignores trees). It is leashed to the Meadow so it can never
  // camp the village gate; if its target leaves the leash it walks back toward its lair.
  const tg = enemyTarget(e, ex, ey), dx = tg.x - ex, dy = tg.y - ey, d = Math.hypot(dx, dy) || 1;
  const L = TITAN_LEASH, s = e.d.spd * (e.enraged ? 1.3 : 1);
  if (d < e.d.aggro && d > 18 && tg.x > L.x0 * T - 40) {
    e.x = clamp(e.x + dx / d * s, L.x0 * T, L.x1 * T); e.y = clamp(e.y + dy / d * s, L.y0 * T, L.y1 * T);
    if (Math.abs(dx) > 1) e.face = Math.sign(dx);
  } else {
    const hx = 38 * T - 12 - e.x, hy = 24 * T - 12 - e.y, hd = Math.hypot(hx, hy);
    if (hd > 4) { e.x += hx / hd * s; e.y += hy / hd * s; e.face = Math.sign(hx) || e.face; }
  }
  e.anim++;
  if (p.hurtT <= 0 && overlap(e, p)) hurtPlayer(e);
  for (const b of bots) if (botAlive(b) && overlap(e, b)) hurtBot(b, e);
  return true;
}
function onTitanKilled(e) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  for (let i = 0; i < 2; i++) drop(cx, cy, { kind:'gear', item: rollGear(4, 3) });
  for (let i = 0; i < 6; i++) drop(cx, cy, { kind:'gold', amt: ri(150, 300) });
  banner = { txt: 'WORLD BOSS DEFEATED!', t: 220 }; sfx('quest'); addShake(10);
  rings.push({ x: cx, y: cy, r: 8, max: 120, c: '#ffd838', t: 30 });
  wbTimer = WB_RESPAWN;
  for (const b of bots) if (botAlive(b)) botSay(b, R() < 0.5 ? 'GG!!' : 'เย้ ล้มบอสได้แล้ว!');
}

// ---- Auto farm (G) ----
let autoLast = null, autoStuck = 0, autoSide = null, autoPotCD = 0;
function toggleAuto() {
  p.auto = !p.auto; autoSide = null; autoStuck = 0;
  msg(p.auto ? 'AUTO FARM: ON' : 'AUTO FARM: OFF', p.auto ? '#58e858' : '#a0a0b0'); sfx('menu');
}
// returns the movement the auto pilot wants this frame and fires attacks/skills/potions itself
function autoPilot() {
  if (autoPotCD > 0) autoPotCD--;
  if (p.hp < maxHp() * 0.4 && p.potions > 0 && autoPotCD <= 0) { drinkPotion(); autoPotCD = 90; }
  const cx = p.x + 6, cy = p.y + 6, titan = worldBoss();
  let best = null, bestS = Infinity;
  for (const e of enemies) {
    if (e.dead || e.d.dummy || (e.d.boss && e !== titan)) continue;      // never pulls normal bosses
    const s = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy) - (e === titan ? 400 : 0);
    if (s < bestS) { bestS = s; best = e; }
  }
  if (!best) return { dx: 0, dy: 0 };
  const tx = best.x + best.w / 2, ty = best.y + best.h / 2, d = Math.hypot(tx - cx, ty - cy) || 1;
  const ranged = isRanged(), want = ranged ? 70 : 8 + best.w / 2;
  let dx = 0, dy = 0;
  if (d > want) { dx = (tx - cx) / d; dy = (ty - cy) / d; }
  else if (ranged && d < 35) { dx = -(tx - cx) / d; dy = -(ty - cy) / d; }
  if (d < (ranged ? AIM_RANGE : want + 16)) {
    const a = Math.atan2(ty - cy, tx - cx);
    p.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 'left' : 'right') : (Math.sin(a) < 0 ? 'up' : 'down');
    if (p.cd <= 0) attack();
    C().skills.forEach((s, i) => {
      if (s.name !== 'Dash' && p.lvl >= s.lvl && p.skillCd[i] <= 0 && p.mp >= s.mp + 5 && d < 90) useSkill(i);
    });
  }
  // stuck on a wall or tree: walk sideways for a moment
  if (autoLast && (dx || dy) && Math.hypot(p.x - autoLast[0], p.y - autoLast[1]) < 0.3) autoStuck++;
  else autoStuck = Math.max(0, autoStuck - 1);
  autoLast = [p.x, p.y];
  if (autoStuck > 20) { const sgn = R() < 0.5 ? 1 : -1; autoSide = { t: 35, dx: -dy * sgn || sgn, dy: dx * sgn }; autoStuck = 0; }
  if (autoSide && autoSide.t-- > 0) { dx = autoSide.dx; dy = autoSide.dy; }
  return { dx, dy };
}

// ---- Drawing ----
function drawBot(b, cx, cy) {
  const look = HEROES[b.cls], f = Math.floor(b.anim / 10) % 2, sx = b.x - 2 - cx, sy = b.y - 4 - cy;
  if (b.hurtT > 0 && Math.floor(b.hurtT / 4) % 2) return;
  drawSprite((b.dir === 'up' ? look.up : look.down)[f], sx, sy, b.dir === 'left');
  const kind = CLASS_WT[b.cls], ang = b.dir === 'left' ? Math.PI - 0.45 : b.dir === 'up' ? -2.2 : b.dir === 'right' ? 0.45 : 1.1;
  if (b.atkT > 0 && kind === 'sword') {                  // quick slash flash
    const a = DIR_ANG[b.dir] - 1 + (1 - b.atkT / 12) * 2;
    ctx.globalAlpha = 0.6; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(Math.round(b.x + 6 - cx), Math.round(b.y + 6 - cy), 15, a - 0.8, a); ctx.stroke(); ctx.globalAlpha = 1;
  }
  drawWeapon(kind, sx + (b.dir === 'left' ? 3 : 13), sy + 12, kind === 'staff' ? -1.4 : ang, false);
  // name tag + HP bar
  text(b.name, Math.round(b.x + 6 - cx), Math.round(b.y - 18 - cy), BOT_COLOR[b.cls], 'center');
  bar(Math.round(b.x - cx), Math.round(b.y - 8 - cy), 12, 2, b.hp / b.maxHp, '#58d858', '#203820');
  if (b.sayT > 0) {                                      // chat bubble
    const w = textW(b.say) + 8, x = Math.round(b.x + 6 - cx - w / 2), y = Math.round(b.y - 33 - cy);
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(x, y, w, 12); ctx.fillRect(x + w / 2 - 1, y + 12, 3, 2);
    text(b.say, x + w / 2, y + 2, '#202030', 'center');
  }
}
function drawBotShots(cx, cy) {
  for (const s of botShots) {
    const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
    if (s.kind === 'bolt') { ctx.fillStyle = '#a080ff'; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1); }
    else { ctx.save(); ctx.translate(x, y); ctx.rotate(s.ang || 0); ctx.fillStyle = '#d0b080'; ctx.fillRect(-5, 0, 8, 1); ctx.fillStyle = '#fff'; ctx.fillRect(3, -1, 2, 3); ctx.restore(); }
  }
}
// AUTO badge + world boss raid status, drawn over the HUD
function drawRaidHud() {
  if (p.auto && Math.floor(frame / 20) % 3) {
    panel(4, 52, 48, 14, '#58e858', 0.85); text('AUTO', 28, 55, '#58e858', 'center');
  }
  if (!inWorld()) return;
  const t = worldBoss();
  if (!t) return;
  const near = Math.hypot(t.x - p.x, t.y - p.y) < 240;
  if (!near) { text('WORLD BOSS ACTIVE: Meadow', VW / 2, 22, '#ff8060', 'center'); return; }
  const n = t.raiders || 0;
  text(`RAIDERS ${n}/${RAID_MIN}`, VW / 2, 72, n >= RAID_MIN ? '#58e858' : '#ff8080', 'center');
  if (n < RAID_MIN && Math.floor(frame / 30) % 2) text('The Titan regenerates! Bring more heroes!', VW / 2, 84, '#ff8080', 'center');
}
