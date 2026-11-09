// 托盘、面板、提示、弹窗
const UI = (() => {
  const $ = (id) => document.getElementById(id);
  const stroke = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${d}</svg>`;

  const I = {
    time: stroke('<path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9"/>'),
    album: stroke('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9.5" cy="9.5" r="1.6"/><path d="M5 17l4.5-4 3 2.5 3-3 3.5 3.5"/>'),
    sound: stroke('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'),
    mute: stroke('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/><path d="M4 4l16 16"/>'),
    photo: stroke('<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    care: stroke('<path d="M5 4h14v5.5H5zM7 9.5V20M10.3 9.5V20M13.6 9.5V20M17 9.5V20"/>'),
    style: stroke('<circle cx="12" cy="11" r="4.2"/><path d="M5 22c0-8 0-16 7-16s7 8 7 16"/>'),
    tie: stroke('<ellipse cx="12" cy="12" rx="8.5" ry="4.8"/><ellipse cx="12" cy="12" rx="4.3" ry="1.6"/><path d="M5 9.5l1 2M8 7.7l.8 2M12 7.2v2M16 7.7l-.8 2M19 9.5l-1 2"/>'),
    acc: stroke('<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C9 5 14 3 12 3s3 2 0 6.8zM14.2 12c4.8-3 6.8 2 6.8 0s-2 3-6.8 0zM12 14.2c3 4.8-2 6.8 0 6.8s-3-2 0-6.8zM9.8 12C5 15 3 10 3 12s2-3 6.8 0z"/>'),
    dye: stroke('<path d="M12 3.5s6.5 7 6.5 11.2a6.5 6.5 0 0 1-13 0C5.500 10.500 12 3.500 12 3.500z"/><path d="M9 15a3 3 0 0 0 3 3"/>'),
    me: stroke('<circle cx="12" cy="9" r="4"/><path d="M5 21c.8-4.500 3.400-6.500 7-6.500s6.200 2 7 6.500"/>'),
    hand: stroke('<path d="M8 12V6a1.500 1.500 0 0 1 3 0v5M11 11V4.500a1.500 1.500 0 0 1 3 0V11M14 11V6a1.500 1.500 0 0 1 3 0v8c0 4-2.500 6.500-6 6.500-3 0-4.500-1.500-6-4.500l-2-3.500c-.8-1.500 1.300-2.700 2.300-1.300L8 13"/>'),
    comb: stroke('<path d="M3 7h18v4H3zM5 11v7M8 11v7M11 11v7M14 11v7M17 11v7M20 11v7"/>'),
    grow: stroke('<path d="M12 3v15M6.500 12.500L12 18l5.500-5.500M5 21h14"/>'),
    ribbon: stroke('<path d="M12 11L4 6v11zM12 11l8-5v11zM12 11l-3 9M12 11l3 9"/>'),
  };

  // 发型小图标都是背影
  const HAIR = '#A07A5C', DEEP = '#8A6549', ROSE = '#E08A98';
  const ico = (body) => `<svg viewBox="0 0 48 48"><path d="M7 48c1-9 9-12 17-12s16 3 17 12z" fill="#EFE0CF"/><rect x="20" y="30" width="8" height="10" fill="#F9DFCB"/><circle cx="24" cy="21" r="13.500" fill="${HAIR}"/>${body}</svg>`;
  const braidG = (x) => `<g fill="${DEEP}">${[33, 37, 41, 45].map((y, i) => `<ellipse cx="${x + (i % 2 ? 1 : -1)}" cy="${y}" rx="3.400" ry="2.500"/>`).join('')}</g>`;
  const STYLE_ICONS = {
    loose: ico(`<path d="M11 22h26c1 8 1 18 0 26H11c-1-8-1-18 0-26z" fill="${HAIR}"/>`),
    high: ico(`<path d="M24 15c5 3 6 18 3 31-2 2-4 2-6 0-3-13-2-28 3-31z" fill="${DEEP}"/><rect x="20" y="13" width="8" height="4" rx="2" fill="${ROSE}"/>`),
    low: ico(`<path d="M24 32c4 2 5 9 3 15h-6c-2-6-1-13 3-15z" fill="${DEEP}"/><rect x="20" y="30" width="8" height="4" rx="2" fill="${ROSE}"/>`),
    twin: ico(`<path d="M12 22C4 26 4 40 8 47c4-7 7-15 7-22z" fill="${DEEP}"/><path d="M36 22c8 4 8 18 4 25-4-7-7-15-7-22z" fill="${DEEP}"/><circle cx="13" cy="23" r="2.600" fill="${ROSE}"/><circle cx="35" cy="23" r="2.600" fill="${ROSE}"/><path d="M24 8v24" stroke="#F9DFCB" stroke-width="1"/>`),
    half: ico(`<path d="M11 24h26c1 8 1 16 0 24H11c-1-8-1-16 0-24z" fill="${HAIR}"/><path d="M24 20l-9-6v12zM24 20l9-6v12z" fill="${ROSE}"/>`),
    tufts: ico(`<path d="M15 12C7 11 5 4 8 2c4 1 9 4 10 9z" fill="${DEEP}"/><path d="M33 12c8-1 10-8 7-10-4 1-9 4-10 9z" fill="${DEEP}"/><path d="M11 24h26c1 8 1 16 0 24H11c-1-8-1-16 0-24z" fill="${HAIR}"/><circle cx="16" cy="12" r="2.400" fill="${ROSE}"/><circle cx="32" cy="12" r="2.400" fill="${ROSE}"/>`),
    bun: ico(`<circle cx="24" cy="15" r="8.500" fill="${DEEP}"/><rect x="19" y="22" width="10" height="3.400" rx="1.700" fill="${ROSE}"/>`),
    twinbun: ico(`<circle cx="13" cy="10" r="6.500" fill="${DEEP}"/><circle cx="35" cy="10" r="6.500" fill="${DEEP}"/><path d="M24 8v24" stroke="#F9DFCB" stroke-width="1"/>`),
    braid: ico(braidG(24) + `<rect x="21" y="46" width="6" height="2" rx="1" fill="${ROSE}"/>`),
    twinbraid: ico(braidG(14) + braidG(34) + `<path d="M24 8v24" stroke="#F9DFCB" stroke-width="1"/>`),
    rope: ico(`<path d="M24 31c5 3-5 5 0 8s-5 5 0 8" fill="none" stroke="${DEEP}" stroke-width="5" stroke-linecap="round"/>`),
  };

  let tab = 'care';
  const TABS = [
    { id: 'care', n: '梳理', i: I.care }, { id: 'style', n: '发型', i: I.style }, { id: 'tie', n: '发圈', i: I.tie },
    { id: 'acc', n: '发饰', i: I.acc }, { id: 'dye', n: '染发', i: I.dye }, { id: 'me', n: '我', i: I.me },
  ];

  function renderTabs() {
    $('tabs').innerHTML = TABS.map((t) => `<button class="tab${t.id === tab ? ' on' : ''}" data-t="${t.id}">${t.i}<span>${t.n}</span></button>`).join('');
  }

  // 小图只画一次，重画面板时直接拿来用
  const accThumbs = {};
  function accThumb(id) {
    if (!accThumbs[id]) {
      const cv = Art.mk(96, 96);
      cv.getContext('2d').drawImage(Art.drawAcc(id), 0, 0, 96, 96);
      accThumbs[id] = cv;
    }
    return accThumbs[id];
  }
  const tieThumbs = new Map();
  function tieThumb(t) {
    const key = `${t.type}-${t.color}-${t.pattern}`;
    if (!tieThumbs.has(key)) {
      if (tieThumbs.size > 40) tieThumbs.clear();
      tieThumbs.set(key, Art.drawTie(t));
    }
    return tieThumbs.get(key);
  }

  const panels = {
    care() {
      const h = Store.data.hair, tool = Game.tool;
      return `<div class="scroll">
        <div class="hrow" style="gap:9px">
          <button class="tool${tool === 'hand' ? ' on' : ''}" data-tool="hand">${I.hand}用手玩</button>
          <button class="tool${tool === 'comb' ? ' on' : ''}" data-tool="comb">${I.comb}慢慢梳</button>
          <button class="tool${tool === 'grow' ? ' on' : ''}" data-tool="grow">${I.grow}往下拉长</button>
        </div>
        <div class="lbl">发质</div>
        <div class="hrow">${[[0, '直发'], [0.8, '微卷'], [1.7, '大卷']].map(([k, n]) => `<button class="chip${h.wave === k ? ' on' : ''}" data-wave="${k}">${n}</button>`).join('')}</div>
      </div>`;
    },
    style() {
      const cur = Store.data.style;
      return `<div class="scroll"><div class="grid">${Object.keys(Hair.STYLES).map((k) => `<button class="card${cur === k ? ' on' : ''}" data-style="${k}">${STYLE_ICONS[k]}<span>${Hair.STYLES[k].name}</span></button>`).join('')}</div></div>`;
    },
    tie() {
      return `<div class="scroll">
        <div class="lbl">款式</div><div class="hrow" id="tieTypes"></div>
        <div class="lbl">颜色</div><div class="hrow">${Art.TIE_COLORS.map((c, i) => `<button class="sw${Store.data.tie.color === i ? ' on' : ''}" style="background:${c}" data-tiec="${i}"></button>`).join('')}</div>
        <div class="lbl">花样</div><div class="hrow">${Art.TIE_PATTERNS.map((p) => `<button class="chip${Store.data.tie.pattern === p.id ? ' on' : ''}" data-tiep="${p.id}">${p.n}</button>`).join('')}</div>
      </div>`;
    },
    acc() {
      const count = Store.data.careCount;
      const sel = Game.selectedAcc;
      const tools = sel ? `<div class="acctools">
          <button class="chip" data-accdo="small">缩小</button><button class="chip" data-accdo="big">放大</button>
          <button class="chip" data-accdo="turn">转一转</button><button class="chip" data-accdo="del">取下来</button>
        </div>` : `<div class="lbl">点一下戴上，再拖到你喜欢的地方</div>`;
      return `<div class="scroll">${tools}
        <div class="grid" id="accGrid">${Art.ACC.map((a) => `<button class="acc${a.gift && count < a.gift ? ' lock' : ''}" data-acc="${a.id}"><span data-th="${a.id}"></span>${a.gift && count < a.gift ? `再梳 ${a.gift - count} 次` : a.n}</button>`).join('')}</div>
        <button class="skip" data-accdo="clear">全部取下</button></div>`;
    },
    dye() {
      const h = Store.data.hair;
      const swatch = (k, d) => `<button class="card${h.dye === k ? ' on' : ''}" data-dye="${k}" style="width:66px"><span style="display:block;width:44px;height:44px;border-radius:50%;background:linear-gradient(180deg,${d.c.join(',')})"></span><span>${d.n}</span></button>`;
      const streaks = [[null, '不挑染'], ['#F7B8C8', '樱粉'], ['#F4D38A', '浅金'], ['#A9CFEF', '浅蓝'], ['#C9B3EA', '浅紫'], ['#FFFFFF', '银白']];
      const palette = ['#2A2320', '#5A3B2B', '#A57C5E', '#E0B070', '#F1B2C0', '#E06F8B', '#AF9AD6', '#92ADCA', '#7ECBEE', '#A0CDBD', '#F5ABBE', '#FFFFFF'];
      const cust = h.custom || ['#5A3B2B', '#5A3B2B', '#E0B070', '#E0B070', '#E0B070'];
      return `<div class="scroll">
        <div class="hrow">${Object.keys(Scene.DYES).map((k) => swatch(k, Scene.DYES[k])).join('')}</div>
        <div class="lbl">挑染</div>
        <div class="hrow">${streaks.map(([c, n]) => `<button class="chip${h.streak === c ? ' on' : ''}" data-streak="${c || ''}">${n}</button>`).join('')}</div>
        <div class="lbl">自己调：发根</div>
        <div class="hrow">${palette.map((c) => `<button class="sw${cust[0] === c && h.dye === 'custom' ? ' on' : ''}" style="background:${c}" data-root="${c}"></button>`).join('')}</div>
        <div class="lbl">自己调：发梢</div>
        <div class="hrow">${palette.map((c) => `<button class="sw${cust[4] === c && h.dye === 'custom' ? ' on' : ''}" style="background:${c}" data-tip="${c}"></button>`).join('')}</div>
      </div>`;
    },
    me() {
      const L = Store.data.look, S = Store.data.settings;
      return `<div class="scroll">
        <div class="lbl">身形：调成你觉得像自己的样子就好</div>${bodyRows()}
        <div class="hrow"><button class="chip" data-body-reset="1">恢复默认</button></div>
        <div class="lbl">房间</div><div class="hrow">${Object.keys(Art.ROOM).map((k) => `<button class="chip${L.room === k ? ' on' : ''}" data-room="${k}">${Art.ROOM[k].n}</button>`).join('')}</div>
        <div class="lbl">肤色</div><div class="hrow">${Art.SKINS.map((s, i) => `<button class="sw${L.skin === i ? ' on' : ''}" style="background:${s.base}" data-skin="${i}"></button>`).join('')}</div>
        <div class="lbl">瞳色</div><div class="hrow">${Art.EYES.map((s, i) => `<button class="sw${L.eye === i ? ' on' : ''}" style="background:radial-gradient(circle at 50% 70%,${s.c},${s.b} 45%,${s.a})" data-eye="${i}"></button>`).join('')}</div>
        <div class="lbl">眼型</div><div class="hrow">${['圆眼', '上挑', '下垂'].map((n, i) => `<button class="chip${L.eyeShape === i ? ' on' : ''}" data-eyes="${i}">${n}</button>`).join('')}</div>
        <div class="lbl">唇色</div><div class="hrow">${Art.LIPS.map((s, i) => `<button class="sw${L.lip === i ? ' on' : ''}" style="background:${s.c}" data-lip="${i}"></button>`).join('')}</div>
        <div class="lbl">镜子里的小细节</div><div class="hrow"><button class="chip${L.freckle ? ' on' : ''}" data-flag="freckle">雀斑</button><button class="chip${L.mole ? ' on' : ''}" data-flag="mole">泪痣</button></div>
        <div class="lbl">衣服</div><div class="hrow">${Art.OUTFITS.map((s, i) => `<button class="chip${L.outfit === i ? ' on' : ''}" data-outfit="${i}">${s.n}</button>`).join('')}</div>
        <div class="lbl">手感</div><div class="hrow"><button class="chip${S.haptics ? ' on' : ''}" data-setting="haptics">轻微震动</button><button class="chip${S.music ? ' on' : ''}" data-setting="music">背景音乐</button><button class="chip${S.sfx ? ' on' : ''}" data-setting="sfx">梳头声音</button></div>
        <div class="lbl">称呼</div><div class="hrow"><button class="chip" data-act="rename">${Store.data.name ? '叫我：' + escapeHtml(Store.data.name) : '告诉我怎么叫你'}</button><button class="chip" data-act="realhair">我现在的真实发长</button></div>
      </div>`;
    },
  };

  const BODY_ROWS = [['shoulder', '肩膀', '窄', '宽'], ['waist', '腰', '收', '直'], ['hip', '胯', '窄', '宽'], ['build', '整体', '清瘦', '圆润']];
  function bodyRows() {
    const b = Object.assign({}, Art.BODY_DEFAULT, Store.data.look.body);
    return BODY_ROWS.map(([k, n, a, z]) => `<div class="bodyrow"><span class="bname">${n}</span><span class="bend">${a}</span><input type="range" min="0" max="1" step="0.02" value="${b[k]}" data-body="${k}" aria-label="${n}"><span class="bend">${z}</span></div>`).join('');
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function renderPanel() {
    // 点选之后面板要留在原来的位置，不能跳回顶部
    const box = $('panel');
    const old = box.querySelector('.scroll');
    const keep = old && box.dataset.tab === tab
      ? { top: old.scrollTop, rows: [...old.querySelectorAll('.hrow')].map((r) => r.scrollLeft) }
      : null;
    box.innerHTML = panels[tab]();
    box.dataset.tab = tab;
    if (tab === 'tie') {
      const types = $('tieTypes');
      Art.TIE_TYPES.forEach((t) => {
        const b = document.createElement('button');
        b.className = 'card tie-prev' + (Store.data.tie.type === t.id ? ' on' : '');
        b.dataset.tiet = t.id;
        b.style.width = '76px';
        b.appendChild(tieThumb(Object.assign({}, Store.data.tie, { type: t.id })));
        const sp = document.createElement('span'); sp.textContent = t.n; b.appendChild(sp);
        types.appendChild(b);
      });
    }
    if (tab === 'acc') {
      document.querySelectorAll('[data-th]').forEach((el) => el.replaceWith(accThumb(el.dataset.th)));
    }
    if (keep) {
      const sc = box.querySelector('.scroll');
      sc.scrollTop = keep.top;
      sc.querySelectorAll('.hrow').forEach((r, i) => { r.scrollLeft = keep.rows[i] || 0; });
    }
  }

  function setTab(t) {
    if (t === tab) {
      $('tray').classList.toggle('fold');
    } else {
      tab = t;
      $('tray').classList.remove('fold');
      renderTabs(); renderPanel();
    }
    Game.requestLayout();
  }

  let promptTimer = null;
  function prompt(text, ms, flow) {
    clearTimeout(promptTimer);
    const p = $('prompt');
    if (!text) { p.classList.remove('on'); return; }
    if (flow) $('toast').classList.remove('on');
    $('promptText').textContent = text;
    p.classList.add('on');
    p.classList.toggle('flow', !!flow);
    if (ms) promptTimer = setTimeout(() => p.classList.remove('on'), ms);
  }

  let toastTimer = null;
  function toast(text, ms) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), ms || 2600);
  }

  let pillTimer = null;
  function pill(text) {
    const p = $('lenpill');
    p.textContent = text;
    p.classList.add('on');
    clearTimeout(pillTimer);
    pillTimer = setTimeout(() => p.classList.remove('on'), 1000);
  }

  function overlay(html) {
    const o = $('overlay');
    o.innerHTML = html || '';
    o.classList.toggle('on', !!html);
    return o;
  }

  function modal(html) {
    return overlay(`<div class="modal-bg"><div class="modal">${html}</div></div>`);
  }

  function setSoundIcon() {
    const s = Store.data.settings;
    $('btnSound').innerHTML = s.music || s.sfx ? I.sound : I.mute;
  }

  function init() {
    $('btnTime').innerHTML = I.time;
    $('btnAlbum').innerHTML = I.album;
    $('btnPhoto').innerHTML = I.photo;
    $('combCursor').innerHTML = `<svg viewBox="0 0 92 60"><rect x="4" y="3" width="84" height="22" rx="11" fill="#E9B6A6"/><rect x="8" y="6" width="76" height="6" rx="3" fill="#F6D5C9"/><g fill="#D79E8D">${Array.from({ length: 15 }, (_, i) => `<rect x="${9 + i * 5.1}" y="23" width="3" height="${30 - (i % 2) * 2}" rx="1.500"/>`).join('')}</g></svg>`;
    setSoundIcon();
    renderTabs();
    renderPanel();

    $('tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (b) setTab(b.dataset.t);
    });
    $('panel').addEventListener('click', onPanel);
    // 滑动面板时，头发那边先歇一下，把性能让给滚动
    $('panel').addEventListener('scroll', () => Game.uiBusy(), { capture: true, passive: true });
    $('panel').addEventListener('touchmove', (e) => { if (e.target.type !== 'range') Game.uiBusy(); }, { passive: true });
    $('panel').addEventListener('input', (e) => {
      const k = e.target.dataset && e.target.dataset.body;
      if (!k) return;
      Store.data.look.body[k] = +e.target.value;
      Game.applyBody();
    });
    $('btnSound').onclick = () => {
      const s = Store.data.settings;
      const on = s.music || s.sfx;
      s.music = !on; s.sfx = !on;
      setSoundIcon(); Snd.applySettings(); Store.saveSoon();
      if (tab === 'me') renderPanel();
    };
    $('btnPhoto').onclick = () => Game.takePhoto();
    $('btnTime').onclick = () => Game.openTime();
    $('btnAlbum').onclick = () => openAlbum();
    $('promptAuto').onclick = () => Game.autoFinish();
    $('promptCancel').onclick = () => Game.cancelFlow();
  }

  function onPanel(e) {
    const t = e.target.closest('button');
    if (!t) return;
    const d = t.dataset;
    const S = Store.data;
    Snd.init();
    if (d.tool) { Game.setTool(d.tool); renderPanel(); return; }
    if (d.wave !== undefined) { S.hair.wave = +d.wave; Hair.H.waveT = +d.wave; Store.saveSoon(); renderPanel(); return; }
    if (d.style) { Game.startStyle(d.style); return; }
    if (d.tiec !== undefined) { S.tie.color = +d.tiec; Game.applyTie(); renderPanel(); return; }
    if (d.tiep) { S.tie.pattern = d.tiep; Game.applyTie(); renderPanel(); return; }
    if (d.tiet) { S.tie.type = d.tiet; Game.applyTie(); renderPanel(); return; }
    if (d.acc) {
      const a = Art.ACC.find((x) => x.id === d.acc);
      if (a.gift && S.careCount < a.gift) { prompt(`再完成 ${a.gift - S.careCount} 个发型，它就是你的了`, 2200); return; }
      Game.addAcc(d.acc); renderPanel(); return;
    }
    if (d.accdo) { Game.accAction(d.accdo); renderPanel(); return; }
    if (d.dye) { S.hair.dye = d.dye; Game.applyDye(); renderPanel(); return; }
    if (d.streak !== undefined) { S.hair.streak = d.streak || null; Game.applyDye(); renderPanel(); return; }
    if (d.root || d.tip) {
      const c = S.hair.custom ? S.hair.custom.slice() : ['#5A3B2B', '#5A3B2B', '#7A5A44', '#E0B070', '#E0B070'];
      if (d.root) { c[0] = d.root; c[1] = d.root; c[2] = mixHex(d.root, c[4], 0.5); }
      if (d.tip) { c[4] = d.tip; c[3] = d.tip; c[2] = mixHex(c[0], d.tip, 0.5); }
      S.hair.custom = c; S.hair.dye = 'custom'; Game.applyDye(); renderPanel(); return;
    }
    if (d.bodyReset) { S.look.body = Object.assign({}, Art.BODY_DEFAULT); Game.applyBody(); renderPanel(); return; }
    if (d.room) { S.look.room = d.room; Game.applyRoom(); Store.saveSoon(); renderPanel(); return; }
    if (d.skin !== undefined) { S.look.skin = +d.skin; Game.applyLook(); renderPanel(); return; }
    if (d.eye !== undefined) { S.look.eye = +d.eye; Game.applyLook(); renderPanel(); return; }
    if (d.eyes !== undefined) { S.look.eyeShape = +d.eyes; Game.applyLook(); renderPanel(); return; }
    if (d.lip !== undefined) { S.look.lip = +d.lip; Game.applyLook(); renderPanel(); return; }
    if (d.outfit !== undefined) { S.look.outfit = +d.outfit; Game.applyLook(); renderPanel(); return; }
    if (d.flag) { S.look[d.flag] = !S.look[d.flag]; Game.applyLook(); renderPanel(); return; }
    if (d.setting) { S.settings[d.setting] = !S.settings[d.setting]; setSoundIcon(); Snd.applySettings(); Store.saveSoon(); renderPanel(); return; }
    if (d.act === 'rename') { askName(); return; }
    if (d.act === 'realhair') { askReal(); return; }
  }

  // 全屏下输入法不会把页面顶上去，所以聚焦时把输入框挪到屏幕上半部分
  function keyboardSafe(input, box, onEnter) {
    input.addEventListener('focus', () => box.classList.add('kb'));
    input.addEventListener('blur', () => setTimeout(() => box.classList.remove('kb'), 120));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); if (onEnter) onEnter(); } });
  }

  function askName() {
    modal(`<h3>想让我怎么叫你？</h3><input id="nameIn" type="text" maxlength="12" value="${escapeHtml(Store.data.name)}" style="width:80%;border:0;border-bottom:1.500px solid var(--rose2);background:transparent;text-align:center;font:inherit;font-size:18px;color:var(--ink);padding:8px;outline:none;margin-bottom:20px"><div class="row"><button class="btn ghost" id="mCancel">算了</button><button class="btn" id="mOk">好</button></div>`);
    $('mCancel').onclick = () => overlay('');
    $('mOk').onclick = () => {
      Store.data.name = $('nameIn').value.trim().slice(0, 12);
      Store.save(); overlay(''); Game.updateGreet(); renderPanel();
    };
    keyboardSafe($('nameIn'), document.querySelector('.modal-bg'), () => $('mOk').click());
  }

  function askReal() {
    const R = Store.data.real;
    const marks = Hair.MARKS.slice(0, 8);
    modal(`<h3>现在的头发，大概到哪里？</h3><p>只是用来估算时间，随时可以改。</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:18px">${marks.map((m) => `<button class="chip" data-cm="${m.cm}">${m.n}</button>`).join('')}</div>
      <button class="btn ghost" id="mCancel">关闭</button>`);
    $('mCancel').onclick = () => overlay('');
    document.querySelectorAll('[data-cm]').forEach((b) => {
      b.onclick = () => {
        R.cm = +b.dataset.cm; R.date = Date.now(); Store.save(); overlay('');
        prompt('记下了。从今天开始算。', 2000);
      };
    });
  }

  function openAlbum() {
    const list = Store.data.album;
    if (!list.length) {
      modal(`<h3>小相册</h3><p>这里还空着。<br>梳好头发，按一下右上角的相机吧。</p><button class="btn ghost" id="mClose">好</button>`);
      $('mClose').onclick = () => overlay('');
      return;
    }
    modal(`<h3>小相册</h3><div class="album">${list.map((p, i) => `<img src="${p.t}" data-i="${i}">`).join('')}</div><p>点开一张，可以把那天的发型找回来。</p><button class="btn ghost" id="mClose">关上</button>`);
    $('mClose').onclick = () => overlay('');
    document.querySelectorAll('.album img').forEach((img) => {
      img.onclick = () => openPhoto(+img.dataset.i);
    });
  }

  function openPhoto(i) {
    const p = Store.data.album[i];
    modal(`<img class="photo" src="${p.t}"><p>${escapeHtml(p.d)}</p><div class="row"><button class="btn" id="mLoad">梳回这个发型</button></div><button class="skip" id="mDel">从相册拿掉</button><button class="skip" id="mBack">返回</button>`);
    $('mBack').onclick = () => openAlbum();
    $('mLoad').onclick = () => { overlay(''); Game.restorePhoto(p); };
    $('mDel').onclick = () => { Store.data.album.splice(i, 1); Store.save(); openAlbum(); };
  }

  return {
    $, I, init, renderPanel, prompt, toast, pill, overlay, modal, setTab, escapeHtml, setSoundIcon,
    get tab() { return tab; }, askName, keyboardSafe,
  };
})();
