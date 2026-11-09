// 小工具
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => t * t * (3 - 2 * t);
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const TAU = Math.PI * 2;

function hashRand(seed) {
  let t = (seed * 2654435761) >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hex2rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function rgb2hex(c) {
  const v = (x) => Math.round(clamp(x, 0, 1) * 255).toString(16).padStart(2, '0');
  return '#' + v(c[0]) + v(c[1]) + v(c[2]);
}

function shadeHex(h, f) {
  const c = hex2rgb(h);
  return rgb2hex([c[0] * f, c[1] * f, c[2] * f]);
}

function mixHex(a, b, t) {
  const x = hex2rgb(a), y = hex2rgb(b);
  return rgb2hex([lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]);
}

// 本机原生桥：浏览器里调试时用空实现
const Native = {
  has: () => typeof window.Android !== 'undefined',
  vibrate(ms, amp) {
    if (!Store.data.settings.haptics) return;
    if (this.has()) { try { window.Android.vibrate(ms | 0, amp | 0); } catch (e) {} }
  },
  saveImage(dataUrl, name) {
    if (this.has()) {
      try { return window.Android.saveImage(dataUrl, name); } catch (e) { return false; }
    }
    const a = document.createElement('a');
    a.href = dataUrl; a.download = name + '.png'; a.click();
    return true;
  },
  tilt() {
    if (this.has()) {
      try {
        const s = window.Android.tilt();
        const p = s.split(',');
        return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0];
      } catch (e) {}
    }
    return [0, 0];
  },
  exit() { if (this.has()) { try { window.Android.exit(); } catch (e) {} } },
};

// 存档：全部只留在这台手机上
const Store = {
  KEY: 'hair-before-long-v1',
  data: null,
  defaults() {
    return {
      onboarded: false,
      name: '',
      real: { cm: 15, date: null, goalCm: 72 },
      settings: { music: true, sfx: true, haptics: true },
      look: { skin: 1, eye: 0, eyeShape: 0, lip: 0, outfit: 0, freckle: false, mole: false, room: 'morning' },
      hair: {
        tipY: 200, wave: 0, part: 0, bang: 'air',
        dye: 'tea', custom: null, streak: null,
      },
      style: 'loose',
      tie: { type: 'scrunchie', color: 0, pattern: 'solid' },
      accessories: [],
      careCount: 0,
      seenGifts: [],
      album: [],
    };
  },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) {}
    const def = this.defaults();
    if (!d) { this.data = def; return; }
    const merge = (t, s) => {
      for (const k in s) {
        if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') merge(t[k], s[k]);
        else t[k] = s[k];
      }
      return t;
    };
    this.data = merge(def, d);
  },
  saveSoon() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.save(), 300);
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); return true; }
    catch (e) { return false; }
  },
};
