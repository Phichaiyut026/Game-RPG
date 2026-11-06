// ================= Combat medics: recovering the fallen =================
// A bot who goes down no longer pops back at the base after a timer. His body lies where he fell
// (blood pool, red-cross marker) until a two-man medic team with a stretcher walks out from the aid
// station on the base plaza, loads him up and carries him home, where he is patched up and rejoins the fight.
// While a zombie invasion is on, nobody goes out: the medics wait until the invasion is over, then the
// teams head out (bots first, then the soldiers who fell defending the base; those are evacuated, not revived).
// The recovery trucks for wrecked tanks wait for the end of the invasion in the same way (recovery.js).
//   team.phase: 'out' (walking to the body) → 'load' → 'back' (carrying it home) → done

const MEDIC_SPD = 1.25, MEDIC_LOAD = 70, MEDIC_WAIT = 60 * 1.5, MEDIC_TEAMS = 12;   // 12 teams out at once
// medic teams can be wiped out: zombies (and enemy shots) that reach them hurt them while they fall back.
// At 0 HP both medics fall (their bodies are fetched later like any soldier's), the stretcher drops its casualty
// where it is, and a fresh team goes out for him later.
const MEDIC_HP = 220;
// a team going OUTSIDE the walls (past the river fence) takes an armed escort: ESCORT_N riflemen who walk with the
// stretcher, stand guard around it while the body is loaded and shoot anything that comes close. While an escort
// is still standing the team holds its ground instead of falling back. Escorts can be killed (their bodies are
// fetched later like any soldier's).
const ESCORT_N = 3, ESCORT_RANGE = 150, ESCORT_SPD = 1.6;
const outsideWalls = (x, y) => !inBasePx(x, y) && !inFieldPx(x, y) && !inFarmPx(x, y);
const ESCORT_SLOTS = [[26, -2], [6, -16], [6, 14]];                  // ahead of / beside the stretcher (x flips with facing)
const MEDIC_HOME = { x: (12.5 + OX) * T, y: 23.6 * T };                  // aid station: the base plaza
let MEDICS = [];

// ---- sprites: the line soldier with a white helmet and a red cross; bodies lying on their back ----
const MEDIC_SPR = (() => SOLDIER_SPR.map(src => {
  const c = mk(); c.width = src.width; c.height = src.height; c.pad = src.pad; const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  const pad = src.pad || 0, w = src.width - pad * 2, h = src.height - pad * 2;
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(236,236,228,.9)'; g.fillRect(0, 0, c.width, pad + Math.round(h * 0.15));   // white helmet
  g.globalCompositeOperation = 'source-over';
  const cx = Math.round(src.width / 2), hy = pad + 1, by = pad + Math.round(h * 0.58);
  g.fillStyle = '#d02020';
  g.fillRect(cx - 1, hy - 1, 1, 3); g.fillRect(cx - 2, hy, 3, 1);                                // small cross on the helmet
  g.fillStyle = '#f0f0e8'; g.fillRect(cx - 2, by - 2, 5, 5);                                     // chest patch
  g.fillStyle = '#d02020'; g.fillRect(cx, by - 1, 1, 3); g.fillRect(cx - 1, by, 3, 1);
  return c;
}))();
const lyingCache = {};
function lyingSprite(key, src) {                                   // any standing sprite turned onto its back
  if (lyingCache[key]) return lyingCache[key];
  const c = mk(); c.width = src.height; c.height = src.width; const g = c.getContext('2d');
  g.translate(c.width / 2, c.height / 2); g.rotate(-Math.PI / 2); g.drawImage(src, -src.width / 2, -src.height / 2);
  return (lyingCache[key] = c);
}
const botBodySpr = b => lyingSprite('bot:' + b.cls, HEROES[b.cls].down[0]);

// ---- a bot goes down (called from hurtBot) ----
function botDown(b) {
  b.body = { x: b.x, y: b.y, flip: R() < 0.5 }; b.downT = 0; b.team = null;
  if (Math.hypot(b.x - p.x, b.y - p.y) < 500) msg(inv.state !== 'idle' ? `${b.name} is down! Medics will go out after the invasion.` : `${b.name} is down! Medics are on the way.`, '#ff9090');
}

// walk out of the base along the avenue, then straight to the body (and the same way back)
function medicRoute(tx, ty) {
  const AV = 24.5 * T, route = [];
  if (tx > (23 + OX) * T) route.push({ x: (15 + OX) * T, y: AV }, { x: (24.5 + OX) * T, y: AV }, { x: tx, y: AV });
  else route.push({ x: tx, y: AV });
  route.push({ x: tx, y: ty });
  return route;
}
function sendMedics(kind, who, x, y) {
  const route = medicRoute(x, y);
  const team = { medic: true, kind, who, x: MEDIC_HOME.x, y: MEDIC_HOME.y, w: 30, h: 12, route, path: route.slice(), phase: 'out', loadT: 0, anim: 0, face: 1,
    hp: MEDIC_HP, max: MEDIC_HP, hitT: 0 };
  if (outsideWalls(x, y)) {
    const hp = 90 + p.lvl * 12;
    team.escort = Array.from({ length: ESCORT_N }, (_, i) => ({ i, x: team.x + ri(-8, 8), y: team.y + ri(-8, 8), hp, max: hp, cd: ri(0, 20), aim: 0,
      fireT: 0, flip: false, hurtT: 0, anim: 0, dead: false, gun: SOLDIER_GUNS[i % SOLDIER_GUNS.length] }));
    if (Math.hypot(x - p.x, y - p.y) < 700) msg('A medic team is heading outside the walls with a 3-man escort.', '#ff8080');
  }
  MEDICS.push(team); who.team = team;
  return team;
}

function updateMedics() {
  const calm = inv.state === 'idle';
  // dispatch: fallen bots first, then (after an invasion) the soldiers' bodies near the base
  for (const b of bots) if (b.state === 'dead' && b.body) {
    b.downT++;
    if (!calm) b.calmT = 0; else b.calmT = (b.calmT || 0) + 1;
    if (!b.team && calm && b.downT > MEDIC_WAIT && b.calmT > 60 && MEDICS.length < MEDIC_TEAMS) {
      sendMedics('bot', b, b.body.x + 6, b.body.y + 6);
      msg(`Medic team heading out for ${b.name}.`, '#ff8080');
    }
  }
  const botWaiting = bots.some(b => b.state === 'dead' && b.body && !b.team);   // operatives get the stretchers first
  if (calm && !botWaiting && frame % 30 === 0) for (const c of CORPSES) {
    if (MEDICS.length >= MEDIC_TEAMS) break;
    if (c.team || c.gone || c.x > (60 + OX) * T || c.t < 60 * 5) continue;
    sendMedics('soldier', c, c.x + 6, c.y + 6);
  }
  // move the teams
  for (const m of MEDICS) {
    if (m.hitT > 0) m.hitT--;
    medicDamageTick(m);
    if (m.done) continue;
    if (m.escort) updateEscort(m);
    if (m.phase === 'load') {
      if (--m.loadT <= 0) {
        m.phase = 'back'; m.path = m.route.slice().reverse().slice(1); m.path.push({ x: MEDIC_HOME.x, y: MEDIC_HOME.y });
        if (m.kind === 'soldier') m.who.gone = true;                 // the body is on the stretcher now
      }
      continue;
    }
    const wp = m.path[0];
    if (!wp) {
      if (m.phase === 'out') { m.phase = 'load'; m.loadT = MEDIC_LOAD; }
      else { arriveHome(m); m.done = true; }
      continue;
    }
    const dx = wp.x - m.x, dy = wp.y - m.y, d = Math.hypot(dx, dy), sp = MEDIC_SPD * (m.phase === 'back' ? 0.85 : 1);
    if (d <= sp) { m.x = wp.x; m.y = wp.y; m.path.shift(); }
    else { m.x += dx / d * sp; m.y += dy / d * sp; if (Math.abs(dx) > 0.2) m.face = Math.sign(dx); }
    openGatesNear(m.x, m.y);                                        // the gates open for the stretcher
    m.anim++;
    if (m.phase === 'back' && m.kind === 'bot') { m.who.x = m.x - 6; m.who.y = m.y - 6; }   // the dashboard tracks him on the stretcher
    // zombies that catch a team out in the open make them drop everything and run home
    // (unless their escort is still standing: then the escort fights and the team carries on)
    if (frame % 20 === 0 && !(m.escort && m.escort.some(s => !s.dead)) && enemies.some(e => !e.dead && !e.d.dummy && Math.abs(e.x - m.x) < 26 && Math.abs(e.y - m.y) < 20)) abortTeam(m);
  }
  MEDICS = MEDICS.filter(m => !m.done);
  CORPSES = CORPSES.filter(c => !c.gone);
}
function updateEscort(m) {
  for (const s of m.escort) {
    if (s.dead) continue;
    if (s.fireT > 0) s.fireT--;
    if (s.hurtT > 0) s.hurtT--;
    // keep station: ahead of / beside the stretcher; a ring around it while the body is loaded
    const [ox, oy] = m.phase === 'load' ? [Math.cos(s.i / ESCORT_N * 6.28) * 30, Math.sin(s.i / ESCORT_N * 6.28) * 22] : [ESCORT_SLOTS[s.i % 3][0] * (m.face || 1), ESCORT_SLOTS[s.i % 3][1]];
    const gx = m.x + ox - 6, gy = m.y + oy - 6, dx = gx - s.x, dy = gy - s.y, d = Math.hypot(dx, dy);
    if (d > 1) { const sp = Math.min(d, ESCORT_SPD); s.x += dx / d * sp; s.y += dy / d * sp; s.anim++; if (Math.abs(dx) > 0.3) s.flip = dx < 0; }
    // shoot the nearest threat
    if (--s.cd <= 0) {
      const sx = s.x + 6, sy = s.y + 6; let best = null, bd = ESCORT_RANGE;
      for (const e of enemies) { if (e.dead || e.d.dummy) continue; const dd = Math.hypot(e.x + e.w / 2 - sx, e.y + e.h / 2 - sy); if (dd < bd) { bd = dd; best = e; } }
      if (best) {
        s.aim = Math.atan2(best.y + best.h / 2 - sy, best.x + best.w / 2 - sx); s.flip = Math.cos(s.aim) < 0; s.fireT = 8; s.cd = 22;
        guardShots.push({ x: sx + Math.cos(s.aim) * 10, y: sy + Math.sin(s.aim) * 10, e: best, life: 60, dmg: Math.round(guardDmg('rifle') * 1.3), fx: 'rifle' });
        if (Math.hypot(sx - p.x, sy - p.y) < 200 && R() < 0.5) sfx('rifle');
      } else s.cd = 12;
    }
    // getting hurt
    if (frame % 30 === 0) for (const e of enemies) {
      if (e.dead || e.d.dummy || e.frozen > 0) continue;
      if (Math.abs(e.x + e.w / 2 - s.x - 6) < 8 + e.w / 2 && Math.abs(e.y + e.h / 2 - s.y - 6) < 8 + e.h / 2) {
        const dmg = Math.max(1, Math.round(e.d.atk * (e.d.boss ? 3 : 1) * nightAtk())); s.hp -= dmg; s.hurtT = 12;
        if (Math.hypot(s.x - p.x, s.y - p.y) < 300) float(s.x + 6, s.y - 4, '-' + dmg, '#ff9090');
      }
    }
    if (s.hp <= 0) { s.dead = true; addCorpse(s.x, s.y); burst(s.x + 6, s.y + 6, '#a01818', 10); if (Math.hypot(s.x - p.x, s.y - p.y) < 400) msg('Escort down!', '#ff9090'); }
  }
}
function drawEscort(m, cx, cy) {
  for (const s of m.escort) {
    if (s.dead) continue;
    const x = Math.round(s.x - cx), y = Math.round(s.y - cy), walking = m.phase !== 'load';
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 1, y + 10, 10, 3);
    const spr = SOLDIER_SPR[walking ? Math.floor(s.anim / 8) % 2 : 0], bob = walking ? -(Math.floor(s.anim / 4) % 2) : 0;
    drawSprite(s.hurtT > 0 && s.hurtT % 4 < 2 ? whiteOf(spr) : spr, x - 2, y - 4 + bob, s.flip);
    const aim = s.fireT > 0 ? s.aim : (s.flip ? Math.PI : 0) + 0.4 * (s.flip ? -1 : 1);
    drawWeapon('rifle', x - 2 + (s.flip ? 3 : 13), y - 4 + 12 + bob, aim, false, { name: s.gun, plus: 0 }, s.fireT > 4);
    if (s.hp < s.max) bar(x, y - 8, 12, 2, s.hp / s.max, '#58d858', '#203820');
  }
}
function medicDamageTick(m) {
  if (frame % 30 === 0) for (const e of enemies) {
    if (e.dead || e.d.dummy || e.frozen > 0) continue;
    if (Math.abs(e.x + e.w / 2 - m.x) < 18 + e.w / 2 && Math.abs(e.y + e.h / 2 - m.y) < 10 + e.h / 2) hurtMedics(m, Math.max(1, Math.round(e.d.atk * (e.d.boss ? 3 : 1) * nightAtk())));
  }
  for (const q of eprojs) if (q.life > 0 && Math.abs(q.x - m.x) < 18 && Math.abs(q.y - m.y) < 10) { q.life = 0; hurtMedics(m, Math.round(q.atk)); }
}
function hurtMedics(m, dmg) {
  if (m.done || dmg <= 0) return;
  m.hp -= dmg; m.hitT = 8;
  if (Math.hypot(m.x - p.x, m.y - p.y) < 300) float(m.x, m.y - 18, '-' + dmg, '#ff9090');
  if (m.hp > 0) return;
  if (m.kind !== 'none') abortTeam(m);                                // the casualty is dropped where they fell
  m.done = true;
  for (const ox of [-13, 13]) addCorpse(m.x + ox - 6, m.y - 4);         // both medics fall
  burst(m.x, m.y, '#a01818', 14);
  msg('A medic team has been wiped out!', '#ff7050');
}
function abortTeam(m) {
  if (m.phase === 'back' && m.kind === 'bot') { m.who.body = { x: m.x - 6, y: m.y - 6, flip: false }; }
  else if (m.phase === 'back' && m.kind === 'soldier') { m.who.gone = false; m.who.x = m.x - 6; m.who.y = m.y - 6; CORPSES.push(m.who); }
  m.who.team = null;
  m.kind = 'none'; m.phase = 'back'; m.path = [{ x: MEDIC_HOME.x, y: MEDIC_HOME.y }];
  if (Math.hypot(m.x - p.x, m.y - p.y) < 400) float(m.x, m.y - 18, 'MEDICS FALL BACK!', '#ff9090');
}
function arriveHome(m) {
  if (m.kind !== 'bot') return;
  const b = m.who;
  b.state = 'roam'; b.hp = b.maxHp; b.body = null; b.team = null; b.goal = null; b.hurtT = 60;
  b.x = (10 + ri(0, 6)) * T + 2; b.y = (23 + ri(0, 2)) * T + 2;
  botSay(b, R() < 0.5 ? 'ขอบคุณหมอ! กลับมาลุยต่อ' : 'thanks doc, back in the fight!', 200);
  float(b.x + 6, b.y - 14, 'REVIVED', '#9ad868');
  msg(`${b.name} has been patched up and is back in action.`, '#9ad868');
}

// ---- drawing ----
// bodies of fallen bots, under everyone (called after drawCorpses)
function drawFallenBots(cx, cy) {
  for (const b of bots) {
    if (b.state !== 'dead' || !b.body || (b.team && b.team.phase === 'back')) continue;
    const x = Math.round(b.body.x - cx), y = Math.round(b.body.y - cy);
    if (x < -30 || x > VW + 30 || y < -30 || y > VH + 30) continue;
    ctx.fillStyle = '#6a0c0c'; ctx.fillRect(x - 3, y + 7, 18, 6); ctx.fillRect(x - 1, y + 5, 14, 9);   // blood pool
    const img = botBodySpr(b);
    if (b.body.flip) { ctx.save(); ctx.translate(x + 18, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
    else ctx.drawImage(img, x - 6, y);
    if (Math.floor(frame / 20) % 2) {                                // red-cross marker: "man down, fetch me"
      ctx.fillStyle = '#f0f0e8'; ctx.fillRect(x + 3, y - 12, 7, 7);
      ctx.fillStyle = '#d02020'; ctx.fillRect(x + 5, y - 11, 3, 5); ctx.fillRect(x + 4, y - 10, 5, 3);
    }
    if (Math.hypot(b.body.x - p.x, b.body.y - p.y) < 200) text(`${b.name} KIA`, x + 6, y - 22, '#ff9090', 'center');
  }
}
// a medic team: two stretcher-bearers (y-sorted with the other actors)
function drawMedicTeam(m, cx, cy) {
  if (m.escort) drawEscort(m, cx, cy);
  const x = Math.round(m.x - cx), y = Math.round(m.y - cy), f = Math.floor(m.anim / 10) % 2, still = m.phase === 'load';
  const front = m.face < 0 ? -1 : 1;
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - 18, y + 7, 36, 3);
  const carrying = m.phase === 'back' && m.kind !== 'none';
  const spr = i => { const s = MEDIC_SPR[still ? 0 : (f + i) % 2]; return m.hitT > 0 && m.hitT % 4 < 2 ? whiteOf(s) : s; };
  if (m.hp < m.max) bar(x - 12, y - 18, 24, 2, m.hp / m.max, '#58d858', '#203820');
  drawSprite(spr(1), x - 13 * front - 8, y - 10, m.face < 0);       // rear bearer
  // the stretcher (poles + canvas) and whoever is on it
  ctx.fillStyle = '#3a3a30'; ctx.fillRect(x - 12, y - 1, 24, 1); ctx.fillRect(x - 12, y + 4, 24, 1);
  ctx.fillStyle = '#7a8a52'; ctx.fillRect(x - 10, y, 20, 4);
  if (carrying) {
    const img = m.kind === 'bot' ? botBodySpr(m.who) : (corpseSpr || (corpseSprites(), corpseSpr))[m.who.burnt ? 1 : 0];
    ctx.drawImage(img, x - Math.round(img.width / 2), y - Math.round(img.height / 2) + 1);
  }
  drawSprite(spr(0), x + 13 * front - 8, y - 10, m.face < 0);       // front bearer
  if (still) {
    if (Math.floor(frame / 10) % 2) text('LOADING', x, y - 22, '#ff8080', 'center');
    bar(x - 12, y - 14, 24, 2, 1 - m.loadT / MEDIC_LOAD, '#ff8080', '#401818');
  }
}
