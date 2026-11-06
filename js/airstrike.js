// ================= Airstrikes: the bots call in the bombers =================
// The bots (the other "players") act as forward observers. When one of them sees a boss, or a dense pack of
// zombies (6+ bunched together) within ~16 tiles, it pops red smoke on the spot and radios for air support.
// Two seconds later a heavy bomber roars across the screen along the target's row and carpet-bombs a
// 200 px strip: 9 bombs, each a big blast (260 + 28 x player level damage, full in the middle of the blast).
// Bombs never hit the base, the farm, friendly troops or vehicles. One strike in the air at a time, ~35 s
// between strikes, and each bot can only call one every 90 s.

const AIR_CD = 60 * 35, AIR_BOT_CD = 60 * 90, AIR_MARK = 120, AIR_SPD = 5.5, AIR_BOMBS = 9, AIR_SPAN = 200, AIR_R = 38, AIR_SCAN = 260;
let STRIKES = [], airCD = 60 * 20;
const airDmg = () => 260 + p.lvl * 28;

// ---- B-52 style bomber, top-down, nose to the right (64x48) ----
const BOMBER = dimensional(sculpt(64, 48, P => {
  const G = ['#9aa2ac', '#6e767f', '#464c54'];
  const wing = (rootX, y0, dir, span, chord, sweep) => {             // swept wing, drawn row by row out to the tip
    for (let k = 1; k <= span; k++) {
      const lead = Math.round(rootX - k * sweep), w = Math.max(2, Math.round(chord - k * chord / (span + 4)));
      const y = y0 + dir * k;
      P.rect(lead - w, y, w, 1, k === span ? G[0] : G[1]); P.px(lead - 1, y, G[0]);
    }
  };
  wing(40, 21, -1, 19, 11, 0.85); wing(40, 26, 1, 19, 11, 0.85);    // main wings
  wing(13, 21, -1, 8, 6, 0.6); wing(13, 26, 1, 8, 6, 0.6);           // tailplanes
  for (const [k, dir] of [[6, -1], [12, -1], [6, 1], [12, 1]]) {     // four engine pods
    const x = Math.round(40 - k * 0.85) - 9, y = (dir < 0 ? 21 : 26) + dir * k;
    P.rect(x - 2, y - 1, 6, 3, G[2]); P.px(x + 3, y, '#202428');
  }
  P.rect(6, 21, 54, 6, G[1]); P.rect(6, 21, 54, 1, G[0]); P.rect(6, 26, 54, 1, G[2]);   // fuselage
  P.rect(60, 22, 3, 4, G[1]); P.px(63, 23, G[0]); P.px(63, 24, G[1]);                    // nose
  P.rect(54, 22, 4, 2, '#a8d0e8'); P.px(55, 22, '#e0f4ff');                               // cockpit glass
  P.rect(4, 23, 8, 2, G[2]);                                                              // tail fin from above
  P.px(26, 7, '#e8e8e8'); P.px(25, 8, '#e8e8e8'); P.px(26, 8, '#3050a0'); P.px(27, 8, '#e8e8e8'); P.px(26, 9, '#e8e8e8');   // roundel
  P.px(26, 40, '#e8e8e8'); P.px(25, 39, '#e8e8e8'); P.px(26, 39, '#3050a0'); P.px(27, 39, '#e8e8e8'); P.px(26, 38, '#e8e8e8');
}));
const BOMBER_SHADOW = (() => {
  const c = mk(); c.width = BOMBER.width; c.height = BOMBER.height; const g = c.getContext('2d');
  g.drawImage(BOMBER, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(0, 0, c.width, c.height);
  return c;
})();

// ---- calling a strike ----
const AIR_LINES = ['Air support inbound!', 'Danger close! Bombs away!', 'ขอการโจมตีทางอากาศ!', 'เครื่องบินมาแล้ว หลบไป!'];
function callAirstrike(caller, tx, ty, boss) {
  STRIKES.push({ caller, x: tx, y: ty, phase: 'mark', t: AIR_MARK, px: tx - 560, bombs: [], next: 0, boss: boss ? boss.d.name : null });
  airCD = AIR_CD; caller.airCD = AIR_BOT_CD;
  botSay(caller, AIR_LINES[ri(0, AIR_LINES.length - 1)], 200);
  msg(boss ? `${caller.name} called in an airstrike on ${boss.d.name}!` : `${caller.name} called in an airstrike on a zombie horde!`, '#ffb040');
}
const noBombZone = (x, y) => inBasePx(x, y) || (typeof inFarmPx === 'function' && inFarmPx(x, y));
// every half second: does any bot see something worth a bomber run?
function scanForAirstrike() {
  if (airCD > 0 || STRIKES.length || typeof bots === 'undefined') return;
  for (const b of bots) {
    if (!botAlive(b) || (b.airCD || 0) > 0) continue;
    const bx = b.x + 6, by = b.y + 6;
    const seen = enemies.filter(e => !e.dead && !e.d.dummy && Math.hypot(e.x + e.w / 2 - bx, e.y + e.h / 2 - by) < AIR_SCAN && !noBombZone(e.x + e.w / 2, e.y + e.h / 2));
    const boss = seen.find(e => e.d.boss);
    if (boss) return callAirstrike(b, boss.x + boss.w / 2, boss.y + boss.h / 2, boss);
    let best = null, bestN = 5;
    for (const e of seen) {
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2, pack = seen.filter(o => Math.hypot(o.x + o.w / 2 - ex, o.y + o.h / 2 - ey) < 70);
      if (pack.length > bestN) { bestN = pack.length; best = pack; }
    }
    if (best) {
      const cx = best.reduce((s, e) => s + e.x + e.w / 2, 0) / best.length, cy = best.reduce((s, e) => s + e.y + e.h / 2, 0) / best.length;
      return callAirstrike(b, cx, cy, null);
    }
  }
}

// ---- one bomb going off ----
function bombBlast(x, y) {
  const chunks = [], tongues = [];
  for (let i = 0; i < 22; i++) {
    const a = R() * 6.28, d = R() * 12;
    chunks.push({ dx: Math.cos(a) * d * 1.3, dy: Math.sin(a) * d * 0.8 - R() * 5, s: 3 + ri(0, 5), vx: Math.cos(a) * (0.4 + R()), vy: Math.sin(a) * 0.6 - 0.5 - R() * 0.5, hot: R() });
  }
  for (let i = 0; i < 6; i++) tongues.push({ a: -Math.PI / 2 + (R() - 0.5) * 3.4, len: 12 + ri(0, 14), w: 2 + ri(0, 2) });
  tankFx.push({ kind: 'boom', x, y, t: 28, max: 28, chunks, tongues });
  for (let i = 0; i < 10; i++) {
    const a = R() * 6.28, sp = 0.3 + R() * 1.2;
    tankFx.push({ kind: 'smoke', x: x + Math.cos(a) * 5, y: y + Math.sin(a) * 5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 0.45, r: 4 + R() * 3, t: 50 + ri(0, 30), max: 80, c: R() < 0.5 ? '#4a4642' : '#6a645c' });
  }
  burst(x, y, '#ff8020', 18); burst(x, y, '#3a3430', 10);
  rings.push({ x, y, r: 6, max: AIR_R + 8, c: '#ffb040', t: 14 });
  const near = Math.hypot(x - p.x, y - p.y);
  if (near < 400) { sfx('boom'); addShake(near < 150 ? 5 : 2); }
  for (const e of enemies) {
    if (e.dead || e.d.dummy) continue;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2, d = Math.hypot(ex - x, ey - y), reach = AIR_R + Math.max(e.w, e.h) / 2;
    if (d > reach) continue;
    const dmg = Math.max(1, Math.round(airDmg() * (d < reach * 0.5 ? 1 : 0.6) * nightTaken(e)) - e.d.def);
    e.hp -= dmg; e.flash = 6; e.kx = (ex - x) / (d || 1) * 3; e.ky = (ey - y) / (d || 1) * 3; e.stun = e.d.boss ? 4 : 14;
    float(ex, e.y - 2, String(dmg), '#ffb040');
    if (e.hp <= 0) { if (e.d.boss) killEnemy(e); else { e.dead = true; burst(ex, ey, '#a01818', 10); } }
  }
}

// ---- per-frame update (from updateTanks, overworld only) ----
function updateAirstrikes() {
  if (airCD > 0) airCD--;
  if (typeof bots !== 'undefined') for (const b of bots) if (b.airCD > 0) b.airCD--;
  if (frame % 30 === 0) scanForAirstrike();
  for (const s of STRIKES) {
    if (s.phase === 'mark') {                                          // red smoke on the target
      if (frame % 2 === 0) parts.push({ x: s.x + ri(-4, 4), y: s.y + ri(-2, 2), vx: (R() - 0.5) * 0.5, vy: -0.6 - R() * 0.6, t: 26, c: R() < 0.5 ? '#ff4030' : '#ff9080' });
      if (--s.t <= 0) {
        s.phase = 'run';
        if (Math.hypot(s.x - p.x, s.y - p.y) < 600) { noise(1.8, 0.12); tone(70, 2, 'sawtooth', 0.1, 40); }
      }
    } else if (s.phase === 'run') {                                    // the bomber crosses and drops a stick of bombs
      s.px += AIR_SPD;
      const start = s.x - AIR_SPAN / 2, step = AIR_SPAN / (AIR_BOMBS - 1);
      while (s.next < AIR_BOMBS && s.px >= start + s.next * step) {
        const bx = start + s.next * step, by = s.y + ri(-12, 12);
        if (!noBombZone(bx, by)) s.bombs.push({ x: bx, y: by, alt: 40 });
        s.next++;
      }
      if (s.px > s.x + 600) s.phase = 'out';
    }
    for (const b of s.bombs) if ((b.alt -= 1.4) <= 0 && !b.done) { b.done = true; bombBlast(b.x, b.y); }
    s.bombs = s.bombs.filter(b => !b.done);
  }
  STRIKES = STRIKES.filter(s => s.phase !== 'out' || s.bombs.length);
}

// ---- drawing (after the tank shells, above the ground) ----
function drawAirstrikes(cx, cy) {
  for (const s of STRIKES) {
    if (s.phase === 'mark' && Math.floor(frame / 8) % 2) { ctx.fillStyle = '#ff3020'; ctx.fillRect(Math.round(s.x - cx) - 1, Math.round(s.y - cy) - 1, 3, 3); }
    for (const b of s.bombs) {                                        // falling bombs with their shadows
      const x = Math.round(b.x - cx), y = Math.round(b.y - cy), k = 1 - b.alt / 40;
      ctx.fillStyle = `rgba(0,0,0,${0.15 + k * 0.3})`; ctx.fillRect(x - 2 - Math.round(k * 2), y, 4 + Math.round(k * 4), 2);
      ctx.fillStyle = '#1c1e22'; ctx.fillRect(x - 1, y - Math.round(b.alt) - 3, 3, 5);
      ctx.fillStyle = '#5a5e66'; ctx.fillRect(x - 1, y - Math.round(b.alt) - 3, 1, 4);
      ctx.fillStyle = '#2a2c30'; ctx.fillRect(x - 2, y - Math.round(b.alt) - 4, 5, 1);
    }
    if (s.phase === 'run') {
      const x = Math.round(s.px - cx), y = Math.round(s.y - cy);
      if (x > -90 && x < VW + 90) {
        ctx.drawImage(BOMBER_SHADOW, x - 32 + 18, y - 24 + 22);
        ctx.drawImage(BOMBER, x - 32, y - 24 - 40);
        if (frame % 3 === 0) for (const oy of [-12, -6, 6, 12]) parts.push({ x: s.px - 34, y: s.y - 40 + oy, vx: -1, vy: 0, t: 16, c: 'rgba(230,230,230,.5)' });   // contrails
      }
    }
  }
}
