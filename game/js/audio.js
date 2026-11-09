// 声音全部现场合成：不重复的轻音乐、梳头声、雨声、编辫子的音符
const Snd = (() => {
  let ctx = null, master, music, sfx, verb, noise;
  let brushG, brushF, rainG;
  let timer = null, nextBar = 0, barIdx = 0;
  let braidIdx = 0;
  let enabled = true;

  // D 大调五声音阶
  const PENTA = [293.66, 329.63, 369.99, 440.0, 493.88];
  const noteAt = (i) => {
    const o = Math.floor(i / 5), d = ((i % 5) + 5) % 5;
    return PENTA[d] * Math.pow(2, o);
  };
  const BARS = [
    [146.83, 220.0, 293.66, 369.99, 554.37],
    [123.47, 185.0, 293.66, 369.99, 440.0],
    [98.0, 196.0, 293.66, 369.99, 493.88],
    [110.0, 220.0, 293.66, 329.63, 493.88],
  ];
  const BAR_LEN = 7.2;
  const BRAID_TUNE = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 3, 4, 5, 7, 5, 4, 2, 4, 5, 7, 9, 7, 5, 4, 3, 2, 1, 2, 0, 1, 2, 5];

  function makeImpulse(dur, decay) {
    const len = ctx.sampleRate * dur;
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  function makeNoise() {
    const len = ctx.sampleRate * 3;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = makeImpulse(3.2, 2.6);
    const vg = ctx.createGain(); vg.gain.value = 0.7; verb.connect(vg); vg.connect(master);
    music = ctx.createGain(); music.gain.value = 0.55; music.connect(master); music.connect(verb);
    sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
    const sv = ctx.createGain(); sv.gain.value = 0.55; sfx.connect(sv); sv.connect(verb);
    noise = makeNoise();

    const nb = ctx.createBufferSource(); nb.buffer = noise; nb.loop = true;
    brushF = ctx.createBiquadFilter(); brushF.type = 'bandpass'; brushF.frequency.value = 4200; brushF.Q.value = 0.7;
    brushG = ctx.createGain(); brushG.gain.value = 0;
    nb.connect(brushF); brushF.connect(brushG); brushG.connect(master);
    nb.start();

    const nr = ctx.createBufferSource(); nr.buffer = noise; nr.loop = true;
    const rf = ctx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 1500;
    const rh = ctx.createBiquadFilter(); rh.type = 'highpass'; rh.frequency.value = 300;
    rainG = ctx.createGain(); rainG.gain.value = 0;
    nr.connect(rf); rf.connect(rh); rh.connect(rainG); rainG.connect(master);
    nr.start();

    applySettings();
    nextBar = ctx.currentTime + 0.25;
    timer = setInterval(schedule, 400);
  }

  function pluck(f, t, vel, dest, dur) {
    dur = dur || 2.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + dur * 0.7);
    g.connect(lp); lp.connect(dest);
    const a = ctx.createOscillator(); a.type = 'triangle'; a.frequency.value = f;
    const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = f * 2.003;
    const bg = ctx.createGain(); bg.gain.value = 0.28;
    a.connect(g); b.connect(bg); bg.connect(g);
    a.start(t); b.start(t);
    a.stop(t + dur + 0.1); b.stop(t + dur + 0.1);
  }

  function pad(freqs, t, dur) {
    freqs.slice(0, 4).forEach((f, i) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05 - i * 0.006, t + 2.4);
      g.gain.setValueAtTime(0.05 - i * 0.006, t + dur - 1.4);
      g.gain.linearRampToValueAtTime(0, t + dur + 1.6);
      g.connect(music);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.detune.value = (i % 2 ? 1 : -1) * 3;
      o.connect(g); o.start(t); o.stop(t + dur + 1.8);
    });
  }

  function schedule() {
    if (!ctx || !enabled || !Store.data.settings.music) { if (ctx) nextBar = ctx.currentTime + 0.3; return; }
    while (nextBar < ctx.currentTime + 1.2) {
      const chord = BARS[barIdx % BARS.length];
      pad(chord, nextBar, BAR_LEN);
      pluck(chord[0] * 2, nextBar + 0.04, 0.07, music, 4);
      pluck(chord[2], nextBar + 0.6, 0.05, music, 4);
      const n = 2 + Math.floor(Math.random() * 3);
      let idx = 5 + Math.floor(Math.random() * 6);
      let t = nextBar + 1.3;
      for (let i = 0; i < n; i++) {
        pluck(noteAt(idx), t, 0.05 + Math.random() * 0.045, music, 3.2);
        t += 0.9 + Math.floor(Math.random() * 3) * 0.6;
        idx += [-2, -1, 1, 2][Math.floor(Math.random() * 4)];
        idx = clamp(idx, 4, 12);
      }
      nextBar += BAR_LEN;
      barIdx++;
    }
  }

  const can = () => ctx && enabled && Store.data.settings.sfx;

  function braidNote() {
    if (!can()) { braidIdx++; return; }
    const t = ctx.currentTime;
    const n = BRAID_TUNE[braidIdx % BRAID_TUNE.length];
    pluck(noteAt(n + 5), t, 0.2, sfx, 2.4);
    if (braidIdx % 4 === 0) pluck(noteAt(n), t, 0.08, sfx, 3);
    braidIdx++;
  }
  function resetTune() { braidIdx = 0; }

  function chime(i) {
    if (!can()) return;
    pluck(noteAt(5 + i), ctx.currentTime, 0.16, sfx, 2.2);
  }
  function arpeggio() {
    if (!can()) return;
    [5, 7, 9, 10, 12].forEach((d, i) => pluck(noteAt(d), ctx.currentTime + i * 0.11, 0.14, sfx, 2.6));
  }
  function pop() {
    if (!can()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(760, t + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.13, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 0.15);
  }
  function shutter() {
    if (!can()) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    s.connect(f); f.connect(g); g.connect(sfx); s.start(t); s.stop(t + 0.12);
  }

  function brush(level) {
    if (!ctx) return;
    const on = enabled && Store.data.settings.sfx;
    brushG.gain.setTargetAtTime(on ? clamp(level, 0, 1) * 0.13 : 0, ctx.currentTime, 0.04);
    brushF.frequency.setTargetAtTime(3200 + level * 2800, ctx.currentTime, 0.05);
  }

  function rain(on) {
    if (!ctx) return;
    rainG.gain.setTargetAtTime(on && enabled ? 0.16 : 0, ctx.currentTime, 0.7);
  }

  function applySettings() {
    if (!ctx) return;
    music.gain.setTargetAtTime(Store.data.settings.music && enabled ? 0.55 : 0, ctx.currentTime, 0.3);
  }

  function suspend() { if (ctx) ctx.suspend(); }
  function resume() { if (ctx) ctx.resume(); }
  function setEnabled(v) { enabled = v; applySettings(); }

  return { init, braidNote, resetTune, chime, arpeggio, pop, shutter, brush, rain, applySettings, suspend, resume, setEnabled };
})();
