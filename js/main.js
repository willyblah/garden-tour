(function () {
  const $ = id => document.getElementById(id);
  const SPOTS = window.SPOTS;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 逐字打出文字；同一元素上新的调用会打断旧的
  const typing = new WeakMap();
  function type(node, text, speed = 45) {
    const token = {};
    typing.set(node, token);
    node.classList.add('typing');
    node.classList.remove('done');
    if (reduced) {
      node.textContent = text;
      node.classList.replace('typing', 'done');
      return Promise.resolve();
    }
    return new Promise(resolve => {
      let i = 0;
      (function step() {
        if (typing.get(node) !== token) return;
        node.textContent = text.slice(0, ++i);
        if (i < text.length) {
          const ch = text[i - 1];
          setTimeout(step, '，。？！——'.includes(ch) ? speed * 4 : speed);
        } else {
          node.classList.replace('typing', 'done');
          resolve();
        }
      })();
    });
  }

  // 开屏自我介绍
  setTimeout(() => type($('heroSay'),
    '喵，你好。我是住在拙政园里的橘猫。这园子五百岁了，主人换了三十多任，猫倒是一直都在。今天本喵带路：先讲来历，再上地图逛八处景点，最后，见见园子真正的主人。', 38), 600);

  // 常驻猫导游
  const guide = $('guide'), guideText = $('guideText'), avatar = $('guideAvatar');
  let lastLine = '', hideTimer;
  function setCollapsed(collapsed) {
    guide.classList.toggle('collapsed', collapsed);
    avatar.setAttribute('aria-expanded', String(!collapsed));
  }
  // 说完一段话后停留一会儿自动收起，避免长时间遮挡正文
  function say(text) {
    if (text === lastLine) return;
    lastLine = text;
    clearTimeout(hideTimer);
    setCollapsed(false);
    avatar.classList.add('talking');
    type(guideText, text, 26).then(() => {
      avatar.classList.remove('talking');
      hideTimer = setTimeout(() => setCollapsed(true), 9000);
    });
  }
  avatar.addEventListener('click', () => {
    clearTimeout(hideTimer);
    setCollapsed(!guide.classList.contains('collapsed'));
  });

  const topbar = document.querySelector('.topbar');
  new IntersectionObserver(([e]) => {
    guide.classList.toggle('show', !e.isIntersecting);
    topbar.classList.toggle('solid', !e.isIntersecting);
  }, { rootMargin: '-80px 0px 0px 0px' }).observe(document.querySelector('.hero'));

  const navLinks = [...document.querySelectorAll('.topbar-links a')];
  let current = null;
  const sectionLine = id => (id === 'map' && current !== null ? SPOTS[current].cat : window.CAT_LINES[id]);
  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach(a => a.classList.toggle('active', a.hash === '#' + id));
      say(sectionLine(id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('[data-cat]').forEach(s => sectionIO.observe(s));

  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(n => revealIO.observe(n));

  // 地图、点位与列表
  const mapSvg = $('gardenMap');
  window.buildGardenMap(mapSvg);
  const pct = ([x, y]) => ({ left: x / 12 + '%', top: y / 7.6 + '%' });

  const pinEls = [], itemEls = [];
  SPOTS.forEach((s, i) => {
    const num = String(i + 1);
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'pin ' + s.label;
    Object.assign(pin.style, pct(s.pos));
    pin.setAttribute('aria-label', `${num}. ${s.name}`);
    pin.innerHTML = `<span class="pin-mark"><span>${num}</span></span><span class="pin-label">${s.name}</span>`;
    $('pins').appendChild(pin);
    pinEls.push(pin);

    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><img src="img/sm/${s.photos[0].file}" alt="" loading="lazy"><span><strong><i>${num}</i>${s.name}</strong><small>${s.tagline}</small></span></button>`;
    $('spotList').appendChild(li);
    itemEls.push(li.firstChild);

    [pin, li.firstChild].forEach(n => {
      n.addEventListener('mouseenter', () => hot(i));
      n.addEventListener('focus', () => hot(i));
      n.addEventListener('mouseleave', () => hot(null));
      n.addEventListener('blur', () => hot(null));
      n.addEventListener('click', () => open(i));
    });
  });

  function hot(i) {
    pinEls.forEach((p, k) => p.classList.toggle('hot', k === i));
    itemEls.forEach((p, k) => p.classList.toggle('hot', k === i));
    if (i !== null) say(`${i + 1} 号，${SPOTS[i].name}——${SPOTS[i].tagline}。点一下，本喵细讲喵。`);
  }

  // 详情页
  const explore = $('map'), detail = $('detail');
  const mini = $('mini');
  const miniMap = mapSvg.cloneNode(true);
  miniMap.removeAttribute('id');
  miniMap.setAttribute('aria-hidden', 'true');
  mini.prepend(miniMap);

  let photoIndex = 0;

  function open(i) {
    current = i;
    const s = SPOTS[i];
    explore.classList.add('is-detail');
    detail.hidden = false;
    detail.style.animation = 'none';
    void detail.offsetWidth;
    detail.style.animation = '';

    $('crumbs').textContent = `拙政园 › ${s.area} › ${s.name}`;
    $('detailCount').textContent = `${String(i + 1).padStart(2, '0')} / ${String(SPOTS.length).padStart(2, '0')}`;
    $('dArea').textContent = s.area;
    $('dName').textContent = s.name;
    $('dTagline').textContent = s.tagline;
    $('dDesc').innerHTML = s.desc.map(p => `<p>${p}</p>`).join('');
    $('dQuote').textContent = s.quote.text;
    $('dQuoteSrc').textContent = s.quote.src;
    $('dTip').textContent = s.tip;
    Object.assign($('miniPin').style, pct(s.pos));

    $('dThumbs').innerHTML = s.photos.map((p, k) =>
      `<button type="button" aria-label="${p.cap}"><img src="img/sm/${p.file}" alt=""></button>`).join('');
    [...$('dThumbs').children].forEach((b, k) => b.addEventListener('click', () => showPhoto(k)));
    const multi = s.photos.length > 1;
    $('prevPhoto').hidden = $('nextPhoto').hidden = !multi;
    $('thumbsPanel').hidden = !multi;
    showPhoto(0, true);

    const next = SPOTS[i + 1];
    if (next) {
      $('nextLabel').textContent = '下一站推荐';
      $('nextName').textContent = next.name;
      $('nextTag').textContent = next.tagline;
      $('nextThumb').innerHTML = `<img src="img/sm/${next.photos[0].file}" alt="">`;
    } else {
      $('nextLabel').textContent = '终点';
      $('nextName').textContent = '园子真正的主人';
      $('nextTag').textContent = '逛完八处，去见见园猫。';
      $('nextThumb').innerHTML = '<svg viewBox="0 0 100 80"><use href="#catMini"/></svg>';
    }

    say(s.cat);
    detail.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  function showPhoto(k, instant) {
    const photos = SPOTS[current].photos;
    photoIndex = (k + photos.length) % photos.length;
    const p = photos[photoIndex], img = $('dImg');
    const apply = () => {
      img.src = `img/lg/${p.file}`;
      img.alt = `${SPOTS[current].name}：${p.cap}`;
      $('dCap').textContent = p.cap;
      $('dPhotoCount').textContent = photos.length > 1 ? `${photoIndex + 1} / ${photos.length}` : '';
      img.classList.remove('fading');
    };
    [...$('dThumbs').children].forEach((b, n) => b.classList.toggle('on', n === photoIndex));
    if (instant) return apply();
    img.classList.add('fading');
    setTimeout(apply, 300);
    new Image().src = `img/lg/${photos[(photoIndex + 1) % photos.length].file}`;
  }

  function close(target = explore) {
    const last = current;
    current = null;
    detail.hidden = true;
    explore.classList.remove('is-detail');
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    if (target !== explore) return;
    say(window.CAT_LINES.map);
    pinEls[last].classList.add('hot');
    setTimeout(() => pinEls[last].classList.remove('hot'), 2400);
  }

  $('backBtn').addEventListener('click', () => close());
  $('prevPhoto').addEventListener('click', () => showPhoto(photoIndex - 1));
  $('nextPhoto').addEventListener('click', () => showPhoto(photoIndex + 1));
  $('nextCard').addEventListener('click', () => {
    if (current + 1 < SPOTS.length) return open(current + 1);
    close($('owners'));
  });

  document.addEventListener('keydown', e => {
    if (current === null) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') showPhoto(photoIndex - 1);
    else if (e.key === 'ArrowRight') showPhoto(photoIndex + 1);
  });
})();
