// 地图上的橘猫：3/4 俯视，朝右为正方向，由 tour.js 驱动
// 三个姿势：walk 走 / sit 坐 / sleep 蜷着睡
window.CAT_SCALE = .74;   // 猫在地图世界坐标里的大小
window.createCat = function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  const C = {
    fur: '#e9974b', back: '#d67f32', light: '#f7cd9b',
    stripe: '#b3641f', line: '#3a2a1e', ear: '#e9a79f', nose: '#b3402a',
    fuzz: '#d8862f'
  };
  const LW = 1.6;
  const SCALE = window.CAT_SCALE;

  const root = el('g', { class: 'cat-root' });
  const body = el('g', { class: 'cat-body' }, root);   // 承担朝向翻转与呼吸起伏

  // 沿轮廓撒短毛：在给定折线上长出一簇簇小毛刺
  const fuzz = (parent, pts, len, color) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d;
      const n = Math.max(1, Math.round(d / 2.3));
      for (let k = 0; k < n; k++) {
        const t = (k + .5) / n;
        const px = x1 + dx * t, py = y1 + dy * t;
        const s = len * (.6 + (k % 3) * .26);
        const sw = (k % 2 ? 1 : -1) * s * .45;
        el('path', {
          d: `M${px.toFixed(1)},${py.toFixed(1)} q${(nx * s * .5 + dx / d * sw).toFixed(1)},${(ny * s * .5 + dy / d * sw).toFixed(1)} ${(nx * s).toFixed(1)},${(ny * s).toFixed(1)}`,
          fill: 'none', stroke: color, 'stroke-width': 1.1, 'stroke-linecap': 'round'
        }, parent);
      }
    }
  };

  // 耳朵：长在圆脑袋 (cx,cy,r) 的 deg 方向上。两侧从头部轮廓沿切线长出，耳根不留缺口，耳尖磨圆
  const ear = (parent, [cx, cy], r, deg, len, inner = true) => {
    const a = deg * Math.PI / 180, sp = .42;
    const at = (ang, rad) => [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad];
    const T = at(a, r + len);
    const side = sgn => {
      const b = a + sgn * sp, J = at(b, r);
      const C = [J[0] + Math.sin(b) * sgn * 3 + Math.cos(b) * 2.2, J[1] - Math.cos(b) * sgn * 3 + Math.sin(b) * 2.2];
      const d = Math.hypot(C[0] - T[0], C[1] - T[1]);
      return { I: at(b, r * .6), J, C, A: [T[0] + (C[0] - T[0]) * 2.6 / d, T[1] + (C[1] - T[1]) * 2.6 / d] };
    };
    const L = side(-1), R = side(1);
    const path = pts => {
      const f = v => pts(v).map(n => n.toFixed(1)).join(',');
      return `M${f(L.I)} L${f(L.J)} Q${f(L.C)} ${f(L.A)} Q${f(T)} ${f(R.A)} Q${f(R.C)} ${f(R.J)} L${f(R.I)} Z`;
    };
    el('path', { d: path(v => v), fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, parent);
    if (!inner) return;
    const O = at(a, r + len * .3);
    el('path', { d: path(v => [O[0] + (v[0] - O[0]) * .55, O[1] + (v[1] - O[1]) * .55]), fill: C.ear }, parent);
  };

  /* ---------------- 姿势一：走 ---------------- */
  const walk = el('g', { class: 'pose' }, body);
  el('ellipse', { cx: 2, cy: 23, rx: 27, ry: 5, fill: '#2f2c22', opacity: .13 }, walk);

  // 腿：髋/肩 → 膝 → 爪 两段，由 update 按步态求解；全部画在身体之下，只露出下半截
  // 远侧两条颜色深一点，近侧落点更靠下，形成 3/4 俯视的前后层次
  const LEGS = [
    { hx: -15, hy: 5, gy: 23, front: false, ph: 0, near: true },
    { hx: 12, hy: 5, gy: 23, front: true, ph: .25, near: true },
    { hx: -10, hy: 3, gy: 20.5, front: false, ph: .5, near: false },
    { hx: 17, hy: 3, gy: 20.5, front: true, ph: .75, near: false }
  ];
  const legLayer = el('g', {}, walk);
  [2, 3, 0, 1].forEach(i => {
    const L = LEGS[i], g = el('g', {}, legLayer), col = L.near ? C.fur : C.back;
    L.edge = el('path', { fill: 'none', stroke: C.line, 'stroke-width': 6.4 + LW * 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    L.fill = el('path', { fill: 'none', stroke: col, 'stroke-width': 6.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    L.paw = el('ellipse', { rx: 4, ry: 2.6, fill: L.near ? C.light : col, stroke: C.line, 'stroke-width': 1.3 }, g);
  });

  const upper = el('g', {}, walk);   // 随步伐起伏的上半身
  const tail = el('g', {}, upper);
  const tailFuzz = el('g', {}, tail);
  const tailPath = el('path', {
    d: 'M-24,-2 Q-46,-10 -48,-32', fill: 'none',
    stroke: C.fur, 'stroke-width': 7.5, 'stroke-linecap': 'round'
  }, tail);
  const tailRings = el('path', {
    d: 'M-38,-14 l6,3 M-44,-23 l7,1.6', fill: 'none',
    stroke: C.stripe, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8
  }, tail);
  const tailTip = el('path', {
    d: 'M-47,-25 Q-49,-29 -48,-32', fill: 'none',
    stroke: C.light, 'stroke-width': 7.5, 'stroke-linecap': 'round'
  }, tail);

  // 身体轮廓的绒毛：画在身体之下，只在边缘露出一圈
  const fringe = el('g', {}, upper);
  fuzz(fringe, [[-25, -4], [-14, -20], [2, -21], [17, -17], [24, -3], [20, 10], [4, 17], [-12, 16], [-24, 5], [-25, -4]], 3.8, C.fuzz);

  const BODY = 'M-25,-4 C-28,-16 -16,-22 -2,-21 C13,-20 23,-14 24,-3 C25,9 14,17 -1,17 C-16,17 -22,8 -25,-4 Z';
  el('path', { d: BODY, fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, upper);
  el('ellipse', { cx: -2, cy: -11, rx: 19, ry: 8, fill: C.back, opacity: .5 }, upper);
  el('ellipse', { cx: 0, cy: 9, rx: 14, ry: 6, fill: C.light, opacity: .7 }, upper);
  [-16, -8, 0, 8].forEach(x =>
    el('path', { d: `M${x},-19 q3,6 0,12`, fill: 'none', stroke: C.stripe, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: .8 }, upper));

  const head = el('g', {}, upper);
  const headFringe = el('g', {}, head);
  fuzz(headFringe, [[14, -8], [17, -17], [26, -20], [35, -16], [39, -6], [35, 3], [26, 7], [17, 3], [14, -8]], 3.4, C.fuzz);
  ear(head, [26, -6], 13, -126, 8.5);
  ear(head, [26, -6], 13, -60, 8.5);
  el('circle', { cx: 26, cy: -6, r: 13, fill: C.fur, stroke: C.line, 'stroke-width': LW }, head);
  el('path', { d: 'M20,-17 q3,5 0,9 M26,-19 q3,5 0,9 M32,-17 q3,5 0,9', fill: 'none', stroke: C.stripe, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: .75 }, head);
  el('ellipse', { cx: 27, cy: 0, rx: 8, ry: 5.4, fill: C.light }, head);
  const eyes = el('g', {}, head);
  const eyeL = el('ellipse', { cx: 22, cy: -7, rx: 2.1, ry: 2.5, fill: C.line }, eyes);
  const eyeR = el('ellipse', { cx: 31, cy: -7, rx: 2.1, ry: 2.5, fill: C.line }, eyes);
  el('circle', { cx: 22.7, cy: -7.9, r: .8, fill: '#fff' }, eyes);
  el('circle', { cx: 31.7, cy: -7.9, r: .8, fill: '#fff' }, eyes);
  el('path', { d: 'M24.6,-1.6 L27,.6 L29.4,-1.6', fill: 'none', stroke: C.nose, 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, head);
  el('path', { d: 'M20,0 L11,-3 M20,2 L11,2 M34,0 L43,-3 M34,2 L43,2', fill: 'none', stroke: C.line, 'stroke-width': .75, 'stroke-linecap': 'round', opacity: .55 }, head);

  /* ---------------- 姿势二：坐 ---------------- */
  const sit = el('g', { class: 'pose' }, body);
  el('ellipse', { cx: 0, cy: 20, rx: 24, ry: 6, fill: '#2f2c22', opacity: .13 }, sit);
  el('path', { d: 'M-16,16 Q-40,20 -42,2 Q-43,-10 -34,-14', fill: 'none', stroke: C.fur, 'stroke-width': 8, 'stroke-linecap': 'round' }, sit);
  el('path', { d: 'M-40,8 Q-43,-2 -35,-13', fill: 'none', stroke: C.light, 'stroke-width': 8, 'stroke-linecap': 'round' }, sit);
  const sitBody = el('g', {}, sit);
  fuzz(sitBody, [[-18, 16], [-19, -2], [-8, -17], [8, -18], [22, -2], [22, 16]], 3.8, C.fuzz);
  el('path', { d: 'M-18,18 C-22,2 -16,-16 0,-18 C16,-20 24,-4 22,14 C21,19 14,21 1,21 C-11,21 -17,21 -18,18 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, sitBody);
  el('path', { d: 'M-6,-14 C-12,2 -12,12 -9,20 M4,-16 C0,0 0,12 3,21 M14,-12 C12,2 12,12 14,20', fill: 'none', stroke: C.stripe, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .7 }, sitBody);
  el('ellipse', { cx: 4, cy: 10, rx: 11, ry: 10, fill: C.light, opacity: .85 }, sitBody);
  el('ellipse', { cx: -3, cy: 20, rx: 6, ry: 3.4, fill: C.light, stroke: C.line, 'stroke-width': 1.3 }, sit);
  el('ellipse', { cx: 10, cy: 20, rx: 6, ry: 3.4, fill: C.light, stroke: C.line, 'stroke-width': 1.3 }, sit);

  const sitHead = el('g', {}, sit);
  fuzz(sitHead, [[-8, -12], [-6, -21], [4, -24], [14, -22], [20, -13], [19, -1], [8, 5], [-3, 1], [-8, -12]], 3.4, C.fuzz);
  ear(sitHead, [6, -9], 14.5, -125, 9);
  ear(sitHead, [6, -9], 14.5, -55, 9);
  el('circle', { cx: 6, cy: -9, r: 14.5, fill: C.fur, stroke: C.line, 'stroke-width': LW }, sitHead);
  el('path', { d: 'M0,-21 q3,5 0,9 M6,-23 q3,5 0,9 M12,-21 q3,5 0,9', fill: 'none', stroke: C.stripe, 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: .75 }, sitHead);
  el('ellipse', { cx: 6, cy: -3, rx: 9, ry: 6, fill: C.light }, sitHead);
  const sitEyes = el('g', {}, sitHead);
  const sEyeL = el('ellipse', { cx: 0, cy: -11, rx: 2.3, ry: 2.8, fill: C.line }, sitEyes);
  const sEyeR = el('ellipse', { cx: 12, cy: -11, rx: 2.3, ry: 2.8, fill: C.line }, sitEyes);
  el('circle', { cx: .8, cy: -12, r: .9, fill: '#fff' }, sitEyes);
  el('circle', { cx: 12.8, cy: -12, r: .9, fill: '#fff' }, sitEyes);
  el('path', { d: 'M3.4,-5 L6,-2.6 L8.6,-5', fill: 'none', stroke: C.nose, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sitHead);
  el('path', { d: 'M-2,-3 L-12,-6 M-2,-1 L-12,-1 M14,-3 L24,-6 M14,-1 L24,-1', fill: 'none', stroke: C.line, 'stroke-width': .75, 'stroke-linecap': 'round', opacity: .55 }, sitHead);

  /* ---------------- 姿势三：睡 ---------------- */
  const sleep = el('g', { class: 'pose' }, body);
  el('ellipse', { cx: 0, cy: 14, rx: 28, ry: 7, fill: '#2f2c22', opacity: .13 }, sleep);
  const curl = el('g', {}, sleep);
  fuzz(curl, [[-26, -2], [-14, -22], [4, -24], [22, -16], [29, -2], [23, 13], [0, 17], [-20, 12], [-26, -2]], 3.8, C.fuzz);
  el('path', { d: 'M22,4 Q40,4 36,-8 Q32,-18 18,-16', fill: 'none', stroke: C.fur, 'stroke-width': 8, 'stroke-linecap': 'round' }, curl);
  el('path', { d: 'M-26,0 C-28,-16 -12,-24 4,-23 C22,-22 30,-10 28,3 C26,13 12,16 0,16 C-14,16 -25,12 -26,0 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, curl);
  el('path', { d: 'M-14,-20 C-18,-8 -18,2 -14,12 M-2,-23 C-6,-10 -6,2 -2,15 M10,-22 C7,-10 7,2 10,14', fill: 'none', stroke: C.stripe, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: .7 }, curl);
  const sleepHead = el('g', {}, sleep);
  fuzz(sleepHead, [[-28, -2], [-25, -10], [-16, -12], [-6, -9], [-3, 2], [-7, 12], [-16, 15], [-26, 10], [-28, -2]], 3.2, C.fuzz);
  ear(sleepHead, [-16, 2], 13, -135, 7.5, false);
  ear(sleepHead, [-16, 2], 13, -55, 7.5, false);
  el('circle', { cx: -16, cy: 2, r: 13, fill: C.fur, stroke: C.line, 'stroke-width': LW }, sleepHead);
  el('ellipse', { cx: -14, cy: 7, rx: 8, ry: 5, fill: C.light }, sleepHead);
  el('path', { d: 'M-24,1 q3,3 6,0 M-10,1 q3,3 6,0', fill: 'none', stroke: C.line, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, sleepHead);
  el('path', { d: 'M-16.6,5 L-14,7.4 L-11.4,5', fill: 'none', stroke: C.nose, 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sleepHead);
  const zzz = el('g', { class: 'cat-zzz' }, sleep);
  [[-4, -26, 9], [4, -34, 7], [11, -40, 5]].forEach(([x, y, s], i) => {
    const t = el('text', { x, y, 'font-size': s, fill: '#6a6454', 'font-family': 'inherit', opacity: 0 }, zzz);
    t.textContent = 'z';
    t.style.animation = `catZ 3s ${i * .55}s infinite`;
  });

  /* ---------------- 驱动 ---------------- */
  const poses = { walk, sit, sleep };
  let pose = 'walk', gait = 0, lastT = null;

  // 一个步态周期里：前 60% 爪子着地、相对身体向后蹬；后 40% 抬起向前摆
  const DUTY = .6, THIGH = 9, SHIN = 10;
  function placeLeg(L, cyc, stride, lift, bob) {
    const u = ((cyc + L.ph) % 1 + 1) % 1;
    let fx, fy;
    if (u < DUTY) {
      fx = stride * (1 - 2 * u / DUTY);
      fy = 0;
    } else {
      const v = (u - DUTY) / (1 - DUTY), e = v * v * (3 - 2 * v);
      fx = stride * (2 * e - 1);
      fy = -lift * Math.sin(Math.PI * v);
    }
    fx += L.hx + (L.front ? 1.5 : -1);
    fy += L.gy;
    const hx = L.hx, hy = L.hy + bob;
    // 两段腿求膝盖：前腿腕关节朝前折，后腿跗关节朝后折
    const dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), THIGH + SHIN - .01);
    const a = Math.acos((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d));
    const base = Math.atan2(dy, dx) + (L.front ? -a : a);
    const kx = hx + Math.cos(base) * THIGH, ky = hy + Math.sin(base) * THIGH;
    const dPath = `M${hx.toFixed(1)},${hy.toFixed(1)} L${kx.toFixed(1)},${ky.toFixed(1)} L${fx.toFixed(1)},${(fy - 1).toFixed(1)}`;
    L.edge.setAttribute('d', dPath);
    L.fill.setAttribute('d', dPath);
    L.paw.setAttribute('cx', (fx + (L.front ? 1 : .6)).toFixed(1));
    L.paw.setAttribute('cy', fy.toFixed(1));
  }

  function setPose(name) {
    if (name === pose) return;
    pose = name;
    for (const k in poses) poses[k].style.display = k === name ? '' : 'none';
  }
  setPose('walk');
  for (const k in poses) poses[k].style.display = k === 'walk' ? '' : 'none';

  // x,y 世界坐标；dir 为 1 朝右 / -1 朝左；t 为秒；speed 0-1 走得多快
  function update(x, y, dir, t, speed) {
    root.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${SCALE})`);
    body.setAttribute('transform', `scale(${dir},1)`);

    const dt = lastT == null ? 0 : Math.min(.1, Math.max(0, t - lastT));
    lastT = t;

    if (pose === 'walk') {
      // 相位按时间累积，速度变化时步子不会跳
      gait = (gait + dt * (.8 + speed * 1.4)) % 1;
      const s = Math.min(1, .35 + speed);
      // 每个周期四次落爪，身体随之轻微起伏
      const bob = Math.cos(gait * Math.PI * 4) * .7 * s;
      LEGS.forEach(L => placeLeg(L, gait, 7 * s, 3.6 + 2 * s, bob));
      upper.setAttribute('transform', `translate(0,${bob.toFixed(2)})`);
      head.setAttribute('transform', `translate(0,${(Math.cos(gait * Math.PI * 4 - .8) * .5 * s).toFixed(2)})`);
      const sw = Math.sin(t * 2.4) * (8 + speed * 10);
      tail.setAttribute('transform', `rotate(${sw.toFixed(1)},-24,-2)`);
      tailPath.setAttribute('d', `M-24,-2 Q${(-46 + sw * .3).toFixed(1)},-10 ${(-48 + sw * .5).toFixed(1)},-32`);
      tailTip.setAttribute('d', `M${(-47 + sw * .44).toFixed(1)},-25 Q${(-49 + sw * .47).toFixed(1)},-29 ${(-48 + sw * .5).toFixed(1)},-32`);
      tailRings.setAttribute('transform', `translate(${(sw * .22).toFixed(2)},0)`);
      const blink = t % 4.3 < .13 ? .25 : 1;
      eyeL.setAttribute('ry', 2.5 * blink);
      eyeR.setAttribute('ry', 2.5 * blink);
    } else if (pose === 'sit') {
      sit.setAttribute('transform', `translate(0,${(Math.sin(t * 1.8) * .7).toFixed(2)})`);
      const blink = t % 3.7 < .15 ? .2 : 1;
      sEyeL.setAttribute('ry', 2.8 * blink);
      sEyeR.setAttribute('ry', 2.8 * blink);
    } else {
      const b = 1 + Math.sin(t * 1.5) * .022;
      curl.setAttribute('transform', `scale(${b.toFixed(4)},${(2 - b).toFixed(4)})`);
    }
  }

  return { node: root, setPose, update, get pose() { return pose; } };
};
