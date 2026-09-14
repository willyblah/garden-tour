// 手绘风拙政园平面图：水面、山岛、建筑、树木全部由 SVG 生成
window.buildGardenMap = function (svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  let seed = 20240509;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = arr => arr[Math.floor(rnd() * arr.length)];

  const WALL = 'M62,112 L392,94 L842,90 L1148,106 L1156,664 L846,672 L840,618 L612,626 L566,662 L70,652 Z';
  const WATER = [
    // 中园大池（含西侧南北向水道）
    'M452,140 C540,118 660,124 752,132 C806,138 824,176 818,226 C812,276 826,322 796,350 C764,378 724,356 690,372 C660,386 620,384 596,366 C572,348 540,352 520,372 C500,392 512,420 502,446 C494,470 500,500 506,530 C512,560 540,566 548,590 C556,614 520,628 486,618 C452,606 440,570 440,530 C440,490 452,460 446,420 C440,380 428,340 432,290 C436,240 424,200 430,172 C434,152 440,144 452,140 Z',
    // 西园 S 形水面
    'M232,128 C286,120 334,140 330,180 C326,216 286,228 292,266 C298,306 356,316 356,360 C356,404 306,418 300,448 C294,476 330,494 318,526 C306,556 248,566 214,552 C180,538 188,506 218,494 C248,482 256,452 250,424 C244,392 290,384 292,354 C294,324 244,312 240,272 C236,232 276,214 272,184 C268,160 206,138 232,128 Z',
    // 东园芙蓉榭池
    'M968,196 C1010,176 1080,182 1100,214 C1118,244 1086,276 1040,274 C1000,272 944,236 968,196 Z',
    // 听雨轩小池
    'M740,590 C752,578 776,580 780,592 C784,604 766,612 752,610 C738,608 732,600 740,590 Z'
  ];
  const ISLANDS = [
    'M520,212 C548,186 616,186 640,206 C660,224 640,258 600,262 C560,266 500,246 520,212 Z',
    'M668,226 C690,206 742,208 756,228 C768,248 740,272 706,270 C676,268 652,246 668,226 Z',
    'M500,286 C514,272 546,274 552,290 C558,306 540,318 522,316 C504,314 488,300 500,286 Z'
  ];

  const defs = el('defs', {}, svg);
  defs.innerHTML = `
    <filter id="m-rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/>
      <feDisplacementMap in="SourceGraphic" scale="4"/>
    </filter>
    <filter id="m-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="8"/>
      <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.09 0"/>
    </filter>
    <radialGradient id="m-hill">
      <stop offset="0" stop-color="#c9c09f" stop-opacity=".75"/>
      <stop offset="1" stop-color="#c9c09f" stop-opacity="0"/>
    </radialGradient>
    <pattern id="m-ripple" width="54" height="26" patternUnits="userSpaceOnUse">
      <path d="M6 9 q6 -4 12 0 t12 0" fill="none" stroke="#8ea79b" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M32 22 q5 -3.5 10 0 t10 0" fill="none" stroke="#8ea79b" stroke-width="1" stroke-linecap="round"/>
    </pattern>`;

  const layer = name => el('g', { class: 'm-' + name }, svg);

  // 纸面与园地
  el('rect', { width: 1200, height: 760, fill: '#f1ead8' }, svg);
  const ground = layer('ground');
  el('path', { d: WALL, fill: '#ebe2c8', filter: 'url(#m-rough)' }, ground);
  [[890, 310, 90, 60], [150, 290, 90, 70], [930, 500, 70, 45], [580, 228, 70, 40], [712, 244, 55, 32], [705, 420, 50, 32]]
    .forEach(([cx, cy, rx, ry]) => el('ellipse', { cx, cy, rx, ry, fill: 'url(#m-hill)' }, ground));
  el('ellipse', { cx: 1012, cy: 392, rx: 104, ry: 66, fill: '#e1dfbd', filter: 'url(#m-rough)' }, ground);

  // 园路
  const paths = layer('paths');
  [
    'M985,664 L985,600', 'M985,548 C955,520 930,470 905,420 C885,380 890,330 920,300 C950,270 990,285 1040,290',
    'M1030,560 C1080,520 1100,480 1110,450', 'M905,420 C870,400 850,395 840,392',
    'M840,392 C800,392 760,400 720,404 C690,440 640,446 600,428 C560,418 530,400 518,392',
    'M765,520 C780,545 790,560 790,590', 'M402,408 C425,410 440,412 448,412',
    'M402,408 C380,420 362,445 352,480 C340,530 300,600 248,612', 'M402,408 C390,360 380,300 385,240 C388,190 360,150 340,140'
  ].forEach(d => el('path', { d, fill: 'none', stroke: '#ddd0ad', 'stroke-width': 8, 'stroke-linecap': 'round' }, paths));

  // 水面
  const water = layer('water');
  const waterEls = WATER.map(d => el('path', { d, fill: '#c3d3c9', stroke: '#6f8a7e', 'stroke-width': 1.8, filter: 'url(#m-rough)' }, water));
  WATER.forEach(d => el('path', { d, fill: 'url(#m-ripple)', opacity: .65 }, water));
  const islandEls = ISLANDS.map(d => el('path', { d, fill: '#e6ddc0', stroke: '#6f8a7e', 'stroke-width': 1.6, filter: 'url(#m-rough)' }, water));

  const pt = svg.createSVGPoint();
  const inside = (node, x, y) => { pt.x = x; pt.y = y; return node.isPointInFill(pt); };
  const inWater = (x, y) => waterEls.some(w => inside(w, x, y)) && !islandEls.some(i => inside(i, x, y));
  const wallEl = el('path', { d: WALL, fill: 'none' }, ground);

  // 荷叶
  const lotus = layer('lotus');
  [[600, 320, 60], [700, 320, 50], [560, 160, 40], [760, 180, 40], [470, 360, 30], [290, 300, 24], [230, 520, 22], [1040, 240, 26], [470, 520, 20]]
    .forEach(([cx, cy, r]) => {
      for (let i = 0; i < r * 0.9; i++) {
        const x = cx + (rnd() - .5) * r * 2, y = cy + (rnd() - .5) * r * 1.2;
        if (!inWater(x, y)) continue;
        const s = 3 + rnd() * 4;
        el('circle', { cx: x, cy: y, r: s, fill: pick(['#8fa77f', '#9fb48d', '#7f9870']), stroke: '#5d7253', 'stroke-width': .6, opacity: .9 }, lotus);
      }
    });

  // 桥
  const bridges = layer('bridges');
  const bridge = pts => {
    el('polyline', { points: pts, fill: 'none', stroke: '#6d675a', 'stroke-width': 7, 'stroke-linejoin': 'round' }, bridges);
    el('polyline', { points: pts, fill: 'none', stroke: '#efe7d2', 'stroke-width': 4, 'stroke-linejoin': 'round' }, bridges);
  };
  bridge('525,316 533,332 518,344 531,358 519,376');
  bridge('498,296 480,290 462,302 434,296');
  bridge('640,232 668,238');
  bridge('596,262 602,290 590,312 598,366');
  bridge('250,440 300,446');
  bridge('282,236 250,242');
  // 小飞虹：朱红廊桥
  el('path', { d: 'M436,544 C460,536 490,536 512,544', fill: 'none', stroke: '#7a2e20', 'stroke-width': 9, 'stroke-linecap': 'round' }, bridges);
  el('path', { d: 'M436,544 C460,536 490,536 512,544', fill: 'none', stroke: '#b3402a', 'stroke-width': 5, 'stroke-linecap': 'round' }, bridges);

  // 建筑：hall 厅堂 / ting 亭 / boat 旱船
  const BUILD = [
    ['hall', 985, 590, 78, 42], ['hall', 990, 128, 84, 30], ['hall', 1070, 294, 38, 22], ['ting', 1112, 446, 22], ['ting', 890, 296, 20], ['hall', 1110, 610, 34, 20],
    ['hall', 650, 422, 70, 42], ['hall', 588, 404, 40, 24], ['ting', 525, 300, 20], ['ting', 580, 222, 18], ['ting', 710, 240, 17],
    ['hall', 470, 174, 52, 34], ['ting', 812, 122, 18], ['ting', 706, 418, 16], ['hall', 772, 492, 40, 24], ['ting', 732, 526, 15],
    ['hall', 802, 426, 36, 20], ['hall', 796, 598, 46, 26], ['boat', 472, 482, 24, 62], ['hall', 497, 592, 74, 20],
    ['hall', 240, 596, 70, 42], ['hall', 346, 136, 42, 24], ['ting', 372, 382, 16], ['ting', 152, 290, 20], ['ting', 382, 218, 15], ['hall', 362, 566, 36, 22]
  ];
  const builds = [], buildNodes = [];
  BUILD.forEach(([type, x, y, w, h]) => {
    const g = el('g', { transform: `translate(${x},${y})` });
    if (type === 'ting') {
      const r = w;
      el('ellipse', { cx: 4, cy: r * .55, rx: r * .9, ry: r * .3, fill: '#2f2c22', opacity: .14 }, g);
      el('rect', { x: -r * .5, y: -r * .1, width: r * .12, height: r * .55, fill: '#6b3a2c' }, g);
      el('rect', { x: r * .38, y: -r * .1, width: r * .12, height: r * .55, fill: '#6b3a2c' }, g);
      el('rect', { x: -r * .62, y: r * .42, width: r * 1.24, height: r * .12, fill: '#d9d1bc', stroke: '#6f695c', 'stroke-width': .8 }, g);
      el('path', { d: `M${-r * .95},${-r * .02} Q${-r * .55},${-r * .12} 0,${-r * .8} Q${r * .55},${-r * .12} ${r * .95},${-r * .02} Q0,${-r * .22} ${-r * .95},${-r * .02}Z`, fill: '#5a605a', stroke: '#2a2e2a', 'stroke-width': 1.1 }, g);
      el('circle', { cx: 0, cy: -r * .82, r: 1.6, fill: '#2a2e2a' }, g);
      builds.push([x - r, y - r, x + r, y + r]);
    } else if (type === 'boat') {
      el('path', { d: `M${-w / 2},${-h / 2 + 6} Q0,${-h / 2 - 8} ${w / 2},${-h / 2 + 6} L${w / 2 - 2},${h / 2} L${-w / 2 + 2},${h / 2} Z`, fill: '#d9d1bc', stroke: '#5f594c', 'stroke-width': 1 }, g);
      [[-h / 2 + 6, 12], [-h / 2 + 26, 16], [-h / 2 + 46, 14]].forEach(([yy, hh]) =>
        el('rect', { x: -w / 2 + 3, y: yy, width: w - 6, height: hh, rx: 2, fill: '#5a605a', stroke: '#2a2e2a', 'stroke-width': 1 }, g));
      builds.push([x - w / 2, y - h / 2, x + w / 2, y + h / 2]);
    } else {
      const rh = h * .55;
      el('rect', { x: -w / 2 + 5, y: -h / 2 + 7, width: w, height: h, rx: 2, fill: '#2f2c22', opacity: .13 }, g);
      el('rect', { x: -w / 2 + 3, y: -h / 2 + rh - 3, width: w - 6, height: h - rh + 3, fill: '#f4efe2', stroke: '#6f695c', 'stroke-width': 1 }, g);
      const cols = Math.max(2, Math.round(w / 14));
      for (let i = 1; i < cols; i++) {
        const cx = -w / 2 + 3 + (w - 6) * i / cols;
        el('line', { x1: cx, y1: -h / 2 + rh, x2: cx, y2: h / 2, stroke: '#6b3a2c', 'stroke-width': 1.6 }, g);
      }
      el('path', { d: `M${-w / 2 - 4},${-h / 2 + rh} Q${-w / 2 + 2},${-h / 2 + rh - 3} ${-w / 2 + rh * .7},${-h / 2} L${w / 2 - rh * .7},${-h / 2} Q${w / 2 - 2},${-h / 2 + rh - 3} ${w / 2 + 4},${-h / 2 + rh} Q0,${-h / 2 + rh - 4} ${-w / 2 - 4},${-h / 2 + rh} Z`, fill: '#5a605a', stroke: '#2a2e2a', 'stroke-width': 1.2 }, g);
      el('line', { x1: -w / 2 + rh * .7, y1: -h / 2 + 1, x2: w / 2 - rh * .7, y2: -h / 2 + 1, stroke: '#232723', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      builds.push([x - w / 2, y - h / 2, x + w / 2, y + h / 2]);
    }
    g.dataset.y = y;
    buildNodes.push(g);
  });

  // 缀云峰等叠石
  const rocks = layer('rocks');
  const rock = (x, y, s) => {
    const n = 7, d = [];
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n, rr = s * (.6 + rnd() * .5);
      d.push(`${(x + Math.cos(a) * rr * .8).toFixed(1)},${(y + Math.sin(a) * rr * (i < n / 2 ? .7 : 1.1)).toFixed(1)}`);
    }
    el('polygon', { points: d.join(' '), fill: pick(['#b9b6a8', '#a9a797', '#c7c3b2']), stroke: '#55534a', 'stroke-width': 1 }, rocks);
  };
  [[912, 506, 12], [940, 510, 11], [898, 518, 8], [956, 520, 7], [952, 574, 6], [1020, 574, 6],
   [560, 244, 6], [620, 246, 7], [690, 258, 6], [540, 368, 5], [320, 238, 6], [170, 318, 8], [140, 300, 6], [720, 432, 6]]
    .forEach(r => rock(...r));
  // 缀云峰：上宽下窄的立峰
  el('path', { d: 'M918,508 C914,496 922,488 916,476 C906,466 912,452 926,450 C942,448 952,458 944,470 C938,480 944,494 936,508 Z', fill: '#b3b09f', stroke: '#4a4840', 'stroke-width': 1.3 }, rocks);
  [[924, 462], [934, 474], [926, 490]].forEach(([cx, cy]) => el('ellipse', { cx, cy, rx: 3, ry: 2.2, fill: '#6d6b60' }, rocks));

  // 树：随机撒点，避开水面、建筑、草坪和点位
  const pins = window.SPOTS.map(s => s.pos);
  const trees = [];
  const free = (x, y) => {
    if (!inside(wallEl, x, y) || inWater(x, y)) return false;
    if (Math.hypot((x - 1012) / 104, (y - 392) / 66) < 1) return false;
    if (builds.some(([a, b, c, d]) => x > a - 10 && x < c + 10 && y > b - 16 && y < d + 8)) return false;
    if (pins.some(([px, py]) => Math.hypot(px - x, py - y) < 30)) return false;
    return !trees.some(t => Math.hypot(t[0] - x, t[1] - y) < 19);
  };
  for (let i = 0; i < 4200 && trees.length < 330; i++) {
    const x = 70 + rnd() * 1080, y = 100 + rnd() * 570;
    if (free(x, y)) trees.push([x, y]);
  }
  const greens = ['#7d9076', '#93a386', '#6a7f66', '#a4b08f', '#5d7461', '#8a9a7a'];
  const treeNodes = trees.map(([x, y]) => {
    const g = el('g', {});
    const willow = waterEls.some(w => inside(w, x + 14, y) || inside(w, x - 14, y) || inside(w, x, y + 14));
    if (willow && rnd() < .55) {
      el('ellipse', { cx: x + 3, cy: y + 9, rx: 11, ry: 4, fill: '#2f2c22', opacity: .1 }, g);
      for (let k = -3; k <= 3; k++)
        el('path', { d: `M${x},${y - 12} q${k * 3},6 ${k * 4},${16 + rnd() * 6}`, fill: 'none', stroke: pick(['#8ea773', '#a2b884', '#7c9a66']), 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: x, cy: y - 12, r: 4, fill: '#7c9a66' }, g);
    } else {
      el('ellipse', { cx: x + 4, cy: y + 10, rx: 13, ry: 5, fill: '#2f2c22', opacity: .12 }, g);
      const c = pick(greens), n = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++)
        el('circle', { cx: x + (rnd() - .5) * 16, cy: y + (rnd() - .5) * 12 - 3, r: 6 + rnd() * 6, fill: rnd() < .3 ? pick(greens) : c, stroke: '#44543f', 'stroke-width': .7, 'stroke-opacity': .55 }, g);
      el('circle', { cx: x - 2, cy: y - 6, r: 3, fill: '#fff', opacity: .12 }, g);
    }
    g.dataset.y = y;
    return g;
  });

  // 树与建筑按 y 排序，形成前后遮挡
  const scene = layer('scene');
  treeNodes.concat(buildNodes).sort((a, b) => a.dataset.y - b.dataset.y).forEach(n => scene.appendChild(n));

  // 园墙与内部云墙
  const walls = layer('walls');
  const wall = d => {
    el('path', { d, fill: 'none', stroke: '#3f3d36', 'stroke-width': 7, 'stroke-linejoin': 'round', filter: 'url(#m-rough)' }, walls);
    el('path', { d, fill: 'none', stroke: '#f4efe2', 'stroke-width': 2.4, 'stroke-linejoin': 'round', filter: 'url(#m-rough)' }, walls);
  };
  wall(WALL);
  wall('M400,95 C404,200 396,300 401,390');
  wall('M402,426 C405,520 399,590 404,658');
  wall('M842,92 C838,200 846,300 840,378');
  wall('M840,406 C836,500 842,560 840,618');
  wall('M708,470 C722,452 736,462 750,450 C764,440 780,452 796,444 C810,438 820,450 832,452');
  wall('M708,470 C700,500 712,520 704,548 C730,560 760,552 790,562 C806,566 820,556 836,560');
  // 园门
  el('rect', { x: 966, y: 654, width: 38, height: 22, fill: '#f4efe2', stroke: '#3f3d36', 'stroke-width': 2 }, walls);
  el('path', { d: 'M960,656 Q985,640 1010,656 Z', fill: '#3f3d36' }, walls);

  // 分园名与罗盘
  const labels = layer('labels');
  const text = (x, y, s, size, fill, extra = {}) => {
    const t = el('text', Object.assign({ x, y, 'font-size': size, fill, 'text-anchor': 'middle', 'letter-spacing': size * .3 }, extra), labels);
    t.textContent = s;
    return t;
  };
  text(230, 66, '西园 · 补园', 28, '#3f3d36');
  text(620, 60, '中园', 30, '#3f3d36');
  text(1000, 72, '东园 · 归田园居', 28, '#3f3d36');
  text(985, 718, '入口', 24, '#b3402a');
  const comp = el('g', { transform: 'translate(96,712)' }, labels);
  el('circle', { r: 26, fill: 'none', stroke: '#3f3d36', 'stroke-width': 1.4 }, comp);
  el('path', { d: 'M0,-20 L6,0 L0,20 L-6,0 Z', fill: '#f4efe2', stroke: '#3f3d36', 'stroke-width': 1.2 }, comp);
  el('path', { d: 'M0,-20 L6,0 L-6,0 Z', fill: '#b3402a' }, comp);
  const n = el('text', { x: 0, y: -32, 'font-size': 20, fill: '#3f3d36', 'text-anchor': 'middle' }, comp);
  n.textContent = '北';

  el('rect', { width: 1200, height: 760, filter: 'url(#m-grain)', 'pointer-events': 'none' }, svg);
};
