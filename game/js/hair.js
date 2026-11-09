// 头发（背后视角）：每一缕都是一根会摆动的绳子，发型只是给它们换一个“想待的位置”
const Hair = (() => {
  const NP = 7, NF = 20, N = NP + NF;
  // 从下往上画：底层披发 → 头皮上被拢起来的发丝 → 马尾/辫子/丸子
  const LAYER = { UNDER: 0, SCALP: 1, TAIL: 2 };

  // 长度地标：y 是发梢在身体上的高度，cm 是真实世界里大约的长度
  const MARKS = [
    { n: '刚剪短', y: -55, cm: 6 },
    { n: '耳朵', y: 45, cm: 15 },
    { n: '下巴', y: 200, cm: 28 },
    { n: '肩膀', y: 320, cm: 38 },
    { n: '锁骨', y: 400, cm: 44 },
    { n: '胸口', y: 560, cm: 55 },
    { n: '腰', y: 850, cm: 72 },
    { n: '臀', y: 1080, cm: 88 },
    { n: '大腿', y: 1370, cm: 108 },
    { n: '膝盖', y: 1680, cm: 130 },
  ];
  const MIN_Y = MARKS[0].y, MAX_Y = MARKS[MARKS.length - 1].y;

  function cmToY(cm) {
    for (let i = 0; i < MARKS.length - 1; i++) {
      const a = MARKS[i], b = MARKS[i + 1];
      if (cm <= b.cm) return lerp(a.y, b.y, clamp((cm - a.cm) / (b.cm - a.cm), 0, 1));
    }
    return MAX_Y;
  }
  function yToCm(y) {
    for (let i = 0; i < MARKS.length - 1; i++) {
      const a = MARKS[i], b = MARKS[i + 1];
      if (y <= b.y) return lerp(a.cm, b.cm, clamp((y - a.y) / (b.y - a.y), 0, 1));
    }
    return MARKS[MARKS.length - 1].cm;
  }
  function yToName(y) {
    let best = MARKS[0], d = 1e9;
    for (const m of MARKS) {
      const e = Math.abs(m.y - y);
      if (e < d) { d = e; best = m; }
    }
    return best.n;
  }

  const H = { tipY: 200, tipYT: 200, wave: 0, waveT: 0, style: 'loose' };
  const head = { x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0, tx: 0, ty: 0, ta: 0 };
  const grav = { x: 0, y: 0.3 };
  let time = 0;
  let locks = [];
  let ties = [];
  let styleDef = null;
  let dirty = true;
  let grab = null;

  // ---- 发型表 ----
  const STYLES = {
    loose: { name: '披发', kind: 'loose', ties: [] },
    high: {
      name: '高马尾', kind: 'tail',
      ties: [{ x: 0, y: -124, dx: 0.1, dy: 1, fall: 90, spread: 58, root: 'radial', rot: 0 }],
    },
    low: {
      name: '低马尾', kind: 'tail',
      ties: [{ x: 0, y: 128, dx: 0, dy: 1, fall: 60, spread: 52, root: 'radial', rot: 0 }],
    },
    twin: {
      name: '双马尾', kind: 'tail', part: true,
      ties: [
        { x: -134, y: -46, dx: -0.42, dy: 0.9, fall: 180, spread: 36, root: 'center', rot: 0.28 },
        { x: 134, y: -46, dx: 0.42, dy: 0.9, fall: 180, spread: 36, root: 'center', rot: -0.28 },
      ],
    },
    half: {
      name: '半扎蝴蝶结', kind: 'tail', only: 'top',
      ties: [{ x: 0, y: -66, dx: 0, dy: 1, fall: 60, spread: 42, root: 'radial', range: [1.25, 3.0], rot: 0, big: 1.25 }],
    },
    tufts: {
      name: '两个小揪揪', kind: 'tail', only: 'top', part: true,
      ties: [
        { x: -98, y: -138, dx: -0.78, dy: -0.5, fall: 80, spread: 22, root: 'center', yEnd: -44, tailMax: 135, rot: 0.75 },
        { x: 98, y: -138, dx: 0.78, dy: -0.5, fall: 80, spread: 22, root: 'center', yEnd: -44, tailMax: 135, rot: -0.75 },
      ],
    },
    bun: {
      name: '丸子头', kind: 'bun',
      ties: [{ x: 0, y: -150, dx: 0.2, dy: 1, fall: 60, spread: 40, root: 'radial', bx: 0, by: -26, rot: 0 }],
    },
    twinbun: {
      name: '双丸子', kind: 'bun', part: true,
      ties: [
        { x: -104, y: -140, dx: -0.3, dy: 0.9, fall: 60, spread: 30, root: 'center', bx: -22, by: -34, rot: 0.3 },
        { x: 104, y: -140, dx: 0.3, dy: 0.9, fall: 60, spread: 30, root: 'center', bx: 22, by: -34, rot: -0.3 },
      ],
    },
    braid: {
      name: '麻花辫', kind: 'braid',
      ties: [{ x: 0, y: 128, dx: 0, dy: 1, fall: 60, spread: 44, root: 'radial', rot: 0 }],
    },
    twinbraid: {
      name: '双麻花辫', kind: 'braid', part: true,
      ties: [
        { x: -112, y: 118, dx: -0.1, dy: 1, fall: 60, spread: 34, root: 'center', rot: 0 },
        { x: 112, y: 118, dx: 0.1, dy: 1, fall: 60, spread: 34, root: 'center', rot: 0 },
      ],
    },
    rope: {
      name: '打圈拧绳辫', kind: 'braid', rope: true,
      ties: [{ x: 0, y: 128, dx: 0, dy: 1, fall: 60, spread: 44, root: 'radial', rot: 0 }],
    },
  };

  // ---- 建缕 ----
  function makeLock(fam, o) {
    const l = Object.assign({
      fam, s: 0, q: 0, seed: Math.random(),
      tangle: 0, curl: 0, w: 0, wT: 0, tie: -1, alpha: 1, alphaT: 1,
      tailU: 0, bundle: -1, bMix: 0, shade: 1, W: 40, active: true, lifted: false, gp: null,
      x: new Float32Array(N), y: new Float32Array(N),
      ox: new Float32Array(N), oy: new Float32Array(N),
      rx: new Float32Array(N), ry: new Float32Array(N),
      ax: new Float32Array(N), ay: new Float32Array(N),
      bx: new Float32Array(N), by: new Float32Array(N),
      nx: new Float32Array(N), ny: new Float32Array(N),
      seg: new Float32Array(N), cum: new Float32Array(N), k: new Float32Array(N),
      tailLen: 0, inited: false,
    }, o);
    const r = hashRand(Math.floor(l.seed * 1e6));
    l.shade = 0.93 + r() * 0.13;
    l.lenVar = r() - 0.5;
    l.phase = r() * TAU;
    for (let i = NP; i < N; i++) {
      const t = (i - NP) / (NF - 1);
      l.nx[i] = (Math.sin(l.seed * 40 + i * 1.3) * 26 + (r() - 0.5) * 30) * (0.25 + t);
      l.ny[i] = (r() - 0.5) * 18 * (0.2 + t);
    }
    return l;
  }

  function build() {
    locks = [];
    const fam = (name, n, W, q) => {
      const arr = [];
      for (let i = 0; i < n; i++) {
        const s = lerp(-1, 1, i / (n - 1));
        arr.push(makeLock(name, { s, q: q + (i % 3) * 0.03, W }));
      }
      // 外侧先画，中间的盖在上面
      arr.sort((a, b) => Math.abs(b.s) - Math.abs(a.s));
      locks.push(...arr);
    };
    fam('under', 20, 62, 0);
    fam('mid', 20, 54, 0.5);
    fam('top', 26, 46, 0.94);
    for (let i = 0; i < 6; i++) {
      locks.push(makeLock('wisp', { s: lerp(-1, 1, i / 5), W: 7, alpha: 0, alphaT: 0 }));
    }
    dirty = true;
    rebuild(true);
  }

  // ---- 静止形状 ----
  function waveAt(s, t, l, amt) {
    if (amt <= 0.01) return 0;
    const lam = lerp(105, 40, clamp(amt / 2.4, 0, 1));
    const A = amt * (8 + 16 * t) * (0.7 + 0.5 * Math.sin(l.seed * 9));
    return A * Math.sin(s / lam + l.phase);
  }

  // 从背后看，再短的头发也会盖住后脑勺，所以短发只改变发尾停在后颈的位置
  function hemY() {
    return H.tipY < 200 ? lerp(105, 200, clamp((H.tipY + 55) / 255, 0, 1)) : H.tipY;
  }

  // 手指绕出来的小卷：越靠近发梢越卷
  function ringlet(s, t, l) {
    if (l.curl <= 0.01) return 0;
    return l.curl * (7 + 26 * t) * Math.sin(s / 27 + l.phase);
  }

  function curtainW(y) {
    return lerp(150, 198, sstep(130, 430, y)) - 16 * sstep(300, 900, y) - 34 * sstep(900, 1700, y);
  }

  function restLoose(l) {
    const x = l.ax, y = l.ay;
    if (l.fam === 'wisp') {
      // 把头发扎起来以后，后颈上留的几根小碎发
      const bx = l.s * 62;
      const by = 130 - Math.abs(l.s) * 12;
      const len = 26 + (l.seed * 22);
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        x[i] = bx + Math.sin(t * 2.6 + l.phase) * 7 * t + l.s * 8 * t;
        y[i] = by + len * t;
      }
      return;
    }
    const absS = Math.abs(l.s);
    const tipV = hemY();
    const tip0 = tipV + l.lenVar * clamp(Math.abs(tipV) * 0.2, 8, 170) + (1 - absS) * clamp(tipV * 0.05, 0, 40);
    const q = l.q, s = l.s;
    const Rx = lerp(164, 178, q), Ry = lerp(196, 214, q);
    const phi0 = lerp(1.0, -0.14, q);
    const phiFull = Math.PI / 2;
    const yFull = -Ry * Math.cos(phiFull);
    let phiEnd = tip0 >= yFull ? phiFull : Math.acos(clamp(-tip0 / Ry, -1, 1));
    phiEnd = Math.max(phiEnd, phi0 + 0.12);
    for (let i = 0; i < NP; i++) {
      const p = lerp(phi0, phiEnd, i / (NP - 1));
      x[i] = s * Rx * Math.sin(p);
      y[i] = -Ry * Math.cos(p);
    }
    const ex = x[NP - 1], ey = y[NP - 1];
    const Lf = Math.max(tip0 - ey, 6);
    const amt = H.wave;
    const shrink = 1 - clamp(l.curl, 0, 2.4) * 0.06;
    for (let j = 0; j < NF; j++) {
      const t = (j + 1) / NF, sv = Lf * t, yy = ey + sv * shrink;
      const w0 = curtainW(yy) * (0.92 + 0.08 * q);
      const narrow = 1 - 0.22 * t * t * clamp(Lf / 500, 0, 1);
      const xx = lerp(ex, s * w0, sstep(0, 220, sv)) * narrow;
      x[NP + j] = xx + waveAt(sv, t, l, amt) + ringlet(sv, t, l);
      y[NP + j] = yy;
    }
  }

  function pathLen(x, y, a, b) {
    let s = 0;
    for (let i = a; i < b; i++) s += Math.hypot(x[i + 1] - x[i], y[i + 1] - y[i]);
    return s;
  }
  function totalLen(l) { return pathLen(l.ax, l.ay, 0, N - 1); }

  function pinTo(l, T, px, py, bulge) {
    const x = l.bx, y = l.by;
    const cx = ((px + T.x) / 2) * bulge, cy = (py + T.y) / 2;
    for (let i = 0; i < NP; i++) {
      const t = i / (NP - 1), m = 1 - t;
      x[i] = m * m * px + 2 * m * t * cx + t * t * T.x;
      y[i] = m * m * py + 2 * m * t * cy + t * t * T.y;
    }
  }

  function restStyled(l) {
    const T = ties[l.tie];
    const def = T.def;
    const x = l.bx, y = l.by;
    const abS = Math.abs(l.s);
    const perim = (a) => [158 * Math.sin(a), -12 + 150 * Math.cos(a)];

    if (def.root === 'radial') {
      const r = def.range || [0, 3.0];
      const a = (l.s < 0 ? -1 : 1) * lerp(r[0], r[1], abS) + (l.q - 0.5) * 0.08;
      const p = perim(a);
      pinTo(l, T, p[0], p[1], 1.08);
    } else {
      // 中分：两边的头发从中缝出发，各自去自己的发圈
      const sg = T.x < 0 ? -1 : 1;
      if (l.fam === 'under') {
        const p = perim(sg * lerp(0.3, 2.6, abS));
        pinTo(l, T, p[0], p[1], 1.05);
      } else {
        const yEnd = def.yEnd !== undefined ? def.yEnd : 136;
        const u = clamp(abS * 0.96 + l.q * 0.04, 0, 1);
        pinTo(l, T, sg * 5, lerp(-208, yEnd, u), 1.12);
      }
    }

    // 自由段：从发圈往下
    const L0 = totalLen(l);
    const used = pathLen(x, y, 0, NP - 1);
    let Lt = Math.max(L0 - used * 0.55, 46);
    if (def.tailMax) Lt = Math.min(Lt, def.tailMax);
    if (T.kind === 'bun') Lt = Math.max(Lt * (1 - T.progress), 6);
    l.tailLen = Lt;
    let cx = T.x, cy = T.y;
    const step = Lt / NF;
    for (let j = 0; j < NF; j++) {
      const t = (j + 1) / NF, sv = Lt * t;
      const k = sstep(0, def.fall, sv);
      const dx = lerp(def.dx, 0, k), dy = lerp(def.dy, 1, k);
      const m = Math.hypot(dx, dy) || 1;
      const ndx = dx / m, ndy = dy / m;
      cx += ndx * step; cy += ndy * step;
      const prof = (0.3 + 0.7 * Math.sin(Math.PI * Math.min(t * 1.05 + 0.08, 1))) * (1 - 0.35 * t);
      const off = l.tailU * def.spread * prof;
      x[NP + j] = cx - ndy * off + waveAt(sv, t, l, H.wave * 0.8) + ringlet(sv, t, l) * 0.8;
      y[NP + j] = cy + ndx * off;
    }
  }

  function assignTies() {
    const def = styleDef;
    locks.forEach((l) => { l.tie = -1; l.bundle = -1; });
    if (!def || def.kind === 'loose') return;
    const groups = ties.map(() => []);
    let total = 0;
    locks.forEach((l) => {
      if (l.fam === 'wisp') return;
      total++;
      if (def.only && l.fam !== def.only) return;
      const t = ties.length === 2 ? (l.s < 0 ? 0 : 1) : 0;
      l.tie = t;
      groups[t].push(l);
    });
    groups.forEach((g, ti) => {
      const r = hashRand(ti + 13);
      g.forEach((l) => (l._o = r()));
      g.sort((a, b) => a._o - b._o);
      g.forEach((l, i) => {
        l.tailU = lerp(-1, 1, g.length > 1 ? i / (g.length - 1) : 0.5);
        l.bundleCand = Math.min(2, Math.floor(((l.tailU + 1) / 2) * 3));
      });
      ties[ti].frac = g.length / total;
    });
  }

  function layerFor(l) {
    if (l.tie >= 0 && l.w > 0.5) return [LAYER.SCALP, LAYER.TAIL];
    if (l.lifted || l.curl > 0.2) return [LAYER.TAIL, LAYER.TAIL];
    return [LAYER.UNDER, LAYER.UNDER];
  }

  function setStiff(l) {
    const wav = (H.wave + l.curl) * 0.012;
    for (let i = 0; i < N; i++) {
      if (i < NP) { l.k[i] = 1; continue; }
      const t = (i - NP) / (NF - 1);
      l.k[i] = l.fam === 'wisp' ? 0.2 : lerp(0.1, 0.012, Math.pow(t, 0.55)) + wav;
    }
  }

  function rebuild(snap) {
    for (const l of locks) {
      if (!l.active) continue;
      restLoose(l);
      if (l.tie >= 0) restStyled(l);
      else { l.bx.set(l.ax); l.by.set(l.ay); }
      if (!l.inited || snap) {
        for (let i = 0; i < N; i++) {
          l.rx[i] = lerp(l.ax[i], l.bx[i], l.w);
          l.ry[i] = lerp(l.ay[i], l.by[i], l.w);
          l.x[i] = l.ox[i] = head.x + l.rx[i];
          l.y[i] = l.oy[i] = head.y + l.ry[i];
        }
        l.inited = true;
      }
      setStiff(l);
    }
    dirty = false;
  }

  // ---- 发型流程 ----
  function setStyle(name, opts) {
    opts = opts || {};
    const def = STYLES[name];
    styleDef = def;
    H.style = name;
    ties = def.ties.map((d, i) => ({
      x: d.x, y: d.y, def: d, kind: def.kind, wraps: 0, visible: false, pop: 0,
      progress: 0, frac: 1, braid: null, rope: !!def.rope, index: i,
    }));
    assignTies();
    dirty = true;
    locks.forEach((l) => {
      l.wT = (l.tie >= 0 && opts.done) ? 1 : 0;
      if (opts.done) l.w = l.tie >= 0 ? 1 : 0;
      if (l.fam === 'wisp') l.alphaT = (def.kind === 'loose' || def.only) ? 0 : 1;
    });
    if (opts.done) {
      ties.forEach((t) => {
        t.visible = true;
        t.wraps = 3;
        if (t.kind === 'bun') t.progress = 1;
      });
      rebuild(false);
      if (def.kind === 'braid') ties.forEach((t) => Braid.start(t, true));
    } else {
      rebuild(false);
    }
  }

  function releaseAll() {
    grabEnd();
    ties.forEach((t) => {
      t.visible = false;
      if (t.braid) Braid.stop(t);
    });
    locks.forEach((l) => { l.wT = 0; l.bMix = 0; l.bundle = -1; });
  }

  function isHairOut() { return locks.every((l) => l.w < 0.03); }

  function gatherProgress() {
    let s = 0, n = 0;
    for (const l of locks) if (l.tie >= 0) { s += l.wT; n++; }
    return n ? s / n : 1;
  }

  function gatherAt(wx, wy, dist, tieIndex) {
    const R = 240;
    for (const l of locks) {
      if (l.tie < 0) continue;
      if (tieIndex !== undefined && tieIndex >= 0 && l.tie !== tieIndex) continue;
      let best = 1e9;
      for (let i = NP; i < N; i += 3) {
        const e = Math.hypot(l.x[i] - wx, l.y[i] - wy);
        if (e < best) best = e;
      }
      const f = best < R ? 1 - best / R : 0;
      l.wT = Math.min(1, l.wT + dist * (0.0009 + 0.005 * f));
    }
  }

  function finishGather(tieIndex) {
    for (const l of locks) {
      if (l.tie < 0) continue;
      if (tieIndex === undefined || tieIndex < 0 || l.tie === tieIndex) l.wT = 1;
    }
  }

  // ---- 手：抓住一把头发，打圈绕卷 ----
  function grabStart(wx, wy) {
    if (grab) grabEnd();
    const cand = [];
    for (const l of locks) {
      if (!l.active || l.fam === 'wisp' || l.bundle >= 0) continue;
      if (l.tie >= 0 && l.w < 0.9 && l.wT > 0) continue;
      let best = 1e9, bi = -1;
      for (let i = NP + 1; i < N; i++) {
        const d = Math.hypot(l.x[i] - wx, l.y[i] - wy);
        if (d < best) { best = d; bi = i; }
      }
      if (best < 115) cand.push({ l, a: bi, d: best, score: best - (l.fam === 'top' ? 40 : l.fam === 'mid' ? 18 : 0) });
    }
    if (!cand.length) return false;
    cand.sort((p, q) => p.score - q.score);
    const pts = cand.slice(0, 14).map((p) => ({
      l: p.l, a: p.a, w: clamp(1 - p.d / 150, 0.25, 1),
      ox: p.l.x[p.a] - wx, oy: p.l.y[p.a] - wy,
    }));
    grab = { x: wx, y: wy, angle: 0, twirl: 0, pts };
    pts.forEach((p) => { p.l.lifted = true; p.l.gp = p; });
    return true;
  }

  function grabMove(wx, wy) { if (grab) { grab.x = wx; grab.y = wy; } }

  function grabSpin(dTheta) {
    if (!grab) return;
    grab.angle += dTheta * 1.6;
    grab.twirl = Math.min(1, grab.twirl + Math.abs(dTheta) * 0.42);
    const add = Math.abs(dTheta) * 0.14;
    grab.pts.forEach((p) => { p.l.curl = Math.min(2.4, p.l.curl + add * p.w); });
    dirty = true;
  }

  function grabEnd() {
    if (!grab) return false;
    const twirled = grab.twirl > 0.3;
    grab.pts.forEach((p) => {
      const l = p.l;
      l.lifted = false; l.gp = null;
      if (twirled) {
        // 松手时弹一下
        for (let i = p.a; i < N; i++) l.oy[i] += 7;
      }
    });
    grab = null;
    return twirled;
  }

  function applyGrab(l, g) {
    const x = l.x, y = l.y, a = g.a;
    let tx = grab.x + g.ox * 0.42, ty = grab.y + g.oy * 0.42;
    const px = x[NP - 1], py = y[NP - 1];
    const maxLen = l.cum[a] - l.cum[NP - 1];
    const dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy);
    if (d > maxLen && d > 1e-3) { tx = px + (dx / d) * maxLen; ty = py + (dy / d) * maxLen; }
    const k = 0.4 + 0.6 * g.w;
    x[a] += (tx - x[a]) * k; y[a] += (ty - y[a]) * k;
  }

  function windAround(l, g) {
    const tw = grab.twirl;
    if (tw <= 0.02) return;
    const { x, y } = l;
    const n = Math.min(g.a + 8, N - 1);
    for (let j = g.a + 1; j <= n; j++) {
      const dj = j - g.a;
      const ang = grab.angle + dj * 1.15 + l.phase;
      const r = 13 + dj * 3.2;
      const tx = grab.x + Math.cos(ang) * r, ty = grab.y + Math.sin(ang) * r * 0.78;
      x[j] += (tx - x[j]) * 0.42 * tw;
      y[j] += (ty - y[j]) * 0.42 * tw;
    }
  }

  // ---- 手指 / 梳子 ----
  function push(wx, wy, vx, vy, R) {
    const R2 = R * R;
    const ms = Math.min(1, Math.hypot(vx, vy) / 80);
    for (const l of locks) {
      if (!l.active || l.bundle >= 0) continue;
      for (let i = NP; i < N; i++) {
        const dx = l.x[i] - wx, dy = l.y[i] - wy, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const f = 1 - Math.sqrt(d2) / R;
          l.ox[i] -= vx * f * (0.22 + 0.2 * ms);
          l.oy[i] -= vy * f * (0.22 + 0.2 * ms);
        }
      }
    }
    ties.forEach((T) => { if (T.braid) Braid.push(T, wx, wy, vx, vy, R); });
  }

  function comb(wx, wy, vx, vy) {
    const R = 120, R2 = R * R;
    const sp = Math.hypot(vx, vy);
    let hits = 0;
    const down = Math.max(0, vy);
    for (const l of locks) {
      if (!l.active || l.fam === 'wisp' || l.bundle >= 0) continue;
      let hit = 0;
      for (let i = NP; i < N; i++) {
        const dx = l.x[i] - wx, dy = l.y[i] - wy, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const f = 1 - Math.sqrt(d2) / R;
          l.ox[i] -= vx * f * 0.14;
          l.oy[i] -= vy * f * 0.14;
          hit = Math.max(hit, f);
        }
      }
      if (hit > 0) {
        if (l.tangle > 0) {
          const before = l.tangle;
          l.tangle = Math.max(0, l.tangle - (down * 0.0034 + sp * 0.0009) * hit);
          if (before > 0 && l.tangle === 0) hits++;
        }
        if (l.curl > 0) {
          l.curl = Math.max(0, l.curl - (down * 0.005 + sp * 0.001) * hit);
          dirty = true;
        }
      }
    }
    return hits;
  }

  function tangleAvg() {
    let s = 0, n = 0;
    for (const l of locks) if (l.active && l.fam !== 'wisp') { s += l.tangle; n++; }
    return n ? s / n : 0;
  }
  function setTangle(v) {
    for (const l of locks) {
      if (!l.active || l.fam === 'wisp') continue;
      l.tangle = v * (0.6 + Math.random() * 0.6);
    }
  }
  function clearCurls() {
    for (const l of locks) l.curl = 0;
    dirty = true;
  }

  function shake(power) {
    for (const l of locks) {
      if (!l.active) continue;
      for (let i = NP; i < N; i++) {
        const t = (i - NP) / NF;
        l.ox[i] += (Math.random() - 0.5) * power * t;
        l.oy[i] += (Math.random() - 0.5) * power * 0.5 * t;
      }
    }
  }

  // ---- 物理 ----
  function step() {
    time += 1 / 60;
    if (Math.abs(H.tipYT - H.tipY) > 0.1) { H.tipY += (H.tipYT - H.tipY) * 0.14; dirty = true; }
    if (Math.abs(H.waveT - H.wave) > 0.002) { H.wave += (H.waveT - H.wave) * 0.1; dirty = true; }

    const idleA = Math.sin(time * 0.55) * 0.012 + Math.sin(time * 0.23 + 1) * 0.008;
    const idleY = Math.sin(time * 1.1) * 2.2;
    head.va += (head.ta + idleA - head.a) * 0.07; head.va *= 0.82; head.a += head.va;
    head.vx += (head.tx - head.x) * 0.08; head.vx *= 0.8; head.x += head.vx;
    head.vy += (head.ty + idleY - head.y) * 0.08; head.vy *= 0.8; head.y += head.vy;

    for (const l of locks) {
      if (!l.active) continue;
      l.w += (l.wT - l.w) * 0.14;
      if (Math.abs(l.w - l.wT) < 0.002) l.w = l.wT;
      l.alpha += (l.alphaT - l.alpha) * 0.1;
    }
    if (dirty) rebuild(false);

    const ca = Math.cos(head.a), sa = Math.sin(head.a);
    const gust = Math.sin(time * 0.31) * Math.sin(time * 0.13 + 2);

    for (const T of ties) if (T.braid) Braid.simulate(T, ca, sa, head);

    for (const l of locks) {
      if (!l.active) continue;
      const e = easeInOut(l.w);
      const { x, y, ox, oy, rx, ry, k, seg, cum, ax, ay, bx, by, nx, ny } = l;
      const tg = l.tangle;
      for (let i = 0; i < N; i++) {
        const tx = lerp(ax[i], bx[i], e) + tg * nx[i];
        const ty = lerp(ay[i], by[i], e) + tg * ny[i];
        rx[i] += (tx - rx[i]) * 0.3;
        ry[i] += (ty - ry[i]) * 0.3;
      }
      cum[0] = 0;
      for (let i = 0; i < N - 1; i++) {
        seg[i] = Math.hypot(rx[i + 1] - rx[i], ry[i + 1] - ry[i]);
        cum[i + 1] = cum[i] + seg[i];
      }

      const inBundle = l.bundle >= 0;
      for (let i = 0; i < N; i++) {
        const tx = head.x + rx[i] * ca - ry[i] * sa, ty = head.y + rx[i] * sa + ry[i] * ca;
        if (i < NP) { x[i] = ox[i] = tx; y[i] = oy[i] = ty; continue; }
        if (inBundle) continue;
        const vx = (x[i] - ox[i]) * 0.965, vy = (y[i] - oy[i]) * 0.965;
        ox[i] = x[i]; oy[i] = y[i];
        const t = (i - NP) / NF;
        const wind = (Math.sin(time * 0.7 + l.seed * 6 + y[i] * 0.004) * 0.05 + gust * 0.05) * (0.3 + t);
        const kk = l.gp ? k[i] * 0.2 : k[i];
        x[i] += vx + (tx - x[i]) * kk + grav.x + wind;
        y[i] += vy + (ty - y[i]) * kk + grav.y;
      }

      if (inBundle) {
        Braid.place(l, ties[l.tie], NP, NF, x, y, ox, oy);
        continue;
      }

      const g = l.gp;
      if (g && grab && grab.twirl > 0.02) {
        // 绕在手指上的那几段变短，看起来像一圈圈缠住
        const end = Math.min(g.a + 8, N - 1);
        for (let i = g.a; i < end; i++) seg[i] *= lerp(1, 0.28, grab.twirl);
      }
      for (let it = 0; it < 3; it++) {
        if (g) applyGrab(l, g);
        for (let i = NP - 1; i < N - 1; i++) {
          const dx = x[i + 1] - x[i], dy = y[i + 1] - y[i];
          const d = Math.hypot(dx, dy) || 1e-4;
          const diff = (d - seg[i]) / d;
          if (i === NP - 1) { x[i + 1] -= dx * diff; y[i + 1] -= dy * diff; }
          else {
            x[i] += dx * diff * 0.5; y[i] += dy * diff * 0.5;
            x[i + 1] -= dx * diff * 0.5; y[i + 1] -= dy * diff * 0.5;
          }
        }
      }
      if (g && grab) { applyGrab(l, g); windAround(l, g); }
    }
  }

  // ---- 把线变成带状网格 ----
  const sx = new Float32Array(240), sy = new Float32Array(240), sc = new Float32Array(240);

  function catmull(px, py, cum, i0, i1, sub) {
    let m = 0;
    for (let i = i0; i < i1; i++) {
      const a = Math.max(i - 1, 0), b = i, c = i + 1, d = Math.min(i + 2, N - 1);
      for (let s = 0; s < sub; s++) {
        const t = s / sub, t2 = t * t, t3 = t2 * t;
        sx[m] = 0.5 * (2 * px[b] + (-px[a] + px[c]) * t + (2 * px[a] - 5 * px[b] + 4 * px[c] - px[d]) * t2 + (-px[a] + 3 * px[b] - 3 * px[c] + px[d]) * t3);
        sy[m] = 0.5 * (2 * py[b] + (-py[a] + py[c]) * t + (2 * py[a] - 5 * py[b] + 4 * py[c] - py[d]) * t2 + (-py[a] + 3 * py[b] - 3 * py[c] + py[d]) * t3);
        sc[m] = cum[b] + (cum[c] - cum[b]) * t;
        m++;
      }
    }
    sx[m] = px[i1]; sy[m] = py[i1]; sc[m] = cum[i1];
    return m + 1;
  }

  function ribbon(m, W, opt) {
    if (!G.hairVertRoom(m * 2 + 4)) return;
    const hy = head.y;
    let prevA = -1, prevB = -1;
    for (let i = 0; i < m; i++) {
      const ip = Math.max(i - 1, 0), iq = Math.min(i + 1, m - 1);
      let tx = sx[iq] - sx[ip], ty = sy[iq] - sy[ip];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const v = clamp(sc[i] / opt.total, 0, 1);
      const q = i / (m - 1);
      let w = W;
      if (opt.spindle) {
        w *= Math.pow(Math.sin(Math.PI * clamp(q, 0.001, 0.999)), 0.55);
      } else {
        w *= lerp(opt.rootW, 1, sstep(0, 0.1, v));
        if (opt.startTaper) w *= lerp(0.2, 1, sstep(0, 0.2, q));
        if (opt.endW < 1) w *= lerp(1, opt.endW, sstep(0.45, 1, q));
        if (opt.tipTaper) w *= Math.pow(clamp((1 - v) / opt.tipLen, 0, 1), 0.8);
      }
      w = Math.max(w, 0.2);
      const nx = -ty, ny = tx;
      const ly = sy[i] - hy;
      const a = G.hairVert(sx[i] + nx * w, sy[i] + ny * w, -1, v, opt.seed, opt.shade, ly, opt.alpha, opt.streak, W);
      const b = G.hairVert(sx[i] - nx * w, sy[i] - ny * w, 1, v, opt.seed, opt.shade, ly, opt.alpha, opt.streak, W);
      if (prevA >= 0) {
        G.hairTri(prevA, prevB, a);
        G.hairTri(prevB, b, a);
      }
      prevA = a; prevB = b;
    }
  }

  const ranges = [0, 0, 0, 0];
  const opt = { seed: 0, shade: 1, total: 1, alpha: 1, streak: 0, rootW: 0.5, tipTaper: true, spindle: false, tipLen: 0.42, endW: 1, startTaper: false };

  function emitLock(l, layer, sub) {
    const a = layerFor(l), pinL = a[0], freeL = a[1];
    if (layer !== pinL && layer !== freeL) return;
    opt.seed = l.seed;
    opt.total = l.cum[N - 1] || 1;
    opt.alpha = l.alpha;
    opt.streak = l.streakOn ? 1 : 0;
    opt.shade = l.shade * (l.fam === 'under' ? 0.85 : l.fam === 'mid' ? 0.93 : 1);
    opt.spindle = false; opt.tipLen = 0.42; opt.endW = 1; opt.startTaper = false;
    const W = l.W;
    const T = l.tie >= 0 ? ties[l.tie] : null;
    const styled = T && l.w > 0.5;
    const bundled = l.bundle >= 0;

    if (styled) {
      if (layer === pinL) {
        opt.tipTaper = false; opt.rootW = 0.3; opt.endW = 0.26;
        ribbon(catmull(l.x, l.y, l.cum, 0, NP - 1, sub), W, opt);
      }
      if (layer === freeL && !(T.kind === 'bun' && T.progress > 0.985)) {
        opt.tipTaper = true; opt.rootW = 1; opt.endW = 1;
        if (bundled && T.braid) { opt.shade *= T.braid.bundles[l.bundle].tint; opt.startTaper = true; }
        ribbon(catmull(l.x, l.y, l.cum, bundled ? NP : NP - 1, N - 1, sub), bundled ? 9.5 : W * 0.62, opt);
      }
      return;
    }
    if (pinL === freeL) {
      opt.tipTaper = true; opt.rootW = l.fam === 'wisp' ? 0.3 : 0.5;
      ribbon(catmull(l.x, l.y, l.cum, 0, N - 1, sub), W, opt);
      return;
    }
  }

  // 整个后脑勺先铺一层深色的底，发缕之间就不会露出空隙
  function emitCap() {
    const ca = Math.cos(head.a), sa = Math.sin(head.a);
    const yBot = H.style === 'loose' ? Math.min(140, hemY() + 8) : 140;
    const m = 18;
    for (let i = 0; i < m; i++) {
      const t = i / (m - 1);
      const ly = lerp(-224, yBot, t);
      sx[i] = head.x - ly * sa; sy[i] = head.y + ly * ca; sc[i] = 0.06;
    }
    opt.seed = 0.31; opt.shade = 0.72; opt.total = 1; opt.alpha = 1; opt.streak = 0;
    opt.spindle = true; opt.tipTaper = false; opt.endW = 1; opt.startTaper = false;
    ribbon(m, 178, opt);
    opt.spindle = false;
  }

  function emitBun(T, tIndex) {
    if (T.progress <= 0.01) return;
    const ca = Math.cos(head.a), sa = Math.sin(head.a);
    const lx = T.x + T.def.bx * T.progress, ly = T.y + T.def.by * T.progress;
    const cx = head.x + lx * ca - ly * sa, cy = head.y + lx * sa + ly * ca;
    let Lref = 0, n = 0;
    for (const l of locks) if (l.tie === tIndex) { Lref += totalLen(l); n++; }
    Lref = n ? Lref / n : 400;
    const Rmax = clamp(50 + Lref * 0.05, 56, 118) * (T.frac < 0.7 ? 0.82 : 1);
    const R = Rmax * T.progress;
    T.bunR = R;
    opt.total = 1; opt.alpha = 1; opt.streak = 0; opt.spindle = true;
    opt.tipTaper = false; opt.endW = 1; opt.startTaper = false;
    for (let k = 0; k < 2; k++) {
      const a = 0.8 + k * 1.6 + head.a;
      const m = 14;
      for (let i = 0; i < m; i++) {
        const t = i / (m - 1);
        sx[i] = cx + Math.cos(a) * R * lerp(-1.02, 1.02, t);
        sy[i] = cy + Math.sin(a) * R * lerp(-1.02, 1.02, t);
        sc[i] = 0.4;
      }
      opt.seed = 0.77 + k * 0.1; opt.shade = 0.86;
      ribbon(m, R * 1.02, opt);
    }
    const loops = 8;
    for (let k = 0; k < loops; k++) {
      const q = k / (loops - 1);
      const a0 = k * 2.39 + 0.4 + head.a;
      const m = 26;
      for (let i = 0; i < m; i++) {
        const t = i / (m - 1);
        const ang = a0 + t * 3.8;
        const r = R * lerp(1.0, 0.08 + 0.5 * q, t) * (1 - q * 0.24);
        sx[i] = cx + Math.cos(ang) * r;
        sy[i] = cy + Math.sin(ang) * r * 0.95;
        sc[i] = 0.2 + t * 0.6;
      }
      opt.seed = 0.1 + k * 0.137; opt.shade = lerp(0.9, 1.08, q);
      ribbon(m, R * lerp(0.56, 0.4, q), opt);
    }
    opt.spindle = false;
  }

  function emit(sub) {
    G.hairBegin();
    for (let layer = 0; layer < 3; layer++) {
      ranges[layer] = G.hairMark();
      if (layer === LAYER.UNDER) emitCap();
      for (const l of locks) {
        if (!l.active || l.alpha < 0.02) continue;
        if (layer === LAYER.TAIL && l.bundle >= 0) continue;
        emitLock(l, layer, sub);
      }
      if (layer === LAYER.TAIL) {
        ties.forEach((T) => {
          if (!T.braid) return;
          for (const b of Braid.bundleOrder(T)) {
            for (const l of locks) {
              if (l.bundle === b && l.tie === T.index && l.active) emitLock(l, layer, sub);
            }
          }
          Braid.emit(T, sx, sy, sc, ribbon, opt);
        });
        if (styleDef && styleDef.kind === 'bun') ties.forEach((T, i) => emitBun(T, i));
      }
    }
    ranges[3] = G.hairMark();
    G.hairUpload();
  }

  function tiePos(T) {
    const ca = Math.cos(head.a), sa = Math.sin(head.a);
    return { x: head.x + T.x * ca - T.y * sa, y: head.y + T.x * sa + T.y * ca };
  }

  function nearestPoint(wx, wy) {
    let best = null, bd = 90;
    for (const l of locks) {
      if (!l.active || l.bundle >= 0) continue;
      for (let i = 2; i < N; i++) {
        const d = Math.hypot(l.x[i] - wx, l.y[i] - wy);
        if (d < bd) { bd = d; best = { lock: l, i, d }; }
      }
    }
    return best;
  }

  function reset(state) {
    H.tipY = H.tipYT = state.tipY;
    H.wave = H.waveT = state.wave;
    build();
    setStyle('loose', { done: true });
  }

  return {
    NP, NF, N, LAYER, MARKS, MIN_Y, MAX_Y, H, head, grav, STYLES,
    cmToY, yToCm, yToName, reset, setStyle, releaseAll, isHairOut,
    gatherAt, finishGather, gatherProgress, push, comb, tangleAvg, setTangle, shake,
    grabStart, grabMove, grabSpin, grabEnd, clearCurls,
    isGrabbing: () => !!grab, isTwirling: () => !!grab && grab.twirl > 0.02,
    step, emit, ranges, tiePos, nearestPoint, totalLen, ribbon, sx, sy, sc,
    get ties() { return ties; },
    get locks() { return locks; },
    get styleDef() { return styleDef; },
    markDirty() { dirty = true; },
  };
})();
