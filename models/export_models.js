// Auto-exports every character, NPC, companion pet, monster, boss and gun in the game
// directly from js/graphics.js, js/guns.js, js/data.js, js/bots.js and maps/*.js into
// models/<category>/*.png, and rebuilds the gallery page models/index.html to match.
// Run anytime with: node models/export_models.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const rootDir = path.resolve(__dirname, '..');
const outRoot = __dirname;

// Minimal RGBA PNG encoder
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function parseColor(c) {
  if (!c || c[0] !== '#') return [0, 0, 0, 255];
  const n = parseInt(c.slice(1), 16);
  if (c.length === 4) {
    return [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17, 255];
  }
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

// Software 2D canvas mock that records real pixel data for art() & dimensional()
function createSoftCanvas(w = 16, h = 16) {
  const c = {
    _w: w, _h: h,
    get width() { return this._w; },
    set width(v) { this._w = v; this.data = new Uint8ClampedArray(this._w * this._h * 4); },
    get height() { return this._h; },
    set height(v) { this._h = v; this.data = new Uint8ClampedArray(this._w * this._h * 4); },
    data: new Uint8ClampedArray(w * h * 4),
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }),
    getContext() {
      const self = this;
      return {
        fillStyle: '#000000',
        imageSmoothingEnabled: false,
        fillRect(x, y, rw, rh) {
          const [r, g, b, a] = parseColor(this.fillStyle);
          for (let dy = 0; dy < rh; dy++) {
            const py = Math.floor(y + dy);
            if (py < 0 || py >= self._h) continue;
            for (let dx = 0; dx < rw; dx++) {
              const px = Math.floor(x + dx);
              if (px < 0 || px >= self._w) continue;
              const i = (py * self._w + px) * 4;
              self.data[i] = r; self.data[i + 1] = g; self.data[i + 2] = b; self.data[i + 3] = a;
            }
          }
        },
        drawImage(src, dx, dy) {
          if (!src || !src.data) return;
          for (let sy = 0; sy < src._h; sy++) {
            const py = Math.floor(dy + sy);
            if (py < 0 || py >= self._h) continue;
            for (let sx = 0; sx < src._w; sx++) {
              const px = Math.floor(dx + sx);
              if (px < 0 || px >= self._w) continue;
              const si = (sy * src._w + sx) * 4, di = (py * self._w + px) * 4;
              if (src.data[si + 3] > 0) {
                self.data[di] = src.data[si]; self.data[di + 1] = src.data[si + 1];
                self.data[di + 2] = src.data[si + 2]; self.data[di + 3] = src.data[si + 3];
              }
            }
          }
        },
        getImageData(x, y, iw, ih) {
          return { data: new Uint8ClampedArray(self.data) };
        },
        putImageData(imgData) {
          self.data = new Uint8ClampedArray(imgData.data);
        }
      };
    }
  };
  return c;
}

function flipH(spr) {
  const w = spr._w, h = spr._h, out = createSoftCanvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = (y * w + (w - 1 - x)) * 4, di = (y * w + x) * 4;
    out.data[di] = spr.data[si]; out.data[di + 1] = spr.data[si + 1];
    out.data[di + 2] = spr.data[si + 2]; out.data[di + 3] = spr.data[si + 3];
  }
  return out;
}

function scaleSprite(spr, scale = 8) {
  const w = spr._w * scale, h = spr._h * scale, out = createSoftCanvas(w, h);
  for (let y = 0; y < h; y++) {
    const sy = Math.floor(y / scale);
    for (let x = 0; x < w; x++) {
      const sx = Math.floor(x / scale);
      const si = (sy * spr._w + sx) * 4, di = (y * w + x) * 4;
      out.data[di] = spr.data[si]; out.data[di + 1] = spr.data[si + 1];
      out.data[di + 2] = spr.data[si + 2]; out.data[di + 3] = spr.data[si + 3];
    }
  }
  return out;
}

// trim fully transparent margins (gun models sit in a square canvas with empty space below)
function cropSprite(spr) {
  let x0 = spr._w, y0 = spr._h, x1 = -1, y1 = -1;
  for (let y = 0; y < spr._h; y++) for (let x = 0; x < spr._w; x++) {
    if (spr.data[(y * spr._w + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  if (x1 < 0) return spr;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = createSoftCanvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = ((y + y0) * spr._w + x + x0) * 4, di = (y * w + x) * 4;
    for (let k = 0; k < 4; k++) out.data[di + k] = spr.data[si + k];
  }
  return out;
}

function composeTurnaroundSheet(views, scale = 8) {
  const pad = 16, gap = 14;
  const scaled = views.map(v => scaleSprite(v.spr, scale));
  const maxH = Math.max(...scaled.map(s => s._h));
  const totalW = pad * 2 + scaled.reduce((s, x) => s + x._w, 0) + gap * (scaled.length - 1);
  const totalH = pad * 2 + maxH;
  const dst = createSoftCanvas(totalW, totalH);
  const g = dst.getContext();
  g.fillStyle = '#d8a848'; g.fillRect(0, 0, totalW, totalH);
  g.fillStyle = '#121024'; g.fillRect(2, 2, totalW - 4, totalH - 4);
  let cx = pad;
  for (const s of scaled) {
    const cy = pad + Math.floor((maxH - s._h) / 2);
    g.fillStyle = '#1e1c38'; g.fillRect(cx - 4, cy - 4, s._w + 8, s._h + 8);
    g.drawImage(s, cx, cy);
    cx += s._w + gap;
  }
  return dst;
}

// Load live game scripts into sandbox
const sandbox = {
  window: {},
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    getElementById: () => createSoftCanvas(320, 240),
    createElement: () => createSoftCanvas(16, 16),
    querySelectorAll: () => [],
    documentElement: { requestFullscreen: () => Promise.resolve() },
    fonts: { load: () => Promise.resolve(), addEventListener() {} }
  },
  localStorage: { getItem: () => null, setItem() {} },
  performance: { now: () => 0 },
  requestAnimationFrame() {},
  addEventListener() {},
  AudioContext: function() {},
  ImageData: function(d, w, h) { this.data = d; this.width = w; this.height = h; },
  Math, Date, console, Intl
};
vm.createContext(sandbox);

const mapFiles = fs.readdirSync(path.join(rootDir, 'maps')).filter(f => f.endsWith('.js')).map(f => path.join('maps', f));
const scripts = ['js/graphics.js', 'js/guns.js', 'js/audio.js', 'js/settings.js', 'js/lang-th.js', 'js/data.js', 'js/world.js', 'js/maps.js', ...mapFiles, 'js/bots.js'];
const combined = scripts.map(f => fs.readFileSync(path.join(rootDir, f), 'utf8')).join('\n');
vm.runInContext(combined, sandbox);

const { HEROES, CLASSES, NPCS, PET_SPR, PETS, SPR, ETYPES, GUN_MODELS, WEAPONS } =
  vm.runInContext('({ HEROES, CLASSES, NPCS, PET_SPR, PETS, SPR, ETYPES, GUN_MODELS, WEAPONS })', sandbox);

const MODELS = [];

// 1. Heroes (old class ids like knight/mage/ranger are aliases that draw the same sprite: skip those)
const heroSeen = [];
for (const [id, h] of Object.entries(HEROES)) {
  const px = h.down[0].data;
  if (heroSeen.some(d => d.length === px.length && d.every((v, i) => v === px[i]))) continue;
  heroSeen.push(px);
  const cName = CLASSES[id] ? CLASSES[id].name : id;
  MODELS.push({
    category: 'heroes',
    id,
    name: `${cName}`,
    size: `${h.down[0]._w - 2}x${h.down[0]._h - 2} px`,
    views: [
      { key: 'front_1', label: 'Front (Frame 1)', spr: h.down[0] },
      { key: 'front_2', label: 'Front (Frame 2)', spr: h.down[1] },
      { key: 'back_1',  label: 'Back (Frame 1)',  spr: h.up[0] },
      { key: 'back_2',  label: 'Back (Frame 2)',  spr: h.up[1] },
      { key: 'right_1', label: 'Right Side',      spr: h.down[0] },
      { key: 'left_1',  label: 'Left Side',       spr: flipH(h.down[0]) },
    ]
  });
}

// 2. Unique NPCs
const seenNpcIds = new Set();
for (const n of NPCS) {
  if (seenNpcIds.has(n.id)) continue;
  seenNpcIds.add(n.id);
  MODELS.push({
    category: 'npcs',
    id: n.id,
    name: n.name,
    size: `${n.spr._w - 2}x${n.spr._h - 2} px`,
    views: [
      { key: 'front_right', label: 'Front / Right', spr: n.spr },
      { key: 'front_left',  label: 'Front / Left',  spr: flipH(n.spr) },
    ]
  });
}

// 3. Companion Pets
for (const [id, frames] of Object.entries(PET_SPR)) {
  const pName = PETS[id] ? `${PETS[id].name} (LV ${PETS[id].lvl})` : id;
  MODELS.push({
    category: 'pets',
    id: `pet_${id}`,
    name: pName,
    size: `${frames[0]._w - 2}x${frames[0]._h - 2} px`,
    views: [
      { key: 'right_1', label: 'Right (Frame 1)', spr: frames[0] },
      { key: 'right_2', label: 'Right (Frame 2)', spr: frames[1] },
      { key: 'left_1',  label: 'Left (Frame 1)',  spr: flipH(frames[0]) },
      { key: 'left_2',  label: 'Left (Frame 2)',  spr: flipH(frames[1]) },
    ]
  });
}

// 4 & 5. Monsters & Bosses
for (const [id, frames] of Object.entries(SPR)) {
  const d = ETYPES[id] || { name: id };
  const isBoss = !!d.boss;
  MODELS.push({
    category: isBoss ? 'bosses' : 'monsters',
    id,
    name: d.name,
    size: `${frames[0]._w - 2}x${frames[0]._h - 2} px`,
    views: [
      { key: 'right_1', label: 'Right (Frame 1)', spr: frames[0] },
      { key: 'right_2', label: 'Right (Frame 2)', spr: frames[1] },
      { key: 'left_1',  label: 'Left (Frame 1)',  spr: flipH(frames[0]) },
      { key: 'left_2',  label: 'Left (Frame 2)',  spr: flipH(frames[1]) },
    ]
  });
}

// 6. Guns (js/guns.js): held model facing right / left, plus the bag icon
const WT_LABEL = { rifle: 'Assault Rifle', sniper: 'Sniper Rifle', heavy: 'Heavy Weapon' };
const gunType = name => {
  for (const wt of ['rifle', 'sniper', 'heavy']) {
    const i = (WEAPONS[wt] || []).findIndex(([n]) => n === name);
    if (i >= 0) return `${WT_LABEL[wt]} · Tier ${i + 1}`;
  }
  if (name.startsWith('Goliath ')) return 'Boss Crafted · Cryo Tier 5';
  if (name.startsWith('Omega ')) return 'Boss Crafted · Omega Tier 5';
  return 'Secret Weapon';
};
for (const [name, g] of Object.entries(GUN_MODELS)) {
  const held = cropSprite(g.img);
  MODELS.push({
    category: 'weapons',
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    name: `${name} (${gunType(name)})`,
    size: `${held._w - 2}x${held._h - 2} px`,
    views: [
      { key: 'right', label: 'Held (Right)', spr: held },
      { key: 'left',  label: 'Held (Left)',  spr: flipH(held) },
      { key: 'icon',  label: 'Bag Icon',     spr: g.icon },
    ]
  });
}

const CATEGORIES = [
  ['heroes', 'Operatives (ตัวละคร)'], ['weapons', 'Guns (ปืน)'], ['npcs', 'NPCs'], ['pets', 'Companions (คู่หู)'],
  ['monsters', 'Zombies (ซอมบี้)'], ['bosses', 'Bosses (บอส)'],
];
for (const [cat] of CATEGORIES) fs.mkdirSync(path.join(outRoot, cat), { recursive: true });

let files = 0;
for (const m of MODELS) {
  const scale = m.category === 'bosses' ? 5 : 8;
  const sheet = composeTurnaroundSheet(m.views, scale);
  fs.writeFileSync(path.join(outRoot, m.category, `${m.id}_all_angles.png`), encodePNG(sheet._w, sheet._h, sheet.data));
  files++;
  for (const v of m.views) {
    const single = scaleSprite(v.spr, scale);
    fs.writeFileSync(path.join(outRoot, m.category, `${m.id}_${v.key}.png`), encodePNG(single._w, single._h, single.data));
    files++;
  }
}

// Gallery page, rebuilt from the same list so it always matches the exported files
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sections = CATEGORIES.map(([cat, title]) => {
  const items = MODELS.filter(m => m.category === cat);
  if (!items.length) return '';
  const cards = items.map(m => `
      <article class="card">
        <h3>${esc(m.name)}</h3>
        <div class="meta">ID: <code>${esc(m.id)}</code> · ${esc(m.size)} · <code>models/${cat}/${esc(m.id)}_*.png</code></div>
        <img class="sheet" src="${cat}/${m.id}_all_angles.png" alt="${esc(m.name)} all angles">
        <div class="views">${m.views.map(v => `
          <figure><img src="${cat}/${m.id}_${v.key}.png" alt="${esc(v.label)}"><figcaption>${esc(v.label)}</figcaption></figure>`).join('')}
        </div>
      </article>`).join('');
  return `
    <section id="${cat}">
      <h2>${esc(title)} <span>${items.length}</span></h2>${cards}
    </section>`;
}).join('');
const nav = CATEGORIES.map(([cat, title]) => `<a href="#${cat}">${esc(title)}</a>`).join(' · ');
const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Model Gallery</title>
<style>
  body{margin:0;background:#0b0b1a;color:#e8e0c8;font-family:system-ui,"Segoe UI",Tahoma,sans-serif}
  header{padding:20px 24px;border-bottom:2px solid #d8a848}
  h1{margin:0 0 6px;color:#d8a848;font-size:22px} header p{margin:0;color:#9898b8;font-size:14px}
  nav{margin-top:10px;font-size:14px} nav a{color:#9fd0ff}
  section{padding:8px 24px 24px} h2{color:#9fd0ff;border-bottom:1px solid #2a2850;padding-bottom:6px}
  h2 span{color:#9898b8;font-size:14px;font-weight:normal}
  .card{background:#14132a;border:1px solid #2a2850;border-radius:6px;padding:14px;margin:12px 0}
  .card h3{margin:0 0 4px;color:#f0e0b0;font-size:16px} .meta{color:#9898b8;font-size:12px;margin-bottom:10px}
  code{color:#c0d8ff}
  img{image-rendering:pixelated;max-width:100%}
  .views{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}
  figure{margin:0;background:#1e1c38;padding:8px;border-radius:4px;text-align:center}
  figcaption{font-size:12px;color:#9898b8;margin-top:4px}
</style>
</head>
<body>
<header>
  <h1>Model Gallery</h1>
  <p>${MODELS.length} models · generated by <code>node models/export_models.js</code> from the game source</p>
  <nav>${nav}</nav>
</header>${sections}
</body>
</html>
`;
fs.writeFileSync(path.join(outRoot, 'index.html'), html);

console.log(`Exported ${MODELS.length} models (${files} PNG files) into ${outRoot}`);
for (const [cat] of CATEGORIES) console.log(`  ${cat}: ${MODELS.filter(m => m.category === cat).length}`);
