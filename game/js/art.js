// 所有画面都是代码现画的：人物、房间、发圈、发饰
const Art = (() => {
  const mk = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    return c;
  };

  const SKINS = [
    { n: '瓷白', base: '#FCE9DE', shade: '#F3CFBF', deep: '#E2AE9B', blush: '#F6A8A2', line: '#B5796A' },
    { n: '暖白', base: '#F9DFCB', shade: '#EFC4A9', deep: '#D9A086', blush: '#F39D90', line: '#A86F58' },
    { n: '蜜色', base: '#ECC29D', shade: '#DBA27C', deep: '#BF825E', blush: '#E68A72', line: '#8E5A40' },
    { n: '小麦', base: '#CB9265', shade: '#B2794F', deep: '#905C3A', blush: '#CC6A52', line: '#6B4029' },
    { n: '深棕', base: '#8D5D3F', shade: '#754A2C', deep: '#58351E', blush: '#A95642', line: '#3F2414' },
  ];
  const EYES = [
    { n: '琥珀', a: '#7A4A2E', b: '#C98A52', c: '#F2C78C' },
    { n: '深褐', a: '#3E2820', b: '#7C5240', c: '#B98A6C' },
    { n: '雾蓝', a: '#3D5C80', b: '#7EA4C8', c: '#C7E0F0' },
    { n: '橄榄', a: '#4C5C36', b: '#8BA05E', c: '#CBD79A' },
    { n: '紫藤', a: '#5A4580', b: '#9B82C6', c: '#D9C8EE' },
    { n: '樱粉', a: '#8E4A66', b: '#D88AA6', c: '#F6CBD8' },
  ];
  const LIPS = [
    { n: '裸粉', c: '#D98C86' }, { n: '蜜桃', c: '#EE9078' }, { n: '玫瑰', c: '#CC5F72' },
    { n: '豆沙', c: '#B56A68' }, { n: '浆果', c: '#993E58' },
  ];
  const OUTFITS = [
    { n: '奶油毛衣', base: '#F6EBDC', shade: '#E2CDB4', deep: '#C9AE90', trim: '#EFDFCB', pat: 'knit' },
    { n: '白棉布裙', base: '#FFFDF8', shade: '#E8E2DA', deep: '#CFC6BC', trim: '#F4C7C3', pat: 'lace' },
    { n: '雾蓝碎花', base: '#BBD0E0', shade: '#97B3C9', deep: '#7795AE', trim: '#F7F2E9', pat: 'flower' },
    { n: '樱花睡裙', base: '#F7D4D8', shade: '#E8B3BA', deep: '#CF929B', trim: '#FFF4F2', pat: 'piping' },
    { n: '鼠尾草绿', base: '#BCCBA8', shade: '#9CAF88', deep: '#7D916D', trim: '#F5F0E0', pat: 'plain' },
  ];

  // ---- 脸 ----
  const HEAD_S = 1.8, HEAD_X0 = -200, HEAD_Y0 = -200, HEAD_W = 400, HEAD_H = 440;

  function facePath(c) {
    c.beginPath();
    c.moveTo(-152, -142);
    c.bezierCurveTo(-163, -60, -161, 30, -149, 78);
    c.bezierCurveTo(-135, 130, -72, 190, -8, 201);
    c.quadraticCurveTo(0, 203, 8, 201);
    c.bezierCurveTo(72, 190, 135, 130, 149, 78);
    c.bezierCurveTo(161, 30, 163, -60, 152, -142);
    c.bezierCurveTo(100, -192, -100, -192, -152, -142);
    c.closePath();
  }

  function drawHeadBase(look, cv) {
    const S = SKINS[look.skin];
    cv = cv || mk(HEAD_W * HEAD_S, HEAD_H * HEAD_S);
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(HEAD_S, 0, 0, HEAD_S, -HEAD_X0 * HEAD_S, -HEAD_Y0 * HEAD_S);

    // 耳朵
    for (const s of [-1, 1]) {
      c.save(); c.scale(s, 1);
      c.fillStyle = S.base;
      c.beginPath();
      c.moveTo(146, 12);
      c.bezierCurveTo(176, -10, 186, 34, 175, 62);
      c.bezierCurveTo(168, 88, 152, 96, 143, 84);
      c.closePath(); c.fill();
      c.strokeStyle = S.shade; c.lineWidth = 3;
      c.beginPath();
      c.moveTo(154, 28); c.bezierCurveTo(170, 22, 172, 50, 162, 66);
      c.stroke();
      c.restore();
    }

    // 脸型
    facePath(c);
    c.fillStyle = S.base; c.fill();
    c.save(); facePath(c); c.clip();

    let g = c.createLinearGradient(0, -190, 0, -40);
    g.addColorStop(0, S.deep); g.addColorStop(0.55, S.shade + 'cc'); g.addColorStop(1, S.shade + '00');
    c.fillStyle = g; c.fillRect(-200, -200, 400, 170);

    for (const s of [-1, 1]) {
      g = c.createRadialGradient(s * 165, 60, 20, s * 165, 60, 90);
      g.addColorStop(0, S.shade + 'b0'); g.addColorStop(1, S.shade + '00');
      c.fillStyle = g; c.fillRect(-200, -60, 400, 260);
    }
    g = c.createLinearGradient(0, 150, 0, 205);
    g.addColorStop(0, S.shade + '00'); g.addColorStop(1, S.shade + 'a0');
    c.fillStyle = g; c.fillRect(-200, 140, 400, 70);

    // 腮红
    for (const s of [-1, 1]) {
      c.save();
      c.translate(s * 100, 106); c.scale(1, 0.56);
      g = c.createRadialGradient(0, 0, 4, 0, 0, 52);
      g.addColorStop(0, S.blush + 'a8'); g.addColorStop(0.6, S.blush + '50'); g.addColorStop(1, S.blush + '00');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 52, 0, TAU); c.fill();
      c.restore();
    }

    // 雀斑 / 泪痣
    if (look.freckle) {
      c.fillStyle = S.deep + '90';
      const r = hashRand(5);
      for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.arc(s * (58 + r() * 66), 84 + r() * 26, 1.3 + r() * 1.2, 0, TAU);
        c.fill();
      }
    }
    if (look.mole) {
      c.fillStyle = S.line;
      c.beginPath(); c.arc(112, 88, 2.8, 0, TAU); c.fill();
    }
    c.restore();
    return cv;
  }

  // 眼睛和表情：open / half / closed / happy
  const FEAT_S = 2.0, FEAT_X0 = -140, FEAT_Y0 = -50, FEAT_W = 280, FEAT_H = 215;

  function eyeOutline(c, shape, open) {
    const cfg = [
      { out: 2, ctlA: -26, ctlB: -44, inn: 15 },
      { out: -10, ctlA: -22, ctlB: -40, inn: 14 },
      { out: 13, ctlA: -30, ctlB: -40, inn: 12 },
    ][shape];
    const lift = lerp(0.42, 1, open);
    const uy = (v) => lerp(cfg.inn + 6, v, lift);
    c.beginPath();
    c.moveTo(-37, cfg.inn);
    c.bezierCurveTo(-27, uy(cfg.ctlA), 18, uy(cfg.ctlB), 41, cfg.out);
    c.bezierCurveTo(33, 27, -8, 38, -37, cfg.inn);
    c.closePath();
    return { cfg, uy };
  }

  function drawFeatures(look, frame, hairHex, cv) {
    const S = SKINS[look.skin];
    const E = EYES[look.eye];
    const lip = LIPS[look.lip].c;
    cv = cv || mk(FEAT_W * FEAT_S, FEAT_H * FEAT_S);
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(FEAT_S, 0, 0, FEAT_S, -FEAT_X0 * FEAT_S, -FEAT_Y0 * FEAT_S);
    const dark = look.skin >= 3;
    const lashCol = dark ? '#2B1A14' : '#4A302C';

    // 眉
    const browCol = mixHex(hairHex, '#4A302C', 0.5);
    for (const s of [-1, 1]) {
      c.save(); c.scale(s, 1);
      c.fillStyle = browCol + (dark ? 'ff' : 'c0');
      c.beginPath();
      const bLift = frame === 'happy' ? -5 : 0;
      c.moveTo(32, -6 + bLift);
      c.quadraticCurveTo(72, -30 + bLift, 118, -9 + bLift);
      c.quadraticCurveTo(74, -22 + bLift, 34, 0 + bLift);
      c.closePath(); c.fill();
      c.restore();
    }

    for (const s of [-1, 1]) {
      c.save();
      c.translate(s * 70, 44);
      c.scale(s * 1.13, 1.13);
      if (frame === 'open' || frame === 'half') {
        const open = frame === 'open' ? 1 : 0.5;
        const { cfg, uy } = eyeOutline(c, look.eyeShape, open);
        c.fillStyle = '#FFFBF7'; c.fill();
        c.save();
        eyeOutline(c, look.eyeShape, open); c.clip();
        const g = c.createLinearGradient(0, -36, 0, 40);
        g.addColorStop(0, E.a); g.addColorStop(0.55, E.b); g.addColorStop(1, E.c);
        c.fillStyle = g;
        c.beginPath(); c.ellipse(3, 3, 30, 36, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(30,18,16,.88)';
        c.beginPath(); c.ellipse(3, 2, 14.5, 19, 0, 0, TAU); c.fill();
        c.strokeStyle = E.a + 'aa'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(3, 3, 29, 35, 0, 0, TAU); c.stroke();
        // 高光（镜像回来，让两只眼睛的光在同一侧）
        c.save(); c.scale(s, 1);
        const hx = s * 3;
        const hy0 = open === 1 ? -9 : 0;
        c.fillStyle = 'rgba(255,255,255,.96)';
        c.beginPath(); c.ellipse(hx + 11, hy0, 8.5, 10, 0.3, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.72)';
        c.beginPath(); c.arc(hx - 10, hy0 + 25, 4.2, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.28)';
        c.beginPath(); c.ellipse(hx + 4, hy0 + 30, 15, 6, 0, 0, TAU); c.fill();
        c.restore();
        // 上眼睑投影
        c.fillStyle = 'rgba(90,60,70,.22)';
        c.beginPath();
        c.moveTo(-40, cfg.inn - 3);
        c.bezierCurveTo(-27, uy(cfg.ctlA) + 10, 18, uy(cfg.ctlB) + 10, 44, cfg.out + 3);
        c.lineTo(44, -60); c.lineTo(-40, -60); c.closePath(); c.fill();
        c.restore();

        // 上睫毛：粗细变化的一条线
        c.fillStyle = lashCol;
        c.beginPath();
        c.moveTo(-39, cfg.inn + 1);
        c.bezierCurveTo(-27, uy(cfg.ctlA), 18, uy(cfg.ctlB), 41, cfg.out);
        c.quadraticCurveTo(46, cfg.out - 3, 49, cfg.out - 8);
        c.quadraticCurveTo(48, cfg.out + 1, 41, cfg.out + 5);
        c.bezierCurveTo(16, uy(cfg.ctlB) + 12, -24, uy(cfg.ctlA) + 12, -39, cfg.inn + 1);
        c.closePath(); c.fill();
        // 眼尾两根小睫毛
        c.lineCap = 'round';
        // 下眼线
        c.strokeStyle = S.line + 'b0'; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(38, cfg.out + 8); c.bezierCurveTo(26, 28, 4, 36, -12, 33);
        c.stroke();
        // 双眼皮
        c.strokeStyle = S.line + '80'; c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-26, uy(-16)); c.bezierCurveTo(-14, uy(-44), 18, uy(-52), 38, uy(-24));
        c.stroke();
      } else if (frame === 'closed') {
        c.strokeStyle = lashCol; c.lineCap = 'round'; c.lineWidth = 4.6;
        c.beginPath(); c.moveTo(-36, 12); c.quadraticCurveTo(2, 34, 42, 8); c.stroke();
        c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(35, 15); c.lineTo(46, 23); c.stroke();
        c.beginPath(); c.moveTo(23, 22); c.lineTo(31, 32); c.stroke();
        c.beginPath(); c.moveTo(9, 26); c.lineTo(13, 37); c.stroke();
      } else {
        c.strokeStyle = lashCol; c.lineCap = 'round'; c.lineWidth = 4.8;
        c.beginPath(); c.moveTo(-34, 20); c.quadraticCurveTo(2, -18, 40, 18); c.stroke();
        c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(38, 16); c.lineTo(50, 12); c.stroke();
      }
      c.restore();
    }

    // 鼻
    c.strokeStyle = S.line + '90'; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4, 100); c.quadraticCurveTo(3, 106, 8, 100); c.stroke();

    // 嘴
    if (frame === 'happy') {
      c.fillStyle = mixHex(lip, '#7A3040', 0.25);
      c.beginPath();
      c.moveTo(-24, 134); c.quadraticCurveTo(0, 140, 24, 134);
      c.quadraticCurveTo(14, 160, 0, 160); c.quadraticCurveTo(-14, 160, -24, 134);
      c.closePath(); c.fill();
      c.fillStyle = '#F39FA8';
      c.beginPath(); c.ellipse(0, 153, 11, 6.5, 0, 0, TAU); c.fill();
    } else {
      c.fillStyle = lip + '80';
      c.beginPath();
      c.moveTo(-13, 142); c.quadraticCurveTo(0, 145, 13, 142);
      c.quadraticCurveTo(7, 151, 0, 151); c.quadraticCurveTo(-7, 151, -13, 142);
      c.closePath(); c.fill();
      c.strokeStyle = mixHex(lip, '#60303A', 0.5); c.lineWidth = 2.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-21, 137); c.quadraticCurveTo(0, 147, 21, 137); c.stroke();
    }
    return cv;
  }

  // ---- 身体 ----
  const BODY_S = 0.7, BODY_X0 = -560, BODY_Y0 = 140, BODY_W = 1120, BODY_H = 2240;

  // 身形由四个 0~1 的数决定，没有哪一格是“标准”
  const BODY_DEFAULT = { shoulder: 0.5, waist: 0.62, hip: 0.5, build: 0.45 };

  function bodyShape(look) {
    const b = Object.assign({}, BODY_DEFAULT, look.body);
    const fat = lerp(-14, 46, b.build);
    const sx = lerp(172, 240, b.shoulder) + fat * 0.35;
    const wx = lerp(118, 200, b.waist) + fat;
    const hx = Math.max(lerp(165, 262, b.hip) + fat * 0.8, wx + 4);
    const rx = lerp(sx * 0.86, wx, 0.35);
    const hem = Math.min(hx * 1.72, 540);
    const nw = lerp(48, 66, b.build) + lerp(-2, 8, b.shoulder);
    const h0 = lerp(30, 56, b.build), h1 = lerp(24, 42, b.build);
    const wristX = Math.max(sx + 34, hx + h1 * 0.9 + 6);
    return { sx, wx, hx, rx, hem, nw, nl: nw + 30, h0, h1, wristX, shoulder: b.shoulder };
  }

  function drawBody(look, cv) {
    const S = SKINS[look.skin];
    const O = OUTFITS[look.outfit];
    const B = bodyShape(look);
    const { sx, wx, hx, rx, hem, nw, nl, h0, h1, wristX } = B;
    cv = cv || mk(BODY_W * BODY_S, BODY_H * BODY_S);
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(BODY_S, 0, 0, BODY_S, -BODY_X0 * BODY_S, -BODY_Y0 * BODY_S);

    // 脖子和肩颈皮肤
    c.fillStyle = S.base;
    c.beginPath();
    c.moveTo(-nw, 140);
    c.bezierCurveTo(-nw + 2, 210, -nw + 2, 248, -nw - 20, 276);
    c.bezierCurveTo(-nw - 56, 300, -sx * 0.82, 306, -sx * 0.97, 340);
    c.lineTo(sx * 0.97, 340);
    c.bezierCurveTo(sx * 0.82, 306, nw + 56, 300, nw + 20, 276);
    c.bezierCurveTo(nw - 2, 248, nw - 2, 210, nw, 140);
    c.closePath(); c.fill();
    // 后颈的一点阴影
    let g = c.createLinearGradient(0, 150, 0, 270);
    g.addColorStop(0, S.shade + 'c0'); g.addColorStop(1, S.shade + '00');
    c.fillStyle = g;
    c.fillRect(-nw, 150, nw * 2, 120);

    // 手臂的中线：从肩头垂下来，到手腕时贴着胯的外侧
    const armPts = (s) => {
      const P = [[sx - 10, 350 + h0 * 0.72], [sx + 18, 560], [lerp(sx + 22, wristX, 0.6), 830], [wristX, 1095]];
      const out = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28, m = 1 - t;
        const x = m * m * m * P[0][0] + 3 * m * m * t * P[1][0] + 3 * m * t * t * P[2][0] + t * t * t * P[3][0];
        const y = m * m * m * P[0][1] + 3 * m * m * t * P[1][1] + 3 * m * t * t * P[2][1] + t * t * t * P[3][1];
        out.push([x, y, lerp(h0, h1, t)]);
      }
      return out.map((p) => [s * p[0], p[1], p[2]]);
    };

    function hand(s) {
      const cx = s * (wristX + 2), hw = h1 * 1.02;
      c.fillStyle = S.base;
      c.beginPath(); c.ellipse(cx, 1150, hw, 62, 0, 0, TAU); c.fill();
      c.fillRect(cx - hw, 1088, hw * 2, 62);
    }
    hand(-1); hand(1);

    function armFill(s, grow, col) {
      const pts = armPts(s);
      c.fillStyle = col;
      c.beginPath();
      pts.forEach((p, i) => { const x = p[0] + s * (p[2] + grow); if (i) c.lineTo(x, p[1]); else c.moveTo(x, p[1]); });
      for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0] - s * (pts[i][2] + grow), pts[i][1]);
      c.closePath(); c.fill();
      c.beginPath(); c.arc(pts[0][0], pts[0][1], pts[0][2] + grow, 0, TAU); c.fill();
    }

    function arm(s) {
      armFill(s, 4, mixHex(O.base, O.shade, 0.6));
      armFill(s, 0, O.base);
      const pts = armPts(s), e = pts[pts.length - 1], q = pts[pts.length - 3];
      const w = e[2] + 6;
      c.fillStyle = O.trim;
      c.beginPath();
      c.moveTo(q[0] - w, q[1]); c.lineTo(q[0] + w, q[1]); c.lineTo(e[0] + w, e[1] + 8); c.lineTo(e[0] - w, e[1] + 8);
      c.closePath(); c.fill();
    }

    // 裙身
    function dress() {
      c.beginPath();
      c.moveTo(-nl, 288);
      c.bezierCurveTo(-nl - 36, 302, -sx * 0.857, 312, -sx, 346);
      c.bezierCurveTo(-sx * 0.97, 430, -rx - 20, 530, -rx, 640);
      c.bezierCurveTo(-lerp(rx, wx, 0.45), 720, -wx - 4, 790, -wx, 850);
      c.bezierCurveTo(-lerp(wx, hx, 0.35), 930, -lerp(wx, hx, 0.8), 1000, -hx, 1080);
      c.bezierCurveTo(-hx * 1.2, 1400, -hx * 1.55, 1800, -hem, 2400);
      c.lineTo(hem, 2400);
      c.bezierCurveTo(hx * 1.55, 1800, hx * 1.2, 1400, hx, 1080);
      c.bezierCurveTo(lerp(wx, hx, 0.8), 1000, lerp(wx, hx, 0.35), 930, wx, 850);
      c.bezierCurveTo(wx + 4, 790, lerp(rx, wx, 0.45), 720, rx, 640);
      c.bezierCurveTo(rx + 20, 530, sx * 0.97, 430, sx, 346);
      c.bezierCurveTo(sx * 0.857, 312, nl + 36, 302, nl, 288);
      c.quadraticCurveTo(0, 326, -nl, 288);
      c.closePath();
    }
    dress();
    c.fillStyle = O.base; c.fill();
    c.save();
    dress(); c.clip();

    if (O.pat === 'knit') {
      c.strokeStyle = O.shade + '70'; c.lineWidth = 3;
      const span = hem / 1.04 + 15;
      for (let x = -span; x <= span; x += 15) {
        c.beginPath();
        c.moveTo(x * 0.6, 280);
        c.quadraticCurveTo(x * 0.62, 900, x * 1.04, 2400);
        c.stroke();
      }
    } else if (O.pat === 'flower') {
      const r = hashRand(77);
      for (let i = 0; i < 420; i++) {
        const x = lerp(-hem, hem, r()), y = lerp(290, 2400, r());
        c.save();
        c.translate(x, y);
        c.fillStyle = r() < 0.5 ? '#FBF3E6dd' : '#F3C9CFdd';
        for (let k = 0; k < 5; k++) {
          c.rotate(TAU / 5);
          c.beginPath(); c.ellipse(0, -6.5, 4.5, 6.5, 0, 0, TAU); c.fill();
        }
        c.fillStyle = '#E8B85Add'; c.beginPath(); c.arc(0, 0, 3.4, 0, TAU); c.fill();
        c.restore();
      }
    }
    // 明暗
    const side = Math.max(sx, hx) + 24;
    g = c.createLinearGradient(-side, 0, side, 0);
    g.addColorStop(0, O.deep + '90'); g.addColorStop(0.2, O.deep + '00');
    g.addColorStop(0.8, O.deep + '00'); g.addColorStop(1, O.deep + '90');
    c.fillStyle = g; c.fillRect(-560, 280, 1120, 2200);

    // 腰越直，腰线的阴影越淡
    const curve = clamp((hx - wx) / 90, 0, 1);
    const waistA = Math.round(curve * 54).toString(16).padStart(2, '0');
    g = c.createLinearGradient(0, 800, 0, 900);
    g.addColorStop(0, O.deep + '00'); g.addColorStop(0.55, O.deep + waistA); g.addColorStop(1, O.deep + '00');
    c.fillStyle = g; c.fillRect(-560, 800, 1120, 100);

    const fold = hx / 206;
    c.strokeStyle = O.deep + '55'; c.lineCap = 'round'; c.lineWidth = 8;
    for (const x of [-96, -30, 44, 112]) {
      c.beginPath();
      c.moveTo(x * 0.78 * fold, 900);
      c.bezierCurveTo(x * 0.96 * fold, 1300, x * 1.2 * fold, 1800, x * 1.42 * fold, 2400);
      c.stroke();
    }
    c.restore();

    // 领口
    c.strokeStyle = O.trim; c.lineWidth = 20;
    c.beginPath(); c.moveTo(-nl, 288); c.quadraticCurveTo(0, 326, nl, 288); c.stroke();
    c.strokeStyle = O.shade; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-nl - 12, 300); c.quadraticCurveTo(0, 344, nl + 12, 300); c.stroke();
    if (O.pat === 'lace') {
      c.fillStyle = O.trim;
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const x = lerp(-nl - 6, nl + 6, t);
        const y = (1 - t) * (1 - t) * 300 + 2 * (1 - t) * t * 340 + t * t * 300;
        c.beginPath(); c.arc(x, y, 8.5, 0, TAU); c.fill();
      }
    }
    // 腰后的小蝴蝶结
    for (const s of [-1, 1]) {
      c.save(); c.translate(0, 862); c.scale(s, 1);
      c.fillStyle = O.trim;
      c.beginPath(); c.moveTo(4, 0); c.bezierCurveTo(26, -42, 74, -34, 68, 0); c.bezierCurveTo(74, 30, 26, 36, 4, 0); c.fill();
      c.fillStyle = O.shade;
      c.beginPath(); c.moveTo(4, 8); c.lineTo(34, 66); c.lineTo(18, 62); c.lineTo(8, 72); c.lineTo(-2, 10); c.fill();
      c.restore();
    }
    c.fillStyle = O.trim; c.beginPath(); c.ellipse(0, 862, 12, 16, 0, 0, TAU); c.fill();

    arm(-1); arm(1);
    return cv;
  }

  // ---- 后脑勺：只有耳朵和一点皮肤，其余都被头发盖住 ----
  function drawHeadBack(look, cv) {
    const S = SKINS[look.skin];
    cv = cv || mk(HEAD_W * HEAD_S, HEAD_H * HEAD_S);
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(HEAD_S, 0, 0, HEAD_S, -HEAD_X0 * HEAD_S, -HEAD_Y0 * HEAD_S);
    for (const s of [-1, 1]) {
      c.save(); c.scale(s, 1);
      c.fillStyle = S.base;
      c.beginPath();
      c.moveTo(146, 8);
      c.bezierCurveTo(182, -14, 194, 34, 180, 66);
      c.bezierCurveTo(172, 92, 152, 98, 142, 84);
      c.closePath(); c.fill();
      c.strokeStyle = S.shade; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(152, 24); c.bezierCurveTo(172, 18, 178, 48, 166, 70); c.stroke();
      c.restore();
    }
    // 只留后颈这一小段皮肤，上面全由头发盖住
    c.save();
    c.beginPath(); c.rect(-200, 40, 400, 200); c.clip();
    facePath(c);
    c.fillStyle = S.base; c.fill();
    facePath(c); c.clip();
    const g = c.createLinearGradient(0, 110, 0, 205);
    g.addColorStop(0, S.shade + '00'); g.addColorStop(1, S.shade + 'b0');
    c.fillStyle = g; c.fillRect(-200, 100, 400, 110);
    c.restore();
    return cv;
  }

  // ---- 手：胖乎乎的，看到的是手背 ----
  const HAND_POSE = {
    open: {
      f: [[-42, 160, -58, 52, 33], [-4, 150, -8, 28, 35], [34, 155, 44, 46, 33], [70, 178, 92, 92, 28]],
      t: [-76, 236, -132, 168, 36], ax: (150 - 8) / 300, ay: 28 / 400,
    },
    pinch: {
      f: [[-34, 165, -66, 48, 33], [-2, 160, 4, 104, 35], [36, 165, 46, 118, 33], [68, 182, 78, 146, 28]],
      t: [-76, 236, -84, 62, 36], ax: (150 - 72) / 300, ay: 50 / 400,
    },
    point: {
      f: [[-34, 165, -44, 16, 33], [-2, 165, 2, 118, 35], [36, 170, 42, 128, 33], [68, 186, 76, 152, 28]],
      t: [-72, 240, -58, 172, 36], ax: (150 - 44) / 300, ay: 16 / 400,
    },
  };

  function drawHand(look, pose) {
    const S = SKINS[look.skin];
    const P = HAND_POSE[pose];
    const cv = mk(300, 400);
    const c = cv.getContext('2d');
    c.translate(150, 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    const seg = (a, w, col) => {
      c.strokeStyle = col; c.lineWidth = w;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[2], a[3]); c.stroke();
    };
    const shape = (grow, col) => {
      P.f.forEach((f) => seg(f, f[4] + grow, col));
      seg(P.t, P.t[4] + grow, col);
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0, 222, 92 + grow / 2, 94 + grow / 2, 0, 0, TAU); c.fill();
      c.beginPath(); c.roundRect(-52 - grow / 2, 270, 104 + grow, 90, 18); c.fill();
    };
    shape(7, S.line + '66');
    shape(0, S.base);
    // 手背的一点明暗
    const g = c.createRadialGradient(-20, 190, 10, 0, 225, 110);
    g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 222, 90, 92, 0, 0, TAU); c.fill();
    // 指甲和指节
    P.f.concat([P.t]).forEach((f, i) => {
      const dx = f[2] - f[0], dy = f[3] - f[1], len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      if (len > 80 || (i === 4 && pose !== 'point')) {
        c.save();
        c.translate(f[2] - ux * 3, f[3] - uy * 3);
        c.rotate(Math.atan2(uy, ux) + Math.PI / 2);
        c.fillStyle = '#F8C9CF';
        c.beginPath(); c.ellipse(0, 0, f[4] * 0.32, f[4] * 0.38, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.beginPath(); c.ellipse(-1.5, -3, f[4] * 0.12, f[4] * 0.15, 0, 0, TAU); c.fill();
        c.restore();
      }
      if (i < 4) {
        c.strokeStyle = S.shade; c.lineWidth = 3;
        const bx = f[0] + ux * 16, by = f[1] + uy * 16;
        c.beginPath(); c.moveTo(bx - uy * 9, by + ux * 9); c.lineTo(bx + uy * 9, by - ux * 9); c.stroke();
      }
    });
    // 袖口
    c.fillStyle = '#F5E9DA';
    c.beginPath(); c.roundRect(-68, 330, 136, 74, 16); c.fill();
    c.strokeStyle = '#E2CDB4'; c.lineWidth = 3;
    for (let x = -56; x <= 56; x += 14) { c.beginPath(); c.moveTo(x, 336); c.lineTo(x, 400); c.stroke(); }
    return cv;
  }

  // ---- 墙上的小镜子：只露一点点脸 ----
  function drawMirror(look, hair, loose, faceCv) {
    const O = OUTFITS[look.outfit];
    const S = SKINS[look.skin];
    const W = 300, H = 360, cv = mk(W, H), c = cv.getContext('2d');
    const cx = 150, cy = 180, rx = 132, ry = 164, hs = 0.5, hy = 166;
    c.save();
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#F8F1EA'); g.addColorStop(1, '#E7D9CE');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const hairGrad = () => {
      const h = c.createLinearGradient(0, hy - 110, 0, hy + 200);
      hair.forEach((col, i) => h.addColorStop(i / (hair.length - 1), col));
      return h;
    };
    if (loose) {
      c.fillStyle = hairGrad();
      c.beginPath();
      c.moveTo(cx - 98, hy - 60); c.quadraticCurveTo(cx - 124, hy + 120, cx - 112, H);
      c.lineTo(cx + 112, H); c.quadraticCurveTo(cx + 124, hy + 120, cx + 98, hy - 60);
      c.closePath(); c.fill();
    }
    c.fillStyle = S.base; c.fillRect(cx - 27, hy + 80, 54, 60);
    c.fillStyle = O.base;
    c.beginPath();
    const sm = lerp(0.84, 1.18, bodyShape(look).shoulder);
    c.moveTo(cx - 124 * sm, H); c.quadraticCurveTo(cx - 112 * sm, hy + 142, cx - 38, hy + 128);
    c.quadraticCurveTo(cx, hy + 152, cx + 38, hy + 128);
    c.quadraticCurveTo(cx + 112 * sm, hy + 142, cx + 124 * sm, H); c.closePath(); c.fill();
    c.drawImage(faceCv, cx + HEAD_X0 * hs, hy + HEAD_Y0 * hs, HEAD_W * hs, HEAD_H * hs);

    // 前面的头发和刘海
    c.fillStyle = hairGrad();
    c.beginPath();
    c.moveTo(cx - 92, hy + 26);
    c.bezierCurveTo(cx - 108, hy - 96, cx - 50, hy - 114, cx, hy - 114);
    c.bezierCurveTo(cx + 50, hy - 114, cx + 108, hy - 96, cx + 92, hy + 26);
    const tips = [[80, -22], [64, -14], [50, -28], [32, -10], [18, -26], [0, -9], [-18, -26], [-32, -10], [-50, -28], [-64, -14], [-80, -22]];
    tips.forEach(([x, y]) => c.lineTo(cx + x, hy + y));
    c.closePath(); c.fill();
    if (loose) {
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(cx + s * 76, hy - 30);
        c.quadraticCurveTo(cx + s * 86, hy + 70, cx + s * 74, hy + 140);
        c.lineTo(cx + s * 108, hy + 120);
        c.quadraticCurveTo(cx + s * 110, hy + 30, cx + s * 96, hy - 44);
        c.closePath(); c.fill();
      }
    }
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - 62, hy - 72); c.quadraticCurveTo(cx, hy - 96, cx + 62, hy - 72); c.stroke();
    // 玻璃的反光
    c.fillStyle = 'rgba(255,255,255,.14)';
    c.beginPath(); c.moveTo(40, 120); c.lineTo(120, 10); c.lineTo(170, 10); c.lineTo(50, 190); c.closePath(); c.fill();
    c.restore();

    c.lineWidth = 11; c.strokeStyle = '#DDBE93';
    c.beginPath(); c.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, TAU); c.stroke();
    c.lineWidth = 2.5; c.strokeStyle = '#F4E3C6';
    c.beginPath(); c.ellipse(cx, cy, rx + 6, ry + 6, 0, 0, TAU); c.stroke();
    return cv;
  }

  // ---- 中分线 ----
  function drawPartLine() {
    const cv = mk(16, 256), c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.08, 'rgba(255,255,255,1)');
    g.addColorStop(0.9, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(4, 0, 8, 256, 4); c.fill();
    return cv;
  }

  // ---- 房间 ----
  const ROOM = {
    morning: {
      n: '清晨', wall: ['#F9EADD', '#F3DBCB'], floor: '#E2C4AD', sky: ['#BCE0F0', '#FBE4D2', '#FFEFD0'],
      curtain: '#FFFAF2', light: [1.0, 0.985, 0.97], glow: '#FFEFC9', clear: [0.97, 0.9, 0.85],
    },
    noon: {
      n: '午后', wall: ['#FBE3C4', '#F5CFA6'], floor: '#D6AC84', sky: ['#FFD99B', '#FFC48F', '#FFAE85'],
      curtain: '#FFF2DA', light: [1.04, 0.97, 0.89], glow: '#FFD08A', clear: [0.97, 0.85, 0.72],
    },
    night: {
      n: '夜晚', wall: ['#3F3B62', '#544A72'], floor: '#2F2C4A', sky: ['#1B1E48', '#312D66', '#54407C'],
      curtain: '#6C6490', light: [0.86, 0.8, 0.87], glow: '#FFC98A', clear: [0.22, 0.2, 0.32], night: true,
    },
    rain: {
      n: '雨天', wall: ['#D5DAE0', '#C2C9D3'], floor: '#A5ABB7', sky: ['#9DA9B8', '#B7C1CC', '#CED5DC'],
      curtain: '#EDF0F2', light: [0.93, 0.95, 1.0], glow: '#E7EDF4', clear: [0.76, 0.79, 0.84], rain: true,
    },
  };

  function drawRoom(mood) {
    const M = ROOM[mood];
    const w = 900, h = 2000;
    const cv = mk(w, h);
    const c = cv.getContext('2d');
    let g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, M.wall[0]); g.addColorStop(1, M.wall[1]);
    c.fillStyle = g; c.fillRect(0, 0, w, h);

    // 窗
    const wx = 40, wy = 170, ww = 340, wh = 660;
    g = c.createLinearGradient(0, wy, 0, wy + wh);
    g.addColorStop(0, M.sky[0]); g.addColorStop(0.6, M.sky[1]); g.addColorStop(1, M.sky[2]);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(wx, wy + 170);
    c.arc(wx + ww / 2, wy + 170, ww / 2, Math.PI, 0);
    c.lineTo(wx + ww, wy + wh); c.lineTo(wx, wy + wh); c.closePath(); c.fill();

    c.save(); c.clip();
    if (M.night) {
      const r = hashRand(4);
      for (let i = 0; i < 70; i++) {
        c.fillStyle = `rgba(255,250,225,${0.3 + r() * 0.7})`;
        c.beginPath(); c.arc(wx + r() * ww, wy + r() * wh * 0.8, 1 + r() * 2.2, 0, TAU); c.fill();
      }
      c.fillStyle = '#FFF4D1';
      c.beginPath(); c.arc(wx + 228, wy + 170, 46, 0, TAU); c.fill();
      c.fillStyle = M.sky[0] + 'f0';
      c.beginPath(); c.arc(wx + 208, wy + 158, 44, 0, TAU); c.fill();
    } else if (M.rain) {
      c.fillStyle = 'rgba(255,255,255,.3)';
      for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(wx + 60 + i * 80, wy + 130 + (i % 2) * 40, 120, 56, 0, 0, TAU); c.fill(); }
    } else {
      g = c.createRadialGradient(wx + 240, wy + 210, 10, wx + 240, wy + 210, 240);
      g.addColorStop(0, '#FFFBE8'); g.addColorStop(0.3, M.glow + 'c0'); g.addColorStop(1, M.glow + '00');
      c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    }
    // 窗外的枝叶
    c.fillStyle = M.night ? '#22264E' : M.rain ? '#8C9AA2' : '#B7CDA4';
    const r2 = hashRand(9);
    for (let i = 0; i < 26; i++) {
      c.beginPath();
      c.ellipse(wx + r2() * 200 - 10, wy + wh - 150 + r2() * 170, 56 + r2() * 40, 44 + r2() * 30, r2(), 0, TAU);
      c.fill();
    }
    c.restore();

    // 窗棂
    c.strokeStyle = M.night ? '#776E9A' : '#FFFFFF'; c.lineWidth = 11;
    c.beginPath();
    c.moveTo(wx, wy + 170); c.arc(wx + ww / 2, wy + 170, ww / 2, Math.PI, 0);
    c.lineTo(wx + ww, wy + wh); c.lineTo(wx, wy + wh); c.closePath(); c.stroke();
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh);
    c.moveTo(wx, wy + 300); c.lineTo(wx + ww, wy + 300);
    c.moveTo(wx, wy + 170); c.lineTo(wx + ww, wy + 170);
    c.stroke();

    // 窗帘
    c.fillStyle = M.curtain;
    c.globalAlpha = 0.9;
    c.beginPath();
    c.moveTo(0, 120); c.lineTo(190, 120);
    c.bezierCurveTo(148, 420, 150, 640, 74, 930);
    c.lineTo(0, 930); c.closePath(); c.fill();
    c.globalAlpha = 0.28;
    c.strokeStyle = M.night ? '#3A365C' : '#D6C1AF'; c.lineWidth = 6;
    for (const x of [36, 82, 126]) {
      c.beginPath(); c.moveTo(x, 130); c.bezierCurveTo(x * 0.8, 420, x * 0.8, 660, x * 0.44, 928); c.stroke();
    }
    c.globalAlpha = 1;
    c.fillStyle = M.night ? '#8D7F5F' : '#D4B897';
    c.fillRect(0, 108, 400, 12);

    // 右边的架子、小东西、挂着的植物
    c.fillStyle = M.night ? '#6A5D70' : '#C9A586';
    c.fillRect(620, 1160, 280, 16);
    const books = M.night ? ['#8d7fae', '#a77a8e', '#6e7fa4'] : ['#E9B7A8', '#B9C9AD', '#D9C7A0'];
    let bx = 650;
    books.forEach((col, i) => {
      c.fillStyle = col;
      const bh = 96 - i * 11;
      c.fillRect(bx, 1160 - bh, 28, bh);
      bx += 32;
    });
    c.fillStyle = M.night ? '#D9C49A' : '#FFF4E2';
    c.beginPath(); c.ellipse(800, 1120, 30, 40, 0, 0, TAU); c.fill();
    c.fillStyle = M.night ? '#5D7A62' : '#9BB98D';
    for (let i = 0; i < 5; i++) {
      c.save(); c.translate(800, 1090); c.rotate(-0.8 + i * 0.4);
      c.beginPath(); c.ellipse(0, -44, 11, 44, 0, 0, TAU); c.fill();
      c.restore();
    }

    // 串灯
    const lampPts = [];
    c.strokeStyle = M.night ? '#857C9E' : '#BBA08A'; c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      const x = lerp(420, 900, t), y = 150 + Math.sin(t * Math.PI * 3) * 42 + t * 70;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      if (i % 3 === 1) lampPts.push([x, y]);
    }
    c.stroke();
    for (const [x, y] of lampPts) {
      g = c.createRadialGradient(x, y + 12, 1, x, y + 12, M.night ? 58 : 24);
      g.addColorStop(0, M.night ? 'rgba(255,214,150,.95)' : 'rgba(255,226,170,.7)');
      g.addColorStop(1, 'rgba(255,214,150,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y + 12, M.night ? 58 : 24, 0, TAU); c.fill();
      c.fillStyle = M.night ? '#FFE3A8' : '#FFEBC4';
      c.beginPath(); c.arc(x, y + 12, 7, 0, TAU); c.fill();
    }

    // 地面
    g = c.createLinearGradient(0, 1560, 0, h);
    g.addColorStop(0, M.floor); g.addColorStop(1, shadeHex(M.floor, 0.88));
    c.fillStyle = g; c.fillRect(0, 1560, w, h - 1560);

    // 从窗子照进来的光
    if (!M.night && !M.rain) {
      g = c.createRadialGradient(240, 480, 40, 240, 480, 900);
      g.addColorStop(0, M.glow + '66'); g.addColorStop(0.5, M.glow + '22'); g.addColorStop(1, M.glow + '00');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }

    // 轻微虚化，让人物跳出来
    const out = mk(w * 0.8, h * 0.8);
    const o = out.getContext('2d');
    try { o.filter = 'blur(3px)'; } catch (e) {}
    o.drawImage(cv, -6, -6, out.width + 12, out.height + 12);
    return out;
  }

  // ---- 发圈 ----
  const TIE_COLORS = ['#F5B8C4', '#F2A69B', '#FBD7A5', '#FFF4E0', '#BFD8A8', '#A7D3D0', '#A9C7EA', '#C8B4E4', '#D66F7E', '#7A5C78', '#3E3A4E', '#E9D9C4'];
  const TIE_PATTERNS = [
    { id: 'solid', n: '素色' }, { id: 'dots', n: '波点' }, { id: 'gingham', n: '格纹' },
    { id: 'stripe', n: '条纹' }, { id: 'flower', n: '碎花' }, { id: 'pride', n: '蓝粉白' },
  ];
  const TIE_TYPES = [
    { id: 'scrunchie', n: '大肠发圈' }, { id: 'velvet', n: '丝绒圈' },
    { id: 'ribbon', n: '蝴蝶结' }, { id: 'pearl', n: '珍珠圈' }, { id: 'elastic', n: '小皮筋' },
  ];

  function fillPattern(c, pat, col, x, y, w, h) {
    c.fillStyle = col; c.fillRect(x, y, w, h);
    const light = mixHex(col, '#FFFFFF', 0.72), dark = shadeHex(col, 0.82);
    if (pat === 'dots') {
      c.fillStyle = light;
      for (let yy = y, r = 0; yy < y + h; yy += 22, r++) for (let xx = x + (r % 2) * 12; xx < x + w; xx += 24) {
        c.beginPath(); c.arc(xx, yy, 4.8, 0, TAU); c.fill();
      }
    } else if (pat === 'gingham') {
      c.fillStyle = light + 'aa';
      for (let xx = x; xx < x + w; xx += 26) c.fillRect(xx, y, 13, h);
      c.fillStyle = dark + '60';
      for (let yy = y; yy < y + h; yy += 26) c.fillRect(x, yy, w, 13);
    } else if (pat === 'stripe') {
      c.fillStyle = light;
      for (let xx = x; xx < x + w; xx += 24) c.fillRect(xx, y, 10, h);
    } else if (pat === 'flower') {
      const r = hashRand(3);
      for (let i = 0; i < 28; i++) {
        const px = x + r() * w, py = y + r() * h;
        c.fillStyle = light;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU;
          c.beginPath(); c.arc(px + Math.cos(a) * 5, py + Math.sin(a) * 5, 3.6, 0, TAU); c.fill();
        }
        c.fillStyle = '#F2C866'; c.beginPath(); c.arc(px, py, 2.6, 0, TAU); c.fill();
      }
    } else if (pat === 'pride') {
      const bands = ['#7ECBEE', '#F5ABBE', '#FFFFFF', '#F5ABBE', '#7ECBEE'];
      const bw = w / bands.length;
      bands.forEach((b, i) => { c.fillStyle = b; c.fillRect(x + i * bw, y, bw + 1, h); });
    }
  }

  function drawTie(tie) {
    const cv = mk(280, 200);
    const c = cv.getContext('2d');
    const col = TIE_COLORS[tie.color];
    const dark = shadeHex(col, 0.74);
    c.translate(140, 100);

    function pleatPath(rx, ry, bumps, amp) {
      c.beginPath();
      const n = bumps * 12;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * TAU;
        const m = 1 + Math.abs(Math.sin((a * bumps) / 2)) * amp - amp * 0.5;
        const x = Math.cos(a) * rx * m, y = Math.sin(a) * ry * m;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
    }

    if (tie.type === 'scrunchie' || tie.type === 'velvet') {
      const amp = tie.type === 'velvet' ? 0.07 : 0.14;
      c.save();
      pleatPath(112, 62, 16, amp);
      c.clip();
      fillPattern(c, tie.pattern, col, -140, -100, 280, 200);
      const g = c.createLinearGradient(0, -70, 0, 76);
      if (tie.type === 'velvet') {
        g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(0.32, 'rgba(255,255,255,.1)');
        g.addColorStop(0.75, 'rgba(50,20,40,.08)'); g.addColorStop(1, 'rgba(50,20,40,.36)');
      } else {
        g.addColorStop(0, 'rgba(255,255,255,.26)'); g.addColorStop(0.46, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(70,30,50,.3)');
      }
      c.fillStyle = g; c.fillRect(-140, -100, 280, 200);
      c.strokeStyle = 'rgba(80,40,50,.17)'; c.lineWidth = 2.4;
      for (let i = -12; i <= 12; i++) {
        const x = i * 9.4;
        c.beginPath(); c.moveTo(x * 0.92, -70); c.quadraticCurveTo(x * 1.1, 0, x * 0.92, 70); c.stroke();
      }
      c.restore();
    } else if (tie.type === 'ribbon') {
      for (const s of [-1, 1]) {
        c.save(); c.scale(s, 1);
        c.beginPath();
        c.moveTo(6, 2); c.bezierCurveTo(50, -74, 124, -60, 118, -4);
        c.bezierCurveTo(124, 46, 54, 56, 6, 8);
        c.closePath();
        c.save(); c.clip(); fillPattern(c, tie.pattern, col, -10, -90, 150, 170);
        const g = c.createLinearGradient(0, 0, 124, 0);
        g.addColorStop(0, 'rgba(90,40,50,.34)'); g.addColorStop(0.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(90,40,50,.1)');
        c.fillStyle = g; c.fillRect(0, -90, 130, 170);
        c.restore();
        c.fillStyle = dark;
        c.beginPath();
        c.moveTo(4, 10); c.lineTo(58, 94); c.lineTo(36, 88); c.lineTo(24, 100); c.lineTo(-4, 14);
        c.closePath(); c.fill();
        c.restore();
      }
      c.fillStyle = mixHex(col, '#FFFFFF', 0.12);
      c.beginPath(); c.ellipse(0, 3, 19, 25, 0, 0, TAU); c.fill();
      c.strokeStyle = dark; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-8, -14); c.quadraticCurveTo(-3, 3, -8, 20); c.stroke();
    } else if (tie.type === 'pearl') {
      c.fillStyle = dark + '80';
      c.beginPath(); c.ellipse(0, 0, 100, 42, 0, 0, TAU); c.fill();
      for (let i = 0; i < 15; i++) {
        const a = (i / 15) * TAU;
        const x = Math.cos(a) * 98, y = Math.sin(a) * 38;
        const g = c.createRadialGradient(x - 6, y - 7, 2, x, y, 21);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, mixHex(col, '#FFFFFF', 0.72)); g.addColorStop(1, mixHex(col, '#8F7A70', 0.3));
        c.fillStyle = g; c.beginPath(); c.arc(x, y, 20, 0, TAU); c.fill();
      }
    } else {
      c.fillStyle = shadeHex(col, 0.86);
      c.beginPath(); c.roundRect(-90, -22, 180, 44, 18); c.fill();
      c.fillStyle = col;
      c.beginPath(); c.roundRect(-90, -22, 180, 30, 15); c.fill();
      c.strokeStyle = 'rgba(90,50,60,.2)'; c.lineWidth = 2;
      for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * 13, -22); c.lineTo(i * 13, 22); c.stroke(); }
      const g = c.createRadialGradient(-8, 2, 3, 0, 8, 34);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, TIE_COLORS[(tie.color + 4) % TIE_COLORS.length]); g.addColorStop(1, shadeHex(TIE_COLORS[(tie.color + 4) % TIE_COLORS.length], 0.72));
      c.fillStyle = g; c.beginPath(); c.arc(0, 10, 32, 0, TAU); c.fill();
    }
    return cv;
  }

  // ---- 发饰 ----
  const ACC = [
    { id: 'daisy', n: '小雏菊' }, { id: 'sakura', n: '樱花' }, { id: 'rose', n: '小玫瑰' }, { id: 'camellia', n: '山茶' },
    { id: 'bow', n: '蝴蝶结' }, { id: 'pearlpin', n: '珍珠夹' }, { id: 'star', n: '星星夹' }, { id: 'moon', n: '月亮夹' },
    { id: 'heart', n: '爱心夹' }, { id: 'butterfly', n: '蝴蝶' }, { id: 'cherry', n: '樱桃' }, { id: 'leaf', n: '小叶子' },
    { id: 'clip', n: '发抓夹' }, { id: 'ribbonpink', n: '蓝粉白丝带', gift: 4 }, { id: 'tulip', n: '郁金香', gift: 2 }, { id: 'clover', n: '四叶草', gift: 6 },
    { id: 'cat', n: '小猫夹', gift: 8 }, { id: 'lily', n: '铃兰', gift: 11 }, { id: 'crown', n: '小王冠', gift: 15 },
  ];

  function drawAcc(id) {
    const cv = mk(180, 180);
    const c = cv.getContext('2d');
    c.translate(90, 90);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const petal = (n, r, w, col, inset) => {
      for (let i = 0; i < n; i++) {
        c.save(); c.rotate((i / n) * TAU);
        const g = c.createLinearGradient(0, 0, 0, -r);
        g.addColorStop(0, shadeHex(col, 0.86)); g.addColorStop(1, col);
        c.fillStyle = g;
        c.beginPath(); c.ellipse(0, -r * inset, w, r * (1 - inset * 0.5), 0, 0, TAU); c.fill();
        c.restore();
      }
    };
    const dot = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
    const gold = '#E9C46A';
    switch (id) {
      case 'daisy': petal(12, 62, 14, '#FFFDF5', 0.62); dot(0, 0, 24, '#F5C95B'); dot(-6, -7, 8, '#FFE08C'); break;
      case 'sakura':
        for (let i = 0; i < 5; i++) {
          c.save(); c.rotate((i / 5) * TAU);
          c.fillStyle = '#F9C5D2';
          c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-44, -30, -36, -76, -6, -70);
          c.lineTo(0, -60); c.lineTo(6, -70); c.bezierCurveTo(36, -76, 44, -30, 0, 0); c.fill();
          c.strokeStyle = '#EE93AC'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -8); c.lineTo(0, -38); c.stroke();
          c.restore();
        }
        dot(0, 0, 11, '#F4839E'); break;
      case 'rose':
        dot(0, 0, 60, '#D8546C');
        c.strokeStyle = '#A83650'; c.lineWidth = 6;
        c.beginPath();
        for (let a = 0; a < 15; a += 0.1) { const r = 3 + a * 3.5; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (a === 0) c.moveTo(x, y); else c.lineTo(x, y); }
        c.stroke(); break;
      case 'camellia':
        petal(7, 66, 34, '#D42F4A', 0.5); petal(6, 42, 22, '#EE5F76', 0.5); dot(0, 0, 15, gold); break;
      case 'bow':
        for (const s of [-1, 1]) {
          c.save(); c.scale(s, 1);
          c.fillStyle = '#F2A1B0';
          c.beginPath(); c.moveTo(4, 0); c.bezierCurveTo(30, -66, 86, -50, 80, 0); c.bezierCurveTo(86, 44, 30, 50, 4, 0); c.fill();
          c.fillStyle = '#D87C8F';
          c.beginPath(); c.moveTo(4, 8); c.lineTo(42, 76); c.lineTo(22, 72); c.lineTo(10, 82); c.lineTo(-3, 10); c.fill();
          c.restore();
        }
        c.fillStyle = '#F7BCC8'; c.beginPath(); c.ellipse(0, 0, 15, 20, 0, 0, TAU); c.fill(); break;
      case 'pearlpin':
        c.fillStyle = gold; c.beginPath(); c.roundRect(-74, -7, 148, 14, 7); c.fill();
        for (let i = -2; i <= 2; i++) {
          const x = i * 30;
          const g = c.createRadialGradient(x - 6, -8, 2, x, 0, 20);
          g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#F5EBDF'); g.addColorStop(1, '#D8C6B4');
          c.fillStyle = g; c.beginPath(); c.arc(x, 0, 17, 0, TAU); c.fill();
        }
        break;
      case 'star':
        c.fillStyle = gold; c.beginPath();
        for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 26 : 66; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath(); c.fill(); dot(-8, -12, 8, '#FFF3C4'); break;
      case 'moon':
        c.fillStyle = '#F4D88E'; c.beginPath(); c.arc(0, 0, 64, 0.6, 5.7); c.bezierCurveTo(36, -28, 16, 16, 53, 36); c.fill(); break;
      case 'heart':
        c.fillStyle = '#EF7F94'; c.beginPath(); c.moveTo(0, 56); c.bezierCurveTo(-96, -10, -48, -78, 0, -30); c.bezierCurveTo(48, -78, 96, -10, 0, 56); c.fill();
        dot(-30, -28, 9, '#FFD0DA'); break;
      case 'butterfly':
        for (const s of [-1, 1]) {
          c.save(); c.scale(s, 1);
          c.fillStyle = '#B7A1E0';
          c.beginPath(); c.moveTo(0, -6); c.bezierCurveTo(34, -82, 92, -70, 76, -18); c.bezierCurveTo(66, 6, 26, 4, 0, -6); c.fill();
          c.fillStyle = '#D7C6F2';
          c.beginPath(); c.moveTo(0, 2); c.bezierCurveTo(30, 6, 66, 18, 50, 52); c.bezierCurveTo(32, 74, 8, 36, 0, 2); c.fill();
          dot(52, -38, 10, '#F7EEFF');
          c.restore();
        }
        c.fillStyle = '#6E5A8C'; c.beginPath(); c.ellipse(0, 0, 7, 32, 0, 0, TAU); c.fill(); break;
      case 'cherry':
        c.strokeStyle = '#7E9A5E'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(-32, 22); c.quadraticCurveTo(-10, -48, 12, -62); c.moveTo(32, 26); c.quadraticCurveTo(26, -32, 12, -62); c.stroke();
        for (const [x, y] of [[-34, 38], [34, 42]]) {
          const g = c.createRadialGradient(x - 10, y - 12, 2, x, y, 32);
          g.addColorStop(0, '#FF8E9B'); g.addColorStop(0.6, '#DC3D55'); g.addColorStop(1, '#B4243F');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, 30, 0, TAU); c.fill();
        }
        c.fillStyle = '#9AB97A'; c.beginPath(); c.ellipse(36, -58, 28, 13, 0.3, 0, TAU); c.fill(); break;
      case 'leaf':
        c.fillStyle = '#A5C28C'; c.beginPath(); c.moveTo(0, 72); c.bezierCurveTo(-74, 24, -48, -56, 0, -76); c.bezierCurveTo(48, -56, 74, 24, 0, 72); c.fill();
        c.strokeStyle = '#7D9C68'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 62); c.lineTo(0, -60); c.stroke(); break;
      case 'clip':
        c.fillStyle = '#C89B72'; c.beginPath(); c.roundRect(-76, -34, 152, 44, 18); c.fill();
        c.strokeStyle = '#A97C54'; c.lineWidth = 12;
        for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 22, 8); c.quadraticCurveTo(i * 24, 44, i * 18, 70); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.roundRect(-64, -28, 128, 11, 6); c.fill(); break;
      case 'ribbonpink':
        for (const s of [-1, 1]) {
          c.save(); c.scale(s, 1);
          c.beginPath(); c.moveTo(4, 0); c.bezierCurveTo(30, -66, 86, -50, 80, 0); c.bezierCurveTo(86, 44, 30, 50, 4, 0);
          c.save(); c.clip();
          ['#7ECBEE', '#F5ABBE', '#FFFFFF', '#F5ABBE', '#7ECBEE'].forEach((b, i) => { c.fillStyle = b; c.fillRect(-10, -66 + i * 25, 110, 26); });
          c.restore();
          c.strokeStyle = 'rgba(120,120,160,.25)'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(4, 0); c.bezierCurveTo(30, -66, 86, -50, 80, 0); c.bezierCurveTo(86, 44, 30, 50, 4, 0); c.stroke();
          c.fillStyle = '#F5ABBE';
          c.beginPath(); c.moveTo(4, 8); c.lineTo(42, 76); c.lineTo(22, 72); c.lineTo(10, 82); c.lineTo(-3, 10); c.fill();
          c.restore();
        }
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, 0, 15, 20, 0, 0, TAU); c.fill();
        c.strokeStyle = '#F5ABBE'; c.lineWidth = 3; c.stroke(); break;
      case 'tulip':
        c.fillStyle = '#F39AAF'; c.beginPath(); c.moveTo(-46, -12); c.lineTo(-24, -52); c.lineTo(0, -22); c.lineTo(24, -52); c.lineTo(46, -12);
        c.bezierCurveTo(50, 40, -50, 40, -46, -12); c.fill();
        c.fillStyle = '#EC7F98'; c.beginPath(); c.moveTo(0, -24); c.bezierCurveTo(-18, 2, -14, 26, 0, 30); c.bezierCurveTo(14, 26, 18, 2, 0, -24); c.fill();
        c.strokeStyle = '#88A86E'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, 28); c.lineTo(0, 78); c.stroke(); break;
      case 'clover':
        for (let i = 0; i < 4; i++) {
          c.save(); c.rotate((i / 4) * TAU + Math.PI / 4);
          c.fillStyle = '#8CC083';
          c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-46, -24, -36, -68, 0, -44); c.bezierCurveTo(36, -68, 46, -24, 0, 0); c.fill();
          c.restore();
        }
        dot(0, 0, 8, '#6BA265'); break;
      case 'cat':
        c.fillStyle = '#F6E2C9';
        c.beginPath(); c.moveTo(-58, -24); c.lineTo(-62, -74); c.lineTo(-20, -48); c.quadraticCurveTo(0, -56, 20, -48); c.lineTo(62, -74); c.lineTo(58, -24);
        c.bezierCurveTo(74, 44, -74, 44, -58, -24); c.fill();
        dot(-26, -6, 7, '#4A302C'); dot(26, -6, 7, '#4A302C');
        c.strokeStyle = '#D18A7E'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(-9, 10); c.quadraticCurveTo(-4, 18, 0, 10); c.quadraticCurveTo(4, 18, 9, 10); c.stroke(); break;
      case 'lily':
        c.strokeStyle = '#8AA96E'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(-58, 62); c.quadraticCurveTo(-44, -60, 58, -46); c.stroke();
        for (const [x, y] of [[-26, -26], [12, -36], [46, -26]]) {
          c.fillStyle = '#FFFDF5';
          c.beginPath(); c.moveTo(x - 17, y + 8); c.bezierCurveTo(x - 17, y + 48, x + 17, y + 48, x + 17, y + 8);
          c.lineTo(x + 12, y + 2); c.bezierCurveTo(x + 6, y - 6, x - 6, y - 6, x - 12, y + 2); c.closePath(); c.fill();
          c.strokeStyle = '#E2D6BF'; c.lineWidth = 2.5; c.stroke();
          c.strokeStyle = '#8AA96E'; c.lineWidth = 6;
        }
        break;
      case 'crown':
        c.fillStyle = gold; c.beginPath(); c.moveTo(-72, 40); c.lineTo(-80, -38); c.lineTo(-36, -2); c.lineTo(0, -60); c.lineTo(36, -2); c.lineTo(80, -38); c.lineTo(72, 40); c.closePath(); c.fill();
        dot(-80, -42, 11, '#FFF3C4'); dot(0, -66, 12, '#F58EA5'); dot(80, -42, 11, '#FFF3C4');
        c.fillStyle = '#A9C7EA'; c.fillRect(-58, 16, 116, 12); break;
      default: dot(0, 0, 50, '#ccc');
    }
    return cv;
  }

  function drawParticle(kind) {
    const cv = mk(64, 64);
    const c = cv.getContext('2d');
    c.translate(32, 32);
    if (kind === 'spark') {
      const g = c.createRadialGradient(0, 0, 1, 0, 0, 22);
      g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.3, 'rgba(255,236,190,.55)'); g.addColorStop(1, 'rgba(255,230,190,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill();
      c.fillStyle = '#fffbe9';
      c.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = i % 2 ? 3 : 30; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill();
    } else if (kind === 'dot') {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 30);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill();
    } else if (kind === 'heart') {
      c.fillStyle = '#F4899F'; c.scale(0.62, 0.62);
      c.beginPath(); c.moveTo(0, 42); c.bezierCurveTo(-72, -8, -36, -58, 0, -22); c.bezierCurveTo(36, -58, 72, -8, 0, 42); c.fill();
    } else if (kind === 'petal') {
      c.fillStyle = '#F8BFD0'; c.beginPath(); c.ellipse(0, 0, 14, 22, 0.4, 0, TAU); c.fill();
    } else if (kind === 'leaf') {
      c.fillStyle = '#D9A15A'; c.beginPath(); c.moveTo(0, 26); c.bezierCurveTo(-28, 4, -18, -22, 0, -28); c.bezierCurveTo(18, -22, 28, 4, 0, 26); c.fill();
    } else if (kind === 'snow') {
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-22, 0); c.lineTo(22, 0); c.stroke(); }
    } else if (kind === 'green') {
      c.fillStyle = '#B4D19A'; c.beginPath(); c.ellipse(0, 0, 12, 21, 0.5, 0, TAU); c.fill();
    } else if (kind === 'rain') {
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -26); c.lineTo(-3, 26); c.stroke();
    }
    return cv;
  }

  return {
    SKINS, EYES, LIPS, OUTFITS, ROOM, TIE_COLORS, TIE_PATTERNS, TIE_TYPES, ACC,
    drawHeadBase, drawHeadBack, drawFeatures, drawBody, drawRoom, drawTie, drawAcc, drawParticle, drawHand, drawMirror, drawPartLine, HAND_POSE, BODY_DEFAULT, mk,
    HEAD: { S: HEAD_S, X0: HEAD_X0, Y0: HEAD_Y0, W: HEAD_W, H: HEAD_H },
    FEAT: { S: FEAT_S, X0: FEAT_X0, Y0: FEAT_Y0, W: FEAT_W, H: FEAT_H },
    BODY: { S: BODY_S, X0: BODY_X0, Y0: BODY_Y0, W: BODY_W, H: BODY_H },
  };
})();
