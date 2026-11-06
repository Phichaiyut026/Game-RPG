// ================= Settings, Difficulty & Text Layer =================
// Settings live in their own localStorage key so they survive New Game and are shared by every save.
const SETTINGS_KEY = 'ironvale-settings';
const settings = Object.assign({ music: true, sfx: true, lang: 'th', difficulty: 'normal' },
  (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } })());
musicOn = settings.music;
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  musicOn = settings.music; applyAudioSettings(); applyLangToPage(); textCache.clear();
}

// enemy hp / damage they deal, xp & gold you earn, share of gold lost on death
const DIFFS = {
  easy:   { hp: 0.7, dmg: 0.6, xp: 1.25, gold: 1.25, loss: 0 },
  normal: { hp: 1.0, dmg: 1.0, xp: 1.0,  gold: 1.0,  loss: 0.1 },
  hard:   { hp: 1.5, dmg: 1.5, xp: 1.3,  gold: 1.4,  loss: 0.2 },
};
const DIFF_KEYS = Object.keys(DIFFS);
const DIFF = () => DIFFS[settings.difficulty] || DIFFS.normal;

// ---- Text layer ----
// All text goes to a 3x-resolution canvas laid over the game. The pixel font stays crisp and Thai
// (which the pixel font can't draw) gets a real Thai typeface at a readable size.
const ui = document.getElementById('ui'), uctx = ui.getContext('2d');
let US = 3;                                   // text-layer pixels per game pixel (= screen scale, set by fitScreen)
const fontFor = f => settings.lang === 'th'
  ? `600 ${(f === BIG ? 15 : 10) * US}px "Chakra Petch", sans-serif`
  : f === BIG ? `${15 * US}px "Black Ops One", "Press Start 2P", monospace`   // military stencil for headings & banners
  : `${8 * US}px "Press Start 2P", monospace`;
function clearText(x, y, w, h) {
  if (x === undefined) { uctx.save(); uctx.setTransform(1, 0, 0, 1, 0, 0); uctx.clearRect(0, 0, ui.width, ui.height); uctx.restore(); }
  else uctx.clearRect(x * US, y * US, w * US, h * US);
}
function textW(s, font = FONT) { uctx.font = fontFor(font); return uctx.measureText(tr(String(s))).width / US; }

// tr(): English source string -> current language. Exact matches first, then patterns for
// strings with numbers/names in them. Anything unknown is shown as-is (English).
let TH = {}, TH_RX = [], TH_NAMES = {};
const trName = s => settings.lang === 'th' ? (TH_NAMES[s] ?? TH_NAMES[s.toUpperCase()] ?? s) : s;
const textCache = new Map();
function tr(s) {
  if (settings.lang !== 'th' || !s) return s;
  if (TH[s] !== undefined) return TH[s];
  const n = TH_NAMES[s]; if (n !== undefined) return n;
  if (textCache.has(s)) return textCache.get(s);
  let out = s;
  for (const [rx, rep] of TH_RX) if (rx.test(s)) { out = s.replace(rx, rep); break; }
  if (textCache.size > 2000) textCache.clear();
  textCache.set(s, out);
  return out;
}
function applyLangToPage() {
  document.body.classList.toggle('en', settings.lang === 'en');
  document.documentElement.lang = settings.lang;
}
applyLangToPage();
