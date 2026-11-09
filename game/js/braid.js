// 编辫子：三股头发，左右交替，一下一个音符
const Braid = (() => {
  const SLOT = 13;     // 三股根部之间的距离
  const SPREAD = 74;   // 三股往下散开的距离
  const BN = 12;       // 每股的节点数

  function makeRope(n) {
    return { n, x: new Float32Array(n), y: new Float32Array(n), ox: new Float32Array(n), oy: new Float32Array(n) };
  }

  function start(T, done) {
    const tIndex = T.index;
    const members = Hair.locks.filter((l) => l.tie === tIndex);
    const L0 = members.reduce((s, l) => s + l.tailLen, 0) / Math.max(1, members.length);
    const scale = Math.sqrt(T.frac);
    const wide = lerp(0.72, 1, clamp(scale, 0, 1));
    const lobe = (T.rope ? 33 : 41) * wide;
    const count = clamp(Math.round((L0 * 0.86) / lobe), 6, 34);
    const ell = (L0 * 0.86) / count;
    const hp = Hair.head;
    const px = hp.x + T.x, py = hp.y + T.y;
    const spine = makeRope(count + 3);
    for (let i = 0; i < spine.n; i++) {
      spine.x[i] = spine.ox[i] = px;
      spine.y[i] = spine.oy[i] = py + i * ell;
    }
    const bundles = [0, 1, 2].map((i) => {
      const r = makeRope(BN);
      for (let k = 0; k < BN; k++) {
        r.x[k] = r.ox[k] = px + (i - 1) * SLOT;
        r.y[k] = r.oy[k] = py + (k * L0) / BN;
      }
      return { rope: r, slot: i, pos: i - 1, over: 0, tint: [0.95, 1.05, 0.9][i] };
    });
    T.braid = {
      n: 0, max: count, ell, L0, wide, spine, bundles, lobes: [],
      next: T.x > 0 ? 1 : 0, // 下一次从哪一边开始：0 左 1 右
      drag: null, split: 0, tie: 0, members, ending: false, finished: false,
      rope: !!T.rope,
    };
    members.forEach((l) => {
      l.bundle = T.rope ? (l.tailU < 0 ? 0 : 2) : l.bundleCand;
      l.bMix = 0;
    });
    if (done) {
      const b = T.braid;
      b.split = 1;
      for (let i = 0; i < count; i++) commit(T, true);
      finish(T);
    }
  }

  function stop(T) {
    if (!T.braid) return;
    T.braid.members.forEach((l) => { l.bundle = -1; });
    T.braid = null;
  }

  function slotLeft(b) { return b.bundles.findIndex((x) => x.slot === 0); }
  function slotMid(b) { return b.bundles.findIndex((x) => x.slot === 1); }
  function slotRight(b) { return b.bundles.findIndex((x) => x.slot === 2); }

  // side: 0 左股跨到中间；1 右股跨到中间
  function commit(T, silent) {
    const b = T.braid;
    if (!b || b.n >= b.max) return false;
    if (b.rope) {
      // 两股互相拧：每打半圈换一次位置
      const A = b.bundles[0], C = b.bundles[2];
      const t = A.slot; A.slot = C.slot; C.slot = t;
      b.bundles.forEach((x) => (x.over = 0));
      const top = b.n % 2 ? A : C;
      top.over = 1;
      b.lobes.push({ sign: 1, tint: top.tint, born: silent ? 0 : 1, seed: 0.12 + b.n * 0.073 });
      b.n++;
      return true;
    }
    const fromIdx = b.next === 0 ? slotLeft(b) : slotRight(b);
    const midIdx = slotMid(b);
    const from = b.bundles[fromIdx], mid = b.bundles[midIdx];
    const outer = from.slot;
    from.slot = 1; mid.slot = outer;
    b.bundles.forEach((x) => (x.over = 0));
    from.over = 1;
    b.lobes.push({ sign: b.next === 0 ? -1 : 1, tint: from.tint, born: silent ? 0 : 1, seed: 0.12 + b.n * 0.073 });
    b.n++;
    b.next = 1 - b.next;
    return true;
  }

  function finish(T) {
    const b = T.braid;
    b.ending = true;
    b.finished = true;
    T.visible = true;
    T.wraps = 3;
  }

  function endPoint(T) {
    const b = T.braid;
    const i = Math.min(b.n, b.spine.n - 1);
    return { x: b.spine.x[i], y: b.spine.y[i] };
  }

  function simulate(T, ca, sa, head) {
    const b = T.braid;
    const sp = b.spine;
    const rx = head.x + T.x * ca - T.y * sa, ry = head.y + T.x * sa + T.y * ca;
    sp.x[0] = sp.ox[0] = rx; sp.y[0] = sp.oy[0] = ry;
    const active = Math.min(b.n + 1, sp.n - 1);
    const sway = Math.sin(performance.now() * 0.0006) * 0.05;
    for (let i = 1; i <= active; i++) {
      const vx = (sp.x[i] - sp.ox[i]) * 0.96, vy = (sp.y[i] - sp.oy[i]) * 0.96;
      sp.ox[i] = sp.x[i]; sp.oy[i] = sp.y[i];
      const restX = rx + Math.sin(i * 0.33) * 5, restY = ry + i * b.ell;
      sp.x[i] += vx + (restX - sp.x[i]) * 0.035 + sway;
      sp.y[i] += vy + (restY - sp.y[i]) * 0.035 + 0.25;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < active; i++) {
        const dx = sp.x[i + 1] - sp.x[i], dy = sp.y[i + 1] - sp.y[i];
        const d = Math.hypot(dx, dy) || 1e-4, diff = (d - b.ell) / d;
        if (i === 0) { sp.x[1] -= dx * diff; sp.y[1] -= dy * diff; }
        else { sp.x[i] += dx * diff * 0.5; sp.y[i] += dy * diff * 0.5; sp.x[i + 1] -= dx * diff * 0.5; sp.y[i + 1] -= dy * diff * 0.5; }
      }
    }
    for (let i = active + 1; i < sp.n; i++) {
      sp.x[i] = sp.ox[i] = sp.x[active]; sp.y[i] = sp.oy[i] = sp.y[active] + (i - active) * b.ell;
    }

    // 编到哪里，三股就从哪里继续垂下去
    const e = active - 1 >= 0 ? b.n : 0;
    const ex = sp.x[Math.min(e, sp.n - 1)], ey = sp.y[Math.min(e, sp.n - 1)];
    const left = Math.max(b.L0 - b.n * b.ell, 30);
    const seg = left / (BN - 1);
    const tight = b.finished ? 0 : 1;
    b.split += (1 - b.split) * 0.1;
    b.bundles.forEach((B, idx) => {
      let target = B.slot - 1;
      if (b.drag && b.drag.from === idx) {
        const dest = 0;
        target = lerp(B.slot - 1, dest, b.drag.p);
      } else if (b.drag && B.slot === 1) {
        const outer = b.drag.side === 0 ? -1 : 1;
        target = lerp(0, outer, b.drag.p);
      }
      B.pos += (target - B.pos) * 0.3;
      const offs = B.pos * SLOT * b.split * tight * b.wide;
      const r = B.rope;
      r.x[0] = r.ox[0] = ex + offs; r.y[0] = r.oy[0] = ey;
      for (let k = 1; k < BN; k++) {
        const vx = (r.x[k] - r.ox[k]) * 0.95, vy = (r.y[k] - r.oy[k]) * 0.95;
        r.ox[k] = r.x[k]; r.oy[k] = r.y[k];
        const q = k / (BN - 1);
        const spreadX = ex + offs + B.pos * SPREAD * b.wide * b.split * tight * Math.pow(q, 0.6);
        r.x[k] += vx + (spreadX - r.x[k]) * 0.05;
        r.y[k] += vy + 0.32;
      }
      for (let it = 0; it < 3; it++) {
        for (let k = 0; k < BN - 1; k++) {
          const dx = r.x[k + 1] - r.x[k], dy = r.y[k + 1] - r.y[k];
          const d = Math.hypot(dx, dy) || 1e-4, diff = (d - seg) / d;
          if (k === 0) { r.x[1] -= dx * diff; r.y[1] -= dy * diff; }
          else { r.x[k] += dx * diff * 0.5; r.y[k] += dy * diff * 0.5; r.x[k + 1] -= dx * diff * 0.5; r.y[k + 1] -= dy * diff * 0.5; }
        }
      }
    });
    b.lobes.forEach((L) => { if (L.born > 0) L.born = Math.max(0, L.born - 0.09); });
  }

  // 每一缕跟着它所在的那一股走
  function place(l, T, NP, NF, x, y, ox, oy) {
    const b = T.braid;
    if (!b) return;
    const B = b.bundles[l.bundle];
    const r = B.rope;
    const offsW = 17 * b.wide;
    for (let j = 0; j < NF; j++) {
      const q = (j / (NF - 1)) * (BN - 1);
      const k = Math.min(BN - 2, Math.floor(q)), f = q - k;
      const px = lerp(r.x[k], r.x[k + 1], f), py = lerp(r.y[k], r.y[k + 1], f);
      const nx = -(r.y[k + 1] - r.y[k]), ny = r.x[k + 1] - r.x[k];
      const m = Math.hypot(nx, ny) || 1;
      const u = ((l.tailU + 1) * 1.5 - Math.floor((l.tailU + 1) * 1.5)) * 2 - 1;
      const off = u * offsW * (1 - 0.5 * (j / NF));
      const tx = px + (nx / m) * off, ty = py + (ny / m) * off;
      const i = NP + j;
      const mix = b.finished ? 0.5 : 0.28;
      x[i] += (tx - x[i]) * mix; y[i] += (ty - y[i]) * mix;
      ox[i] = x[i]; oy[i] = y[i];
    }
    const cum = l.cum;
    const total = cum[NP + NF - 1];
    // 让颜色渐变继续往发梢走
    const done = clamp(b.n / b.max, 0, 1) * 0.8;
    for (let j = 0; j < NF; j++) {
      const q = j / (NF - 1);
      cum[NP + j] = total * lerp(done + 0.1, 1, q);
    }
  }

  function push(T, wx, wy, vx, vy, R) {
    const b = T.braid;
    if (!b) return;
    const R2 = R * R;
    const sp = b.spine;
    for (let i = 1; i <= Math.min(b.n + 1, sp.n - 1); i++) {
      const dx = sp.x[i] - wx, dy = sp.y[i] - wy, d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        const f = 1 - Math.sqrt(d2) / R;
        sp.ox[i] -= vx * f * 0.35; sp.oy[i] -= vy * f * 0.25;
      }
    }
  }
  function bundleOrder(T) {
    const b = T.braid;
    return [0, 1, 2].sort((p, q) => b.bundles[p].over - b.bundles[q].over + (Math.abs(b.bundles[q].pos) - Math.abs(b.bundles[p].pos)) * 0.2);
  }

  function emit(T, sx, sy, sc, ribbon, opt) {
    const b = T.braid;
    const sp = b.spine;
    const a = 22 * b.wide;
    for (let i = 0; i < b.lobes.length; i++) {
      const L = b.lobes[i];
      const j = Math.min(i, sp.n - 2);
      const cx0 = sp.x[j], cy0 = sp.y[j], cx1 = sp.x[j + 1], cy1 = sp.y[j + 1];
      let tx = cx1 - cx0, ty = cy1 - cy0;
      const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
      const nx = -ty, ny = tx;
      const sg = L.sign;
      const grow = 1 - L.born;
      const seg = b.ell;
      const P = b.rope ? [
        [a * 1.0, -seg * 0.8],
        [a * 0.75, -seg * 0.1],
        [-a * 0.75, seg * 0.5],
        [-a * 1.0, seg * 1.2],
      ] : [
        [sg * a * 1.15, -seg * 0.75],
        [sg * a * 1.05, -seg * 0.05],
        [sg * a * 0.25, seg * 0.55],
        [-sg * a * 0.45, seg * 1.1],
      ];
      const cn = 14;
      for (let k = 0; k < cn; k++) {
        const t = k / (cn - 1), q = 1 - t;
        const u = q * q * q * P[0][0] + 3 * q * q * t * P[1][0] + 3 * q * t * t * P[2][0] + t * t * t * P[3][0];
        const v = q * q * q * P[0][1] + 3 * q * q * t * P[1][1] + 3 * q * t * t * P[2][1] + t * t * t * P[3][1];
        sx[k] = cx0 + nx * u * grow + tx * v;
        sy[k] = cy0 + ny * u * grow + ty * v;
        sc[k] = (i + t * 2) / Math.max(1, b.max + 3);
      }
      opt.seed = L.seed; opt.shade = L.tint; opt.total = 1; opt.alpha = 1; opt.streak = 0;
      opt.spindle = true; opt.tipTaper = false; opt.endFade = false; opt.endW = 1;
      ribbon(cn, a * 1.34, opt);
    }
    opt.spindle = false;
  }

  return { start, stop, commit, finish, endPoint, simulate, place, push, bundleOrder, emit, slotLeft, slotMid, slotRight };
})();
