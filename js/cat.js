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

  /* ---------------- 姿势一：走 ---------------- */
  const walk = el('g', { class: 'pose' }, body);

  const tail = el('g', {}, walk);
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

  const legsBack = el('g', {}, walk);
  const leg = (parent, cx, cy) => el('ellipse', {
    cx, cy, rx: 4.8, ry: 6.2, fill: C.back, stroke: C.line, 'stroke-width': LW
  }, parent);
  const lb1 = leg(legsBack, -17, 15), lb2 = leg(legsBack, -7, 17);

  // 身体轮廓的绒毛：画在身体之下，只在边缘露出一圈
  const fringe = el('g', {}, walk);
  fuzz(fringe, [[-25, -4], [-14, -20], [2, -21], [17, -17], [24, -3], [20, 10], [4, 17], [-12, 16], [-24, 5], [-25, -4]], 3.8, C.fuzz);

  const BODY = 'M-25,-4 C-28,-16 -16,-22 -2,-21 C13,-20 23,-14 24,-3 C25,9 14,17 -1,17 C-16,17 -22,8 -25,-4 Z';
  el('path', { d: BODY, fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, walk);
  el('ellipse', { cx: -2, cy: -11, rx: 19, ry: 8, fill: C.back, opacity: .5 }, walk);
  el('ellipse', { cx: 0, cy: 9, rx: 14, ry: 6, fill: C.light, opacity: .7 }, walk);
  [-16, -8, 0, 8].forEach(x =>
    el('path', { d: `M${x},-19 q3,6 0,12`, fill: 'none', stroke: C.stripe, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: .8 }, walk));

  const legsFront = el('g', {}, walk);
  const lf1 = leg(legsFront, 7, 17), lf2 = leg(legsFront, 15, 15);

  const head = el('g', {}, walk);
  const headFringe = el('g', {}, head);
  fuzz(headFringe, [[14, -8], [17, -17], [26, -20], [35, -16], [39, -6], [35, 3], [26, 7], [17, 3], [14, -8]], 3.4, C.fuzz);
  el('path', { d: 'M13,-14 L9,-29 L24,-21 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, head);
  el('path', { d: 'M14.5,-16 L12,-25 L21.5,-20 Z', fill: C.ear }, head);
  el('path', { d: 'M32,-18 L39,-30 L40,-15 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, head);
  el('path', { d: 'M33.5,-19 L37.5,-26 L38,-17 Z', fill: C.ear }, head);
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
  el('path', { d: 'M-9,-18 L-14,-36 L3,-27 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, sitHead);
  el('path', { d: 'M-7.5,-20 L-10.5,-31 L0,-25.5 Z', fill: C.ear }, sitHead);
  el('path', { d: 'M15,-21 L23,-36 L25,-19 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, sitHead);
  el('path', { d: 'M16.5,-22 L21.5,-31 L22.5,-21 Z', fill: C.ear }, sitHead);
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
  el('path', { d: 'M-24,-6 L-32,-20 L-14,-17 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, sleepHead);
  el('path', { d: 'M-8,-14 L-4,-27 L2,-12 Z', fill: C.fur, stroke: C.line, 'stroke-width': LW, 'stroke-linejoin': 'round' }, sleepHead);
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
  let pose = 'walk', blinkUntil = 0;

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

    if (pose === 'walk') {
      const w = t * (5 + speed * 9);
      const s = Math.min(1, .35 + speed);
      lb1.setAttribute('cy', 15 + Math.sin(w) * 3.4 * s);
      lb2.setAttribute('cy', 17 + Math.sin(w + 2.4) * 3.4 * s);
      lf1.setAttribute('cy', 17 + Math.sin(w + 3.14) * 3.4 * s);
      lf2.setAttribute('cy', 15 + Math.sin(w + 5.5) * 3.4 * s);
      walk.setAttribute('transform', `translate(0,${(Math.sin(w * 2) * .9 * s).toFixed(2)})`);
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
