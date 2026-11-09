// 游戏主流程
const Game = (() => {
  const $ = (id) => document.getElementById(id);
  const S = () => Store.data;
  const cam = { x: 0, y: 300, z: 0.45, screenY: 400 };
  const camT = { x: 0, y: 300, z: 0.45, screenY: 400 };

  let mode = 'boot';      // boot / idle / gather / wrap / coil / braid / time
  let tool = 'hand';
  let flow = null;
  let flowToken = 0;
  let selectedAcc = null;
  let layoutDirty = true;
  let last = 0, acc = 0, paused = false;
  let ptr = null;
  let glowT = 0;
  let brushLevel = 0, brushHold = 0, lastTick = 0;
  let timeState = null;
  const tweens = [];

  const NEED = { tail: 150, bun: 300, braid: 320, half: 110 };
  const KIND_LINES = [
    '真好看。', '这个发型很适合你。', '镜子里的人，是你。', '慢慢来，它会长的。',
    '今天也很好看。', '留长的每一天，都算数。', '你可以一直这样温柔地对自己。',
    '再看一会儿吧，不着急。', '这就是你想要的样子。',
  ];

  // ---- 时间与长度 ----
  const RATE = 1.2;  // 厘米/月
  const MS_MONTH = 30.44 * 86400000;
  function realCmAt(ms) {
    const R = S().real;
    const start = R.date || Date.now();
    return R.cm + (Math.max(0, ms - start) / MS_MONTH) * RATE;
  }
  function daysGrowing() {
    const R = S().real;
    if (!R.date) return 0;
    return Math.max(0, Math.floor((Date.now() - R.date) / 86400000));
  }

  function tween(fn, dur, done) { tweens.push({ fn, t: 0, dur, done }); }

  function updateGreet() {
    const h = new Date().getHours();
    const hi = h < 5 ? '夜深了' : h < 11 ? '早安' : h < 14 ? '午安' : h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了';
    const n = S().name;
    $('greet').textContent = n ? `${hi}，${n}` : hi;
  }

  // ---- 外观 ----
  function applyDye() {
    const h = S().hair;
    Scene.setDye(h.dye, h.custom);
    Scene.setStreak(h.streak);
    Scene.bakeLook(S().look);
    Store.saveSoon();
  }
  function applyLook() { Scene.bakeLook(S().look); Store.saveSoon(); }
  function applyTie() { Scene.bakeTie(S().tie); Store.saveSoon(); }
  function applyRoom() {
    const r = S().look.room;
    Scene.setRoom(r);
    Snd.rain(!!Art.ROOM[r].rain);
  }

  // ---- 布局 ----
  function trayTop() {
    if (document.body.classList.contains('flowing') || document.body.classList.contains('photo') || document.body.classList.contains('boarding')) return G.H;
    if (document.body.classList.contains('timing')) return $('timePanel').getBoundingClientRect().top;
    return $('tray').getBoundingClientRect().top;
  }

  function hairTopY() { return -350; }

  // 判断手指是不是在打圈：圆心慢慢跟着手指走，直线拖动几乎不会累积角度
  const Circle = {
    cx: 0, cy: 0, a: null,
    reset(x, y) { this.cx = x; this.cy = y - 30; this.a = null; },
    add(x, y) {
      this.cx += (x - this.cx) * 0.06; this.cy += (y - this.cy) * 0.06;
      const dx = x - this.cx, dy = y - this.cy;
      if (dx * dx + dy * dy < 64) return 0;
      const a = Math.atan2(dy, dx);
      if (this.a === null) { this.a = a; return 0; }
      let d = a - this.a;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      this.a = a;
      return d;
    },
  };

  function computeFrame(forPhoto) {
    const W = G.W, H = G.H;
    const safeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
    const tT = forPhoto ? H : trayTop();
    const regionTop = forPhoto ? 20 : safeTop + (mode === 'braid' ? 130 : 62);
    const regionBot = tT - 14;
    const regH = Math.max(120, regionBot - regionTop);

    if (mode === 'braid' && flow && flow.T && flow.T.braid && !forPhoto) {
      const e = Braid.endPoint(flow.T);
      const span = 980;
      camT.z = clamp(regH / span, 0.3, 0.78);
      camT.x = flow.T.x * 0.9;
      camT.y = e.y + 170;
      camT.screenY = (regionTop + regionBot) / 2;
      return;
    }
    let top = hairTopY();
    let bot = Math.max(640, Hair.H.tipYT + 90);
    const tailSt = Hair.styleDef && Hair.styleDef.kind !== 'loose';
    if (tailSt) bot = Math.max(640, Math.min(bot, 980));
    camT.z = Math.min(regH / (bot - top), W / 720);
    camT.x = 0;
    camT.y = (top + bot) / 2;
    camT.screenY = (regionTop + regionBot) / 2;
  }

  let layoutTimer = null;
  function requestLayout() {
    layoutDirty = true;
    if (layoutTimer) return;
    layoutTimer = setTimeout(() => { layoutTimer = null; layoutDirty = true; }, 380);
  }

  // ---- 坐标 ----
  function toWorld(px, py) {
    return { x: cam.x + (px - G.W / 2) / cam.z, y: cam.y + (py - cam.screenY) / cam.z };
  }

  // ---- 工具 ----
  function setTool(t) {
    tool = t;
    if (t === 'comb') UI.prompt('从发根往发梢，慢慢梳下去。卷也会被梳直', 2600);
    if (t === 'grow') UI.prompt(Hair.H.style === 'loose' ? '按住头发往下拉，它就会长长' : '先把头发放下来，才好拉长哦', 2600);
    if (t === 'hand') UI.prompt('抓一把头发，手指打圈就能绕成小卷', 2400);
    $('combCursor').classList.remove('on');
  }

  // ---- 发型流程 ----
  function setFlowing(on) {
    document.body.classList.toggle('flowing', on);
    if (!on) document.body.classList.remove('braiding');
    selectedAcc = null;
    requestLayout();
  }

  function clearLockAcc() {
    Scene.accs.forEach((a) => {
      if (a.lock) { a.lock = null; a.x = rnd(-120, 120); a.y = rnd(-150, -100); }
    });
  }

  function clearCurrentStyle(cb) {
    const wasStyled = Hair.H.style !== 'loose';
    clearLockAcc();
    if (!wasStyled) { cb(); return; }
    Hair.releaseAll();
    Hair.shake(26);
    Snd.pop();
    const my = ++flowToken;
    setTimeout(() => { if (my === flowToken) cb(); }, 420);
  }

  function startStyle(name) {
    if (mode !== 'idle') return;
    const def = Hair.STYLES[name];
    if (name === 'loose') {
      clearCurrentStyle(() => {
        Hair.setStyle('loose');
        S().style = 'loose'; Store.saveSoon();
        Scene.bakeMirror();
        UI.renderPanel();
        UI.prompt('头发放下来了', 1600);
        Hair.setTangle(0.2);
        requestLayout();
      });
      return;
    }
    const need = def.only ? NEED.half : NEED[def.kind];
    if (Hair.H.tipYT < need) {
      const o = UI.modal(`<h3>头发还差一点点</h3><p>这个发型需要头发再长一些。<br>要先让它长到${Hair.yToName(need + 20)}吗？</p><div class="row"><button class="btn ghost" id="mNo">先不了</button><button class="btn" id="mYes">长一点</button></div>`);
      $('mNo').onclick = () => UI.overlay('');
      $('mYes').onclick = () => {
        UI.overlay('');
        setLength(need + 40);
        setTimeout(() => startStyle(name), 800);
      };
      return;
    }
    clearCurrentStyle(() => {
      Hair.setStyle(name);
      S().style = 'loose';
      flow = { name, def, index: 0, T: null };
      setFlowing(true);
      enterGather();
    });
  }

  function enterGather() {
    const T = Hair.ties[flow.index];
    flow.T = T;
    mode = 'gather';
    const twoTie = flow.def.ties.length === 2;
    const where = twoTie ? (flow.index === 0 ? '左边的' : '右边的') : '';
    UI.prompt(`用手指把${where}头发往发光的地方拢`, 0, true);
  }

  function afterGather() {
    Hair.finishGather(flow.def.ties.length === 2 ? flow.index : -1);
    Native.vibrate(14, 80);
    Snd.chime(2);
    const T = flow.T;
    const my = ++flowToken;
    setTimeout(() => {
      if (my !== flowToken || !flow) return;
      if (T.kind === 'bun') { enterCoil(); }
      else if (T.kind === 'braid') { enterBraid(); }
      else { enterWrap(); }
    }, 420);
  }

  function enterWrap() {
    mode = 'wrap';
    const T = flow.T;
    T.visible = true;
    T.wraps = 0;
    T.pop = 1;
    document.body.classList.remove('braiding');
    Snd.pop();
    flow.wrapA = null; flow.wrapSum = 0;
    UI.prompt('手指绕着发圈打圈，绕三圈', 0, true);
    requestLayout();
  }

  function doWrap() {
    const T = flow.T;
    T.wraps++;
    T.pop = 1;
    Snd.chime(T.wraps * 2);
    Native.vibrate(16, 100);
    const p = wrapPoint(T);
    Scene.sparkleAt(p.x, p.y, 8, 26);
    Hair.shake(5);
    if (T.wraps >= 3) {
      if (T.kind === 'braid' && T.braid) Braid.finish(T);
      nextTieOrDone();
    }
  }

  function wrapPoint(T) {
    if (T.braid) return Braid.endPoint(T);
    return Scene.tieDrawPoint(T);
  }

  function nextTieOrDone() {
    if (flow.index < flow.def.ties.length - 1) {
      flow.index++;
      const my = ++flowToken;
      setTimeout(() => { if (my === flowToken && flow) enterGather(); }, 380);
    } else finishStyle();
  }

  function enterCoil() {
    mode = 'coil';
    flow.coilA = null;
    UI.prompt('手指绕圈圈，把头发盘起来', 0, true);
  }

  function coilAdd(amount) {
    const T = flow.T;
    const before = T.progress;
    T.progress = clamp(T.progress + amount, 0, 1);
    Hair.markDirty();
    if (Math.floor(before * 5) !== Math.floor(T.progress * 5)) {
      Snd.chime(Math.floor(T.progress * 5) * 2);
      Native.vibrate(10, 60);
    }
    if (T.progress >= 1) { mode = 'busy'; setTimeout(() => flow && enterWrap(), 260); }
  }

  function enterBraid() {
    const T = flow.T;
    Braid.start(T, false);
    Snd.resetTune();
    mode = 'braid';
    flow.twist = 0;
    document.body.classList.toggle('braiding', !T.braid.rope);
    updateBraidHint();
    UI.prompt(T.braid.rope ? '手指打圈，把头发一圈圈拧起来' : '左右滑动，一下一个音', 0, true);
    requestLayout();
  }

  function updateBraidHint() {
    const b = flow && flow.T && flow.T.braid;
    if (!b) return;
    $('bhL').classList.toggle('next', b.next === 0);
    $('bhR').classList.toggle('next', b.next === 1);
  }

  function braidCommit() {
    const T = flow.T, b = T.braid;
    if (!Braid.commit(T)) return;
    b.drag = null;
    Snd.braidNote();
    Native.vibrate(9, 70);
    const e = Braid.endPoint(T);
    Scene.sparkleAt(e.x, e.y, 3, 20);
    updateBraidHint();
    if (b.n % 4 === 0) requestLayout();
    if (b.n >= b.max) {
      mode = 'busy';
      const my = ++flowToken;
      setTimeout(() => { if (my === flowToken && flow) enterWrap(); }, 260);
    }
  }

  function finishStyle() {
    const name = flow.name;
    flow = null;
    mode = 'idle';
    setFlowing(false);
    UI.prompt('');
    S().style = name;
    S().careCount++;
    Scene.bakeMirror();
    Scene.expression('happy', 2.4);
    Snd.arpeggio();
    Native.vibrate(30, 120);
    const h = Hair.head;
    for (let i = 0; i < 26; i++) Scene.sparkleAt(h.x + rnd(-260, 260), h.y + rnd(-260, 500), 1, 8);
    UI.toast(pick(KIND_LINES), 3000);
    Store.save();
    UI.renderPanel();
    setTimeout(checkGift, 2600);
  }

  function checkGift() {
    const c = S().careCount;
    const g = Art.ACC.find((a) => a.gift && a.gift <= c && !S().seenGifts.includes(a.id));
    if (!g || mode !== 'idle' || $('overlay').classList.contains('on')) return;
    S().seenGifts.push(g.id);
    Store.save();
    const o = UI.modal(`<div class="gift"><h3>抽屉里多了一样东西</h3><span id="giftC"></span><p>${g.n}<br>谢谢你今天也好好照顾了头发。</p><button class="btn" id="mOk">收下</button></div>`);
    const cv = Art.drawAcc(g.id);
    $('giftC').replaceWith(cv);
    Snd.arpeggio();
    $('mOk').onclick = () => { UI.overlay(''); UI.renderPanel(); };
  }

  function cancelFlow() {
    if (!flow) return;
    flowToken++;
    flow = null;
    mode = 'idle';
    Hair.releaseAll();
    setFlowing(false);
    UI.prompt('');
    setTimeout(() => { Hair.setStyle('loose'); S().style = 'loose'; Store.saveSoon(); UI.renderPanel(); }, 400);
  }

  function autoFinish() {
    if (!flow) return;
    const my = ++flowToken;
    UI.prompt('');
    document.getElementById('prompt').classList.remove('flow');
    mode = 'busy';
    const f = flow;
    const runTie = () => {
      if (my !== flowToken || !flow) return;
      const T = Hair.ties[f.index];
      f.T = T;
      Hair.finishGather(f.def.ties.length === 2 ? f.index : -1);
      setTimeout(() => {
        if (my !== flowToken || !flow) return;
        if (T.kind === 'bun') {
          tween((k) => { T.progress = k; Hair.markDirty(); }, 0.8, wrapStep);
        } else if (T.kind === 'braid') {
          if (!T.braid) { Braid.start(T, false); Snd.resetTune(); }
          const go = () => {
            if (my !== flowToken || !flow) return;
            if (T.braid.n < T.braid.max) {
              Braid.commit(T); Snd.braidNote();
              setTimeout(go, 75);
            } else wrapStep();
          };
          go();
        } else wrapStep();
      }, 420);
    };
    const wrapStep = () => {
      if (my !== flowToken || !flow) return;
      const T = f.T;
      T.visible = true;
      let n = 0;
      const tick = () => {
        if (my !== flowToken || !flow) return;
        n++; T.wraps = n; T.pop = 1; Snd.chime(n * 2);
        if (n < 3) setTimeout(tick, 170);
        else {
          if (T.kind === 'braid' && T.braid) Braid.finish(T);
          if (f.index < f.def.ties.length - 1) { f.index++; setTimeout(runTie, 240); }
          else finishStyle();
        }
      };
      tick();
    };
    runTie();
  }

  // ---- 长度 ----
  function setLength(y) {
    y = clamp(y, Hair.MIN_Y, Hair.MAX_Y);
    Hair.H.tipYT = y;
    S().hair.tipY = y;
    Store.saveSoon();
    requestLayout();
  }

  function lengthLabel(y) { return `到${Hair.yToName(y)} · 约 ${Math.round(Hair.yToCm(y))} 厘米`; }

  // ---- 发饰 ----
  function addAcc(id) {
    const a = { id, x: rnd(-110, 110), y: rnd(-170, -100), rot: rnd(-0.3, 0.3), scale: 1, lock: null, i: 0 };
    Scene.accs.push(a);
    selectedAcc = a;
    Snd.pop();
    const p = Scene.accWorld(a);
    Scene.sparkleAt(p[0], p[1], 6, 18);
    saveAcc();
  }

  function saveAcc() {
    S().accessories = Scene.accs.map((a) => ({
      id: a.id, x: a.x, y: a.y, rot: a.rot, scale: a.scale,
      lock: a.lock ? Hair.locks.indexOf(a.lock) : -1, i: a.i,
    }));
    Store.saveSoon();
  }

  function loadAcc(list) {
    Scene.accs.length = 0;
    list.forEach((a) => {
      Scene.accs.push({ id: a.id, x: a.x, y: a.y, rot: a.rot, scale: a.scale, lock: a.lock >= 0 ? Hair.locks[a.lock] : null, i: a.i });
    });
  }

  function accAction(k) {
    if (k === 'clear') { Scene.accs.length = 0; selectedAcc = null; saveAcc(); return; }
    const a = selectedAcc;
    if (!a) return;
    if (k === 'small') a.scale = Math.max(0.45, a.scale - 0.15);
    if (k === 'big') a.scale = Math.min(2.1, a.scale + 0.15);
    if (k === 'turn') a.rot += 0.4;
    if (k === 'del') {
      Scene.accs.splice(Scene.accs.indexOf(a), 1);
      selectedAcc = null;
    }
    saveAcc();
  }

  function hitAcc(w) {
    for (let i = Scene.accs.length - 1; i >= 0; i--) {
      const a = Scene.accs[i];
      const p = Scene.accWorld(a);
      if (Math.hypot(p[0] - w.x, p[1] - w.y) < 62 * a.scale + 18) return a;
    }
    return null;
  }

  // ---- 输入 ----
  function onDown(e) {
    Snd.init();
    if (paused) return;
    try { G.canvas.setPointerCapture(e.pointerId); } catch (err) {}
    const w = toWorld(e.clientX, e.clientY);
    ptr = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, wx: w.x, wy: w.y, t: performance.now(), moved: 0, acc: null, grab: false, spin: 0, turns: 0 };
    Circle.reset(e.clientX, e.clientY);

    if (mode === 'braid') {
      const b = flow.T.braid;
      Scene.handShow(e.clientX, e.clientY, b.rope ? 'point' : 'pinch');
      if (b.n < b.max && !b.rope) {
        const outer = b.next === 0 ? Braid.slotLeft(b) : Braid.slotRight(b);
        b.drag = { from: outer, side: b.next, p: 0 };
      }
      return;
    }
    if (mode === 'gather') { Scene.handShow(e.clientX, e.clientY, 'open'); return; }
    if (mode === 'wrap' || mode === 'coil') {
      Scene.handShow(e.clientX, e.clientY, 'point');
      if (flow) { flow.wrapA = null; flow.coilA = null; }
      return;
    }
    if (mode !== 'idle') return;

    if (UI.tab === 'acc' || Scene.accs.length) {
      const hit = hitAcc(w);
      if (hit) {
        ptr.acc = hit;
        hit.lock = null;
        selectedAcc = hit;
        if (UI.tab !== 'acc') UI.setTab('acc'); else UI.renderPanel();
        return;
      }
    }
    if (tool === 'hand') {
      ptr.grab = Hair.grabStart(w.x, w.y);
      Scene.handShow(e.clientX, e.clientY, ptr.grab ? 'pinch' : 'open');
      if (ptr.grab) { Native.vibrate(8, 40); Scene.expression('half', 0.4); }
    }
    if (tool === 'grow') Scene.handShow(e.clientX, e.clientY, 'pinch');
    if (tool === 'comb') {
      $('combCursor').classList.add('on');
      moveComb(e.clientX, e.clientY);
    }
    if (tool === 'grow') ptr.startLen = Hair.H.tipYT;
  }

  function moveComb(x, y) {
    $('combCursor').style.transform = `translate(${x - 46}px, ${y - 40}px)`;
  }

  function onMove(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const pts = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const list = pts.length ? pts : [e];
    for (const pe of list) moveOne(pe);
  }

  function moveOne(e) {
    const w = toWorld(e.clientX, e.clientY);
    const dxp = e.clientX - ptr.x, dyp = e.clientY - ptr.y;
    const dx = w.x - ptr.wx, dy = w.y - ptr.wy;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.wx = w.x; ptr.wy = w.y;
    ptr.moved += Math.hypot(dxp, dyp);
    const dist = Math.hypot(dx, dy);
    Scene.handMove(e.clientX, e.clientY);

    if (mode === 'gather') {
      const twoTie = flow.def.ties.length === 2;
      Hair.gatherAt(w.x, w.y, dist, twoTie ? flow.index : -1);
      Hair.push(w.x, w.y, dx, dy, 150);
      brushLevel = Math.min(1, dist / 40);
      if (groupProgress() >= 0.86) { mode = 'busy'; afterGather(); }
      return;
    }
    if (mode === 'coil') {
      const T = flow.T;
      const q = Hair.tiePos(T);
      const a = Math.atan2(w.y - q.y - T.def.by * T.progress, w.x - q.x - T.def.bx * T.progress);
      if (flow.coilA !== null) {
        let da = a - flow.coilA;
        while (da > Math.PI) da -= TAU;
        while (da < -Math.PI) da += TAU;
        coilAdd(Math.abs(da) / (TAU * 2.4));
      }
      flow.coilA = a;
      Hair.push(w.x, w.y, dx, dy, 120);
      return;
    }
    if (mode === 'wrap') {
      const p = wrapPoint(flow.T);
      const a = Math.atan2(w.y - p.y, w.x - p.x);
      if (flow.wrapA !== null) {
        let da = a - flow.wrapA;
        while (da > Math.PI) da -= TAU;
        while (da < -Math.PI) da += TAU;
        flow.wrapSum += da;
        flow.T.pop = Math.max(flow.T.pop, 0.25);
        if (Math.abs(flow.wrapSum) >= TAU * 0.85) {
          flow.wrapSum = 0;
          ptr.moved = 99;
          doWrap();
          if (!flow || mode !== 'wrap') return;
        }
      }
      flow.wrapA = a;
      return;
    }
    if (mode === 'braid') {
      const b = flow.T.braid;
      if (b.rope) {
        flow.twist += Math.abs(Circle.add(e.clientX, e.clientY));
        if (flow.twist >= Math.PI * 0.6 && b.n < b.max) { flow.twist = 0; braidCommit(); }
        return;
      }
      if (b.drag) {
        const span = Math.min(G.W * 0.34, 130);
        b.drag.p = clamp((Math.abs(e.clientX - ptr.sx) + Math.abs(e.clientY - ptr.sy) * 0.4) / span, 0, 1);
        if (b.drag.p >= 1) {
          braidCommit();
          ptr.sx = e.clientX; ptr.sy = e.clientY;
          if (b.n < b.max) {
            const outer = b.next === 0 ? Braid.slotLeft(b) : Braid.slotRight(b);
            b.drag = { from: outer, side: b.next, p: 0 };
          }
        }
      }
      return;
    }
    if (mode !== 'idle') return;

    if (ptr.acc) {
      const a = ptr.acc;
      const h = Hair.head, ca = Math.cos(-h.a), sa = Math.sin(-h.a);
      const lx = w.x - h.x, ly = w.y - h.y;
      a.x = lx * ca - ly * sa; a.y = lx * sa + ly * ca;
      return;
    }

    if (tool === 'comb') {
      moveComb(e.clientX, e.clientY);
      const hits = Hair.comb(w.x, w.y, dx, dy);
      brushLevel = Math.min(1, dist / 34);
      brushHold = 0.12;
      if (dist > 3 && Math.random() < 0.45) Scene.sparkleAt(w.x, w.y, 1, 34);
      if (dist > 6) Scene.expression('closed', 0.45);
      const now = performance.now();
      if (dist > 8 && now - lastTick > 70) { Native.vibrate(5, 28); lastTick = now; }
      if (hits > 0) { Scene.sparkleAt(w.x, w.y, 3, 40); }
      if (!ptr.tangleDone && Hair.tangleAvg() < 0.015 && dist > 0 && !Game._combedOnce) {
        Game._combedOnce = true;
        Scene.expression('happy', 1.8);
        Snd.arpeggio();
        UI.toast('梳顺了。', 2200);
        const h = Hair.head;
        for (let i = 0; i < 18; i++) Scene.sparkleAt(h.x + rnd(-240, 240), h.y + rnd(-200, Hair.H.tipY), 1, 8);
      }
      return;
    }
    if (tool === 'grow') {
      if (Math.abs(dyp) > 0 && Hair.H.style === 'loose') {
        const y = clamp(Hair.H.tipYT + dy * 1.3, Hair.MIN_Y, Hair.MAX_Y);
        Hair.H.tipYT = y;
        S().hair.tipY = y;
        UI.pill(lengthLabel(y));
        if (dy > 0 && Math.random() < 0.5) Scene.sparkleAt(w.x + rnd(-100, 100), Hair.H.tipY, 1, 20);
        const now = performance.now();
        if (Math.abs(dy) > 2 && now - lastTick > 90) { Native.vibrate(4, 24); lastTick = now; }
        Store.saveSoon();
        requestLayout();
      }
      return;
    }
    if (tool === 'hand') {
      if (ptr.grab) {
        Hair.grabMove(w.x, w.y);
        const d = Circle.add(e.clientX, e.clientY);
        ptr.spin = ptr.spin * 0.99 + d;
        if (Hair.isTwirling() || Math.abs(ptr.spin) > 2.6) {
          Hair.grabSpin(d);
          Scene.handPose('point');
          ptr.turns += Math.abs(d);
          if (ptr.turns > Math.PI) {
            ptr.turns = 0;
            Snd.chime(3 + Math.floor(rnd(5)));
            Native.vibrate(8, 50);
            Scene.sparkleAt(w.x, w.y, 2, 26);
            Scene.expression('closed', 0.5);
          }
        }
        return;
      }
      Hair.push(w.x, w.y, dx, dy, 150);
      brushLevel = Math.min(0.6, dist / 60);
      brushHold = 0.08;
    }
  }

  function onUp(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const tapped = ptr.moved < 12 && performance.now() - ptr.t < 320;
    const w = toWorld(e.clientX, e.clientY);
    const p = ptr;
    ptr = null;
    Scene.handHide();
    $('combCursor').classList.remove('on');
    if (p.grab) {
      const twirled = Hair.grabEnd();
      if (twirled) {
        Snd.pop();
        Native.vibrate(14, 80);
        Scene.expression('happy', 1.1);
        Scene.sparkleAt(w.x, w.y, 6, 34);
        if (!Game._twirlShown) { Game._twirlShown = true; UI.prompt('绕成小卷了。用梳子能梳回去', 2400); }
      }
    }

    if (mode === 'braid') {
      const b = flow.T.braid;
      if (b.drag) {
        if (tapped || b.drag.p >= 0.5) braidCommit();
        b.drag = null;
      }
      return;
    }
    if (mode === 'wrap') {
      if (tapped) doWrap();
      return;
    }
    if (mode === 'idle') {
      if (p.acc) {
        const a = p.acc;
        if (a.y > 215) {
          const n = Hair.nearestPoint(w.x, w.y);
          if (n && n.i >= Hair.NP) { a.lock = n.lock; a.i = n.i; }
        }
        saveAcc();
        return;
      }
      if (tapped) {
        if (selectedAcc) { selectedAcc = null; if (UI.tab === 'acc') UI.renderPanel(); }
        if (tool === 'hand') {
          const h = Hair.head;
          if (!p.grab && Math.abs(w.x - h.x) < 195 && w.y - h.y < 110 && w.y - h.y > -260) {
            Scene.expression('happy', 1.2);
            Scene.hearts(w.x, w.y - 30, 3);
            Snd.chime(4 + Math.floor(rnd(4)));
            h.vy += 7;
            Native.vibrate(12, 60);
          }
        }
      }
    }
  }

  function groupProgress() {
    const twoTie = flow.def.ties.length === 2;
    let s = 0, n = 0;
    for (const l of Hair.locks) {
      if (l.tie < 0) continue;
      if (twoTie && l.tie !== flow.index) continue;
      s += l.wT; n++;
    }
    return n ? s / n : 1;
  }

  // ---- 拍照 ----
  function takePhoto() {
    if (mode !== 'idle') return;
    Snd.shutter();
    Native.vibrate(20, 100);
    const flash = $('flash');
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    document.body.classList.add('photo');
    setTimeout(capture, 90);
  }

  function capture() {
    const saved = { x: cam.x, y: cam.y, z: cam.z, screenY: cam.screenY };
    computeFrame(true);
    Object.assign(cam, camT);
    Scene.draw(cam, 0);
    const srcCv = G.canvas;
    const W = 900, H = 1180;
    const out = Art.mk(W, H);
    const c = out.getContext('2d');
    c.fillStyle = '#FFFDF9'; c.fillRect(0, 0, W, H);
    const imgW = 820, imgH = 960;
    const sw = srcCv.width, sh = srcCv.height;
    const scale = Math.max(imgW / sw, imgH / sh);
    const dw = sw * scale, dh = sh * scale;
    c.save();
    c.beginPath(); c.rect(40, 40, imgW, imgH); c.clip();
    c.drawImage(srcCv, 40 + (imgW - dw) / 2, 40 + Math.max(0, (imgH - dh) / 2), dw, dh);
    c.restore();
    Object.assign(cam, saved);
    document.body.classList.remove('photo');
    requestLayout();

    const d = new Date();
    const dateText = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
    const n = S().name;
    const days = daysGrowing();
    const line2 = days > 0 ? `留长的第 ${days} 天` : '今天的头发';
    c.fillStyle = '#7A5C52';
    c.textAlign = 'center';
    c.font = '42px "Noto Serif CJK SC","Songti SC",serif';
    c.fillText(n ? `${n} · ${line2}` : line2, W / 2, 1082);
    c.font = '26px "Noto Serif CJK SC","Songti SC",serif';
    c.fillStyle = '#B09A8F';
    c.fillText(dateText, W / 2, 1132);

    const url = out.toDataURL('image/png');
    const thumb = Art.mk(300, 394);
    thumb.getContext('2d').drawImage(out, 0, 0, 300, 394);
    const entry = {
      t: thumb.toDataURL('image/jpeg', 0.78),
      d: dateText,
      style: Hair.H.style,
      hair: JSON.parse(JSON.stringify(S().hair)),
      tie: JSON.parse(JSON.stringify(S().tie)),
      accessories: JSON.parse(JSON.stringify(S().accessories)),
    };
    const al = S().album;
    al.unshift(entry);
    if (al.length > 30) al.length = 30;
    if (!Store.save()) { al.length = Math.max(0, al.length - 3); Store.save(); }

    UI.modal(`<img class="photo" src="${url}"><div class="row"><button class="btn" id="mSave">存到手机相册</button></div><button class="skip" id="mClose">只放在小相册里</button>`);
    $('mClose').onclick = () => UI.overlay('');
    $('mSave').onclick = () => {
      const ok = Native.saveImage(url, 'hair-' + Date.now());
      UI.overlay('');
      UI.prompt(ok ? '存好了，在“在头发长长之前”相册里' : '没能存下来，再试一次吧', 2400);
    };
  }

  function restorePhoto(p) {
    if (mode !== 'idle') return;
    Object.assign(S().hair, p.hair);
    Object.assign(S().tie, p.tie);
    S().accessories = p.accessories || [];
    Hair.H.tipYT = p.hair.tipY; Hair.H.waveT = p.hair.wave;
    applyDye(); applyTie();
    clearCurrentStyle(() => {
      Hair.setStyle(p.style, { done: true });
      S().style = p.style;
      loadAcc(S().accessories);
      Store.saveSoon();
      Scene.bakeMirror();
      UI.renderPanel();
      Scene.expression('happy', 1.6);
      requestLayout();
    });
  }

  // ---- 时光机 ----
  function openTime() {
    if (mode !== 'idle') return;
    mode = 'time';
    timeState = { saved: Hair.H.tipYT, style: Hair.H.style };
    const R = S().real;
    if (!R.date) R.date = Date.now();
    document.body.classList.add('timing');
    const tp = $('timePanel');
    tp.innerHTML = `<div id="tpWhen"></div><div id="tpLen"></div>
      <input type="range" id="tpRange" min="0" max="60" step="0.25" value="0">
      <div class="tp-ticks"><span>今天</span><span>1 年</span><span>2 年</span><span>3 年</span><span>4 年</span><span>5 年</span></div>
      <div id="tpNote">按每月约 ${RATE} 厘米估算，每个人的速度都不太一样。</div>
      <div class="tp-btns"><button class="btn ghost" id="tpBack">回到现在</button><button class="btn" id="tpKeep">就留到这么长</button></div>`;
    $('tpRange').addEventListener('input', () => updateTime(+$('tpRange').value));
    $('tpBack').onclick = () => closeTime(false);
    $('tpKeep').onclick = () => closeTime(true);
    if (Hair.H.style !== 'loose') {
      S().style = 'loose';
      clearCurrentStyle(() => { Hair.setStyle('loose'); updateTime(0); });
    } else updateTime(0);
    requestLayout();
  }

  function updateTime(m) {
    const now = Date.now();
    const cm = realCmAt(now + m * MS_MONTH);
    const y = Hair.cmToY(cm);
    Hair.H.tipYT = y;
    requestLayout();
    const dd = new Date(now + m * MS_MONTH);
    const when = m < 0.2 ? '今天' : m < 12 ? `再过 ${Math.round(m)} 个月` : (m % 12 < 0.5 ? `再过 ${Math.round(m / 12)} 年` : `再过 ${Math.floor(m / 12)} 年 ${Math.round(m % 12)} 个月`);
    $('tpWhen').textContent = when;
    $('tpLen').textContent = `${dd.getFullYear()} 年 ${dd.getMonth() + 1} 月 · 到${Hair.yToName(y)} · 约 ${Math.round(cm)} 厘米`;
    const mo = dd.getMonth() + 1;
    Scene.setSeason(mo >= 3 && mo <= 5 ? 'spring' : mo >= 6 && mo <= 8 ? 'summer' : mo >= 9 && mo <= 11 ? 'autumn' : 'winter');
    if (Math.random() < 0.6) {
      Scene.sparkleAt(rnd(-200, 200), Hair.H.tipY, 1, 20);
    }
  }

  function closeTime(keep) {
    document.body.classList.remove('timing');
    Scene.setSeason(null);
    if (keep) { S().hair.tipY = Hair.H.tipYT; }
    else Hair.H.tipYT = timeState.saved;
    Store.saveSoon();
    mode = 'idle';
    requestLayout();
    if (keep) { UI.toast('会到的。', 2200); Scene.expression('happy', 1.5); }
  }

  // ---- 第一次见面 ----
  function dailyGrowthText() {
    const mm = (RATE * 10) / 30.44;
    return `今天，你的头发又悄悄长了 ${mm.toFixed(1)} 毫米。`;
  }

  function showTitle() {
    document.body.classList.add('boarding');
    const first = !S().onboarded;
    UI.overlay(`<div class="title"><h1>在头发长长之前</h1><div>先在这里，把它梳好。</div></div>
      <div class="titlebot"><button class="btn" id="obStart">${first ? '开始' : '回来了'}</button><small>${dailyGrowthText()}</small></div>`);
    $('obStart').onclick = () => {
      Snd.init();
      Snd.chime(4);
      if (first) obName(); else enterGame();
    };
  }

  function obName() {
    UI.overlay(`<div class="ob"><h2>想让我怎么叫你？</h2><p>可以是任何你喜欢的名字。只存在这台手机里。</p>
      <input type="text" id="obN" maxlength="12" placeholder="你的名字"><br><button class="btn" id="obNext">就这样叫我</button><button class="skip" id="obSkip">先不说</button></div>`);
    $('obNext').onclick = () => { S().name = $('obN').value.trim().slice(0, 12); Store.save(); obNow(); };
    $('obSkip').onclick = obNow;
    UI.keyboardSafe($('obN'), document.querySelector('.ob'), () => $('obNext').click());
  }

  function obNow() {
    const marks = Hair.MARKS.slice(0, 6);
    let pick0 = 15;
    UI.overlay(`<div class="ob"><h2>现在的头发，大概到哪里？</h2><p id="obInfo">选一个差不多的就好。</p>
      <div class="wrap">${marks.map((m) => `<button class="chip${m.cm === 15 ? ' on' : ''}" data-cm="${m.cm}">${m.n}</button>`).join('')}</div>
      <button class="btn" id="obNext">下一步</button></div>`);
    document.querySelectorAll('[data-cm]').forEach((b) => {
      b.onclick = () => {
        pick0 = +b.dataset.cm;
        document.querySelectorAll('[data-cm]').forEach((x) => x.classList.toggle('on', x === b));
        Hair.H.tipYT = Hair.cmToY(pick0);
        $('obInfo').textContent = `大约 ${pick0} 厘米`;
        Snd.chime(3);
      };
    });
    $('obNext').onclick = () => {
      S().real.cm = pick0; S().real.date = Date.now();
      obGoal(pick0);
    };
  }

  function obGoal(cur) {
    const opts = Hair.MARKS.filter((m) => m.cm > cur + 2 && m.cm <= 130).slice(0, 7);
    const m0 = opts.find((m) => m.n === '腰') || opts[Math.floor(opts.length / 2)] || Hair.MARKS[6];
    let goal = m0.cm;
    const info = (c) => {
      const months = Math.ceil((c - cur) / RATE);
      const y = Math.floor(months / 12), mo = months % 12;
      return `大约还要 ${y ? y + ' 年' : ''}${mo ? (y ? ' ' : '') + mo + ' 个月' : ''}。不着急，这段时间我们在这里玩。`;
    };
    UI.overlay(`<div class="ob"><h2>想留到哪里？</h2><p id="obInfo">${info(goal)}</p>
      <div class="wrap">${opts.map((m) => `<button class="chip${m.cm === goal ? ' on' : ''}" data-cm="${m.cm}">${m.n}</button>`).join('')}</div>
      <button class="btn" id="obNext">好</button></div>`);
    document.querySelectorAll('[data-cm]').forEach((b) => {
      b.onclick = () => {
        goal = +b.dataset.cm;
        document.querySelectorAll('[data-cm]').forEach((x) => x.classList.toggle('on', x === b));
        $('obInfo').textContent = info(goal);
        Snd.chime(5);
      };
    });
    $('obNext').onclick = () => { S().real.goalCm = goal; Store.save(); ceremony(goal); };
  }

  function ceremony(goal) {
    UI.overlay(`<div class="ceremony" id="cer"></div>`);
    const cer = $('cer');
    const say = (t) => { cer.style.opacity = 0; setTimeout(() => { cer.textContent = t; cer.style.opacity = 1; }, 500); };
    Scene.expression('closed', 7.5);
    setTimeout(() => say('闭上眼睛。'), 300);
    const from = Hair.H.tipY, to = Hair.cmToY(goal);
    setTimeout(() => {
      say('想象一下，时间慢慢地过去了。');
      Snd.arpeggio();
      tween((k) => {
        const e = easeInOut(k);
        Hair.H.tipYT = lerp(from, to, e);
        requestLayout();
        if (Math.random() < 0.5) Scene.sparkleAt(rnd(-230, 230), Hair.H.tipY + rnd(-20, 10), 1, 12);
      }, 4.6, () => {
        S().hair.tipY = to;
        Store.save();
      });
    }, 2100);
    setTimeout(() => {
      say('睁开吧。');
      Scene.expression('happy', 2.6);
      Snd.arpeggio();
      const h = Hair.head;
      for (let i = 0; i < 24; i++) Scene.sparkleAt(h.x + rnd(-260, 260), h.y + rnd(-250, 700), 1, 8);
    }, 7400);
    setTimeout(() => say('这是你的头发。'), 9600);
    setTimeout(() => {
      S().onboarded = true;
      Store.save();
      enterGame(true);
    }, 12200);
  }

  function enterGame(firstTime) {
    UI.overlay('');
    document.body.classList.remove('boarding');
    mode = 'idle';
    updateGreet();
    requestLayout();
    Snd.rain(!!Art.ROOM[S().look.room].rain);
    if (Hair.H.style === 'loose') Hair.setTangle(0.75);
    Game._combedOnce = false;
    setTimeout(() => UI.prompt(firstTime ? '抓一把试试。这些头发是你的。' : pick(['睡了一觉，头发有点乱，梳一梳吧', '今天想梳什么样子？', '慢慢来，不赶时间。']), 3400), 500);
  }

  // ---- 主循环 ----
  let fpsT = 0, fpsN = 0, fpsSlow = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (paused) { last = now; return; }
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;

    const tilt = Native.tilt();
    Hair.grav.x += (tilt[0] * 0.5 - Hair.grav.x) * 0.1;

    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i];
      t.t += dt;
      const k = clamp(t.t / t.dur, 0, 1);
      t.fn(k);
      if (k >= 1) { tweens.splice(i, 1); if (t.done) t.done(); }
    }

    acc += dt;
    let n = 0;
    while (acc >= 1 / 60 && n < 3) { Hair.step(); acc -= 1 / 60; n++; }
    if (n === 3) acc = 0;

    if (brushHold > 0) brushHold -= dt; else brushLevel *= 0.8;
    Snd.brush(brushLevel);

    if (layoutDirty) { computeFrame(false); layoutDirty = false; }
    if (mode === 'braid') computeFrame(false);
    const r = mode === 'boot' ? 1 : 0.1;
    cam.x = lerp(cam.x, camT.x, r); cam.y = lerp(cam.y, camT.y, r);
    cam.z = lerp(cam.z, camT.z, r); cam.screenY = lerp(cam.screenY, camT.screenY, r);

    glowHints(dt);
    Scene.updateFace(dt);
    Scene.updateParticles(dt);
    Scene.ambient(dt);
    Scene.draw(cam, dt);
    adaptQuality(dt);
  }

  function glowHints(dt) {
    glowT -= dt;
    if (glowT > 0 || !flow || !flow.T) return;
    glowT = 0.16;
    if (mode === 'gather' || mode === 'wrap' || mode === 'coil') {
      const T = flow.T;
      const p = mode === 'wrap' ? wrapPoint(T) : Hair.tiePos(T);
      const px = p.x, py = p.y + (mode === 'coil' ? T.def.by * T.progress : 0);
      Scene.spawn('dot', px, py, { life: 0.8, max: 0.8, size: mode === 'wrap' ? 170 : 210, alpha: 0.55, tint: [1, 0.86, 0.72], vr: 0 });
      Scene.sparkleAt(px, py, 1, 36);
    } else if (mode === 'braid') {
      const b = flow.T.braid;
      if (!b) return;
      const idx = b.next === 0 ? Braid.slotLeft(b) : Braid.slotRight(b);
      const r = b.bundles[idx].rope;
      Scene.spawn('dot', r.x[4], r.y[4], { life: 0.6, max: 0.6, size: 64, alpha: 0.42, tint: [1, 0.92, 0.82], vr: 0 });
    }
  }

  function adaptQuality(dt) {
    fpsT += dt; fpsN++;
    if (fpsT < 1.5) return;
    const avg = fpsT / fpsN;
    fpsT = 0; fpsN = 0;
    if (avg > 0.03) fpsSlow++; else fpsSlow = 0;
    if (fpsSlow >= 2) {
      fpsSlow = 0;
      const q = G.quality;
      if (q.dpr > 1.25) { q.dpr = Math.max(1.25, q.dpr - 0.4); G.resize(); }
      else if (q.sub > 2) q.sub = 2;
      else if (q.dpr > 1) { q.dpr = 1; G.resize(); }
    }
  }

  // ---- 生命周期 ----
  window.onAppPause = () => { paused = true; Snd.suspend(); Store.save(); };
  window.onAppResume = () => { paused = false; last = 0; Snd.resume(); };
  window.onAppBack = () => {
    if ($('overlay').classList.contains('on') && S().onboarded && !document.body.classList.contains('boarding')) { UI.overlay(''); return true; }
    if (document.body.classList.contains('timing')) { closeTime(false); return true; }
    if (flow) { cancelFlow(); return true; }
    return false;
  };
  window.setSafeInsets = (top, bottom) => {
    const r = document.documentElement.style;
    r.setProperty('--safe-top', top + 'px');
    r.setProperty('--safe-bottom', bottom + 'px');
    requestLayout();
  };

  function boot() {
    Store.load();
    const canvas = $('gl');
    if (!G.init(canvas)) {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;line-height:1.8">这台设备的图形环境暂时用不了。<br>可以试试更新一下 Android System WebView。</div>';
      return;
    }
    Scene.initTextures();
    const D = S();
    Hair.reset({ tipY: D.onboarded ? D.hair.tipY : Hair.cmToY(15), wave: D.hair.wave });
    Scene.setDye(D.hair.dye, D.hair.custom);
    Scene.setStreak(D.hair.streak);
    Scene.bakeLook(D.look);
    Scene.bakeTie(D.tie);
    Scene.setRoom(D.look.room, true);
    if (D.onboarded && D.style && D.style !== 'loose' && Hair.STYLES[D.style]) Hair.setStyle(D.style, { done: true });
    Scene.bakeMirror();
    loadAcc(D.accessories);
    UI.init();
    updateGreet();

    // 图形上下文丢失时（比如长时间切到后台），存档后重新载入
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); paused = true; Store.save(); });
    canvas.addEventListener('webglcontextrestored', () => location.reload());

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', () => { G.resize(); requestLayout(); });
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    computeFrame(false);
    Object.assign(cam, camT);
    showTitle();
    requestAnimationFrame(frame);
  }

  const api = {
    get tool() { return tool; }, get mode() { return mode; }, get flow() { return flow; },
    get selectedAcc() { return selectedAcc; }, cam, camT,
    setTool, startStyle, cancelFlow, autoFinish, addAcc, accAction,
    applyDye, applyLook, applyTie, applyRoom, requestLayout, updateGreet,
    takePhoto, openTime, restorePhoto, enterGame, setLength,
    _combedOnce: false, _twirlShown: false,
  };

  window.addEventListener('DOMContentLoaded', boot);
  return api;
})();
