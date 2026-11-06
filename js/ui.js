// ================= Menus, Inventory, Input & Rendering =================
let anvilSlot = 0, bagZone = 'bag', eqCur = 0, bagFilter = 0, craftCur = 0, stashZone = 'bag', stashCur = 0, bestCur = 0, achieveCur = 0;
const FILTERS = ['ALL', 'GEAR', 'USE', 'LOOT'];
const matchFilter = it => {
  if (!it || bagFilter === 0) return true;
  if (bagFilter === 1) return isGear(it);
  if (bagFilter === 2) return it.kind === 'use';
  return it.kind === 'mat';
};
function sortBag() {
  // merge split stacks first
  const merged = [];
  for (const it of p.inv) {
    if (it.kind === 'mat' || it.kind === 'use') {
      const ex = merged.find(m => m.kind === it.kind && m.id === it.id);
      if (ex) { ex.count += it.count; continue; }
    }
    merged.push(it);
  }
  const order = { weapon:0, helm:1, armor:2, boots:3, ring:4, use:5, mat:6 };
  merged.sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9) || (b.rar ?? 0) - (a.rar ?? 0) || itemValue(b) - itemValue(a));
  p.inv = merged;
  sfx('menu'); save();
}
function shopOpts() {
  const slot = GEAR_SLOTS[anvilSlot], it = p[slot], lbl = SLOT_LBL[slot];
  const anvilTxt = !it ? `< ANVIL [${lbl}] - >` : it.plus >= 9 ? `< ANVIL [${lbl}] MAX >` : `< ANVIL [${lbl}] ${upCost(it)}G >`;
  const rerollTxt = !it ? `< REROLL [${lbl}] - >` : `< REROLL [${lbl}] ${rerollCost(it)}G >`;
  return [
    { t: 'HP POTION        15G', f: () => buy(15, () => p.potions++) },
    { t: '5x HP POTIONS    70G', f: () => buy(70, () => p.potions += 5) },
    { t: 'MANA POTION      20G', f: () => buyStack('use', 'mpot', 20) },
    { t: 'HERO ELIXIR      45G', f: () => buyStack('use', 'elixir', 45) },
    { t: 'TOWN SCROLL      30G', f: () => buyStack('use', 'scroll', 30) },
    { t: 'SELL ALL LOOT',        f: sellMats },
    { t: 'SELL FROM BAG...',     f: () => { mode = 'sell'; bagZone = 'bag'; invCur = 0; } },
    { t: anvilTxt, f: () => {
      if (!it) { shopMsg = `No ${slot} equipped. Use < > to pick slot.`; return sfx('no'); }
      if (it.plus >= 9) { shopMsg = 'That gear cannot get any better!'; return sfx('no'); }
      buy(upCost(it), () => { it.plus++; p.hp = Math.min(p.hp, maxHp()); shopMsg = `Hammered into ${itemName(it)}!`; checkAchievements(); }, 'anvil');
    } },
    { t: rerollTxt, f: () => {
      if (!it) { shopMsg = `No ${slot} equipped. Use < > to pick slot.`; return sfx('no'); }
      buy(rerollCost(it), () => {
        p.stats = p.stats || {}; p.stats.rerolls = (p.stats.rerolls || 0) + 1;
        it.aff = rollAffixes(Math.max(1, it.rar));
        p.hp = Math.min(p.hp, maxHp()); p.mp = Math.min(p.mp, maxMp());
        shopMsg = `Enchanted ${itemName(it)}: ${it.aff.map(affixText).join(', ')}!`;
        checkAchievements();
      }, 'rare');
    } },
    { t: 'CRAFT GEAR...',     f: () => { mode = 'craft'; craftCur = 0; shopMsg = 'Forge monster loot into special gear.'; sfx('menu'); } },
    { t: 'LEAVE', f: () => { mode = 'play'; save(); } },
  ];
}
function buy(cost, fn, sound = 'buy') {
  if (p.gold < cost) { shopMsg = 'Not enough gold, friend.'; return sfx('no'); }
  p.gold -= cost; shopMsg = 'Pleasure doing business!'; fn(); sfx(sound); save();
}
function buyStack(kind, id, cost) {
  if (p.gold < cost) { shopMsg = 'Not enough gold, friend.'; return sfx('no'); }
  if (! p.inv.some(i => i.kind === kind && i.id === id) && p.inv.length >= BAG) { shopMsg = 'Your bag is full!'; return sfx('no'); }
  p.gold -= cost; addStack(kind, id, 1); shopMsg = `Bought ${CONSUMABLES[id].name}!`; sfx('buy'); save();
}
function sellMats() {
  let total = 0;
  const q = storyQ(), keep = p.sq && q && q.type === 'collect' ? q.target : null;   // don't sell quest items
  p.inv = p.inv.filter(it => { if (it.kind === 'mat' && it.id !== keep) { total += itemValue(it); return false; } return true; });
  if (!total) { shopMsg = 'You have no loot to sell.'; return sfx('no'); }
  p.gold += total; shopMsg = `Sold all loot for ${total}G.`; sfx('coin'); save();
}
function openShop() { mode = 'shop'; shopCur = 0; shopMsg = 'Welcome! Fine wares and a sturdy anvil.'; sfx('menu'); }
function equip(i) {
  const it = p.inv[i], old = p[it.kind];
  if (it.kind === 'weapon' && !canWield(it)) { msg(`Only a ${WT_CLASS[it.wt || 'sword']} can use that.`, '#ff8080'); return sfx('no'); }
  p[it.kind] = it;
  if (old) p.inv[i] = old; else p.inv.splice(i, 1);
  if (it.kind === 'weapon') { p.reloadT = 0; p.ammo = maxAmmo(p.weapon); }
  p.hp = Math.min(p.hp, maxHp()); p.mp = Math.min(p.mp, maxMp()); sfx('equip'); save();
}
function unequip(slotIdx) {
  const slot = GEAR_SLOTS[slotIdx], it = p[slot];
  if (!it) return sfx('no');
  if (p.inv.length >= BAG) { msg('Bag is full! Cannot unequip.', '#ff8080'); return sfx('no'); }
  p[slot] = null; p.inv.push(it);
  if (slot === 'weapon') { p.reloadT = 0; p.ammo = maxAmmo(p.weapon); }
  p.hp = Math.min(p.hp, maxHp()); p.mp = Math.min(p.mp, maxMp()); sfx('equip'); save();
}
function useBagItem(i) {
  const it = p.inv[i];
  if (!it || it.kind !== 'use') return;
  p.quickId = it.id;
  if (it.id === 'mpot') {
    if (p.mp >= maxMp()) { msg('MP is already full!', '#60c0ff'); return sfx('no'); }
    const gain = Math.round(maxMp() * 0.6);
    p.mp = Math.min(maxMp(), p.mp + gain); float(p.x + 6, p.y - 4, `+${gain} MP`, '#60c0ff'); sfx('potion');
  } else if (it.id === 'elixir') {
    p.elixirT = 1800; float(p.x + 6, p.y - 10, 'ELIXIR!', '#d080ff'); msg('Hero Elixir: ATK/CRIT/SPD up for 30s!', '#d080ff'); sfx('lvl');
  } else if (it.id === 'scroll') {
    if (inWorld() && inBasePx(p.x, p.y)) { msg('Already in Ironvale Village!', '#f8e090'); return sfx('no'); }
    if (typeof rift !== 'undefined' && rift) exitRift();
    if (dungeon) exitDungeon();
    if (arena) leaveArena();
    if (region) leaveRegion();
    p.x = (12 + OX) * T + 2; p.y = 24 * T + 2; zoneName = zoneAt(p.x); banner = { txt: zoneName, t: 150 };
    burst(p.x + 6, p.y + 6, '#f8e090', 20); msg('Teleported to Ironvale Village!', '#f8e090'); sfx('rare'); mode = 'play';
  }
  if (--it.count <= 0) p.inv.splice(i, 1);
  save();
}
function quickStack() {
  let s = p.inv.find(i => i.kind === 'use' && i.id === p.quickId);
  if (!s) s = p.inv.find(i => i.kind === 'use');
  if (s) p.quickId = s.id;
  return s;
}
function useQuickItem() {
  const s = quickStack();
  if (!s) { msg('No consumables in bag!', '#b8b890'); return sfx('no'); }
  useBagItem(p.inv.indexOf(s));
}
function actBagSelection(sell) {
  if (sell) {
    if (bagZone === 'eq') return sfx('no');
    const it = p.inv[invCur];
    if (!it) return sfx('no');
    const v = itemValue(it); p.gold += v; p.inv.splice(invCur, 1); shopMsg = `Sold ${itemName(it)} for ${v}G.`; sfx('coin'); save();
    return;
  }
  if (bagZone === 'eq') return unequip(eqCur);
  const it = p.inv[invCur];
  if (!it) return sfx('no');
  if (it.kind === 'mat') { msg('Sell monster loot to the merchant in town.', '#b8b890'); sfx('no'); }
  else if (it.kind === 'use') useBagItem(invCur);
  else equip(invCur);
}
function dropBagSelection() {
  if (bagZone !== 'bag') return sfx('no');
  const it = p.inv[invCur];
  if (!it) return sfx('no');
  p.inv.splice(invCur, 1); msg(`Dropped ${itemName(it)}`, '#a0a0b0'); sfx('menu'); save();
}
function bagInput(code, sell) {
  if (code === 'KeyF') { bagFilter = (bagFilter + 1) % FILTERS.length; sfx('menu'); return; }
  if (code === 'KeyR') { sortBag(); return; }
  if (bagZone === 'eq') {
    if (code === 'ArrowLeft' || code === 'KeyA') { eqCur = (eqCur + 4) % 5; sfx('menu'); return; }
    if (code === 'ArrowRight' || code === 'KeyD') { eqCur = (eqCur + 1) % 5; sfx('menu'); return; }
    if (code === 'ArrowDown' || code === 'KeyS') { bagZone = 'bag'; invCur = eqCur; sfx('menu'); return; }
    if (code === 'ArrowUp' || code === 'KeyW') { bagZone = 'bag'; invCur = 15 + eqCur; sfx('menu'); return; }
  } else {
    if ((code === 'ArrowUp' || code === 'KeyW') && invCur < 5 && !sell) { bagZone = 'eq'; eqCur = invCur; sfx('menu'); return; }
    if ((code === 'ArrowDown' || code === 'KeyS') && invCur >= 15 && !sell) { bagZone = 'eq'; eqCur = invCur - 15; sfx('menu'); return; }
    const nav = { ArrowLeft:-1, KeyA:-1, ArrowRight:1, KeyD:1, ArrowUp:-5, KeyW:-5, ArrowDown:5, KeyS:5 }[code];
    if (nav) { invCur = (invCur + nav + BAG) % BAG; sfx('menu'); return; }
  }
  const ok = code === 'Enter' || code === 'Space' || code === 'KeyE';
  if (sell) {
    if (code === 'Escape' || code === 'KeyI' || code === 'Backspace') { mode = 'shop'; return; }
    if (ok) actBagSelection(true);
    return;
  }
  if (code === 'Escape' || code === 'KeyI' || code === 'Tab') { mode = 'play'; return; }
  if (ok) actBagSelection(false);
  if (code === 'KeyX') dropBagSelection();
}
// ---- How to Play overlay (HTML, so the Thai text stays crisp); shown once on the first game ----
const HELP_KEY = 'ironvale-help-seen', helpEl = document.getElementById('help');
let helpShownThisSession = false;
function helpSeen() { try { return !!localStorage.getItem(HELP_KEY); } catch (e) { return helpShownThisSession; } }
let helpReturn = 'play';
function openHelp(ret = 'play') { helpReturn = ret; mode = 'help'; helpEl.classList.add('show'); sfx('menu'); }
function closeHelp() {
  helpEl.classList.remove('show'); mode = helpReturn; helpShownThisSession = true;
  try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
}
document.getElementById('helpClose').addEventListener('click', () => { initAudio(); closeHelp(); });

// ---- Settings menu (Esc / O in game, O on the title screen) ----
let setCur = 0, setFrom = 'play';
const DIFF_DESC = { easy:'Weaker foes, more loot, no gold lost on death.', normal:'The intended challenge. Lose 10% gold on death.',
  hard:'Tough foes hit hard. More XP and gold. Lose 20% gold.' };
function settingsOpts() {
  const inGame = setFrom !== 'title';
  return [
    inGame && { k:'RESUME', act: () => { mode = 'play'; } },
    { k:'MUSIC', v: settings.music ? 'ON' : 'OFF', act: () => { settings.music = !settings.music; saveSettings(); } },
    { k:'SOUND FX', v: settings.sfx ? 'ON' : 'OFF', act: () => { settings.sfx = !settings.sfx; saveSettings(); } },
    { k:'LANGUAGE', v: settings.lang === 'th' ? 'ไทย' : 'ENGLISH', act: () => { settings.lang = settings.lang === 'th' ? 'en' : 'th'; saveSettings(); } },
    { k:'DIFFICULTY', v: settings.difficulty.toUpperCase(), act: (d = 1) => {
      settings.difficulty = DIFF_KEYS[(DIFF_KEYS.indexOf(settings.difficulty) + d + DIFF_KEYS.length) % DIFF_KEYS.length]; saveSettings();
    } },
    { k:'FULLSCREEN', v: document.fullscreenElement ? 'ON' : 'OFF', act: () => {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {});
    } },
    { k:'HOW TO PLAY', act: () => openHelp('settings') },
    { k: inGame ? 'QUIT TO TITLE' : 'BACK', act: () => inGame ? quitToTitle() : (mode = 'title') },
  ].filter(Boolean);
}
function openSettings(from) { setFrom = from; setCur = 0; mode = 'settings'; sfx('menu'); }
function closeSettings() { mode = setFrom === 'title' ? 'title' : 'play'; }
function quitToTitle() {
  if (typeof rift !== 'undefined' && rift) exitRift();
  if (dungeon) exitDungeon();
  if (arena) leaveArena();
  if (region) leaveRegion();
  save(); saved = loadSave(); stopMusic(); mode = 'title';
}
function settingsInput(code) {
  const o = settingsOpts(), it = o[setCur];
  if (code === 'ArrowUp' || code === 'KeyW') { setCur = (setCur + o.length - 1) % o.length; sfx('menu'); }
  else if (code === 'ArrowDown' || code === 'KeyS') { setCur = (setCur + 1) % o.length; sfx('menu'); }
  else if ((code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowRight' || code === 'KeyD') && it.v !== undefined) {
    it.act(code === 'ArrowLeft' || code === 'KeyA' ? -1 : 1); sfx('menu');
  } else if (code === 'Enter' || code === 'Space' || code === 'KeyE') { sfx('menu'); it.act(1); }
  else if (code === 'Escape' || code === 'KeyO' || code === 'KeyP') closeSettings();
}

// ---- Skill screen (T): SKILLS page (level up K/L skills) and TREE page ----
let treeCol = 0, treeTier = 0;
function treeCheck(n) {
  const r = rank(n.id);
  if (r >= n.max) return 'MAXED';
  if (p.lvl < TIER_LVL[n.tier]) return `NEEDS LV ${TIER_LVL[n.tier]}`;
  if (n.tier > 0 && !rank(treeNodes(p.cls).find(m => m.col === n.col && m.tier === n.tier - 1).id)) return 'LEARN THE SKILL ABOVE';
  if (p.sp <= 0) return 'NO SKILL POINTS';
  return null;
}
function treeInput(code) {
  if (code === 'ArrowLeft' || code === 'KeyA') { treeCol = (treeCol + 2) % 3; sfx('menu'); }
  else if (code === 'ArrowRight' || code === 'KeyD') { treeCol = (treeCol + 1) % 3; sfx('menu'); }
  else if (code === 'ArrowUp' || code === 'KeyW') { treeTier = (treeTier + 2) % 3; sfx('menu'); }
  else if (code === 'ArrowDown' || code === 'KeyS') { treeTier = (treeTier + 1) % 3; sfx('menu'); }
  else if (code === 'Enter' || code === 'Space' || code === 'KeyE') {
    const n = treeNodes(p.cls).find(m => m.col === treeCol && m.tier === treeTier);
    if (treeCheck(n)) return sfx('no');
    p.tree[n.id] = rank(n.id) + 1; p.sp--; sfx('lvl'); save();
    if (n.id === 'hp') p.hp = Math.min(maxHp(), p.hp + 10);
  } else if (code === 'Escape' || code === 'KeyT') mode = 'play';
}
function shopInput(code) {
  const opts = shopOpts();
  if (code === 'ArrowUp' || code === 'KeyW') { shopCur = (shopCur + opts.length - 1) % opts.length; sfx('menu'); }
  else if (code === 'ArrowDown' || code === 'KeyS') { shopCur = (shopCur + 1) % opts.length; sfx('menu'); }
  else if (code === 'ArrowLeft' || code === 'KeyA') { anvilSlot = (anvilSlot + GEAR_SLOTS.length - 1) % GEAR_SLOTS.length; sfx('menu'); }
  else if (code === 'ArrowRight' || code === 'KeyD') { anvilSlot = (anvilSlot + 1) % GEAR_SLOTS.length; sfx('menu'); }
  else if (code === 'Enter' || code === 'Space' || code === 'KeyE') opts[shopCur].f();
  else if (code === 'Escape' || code === 'KeyI') { mode = 'play'; save(); }
}
const canCraft = rec => p.gold >= rec.gold && p.inv.length < BAG && rec.mats.every(([id, n]) => matCount(id) >= n);
function craftItem() {
  const rec = RECIPES[craftCur];
  if (p.inv.length >= BAG) { shopMsg = 'Your bag is full!'; return sfx('no'); }
  if (p.gold < rec.gold) { shopMsg = 'Not enough gold, friend.'; return sfx('no'); }
  for (const [id, n] of rec.mats) if (matCount(id) < n) { shopMsg = 'Missing monster materials!'; return sfx('no'); }
  p.gold -= rec.gold;
  for (const [id, n] of rec.mats) removeMats(id, n);
  const it = makeRecipeItem(rec);
  p.inv.push(it);
  shopMsg = `Crafted ${itemName(it)}!`; sfx('anvil'); save();
}
function craftInput(code) {
  if (code === 'ArrowUp' || code === 'KeyW') { craftCur = (craftCur + RECIPES.length - 1) % RECIPES.length; sfx('menu'); }
  else if (code === 'ArrowDown' || code === 'KeyS') { craftCur = (craftCur + 1) % RECIPES.length; sfx('menu'); }
  else if (code === 'Enter' || code === 'Space' || code === 'KeyE') craftItem();
  else if (code === 'Escape' || code === 'Backspace' || code === 'KeyI') { mode = 'shop'; sfx('menu'); }
}
function actStashSelection() {
  const fromBag = stashZone === 'bag', src = fromBag ? p.inv : p.stash, dst = fromBag ? p.stash : p.inv;
  const idx = fromBag ? invCur : stashCur, it = src[idx];
  if (!it) return sfx('no');
  if (it.kind === 'mat' || it.kind === 'use') {
    const ex = dst.find(m => m.kind === it.kind && m.id === it.id);
    if (ex) { ex.count += it.count; src.splice(idx, 1); sfx('item'); save(); return; }
  }
  if (dst.length >= BAG) { msg(fromBag ? 'Stash is full!' : 'Bag is full!', '#ff8080'); return sfx('no'); }
  dst.push(it); src.splice(idx, 1); sfx('item'); save();
}
function stashInput(code) {
  if (code === 'Tab') { stashZone = stashZone === 'bag' ? 'stash' : 'bag'; sfx('menu'); return; }
  const cur = stashZone === 'bag' ? invCur : stashCur;
  if ((code === 'ArrowRight' || code === 'KeyD') && stashZone === 'bag' && cur % 5 === 4) { stashZone = 'stash'; stashCur = Math.floor(cur / 5) * 5; sfx('menu'); return; }
  if ((code === 'ArrowLeft' || code === 'KeyA') && stashZone === 'stash' && cur % 5 === 0) { stashZone = 'bag'; invCur = Math.floor(cur / 5) * 5 + 4; sfx('menu'); return; }
  const nav = { ArrowLeft:-1, KeyA:-1, ArrowRight:1, KeyD:1, ArrowUp:-5, KeyW:-5, ArrowDown:5, KeyS:5 }[code];
  if (nav) {
    if (stashZone === 'bag') invCur = (invCur + nav + BAG) % BAG;
    else stashCur = (stashCur + nav + BAG) % BAG;
    sfx('menu'); return;
  }
  if (code === 'Enter' || code === 'Space' || code === 'KeyE') actStashSelection();
  else if (code === 'Escape' || code === 'KeyI') { mode = 'play'; save(); }
}
function bestiaryInput(code) {
  const n = bestiaryKeys().length;
  const nav = { ArrowLeft:-1, KeyA:-1, ArrowRight:1, KeyD:1, ArrowUp:-5, KeyW:-5, ArrowDown:5, KeyS:5 }[code];
  if (nav) { bestCur = (bestCur + nav + n) % n; sfx('menu'); return; }
  if (code === 'Escape' || code === 'KeyX' || code === 'Enter' || code === 'Space') { mode = 'play'; sfx('menu'); }
}
function actAchieveSelection() {
  const id = ACHIEVE_KEYS[achieveCur];
  if (p.achieve && p.achieve[id]) {
    if (p.title === id) {
      p.title = null;
      msg('Unequipped title.', '#b8b890');
      sfx('menu');
    } else {
      p.title = id;
      msg(`Equipped Title: [${ACHIEVEMENTS[id].title}]!`, ACHIEVEMENTS[id].color || '#f8c838');
      sfx('lvl');
    }
    save();
  } else {
    sfx('no');
  }
}
function achieveInput(code) {
  const n = ACHIEVE_KEYS.length;
  const nav = { ArrowLeft:-1, KeyA:-1, ArrowRight:1, KeyD:1, ArrowUp:-5, KeyW:-5, ArrowDown:5, KeyS:5 }[code];
  if (nav) { achieveCur = (achieveCur + nav + n) % n; sfx('menu'); return; }
  if (code === 'Enter' || code === 'Space' || code === 'KeyE') actAchieveSelection();
  else if (code === 'Escape' || code === 'KeyY' || code === 'KeyI' || code === 'Backspace') { mode = 'play'; sfx('menu'); }
}

// ================= Input =================
function press(code) {
  const ok = code === 'Enter' || code === 'Space' || code === 'KeyE';
  if (code === 'KeyM') { settings.music = !settings.music; saveSettings(); return; }
  switch (mode) {
    case 'title':
      if (code === 'KeyO' || code === 'Escape') openSettings('title');
      else if (code === 'KeyV') {                          // straight into admin observer mode
        if (saved) startGame(true);
        else { startGame(false, 'assault'); dialogQ = []; dialogDone = null; mode = 'play'; }
        toggleSpectator(true);
      }
      else if ((code === 'Enter' || code === 'Space') && saved) startGame(true);
      else if (code === 'Enter' || code === 'Space' || (code === 'KeyN' && saved)) { mode = 'class'; sfx('menu'); }
      break;
    case 'class':
      if (code === 'ArrowLeft' || code === 'KeyA') { classCur = (classCur + 2) % 3; sfx('menu'); }
      else if (code === 'ArrowRight' || code === 'KeyD') { classCur = (classCur + 1) % 3; sfx('menu'); }
      else if (ok) startGame(false, CLASS_KEYS[classCur]);
      else if (code === 'Escape') mode = 'title';
      break;
    case 'dialog':
      if (ok) {
        dialogQ.shift(); sfx('menu');
        if (!dialogQ.length) { mode = 'play'; const f = dialogDone; dialogDone = null; if (f) f(); }
      }
      break;
    case 'dead': if (ok) respawn(); break;
    case 'pause': if (ok || code === 'Escape' || code === 'KeyP') mode = 'play'; break;
    case 'settings': settingsInput(code); break;
    case 'bag': bagInput(code, false); break;
    case 'sell': bagInput(code, true); break;
    case 'shop': shopInput(code); break;
    case 'craft': craftInput(code); break;
    case 'stash': stashInput(code); break;
    case 'bestiary': bestiaryInput(code); break;
    case 'achieve': achieveInput(code); break;
    case 'tree': treeInput(code); break;
    case 'map': if (ok || code === 'Escape' || code === 'KeyN') mode = 'play'; break;
    case 'help': if (ok || code === 'Escape' || code === 'KeyH') closeHelp(); break;
    case 'play':
      if (spec) { specInput(code); break; }                // admin observer takes every key (spectator.js)
      if (code === 'F2' || code === 'Backquote') { toggleSpectator(true); break; }
      if (buildInput(code)) break;                         // build mode takes the keys it uses (build.js)
      if (code === 'Space' || code === 'KeyJ') attack();
      else if (code === 'KeyR') startReload();
      else if (code === 'ShiftLeft' || code === 'ShiftRight') dodgeRoll();
      else if (code === 'KeyE' || code === 'Enter') {
        const n = nearNpc(), c = nearChest(), sh = nearShrine(), st = nearStash(), wl = nearWell(), rf = nearRiftPortal(), gt = nearGate();
        if (gt) toggleGate(gt);                           // bridge gate: open / close
        else if (n && inWorld()) talk(n);
        else if (c) openChest(c);
        else if (sh) useShrine(sh);
        else if (rf) enterRift(1);
        else if (st) { mode = 'stash'; stashZone = 'bag'; invCur = 0; stashCur = 0; sfx('menu'); }
        else if (wl) useWell(wl);
      }
      else if (code === 'KeyI' || code === 'Tab') { mode = 'bag'; bagZone = 'bag'; invCur = 0; sfx('menu'); }
      else if (code === 'KeyQ') drinkPotion();
      else if (code === 'KeyC' || code === 'Digit3') useQuickItem();
      else if (code === 'KeyV') cyclePet();
      else if (code === 'KeyG') toggleAuto();
      else if (code === 'KeyF') sendQRF();                 // send the QRF to the patrol in most trouble (patrol.js)
      else if (code === 'KeyB') toggleBuild();
      else if (code === 'KeyX') { mode = 'bestiary'; bestCur = 0; sfx('menu'); }
      else if (code === 'KeyY') { mode = 'achieve'; achieveCur = 0; sfx('menu'); }
      else if (code === 'KeyT') { mode = 'tree'; sfx('menu'); }
      else if (code === 'KeyN') { mode = 'map'; sfx('menu'); }
      else if (code === 'KeyH') openHelp();
      else if (code === 'KeyU') toggleUI();
      else if (code === 'Escape' || code === 'KeyP' || code === 'KeyO') openSettings('play');
      break;
  }
}
addEventListener('keydown', e => {
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  initAudio();
  if (!e.repeat || (e.code.startsWith('Arrow') && ['bag', 'sell', 'shop', 'craft', 'stash', 'bestiary', 'settings', 'achieve'].includes(mode))) press(e.code);
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (mode === 'play' && !spec) save(); });
document.querySelectorAll('#touch button').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = true; initAudio(); press(k); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, e => { e.preventDefault(); keys[k] = false; }));
});
// Canvas mouse/touch pointer support for Bag, Sell, and Shop
cv.addEventListener('pointerdown', e => {
  initAudio();
  const rect = cv.getBoundingClientRect();
  // menus live in the centred 320x240 box, so convert the click into that box's coordinates
  const mx = (e.clientX - rect.left) / rect.width * VW - menuX(), my = (e.clientY - rect.top) / rect.height * VH - menuY();
  if (mode === 'bag' || mode === 'sell') {
    const sell = mode === 'sell';
    // Filter tabs: ALL(86,11,30,13), GEAR(118,11,38,13), USE(158,11,30,13), LOOT(190,11,38,13)
    const tabs = [[86, 30], [118, 38], [158, 30], [190, 38]];
    for (let i = 0; i < 4; i++) if (mx >= tabs[i][0] && mx < tabs[i][0] + tabs[i][1] && my >= 10 && my <= 25) { bagFilter = i; sfx('menu'); return; }
    if (mx >= 232 && mx < 272 && my >= 10 && my <= 25) { sortBag(); return; }
    if (mx >= 276 && mx < 308 && my >= 10 && my <= 25) { mode = sell ? 'shop' : 'play'; sfx('menu'); return; }
    // Paper Doll 5 slots: x = 40 + i * 22, y = 28, 20x20
    if (!sell && my >= 28 && my < 48) {
      for (let i = 0; i < 5; i++) {
        const sx = 40 + i * 22;
        if (mx >= sx && mx < sx + 20) {
          if (bagZone === 'eq' && eqCur === i) actBagSelection(false);
          else { bagZone = 'eq'; eqCur = i; sfx('menu'); }
          return;
        }
      }
    }
    // Bag 5x4 grid: gx = 14, gy = 88, step = 22
    if (mx >= 14 && mx < 122 && my >= 88 && my < 174) {
      const col = Math.floor((mx - 14) / 22), row = Math.floor((my - 88) / 22);
      if (col >= 0 && col < 5 && row >= 0 && row < 4) {
        const idx = row * 5 + col;
        if (bagZone === 'bag' && invCur === idx) actBagSelection(sell);
        else { bagZone = 'bag'; invCur = idx; sfx('menu'); }
        return;
      }
    }
    // Inspector action buttons: Primary(132, 184, 82, 16), Secondary(220, 184, 80, 16)
    if (my >= 184 && my <= 200) {
      if (mx >= 132 && mx <= 214) { actBagSelection(sell); return; }
      if (mx >= 220 && mx <= 300) { if (sell) { mode = 'shop'; sfx('menu'); } else dropBagSelection(); return; }
    }
  } else if (mode === 'settings') {
    settingsOpts().forEach((o, i) => {
      const y = SET_Y0 + i * SET_DY;
      if (mx >= 64 && mx <= 256 && my >= y - 3 && my < y + SET_DY - 3) {
        if (setCur === i) o.act(o.v !== undefined && mx < 160 ? -1 : 1); else setCur = i;
        sfx('menu');
      }
    });
  } else if (mode === 'tree') {
    for (let c = 0; c < 3; c++) for (let t = 0; t < 3; t++) {
      const x = 16 + c * 98, y = 44 + t * 44;
      if (mx >= x && mx <= x + 92 && my >= y && my <= y + 34) {
        if (treeCol === c && treeTier === t) treeInput('Enter');
        else { treeCol = c; treeTier = t; sfx('menu'); }
        return;
      }
    }
  } else if (mode === 'shop') {
    const opts = shopOpts();
    for (let i = 0; i < opts.length; i++) {
      const oy = 48 + i * 11;
      if (mx >= 36 && mx <= 284 && my >= oy && my < oy + 11) {
        if (shopCur === i) opts[i].f(); else { shopCur = i; sfx('menu'); }
        return;
      }
    }
  } else if (mode === 'craft') {
    if (mx >= 276 && mx < 308 && my >= 10 && my <= 25) { mode = 'shop'; sfx('menu'); return; }
    for (let i = 0; i < RECIPES.length; i++) {
      const ry = 30 + i * 29;
      if (mx >= 12 && mx <= 150 && my >= ry && my < ry + 27) {
        if (craftCur === i) craftItem(); else { craftCur = i; sfx('menu'); }
        return;
      }
    }
    if (mx >= 156 && mx <= 306 && my >= 188 && my <= 204) { craftItem(); return; }
  } else if (mode === 'stash') {
    if (mx >= 276 && mx < 308 && my >= 10 && my <= 25) { mode = 'play'; save(); sfx('menu'); return; }
    if (my >= 30 && my < 118) {
      if (mx >= 14 && mx < 124) {
        const idx = Math.floor((my - 30) / 22) * 5 + Math.floor((mx - 14) / 22);
        if (stashZone === 'bag' && invCur === idx) actStashSelection(); else { stashZone = 'bag'; invCur = idx; sfx('menu'); }
        return;
      }
      if (mx >= 196 && mx < 306) {
        const idx = Math.floor((my - 30) / 22) * 5 + Math.floor((mx - 196) / 22);
        if (stashZone === 'stash' && stashCur === idx) actStashSelection(); else { stashZone = 'stash'; stashCur = idx; sfx('menu'); }
        return;
      }
    }
    if (mx >= 224 && mx <= 300 && my >= 186 && my <= 202) { actStashSelection(); return; }
  } else if (mode === 'bestiary') {
    if (mx >= 276 && mx < 308 && my >= 10 && my <= 25) { mode = 'play'; sfx('menu'); return; }
    if (mx >= 14 && mx < 124 && my >= 34 && my < 122) {
      const idx = Math.floor((my - 34) / 22) * 5 + Math.floor((mx - 14) / 22);
      if (idx >= 0 && idx < bestiaryKeys().length) { bestCur = idx; sfx('menu'); }
    }
  } else if (mode === 'achieve') {
    if (mx >= 276 && mx < 308 && my >= 10 && my <= 25) { mode = 'play'; sfx('menu'); return; }
    if (mx >= 13 && mx < 118 && my >= 34 && my < 122) {
      const col = Math.floor((mx - 13) / 21);
      const row = Math.floor((my - 34) / 22);
      const idx = row * 5 + col;
      if (idx >= 0 && idx < ACHIEVE_KEYS.length) {
        if (achieveCur === idx) actAchieveSelection();
        else { achieveCur = idx; sfx('menu'); }
        return;
      }
    }
    if (mx >= 130 && mx <= 296 && my >= 184 && my <= 202) { actAchieveSelection(); return; }
  } else if (mode === 'play') {
    const gx = (e.clientX - rect.left) / rect.width * VW, gy = (e.clientY - rect.top) / rect.height * VH;
    if (gx >= 4 && gx <= 162 && gy >= 4 && gy <= 48) { mode = 'achieve'; achieveCur = 0; sfx('menu'); return; }
    if (gx >= 4 && gx <= 162 && gy >= 50 && gy <= 66) { startReload(); return; }
    if (gx >= VW - 88 && gx <= VW - 4 && gy >= 40 && gy <= 94) {
      if (gx < VW - 36) { mode = 'bestiary'; bestCur = 0; sfx('menu'); }
      else { mode = 'map'; sfx('menu'); }
      return;
    }
    const sx0 = (VW - (6 * 28 - 4)) / 2, sy = VH - 34;
    if (gy >= sy && gy <= sy + 26 && gx >= sx0 && gx <= sx0 + 6 * 28) {
      const si = Math.floor((gx - sx0) / 28);
      if (si === 0) attack();
      else if (si === 1) dodgeRoll();
      else if (si === 2) startReload();
      else if (si === 3) drinkPotion();
      else if (si === 4) useQuickItem();
      else if (si === 5) cyclePet();
    }
  }
});

// ================= Rendering =================
// text goes to the hi-res layer (see settings.js); x/y are still in 320x240 game pixels
function text(s, x, y, color = '#fff', align = 'left', font = FONT) {
  s = tr(String(s));
  const yo = settings.lang === 'th' ? -1.5 : 0;            // Thai face sits a little low; nudge it up
  uctx.font = fontFor(font); uctx.textAlign = align; uctx.textBaseline = 'top'; uctx.globalAlpha = ctx.globalAlpha;
  uctx.fillStyle = '#000'; uctx.fillText(s, (x + 1) * US, (y + 1 + yo) * US);
  uctx.fillStyle = color; uctx.fillText(s, x * US, (y + yo) * US);
  uctx.globalAlpha = 1;
}
// word-wrap to about n pixel-font characters wide; Thai has no spaces, so split it into words first
const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
const wrapCache = new Map();
// canvas fonts load lazily: preload both, and re-measure once they arrive so wraps aren't cached at fallback widths
if (document.fonts) {
  document.fonts.load(`${8 * US}px "Press Start 2P"`); document.fonts.load(`${15 * US}px "Black Ops One"`); document.fonts.load(`600 ${10 * US}px "Chakra Petch"`, 'ก');
  document.fonts.addEventListener('loadingdone', () => wrapCache.clear());
}
function wrap(s, n) {
  s = tr(String(s));
  const key = settings.lang + n + s;
  if (wrapCache.has(key)) return wrapCache.get(key);
  uctx.font = fontFor(FONT);
  const maxW = n * 8, words = SEG && /[฀-๿]/.test(s) ? [...SEG.segment(s)].map(x => x.segment) : s.split(/(\s+)/);
  const out = []; let line = '';
  for (const w of words) {
    if (line.trim() && uctx.measureText((line + w).trim()).width / US > maxW) { out.push(line.trim()); line = w.trimStart(); }
    else line += w;
  }
  if (line.trim()) out.push(line.trim());
  if (wrapCache.size > 500) wrapCache.clear();
  wrapCache.set(key, out);
  return out;
}
// full-screen dim; also wipes text already drawn underneath it
function shade(c) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = c; ctx.fillRect(0, 0, VW, VH); ctx.restore();
  clearText();
}
// ---- Military UI kit ----
// panel: an olive-drab steel plate (bevelled frame) around a dark display glass with faint scanlines,
// with corner brackets in the accent colour. Small panels (slots, portraits) get a full accent rim so
// the selected / ready state still reads at a glance.
const GOLD = '#e0c470', DIM = '#3c4430', KHAKI = '#c8c098', OLIVE = ['#7a8a52', '#4a5636', '#232918'];
function panel(x, y, w, h, border = GOLD, alpha = 0.94) {
  if (alpha > 0.8) clearText(x - 1, y - 1, w + 2, h + 2);   // a solid panel hides any text drawn under it
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = OLIVE[1]; ctx.fillRect(x, y, w, h);                                   // steel frame
  ctx.fillStyle = OLIVE[0]; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);          // bevel: lit top-left
  ctx.fillStyle = OLIVE[2]; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = `rgba(11,14,8,${alpha})`; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);   // display glass
  if (h > 12) { ctx.fillStyle = 'rgba(170,210,120,.035)'; for (let yy = y + 3; yy < y + h - 2; yy += 2) ctx.fillRect(x + 2, yy, w - 4, 1); }
  ctx.fillStyle = border;
  if (w <= 44 && h <= 44) {                                                               // slot: full accent rim
    ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
    return;
  }
  const L = Math.min(8, Math.floor(Math.min(w, h) / 3));                                // corner brackets
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w - 1, y, -1, 1], [x, y + h - 1, 1, -1], [x + w - 1, y + h - 1, -1, -1]]) {
    ctx.fillRect(sx > 0 ? cx : cx - L + 1, cy, L, 1); ctx.fillRect(sx > 0 ? cx : cx - L + 1, cy + sy, L, 1);
    ctx.fillRect(cx, sy > 0 ? cy : cy - L + 1, 1, L); ctx.fillRect(cx + sx, sy > 0 ? cy : cy - L + 1, 1, L);
  }
  ctx.fillStyle = '#8a8a78';                                                              // bolt heads
  for (const [bx, by] of [[x + 3, y + 3], [x + w - 4, y + 3], [x + 3, y + h - 4], [x + w - 4, y + h - 4]]) if (w > 60 && h > 30) ctx.fillRect(bx, by, 1, 1);
}
// bar: a segmented gauge with tick marks
function bar(x, y, w, h, f, c, bg) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  const fw = Math.round(w * clamp(f, 0, 1));
  ctx.fillStyle = c; ctx.fillRect(x, y, fw, h);
  if (h > 3 && fw > 0) { ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x, y, fw, 1); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x, y + h - 1, fw, 1); }
  if (h >= 5 && w >= 30) { ctx.fillStyle = 'rgba(0,0,0,.5)'; for (let sx = x + 6; sx < x + w; sx += 6) ctx.fillRect(sx, y, 1, h); }
}
// yellow/black hazard stripe band (banners)
function hazard(x, y, w, h) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#e8b828'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#16140c';
  for (let i = -h; i < w; i += 10) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + 5, y + h); ctx.lineTo(x + i + 5 + h, y); ctx.lineTo(x + i + h, y); ctx.fill(); }
  ctx.restore();
}
function drawSprite(img, x, y, flip) {
  x = Math.round(x) - (img.pad || 0); y = Math.round(y) - (img.pad || 0);
  if (!flip) return ctx.drawImage(img, x, y);
  ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore();
}
const tileHash = (x, y) => ((x * 7919) ^ (y * 104729)) >>> 0;

// Zoomed far out there are thousands of tiles on screen: the ground is then drawn from 16x16-tile chunk images,
// each repainted only when one of its tiles changes (gates, breaches, repairs...). Animated tiles hold still there.
const TCH = 16;
let tileCache = null;
const animTile = ch => ch === '~' || ch === 'x' || ch === 'm' || ch === 'L' || ch === 'Z' || ch === 'V' || ch === 'p' || ch === '6';
function drawTilesCached(cx, cy) {
  if (!tileCache || tileCache.map !== map) tileCache = { map, chunks: new Map() };
  const S = TCH * T;
  for (let ky = Math.max(0, Math.floor(cy / S)); ky <= Math.floor((cy + VH) / S) && ky * TCH < MH; ky++)
    for (let kx = Math.max(0, Math.floor(cx / S)); kx <= Math.floor((cx + VW) / S) && kx * TCH < MW; kx++) {
      const key = ky * 1000 + kx, x0 = kx * TCH, y0 = ky * TCH, x1 = Math.min(MW, x0 + TCH), y1 = Math.min(MH, y0 + TCH);
      let c = tileCache.chunks.get(key), dirty = !c;
      if (!c) { c = { img: mk(S), sig: [] }; tileCache.chunks.set(key, c); }
      else for (let ty = y0; ty < y1 && !dirty; ty++) for (let tx = x0; tx < x1; tx++) if (c.sig[(ty - y0) * TCH + tx - x0] !== map[ty][tx]) { dirty = true; break; }
      if (dirty) {
        const g = c.img.getContext('2d'); g.clearRect(0, 0, S, S);
        for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
          const ch = map[ty][tx], arr = TILES[ch];
          g.drawImage(animTile(ch) ? arr[0] : arr[tileHash(tx, ty) % arr.length], (tx - x0) * T, (ty - y0) * T);
          c.sig[(ty - y0) * TCH + tx - x0] = ch;
        }
      }
      ctx.drawImage(c.img, x0 * T - cx, y0 * T - cy);
    }
}
function drawWorld() {
  const sxOff = shake > 0 ? Math.round((R() - 0.5) * shake * 2) : 0, syOff = shake > 0 ? Math.round((R() - 0.5) * shake * 2) : 0;
  const cx = Math.round(camx) + sxOff, cy = Math.round(camy) + syOff;
  const tx0 = Math.floor(cx / T), ty0 = Math.floor(cy / T);
  if (VW * VH > 400000) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); drawTilesCached(cx, cy); }
  else for (let ty = ty0; ty <= ty0 + VH / T + 1; ty++) for (let tx = tx0; tx <= tx0 + VW / T + 1; tx++) {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) continue;
    const ch = map[ty][tx], arr = TILES[ch];
    const img = ch === '~' || ch === 'x' || ch === 'm' || ch === 'L' || ch === 'Z' || ch === 'V' || ch === 'p' || ch === '6' ? arr[Math.floor((frame + tx * 7) / (ch === '~' || ch === 'x' || ch === 'm' ? 28 : 8)) % 2] : arr[tileHash(tx, ty) % arr.length];
    ctx.drawImage(img, tx * T - cx, ty * T - cy);
  }
  if (inWorld()) { drawHelipads(cx, cy); drawMines(cx, cy); drawCraters(cx, cy); drawMountains(cx, cy); drawWallDamage(cx, cy); }   // shell craters (tank.js)   // mountains (mountains.js), cracked walls (invasion.js)                              // the mountain range north of the base (mountains.js)
  if (inWorld()) { drawCorpses(cx, cy); drawFallenBots(cx, cy); drawBuildFloor(cx, cy); }   // the fallen (recovery.js), wire and traps (build.js)                    // wire and traps lie flat under everyone (build.js)
  for (const pk of pickups) {
    const x = Math.round(pk.x - cx), y = Math.round(pk.y - cy + Math.sin(frame * 0.1 + pk.x) * 1.5);
    if (pk.kind === 'gear' && pk.item.rar >= 2) { ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.1; ctx.fillStyle = RAR[pk.item.rar].c; ctx.fillRect(x - 2, y - 44, 4, 40); ctx.globalAlpha = 1; }
    const icon = pk.kind === 'gold' ? ICON.gold : pk.kind === 'scrap' ? ICON.scrap : pk.kind === 'potion' ? ICON.potion : pk.kind === 'mat' || pk.kind === 'use' ? ICON[pk.id] : itemIcon(pk.item);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 5, y + 5, 10, 2);
    ctx.drawImage(icon, x - 8, y - 8);
  }
  // y-sorted actors
  const actors = enemies.filter(e => e.x + e.w > cx - 32 && e.x < cx + VW + 32 && e.y + e.h > cy - 32 && e.y < cy + VH + 32);
  if (inWorld()) actors.push(...NPCS, ...TANKS, ...SOLDIERS, ...TOW_TRUCKS, ...MEDICS, ...ENGINEERS, ...HOWITZERS, ...HUMVEES, ...RAID_TANKS, ...BTRS, ...QRFS, ...patrolMenInView(), ...buildsInView(cx, cy));
  const onTitle = !p || mode === 'title' || mode === 'class' || (mode === 'settings' && setFrom === 'title');
  if (inWorld() && !onTitle) actors.push(...bots.filter(b => botAlive(b) && b.x > cx - 32 && b.x < cx + VW + 32 && b.y > cy - 40 && b.y < cy + VH + 32));
  if (!onTitle && mode !== 'dead' && !spec) actors.push(p);         // the observer has no body (spectator.js)
  actors.sort((a, b) => (a.y + a.h) - (b.y + b.h));
  const shadow = (x, y, w) => {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - 1, y, w + 2, 3);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 2, y - 1, w - 4, 5); ctx.fillRect(x + 1, y, w - 2, 3);
  };
  const breathe = seed => Math.floor((frame + seed) / 36) % 2;   // 1px idle bob
  for (const a of actors) {
    if (a.tank) { drawTank(a, cx, cy); continue; }
    if (a.soldier) { drawSoldier(a, cx, cy); continue; }
    if (a.structure) { drawStructure(a, cx, cy); continue; }
    if (a.tow) { drawTowTruck(a, cx, cy); continue; }
    if (a.medic) { drawMedicTeam(a, cx, cy); continue; }
    if (a.engineer) { drawEngineer(a, cx, cy); continue; }
    if (a.howitzer) { drawHowitzer(a, cx, cy); continue; }
    if (a.humvee) { drawHumvee(a, cx, cy); continue; }
    if (a.btr) { drawBTR(a, cx, cy); continue; }
    shadow(a.x - cx, a.y + a.h - 3 - cy, a.w);
    if (a.spr) {
      drawSprite(a.spr, a.x - 2 - cx, a.y - 4 - cy + breathe(a.x), !!a.flip);
      if (a.id === 'outpost_guard')                       // bunker gunner: rifle aimed at its last target
        drawWeapon('rifle', a.x - 2 - cx + (a.flip ? 3 : 13), a.y - 4 - cy + 12 + breathe(a.x), a.aim || 0, false, { name: a.gun, plus: 0 }, a.fireT > 4);
      const mx = a.x + 6 - cx, my = a.y - 16 - cy;
      if (mode === 'play' && nearNpc() === a) text(a === MERCH ? 'E:TRADE' : 'E:TALK', mx, my, '#f8c838', 'center');
      else if (!onTitle) {
        const mk = npcMark(a);
        if (mk) text(mk[0], mx, my + Math.round(Math.sin(frame * 0.1) * 2), mk[1], 'center');
      }
    } else if (a.bot) {
      drawBot(a, cx, cy);
    } else if (a === p) {
      if (p.hurtT > 0 && Math.floor(p.hurtT / 4) % 2) continue;
      const f = Math.floor(p.anim / 10) % 2, look = HEROES[p.cls];
      if (p.buffT > 0) { ctx.fillStyle = 'rgba(255,140,40,.25)'; ctx.fillRect(Math.round(p.x - 4 - cx), Math.round(p.y - 6 - cy), 20, 20); }
      if (p.slowT > 0) { ctx.fillStyle = 'rgba(100,200,255,.28)'; ctx.fillRect(Math.round(p.x - 3 - cx), Math.round(p.y - 5 - cy), 18, 18); }
      const moving = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown || keys.KeyA || keys.KeyD || keys.KeyW || keys.KeyS;
      const bob = moving ? -(Math.floor(p.anim / 5) % 2) : breathe(0);
      const swinging = p.spinT > 0 || (p.atkT > 0 && weaponKind() === 'sword');
      // lunge a couple of pixels into the swing (finisher lunges further)
      const sa = p.aimA ?? DIR_ANG[p.dir], lt = swinging && p.spinT <= 0 ? Math.sin((1 - p.atkT / SWING) * Math.PI) * (p.combo === 2 ? 4 : 2) : 0;
      const sx = p.x - 2 - cx + Math.cos(sa) * lt, sy = p.y - 4 - cy + bob + Math.sin(sa) * lt;
      if (p.rollT > 0) {
        ctx.globalAlpha = 0.35;
        drawSprite((p.dir === 'up' ? look.up : look.down)[f], sx - p.rollVx * 1.5, sy - p.rollVy * 1.5, p.dir === 'left');
        ctx.globalAlpha = 1;
      }
      const held = swinging ? null : heldPose();
      if (held && held.behind) drawWeapon(held.kind, sx + held.hx, sy + held.hy, held.ang, held.sheathed);
      drawSprite((p.dir === 'up' ? look.up : look.down)[f], sx, sy, p.dir === 'left');
      if (held && !held.behind) drawWeapon(held.kind, sx + held.hx, sy + held.hy, held.ang, held.sheathed);
      if (p.spinT > 0) drawSwing(cx, cy, 1 - p.spinT / 18, true);
      else if (swinging) drawSwing(cx, cy, 1 - p.atkT / SWING, false);
      if (p.reloadT > 0) {
        bar(Math.round(p.x - 2 - cx), Math.round(p.y - 9 - cy), 16, 3, 1 - p.reloadT / (p.reloadMax || 48), '#ffd848', '#282010');
      } else if (!inSafeZone() && p.ammo <= Math.max(1, Math.floor(maxAmmo(p.weapon) * 0.2)) && Math.floor(frame / 18) % 2 === 0) {
        text('LOW AMMO [R]', Math.round(p.x + 6 - cx), Math.round(p.y - 11 - cy), '#ff6050', 'center');
      }
      if (p.title && ACHIEVEMENTS[p.title]) {
        const ach = ACHIEVEMENTS[p.title], tyOff = p.reloadT > 0 ? 19 : 14;
        text(`[${ach.title}]`, Math.round(p.x + 6 - cx), Math.round(p.y - tyOff - cy), ach.color || '#f8e090', 'center');
      }
      if (p.pet && PET_SPR[p.pet]) {
        const ps = PET_SPR[p.pet][Math.floor(petObj.anim / 12) % 2];
        const pyBob = Math.round(Math.sin(frame * 0.12) * 1.5);
        shadow(petObj.x - cx, petObj.y + 10 - cy, 12);
        drawSprite(ps, petObj.x - cx, petObj.y - 2 - cy + pyBob, petObj.face < 0);
      }
    } else {
      const e = a, frames = SPR[e.type], img = frames[Math.floor(e.anim / 14) % 2];
      const nk = nightK();
      if (nk > 0.2 && !e.d.dummy && !e.d.boss) {                // night frenzy: a red glow under every zombie
        ctx.fillStyle = `rgba(255,40,30,${(0.22 + Math.sin(frame * 0.15 + e.x) * 0.08) * nk})`;
        ctx.beginPath(); ctx.ellipse(e.x + e.w / 2 - cx, e.y + e.h - 2 - cy, e.w / 2 + 3, 4, 0, 0, 6.28); ctx.fill();
      }
      if (e.d.boss) {
        const ac = e.type === 'lich' ? '96,255,144' : e.type === 'frostwyrm' ? '96,224,255' : e.type === 'infernal' ? '255,112,32' : '255,64,48';
        ctx.strokeStyle = `rgba(${ac},${0.32 + Math.sin(frame * 0.1) * 0.15})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(e.x + e.w / 2 - cx, e.y + e.h - 2 - cy, 16 + Math.sin(frame * 0.08) * 2, 6, 0, 0, 6.28); ctx.stroke();
      } else if (e.elite) {
        const em = ELITE_MODS[e.elite];
        ctx.strokeStyle = em.c; ctx.globalAlpha = 0.55 + Math.sin(frame * 0.12) * 0.2; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(e.x + e.w / 2 - cx, e.y + e.h - 2 - cy, e.w / 2 + 4, 4, 0, 0, 6.28); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (e.enraged) { ctx.fillStyle = 'rgba(255,50,30,.24)'; ctx.fillRect(Math.round(e.x - 4 - cx), Math.round(e.y - 8 - cy), e.w + 8, e.h + 8); }
      if (e.slam > 0) {
        const ice = e.type === 'frostwyrm', fire = e.type === 'infernal', titan = e.type === 'titan';
        const maxT = titan ? 60 : ice ? 50 : fire ? 48 : 45, rad = titan ? 76 : ice ? 62 : fire ? 60 : 52;
        ctx.strokeStyle = `rgba(${ice ? '80,220,255' : fire ? '255,140,30' : '255,60,60'},${0.3 + (1 - e.slam / maxT) * 0.6})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy, rad * (1 - e.slam / (maxT + 15)), 0, 6.28); ctx.stroke();
      }
      const iw = spriteW(img), ih = spriteH(img);
      const hover = e.type === 'lich' || e.type === 'frostwyrm' ? Math.round(Math.sin(frame * 0.08) * 2) : 0;
      const sx = e.x + e.w / 2 - iw / 2 - cx, sy = e.y + e.h - ih - cy + hover + (e.slam > 0 ? (e.slam % 6 < 3 ? -1 : 1) : 0);
      const body = e.flash > 0 && e.flash % 4 < 2 ? whiteOf(img) : img;
      if (e.horde && e.swim) drawHordeBody(e, body, sx, sy, iw, ih); else drawSprite(body, sx, sy, e.face < 0);
      if (e.frozen > 0) { ctx.fillStyle = 'rgba(140,200,255,.45)'; ctx.fillRect(Math.round(sx), Math.round(sy), iw, ih); }
      if (e.elite) text('★', Math.round(e.x + e.w / 2 - cx), Math.round(sy - 9), ELITE_MODS[e.elite].c, 'center');
      if (e.hp < e.d.hp && !e.d.boss) bar(Math.round(e.x - cx), Math.round(e.y + e.h - ih - 5 - cy), e.w, 2, e.hp / e.d.hp, '#e04848', '#401010');
    }
  }
  if (inWorld()) { drawGarageRoof(cx, cy); drawTunnelRoof(cx, cy); }   // garage roof (patrol.js), the west tunnel bore (mountains.js)                  // vehicles inside the motor-pool garage (patrol.js)
  for (const q of parts) { ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), 2, 2); }
  const t = p && mode === 'play' ? p.target : null;
  if (t && !t.dead) {                                     // lock-on reticle
    const o = 2 + (frame % 30 < 15 ? 1 : 0), x0 = Math.round(t.x - cx) - o, y0 = Math.round(t.y - cy) - o, x1 = x0 + t.w + o * 2, y1 = y0 + t.h + o * 2;
    ctx.fillStyle = '#ff5050';
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      ctx.fillRect(sx > 0 ? x : x - 4, y, 4, 1); ctx.fillRect(x, sy > 0 ? y : y - 4, 1, 4);
    }
  }
  for (const q of projs) {
    const x = Math.round(q.x - cx), y = Math.round(q.y - cy);
    if (q.kind === 'arrow') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(q.vy, q.vx));
      ctx.fillStyle = '#d0b080'; ctx.fillRect(-6, 0, 10, 1); ctx.fillStyle = '#fff'; ctx.fillRect(4, -1, 3, 3);
      ctx.fillStyle = '#58d858'; ctx.fillRect(-7, -1, 2, 3); ctx.restore();
    } else if (q.kind === 'bullet') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(q.vy, q.vx));
      ctx.fillStyle = '#ffffff'; ctx.fillRect(1, -0.5, 3, 1);
      ctx.fillStyle = '#ffe060'; ctx.fillRect(-3, -0.5, 4, 1);
      ctx.fillStyle = '#ff8810'; ctx.fillRect(-7, 0, 4, 0.8);
      ctx.restore();
    } else if (q.kind === 'sniper') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(q.vy, q.vx));
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -0.5, 6, 1.5);
      ctx.fillStyle = '#80e0ff'; ctx.fillRect(-6, -0.5, 6, 1);
      ctx.fillStyle = '#3090e0'; ctx.fillRect(-13, 0, 7, 0.8);
      ctx.restore();
    } else if (q.kind === 'shotgun') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(q.vy, q.vx));
      ctx.fillStyle = '#fff4b0'; ctx.fillRect(-1, -1, 3, 2);
      ctx.fillStyle = '#ff8020'; ctx.fillRect(-3, -0.5, 2, 1);
      ctx.restore();
    } else if (q.kind === 'bolt') { ctx.fillStyle = '#a080ff'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 3, 3); }
    else if (q.kind === 'ice') { ctx.fillStyle = '#60e8ff'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 3, 3); }
    else { const s = frame % 4 < 2 ? 4 : 5; ctx.fillStyle = '#ff6020'; ctx.fillRect(x - s, y - s, s * 2, s * 2); ctx.fillStyle = '#ffd040'; ctx.fillRect(x - 2, y - 2, 5, 5); }
  }
  for (const r of rings) {
    ctx.globalAlpha = Math.min(1, r.t / 12); ctx.strokeStyle = r.c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(r.x - cx, r.y - cy, r.r, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (inWorld()) { drawBotShots(cx, cy); drawTankShells(cx, cy); drawArtilleryShells(cx, cy); drawRaidAir(cx, cy); drawAirstrikes(cx, cy); }
  for (const q of eprojs) {
    const x = Math.round(q.x - cx), y = Math.round(q.y - cy);
    ctx.fillStyle = q.c; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  if (inWorld()) drawBuildCursor(cx, cy);
  if (dungeon || (typeof rift !== 'undefined' && rift)) drawDark(cx, cy);
  if (mode === 'play') {
    const c = nearChest(), sh = nearShrine(), st = nearStash(), wl = nearWell(), rf = nearRiftPortal(), gt = nearGate();
    if (gt) { const gc = gateCenter(gt); text(gt.open ? 'E:CLOSE GATE' : 'E:OPEN GATE', gc.x - cx, gc.y - 18 - cy, gt.open ? '#ff9060' : '#58e858', 'center'); }
    else if (c) text('E:OPEN', c[0] * T + 8 - cx, c[1] * T - 10 - cy, '#f8c838', 'center');
    else if (sh) text('E:PRAY', sh[0] * T + 8 - cx, sh[1] * T - 10 - cy, '#60f0ff', 'center');
    else if (rf) text('E:ENTER RIFT', rf[0] * T + 8 - cx, rf[1] * T - 10 - cy, '#d080ff', 'center');
    else if (st) text('E:STASH', st[0] * T + 8 - cx, st[1] * T - 10 - cy, '#60c0ff', 'center');
    else if (wl) text('E:WELL', wl[0] * T + 8 - cx, wl[1] * T - 10 - cy, '#60c0ff', 'center');
  }
  for (const f of floats) text(String(f.txt), Math.round(f.x - cx), Math.round(f.y - cy), f.c, 'center');
  // gloom deepens as you travel east; overworld also has a smooth day/dusk/night cycle
  if (region) drawRegionFx(cx, cy);
  if (typeof rift !== 'undefined' && rift) drawRiftFx(cx, cy);
  if (inWorld()) drawDayNight(cx, cy);
  const gloom = !inWorld() ? 0 : clamp((camx + VW / 2 - (46 + OX) * T) / (24 * T), 0, 1) * 0.3;
  if (gloom > 0) { ctx.fillStyle = `rgba(16,0,40,${gloom})`; ctx.fillRect(0, 0, VW, VH); }
  drawWarp();
}

// crypt darkness: a black layer with soft holes cut around the player, torches and projectiles
const darkC = mk(); darkC.width = VW; darkC.height = VH;

// ---- Screen fitting ----
// Pick a whole-number zoom so the view is roughly 640x360 game pixels on a 1080p window (more world,
// smaller UI), never less than 320x240, then size the game canvas, the text layer and the darkness layer.
// mouse-wheel zoom (play and admin observer): a multiplier on the screen scale, remembered in the settings
const ZOOMS = [0.2, 0.25, 0.33, 0.4, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2];
let zoom = ZOOMS.includes(settings.zoom) ? settings.zoom : 1, zoomT = 0, zoomFit = false;
function fitScreen() {
  const r = document.getElementById('stage').getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
  const fitMax = Math.max(1, Math.floor(Math.min(w / 320, h / 240)));            // biggest zoom that keeps 320x240
  const base = clamp(Math.ceil(Math.max(w / 640, h / 400)), 1, fitMax);
  // zoomed in: at least 240x180 game px stay visible while playing; any menu (320x240) drops back to fit (zoomFit).
  // Zoomed out: as far as the whole world map (below 1 screen px per game px the browser shrinks the picture).
  const play = mode === 'play'; zoomFit = play;
  const scale = clamp(base * (play ? zoom : 1), Math.min(1, Math.max(w / (WW * T), h / (WH * T))),
    Math.max(1, play ? Math.min(w / 240, h / 180) : Math.min(w / 320, h / 240)));
  VW = Math.ceil(w / scale); VH = Math.ceil(h / scale); US = scale < 1 ? 1 : Math.max(2, Math.ceil(scale));   // keep the text layer small when zoomed far out
  cv.width = VW; cv.height = VH; ctx.imageSmoothingEnabled = false;
  ui.width = VW * US; ui.height = VH * US;
  darkC.width = VW; darkC.height = VH;
  wrapCache.clear();
}
addEventListener('resize', fitScreen);
function setZoom(dir) {
  const i = clamp(ZOOMS.indexOf(zoom) + dir, 0, ZOOMS.length - 1);
  if (ZOOMS[i] === zoom) return;
  const ox = camx + VW / 2, oy = camy + VH / 2;                     // keep the same spot in the middle of the screen
  const was = zoom, vw = VW;
  zoom = ZOOMS[i]; fitScreen();
  if (VW === vw) { zoom = was; fitScreen(); return; }                // already at the limit for this window size
  camx = clamp(ox - VW / 2, 0, Math.max(0, MW * T - VW)); camy = clamp(oy - VH / 2, 0, Math.max(0, MH * T - VH));
  zoomT = 90; settings.zoom = zoom;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
}
cv.addEventListener('wheel', e => {
  if (mode !== 'play' || (typeof build !== 'undefined' && build.on)) return;   // in build mode the wheel picks the structure (build.js)
  e.preventDefault();
  setZoom(e.deltaY < 0 ? 1 : -1);                                    // wheel up: zoom in
}, { passive: false });
// menus are designed in a 320x240 box; this is where that box sits on the current screen
const menuX = () => Math.floor((VW - 320) / 2), menuY = () => Math.floor((VH - 240) / 2);
function inMenuBox(fn, y = menuY()) {
  const x = menuX();
  ctx.save(); uctx.save(); ctx.translate(x, y); uctx.translate(x * US, y * US);
  try { fn(); } finally { ctx.restore(); uctx.restore(); }
}
const dg = darkC.getContext('2d');
function drawDark(cx, cy) {
  dg.globalCompositeOperation = 'source-over'; dg.fillStyle = 'rgba(4,2,10,0.94)'; dg.fillRect(0, 0, VW, VH);
  dg.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => {
    if (x < -r || y < -r || x > VW + r || y > VH + r) return;
    const g = dg.createRadialGradient(x, y, r * 0.25, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dg.fillStyle = g; dg.fillRect(x - r, y - r, r * 2, r * 2);
  };
  hole(p.x + 6 - cx, p.y + 6 - cy, 100);
  for (const t of torches) hole(t.x - cx, t.y + 8 - cy, 48 + Math.sin(frame * 0.2 + t.x) * 3);
  for (const q of projs) hole(q.x - cx, q.y - cy, 28);
  for (const q of eprojs) hole(q.x - cx, q.y - cy, 20);
  ctx.drawImage(darkC, 0, 0);
}
function drawRiftFx(cx, cy) {
  ctx.fillStyle = 'rgba(28, 8, 48, 0.22)';
  ctx.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 40; i++) {
    const sp = 0.25 + (i % 3) * 0.2;
    const x = ((i * 61 + Math.sin(frame * 0.02 + i * 1.7) * 12 - cx * 0.4) % VW + VW) % VW;
    const y = ((i * 89 - frame * sp - cy * 0.4) % VH + VH) % VH;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(216, 160, 255, 0.75)' : (i % 3 === 1 ? 'rgba(120, 220, 255, 0.65)' : 'rgba(255, 215, 120, 0.6)');
    ctx.fillRect(Math.round(x), Math.round(y), i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
}
const DAY_LEN = 10800; // 3-minute day/dusk/night cycle on the overworld
function dayState() {
  if (typeof rift !== 'undefined' && rift) return { lbl: `RIFT D${rift}`, col: '#c080ff', dusk: 0, night: 0 };
  if (dungeon) return { lbl: 'CRYPT', col: '#c090ff', dusk: 0, night: 0 };
  if (region === 'frostpeak') return { lbl: 'BLIZZARD', col: '#90e8ff', dusk: 0, night: 0 };
  if (region === 'emberfall') return { lbl: 'CALDERA', col: '#ff8040', dusk: 0, night: 0 };
  const t = (frame % DAY_LEN) / DAY_LEN;
  if (t < 0.45) return { lbl: 'DAY', col: '#ffd860', dusk: 0, night: 0 };
  if (t < 0.58) { const k = (t - 0.45) / 0.13; return { lbl: 'DUSK', col: '#ff9850', dusk: Math.sin(k * Math.PI), night: k * 0.85 }; }
  if (t < 0.88) return { lbl: 'NIGHT', col: '#90b8ff', dusk: 0, night: 0.85 };
  const k = (t - 0.88) / 0.12;
  return { lbl: 'DAWN', col: '#ffad70', dusk: Math.sin(k * Math.PI) * 0.7, night: (1 - k) * 0.85 };
}
function drawDayNight(cx, cy) {
  const st = dayState();
  if (st.dusk > 0) {
    ctx.fillStyle = `rgba(255,100,30,${(st.dusk * 0.18).toFixed(3)})`;
    ctx.fillRect(0, 0, VW, VH);
  }
  if (st.night > 0) {
    // moonlight: multiply the whole view by a cool blue so it gets darker and bluer evenly,
    // but every tile, monster and path stays readable (no spotlight circles)
    const k = st.night / 0.85, mix = c => Math.round(255 + (c - 255) * k);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${mix(110)},${mix(124)},${mix(190)})`;
    ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = 'source-over';
    drawBuildLights(cx, cy, k);                               // searchlights cut through the dark (build.js)
    // fireflies in Meadow & Dark Forest at night (drawn after the tint so they glow)
    ctx.fillStyle = '#d8ff70';
    for (let i = 0; i < 22; i++) {
      if ((frame + i * 19) % 44 < 14) continue;
      const fx = ((i * 73 + Math.sin(frame * 0.03 + i) * 14 - cx * 0.7) % VW + VW) % VW;
      const fy = ((i * 59 + Math.cos(frame * 0.025 + i * 2) * 10 - cy * 0.7) % VH + VH) % VH;
      ctx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
    }
  }
}
// ---- Weapons in hand ----
const weaponKind = () => hasGun() ? 'gun' : (p.weapon?.wt || CLASS_WT[p.cls] || 'rifle'); // rifle | sniper | heavy | gun
const inSafeZone = () => safeAt(p.x, p.y) && !hordeInBase();   // zombies over the wall: weapons out
const DIR_ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
let wasSheathed = null;
// where and how the weapon is held right now (offsets are in sprite pixels from the sprite's top-left)
function heldPose() {
  const kind = weaponKind(), d = p.dir, sheathed = inSafeZone() && p.atkT <= 0;
  if (sheathed !== wasSheathed) {                                       // draw / holstered
    if (wasSheathed !== null) { sfx(sheathed ? 'sheathe' : 'unsheathe'); burst(p.x + 6, p.y + 8, sheathed ? '#c8c8b0' : '#fff6c0', 6); }
    wasSheathed = sheathed;
  }
  const moving = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown || keys.KeyA || keys.KeyD || keys.KeyW || keys.KeyS;
  const sway = moving ? Math.sin(p.anim * 0.3) * 0.12 : Math.sin(frame * 0.05) * 0.04;   // weapon sways with steps
  if (sheathed) {
    return { kind, sheathed, behind: d !== 'up', hx: d === 'left' ? 11 : 5, hy: 9, ang: -0.9 };   // slung on back
  }
  const aiming = p.atkT > 0 || (p.aimA !== undefined && !inSafeZone());
  const hand = { down: [14, 11], right: [13, 11], left: [2, 11], up: [2, 10] }[d] || [13, 11];
  let ang = aiming && p.aimA !== undefined ? p.aimA : (DIR_ANG[d] + sway);
  const kick = p.atkT > 0 ? -1.8 : 0;
  return { kind, sheathed: false, behind: d === 'up', hx: hand[0] + Math.cos(ang) * kick, hy: hand[1] + Math.sin(ang) * kick, ang };
}
// draw a weapon with its grip at (x,y), pointing along ang. The model comes from js/guns.js and is
// picked by the weapon's name; wpn defaults to the player's weapon, firing to the player's shot timer.
function drawWeapon(kind, x, y, ang, sheathed, wpn = p.weapon, firing = p.atkT > 1) {
  drawGun(wpn, kind, x, y, ang, sheathed, firing);
}
// combat knife slash / firearm burst arc: eased arc with slash trail
function drawSwing(cx, cy, t, spin) {
  const e = 1 - (1 - t) ** 3, base = spin || p.aimA === undefined ? DIR_ANG[p.dir] : p.aimA;
  const rev = !spin && p.combo === 1, fin = !spin && p.combo === 2, span = fin ? 2.1 : 1.6;
  const a0 = spin ? base : rev ? base + span : base - span;
  const a1 = spin ? base + e * Math.PI * 2 : rev ? base + span - span * 2 * e : base - span + span * 2 * e;
  const ox = Math.round(p.x + 6 - cx), oy = Math.round(p.y + 6 - cy);
  const fade = Math.max(0, 1 - t * 1.1), start = spin ? a1 - 2.6 : a0, rOut = fin ? 25 : 21;
  ctx.save(); ctx.translate(ox, oy);
  if (fade > 0) {
    ctx.globalAlpha = (fin ? 0.65 : 0.5) * fade; ctx.fillStyle = fin ? '#fff6a0' : '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, rOut, start, a1, rev); ctx.arc(0, 0, 11, a1, start, !rev); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.9 * fade; ctx.strokeStyle = fin ? '#ff9a30' : p.weapon ? RAR[p.weapon.rar].c : '#fff'; ctx.lineWidth = fin ? 3 : 2;
    ctx.beginPath(); ctx.arc(0, 0, rOut - 1, rev ? Math.min(start, a1 + 0.5) : Math.max(start, a1 - 0.5), a1, rev); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  drawWeapon('rifle', ox + Math.cos(a1) * 9, oy + Math.sin(a1) * 9, a1, false);
}
function drawHud() {
  if (spec) { drawSpecHud(); drawHudFeed(VH - 70); return; }      // admin observer: no player panels (spectator.js)
  // player frame: portrait, level, HP / MP / XP
  panel(4, 4, 158, 44, GOLD, 0.85);
  panel(8, 8, 26, 26, DIM);
  ctx.drawImage(HEROES[p.cls].down[0], 12, 12);
  text('LV' + p.lvl, 21, 37, GOLD, 'center');
  bar(39, 9, 118, 10, p.hp / maxHp(), p.hp / maxHp() < 0.3 ? '#ff3030' : '#d83838', '#3c1418');
  text(`${p.hp}/${maxHp()}`, 98, 10, '#fff', 'center');
  bar(39, 23, 118, 6, p.mp / maxMp(), '#3890e8', '#10243c');
  bar(39, 33, 118, 3, p.xp / xpNeed(p.lvl), '#e8c048', '#3a3010');
  if (p.sp > 0 && Math.floor(frame / 30) % 2 === 0) text(`+${p.sp} SKILL PT [T]`, 39, 38, '#58e858');
  else if (p.title && ACHIEVEMENTS[p.title]) text(`[${ACHIEVEMENTS[p.title].title}]`, 98, 38, ACHIEVEMENTS[p.title].color || GOLD, 'center');

  // Tactical Firearm Ammo & Magazine HUD Panel
  const mxAmmo = maxAmmo(p.weapon), curAmmo = typeof p.ammo === 'number' ? p.ammo : mxAmmo;
  const lowAmmo = curAmmo <= Math.max(1, Math.floor(mxAmmo * 0.25));
  panel(4, 50, 158, 16, p.reloadT > 0 ? '#ffd848' : lowAmmo ? '#ff6050' : GOLD, 0.85);
  if (p.reloadT > 0) {
    const rProg = 1 - p.reloadT / (p.reloadMax || 48);
    bar(8, 54, 62, 8, rProg, '#ffd848', '#2a2210');
    text('RELOADING...', 157, 54, '#ffd848', 'right');
  } else {
    const pips = Math.min(15, mxAmmo), lit = Math.ceil((curAmmo / mxAmmo) * pips);
    for (let i = 0; i < pips; i++) {
      const px = 8 + i * 4;
      ctx.fillStyle = i < lit ? (lowAmmo ? '#ff6050' : '#f8d048') : '#262b1c';
      ctx.fillRect(px, 55, 2, 6);
      if (i < lit) { ctx.fillStyle = '#fff6b0'; ctx.fillRect(px, 54, 2, 1); }
    }
    text(`AMMO ${curAmmo}/${mxAmmo} [R]`, 157, 54, lowAmmo ? '#ff7060' : '#f0e8c0', 'right');
  }

  // gold + location (top-right)
  panel(VW - 86, 4, 82, 22, GOLD, 0.85);
  ctx.drawImage(ICON.gold, VW - 84, 7); text(String(p.gold), VW - 10, 11, GOLD, 'right');
  panel(VW - 152, 4, 64, 22, '#9a9aac', 0.85);                        // scrap for base building
  ctx.drawImage(ICON.scrap, VW - 150, 7); text(String(p.scrap || 0), VW - 94, 11, '#d0d0e0', 'right');
  text(zoneName.toUpperCase(), VW - 6, 30, '#c0c0a0', 'right');

  // boss bar or Colosseum Wave HUD
  const boss = enemies.find(e => e.d.boss && !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 250);
  if (boss) {
    const bx = Math.round(VW / 2 - 96), by = 6;
    panel(bx, by, 192, 28, boss.enraged ? '#ff4040' : GOLD, 0.9);
    panel(bx + 3, by + 3, 22, 22, DIM);
    ctx.drawImage(SPR[boss.type][Math.floor(frame / 16) % 2], bx + 4, by + 4, 20, 20);
    text(boss.d.name.toUpperCase(), bx + 108, by + 4, boss.enraged ? '#ff7050' : GOLD, 'center');
    bar(bx + 29, by + 15, 156, 8, boss.hp / boss.d.hp, boss.enraged ? '#ff4020' : '#d83838', '#3c1418');
    text(`${boss.hp}/${boss.d.hp}`, bx + 108, by + 16, '#fff', 'center');
  } else if (arena) {
    const bx = Math.round(VW / 2 - 70), by = 6;
    panel(bx, by, 140, 22, GOLD, 0.9);
    text(`WAVE ${arena}   BEST W${p.bestWave || 0}`, bx + 70, by + 4, '#ffd838', 'center');
    text(enemies.length ? `FOES LEFT: ${enemies.length}` : 'NEXT WAVE SOON...', bx + 70, by + 13, '#fff', 'center');
  } else if (typeof rift !== 'undefined' && rift) {
    const bx = Math.round(VW / 2 - 84), by = 6;
    panel(bx, by, 168, 24, '#c080ff', 0.9);
    text(`ABYSSAL RIFT D${rift}  [BEST ${p.bestRift || 0}]`, bx + 84, by + 3, '#e0b0ff', 'center');
    const modTxt = (typeof riftMod !== 'undefined' && riftMod) ? riftMod.name : 'VOID SURGE';
    const modCol = (typeof riftMod !== 'undefined' && riftMod) ? riftMod.color : '#c080ff';
    text(`ANOMALY: ${modTxt}`, bx + 84, by + 13, modCol, 'center');
  }

  // minimap (under the gold panel)
  panel(VW - 88, 40, 84, 54, GOLD, 0.9);
  drawMap(VW - 86, 42, 80, 50, (dungeon || (typeof rift !== 'undefined' && rift)) ? 1.5 : 1);
  drawRadarOverlay(VW - 86, 42, 80, 50);
  const ds = dayState();
  text(ds.lbl, VW - 8, 43, ds.col, 'right');                           // time of day: top-right corner of the radar
  if (nightK() > 0.3) text('FRENZY', VW - 8, 53, Math.floor(frame / 20) % 2 ? '#ff4040' : '#ff9090', 'right');   // night frenzy warning
  text('Y:MEDALS  X  N', VW - 6, 97, '#9a9a78', 'right');              // key hints under the radar

  // quest tracker (right)
  const track = [], q = storyQ(), b = p.bounty;
  if (p.sq && q) track.push([`${q.name} ${qProg(q)}/${q.n}`, storyReady()]);
  if (b) track.push([`Target: ${PLURAL[b.target]} ${b.prog}/${b.n}`, b.prog >= b.n]);
  if (track.length) {
    const qy = 110, w = 10 + Math.max(textW('OPERATIONS'), ...track.map(t => textW(t[0])));
    panel(VW - 4 - w, qy, w, track.length * 11 + 16, DIM, 0.7);
    text('OPERATIONS', VW - w + 2, qy + 4, GOLD);
    track.forEach(([s, done], i) => text(s, VW - w + 2, qy + 15 + i * 11, done ? '#58e858' : '#f0e0b0'));
  }

  // action bar (bottom centre): attack, dodge roll, reload, potion, quick consumable, companion pet
  const qs = quickStack(), qid = qs ? qs.id : (p.quickId || 'mpot');
  const slots = [
    { key:'SPC', icon: itemIcon(p.weapon || { kind:'weapon', wt: CLASS_WT[p.cls] }), count: p.reloadT > 0 ? 'R' : curAmmo,
      ready: p.cd <= 0 && p.reloadT <= 0 && curAmmo > 0, cd: p.reloadT > 0 ? p.reloadT / (p.reloadMax || 48) : p.cd / 26 },
    { key:'SHF', tag:'ROL', ready: p.rollCd <= 0, cd: p.rollCd / (90 * (1 - 0.2 * rank('roll'))) },
    { key:'R', tag:'RLD', ready: p.reloadT <= 0 && p.ammo < maxAmmo(p.weapon), cd: p.reloadT > 0 ? p.reloadT / (p.reloadMax || 48) : 0 },
    { key:'Q', icon: ICON.potion, count: p.potions, ready: p.potions > 0, cd: 0 },
    { key:'C', icon: ICON[qid], count: qs ? qs.count : 0, ready: !!qs, cd: 0 },
    { key:'V', icon: PET_SPR[p.pet || 'wolf'][0], ready: true, cd: 0 },
  ];
  const sx0 = (VW - (slots.length * 28 - 4)) / 2, sy = VH - 34;
  slots.forEach((s, i) => {
    const x = sx0 + i * 28;
    panel(x, sy, 24, 24, s.ready ? GOLD : DIM, 0.9);
    if (s.icon) ctx.drawImage(s.icon, x + 4, sy + 4);
    else text(s.locked ? s.lockTxt : s.tag, x + 12, sy + 8, s.locked ? '#6a6a58' : s.noMp ? '#6080c0' : '#fff', 'center');
    if (s.count !== undefined) text(String(s.count), x + 22, sy + 15, '#fff', 'right');
    if (s.lv > 1 && !s.locked) text(String(s.lv), x + 22, sy + 15, GOLD, 'right');   // skill level
    if (s.cd > 0) { ctx.fillStyle = 'rgba(0,0,0,.6)'; const h = Math.round(22 * clamp(s.cd, 0, 1)); ctx.fillRect(x + 1, sy + 23 - h, 22, h); }
    text(s.key, x + 12, sy + 26, '#9a9a78', 'center');
  });
  drawHudFeed(VH - 48);
}
// sector banner + radio log (shared with the observer HUD)
function drawHudFeed(logY) {
  if (banner) {                                                       // banner on a hazard-striped band
    const a = Math.min(1, banner.t / 30), by = Math.round(VH * 0.38), bw = Math.min(VW, textW(banner.txt.toUpperCase(), BIG) + 60);
    ctx.globalAlpha = a * 0.92;
    ctx.fillStyle = 'rgba(10,12,6,.85)'; ctx.fillRect(Math.round(VW / 2 - bw / 2), by - 8, bw, 32);
    hazard(Math.round(VW / 2 - bw / 2), by - 11, bw, 3); hazard(Math.round(VW / 2 - bw / 2), by + 24, bw, 3);
    ctx.globalAlpha = a; text(banner.txt.toUpperCase(), VW / 2, by, '#f0e2a8', 'center', BIG); ctx.globalAlpha = 1;
  }
  msgs.forEach((m, i) => {                                            // radio log: each line on a dark strip
    const y = logY - (msgs.length - 1 - i) * 11;
    ctx.globalAlpha = Math.min(1, m.t / 40);
    ctx.fillStyle = 'rgba(10,13,7,.62)'; ctx.fillRect(4, y - 2, textW(m.txt) + 12, 11);
    ctx.fillStyle = m.c; ctx.fillRect(4, y - 2, 2, 11);
    text(m.txt, 9, y, m.c); ctx.globalAlpha = 1;
  });
}
// radar look over the minimap: green grid, crosshair and a slow sweep
function drawRadarOverlay(x, y, w, h) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = 'rgba(120,255,120,.10)';
  for (let gx = x + 10; gx < x + w; gx += 10) ctx.fillRect(gx, y, 1, h);
  for (let gy = y + 10; gy < y + h; gy += 10) ctx.fillRect(x, gy, w, 1);
  ctx.fillStyle = 'rgba(120,255,120,.22)'; ctx.fillRect(x + (w >> 1), y, 1, h); ctx.fillRect(x, y + (h >> 1), w, 1);
  const cx = x + w / 2, cy = y + h / 2, a = frame * 0.04, R = Math.hypot(w, h) / 2;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(90,255,110,${0.09 - i * 0.014})`;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a - (i + 1) * 0.09, a - i * 0.09); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  text('RADAR', x + 2, y + 1, 'rgba(150,255,150,.8)');
}
function drawSkillHeader() {
  panel(8, 8, 304, 224);
  text('TACTICAL TRAINING TREE', 16, 14, GOLD);
  text(`POINTS ${p.sp}`, 304, 14, p.sp ? '#58e858' : '#8a8a70', 'right');
}
const SET_Y0 = 50, SET_DY = 15;
function drawSettings() {
  shade(setFrom === 'title' ? 'rgba(6,10,4,0.7)' : 'rgba(6,10,4,0.55)');
  panel(56, 22, 208, 196);
  text('SETTINGS', 160, 30, GOLD, 'center');
  settingsOpts().forEach((o, i) => {
    const y = SET_Y0 + i * SET_DY, sel = i === setCur;
    if (sel) { ctx.fillStyle = 'rgba(216,168,72,.2)'; ctx.fillRect(62, y - 4, 196, SET_DY - 2); }
    text(o.k, 70, y, sel ? '#fff' : '#b8b890');
    if (o.v !== undefined) {
      const c = o.v === 'OFF' ? '#ff8080' : o.k === 'DIFFICULTY' ? { EASY:'#58e858', NORMAL:'#f0e0b0', HARD:'#ff7050' }[o.v] : '#58e858';
      text(sel ? `< ${tr(o.v)} >` : o.v, 250, y, c, 'right');
    }
  });
  const dy = SET_Y0 + settingsOpts().length * SET_DY + 2;
  wrap(DIFF_DESC[settings.difficulty], 24).slice(0, 2).forEach((l, i) => text(l, 70, dy + i * 11, '#9098c8'));
  text('UP/DN:SELECT  L/R:CHANGE', 160, 206, '#707090', 'center');
}
function drawTree() {
  drawSkillHeader();
  const nodes = treeNodes(p.cls), heads = ['SURVIVAL', 'BALLISTICS', 'TACTICS'];
  heads.forEach((h, c) => text(h, 16 + c * 98 + 46, 32, '#c0c0e0', 'center'));
  for (const n of nodes) {
    const x = 16 + n.col * 98, y = 44 + n.tier * 44, r = rank(n.id), sel = n.col === treeCol && n.tier === treeTier;
    const lvLock = p.lvl < TIER_LVL[n.tier];
    if (n.tier > 0) { ctx.fillStyle = rank(nodes.find(m => m.col === n.col && m.tier === n.tier - 1).id) ? GOLD : DIM; ctx.fillRect(x + 45, y - 10, 2, 10); }
    panel(x, y, 92, 34, sel ? '#fff' : r >= n.max ? GOLD : r > 0 ? '#58a858' : DIM);
    text(n.name, x + 46, y + 7, lvLock ? '#6a6a58' : r ? '#fff' : '#c8c8b0', 'center');
    if (lvLock) text('LV' + TIER_LVL[n.tier], x + 46, y + 20, '#806060', 'center');
    else for (let i = 0; i < n.max; i++) {
      const px = x + 46 - n.max * 5 + i * 10;
      ctx.fillStyle = '#000'; ctx.fillRect(px - 1, y + 20, 10, 8);
      ctx.fillStyle = i < r ? GOLD : '#2a2840'; ctx.fillRect(px, y + 21, 8, 6);
    }
  }
  const n = nodes.find(m => m.col === treeCol && m.tier === treeTier), why = treeCheck(n);
  text(`${n.name}  ${rank(n.id)}/${n.max}`, 16, 180, GOLD);
  wrap(n.desc, 36).slice(0, 2).forEach((l, i) => text(l, 16, 193 + i * 11, '#e0e0f0'));
  text(why || 'ENTER: LEARN', 16, 218, why ? '#ff8080' : '#58e858');
  text('T: CLOSE', 304, 218, '#9a9a78', 'right');
}
function drawBag(sell) {
  panel(6, 6, 308, 228);
  // Header + Filter tabs + Sort + Close
  text(sell ? `SELL ${p.inv.length}` : `BAG ${p.inv.length}/${BAG}`, 14, 14, GOLD);
  const tabs = [[86, 30, 'ALL'], [118, 38, 'GEAR'], [158, 30, 'USE'], [190, 38, 'LOOT']];
  tabs.forEach(([tx, tw, lbl], i) => {
    const active = bagFilter === i;
    panel(tx, 11, tw, 13, active ? GOLD : DIM);
    text(lbl, tx + tw / 2, 14, active ? '#fff' : '#8080a0', 'center');
  });
  panel(232, 11, 40, 13, DIM); text('SORT', 252, 14, '#a0d8ff', 'center');
  panel(276, 11, 30, 13, DIM); text('ESC', 291, 14, '#ff9090', 'center');

  // Equipment Paper Doll row + Hero preview + Detailed Stats (y = 28..83)
  panel(14, 28, 20, 20, DIM);
  ctx.drawImage(HEROES[p.cls].down[Math.floor(frame / 20) % 2], 15, 29);
  GEAR_SLOTS.forEach((slot, i) => {
    const sx = 40 + i * 22, sy = 28, eq = p[slot], sel = !sell && bagZone === 'eq' && eqCur === i;
    ctx.fillStyle = sel ? '#fff' : eq ? itemColor(eq) : '#30325a'; ctx.fillRect(sx, sy, 20, 20);
    ctx.fillStyle = '#141634'; ctx.fillRect(sx + (sel ? 2 : 1), sy + (sel ? 2 : 1), sel ? 16 : 18, sel ? 16 : 18);
    if (eq) {
      ctx.drawImage(itemIcon(eq), sx + 2, sy + 2);
      if (eq.plus) text('+' + eq.plus, sx + 19, sy + 11, GOLD, 'right');
    }
    text(SLOT_LBL[slot], sx + 10, sy + 22, sel ? '#fff' : eq ? '#c0c0e0' : '#6a6a58', 'center');
  });
  // Right of Paper Doll: quick summary
  text(`${C().name.toUpperCase()} LV${p.lvl}`, 156, 30, GOLD);
  text(`GOLD ${p.gold}G`, 306, 30, GOLD, 'right');
  text(`HP ${p.hp}/${maxHp()}`, 156, 42, '#ff8080');
  text(`MP ${p.mp}/${maxMp()}`, 238, 42, '#60c0ff');
  if (p.title && ACHIEVEMENTS[p.title]) {
    text(`[${ACHIEVEMENTS[p.title].title}]`, 156, 53, ACHIEVEMENTS[p.title].color || GOLD);
    text(ACHIEVEMENTS[p.title].bonusDesc, 306, 53, '#58e858', 'right');
  } else {
    text('NO TITLE [Y]', 156, 53, '#707090');
    text('Titles (Y)', 306, 53, '#9a9a78', 'right');
  }
  text(`ATK ${atk()}  DEF ${def()}  CRT ${Math.round(critRate() * 100)}%  SPD +${Math.round(spdBonus() * 100)}%`, 14, 65, '#d0d0e8');
  ctx.fillStyle = DIM; ctx.fillRect(14, 76, 292, 1);

  // Bag 5x4 Grid (gx = 14, gy = 88)
  const gx = 14, gy = 88;
  for (let i = 0; i < BAG; i++) {
    const x = gx + (i % 5) * 22, y = gy + Math.floor(i / 5) * 22, it = p.inv[i];
    const sel = bagZone === 'bag' && i === invCur, match = matchFilter(it);
    ctx.fillStyle = sel ? '#fff' : it ? itemColor(it) : '#30325a'; ctx.fillRect(x, y, 20, 20);
    ctx.fillStyle = '#1c1e44'; ctx.fillRect(x + (sel ? 2 : 1), y + (sel ? 2 : 1), sel ? 16 : 18, sel ? 16 : 18);
    if (it) {
      if (!match) ctx.globalAlpha = 0.22;
      ctx.drawImage(itemIcon(it), x + 2, y + 2);
      if (it.count > 1) {
        ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(x + 9, y + 11, 10, 8);
        text(String(it.count), x + 19, y + 12, '#fff', 'right');
      } else if (isGear(it)) {
        const eq = p[it.kind], better = (it.kind !== 'weapon' || canWield(it)) && itemStat(it) > (eq ? itemStat(eq) : 0);
        if (better) { ctx.fillStyle = '#58e858'; ctx.fillRect(x + 15, y + 2, 3, 3); }
        if (it.plus) text('+' + it.plus, x + 2, y + 12, GOLD);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Item Inspector Panel (x = 128, y = 82, w = 178, h = 124)
  panel(128, 82, 178, 124, DIM);
  const it = bagZone === 'eq' ? p[GEAR_SLOTS[eqCur]] : p.inv[invCur];
  let y = 88;
  if (it) {
    for (const l of wrap(itemName(it), 20).slice(0, 2)) { text(l, 134, y, itemColor(it)); y += 11; }
    if (it.kind === 'mat') {
      text('MONSTER LOOT', 134, y, '#b8b890'); y += 13;
      text('Sell to merchant', 134, y, '#c8c8b0'); y += 11;
      text('for gold.', 134, y, '#c8c8b0'); y += 13;
    } else if (it.kind === 'use') {
      text('CONSUMABLE', 134, y, '#60c0ff'); y += 12;
      for (const l of wrap(CONSUMABLES[it.id].desc, 20).slice(0, 3)) { text(l, 134, y, '#d0d0e8'); y += 11; }
    } else {
      const tag = `${RAR[it.rar].tag} ${SLOT_LBL[it.kind]}${bagZone === 'eq' ? ' (EQ)' : ''}`;
      text(tag, 134, y, RAR[it.rar].c); y += 11;
      const st = itemStat(it), eq = p[it.kind], diff = st - (eq ? itemStat(eq) : 0);
      const pName = it.kind === 'weapon' ? 'ATK' : it.kind === 'ring' ? 'PWR' : 'DEF';
      text(`${pName} +${st}`, 134, y, '#fff');
      if (bagZone === 'bag') text(`(${diff >= 0 ? '+' : ''}${diff})`, 204, y, diff > 0 ? '#58e858' : diff < 0 ? '#ff6060' : '#9090a8');
      y += 11;
      if (it.kind === 'weapon') { text(`MAG ${maxAmmo(it)}   RLD ${(reloadFrames(it) / 60).toFixed(1)}s`, 134, y, '#ffd860'); y += 10; }
      else if (it.kind === 'helm') { text(`MAX HP +${st * 4}`, 134, y, '#ff9090'); y += 10; }
      else if (it.kind === 'boots') { text(`MOVE SPD +${Math.round(Math.min(25, 3 + st))}%`, 134, y, '#7ad858'); y += 10; }
      else if (it.kind === 'ring') { text(`ATK+${Math.ceil(st * 0.6)} MP+${st * 3} CRT+${2 * (it.rar + 1)}%`, 134, y, '#a0d8ff'); y += 10; }
      if (it.aff) for (const a of it.aff) { text(affixText(a), 134, y, AFFIXES[a[0]].c); y += 10; }
      if (it.kind === 'weapon' && !canWield(it)) { text(`${WT_CLASS[it.wt || 'sword']} ONLY`, 134, y, '#ff6060'); y += 10; }
    }
    text(`VALUE ${itemValue(it)}G`, 134, 173, GOLD);
    // Action buttons
    const actLbl = sell ? 'SELL' : bagZone === 'eq' ? 'UNEQUIP' : it.kind === 'use' ? 'USE' : isGear(it) ? 'EQUIP' : 'LOOT';
    const canAct = sell ? bagZone === 'bag' : (bagZone === 'eq' || it.kind !== 'mat');
    panel(132, 184, 82, 16, canAct ? GOLD : DIM);
    text(actLbl, 173, 189, canAct ? '#fff' : '#6a6a58', 'center');
    panel(220, 184, 80, 16, DIM);
    text(sell ? 'BACK' : bagZone === 'bag' ? 'DROP (X)' : '-', 260, 189, sell || bagZone === 'bag' ? '#ff9090' : '#6a6a58', 'center');
  } else {
    text(bagZone === 'eq' ? `EMPTY ${SLOT_LBL[GEAR_SLOTS[eqCur]]} SLOT` : '(EMPTY SLOT)', 134, 96, '#707090');
    text('Click or use arrows', 134, 114, '#505070');
    text('to select an item.', 134, 126, '#505070');
    if (sell) { panel(220, 184, 80, 16, DIM); text('BACK', 260, 189, '#ff9090', 'center'); }
  }
  text(sell ? 'ENT/CLICK:SELL  F:FILTER  R:SORT  ESC:BACK' : 'ENT/CLICK:ACT  X:DROP  F:FILTER  R:SORT', 160, 216, '#9a9a78', 'center');
}
function drawShop() {
  panel(24, 10, 272, 220);
  drawSprite(MERCHANT, 36, 18);
  text('MERCHANT & ANVIL', 160, 18, GOLD, 'center');
  text(`GOLD ${p.gold}G   HP POTIONS ${p.potions}`, 160, 32, '#f0e0b0', 'center');
  shopOpts().forEach((o, i) => text((i === shopCur ? '> ' : '  ') + o.t, 36, 48 + i * 11, i === shopCur ? '#fff' : '#b8b890'));
  ctx.fillStyle = DIM; ctx.fillRect(34, 174, 252, 1);
  wrap(shopMsg, 30).slice(0, 3).forEach((l, i) => text(l, 36, 180 + i * 11, '#f0e0b0'));
}
function drawCraft() {
  panel(6, 6, 308, 228);
  text('CRAFT GEAR', 14, 14, GOLD);
  text(`GOLD ${p.gold}G`, 268, 14, GOLD, 'right');
  panel(276, 11, 30, 13, DIM); text('ESC', 291, 14, '#ff9090', 'center');
  RECIPES.forEach((rec, i) => {
    const ry = 30 + i * 29, sel = i === craftCur, pr = makeRecipeItem(rec), ok = canCraft(rec);
    panel(12, ry, 138, 27, sel ? '#fff' : ok ? GOLD : DIM);
    ctx.drawImage(itemIcon(pr), 16, ry + 5);
    text(pr.name, 36, ry + 4, RAR[rec.rar].c);
    text(`${rec.gold}G`, 36, ry + 15, p.gold >= rec.gold ? '#f0e0b0' : '#ff6060');
  });
  panel(154, 30, 152, 176, DIM);
  const rec = RECIPES[craftCur], it = makeRecipeItem(rec), ok = canCraft(rec);
  let y = 36;
  text(it.name, 160, y, RAR[it.rar].c); y += 12;
  text(`${RAR[it.rar].tag} ${SLOT_LBL[it.kind]}`, 160, y, RAR[it.rar].c); y += 12;
  const pName = it.kind === 'weapon' ? 'ATK' : it.kind === 'ring' ? 'PWR' : 'DEF';
  text(`${pName} +${it.stat}`, 160, y, '#fff'); y += 11;
  if (it.kind === 'weapon') { text(`MAG ${maxAmmo(it)}   RLD ${(reloadFrames(it) / 60).toFixed(1)}s`, 160, y, '#ffd860'); y += 10; }
  else if (it.kind === 'helm') { text(`MAX HP +${it.stat * 4}`, 160, y, '#ff9090'); y += 10; }
  else if (it.kind === 'boots') { text(`MOVE SPD +${Math.round(Math.min(25, 3 + it.stat))}%`, 160, y, '#7ad858'); y += 10; }
  else if (it.kind === 'ring') { text(`ATK+${Math.ceil(it.stat * 0.6)} MP+${it.stat * 3} CRT+${2 * (it.rar + 1)}%`, 160, y, '#a0d8ff'); y += 10; }
  for (const a of it.aff) { text(affixText(a), 160, y, AFFIXES[a[0]].c); y += 10; }
  y += 4;
  text('MATERIALS:', 160, y, GOLD); y += 12;
  for (const [id, need] of rec.mats) {
    const have = matCount(id);
    ctx.drawImage(ICON[id], 160, y - 3);
    text(`${MATS[id].name} ${have}/${need}`, 178, y, have >= need ? '#58e858' : '#ff6060');
    y += 14;
  }
  panel(158, 188, 144, 14, ok ? GOLD : DIM);
  text(`CRAFT (${rec.gold}G)`, 230, 192, ok ? '#fff' : '#6a6a58', 'center');
  text(shopMsg || 'ENT/CLICK:CRAFT  ESC:BACK', 160, 216, '#9a9a78', 'center');
}
function drawStash() {
  panel(6, 6, 308, 228);
  text(`BAG ${p.inv.length}/${BAG}`, 14, 14, stashZone === 'bag' ? '#fff' : GOLD);
  text('TOWN STASH', 160, 14, '#60c0ff', 'center');
  text(`STASH ${p.stash.length}/${BAG}`, 268, 14, stashZone === 'stash' ? '#fff' : GOLD, 'right');
  panel(276, 11, 30, 13, DIM); text('ESC', 291, 14, '#ff9090', 'center');
  const drawGrid = (items, gx, gy, activeZone, curIdx) => {
    for (let i = 0; i < BAG; i++) {
      const x = gx + (i % 5) * 22, y = gy + Math.floor(i / 5) * 22, it = items[i];
      const sel = activeZone && i === curIdx;
      ctx.fillStyle = sel ? '#fff' : it ? itemColor(it) : '#30325a'; ctx.fillRect(x, y, 20, 20);
      ctx.fillStyle = '#1c1e44'; ctx.fillRect(x + (sel ? 2 : 1), y + (sel ? 2 : 1), sel ? 16 : 18, sel ? 16 : 18);
      if (it) {
        ctx.drawImage(itemIcon(it), x + 2, y + 2);
        if (it.count > 1) {
          ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(x + 9, y + 11, 10, 8);
          text(String(it.count), x + 19, y + 12, '#fff', 'right');
        } else if (isGear(it) && it.plus) text('+' + it.plus, x + 2, y + 12, GOLD);
      }
    }
  };
  drawGrid(p.inv, 14, 30, stashZone === 'bag', invCur);
  drawGrid(p.stash, 196, 30, stashZone === 'stash', stashCur);
  text(stashZone === 'bag' ? '>>' : '<<', 160, 62, GOLD, 'center', BIG);
  text('TAB', 160, 82, '#9a9a78', 'center');
  panel(14, 122, 292, 86, DIM);
  const it = stashZone === 'bag' ? p.inv[invCur] : p.stash[stashCur];
  if (it) {
    text(itemName(it), 20, 128, itemColor(it));
    if (isGear(it)) {
      const st = itemStat(it), pName = it.kind === 'weapon' ? 'ATK' : it.kind === 'ring' ? 'PWR' : 'DEF';
      text(`${RAR[it.rar].tag} ${SLOT_LBL[it.kind]}   ${pName} +${st}`, 20, 141, RAR[it.rar].c);
      if (it.aff) it.aff.forEach((a, k) => text(affixText(a), 20, 153 + k * 11, AFFIXES[a[0]].c));
    } else if (it.kind === 'use') text(CONSUMABLES[it.id].desc, 20, 141, '#d0d0e8');
    else text('MONSTER LOOT', 20, 141, '#b8b890');
    text(`VALUE ${itemValue(it)}G`, 20, 192, GOLD);
    panel(224, 186, 76, 16, GOLD);
    text(stashZone === 'bag' ? 'STORE' : 'TAKE', 262, 191, '#fff', 'center');
  } else text('(EMPTY SLOT)', 20, 134, '#707090');
  text('ENT/CLICK:TRANSFER  TAB:SWITCH  ESC:CLOSE', 160, 216, '#9a9a78', 'center');
}
function drawBestiary() {
  panel(6, 6, 308, 228);
  const keys = bestiaryKeys(), disc = keys.filter(k => killCount(k) > 0).length, mastCount = keys.filter(hasMastery).length;
  text('BESTIARY', 14, 14, GOLD);
  text(`FOUND ${disc}/${keys.length}   ★ ${mastCount}/${keys.length}`, 268, 14, '#f0e0b0', 'right');
  panel(276, 11, 30, 13, DIM); text('ESC', 291, 14, '#ff9090', 'center');
  for (let i = 0; i < 20; i++) {
    const x = 14 + (i % 5) * 22, y = 34 + Math.floor(i / 5) * 22, k = keys[i];
    const sel = i === bestCur, seen = k && killCount(k) > 0, mast = k && hasMastery(k);
    ctx.fillStyle = sel ? '#fff' : mast ? GOLD : seen ? '#58a0ff' : '#30325a'; ctx.fillRect(x, y, 20, 20);
    ctx.fillStyle = '#1c1e44'; ctx.fillRect(x + (sel ? 2 : 1), y + (sel ? 2 : 1), sel ? 16 : 18, sel ? 16 : 18);
    if (k) {
      const spr = SPR[k][0];
      if (!seen) ctx.globalAlpha = 0.22;
      ctx.drawImage(spr, x + 2, y + 2, 16, 16);
      ctx.globalAlpha = 1;
      if (mast) text('★', x + 19, y + 11, GOLD, 'right');
    }
  }
  panel(14, 126, 108, 82, DIM);
  text('HUNTER BONUS', 68, 134, GOLD, 'center');
  text('Slay 10 foes', 20, 150, '#c8c8b0');
  text('(or 1 Boss) to', 20, 162, '#c8c8b0');
  text('unlock Mastery:', 20, 174, '#c8c8b0');
  text('+15% DMG vs foe', 20, 190, '#58e858');

  panel(128, 34, 178, 174, DIM);
  const k = keys[bestCur], d = ETYPES[k], kills = killCount(k), seen = kills > 0, mast = hasMastery(k);
  const spr = SPR[k][Math.floor(frame / 16) % 2];
  panel(136, 42, 36, 36, mast ? GOLD : DIM);
  if (!seen) ctx.globalAlpha = 0.25;
  ctx.drawImage(spr, 138, 44, 32, 32);
  ctx.globalAlpha = 1;
  text(seen ? d.name : '???', 178, 44, d.boss ? '#ff7070' : GOLD);
  text(d.boss ? 'BOSS MONSTER' : 'MONSTER', 178, 56, d.boss ? '#ff9090' : '#b8b890');
  text(`SLAIN: ${kills}`, 178, 68, '#fff');
  const goal = masteryGoal(k);
  text(mast ? '★ MASTERY (+15% DMG)' : `MASTERY: ${kills}/${goal}`, 136, 86, mast ? '#58e858' : '#f8c838');
  bar(136, 98, 160, 5, kills / goal, mast ? '#58e858' : '#e8c048', '#2a2840');
  text(`HP ${d.hp}   ATK ${d.atk}   DEF ${d.def}`, 136, 112, '#d0d0e8');
  text(`XP ${d.xp}   GOLD ${d.gold[0]}-${d.gold[1]}G`, 136, 126, '#f0e0b0');
  text('DROP:', 136, 146, GOLD);
  const [matId, rate] = d.drop;
  if (MATS[matId]) {
    ctx.drawImage(ICON[matId], 136, 158);
    text(`${MATS[matId].name} (${Math.round(rate * 100)}%)`, 156, 162, '#c8c8b0');
  }
  text(`GEAR DROP: ${Math.round(d.gear * 100)}%`, 136, 184, '#a0d8ff');
  text('ARROWS/CLICK:SELECT  B/ESC:CLOSE', 160, 216, '#9a9a78', 'center');
}
function drawAchievements() {
  panel(6, 6, 308, 228);
  const unlocked = ACHIEVE_KEYS.filter(k => p.achieve && p.achieve[k]).length;
  text('ACHIEVEMENTS & TITLES', 14, 14, GOLD);
  text(`${unlocked}/${ACHIEVE_KEYS.length}`, 268, 14, '#f0e0b0', 'right');
  panel(276, 11, 30, 13, DIM); text('ESC', 291, 14, '#ff9090', 'center');

  // 5x4 Grid of Achievement Badges (20 slots)
  for (let i = 0; i < 20; i++) {
    const x = 13 + (i % 5) * 21, y = 34 + Math.floor(i / 5) * 22;
    const id = ACHIEVE_KEYS[i], ach = ACHIEVEMENTS[id];
    if (!id || !ach) continue;
    const isUnlocked = !!(p.achieve && p.achieve[id]);
    const isEquipped = p.title === id;
    const sel = i === achieveCur;

    ctx.fillStyle = sel ? '#fff' : isEquipped ? GOLD : isUnlocked ? (ach.color || '#58a0ff') : '#30325a';
    ctx.fillRect(x, y, 20, 20);
    ctx.fillStyle = isEquipped ? '#242010' : '#141634';
    ctx.fillRect(x + (sel ? 2 : 1), y + (sel ? 2 : 1), sel ? 16 : 18, sel ? 16 : 18);

    if (isUnlocked) {
      text('★', x + 10, y + 4, ach.color || GOLD, 'center');
      if (isEquipped) {
        ctx.fillStyle = GOLD; ctx.fillRect(x + 12, y + 12, 6, 6);
        text('E', x + 15, y + 11, '#000', 'center');
      }
    } else if (ach.secret) {
      text('?', x + 10, y + 5, '#8060a8', 'center');
    } else {
      text('·', x + 10, y + 3, '#404468', 'center');
    }
  }

  // Active Title Box (Bottom-Left)
  panel(13, 126, 106, 82, DIM);
  text('ACTIVE TITLE', 66, 131, GOLD, 'center');
  if (p.title && ACHIEVEMENTS[p.title]) {
    const curAch = ACHIEVEMENTS[p.title];
    text(`[${curAch.title}]`, 66, 146, curAch.color || GOLD, 'center');
    text(curAch.bonusDesc, 66, 161, '#58e858', 'center');
    text('EQUIPPED BONUS', 66, 178, '#9a9a78', 'center');
  } else {
    text('(NO TITLE)', 66, 146, '#6a6a58', 'center');
    text('Equip a title to', 66, 161, '#8080a0', 'center');
    text('gain stat bonus', 66, 175, '#8080a0', 'center');
  }

  // Inspector Panel (Right)
  panel(124, 34, 178, 174, DIM);
  const curId = ACHIEVE_KEYS[achieveCur], ach = ACHIEVEMENTS[curId];
  const isUnlocked = !!(p.achieve && p.achieve[curId]);
  const isEquipped = p.title === curId;

  // Header Badge
  panel(130, 40, 26, 26, isEquipped ? GOLD : isUnlocked ? (ach.color || GOLD) : DIM);
  text(isUnlocked ? '★' : ach.secret ? '?' : '·', 143, 46, isUnlocked ? (ach.color || GOLD) : '#6a6a58', 'center');

  // Name & Secret Tag
  const displayName = ach.secret && !isUnlocked ? '??? (SECRET)' : ach.name;
  text(displayName, 162, 42, isUnlocked ? GOLD : ach.secret ? '#c080ff' : '#b8b890');
  text(ach.secret ? 'SECRET ACHIEVEMENT' : 'ACHIEVEMENT', 162, 54, ach.secret ? '#ff70a0' : '#8080a0');

  // Divider
  ctx.fillStyle = '#22244a'; ctx.fillRect(130, 69, 166, 1);

  // Description
  let descY = 74;
  const descText = ach.secret && !isUnlocked ? 'Keep exploring to discover this secret feat.' : ach.desc;
  wrap(descText, 20).slice(0, 3).forEach(l => { text(l, 130, descY, '#d0d0e8'); descY += 11; });

  // Divider
  ctx.fillStyle = '#22244a'; ctx.fillRect(130, 110, 166, 1);

  // Title Reward
  text('TITLE REWARD:', 130, 116, '#9a9a78');
  text(`[${ach.title}]`, 130, 128, isUnlocked ? (ach.color || GOLD) : '#6a6a58');

  // Bonus
  text('EQUIPPED BONUS:', 130, 144, '#9a9a78');
  text(ach.bonusDesc, 130, 156, isUnlocked ? '#58e858' : '#6a6a58');

  // Action Button
  const btnText = isEquipped ? 'UNEQUIP TITLE' : isUnlocked ? 'EQUIP TITLE' : 'LOCKED';
  panel(130, 184, 166, 18, isEquipped ? '#ff9090' : isUnlocked ? GOLD : DIM);
  text(btnText, 213, 188, isUnlocked ? '#fff' : '#6a6a58', 'center');

  // Footer
  text('ARROWS/CLICK:SELECT  ENT:EQUIP  Y/ESC:CLOSE', 160, 216, '#9a9a78', 'center');
}
// U hides every HUD panel (stats, radar, hotbar, feed, raid/invasion bars) for a clean view of the battlefield
let hideUI = false, hideUIT = 0;
function toggleUI() { hideUI = !hideUI; hideUIT = 120; sfx('menu'); }
function draw() {
  if ((mode === 'play') !== zoomFit) fitScreen();                   // a menu opened/closed: switch between zoomed and menu-safe sizes
  clearText();
  drawWorld();
  if (inWorld()) drawImpactMarks(Math.round(camx), Math.round(camy));   // red artillery impact marks, above the night tint (artillery.js)
  const blink = Math.floor(frame / 30) % 2 === 0;
  if ((mode === 'settings' || mode === 'help') && setFrom === 'title' && (mode === 'settings' || helpReturn === 'settings')) return inMenuBox(drawSettings);
  if (mode === 'title' || mode === 'class') { shade(mode === 'title' ? 'rgba(6,10,4,0.6)' : 'rgba(6,10,4,0.75)'); return inMenuBox(() => drawTitle(blink)); }
  if (zoomT > 0 && mode === 'play') { zoomT--; text(`ZOOM ${Math.round(zoom * 100)}%`, VW / 2, VH - 44, '#f8e080', 'center'); }
  if (hideUI && mode === 'play') {                                   // also hides the admin observer panels (drawHud → drawSpecHud)
    if (hideUIT > 0) { hideUIT--; text('UI HIDDEN · PRESS U TO SHOW', VW / 2, 6, '#c8c8b0', 'center'); }
  } else {
    drawHud();
    drawRaidHud();
    drawInvasionHud();
    drawBuildUI();
  }
  if (mode === 'dialog') inMenuBox(() => drawDialog(blink), VH - 240);      // dialog box hugs the bottom edge
  else if (mode === 'bag') inMenuBox(() => drawBag(false));
  else if (mode === 'sell') inMenuBox(() => drawBag(true));
  else if (mode === 'shop') inMenuBox(drawShop);
  else if (mode === 'craft') inMenuBox(drawCraft);
  else if (mode === 'stash') inMenuBox(drawStash);
  else if (mode === 'bestiary') inMenuBox(drawBestiary);
  else if (mode === 'achieve') inMenuBox(drawAchievements);
  else if (mode === 'tree') inMenuBox(drawTree);
  else if (mode === 'settings' || (mode === 'help' && helpReturn === 'settings')) inMenuBox(drawSettings);
  else if (mode === 'map') drawWorldMap();
  else if (mode === 'pause') { shade('rgba(6,10,4,0.6)'); inMenuBox(() => text('PAUSED', 160, 108, '#fff', 'center', BIG)); }
  else if (mode === 'dead') {
    shade('rgba(40,0,0,0.6)');
    inMenuBox(() => {
      text('YOU HAVE FALLEN', 160, 90, '#ff6060', 'center', BIG);
      text(`Lost ${lostGold} gold`, 160, 118, '#f8c838', 'center');
      if (blink) text('ENTER: RETURN TO VILLAGE', 160, 140, '#fff', 'center');
    });
  }
}
function drawTitle(blink) {
  if (mode === 'title') {
    text('O: SETTINGS', 160, 214, '#9a9a78', 'center');
    text('V: ADMIN OBSERVER', 160, 192, '#60e0ff', 'center');
    hazard(40, 40, 240, 3); hazard(40, 76, 240, 3);
    text('OPERATION: IRONVALE', 160, 52, GOLD, 'center', BIG);
    text('TACTICAL PIXEL SHOOTER', 160, 86, '#9ad868', 'center');
    const heroSpr = HEROES[saved?.cls || 'assault'] || HEROES.assault;
    drawSprite(heroSpr.down[Math.floor(frame / 20) % 2], 152, 104);
    if (saved) {
      text(`OPERATIVE: LV ${saved.lvl}  ${saved.gold}G`, 160, 132, '#c8c8b0', 'center');
      if (blink) text('ENTER: CONTINUE OPERATION', 160, 152, '#fff', 'center');
      text('N: NEW CAMPAIGN', 160, 168, '#b8b890', 'center');
    } else if (blink) text('PRESS ENTER TO DEPLOY', 160, 150, '#fff', 'center');
    return;
  }
  if (mode === 'class') {
    text('CHOOSE YOUR SPECIALIZATION', 160, 18, GOLD, 'center');
    CLASS_KEYS.forEach((k, i) => {
      const c = CLASSES[k], x = 8 + i * 102, sel = i === classCur;
      panel(x, 36, 98, 180, sel ? GOLD : DIM);
      const hSpr = HEROES[k] || HEROES.assault;
      ctx.drawImage(hSpr.down[sel ? Math.floor(frame / 15) % 2 : 0], x + 31, 44, 36, 36);
      text(c.name.toUpperCase(), x + 49, 86, sel ? '#f8c838' : '#fff', 'center');
      text(`ARMOR ${c.hp[0] + c.hp[1]}`, x + 8, 102, '#ff8080');
      text(`ENERGY ${c.mp[0] + c.mp[1]}`, x + 8, 114, '#60c0ff');
      wrap(c.desc, 10).slice(0, 3).forEach((l, j) => text(l, x + 8, 130 + j * 11, '#c8c8b0'));
      text(`ROLE: ${c.role || CLASS_WT[k].toUpperCase()}`, x + 8, 172, '#a0d8ff');
    });
    if (blink) text('< >  ENTER: DEPLOY', 160, 224, '#fff', 'center');
  }
}
function drawDialog(blink) {
  {
    const d = dialogQ[0];
    panel(8, 150, 304, 84);
    panel(13, 164, 40, 40, DIM);
    ctx.drawImage(d.who.spr, 15, 166, 36, 36);
    text(d.who.name, 60, 158, GOLD);
    wrap(d.txt, 30).slice(0, 5).forEach((l, i) => text(l, 60, 172 + i * 11, /^(NEW QUEST|BOUNTY|เควสใหม่|ค่าหัว)/.test(l) ? '#58d858' : '#f0e0b0'));
    if (blink) text(dialogQ.length > 1 ? 'NEXT' : 'ENTER', 304, 224, '#f8c838', 'right');
  }
}
// big map: fills most of the screen, whatever its size
function drawWorldMap() {
  {
    const s = Math.min(dungeon ? 6 : 5, (VW - 40) / MW, (VH - 70) / MH), w = Math.round(MW * s), h = Math.round(MH * s), x = (VW - w) >> 1, y = Math.max(22, (VH - h) >> 1);
    panel(x - 4, y - 18, w + 8, h + 34);
    text(dungeon ? `CRYPT  FLOOR ${dungeon}` : region ? MAPS[region].name.toUpperCase() : 'WORLD MAP', VW / 2, y - 12, GOLD, 'center');
    drawMap(x, y, w, h, s);
    const legend = dungeon ? [['#a0e0ff', 'UP'], ['#ff60ff', 'DOWN'], ['#f8c838', 'CHEST'], ['#ff4040', 'FOE']]
      : region ? [['#60ff80', 'CHECKPT'], ['#ff40ff', 'BOSS'], ['#ff4040', 'FOE'], ['#fff', 'YOU']]
      : [['#f8f848', 'NPC'], ['#60ff80', 'CHECKPT'], ['#ff4040', 'FOE'], ['#fff', 'YOU']];
    legend.forEach(([c, l], i) => { const lx = x + i * (w / 4); ctx.fillStyle = c; ctx.fillRect(lx + 2, y + h + 5, 5, 5); text(l, lx + 10, y + h + 4, '#c8c8b0'); });
  }
}

// ================= Loop =================
fitScreen();
let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { const n = spec && mode === 'play' && !spec.paused ? spec.speed : 1; for (let i = 0; i < n; i++) update(); acc -= 1000 / 60; }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
