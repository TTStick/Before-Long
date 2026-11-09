// 场景：把房间、背影、头发、发饰、手、粒子按顺序画出来
const Scene = (() => {
  const Tex = { room: {}, head: null, body: null, feats: {}, tie: null, acc: {}, part: {}, hand: {}, mirror: null, partLine: null };
  const Cvs = { head: null, body: null, feats: {}, face: null };
  const DYES = {
    black: { n: '自然黑', c: ['#27211F', '#2C2523', '#332A27', '#3A302C', '#433631'] },
    brown: { n: '深棕', c: ['#3F2A20', '#4C3225', '#5A3B2B', '#684532', '#755038'] },
    tea: { n: '奶茶', c: ['#6B4A38', '#8A6248', '#A57C5E', '#BC9676', '#CBA988'] },
    honey: { n: '蜜糖金', c: ['#8B5E2E', '#B98241', '#D6A25A', '#E8BC77', '#F0CC8F'] },
    sakura: { n: '樱花粉', c: ['#C77A8E', '#E296A9', '#F1B2C0', '#F7C8D2', '#FBDAE0'] },
    lilac: { n: '薰衣草', c: ['#7361A3', '#927DC0', '#AF9AD6', '#C7B5E6', '#DACBF0'] },
    mist: { n: '雾霾蓝', c: ['#566F92', '#7490B2', '#92ADCA', '#AFC6DD', '#C7D8E9'] },
    mint: { n: '薄荷', c: ['#5D9486', '#7FB3A3', '#A0CDBD', '#BDDFD1', '#D2EBE1'] },
    silver: { n: '银白', c: ['#A9A6B3', '#C1BECA', '#D6D3DD', '#E5E3EA', '#F2F0F4'] },
    ember: { n: '红棕', c: ['#6B2C24', '#8D3B2E', '#A9503B', '#BF684A', '#CF8060'] },
    sunset: { n: '落日渐变', c: ['#5B4055', '#9C5570', '#E08A7D', '#F4B57F', '#FBD89C'] },
    pride: { n: '蓝粉白', c: ['#78C6EA', '#F2A8BC', '#FFFFFF', '#F2A8BC', '#78C6EA'] },
  };

  const MIRROR = { x: 272, y: -186, w: 148 };
  const HAND_H = 176;

  let room = 'morning', roomPrev = null, roomFade = 1;
  let stops = new Float32Array(15);
  let stopsHex = DYES.tea.c;
  let streak = [1, 1, 1];
  const face = { frame: 'open', next: 2.5, blink: 0, hold: 0, mood: null };
  const parts = [];
  const accs = [];
  let hairHex = '#8A6248';
  let skinTint = [1, 0.9, 0.84];
  let lightNow = [1, 1, 1];
  let shineNow = 0.6;
  const hand = { on: false, x: 0, y: 0, pose: 'open', a: 0 };

  function setDye(key, custom) {
    const c = (key === 'custom' && custom) ? custom : (DYES[key] || DYES.tea).c;
    stopsHex = c;
    for (let i = 0; i < 5; i++) {
      const v = hex2rgb(c[i]);
      stops[i * 3] = v[0]; stops[i * 3 + 1] = v[1]; stops[i * 3 + 2] = v[2];
    }
    hairHex = c[1];
  }

  function setStreak(hex) {
    streak = hex ? hex2rgb(hex) : [1, 1, 1];
    Hair.locks.forEach((l, i) => {
      l.streakOn = !!hex && (l.fam === 'top' || i % 4 === 0) && (Math.floor(l.seed * 100) % 3 === 0);
    });
  }

  function bakeMirror() {
    if (!Cvs.face) return;
    const cv = Art.drawMirror(Store.data.look, stopsHex, Hair.H.style === 'loose' && Hair.H.tipYT > 100, Cvs.face);
    if (Tex.mirror) G.updateTex(Tex.mirror, cv); else Tex.mirror = G.tex(cv);
  }

  function bakeLook(look) {
    Cvs.face = Art.drawHeadBase(look, Cvs.face);
    Cvs.head = Art.drawHeadBack(look, Cvs.head);
    Cvs.body = Art.drawBody(look, Cvs.body);
    if (Tex.head) G.updateTex(Tex.head, Cvs.head); else Tex.head = G.tex(Cvs.head);
    if (Tex.body) G.updateTex(Tex.body, Cvs.body); else Tex.body = G.tex(Cvs.body);
    for (const f of ['open', 'half', 'closed', 'happy']) {
      Cvs.feats[f] = Art.drawFeatures(look, f, hairHex, Cvs.feats[f]);
      if (Tex.feats[f]) G.updateTex(Tex.feats[f], Cvs.feats[f]); else Tex.feats[f] = G.tex(Cvs.feats[f]);
    }
    for (const p of ['open', 'pinch', 'point']) {
      const cv = Art.drawHand(look, p);
      if (Tex.hand[p]) G.updateTex(Tex.hand[p], cv); else Tex.hand[p] = G.tex(cv);
    }
    skinTint = hex2rgb(Art.SKINS[look.skin].shade);
    bakeMirror();
  }

  function bakeTie(t) {
    G.freeTex(Tex.tie);
    G.freeTex(Tex.bow);
    Tex.tie = G.tex(Art.drawTie(t));
    Tex.bow = G.tex(Art.drawTie(Object.assign({}, t, { type: 'ribbon' })));
  }

  function roomTex(m) {
    if (!Tex.room[m]) Tex.room[m] = G.tex(Art.drawRoom(m));
    return Tex.room[m];
  }

  function setRoom(m, instant) {
    if (m === room && !instant) return;
    roomPrev = instant ? null : room;
    roomFade = instant ? 1 : 0;
    room = m;
    roomTex(m);
  }

  function accTex(id) {
    if (!Tex.acc[id]) Tex.acc[id] = G.tex(Art.drawAcc(id));
    return Tex.acc[id];
  }

  function initTextures() {
    for (const k of ['spark', 'dot', 'heart', 'petal', 'leaf', 'snow', 'green', 'rain']) {
      Tex.part[k] = G.tex(Art.drawParticle(k));
    }
    Tex.partLine = G.tex(Art.drawPartLine());
  }

  // ---- 手 ----
  function handShow(x, y, pose) { hand.on = true; hand.x = x; hand.y = y; if (pose) hand.pose = pose; }
  function handMove(x, y) { hand.x = x; hand.y = y; }
  function handPose(p) { hand.pose = p; }
  function handHide() { hand.on = false; }

  function drawHand(dt) {
    hand.a = clamp(hand.a + (hand.on ? dt * 12 : -dt * 7), 0, 1);
    if (hand.a <= 0.01) return;
    const P = Art.HAND_POSE[hand.pose];
    const rot = -0.2 + (hand.x / G.W - 0.5) * 0.34;
    G.sprite(Tex.hand[hand.pose], hand.x, hand.y - 12, HAND_H * 0.75, HAND_H, rot, hand.a, P.ax, P.ay, lightNow);
  }

  // ---- 粒子 ----
  function spawn(kind, x, y, o) {
    if (parts.length > 400) parts.shift();
    parts.push(Object.assign({
      kind, x, y, vx: 0, vy: 0, life: 1, max: 1, size: 30, rot: rnd(TAU), vr: rnd(-0.03, 0.03), g: 0, screen: false, tint: [1, 1, 1], alpha: 1,
    }, o));
  }
  function sparkleAt(x, y, n, spread) {
    for (let i = 0; i < n; i++) {
      spawn('spark', x + rnd(-spread, spread), y + rnd(-spread, spread), {
        vx: rnd(-1.2, 1.2), vy: rnd(-1.8, 0.4), life: rnd(0.5, 1.2), max: 1.2, size: rnd(18, 46), g: 0.015,
      });
    }
  }
  function hearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      spawn('heart', x + rnd(-60, 60), y + rnd(-30, 30), { vx: rnd(-0.8, 0.8), vy: rnd(-2.6, -1.2), life: rnd(0.9, 1.5), max: 1.5, size: rnd(26, 44), vr: rnd(-0.015, 0.015), rot: rnd(-0.3, 0.3) });
    }
  }

  let ambT = 0;
  let season = null;
  function ambient(dt) {
    const W = G.W, H = G.H;
    ambT -= dt;
    if (ambT > 0) return;
    const M = Art.ROOM[room];
    ambT = M.rain ? 0.02 : 0.3;
    if (M.rain && parts.length < 300) {
      spawn('rain', rnd(0, W * 0.48), -30, { screen: true, vy: rnd(14, 20), vx: -0.6, life: 1.2, max: 1.2, size: rnd(16, 28), rot: 0, vr: 0, alpha: 0.55 });
    } else if (!M.rain) {
      spawn('dot', rnd(0, W), rnd(H * 0.05, H * 0.72), { screen: true, vy: rnd(-0.2, -0.05), vx: rnd(-0.1, 0.25), life: rnd(3, 6), max: 6, size: rnd(5, 12), alpha: M.night ? 0.8 : 0.65, tint: M.night ? [1, 0.86, 0.6] : [1, 0.97, 0.86] });
    }
    if (season && Math.random() < 0.55) {
      const kind = season === 'spring' ? 'petal' : season === 'summer' ? 'green' : season === 'autumn' ? 'leaf' : 'snow';
      spawn(kind, rnd(-20, W + 20), -30, {
        screen: true, vy: rnd(0.9, 2.1), vx: rnd(-0.8, 0.9), life: 12, max: 12, size: rnd(12, 24), vr: rnd(-0.05, 0.05), alpha: 0.9,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr;
    }
  }

  function drawParts(screen) {
    for (const p of parts) {
      if (!!p.screen !== screen) continue;
      const q = clamp(p.life / p.max, 0, 1);
      const a = Math.min(1, q * 3) * p.alpha * (p.screen ? Math.min(1, (p.max - p.life) * 1.6) : 1);
      const s = p.size * (p.kind === 'spark' ? 0.5 + q * 0.7 : 1);
      G.sprite(Tex.part[p.kind], p.x, p.y, s, s, p.rot, a, 0.5, 0.5, p.tint);
    }
  }

  // ---- 镜子里的表情 ----
  function updateFace(dt) {
    if (face.hold > 0) {
      face.hold -= dt;
      if (face.hold <= 0) { face.mood = null; face.next = 1; }
      else { face.frame = face.mood; return; }
    }
    face.next -= dt;
    if (face.next <= 0 && face.blink === 0) { face.blink = 0.15; face.next = rnd(2.6, 5.4); }
    if (face.blink > 0) {
      face.blink = Math.max(0, face.blink - dt);
      const b = face.blink;
      face.frame = b > 0.1 || b < 0.04 ? 'half' : 'closed';
      if (b === 0) face.frame = 'open';
    } else face.frame = 'open';
  }
  function expression(mood, dur) {
    face.mood = mood; face.hold = dur; face.frame = mood;
  }

  function drawMirror() {
    if (!Tex.mirror) return;
    const m = MIRROR, f = m.w / 300, hs = 0.5, F = Art.FEAT;
    G.sprite(Tex.mirror, m.x, m.y, m.w, 360 * f);
    G.sprite(Tex.feats[face.frame], m.x + F.X0 * hs * f, m.y + (166 + F.Y0 * hs - 180) * f, F.W * hs * f, F.H * hs * f, 0, 1, 0, 0);
  }

  // ---- 绘制 ----
  function draw(cam, dt) {
    const M = Art.ROOM[room];
    lightNow = lightNow.map((v, i) => lerp(v, M.light[i], 0.05));
    shineNow = lerp(shineNow, 0.25 + 0.75 * (1 - Math.min(1, Hair.tangleAvg() * 1.5)), 0.05);

    G.clear(M.clear[0], M.clear[1], M.clear[2]);
    G.setScreenCamera();
    G.setLight([1, 1, 1]);
    const W = G.W, H = G.H, ratio = 2000 / 900;
    let bw = W * 1.1, bh = bw * ratio;
    if (bh < H * 1.1) { bh = H * 1.1; bw = bh / ratio; }
    const bx = W / 2 + cam.x * 0.02, by = H * 0.5 + (cam.y - 350) * -0.018;
    if (roomFade < 1) {
      roomFade = Math.min(1, roomFade + dt * 1.4);
      if (roomPrev) G.sprite(roomTex(roomPrev), bx, by, bw, bh);
      G.sprite(roomTex(room), bx, by, bw, bh, 0, roomFade);
    } else G.sprite(roomTex(room), bx, by, bw, bh);
    drawParts(true);
    G.flush();

    G.setCamera(cam.x, cam.y, cam.z, cam.screenY);
    G.setLight(lightNow);
    drawMirror();

    Hair.emit(G.quality.sub);
    const R = Hair.ranges, L = Hair.LAYER;
    const head = Hair.head;
    const B = Art.BODY;
    G.sprite(Tex.body, 0, B.Y0, B.W, B.H, 0, 1, 0.5, 0);
    const Hd = Art.HEAD;
    const ca = Math.cos(head.a), sa = Math.sin(head.a);
    G.sprite(Tex.head, head.x + Hd.X0 * ca - Hd.Y0 * sa, head.y + Hd.X0 * sa + Hd.Y0 * ca, Hd.W, Hd.H, head.a, 1, 0, 0);
    G.flush();

    G.hairDraw(R[L.UNDER], R[L.UNDER + 1], stops, streak, 0, true, 8, 14);
    G.hairDraw(R[L.UNDER], R[L.UNDER + 1], stops, streak, shineNow, false);

    const d = Hair.styleDef;
    if (d && d.part) {
      G.sprite(Tex.partLine, head.x, head.y - 38, 7, 350, head.a, 0.9, 0.5, 0.5, skinTint);
      G.flush();
    }

    G.hairDraw(R[L.SCALP], R[L.SCALP + 1], stops, streak, 0, true, 3, 8);
    G.hairDraw(R[L.SCALP], R[L.SCALP + 1], stops, streak, shineNow, false);
    G.hairDraw(R[L.TAIL], R[L.TAIL + 1], stops, streak, 0, true, 7, 12);
    G.hairDraw(R[L.TAIL], R[L.TAIL + 1], stops, streak, shineNow, false);

    // 发圈
    Hair.ties.forEach((T) => {
      if (T.pop > 0) T.pop = Math.max(0, T.pop - dt * 3.5);
      if (!T.visible) return;
      const P = tieDrawPoint(T);
      const base = (T.braid ? 96 : 142) * Math.sqrt(clamp(T.frac + 0.28, 0.4, 1)) * (T.def.big || 1);
      const w = base * (1 + T.pop * 0.3), h = w * (200 / 280);
      G.sprite(T.def.big ? Tex.bow : Tex.tie, P.x, P.y, w, h, head.a + (T.def.rot || 0));
    });
    G.flush();

    accs.forEach((a) => {
      const pos = accWorld(a);
      const s = a.scale * 92;
      G.sprite(accTex(a.id), pos[0], pos[1], s, s, a.rot + head.a);
    });
    drawParts(false);
    G.flush();

    G.setScreenCamera();
    drawHand(dt);
    G.flush();
  }

  function tieDrawPoint(T) {
    if (T.braid) return Braid.endPoint(T);
    if (T.kind === 'bun') {
      const h = Hair.head, ca = Math.cos(h.a), sa = Math.sin(h.a);
      const lx = T.x + T.def.bx * T.progress, ly = T.y + T.def.by * T.progress + (T.bunR || 60) * 0.84;
      return { x: h.x + lx * ca - ly * sa, y: h.y + lx * sa + ly * ca };
    }
    return Hair.tiePos(T);
  }

  function accWorld(a) {
    if (a.lock && a.lock.active) return [a.lock.x[a.i], a.lock.y[a.i]];
    const h = Hair.head, ca = Math.cos(h.a), sa = Math.sin(h.a);
    return [h.x + a.x * ca - a.y * sa, h.y + a.x * sa + a.y * ca];
  }

  return {
    DYES, Tex, face, accs, MIRROR, setDye, setStreak, bakeLook, bakeMirror, bakeTie, setRoom, initTextures,
    handShow, handMove, handPose, handHide, tieDrawPoint,
    spawn, sparkleAt, hearts, ambient, updateParticles, updateFace, expression, draw, accWorld,
    get room() { return room; },
    get hairHex() { return hairHex; },
    setSeason(s) { season = s; },
  };
})();
