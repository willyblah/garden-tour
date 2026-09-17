// 滚动即行走：地图钉屏放大，镜头跟着猫沿园路走过八站，走完拉远，放行到结尾
window.initTour = function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const SPOTS = window.SPOTS, ROUTE = window.ROUTE;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tour = $('tour'), stage = $('tourStage'), world = $('tourWorld');
  const actors = $('tourActors'), panel = $('tourPanel'), bubble = $('tourBubble');
  const title = $('tourTitle'), hint = $('tourHint'), dotsBar = $('tourDots');
  const mini = $('tourMini');

  const W = 1200, H = 760;
  const CAM_TRAVEL = 500, CAM_STAY = 390;   // 镜头宽度（世界单位），越小越近
  const CAT_SCALE = window.CAT_SCALE;
  const LEN = { in: .7, go: .8, stay: .55, out: .8 };  // 各阶段占几个屏高

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
  const ease = t => t * t * (3 - 2 * t);
  const band = (t, a, b) => ease(clamp01((t - a) / (b - a)));

  /* ---------- 路线 ---------- */
  function spline(pts) {
    const p = [pts[0], ...pts, pts[pts.length - 1]];
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < p.length - 2; i++) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2];
      d += ` C${(x1 + (x2 - x0) / 6).toFixed(2)},${(y1 + (y2 - y0) / 6).toFixed(2)}` +
           ` ${(x2 - (x3 - x1) / 6).toFixed(2)},${(y2 - (y3 - y1) / 6).toFixed(2)}` +
           ` ${x2.toFixed(2)},${y2.toFixed(2)}`;
    }
    return d;
  }

  const trace = el('g', { class: 'tour-trace' }, actors);
  const legs = [];
  let prevEnd = null;
  ROUTE.forEach(leg => {
    const pts = prevEnd ? [prevEnd, ...leg] : leg.slice();
    const d = spline(pts);
    el('path', { d, class: 'trace-ghost', 'vector-effect': 'non-scaling-stroke' }, trace);
    const solid = el('path', { d, class: 'trace-done', 'vector-effect': 'non-scaling-stroke' }, trace);
    const probe = el('path', { d, fill: 'none', stroke: 'none' }, trace);
    const L = probe.getTotalLength();
    solid.style.strokeDasharray = L;
    solid.style.strokeDashoffset = L;
    legs.push({ probe, solid, L });
    prevEnd = leg[leg.length - 1];
  });

  /* ---------- 点位 ---------- */
  const pinLayer = el('g', {}, actors);
  const pins = SPOTS.map((s, i) => {
    const g = el('g', { class: 'tour-pin' }, pinLayer);
    el('circle', { class: 'pin-halo', r: 20 }, g);
    el('circle', { class: 'pin-dot', r: 11 }, g);
    const n = el('text', { class: 'pin-num', y: 4 }, g);
    n.textContent = i + 1;
    const t = el('text', { class: 'pin-name', y: -20 }, g);
    t.textContent = s.name;
    return g;
  });

  /* ---------- 猫 ---------- */
  const cat = window.createCat();
  actors.appendChild(cat.node);

  /* ---------- 时间轴 ---------- */
  const plan = [{ type: 'in', len: LEN.in }];
  SPOTS.forEach((_, i) => {
    plan.push({ type: 'go', i, len: LEN.go });
    plan.push({ type: 'stay', i, len: LEN.stay });
  });
  plan.push({ type: 'out', len: LEN.out });
  let acc = 0;
  plan.forEach(s => { s.at = acc; acc += s.len; });
  const TOTAL = acc;
  tour.style.height = (TOTAL + 1) * 100 + 'vh';

  const stayTop = i => {
    const s = plan.find(p => p.type === 'stay' && p.i === i);
    return tour.offsetTop + s.at * window.innerHeight;
  };

  /* ---------- 面板 ---------- */
  let shownStation = -1, photoIdx = 0;
  function renderPanel(i) {
    if (i === shownStation) return;
    shownStation = i;
    photoIdx = 0;
    const s = SPOTS[i];
    panel.innerHTML = `
      <p class="tp-meta"><span class="tp-num">${String(i + 1).padStart(2, '0')}</span><span class="tp-area">${s.area}</span></p>
      <h3 class="tp-name">${s.name}</h3>
      <p class="tp-tag">${s.tagline}</p>
      <figure class="tp-shot"><img id="tpImg" src="img/lg/${s.photos[0].file}" alt="${s.name}：${s.photos[0].cap}">
        <figcaption id="tpCap">${s.photos[0].cap}</figcaption></figure>
      ${s.photos.length > 1 ? `<div class="tp-thumbs">${s.photos.map((p, k) =>
        `<button type="button" data-k="${k}" class="${k ? '' : 'on'}" aria-label="${p.cap}"><img src="img/sm/${p.file}" alt=""></button>`).join('')}</div>` : ''}
      <div class="tp-desc">${s.desc.map(p => `<p>${p}</p>`).join('')}</div>
      <blockquote class="tp-quote"><p>${s.quote.text}</p><cite>${s.quote.src}</cite></blockquote>
      <p class="tp-tip"><b>怎么看</b>${s.tip}</p>`;
    panel.querySelectorAll('.tp-thumbs button').forEach(b =>
      b.addEventListener('click', () => setPhoto(+b.dataset.k)));
    bubble.firstElementChild.textContent = s.cat;
    pins.forEach((p, k) => p.classList.toggle('current', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    miniDots.forEach((d, k) => d.classList.toggle('on', k <= i));
  }

  // 面板与放大层共用同一张当前照片
  function setPhoto(k) {
    const photos = SPOTS[shownStation].photos;
    photoIdx = (k + photos.length) % photos.length;
    const p = photos[photoIdx];
    const img = $('tpImg');
    img.src = `img/lg/${p.file}`;
    img.alt = `${SPOTS[shownStation].name}：${p.cap}`;
    $('tpCap').textContent = p.cap;
    panel.querySelectorAll('.tp-thumbs button').forEach(b => b.classList.toggle('on', +b.dataset.k === photoIdx));
    if (!box.hidden) {
      boxImg.src = `img/lg/${p.file}`;
      boxImg.alt = img.alt;
      boxCap.textContent = photos.length > 1 ? `${p.cap}　${photoIdx + 1} / ${photos.length}` : p.cap;
    }
  }

  /* ---------- 点开看大图 ---------- */
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.innerHTML = `<button class="box-close" type="button" aria-label="关闭">&times;</button>
    <button class="box-nav prev" type="button" aria-label="上一张">&lsaquo;</button>
    <button class="box-nav next" type="button" aria-label="下一张">&rsaquo;</button>
    <figure><img alt=""><figcaption></figcaption></figure>`;
  document.body.appendChild(box);
  const boxImg = box.querySelector('img'), boxCap = box.querySelector('figcaption');

  function openBox() {
    if (shownStation < 0) return;
    const multi = SPOTS[shownStation].photos.length > 1;
    box.querySelectorAll('.box-nav').forEach(b => { b.hidden = !multi; });
    box.hidden = false;
    setPhoto(photoIdx);
    box.querySelector('.box-close').focus();
  }
  const closeBox = () => { box.hidden = true; };

  panel.addEventListener('click', e => { if (e.target.closest('.tp-shot')) openBox(); });
  box.addEventListener('click', e => {
    if (e.target.closest('.box-nav.prev')) setPhoto(photoIdx - 1);
    else if (e.target.closest('.box-nav.next')) setPhoto(photoIdx + 1);
    else closeBox();
  });
  // 打开时锁住滚动，否则背后的游园会跟着走
  addEventListener('wheel', e => { if (!box.hidden) e.preventDefault(); }, { passive: false });

  /* ---------- 快捷条与小地图 ---------- */
  const dots = SPOTS.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tour-dot';
    b.innerHTML = `<i>${i + 1}</i><em>${s.name}</em>`;
    b.addEventListener('click', () => window.scrollTo({ top: stayTop(i), behavior: 'smooth' }));
    dotsBar.appendChild(b);
    return b;
  });

  const miniSvg = $('gardenMap').cloneNode(true);
  miniSvg.removeAttribute('id');
  miniSvg.setAttribute('aria-hidden', 'true');
  mini.prepend(miniSvg);
  const miniDots = SPOTS.map(s => {
    const d = document.createElement('span');
    d.className = 'mini-dot';
    d.style.left = s.pos[0] / W * 100 + '%';
    d.style.top = s.pos[1] / H * 100 + '%';
    mini.appendChild(d);
    return d;
  });
  const miniCat = document.createElement('span');
  miniCat.className = 'mini-cat';
  mini.appendChild(miniCat);

  /* ---------- 主循环 ---------- */
  let dir = -1, facing = -1, lastMove = performance.now(), lastScrolled = -1, speed = 0, live = false;

  new IntersectionObserver(([e]) => { live = e.isIntersecting; }, { rootMargin: '100px' }).observe(tour);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!live) return;

    const vw = stage.clientWidth, vh = stage.clientHeight;
    const scrolled = Math.max(0, Math.min(TOTAL * vh, -tour.getBoundingClientRect().top));
    const u = scrolled / vh;

    if (lastScrolled < 0) lastScrolled = scrolled;
    const delta = Math.abs(scrolled - lastScrolled);
    if (delta > .6) lastMove = now;
    speed = lerp(speed, Math.min(1, delta / 26), .2);
    lastScrolled = scrolled;
    const idle = (now - lastMove) / 1000;

    let seg = plan[0];
    for (const s of plan) if (u >= s.at) seg = s;
    const p = clamp01((u - seg.at) / seg.len);

    // 猫在世界里的位置
    let cx, cy, tx = 1, ty = 0, station = seg.i != null ? seg.i : (seg.type === 'in' ? 0 : SPOTS.length - 1);
    if (seg.type === 'go') {
      const leg = legs[seg.i], at = ease(p) * leg.L;
      const a = leg.probe.getPointAtLength(Math.max(0, at - 2));
      const b = leg.probe.getPointAtLength(Math.min(leg.L, at + 2));
      cx = (a.x + b.x) / 2; cy = (a.y + b.y) / 2;
      tx = b.x - a.x; ty = b.y - a.y;
      const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
      if (Math.abs(tx) > .22) dir = tx > 0 ? 1 : -1;
      leg.solid.style.strokeDashoffset = leg.L * (1 - ease(p));
    } else {
      const done = seg.type === 'in' ? -1 : seg.i != null ? seg.i : SPOTS.length - 1;
      const src = seg.type === 'in' ? legs[0].probe.getPointAtLength(0)
        : legs[done].probe.getPointAtLength(legs[done].L);
      cx = src.x; cy = src.y;
      legs.forEach((l, k) => { l.solid.style.strokeDashoffset = k <= done ? 0 : l.L; });
      if (seg.type === 'stay') {
        const d = SPOTS[seg.i].pos[0] - cx;
        if (Math.abs(d) > 6) dir = d > 0 ? 1 : -1;
      }
    }

    // 姿势
    const pose = seg.type === 'go' && idle < .4 ? 'walk' : idle > 7 ? 'sleep' : 'sit';
    cat.setPose(reduced ? (seg.type === 'go' ? 'walk' : 'sit') : pose);
    facing = lerp(facing, dir, .16);
    const shown = Math.abs(facing) < .07 ? .07 * Math.sign(dir) : facing;
    cat.update(cx, cy, shown, now / 1000, seg.type === 'go' ? Math.max(.15, speed) : 0);

    // 镜头
    const far = seg.type === 'in' ? 1 - ease(p) : seg.type === 'out' ? ease(p) : 0;
    // focus 决定镜头推多近、猫偏屏幕多左。它在站点前后必须连续：
    // 离站时用前 30% 路程慢慢松开，进站时用后 28% 慢慢收紧，否则跨段会瞬移一下
    const focus = seg.type === 'stay' ? 1
      : seg.type === 'out' ? 1 - band(p, 0, .4)
      : seg.type === 'go' ? Math.max(seg.i > 0 ? 1 - band(p, 0, .3) : 0, band(p, .72, 1))
      : 0;
    const camW = lerp(lerp(CAM_TRAVEL, CAM_STAY, focus), Math.max(W, H * vw / vh) / .9, far);
    const k = vw / camW;
    const lead = 34 * (1 - focus) * (1 - far);
    const ax = lerp(lerp(.5, .34, focus), .5, far);
    const ay = lerp(.54, .5, far);
    const ccx = lerp(cx + tx * lead, W / 2, far);
    const ccy = lerp(cy + ty * lead, H / 2, far);
    // 镜头夹在园子范围内，避免越过园墙露出底色
    const fit = (want, span, view) => k * span <= view
      ? (view - k * span) / 2
      : Math.min(0, Math.max(view - k * span, want));
    const ox = fit(ax * vw - k * ccx, W, vw), oy = fit(ay * vh - k * ccy, H, vh);
    world.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) scale(${k.toFixed(4)})`;

    // 点位随镜头反向缩放，保持屏幕尺寸恒定
    const inv = (1 / k).toFixed(4);
    pins.forEach((g, i) => {
      g.setAttribute('transform', `translate(${SPOTS[i].pos[0]},${SPOTS[i].pos[1]}) scale(${inv})`);
      g.classList.toggle('far', far > .5);
    });

    // 面板与气泡
    const on = seg.type === 'stay' || (seg.type === 'go' && p > .8);
    if (on) renderPanel(station);
    stage.classList.toggle('panel-on', on);
    stage.classList.toggle('is-far', far > .55);
    // 气泡浮在猫头顶正上方，并夹在屏幕内
    const bx = ox + k * cx, by = oy + k * cy;
    const bubbleX = Math.max(170, Math.min(vw - 170, bx));
    bubble.style.transform = `translate(${bubbleX.toFixed(0)}px,${(by - 34 * CAT_SCALE * k - 14).toFixed(0)}px)`;
    bubble.classList.toggle('on', on && focus > .9 && idle < 7);

    title.style.opacity = seg.type === 'in' ? (1 - band(p, .1, .55)) : 0;
    hint.style.opacity = u < .35 ? 1 : seg.type === 'out' ? band(p, .3, .7) : 0;
    hint.textContent = seg.type === 'out' ? '再往下，去见园子真正的主人' : '继续下滚，跟着它走';

    miniCat.style.left = cx / W * 100 + '%';
    miniCat.style.top = cy / H * 100 + '%';
  }
  requestAnimationFrame(frame);

  // 键盘：左右方向键跳站，方便演示（只在地图钉住屏幕时生效）
  const pinned = () => tour.getBoundingClientRect().top <= 0 &&
    tour.getBoundingClientRect().bottom > window.innerHeight;
  document.addEventListener('keydown', e => {
    if (!box.hidden) {
      if (e.key === 'Escape') closeBox();
      else if (e.key === 'ArrowLeft') setPhoto(photoIdx - 1);
      else if (e.key === 'ArrowRight') setPhoto(photoIdx + 1);
      else return;
      e.preventDefault();
      return;
    }
    if (!pinned() || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    const n = SPOTS.length;
    const i = Math.max(0, Math.min(n - 1, shownStation + (e.key === 'ArrowRight' ? 1 : -1)));
    e.preventDefault();
    window.scrollTo({ top: stayTop(i), behavior: 'smooth' });
  });

  return { stayTop, count: SPOTS.length };
};
