// WebGL 渲染层：一条发丝管线 + 一条贴图精灵管线
const G = (() => {
  let gl, canvas;
  let W = 1, H = 1, DPR = 1;

  const hairVS = `
attribute vec2 aPos; attribute vec2 aUV; attribute vec4 aE; attribute vec2 aS;
uniform mat3 uM; uniform vec3 uC[5]; uniform vec2 uOff;
varying vec2 vUV; varying vec4 vE; varying vec3 vCol; varying vec2 vS;
void main(){
  vUV=aUV; vE=aE; vS=aS;
  float t=clamp(aUV.y,0.,.999)*4.;
  int i=int(floor(t)); float f=t-floor(t);
  vCol=mix(uC[i],uC[i+1],f);
  vec3 p=uM*vec3(aPos+uOff,1.);
  gl_Position=vec4(p.xy,0.,1.);
}`;

  const hairFS = `
precision mediump float;
varying vec2 vUV; varying vec4 vE; varying vec3 vCol; varying vec2 vS;
uniform vec3 uLight; uniform vec3 uStreak; uniform float uShine; uniform float uShadow;
void main(){
  float au=abs(vUV.x);
  float a=smoothstep(1.,.74,au)*vE.w;
  if(uShadow>.5){
    float s=a*.085;
    gl_FragColor=vec4(.32*s,.16*s,.20*s,s);
    return;
  }
  float sd=vE.x*43.;
  float x=vUV.x*3.0*clamp(vS.y/46.,.12,1.5)+sd;
  float n=sin(x*3.1+vUV.y*5.)*.5+sin(x*7.3+1.7)*.3+sin(x*13.7+.6+vUV.y*3.)*.2;
  vec3 c=mix(vCol,uStreak,vS.x);
  c*=.94+.12*n;
  c*=mix(1.06,.70,au*au*au)*vE.y;
  float ly=vE.z;
  float wob=sin(vUV.x*5.+sd)*14.+sin(sd*3.)*16.;
  float ring=smoothstep(36.,3.,abs(ly+112.+wob));
  float str=.5+.5*sin(x*9.+sd);
  vec3 hi=mix(c,vec3(1.,.97,.93),.70);
  c=mix(c,hi,ring*(.35+.65*str)*uShine*.8);
  float sh2=smoothstep(120.,8.,abs(ly-(430.+wob*2.)));
  c=mix(c,hi,sh2*(.3+.7*str)*uShine*.16);
  c*=uLight;
  gl_FragColor=vec4(c*a,a);
}`;

  const sprVS = `
attribute vec2 aPos; attribute vec2 aUV; attribute vec4 aCol;
uniform mat3 uM; varying vec2 vUV; varying vec4 vCol;
void main(){
  vUV=aUV; vCol=aCol;
  vec3 p=uM*vec3(aPos,1.);
  gl_Position=vec4(p.xy,0.,1.);
}`;

  const sprFS = `
precision mediump float;
varying vec2 vUV; varying vec4 vCol;
uniform sampler2D uTex;
void main(){
  vec4 t=texture2D(uTex,vUV);
  gl_FragColor=vec4(t.rgb*vCol.rgb*vCol.a,t.a*vCol.a);
}`;

  function compile(vs, fs) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  let hairP, sprP, hairU = {}, sprU = {}, hairA = {}, sprA = {};
  let hairVB, hairIB, sprVB, sprIB;

  const HAIR_STRIDE = 10;
  const HAIR_MAXV = 30000;
  const hairV = new Float32Array(HAIR_MAXV * HAIR_STRIDE);
  const hairI = new Uint16Array(HAIR_MAXV * 3);
  let hv = 0, hi = 0;

  const SPR_MAX = 1200;
  const sprV = new Float32Array(SPR_MAX * 4 * 8);
  let sn = 0, sprTex = null;

  let matrix = new Float32Array(9);
  let light = [1, 1, 1];

  function init(c) {
    canvas = c;
    const opts = { alpha: false, antialias: true, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false };
    gl = c.getContext('webgl', opts) || c.getContext('experimental-webgl', opts);
    if (!gl) return false;
    hairP = compile(hairVS, hairFS);
    sprP = compile(sprVS, sprFS);
    ['aPos', 'aUV', 'aE', 'aS'].forEach((n) => (hairA[n] = gl.getAttribLocation(hairP, n)));
    ['uM', 'uC', 'uOff', 'uLight', 'uStreak', 'uShine', 'uShadow'].forEach((n) => (hairU[n] = gl.getUniformLocation(hairP, n)));
    ['aPos', 'aUV', 'aCol'].forEach((n) => (sprA[n] = gl.getAttribLocation(sprP, n)));
    ['uM', 'uTex'].forEach((n) => (sprU[n] = gl.getUniformLocation(sprP, n)));

    hairVB = gl.createBuffer();
    hairIB = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hairVB);
    gl.bufferData(gl.ARRAY_BUFFER, hairV.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hairIB);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, hairI.byteLength, gl.DYNAMIC_DRAW);

    sprVB = gl.createBuffer();
    sprIB = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sprVB);
    gl.bufferData(gl.ARRAY_BUFFER, sprV.byteLength, gl.DYNAMIC_DRAW);
    const idx = new Uint16Array(SPR_MAX * 6);
    for (let i = 0; i < SPR_MAX; i++) {
      const v = i * 4;
      idx.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sprIB);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    resize();
    return true;
  }

  function resize(forceDpr) {
    const maxDpr = forceDpr || G.quality.dpr;
    DPR = Math.min(window.devicePixelRatio || 1, maxDpr);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function setCamera(cx, cy, z, screenY) {
    // 世界坐标 -> 裁剪坐标；cy 落在屏幕 screenY 像素处
    const sx = (2 * z) / W, sy = (-2 * z) / H;
    matrix[0] = sx; matrix[1] = 0; matrix[2] = 0;
    matrix[3] = 0; matrix[4] = sy; matrix[5] = 0;
    matrix[6] = -cx * sx;
    matrix[7] = 1 - (2 * screenY) / H - cy * sy;
    matrix[8] = 1;
  }

  function setScreenCamera() {
    matrix[0] = 2 / W; matrix[1] = 0; matrix[2] = 0;
    matrix[3] = 0; matrix[4] = -2 / H; matrix[5] = 0;
    matrix[6] = -1; matrix[7] = 1; matrix[8] = 1;
  }

  function tex(cv) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function updateTex(t, cv) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    return t;
  }
  function freeTex(t) { if (t) gl.deleteTexture(t); }

  function clear(r, g, b) {
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  // ---- 精灵 ----
  function flush() {
    if (!sn) return;
    gl.useProgram(sprP);
    gl.bindBuffer(gl.ARRAY_BUFFER, sprVB);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, sprV.subarray(0, sn * 32));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sprIB);
    gl.enableVertexAttribArray(sprA.aPos);
    gl.enableVertexAttribArray(sprA.aUV);
    gl.enableVertexAttribArray(sprA.aCol);
    gl.vertexAttribPointer(sprA.aPos, 2, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(sprA.aUV, 2, gl.FLOAT, false, 32, 8);
    gl.vertexAttribPointer(sprA.aCol, 4, gl.FLOAT, false, 32, 16);
    gl.uniformMatrix3fv(sprU.uM, false, matrix);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sprTex);
    gl.uniform1i(sprU.uTex, 0);
    gl.drawElements(gl.TRIANGLES, sn * 6, gl.UNSIGNED_SHORT, 0);
    sn = 0;
  }

  function sprite(t, x, y, w, h, rot, a, ax, ay, tint) {
    if (t !== sprTex || sn >= SPR_MAX) { flush(); sprTex = t; }
    rot = rot || 0;
    if (a === undefined) a = 1;
    if (ax === undefined) ax = 0.5;
    if (ay === undefined) ay = 0.5;
    const r = tint ? tint[0] : light[0], g = tint ? tint[1] : light[1], b = tint ? tint[2] : light[2];
    const c = Math.cos(rot), s = Math.sin(rot);
    const l = -ax * w, rr = (1 - ax) * w, top = -ay * h, bot = (1 - ay) * h;
    const o = sn * 32;
    const put = (i, lx, ly, u, v) => {
      sprV[o + i] = x + lx * c - ly * s;
      sprV[o + i + 1] = y + lx * s + ly * c;
      sprV[o + i + 2] = u; sprV[o + i + 3] = v;
      sprV[o + i + 4] = r; sprV[o + i + 5] = g; sprV[o + i + 6] = b; sprV[o + i + 7] = a;
    };
    put(0, l, top, 0, 0);
    put(8, rr, top, 1, 0);
    put(16, rr, bot, 1, 1);
    put(24, l, bot, 0, 1);
    sn++;
  }

  function setLight(l) { flush(); light = l; }

  // ---- 发丝 ----
  function hairBegin() { hv = 0; hi = 0; }
  function hairMark() { return hi; }
  function hairVertRoom(n) { return hv + n < HAIR_MAXV; }
  function hairVert(x, y, u, v, seed, shade, ly, alpha, streak, width) {
    const o = hv * HAIR_STRIDE;
    hairV[o] = x; hairV[o + 1] = y; hairV[o + 2] = u; hairV[o + 3] = v;
    hairV[o + 4] = seed; hairV[o + 5] = shade; hairV[o + 6] = ly; hairV[o + 7] = alpha; hairV[o + 8] = streak; hairV[o + 9] = width;
    return hv++;
  }
  function hairTri(a, b, c) {
    hairI[hi++] = a; hairI[hi++] = b; hairI[hi++] = c;
  }
  function hairUpload() {
    gl.bindBuffer(gl.ARRAY_BUFFER, hairVB);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, hairV.subarray(0, hv * HAIR_STRIDE));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hairIB);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, hairI.subarray(0, hi));
  }
  function hairDraw(from, to, stops, streak, shine, shadow, offX, offY) {
    if (to <= from) return;
    flush();
    gl.useProgram(hairP);
    gl.bindBuffer(gl.ARRAY_BUFFER, hairVB);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hairIB);
    const st = HAIR_STRIDE * 4;
    gl.enableVertexAttribArray(hairA.aPos);
    gl.enableVertexAttribArray(hairA.aUV);
    gl.enableVertexAttribArray(hairA.aE);
    gl.enableVertexAttribArray(hairA.aS);
    gl.vertexAttribPointer(hairA.aPos, 2, gl.FLOAT, false, st, 0);
    gl.vertexAttribPointer(hairA.aUV, 2, gl.FLOAT, false, st, 8);
    gl.vertexAttribPointer(hairA.aE, 4, gl.FLOAT, false, st, 16);
    gl.vertexAttribPointer(hairA.aS, 2, gl.FLOAT, false, st, 32);
    gl.uniformMatrix3fv(hairU.uM, false, matrix);
    gl.uniform3fv(hairU.uC, stops);
    gl.uniform3f(hairU.uLight, light[0], light[1], light[2]);
    gl.uniform3f(hairU.uStreak, streak[0], streak[1], streak[2]);
    gl.uniform1f(hairU.uShine, shine);
    gl.uniform1f(hairU.uShadow, shadow ? 1 : 0);
    gl.uniform2f(hairU.uOff, offX || 0, offY || 0);
    gl.drawElements(gl.TRIANGLES, to - from, gl.UNSIGNED_SHORT, from * 2);
  }

  return {
    quality: { dpr: 2, sub: 3 },
    init, resize, setCamera, setScreenCamera, tex, updateTex, freeTex, clear,
    sprite, flush, setLight,
    hairBegin, hairMark, hairVertRoom, hairVert, hairTri, hairUpload, hairDraw,
    get W() { return W; }, get H() { return H; }, get canvas() { return canvas; },
  };
})();
