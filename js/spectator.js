// ================= Admin observer (spectator) mode =================
// F2 in game (or V on the title screen) turns the commander into a ghost camera: no body, no controls, nothing
// can hurt you and the zombies stop hunting you. The war plays out on its own while you watch from above:
// bots fight and call in bombers, BTRs patrol and scavenge, the horde hits the wall, tow trucks drag wrecks home.
//
//   WASD / arrows ..... free camera (Shift = fast)        mouse drag ..... pan the camera
//   Tab / E, Q ........ follow next / previous unit        left click ..... follow the unit under the cursor
//   1 base  2 bots  3 vehicles  4 bosses & bombers  5 hot spot (the biggest zombie pack)
//   Space ............. pause / resume the world           - / = .......... sim speed 1x / 2x / 4x
//   I ................. unit info panel on / off           N .............. tactical map (click to jump there)
//   F2 or ` ........... back to playing
//
// How it works: while spectating, the player object `p` is a ghost that rides along with the camera, so
// everything that is "near the player" (sounds, radio messages, enemies waking up, the minimap, the sector
// banner) follows what you are looking at. Damage to the player and enemy targeting skip the ghost.

let spec = null;
const SPEC_ORDER = ['boss', 'air', 'qrf', 'btr', 'tank', 'tow', 'medic', 'bot', 'soldier'];
const SPEC_GROUP = { Digit2: ['bot', 'medic'], Digit3: ['btr', 'qrf', 'tank', 'tow'], Digit4: ['boss', 'air'] };
const SPEC_KIND = { boss: 'BOSS', air: 'AIR STRIKE', qrf: 'QRF', btr: 'BTR-80', tank: 'TANK', tow: 'RECOVERY', medic: 'MEDIC', bot: 'OPERATIVE', soldier: 'SOLDIER' };
const SPEC_COL = { boss: '#ff6cff', air: '#ffb040', qrf: '#60e0ff', btr: '#9ad868', tank: '#c8d870', tow: '#ffb020', medic: '#ff8080', bot: '#60e0ff', soldier: '#d2bc8a' };
const SPEC_SPEEDS = [1, 2, 4];

// every unit worth watching, with its name and what it is doing right now (shared with the dashboard, nexus-bridge.js)
function specUnits() {
  const all = typeof nexusUnits === 'function' ? nexusUnits() : [];
  return all.filter(u => u.kind !== 'player' && SPEC_ORDER.includes(u.kind))
    .sort((a, b) => SPEC_ORDER.indexOf(a.kind) - SPEC_ORDER.indexOf(b.kind));
}
const specTarget = () => spec && spec.follow ? spec.units.find(u => u.id === spec.follow) || null : null;
const specNote = (txt, c = '#c8d870') => { if (spec) { spec.note = txt; spec.noteC = c; spec.noteT = 150; } };
// enemies near the camera stay awake even though the ghost may be far from them
const specNear = e => !!spec && Math.abs(e.x - camx - VW / 2) < VW + 64 && Math.abs(e.y - camy - VH / 2) < VH + 64;

function toggleSpectator(on = !spec) {
  if (on === !!spec) return;
  if (on) {
    if (mode !== 'play' || !inWorld() || warp) { msg('Observer mode works in the main world only.', '#ff9090'); return sfx('no'); }
    if (build.on) toggleBuild();
    spec = { x: p.x + 6, y: p.y + 6, home: { x: p.x, y: p.y }, follow: null, units: specUnits(), paused: false, speed: 1,
      info: true, drag: null, wasAuto: !!p.auto, note: '', noteC: '#fff', noteT: 0 };
    p.auto = false;
    banner = { txt: 'ADMIN OBSERVER', t: 120 };
    msg('Observer mode: you are an invisible camera. Tab follows units, F2 returns to play.', '#60e0ff');
  } else {
    p.x = spec.home.x; p.y = spec.home.y; p.auto = spec.wasAuto;      // back into your own boots
    petObj.x = p.x - 14; petObj.y = p.y + 4;
    camx = clamp(p.x + 6 - VW / 2, 0, MW * T - VW); camy = clamp(p.y + 6 - VH / 2, 0, MH * T - VH);
    spec = null;
    msg('Observer mode off. You have control again.', '#60e0ff');
  }
  sfx('menu');
}

function specCycle(dir, kinds) {
  const list = spec.units.filter(u => !kinds || kinds.includes(u.kind));
  if (!list.length) { specNote(kinds && kinds.includes('boss') ? 'No bosses or bombers right now.' : 'Nothing to follow there.', '#ff9090'); return sfx('no'); }
  let i = list.findIndex(u => u.id === spec.follow);
  i = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
  spec.follow = list[i].id; sfx('menu');
}
// jump to the biggest pack of zombies on the map
function specHotspot() {
  const zs = enemies.filter(e => !e.dead && !e.d.dummy);
  if (!zs.length) { specNote('No zombies anywhere. All quiet.', '#9ad868'); return sfx('no'); }
  let best = null, bn = 0;
  for (const e of zs) {
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    const n = zs.reduce((s, o) => s + (Math.hypot(o.x + o.w / 2 - ex, o.y + o.h / 2 - ey) < 90 ? 1 : 0), 0);
    if (n > bn) { bn = n; best = { x: ex, y: ey }; }
  }
  spec.follow = null; spec.x = best.x; spec.y = best.y;
  specNote(`Hot spot: ${bn} zombies here`, '#ff8060'); sfx('menu');
}
function specInput(code) {
  if (code === 'F2' || code === 'Backquote') return toggleSpectator(false);
  if (code === 'Tab' || code === 'KeyE') return specCycle(1);
  if (code === 'KeyQ') return specCycle(-1);
  if (SPEC_GROUP[code]) return specCycle(1, SPEC_GROUP[code]);
  if (code === 'Digit1') { spec.follow = null; spec.x = BASE_PLAZA.x; spec.y = BASE_PLAZA.y; specNote('FOB Ironvale'); return sfx('menu'); }
  if (code === 'Digit5') return specHotspot();
  if (code === 'Space') { spec.paused = !spec.paused; specNote(spec.paused ? 'World paused' : 'World running', spec.paused ? '#ffd848' : '#9ad868'); return sfx('menu'); }
  if (code === 'Minus' || code === 'NumpadSubtract' || code === 'Equal' || code === 'NumpadAdd') {
    const i = SPEC_SPEEDS.indexOf(spec.speed) + (code === 'Minus' || code === 'NumpadSubtract' ? -1 : 1);
    spec.speed = SPEC_SPEEDS[clamp(i, 0, SPEC_SPEEDS.length - 1)]; specNote(`Sim speed ${spec.speed}x`); return sfx('menu');
  }
  if (code === 'KeyI') { spec.info = !spec.info; return sfx('menu'); }
  if (code === 'KeyU') return toggleUI();                         // hide every observer panel too (ui.js)
  if (code === 'KeyN') { mode = 'map'; return sfx('menu'); }
  if (code === 'KeyH') return openHelp();
  if (code === 'Escape' || code === 'KeyP' || code === 'KeyO') return openSettings('play');
}

// per simulation step (runs `speed` times per frame, so panning is divided by the speed)
function updateSpectator() {
  if (frame % 4 === 0) spec.units = specUnits();
  if (spec.noteT > 0) spec.noteT--;
  let dx = 0, dy = 0;
  if (keys.ArrowLeft || keys.KeyA) dx--;
  if (keys.ArrowRight || keys.KeyD) dx++;
  if (keys.ArrowUp || keys.KeyW) dy--;
  if (keys.ArrowDown || keys.KeyS) dy++;
  if (dx || dy) {
    const s = (keys.ShiftLeft || keys.ShiftRight ? 10 : 4) / spec.speed;
    spec.follow = null; spec.x += dx * s; spec.y += dy * s;
  }
  const u = specTarget();
  if (spec.follow && !u) { spec.follow = null; specNote('Lost track of that unit.', '#ff9090'); }
  if (u) { spec.x += (u.x * T - spec.x) * 0.25; spec.y += (u.y * T - spec.y) * 0.25; }
  spec.x = clamp(spec.x, 0, MW * T); spec.y = clamp(spec.y, 0, MH * T);
  p.x = spec.x - 6; p.y = spec.y - 6;                                // the ghost rides with the camera
  camx += (spec.x - VW / 2 - camx) * 0.2; camy += (spec.y - VH / 2 - camy) * 0.2;
  camx = clamp(camx, 0, MW * T - VW); camy = clamp(camy, 0, MH * T - VH);
}

// ---- mouse: drag to pan, click a unit to follow it, click the big map to jump ----
cv.addEventListener('pointerdown', e => {
  if (!spec) return;
  const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * VW, sy = (e.clientY - r.top) / r.height * VH;
  if (mode === 'map') {                                              // tactical map: click to fly there
    const m = drawMap.last;
    if (m && sx >= m.bx && sx < m.bx + m.bw && sy >= m.by && sy < m.by + m.bh) {
      spec.follow = null; spec.x = (sx - m.dx + m.ox) / m.scale * T; spec.y = (sy - m.dy + m.oy) / m.scale * T;
      camx = clamp(spec.x - VW / 2, 0, MW * T - VW); camy = clamp(spec.y - VH / 2, 0, MH * T - VH);
      mode = 'play'; sfx('menu');
    }
    return;
  }
  if (mode !== 'play' || e.button !== 0) return;
  spec.drag = { sx: e.clientX, sy: e.clientY, x: spec.x, y: spec.y, moved: false, wx: sx + camx, wy: sy + camy };
});
addEventListener('pointermove', e => {
  if (!spec || !spec.drag) return;
  const r = cv.getBoundingClientRect(), k = VW / r.width, dx = (e.clientX - spec.drag.sx) * k, dy = (e.clientY - spec.drag.sy) * k;
  if (Math.abs(dx) + Math.abs(dy) > 4) spec.drag.moved = true;
  if (spec.drag.moved) { spec.follow = null; spec.x = spec.drag.x - dx; spec.y = spec.drag.y - dy; }
});
addEventListener('pointerup', () => {
  if (!spec || !spec.drag) return;
  const d = spec.drag; spec.drag = null;
  if (d.moved) return;
  let best = null, bd = 22;                                          // a click: follow the closest unit to it
  for (const u of spec.units) { const dd = Math.hypot(u.x * T - d.wx, u.y * T - d.wy); if (dd < bd) { bd = dd; best = u; } }
  if (best) { spec.follow = best.id; sfx('menu'); }
});

// ---- HUD ----
function drawSpecHud() {
  const blink = Math.floor(frame / 30) % 2 === 0;
  // header strip
  panel(4, 4, 196, 26, '#60e0ff', 0.88);
  text('ADMIN OBSERVER', 10, 8, '#60e0ff');
  text(blink ? '● LIVE' : '  LIVE', 194, 8, '#ff5050', 'right');
  const ds = dayState();
  text(`${spec.paused ? 'PAUSED' : 'SPEED ' + spec.speed + 'x'}  ·  ${zoneName}`, 10, 18, spec.paused ? '#ffd848' : '#c8c8b0');

  // situation board
  const zs = enemies.filter(e => !e.dead && !e.d.dummy), bosses = zs.filter(e => e.d.boss);
  const allBots = typeof bots !== 'undefined' ? bots : [], up = allBots.filter(b => botAlive(b)).length;
  const veh = [...(typeof TANKS !== 'undefined' ? TANKS : []), ...(typeof BTRS !== 'undefined' ? BTRS : []), ...(typeof QRFS !== 'undefined' ? QRFS : [])];
  const vOk = veh.filter(v => (v.state || 'ok') === 'ok').length;
  const rows = [
    ['ZOMBIES', String(zs.length), zs.length > 60 ? '#ff7050' : '#f0e0b0'],
    ['BOSSES', String(bosses.length), bosses.length ? '#ff6cff' : '#8a8a70'],
    ['OPERATIVES', `${up}/${allBots.length}`, up < allBots.length ? '#ffb040' : '#9ad868'],
    ['VEHICLES', `${vOk}/${veh.length}`, vOk < veh.length ? '#ffb040' : '#9ad868'],
    ['SOLDIERS', String(typeof SOLDIERS !== 'undefined' ? SOLDIERS.length : 0), '#d2bc8a'],
    ['STRUCTURES', String(typeof BUILDS !== 'undefined' ? BUILDS.length : 0), '#c0c8d8'],
    ['INVASION', inv.state === 'idle' ? `IN ${Math.ceil(inv.cd / 60)}s` : `WAVE ${inv.wave}`, inv.state === 'idle' ? '#9ad868' : '#ff5050'],
    ['TIME', ds.lbl + (nightK() > 0.3 ? ' · FRENZY' : ''), nightK() > 0.3 ? '#ff6060' : ds.col],
  ];
  panel(4, 32, 128, rows.length * 10 + 8, DIM, 0.82);
  rows.forEach(([k, v, c], i) => { text(k, 9, 36 + i * 10, '#9a9a78'); text(v, 127, 36 + i * 10, c, 'right'); });

  // minimap with the camera frame on it
  panel(VW - 88, 4, 84, 54, '#60e0ff', 0.9);
  drawMap(VW - 86, 6, 80, 50, 1);
  drawRadarOverlay(VW - 86, 6, 80, 50);

  // the unit being followed: bracket in the world + an info card
  const u = specTarget();
  if (u) {
    const x = Math.round(u.x * T - camx), y = Math.round(u.y * T - camy), r = u.kind === 'boss' ? 26 : u.kind === 'bot' || u.kind === 'soldier' ? 12 : 22, c = SPEC_COL[u.kind] || '#fff';
    ctx.fillStyle = c;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.fillRect(x + sx * r - (sx > 0 ? 5 : 0), y + sy * r - (sy > 0 ? 1 : 0), 6, 1);
      ctx.fillRect(x + sx * r - (sx > 0 ? 0 : 0), y + sy * r - (sy > 0 ? 5 : 0), 1, 6);
    }
    text(u.name, x, y - r - 11, c, 'center');
    if (spec.info) {
      const w = Math.min(VW - 8, Math.max(150, textW(u.act) + 16)), bx = Math.round(VW / 2 - w / 2), by = VH - 62;
      panel(bx, by, w, 46, c, 0.88);
      text(`${SPEC_KIND[u.kind] || u.kind}  ·  ${u.name}`, bx + 6, by + 4, c);
      text(u.act, bx + 6, by + 15, '#f0e0b0');
      if (u.max > 1) bar(bx + 6, by + 28, 90, 5, u.hp / u.max, u.hp / u.max < 0.3 ? '#ff3030' : '#58c858', '#1c2414');
      const extra = [u.zone, u.squad !== undefined ? (settings.lang === 'th' ? 'กำลังพล ' : 'SQUAD ') + u.squad : '', u.cargo || ''].filter(Boolean).join('  ·  ');
      text(extra, bx + 6, by + 35, '#9a9a78');
    }
  }

  // follow list (right side): what is out there right now
  if (spec.info) {
    const list = spec.units.filter(v => v.kind !== 'soldier').slice(0, 12), lx = VW - 150, ly = 62;
    if (list.length) {
      panel(lx, ly, 146, list.length * 10 + 16, DIM, 0.75);
      text('UNITS  [TAB]', lx + 6, ly + 4, GOLD);
      list.forEach((v, i) => {
        const sel = v.id === spec.follow;
        if (sel) { ctx.fillStyle = 'rgba(96,224,255,.18)'; ctx.fillRect(lx + 2, ly + 13 + i * 10, 142, 10); }
        ctx.fillStyle = SPEC_COL[v.kind] || '#fff'; ctx.fillRect(lx + 6, ly + 16 + i * 10, 4, 4);
        let nm = tr(v.name);                                           // keep long names clear of the HP column
        while (nm.length > 4 && textW(nm) > 100) nm = nm.slice(0, -2);
        text(nm === tr(v.name) ? nm : nm + '…', lx + 14, ly + 14 + i * 10, sel ? '#fff' : '#c8c8b0');
        if (v.max > 1) text(`${Math.round(v.hp / v.max * 100)}%`, lx + 141, ly + 14 + i * 10, v.hp / v.max < 0.3 ? '#ff6060' : '#9a9a78', 'right');
      });
    }
  }

  if (spec.noteT > 0) { ctx.globalAlpha = Math.min(1, spec.noteT / 30); text(spec.note, VW / 2, 36, spec.noteC, 'center'); ctx.globalAlpha = 1; }
  if (spec.paused && blink) text('PAUSED', VW / 2, VH / 2 - 30, '#ffd848', 'center', BIG);
  text('TAB/Q:UNITS  1-5:JUMP  SPC:PAUSE  -/=:SPEED  N:MAP  U:HIDE UI  F2:EXIT', VW / 2, VH - 11, '#9a9a78', 'center');
}
