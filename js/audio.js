// ================= Audio =================
let ac = null, master, musicBus, sfxBus, toMusic = false, musicOn = true, musicTimer = null, nextT = 0, step = 0;
function initAudio() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = 0.15; master.connect(ac.destination);
  // separate buses so Settings can mute music and sound effects independently
  musicBus = ac.createGain(); sfxBus = ac.createGain(); musicBus.connect(master); sfxBus.connect(master);
  applyAudioSettings();
  if (mode !== 'title') startMusic();
}
function applyAudioSettings() {
  if (!ac) return;
  sfxBus.gain.value = settings.sfx ? 1 : 0;
  const onTitle = mode === 'title' || (mode === 'settings' && setFrom === 'title');
  if (settings.music && !onTitle) startMusic(); else stopMusic();
}
function tone(f, dur, type = 'square', vol = 0.4, slideTo = 0, at = 0) {
  if (!ac) return;
  const t = at || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(toMusic ? musicBus : sfxBus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, at = 0) {
  if (!ac) return;
  const t = at || ac.currentTime, b = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = b; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(g); g.connect(toMusic ? musicBus : sfxBus); s.start(t);
}
const seq = (fs, gap, type = 'square', len = 0.12, vol = 0.35) => fs.forEach((f, i) => tone(f, len, type, vol, 0, ac.currentTime + gap * i));
const SFX = {
  swing: () => { noise(0.07, 0.15); tone(500, 0.08, 'square', 0.12, 160); },
  hit:   () => tone(180, 0.08, 'square', 0.35, 60),
  kill:  () => { noise(0.15, 0.3); tone(300, 0.2, 'square', 0.25, 50); },
  coin:  () => { tone(1200, 0.05, 'square', 0.2); tone(1600, 0.12, 'square', 0.2, 0, ac.currentTime + 0.05); },
  item:  () => seq([660, 880], 0.06, 'square', 0.1, 0.25),
  rare:  () => seq([523, 659, 784, 1047, 1319], 0.06, 'square', 0.14, 0.3),
  hurt:  () => tone(220, 0.2, 'sawtooth', 0.35, 70),
  lvl:   () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.08, 'square', 0.14),
  potion:() => tone(400, 0.3, 'sine', 0.5, 900),
  buy:   () => { tone(880, 0.06, 'square', 0.25); tone(1320, 0.1, 'square', 0.25, 0, ac.currentTime + 0.06); },
  no:    () => tone(150, 0.15, 'square', 0.3),
  anvil: () => { tone(1800, 0.3, 'square', 0.2, 1700); noise(0.08, 0.4); tone(1800, 0.3, 'square', 0.2, 1700, ac.currentTime + 0.18); noise(0.08, 0.4, ac.currentTime + 0.18); },
  equip: () => seq([600, 900], 0.06, 'square', 0.08, 0.25),
  menu:  () => tone(700, 0.03, 'square', 0.15),
  die:   () => seq([440, 415, 392, 370, 330, 262, 196], 0.14, 'triangle', 0.2, 0.5),
  zap:   () => tone(900, 0.1, 'square', 0.15, 400),
  bow:   () => { noise(0.05, 0.2); tone(300, 0.06, 'triangle', 0.3, 600); },
  fire:  () => { tone(200, 0.25, 'sawtooth', 0.2, 500); noise(0.2, 0.15); },
  boom:  () => { noise(0.3, 0.5); tone(120, 0.3, 'square', 0.4, 40); },
  frost: () => { seq([1568, 1319, 1047, 784], 0.04, 'triangle', 0.15, 0.3); noise(0.3, 0.2); },
  whirl: () => tone(300, 0.3, 'sawtooth', 0.15, 900),
  cry:   () => seq([220, 330, 440], 0.07, 'sawtooth', 0.15, 0.3),
  dash:  () => { noise(0.12, 0.25); tone(200, 0.12, 'square', 0.15, 700); },
  roll:  () => { noise(0.08, 0.18); tone(260, 0.09, 'triangle', 0.18, 520); },
  combo: () => { noise(0.14, 0.25); tone(620, 0.14, 'sawtooth', 0.2, 140); },
  sheathe:   () => { tone(1400, 0.08, 'square', 0.08, 700); noise(0.05, 0.1); },
  unsheathe: () => { noise(0.06, 0.12); tone(900, 0.14, 'square', 0.1, 2400); },
  gun:   () => { noise(0.05, 0.35); tone(110, 0.06, 'square', 0.22, 45); },
  chest: () => seq([523, 659, 784, 1047, 1319], 0.06, 'square', 0.12, 0.3),
  stairs:() => seq([330, 262, 196, 165], 0.09, 'triangle', 0.15, 0.4),
  quest: () => seq([784, 988, 1175, 1568], 0.08, 'square', 0.12, 0.3),
};
const sfx = n => { if (ac && SFX[n]) SFX[n](); };
// Original tavern-style loop in D dorian, semitones above D4
const LEAD = [
  0,null,3,5,7,null,5,3,  2,null,0,null,-2,null,0,null,  3,null,5,7,9,null,7,5,  7,null,null,null,null,null,null,null,
  10,null,9,7,5,null,7,null, 9,null,7,5,3,null,2,null, 0,null,3,2,0,null,-2,null, 0,null,null,null,null,null,null,null];
const ROOTS = [0, -2, 3, -2, 0, -2, -5, 0], STEP = 0.14;
function schedule() {
  toMusic = true;
  const inCrypt = typeof dungeon !== 'undefined' && dungeon > 0;
  const reg = typeof region !== 'undefined' ? region : null;
  const stepDur = reg === 'emberfall' ? 0.12 : inCrypt ? 0.16 : STEP;
  const pitchMul = reg === 'frostpeak' ? 1.26 : reg === 'emberfall' ? 0.94 : inCrypt ? 0.84 : 1;
  const leadWave = reg === 'frostpeak' ? 'triangle' : inCrypt ? 'sawtooth' : 'square';
  const leadVol = inCrypt ? 0.08 : 0.12;
  while (nextT < ac.currentTime + 0.15) {
    const i = step % LEAD.length, n = LEAD[i];
    if (n !== null) tone(293.66 * pitchMul * 2 ** (n / 12), 0.13, leadWave, leadVol, 0, nextT);
    if (i % 2 === 0) tone(146.83 * pitchMul * 2 ** ((ROOTS[i >> 3] + (i % 4 ? 7 : 0) - 12) / 12), 0.12, 'triangle', 0.38, 0, nextT);
    nextT += stepDur; step++;
  }
  toMusic = false;
}
function startMusic() { stopMusic(); if (!ac || !musicOn) return; nextT = ac.currentTime + 0.05; step = 0; musicTimer = setInterval(schedule, 30); }
function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }
