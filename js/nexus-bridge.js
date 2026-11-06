// =====================================================================
// NEXUS REAL-TIME GAME BRIDGE (การเชื่อมต่อระบบเกมกับ Dashboard)
// =====================================================================
// เชื่อมโยงระหว่าง OPERATION: BIOHAZARD (rpg.html) และ Dashboard (dashboard.html)
// รองรับทั้งการเล่นใน Modal iframe และการเปิดแยกแท็บ/หน้าต่าง (BroadcastChannel)

(() => {
  const CHANNEL_NAME = 'nexus_game_bus';
  let bus = null;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bus = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch (e) {
    console.warn('[NEXUS BRIDGE] BroadcastChannel not supported, falling back to postMessage.');
  }

  // ส่งข้อมูลไปยัง Dashboard (ทั้งทาง BroadcastChannel และ window.parent)
  function sendToDashboard(type, payload = {}) {
    const packet = {
      source: 'BIOHAZARD_GAME',
      type,
      timestamp: Date.now(),
      payload
    };

    // 1. BroadcastChannel (ข้ามแท็บและหน้าต่าง)
    if (bus) {
      try { bus.postMessage(packet); } catch (e) {}
    }

    // 2. window.parent (กรณีเปิดใน Modal iframe ภายใน Dashboard)
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage(packet, '*'); } catch (e) {}
    }
  }

  // รวบรวมข้อมูล Telemetry สดของตัวละครและสถานะเกม
  function getGameTelemetry() {
    if (typeof p === 'undefined' || !p) {
      return {
        active: false,
        mode: typeof mode !== 'undefined' ? mode : 'loading'
      };
    }

    const currentZone = typeof zoneName !== 'undefined' ? zoneName : (typeof zoneAt === 'function' ? zoneAt(p.x) : 'Unknown');
    const invasion = typeof inv !== 'undefined' && inv.state !== 'idle'
      ? { active: true, wave: inv.wave, mobs: (typeof hordeAlive === 'function' ? hordeAlive() : []).concat(inv.queue || []), maxWaves: typeof INV_WAVES !== 'undefined' ? INV_WAVES : 3 } : null;
    const curMaxHp = typeof maxHp === 'function' ? maxHp() : 100;
    const curMaxMp = typeof maxMp === 'function' ? maxMp() : 50;
    const curAmmo = typeof p.ammo === 'number' ? p.ammo : 30;
    const curMaxAmmo = typeof maxAmmo === 'function' ? maxAmmo(p.weapon) : 30;

    return {
      active: true,
      mode: typeof mode !== 'undefined' ? mode : 'play',
      cls: p.cls,
      lvl: p.lvl,
      xp: p.xp,
      gold: p.gold,
      hp: p.hp,
      maxHp: curMaxHp,
      mp: p.mp,
      maxMp: curMaxMp,
      potions: p.potions,
      sp: p.sp || 0,
      kills: p.kills || {},
      weapon: p.weapon,
      armor: p.armor,
      helm: p.helm,
      boots: p.boots,
      title: p.title || 'Operative',
      zone: currentZone,
      x: Math.round(p.x),
      y: Math.round(p.y),
      ammo: curAmmo,
      maxAmmo: curMaxAmmo,
      bestWave: p.bestWave || 0,
      godMode: !!p.godMode,
      scrap: p.scrap || 0,
      spectator: typeof spec !== 'undefined' && spec ? { follow: spec.follow, paused: spec.paused, speed: spec.speed } : null,
      base: getBaseTelemetry(),
      map: getMapMarkers(),
      situation: getSituation(),
      night: typeof nightK === 'function' ? Math.round(nightK() * 100) / 100 : 0,
      invasion: invasion ? {
        active: invasion.active,
        wave: invasion.wave,
        left: (invasion.mobs && invasion.mobs.length) || 0,
        maxWave: invasion.maxWaves || 3
      } : null,
      // the dashboard's invasion control panel: always present
      raid: typeof inv !== 'undefined' ? {
        state: inv.state, inWorld: typeof inWorld === 'function' ? inWorld() : false,
        warnIn: inv.state === 'warn' ? Math.ceil(inv.t / 60) : 0, wave: inv.wave, maxWave: typeof INV_WAVES !== 'undefined' ? INV_WAVES : 3,
        left: inv.state === 'idle' ? 0 : ((typeof hordeAlive === 'function' ? hordeAlive().length : 0) + (inv.queue ? inv.queue.length : 0)),
        bosses: typeof enemies !== 'undefined' ? enemies.filter(e => e.invBoss && !e.dead).length : 0,
        soldiers: typeof SOLDIERS !== 'undefined' ? SOLDIERS.filter(s => s.state !== 'down' && s.state !== 'return').length : 0,
        nextIn: inv.state === 'idle' && inv.cd < 1e8 ? Math.ceil(inv.cd / 60) : null
      } : null
    };
  }

  // สถานะฐานทัพ: สิ่งปลูกสร้าง รถถัง รถ BTR ลาดตระเวน รถลาก และศพ (build.js / tank.js / recovery.js / patrol.js)
  function getBaseTelemetry() {
    const counts = {};
    if (typeof BUILDS !== 'undefined') for (const b of BUILDS) counts[b.id] = (counts[b.id] || 0) + 1;
    const veh = t => ({ name: t.label || t.name || 'M1A1 ABRAMS', state: t.state || 'ok', hp: Math.round(t.hp ?? 0), max: t.max || 1,
      tow: t.truck ? t.truck.phase : null });
    return {
      structures: { total: typeof BUILDS !== 'undefined' ? BUILDS.length : 0, max: typeof BUILD_MAX !== 'undefined' ? BUILD_MAX : 80, counts },
      tanks: typeof TANKS !== 'undefined' ? TANKS.map(veh) : [],
      btrs: typeof BTRS !== 'undefined' ? BTRS.map(b => Object.assign(veh(b), {
        call: b.call, patrol: b.patrol, nextIn: b.patrol === 'garage' ? Math.ceil(b.patrolT / 60) : 0,
        squad: b.squad.filter(s => s.state !== 'down').length,
        cargo: b.cargo ? { scrap: b.cargo.scrap, gold: b.cargo.gold, items: b.cargo.items.length + b.cargo.potions } : null })) : [],
      qrf: typeof QRFS !== 'undefined' ? QRFS.map(q => Object.assign(veh(q), { mission: q.mission, target: q.target ? q.target.call : null, squad: q.squad.filter(s => s.state !== 'down').length })) : [],
      qrfReadyIn: typeof qrfCD !== 'undefined' ? Math.ceil(qrfCD / 60) : 0,
      towTrucks: typeof TOW_TRUCKS !== 'undefined' ? TOW_TRUCKS.length : 0,
      corpses: typeof CORPSES !== 'undefined' ? CORPSES.length : 0,
    };
  }

  // ภาพแผนที่โลกทั้งใบ (วาดจาก tile จริง 4px ต่อช่อง) + ป้ายชื่อโซน — ส่งครั้งเดียวเมื่อ Dashboard ขอ
  function getWorldMapImage() {
    if (typeof world === 'undefined' || typeof TILES === 'undefined') return null;
    const S = 4, c = document.createElement('canvas'); c.width = WW * S; c.height = WH * S;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
      const arr = TILES[world[y][x]];
      if (arr) g.drawImage(arr[(typeof tileHash === 'function' ? tileHash(x, y) : 0) % arr.length], x * S, y * S, S, S);
    }
    const labels = (typeof ZONES !== 'undefined' ? ZONES : []).map(z => ({ name: z.name, x: (z.x0 + z.x1) / 2, y: ((z.y0 ?? 2) + (z.y1 ?? 47)) / 2 }));
    labels.push({ name: 'FOB Ironvale (Base)', x: 13 + OX, y: 20 }, { name: 'FOB West Wing', x: 28, y: 30 }, { name: 'Survivor Farm', x: 21 + OX, y: 70 }, { name: 'Outer Yard', x: 34 + OX, y: 14 });
    return { w: WW, h: WH, scale: S, png: c.toDataURL('image/png'), labels };
  }
  // ตำแหน่งสดบนแผนที่ (หน่วยเป็นช่อง tile) — เฉพาะตอนอยู่ในโลกหลัก
  function getMapMarkers() {
    if (typeof inWorld !== 'function' || !inWorld()) return { inWorld: false };
    const r1 = v => Math.round(v / (typeof T !== 'undefined' ? T : 16) * 10) / 10;
    const at = o => [r1(o.x + (o.w || 12) / 2), r1(o.y + (o.h || 12) / 2)];
    const live = typeof enemies !== 'undefined' ? enemies.filter(e => !e.dead && !e.d.dummy) : [];
    return {
      inWorld: true,
      player: at(p),
      enemies: live.filter(e => !e.d.boss).slice(0, 400).map(e => [...at(e), e.horde ? 1 : 0]),
      bosses: live.filter(e => e.d.boss).map(e => [...at(e), e.d.name]),
      tanks: (typeof TANKS !== 'undefined' ? TANKS : []).map(t => [...at(t), t.state || 'ok']),
      btrs: [...(typeof BTRS !== 'undefined' ? BTRS : []), ...(typeof QRFS !== 'undefined' ? QRFS : [])].map(b => [...at(b), b.call, b.state, b.patrol]),
      tow: (typeof TOW_TRUCKS !== 'undefined' ? TOW_TRUCKS : []).map(k => [r1(k.x), r1(k.y)]),
      builds: (typeof BUILDS !== 'undefined' ? BUILDS : []).map(b => [b.tx, b.ty, b.id]),
      bots: (typeof bots !== 'undefined' ? bots : []).filter(b => b.state !== 'dead').map(b => at(b)),
      soldiers: [...(typeof SOLDIERS !== 'undefined' ? SOLDIERS : []), ...(typeof patrolMenInView === 'function' ? patrolMenInView() : [])].filter(s => s.state !== 'down').map(s => at(s)),
    };
  }

  // =====================================================================
  // ภาพสถานการณ์สด (Situation Picture): ทุกหน่วยในสนามรบ ทำอะไรอยู่ ที่ไหน + บันทึกเหตุการณ์
  // =====================================================================
  const TT = () => (typeof T !== 'undefined' ? T : 16);
  const tile = v => Math.round(v / TT() * 10) / 10;
  const zoneOf = (x, y) => { try { return typeof zoneAt === 'function' ? zoneAt(x, y) : ''; } catch (e) { return ''; } };
  const trTxt = s => (typeof tr === 'function' ? tr(s) : s);
  const nameOf = e => (typeof trName === 'function' ? trName(e.d.name) : e.d.name);
  let uidSeq = 0;
  const uidOf = o => o.__uid || (o.__uid = ++uidSeq);
  const VEH_TH = { ok: 'พร้อมรบ', wrecked: 'ถูกทำลาย', towing: 'กำลังถูกลาก', repair: 'กำลังซ่อมที่โรงซ่อม', return: 'ขับกลับประจำจุด' };
  const PATROL_TH = { garage: 'จอดในโรงรถ', out: 'กำลังลาดตระเวน', stop: 'หยุดเคลียร์พื้นที่และเก็บของ', hold: 'ตั้งรับ รอกำลังเสริม', regroup: 'ทหารกำลังขึ้นรถ', lost: 'เสียหาย' };
  const QRF_TH = { go: 'กำลังรุดไปช่วย', fight: 'ลงรถเสริมกำลังและรบ', board: 'ทหารกำลังขึ้นรถ', home: 'กำลังกลับฐาน', lost: 'ถูกทำลาย' };
  const TOW_TH = { out: 'กำลังวิ่งไปหาซาก', hook: 'กำลังเกี่ยวสลิง', drag: 'กำลังลากกลับโรงซ่อม' };
  const SOL_TH = { move: 'วิ่งไปจุดตั้งรับ', deploy: 'วางกระสอบทราย', hold: 'ตั้งรับยิงสกัดฝูงซอมบี้', down: 'บาดเจ็บสาหัส', return: 'ถอนกลับฐาน' };

  function nearestFoe(x, y, r) {
    let best = null, bd = r;
    if (typeof enemies === 'undefined') return null;
    for (const e of enemies) { if (e.dead || e.d.dummy) continue; const d = Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  function playerActivity() {
    if (typeof mode !== 'undefined' && mode === 'dead') return 'เสียชีวิต รอเกิดใหม่';
    if (typeof build !== 'undefined' && build.on) return 'กำลังสร้างฐาน';
    if (typeof warp !== 'undefined' && warp) return 'กำลังเดินทางผ่านด่านตรวจ';
    const foe = nearestFoe(p.x + 6, p.y + 6, 140);
    const fighting = foe && (p.atkT > 0 || (p.target && !p.target.dead));
    if (p.auto) return fighting ? `ออโต้ฟาร์ม: กำลังยิง ${nameOf(foe)}` : 'ออโต้ฟาร์ม: กำลังหาเป้าหมาย';
    if (fighting) return `กำลังยิง ${nameOf(foe)}`;
    if (typeof inSafeZone === 'function' && inSafeZone()) return 'พักในเขตปลอดภัย';
    if (typeof mode !== 'undefined' && mode !== 'play') return 'เปิดเมนูอยู่';
    return foe ? `มีศัตรูใกล้ตัว (${nameOf(foe)})` : 'ลาดตระเวน / เดินทาง';
  }
  // every named unit: { id, kind, name, x, y (tiles), zone, act, hp, max }
  function getUnits() {
    const out = [], add = (id, kind, name, o, act, hp, max, extra) => {
      const cx = o.x + (o.w || 12) / 2, cy = o.y + (o.h || 12) / 2;
      out.push(Object.assign({ id, kind, name, x: tile(cx), y: tile(cy), zone: trTxt(zoneOf(cx, cy)), act, hp: Math.round(hp ?? 0), max: Math.round(max || 1) }, extra || {}));
    };
    if (typeof spec === 'undefined' || !spec) add('player', 'player', `คุณ (LV${p.lvl})`, p, playerActivity(), p.hp, typeof maxHp === 'function' ? maxHp() : p.hp);
    else add('player', 'player', 'กล้องแอดมิน (ผู้สังเกตการณ์)', p, spec.follow ? 'กำลังติดตามหน่วย' : 'มองจากมุมสูง', 1, 1);
    if (typeof bots !== 'undefined') for (const b of bots) {
      const act = b.state === 'dead' ? (b.team ? (b.team.phase === 'back' ? 'หน่วยแพทย์กำลังหามกลับฐาน' : 'หน่วยแพทย์กำลังไปรับร่าง')
          : `ล้มในการรบ — ${typeof inv !== 'undefined' && inv.state !== 'idle' ? 'รอหน่วยแพทย์หลังจบการบุก' : 'รอหน่วยแพทย์'}`)
        : b.target && !b.target.dead ? `กำลังสู้กับ ${nameOf(b.target)}` : 'ลาดตระเวนทุ่งหญ้า';
      add('bot:' + b.name, 'bot', `${b.name} (LV${b.lvl})`, b, act, b.hp, b.maxHp);
    }
    const veh = (t, kind, name) => {
      let act = VEH_TH[t.state] || t.state;
      if (t.state === 'ok' && t.tgt && !t.tgt.dead) act = `ยิงปืนใหญ่ใส่ ${nameOf(t.tgt)}`;
      return act;
    };
    if (typeof TANKS !== 'undefined') TANKS.forEach((t, i) => add('tank:' + i, 'tank', `M1A1 Abrams #${i + 1}`, t, veh(t), t.hp, t.max));
    if (typeof BTRS !== 'undefined') for (const b of BTRS) {
      let act = b.state === 'ok' ? (PATROL_TH[b.patrol] || b.patrol) : veh(b);
      if (b.state === 'ok' && b.patrol === 'garage') act += ` (ออกอีก ${Math.ceil(b.patrolT / 60)} วิ)`;
      const men = b.squad.filter(s => s.state !== 'down').length;
      add('btr:' + b.call, 'btr', b.label, b, act, b.hp, b.max, { squad: men, cargo: b.cargo ? `${b.cargo.scrap} เศษเหล็ก · ${b.cargo.gold}G · ${b.cargo.items.length + b.cargo.potions} ชิ้น` : '' });
    }
    if (typeof QRFS !== 'undefined') for (const q of QRFS)
      add('qrf', 'qrf', q.label, q, q.state === 'ok' ? `${QRF_TH[q.mission] || q.mission} → ${q.target ? q.target.label : ''}` : veh(q), q.hp, q.max, { squad: q.squad.filter(s => s.state !== 'down').length });
    if (typeof TOW_TRUCKS !== 'undefined') for (const k of TOW_TRUCKS)
      add('tow:' + uidOf(k), 'tow', 'รถกู้ภัย M984', { x: k.x - 17, y: k.y - 7, w: 34, h: 14 }, `${TOW_TH[k.phase] || k.phase}: ${k.tank.label || 'M1A1 Abrams'}`, 1, 1);
    if (typeof MEDICS !== 'undefined') for (const m of MEDICS) {
      const who = m.kind === 'bot' ? m.who.name : m.kind === 'soldier' ? 'ร่างทหาร' : '';
      const act = m.kind === 'none' ? 'ถอยกลับฐาน (ซอมบี้ขวาง)' : m.phase === 'out' ? `ไปรับ ${who}` : m.phase === 'load' ? `กำลังยก ${who} ขึ้นเปล` : `หาม ${who} กลับฐาน`;
      add('medic:' + uidOf(m), 'medic', 'หน่วยแพทย์สนาม', { x: m.x - 15, y: m.y - 6, w: 30, h: 12 }, act, 1, 1);
    }
    if (typeof SOLDIERS !== 'undefined') SOLDIERS.forEach((s, i) => add('sol:' + uidOf(s), 'soldier', `ทหารประจำแนว #${i + 1}`, s, SOL_TH[s.state] || s.state, s.hp, s.maxHp));
    if (typeof STRIKES !== 'undefined') for (const s of STRIKES) {
      const who = s.caller ? s.caller.name : 'บอท', what = s.boss ? (typeof trName === 'function' ? trName(s.boss) : s.boss) : 'ฝูงซอมบี้';
      const act = s.phase === 'mark' ? `${who} ยิงพลุควันแดงชี้เป้า: ${what} — เครื่องบินกำลังมา` : s.phase === 'run' ? `กำลังทิ้งระเบิดปูพรมใส่ ${what} (ขอโดย ${who})` : 'ระเบิดลูกสุดท้ายกำลังตก';
      add('air:' + uidOf(s), 'air', 'เครื่องทิ้งระเบิด B-52', { x: (s.phase === 'run' ? s.px : s.x) - 6, y: s.y - 6 }, act, 1, 1);
    }
    if (typeof enemies !== 'undefined') for (const e of enemies) if (!e.dead && e.d.boss)
      add('boss:' + uidOf(e), 'boss', nameOf(e), e, e.enraged ? 'คลุ้มคลั่ง!' : e.d.world ? 'บอสโลกกำลังอาละวาด' : 'กำลังไล่ล่าเป้าหมาย', e.hp, e.d.hp);
    return out;
  }

  // ---- situation log: every radio message plus state changes worked out between heartbeats ----
  let evSeq = 0, EVENTS = [], prevSnap = null;
  function pushEvent(txt, c, kind, x, y) {
    EVENTS.push({ id: ++evSeq, t: Date.now(), txt, c: c || '#c8c098', kind, x: x ?? null, y: y ?? null });
    if (EVENTS.length > 60) EVENTS.shift();
  }
  function hookMsg() {
    if (typeof msg !== 'function' || window._nexusMsgHooked) return;
    window._nexusMsgHooked = true;
    const original = window.msg;
    window.msg = function (txt, c) {
      original.apply(this, arguments);
      const own = /(จาก Dashboard)/.test(String(txt));
      if (!own) pushEvent(trTxt(String(txt)), c, 'radio', typeof p !== 'undefined' && p ? tile(p.x + 6) : null, typeof p !== 'undefined' && p ? tile(p.y + 6) : null);
    };
  }
  function diffEvents(units) {
    const snap = {};
    for (const u of units) snap[u.id] = u;
    if (prevSnap) {
      for (const u of units) {
        const o = prevSnap[u.id], at = u.zone ? ` ที่ ${u.zone}` : '';
        if (!o) {
          if (u.kind === 'boss') pushEvent(`⚠ พบ ${u.name}${at}`, '#ff6cff', 'alert', u.x, u.y);
          else if (u.kind === 'qrf') pushEvent(`🚑 ${u.name} ออกจากฐาน`, '#60e0ff', 'unit', u.x, u.y);
          else if (u.kind === 'air') pushEvent(`✈ ${u.act}${at}`, '#ffb040', 'alert', u.x, u.y);
          else if (u.kind === 'medic') pushEvent(`⛑ ${u.name}: ${u.act}`, '#ff8080', 'unit', u.x, u.y);
          else if (u.kind === 'tow') pushEvent(`🔧 ${u.name} ออกปฏิบัติการ: ${u.act}`, '#ffb020', 'unit', u.x, u.y);
          continue;
        }
        if (o.act === u.act) continue;
        if (u.kind === 'bot' && /ล้มในการรบ/.test(u.act) && !/ล้มในการรบ/.test(o.act)) pushEvent(`✖ ${u.name} ล้มในการรบ${at}`, '#ff8080', 'alert', u.x, u.y);
        else if ((u.kind === 'btr' || u.kind === 'tank' || u.kind === 'qrf') && !/ออกอีก/.test(u.act) && !/ยิงปืนใหญ่/.test(u.act + o.act))
          pushEvent(`${u.kind === 'tank' ? '🛡' : '🚙'} ${u.name}: ${u.act}${at}`, /ถูกทำลาย|ตั้งรับ/.test(u.act) ? '#ff8060' : '#9ad868', /ถูกทำลาย/.test(u.act) ? 'alert' : 'unit', u.x, u.y);
        else if (u.kind === 'tank' && /ยิงปืนใหญ่/.test(u.act) && !/ยิงปืนใหญ่/.test(o.act)) pushEvent(`💥 ${u.name} เปิดฉากยิงใส่ ${u.act.replace('ยิงปืนใหญ่ใส่ ', '')}`, '#ffb040', 'unit', u.x, u.y);
        else if (u.kind === 'player' && u.act === 'เสียชีวิต รอเกิดใหม่') pushEvent(`✖ คุณเสียชีวิต${at}`, '#ff5050', 'alert', u.x, u.y);
      }
      for (const id in prevSnap) if (!snap[id]) {
        const o = prevSnap[id];
        if (o.kind === 'boss') pushEvent(`✔ ${o.name} ถูกกำจัดแล้ว`, '#58e858', 'unit', o.x, o.y);
        else if (o.kind === 'qrf') pushEvent(`🚑 ${o.name} กลับถึงฐาน`, '#60e0ff', 'unit', o.x, o.y);
      }
      const invNow = typeof inv !== 'undefined' ? inv.state + ':' + inv.wave : '', invWas = prevSnap.__inv;
      if (invWas !== undefined && invNow !== invWas && typeof inv !== 'undefined') {
        if (inv.state === 'warn') pushEvent('🚨 ไซเรนดัง! ฝูงซอมบี้กำลังบุกฐานจากทิศตะวันออก', '#ff5050', 'alert', 70 + OX, 24);
        else if (inv.state === 'wave') pushEvent(`🚨 ซอมบี้บุกระลอกที่ ${inv.wave}`, '#ff5050', 'alert', 66 + OX, 24);
        else if (inv.state === 'idle') pushEvent('✔ การบุกของฝูงซอมบี้สิ้นสุดแล้ว', '#58e858', 'unit', 40 + OX, 24);
      }
    }
    snap.__inv = typeof inv !== 'undefined' ? inv.state + ':' + inv.wave : '';
    prevSnap = snap;
  }
  function getSituation() {
    hookMsg();
    if (typeof inWorld !== 'function' || !inWorld()) return { inWorld: false, events: EVENTS.slice(-40) };
    const units = getUnits();
    diffEvents(units);
    return { inWorld: true, units, events: EVENTS.slice(-40) };
  }

  // ส่ง Heartbeat และสถานะผู้เล่นสดไปยัง Dashboard เป็นประจำ
  function broadcastHeartbeat() {
    sendToDashboard('HEARTBEAT', getGameTelemetry());
  }

  // ตัวจัดการคำสั่ง (Command Handler) ที่สั่งมาจาก Dashboard
  function handleDashboardCommand(type, payload = {}) {
    if (typeof p === 'undefined' || !p) return;

    switch (type) {
      // 1. เติมเลือดและพลังงานเต็มทันที
      case 'CMD_HEAL': {
        const fullHp = typeof maxHp === 'function' ? maxHp() : 999;
        const fullMp = typeof maxMp === 'function' ? maxMp() : 500;
        p.hp = fullHp;
        p.mp = fullMp;
        p.potions = Math.max(p.potions || 0, 10);
        if (typeof float === 'function') float(p.x + 8, p.y - 12, 'FULL HEAL!', '#00e676');
        if (typeof msg === 'function') msg('💉 ฟื้นฟูเกราะและพลังงานเต็มอัตรา (คำสั่งจาก Dashboard)', '#00e676');
        if (typeof sfx === 'function') sfx('heal');
        if (typeof save === 'function') save();
        broadcastHeartbeat();
        break;
      }

      // 2. ส่งเงิน Gold เข้าตัวละครสดๆ
      case 'CMD_ADD_GOLD': {
        const amt = parseInt(payload.amount, 10) || 1000;
        p.gold = (p.gold || 0) + amt;
        if (typeof float === 'function') float(p.x + 8, p.y - 12, `+${amt.toLocaleString()}G`, '#ffd700');
        if (typeof msg === 'function') msg(`💰 ได้รับเงิน +${amt.toLocaleString()} Gold (จาก Dashboard)`, '#ffd700');
        if (typeof sfx === 'function') sfx('coin');
        if (typeof save === 'function') save();
        broadcastHeartbeat();
        break;
      }

      // 3. ปรับระดับเลเวลและแต้มสกิล
      case 'CMD_SET_LEVEL': {
        const targetLvl = Math.max(1, Math.min(50, parseInt(payload.lvl, 10) || 1));
        const addSp = parseInt(payload.sp, 10) || 0;
        p.lvl = targetLvl;
        p.sp = (p.sp || 0) + addSp;
        const newMaxHp = typeof maxHp === 'function' ? maxHp() : 100;
        p.hp = newMaxHp;
        if (typeof float === 'function') float(p.x + 8, p.y - 12, `LEVEL ${targetLvl}!`, '#00f0ff');
        if (typeof msg === 'function') msg(`⭐ ปรับยศเป็น Level ${targetLvl} (จาก Dashboard)`, '#00f0ff');
        if (typeof sfx === 'function') sfx('lvl');
        if (typeof save === 'function') save();
        broadcastHeartbeat();
        break;
      }

      // 4. สวมใส่อาวุธปืนเข้ามือทันที (Hot-Swap Weapon)
      case 'CMD_EQUIP_WEAPON': {
        if (payload.weapon && payload.weapon.name) {
          p.weapon = {
            name: payload.weapon.name,
            plus: parseInt(payload.weapon.plus, 10) || 0
          };
          if (typeof reloadFrames === 'function') p.reloadMax = reloadFrames(p.weapon);
          if (typeof maxAmmo === 'function') p.ammo = maxAmmo(p.weapon);
          if (typeof float === 'function') float(p.x + 8, p.y - 12, `EQUIPPED!`, '#b388ff');
          if (typeof msg === 'function') msg(`🔫 สวมใส่ ${p.weapon.name} (+${p.weapon.plus}) (จาก Dashboard)`, '#b388ff');
          if (typeof sfx === 'function') sfx('equip');
          if (typeof save === 'function') save();
          broadcastHeartbeat();
        }
        break;
      }

      // 5. สลับโหมดอมตะ (God Mode Toggle)
      case 'CMD_TOGGLE_GODMODE': {
        p.godMode = !p.godMode;
        if (p.godMode) {
          p.hp = typeof maxHp === 'function' ? maxHp() : 999;
          if (typeof msg === 'function') msg('🛡️ โหมดอมตะ GOD MODE: [เปิดใช้งาน]', '#ff2a5f');
        } else {
          if (typeof msg === 'function') msg('🛡️ โหมดอมตะ GOD MODE: [ปิด]', '#8b92b2');
        }
        if (typeof save === 'function') save();
        broadcastHeartbeat();
        break;
      }

      // 6. สั่งเริ่มซอมบี้บุกฐานทันที (Trigger Invasion Wave)
      case 'CMD_TRIGGER_INVASION': {                    // payload.now: skip the siren countdown
        if (typeof startInvasion !== 'function' || typeof inv === 'undefined') break;
        if (!inWorld()) { msg('สั่งซอมบี้บุกได้เฉพาะตอนอยู่ในโลกหลัก (จาก Dashboard)', '#ff9090'); pushEvent('⚠ สั่งบุกไม่ได้: ผู้เล่นไม่ได้อยู่ในโลกหลัก', '#ff9090', 'alert', 40 + OX, 24); }
        else if (inv.state !== 'idle') { msg('ซอมบี้กำลังบุกอยู่แล้ว', '#ff9090'); pushEvent('⚠ ซอมบี้กำลังบุกอยู่แล้ว', '#ff9090', 'alert', 40 + OX, 24); }
        else {
          startInvasion();
          if (payload.now) inv.t = 1;                     // straight to wave 1
          msg(payload.now ? '🚨 ซอมบี้บุกฐานทันที! (จาก Dashboard)' : '🚨 สั่งการซอมบี้บุกฐาน: ไซเรนดังแล้ว! (จาก Dashboard)', '#ff5050');
        }
        broadcastHeartbeat();
        break;
      }

      // ยุติการบุกที่กำลังเกิดขึ้น (ฝูงซอมบี้ถอย)
      case 'CMD_STOP_INVASION': {
        if (typeof inv !== 'undefined' && inv.state !== 'idle' && typeof endInvasion === 'function') {
          for (const e of hordeAlive()) e.dead = true;
          inv.queue = [];
          endInvasion(false);
          msg('🛑 ยุติการบุกแล้ว (จาก Dashboard)', '#c0a080');
        }
        broadcastHeartbeat();
        break;
      }

      // 7. วาร์ปกลับฐาน Outpost Alpha ทันที
      case 'CMD_TELEPORT_BASE': {
        const T_SIZE = typeof T !== 'undefined' ? T : 16;
        p.x = (20 + (typeof OX !== 'undefined' ? OX : 0)) * T_SIZE;
        p.y = 20 * T_SIZE;
        if (typeof float === 'function') float(p.x + 8, p.y - 12, 'EVAC!', '#00f0ff');
        if (typeof msg === 'function') msg('🚁 วาร์ปถอนกำลังกลับ Outpost Alpha ปลอดภัย (จาก Dashboard)', '#00f0ff');
        if (typeof sfx === 'function') sfx('warp');
        if (typeof save === 'function') save();
        broadcastHeartbeat();
        break;
      }

      // 8. ซิงค์ข้อมูลเซฟทั้งหมดจาก Dashboard เข้าตัวเกม
      case 'CMD_SYNC_SAVE': {
        if (typeof loadSave === 'function') {
          const fresh = loadSave();
          if (fresh && p) {
            Object.assign(p, fresh);
            if (typeof loadBuilds === 'function') loadBuilds(p.builds || []);   // structures may have been edited/cleared
            if (typeof msg === 'function') msg('🔄 ซิงค์ข้อมูลเซฟจาก Dashboard เข้าเกมสำเร็จ!', '#00f0ff');
            broadcastHeartbeat();
          }
        }
        break;
      }

      // 10. เติมเศษเหล็กสำหรับสร้างฐาน
      case 'CMD_ADD_SCRAP': {
        const amt = parseInt(payload.amount, 10) || 100;
        p.scrap = (p.scrap || 0) + amt;
        if (typeof float === 'function') float(p.x + 8, p.y - 12, `+${amt} SCRAP`, '#c0c8d8');
        if (typeof msg === 'function') msg(`🔩 ได้รับเศษเหล็ก +${amt.toLocaleString()} (จาก Dashboard)`, '#c0c8d8');
        if (typeof save === 'function') save();
        broadcastHeartbeat();
        break;
      }

      // 11. รื้อสิ่งปลูกสร้างทั้งหมด
      case 'CMD_CLEAR_BUILDS': {
        if (typeof loadBuilds === 'function') loadBuilds([]);
        p.builds = [];
        if (typeof msg === 'function') msg('🏗️ รื้อสิ่งปลูกสร้างทั้งหมดในฐานแล้ว (จาก Dashboard)', '#ff9060');
        if (typeof save === 'function') save();
        broadcastHeartbeat();
        break;
      }

      // 12. ซ่อมยานพาหนะทุกคันทันที (รถถัง + BTR) และส่งกลับประจำจุด
      case 'CMD_REPAIR_VEHICLES': {
        const all = [...(typeof TANKS !== 'undefined' ? TANKS : []), ...(typeof BTRS !== 'undefined' ? BTRS : []), ...(typeof QRFS !== 'undefined' ? QRFS : [])];
        for (const t of all) {
          if (t.state && t.state !== 'ok') { t.state = 'ok'; t.x = t.home.x; t.y = t.home.y; t.truck = null; t.path = null; }
          t.hp = t.max || t.hp;
          if (t.btr && t.patrol === 'lost') { t.patrol = 'garage'; t.patrolT = 60 * 5; t.squad = []; }
        }
        if (typeof TOW_TRUCKS !== 'undefined') TOW_TRUCKS.length = 0;
        if (typeof msg === 'function') msg('🔧 ซ่อมรถถังและรถ BTR ทุกคันเรียบร้อย (จาก Dashboard)', '#9ad868');
        broadcastHeartbeat();
        break;
      }

      // 13. สั่ง BTR ออกลาดตระเวนทันที
      case 'CMD_LAUNCH_PATROL': {
        const b = typeof BTRS !== 'undefined' && BTRS.find(v => v.call === payload.call);
        if (b && b.state === 'ok' && b.patrol === 'garage') { b.patrolT = 1; }
        else if (typeof msg === 'function') msg(`BTR-80 ${payload.call || ''} ยังไม่พร้อม (กำลังลาดตระเวนหรือซ่อมอยู่)`, '#ff9090');
        broadcastHeartbeat();
        break;
      }

      // 14. ส่งกำลังเสริม (QRF) ไปช่วยหน่วยลาดตระเวน
      case 'CMD_SEND_QRF': {
        if (typeof sendQRF === 'function') sendQRF(payload.call || undefined);
        broadcastHeartbeat();
        break;
      }

      // 15. ขอภาพแผนที่โลกทั้งใบ
      case 'CMD_REQUEST_MAP': {
        const m = getWorldMapImage();
        if (m) sendToDashboard('WORLD_MAP', m);
        break;
      }

      // 9. ร้องขอสถานะล่าสุด (Ping / Request Telemetry)
      // 16. โหมดแอดมินผู้สังเกตการณ์: เปิด/ปิด และสั่งกล้องให้ติดตามหน่วยที่เลือก
      case 'CMD_SPECTATE': {
        if (typeof toggleSpectator === 'function' && mode === 'play') toggleSpectator(payload.on === undefined ? !spec : !!payload.on);
        if (payload.follow && spec) { spec.units = specUnits(); spec.follow = payload.follow; }
        broadcastHeartbeat();
        break;
      }

      case 'CMD_REQUEST_STATUS': {
        broadcastHeartbeat();
        break;
      }
    }
  }

  // รับข้อความจาก Dashboard ผ่าน BroadcastChannel
  if (bus) {
    bus.onmessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'NEXUS_DASHBOARD') return;
      handleDashboardCommand(data.type, data.payload);
    };
  }

  // รับข้อความจาก Dashboard ผ่าน window.parent postMessage
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.source !== 'NEXUS_DASHBOARD') return;
    handleDashboardCommand(data.type, data.payload);
  });

  // เกี่ยว (Hook) เข้ากับระบบ Save ของเกมเพื่อส่งสัญญาณให้ Dashboard ทันที
  window.addEventListener('DOMContentLoaded', () => {
    hookMsg();                                     // capture every radio message from the very start
    // ส่งสัญญาณว่าเกมเปิดแล้ว
    sendToDashboard('GAME_READY', { url: window.location.href });

    // Hook save() เพื่อแจ้ง Dashboard เมื่อมีการเซฟ
    const checkInterval = setInterval(() => {
      if (typeof save === 'function' && !window._nexusSaveHooked) {
        window._nexusSaveHooked = true;
        const originalSave = window.save;
        window.save = function() {
          originalSave.apply(this, arguments);
          sendToDashboard('SAVE_OCCURRED', getGameTelemetry());
        };
        clearInterval(checkInterval);
      }
    }, 200);

    // Heartbeat สม่ำเสมอทุก 1 วินาที
    setInterval(() => {
      if (typeof p !== 'undefined' && p) {
        // รักษาเลือดไว้หากเปิดโหมดอมตะ
        if (p.godMode && typeof maxHp === 'function') {
          p.hp = maxHp();
        }
        broadcastHeartbeat();
      }
    }, 1000);
  });

  // แจ้ง Dashboard เมื่อหน้าต่างเกมปิดลง
  window.addEventListener('beforeunload', () => {
    sendToDashboard('GAME_OFFLINE');
  });

  // Export ไปที่ window เพื่อให้ console เรียกใช้ได้
  window.nexusUnits = () => (typeof p !== 'undefined' && p ? getUnits() : []);   // used by the observer camera (spectator.js)
  window.nexusBridge = {
    send: sendToDashboard,
    getTelemetry: getGameTelemetry,
    handleCmd: handleDashboardCommand
  };

  console.log('[NEXUS BRIDGE] Game <-> Dashboard communication bridge initialized.');
})();
