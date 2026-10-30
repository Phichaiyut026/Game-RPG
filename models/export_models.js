// Auto-exports every character, NPC, companion pet, monster, and boss in Ironvale
// directly from js/graphics.js, js/data.js, and maps/*.js into models/<category>/*.png
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
const scripts = ['js/graphics.js', 'js/audio.js', 'js/settings.js', 'js/lang-th.js', 'js/data.js', 'js/world.js', 'js/maps.js', ...mapFiles];
const combined = scripts.map(f => fs.readFileSync(path.join(rootDir, f), 'utf8')).join('\n');
vm.runInContext(combined, sandbox);

const { HEROES, CLASSES, NPCS, PET_SPR, PETS, SPR, ETYPES } = vm.runInContext('({ HEROES, CLASSES, NPCS, PET_SPR, PETS, SPR, ETYPES })', sandbox);

const MODELS = [];

// 1. Heroes
for (const [id, h] of Object.entries(HEROES)) {
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

for (const cat of ['heroes', 'npcs', 'pets', 'monsters', 'bosses']) {
  fs.mkdirSync(path.join(outRoot, cat), { recursive: true });
}

for (const m of MODELS) {
  const scale = m.category === 'bosses' ? 5 : 8;
  const sheet = composeTurnaroundSheet(m.views, scale);
  fs.writeFileSync(path.join(outRoot, m.category, `${m.id}_all_angles.png`), encodePNG(sheet._w, sheet._h, sheet.data));
  for (const v of m.views) {
    const single = scaleSprite(v.spr, scale);
    fs.writeFileSync(path.join(outRoot, m.category, `${m.id}_${v.key}.png`), encodePNG(single._w, single._h, single.data));
  }
}

console.log(`Exported ${MODELS.length} models into ${outRoot}`);
