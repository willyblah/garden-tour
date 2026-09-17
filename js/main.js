(function () {
  const $ = id => document.getElementById(id);
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

  // 常驻猫导游（只在文字章节出没；进了地图，带路的是园子里那只）
  const guide = $('guide'), guideText = $('guideText'), avatar = $('guideAvatar');
  let lastLine = '', hideTimer;
  function setCollapsed(collapsed) {
    guide.classList.toggle('collapsed', collapsed);
    avatar.setAttribute('aria-expanded', String(!collapsed));
  }
  function say(text) {
    if (!text || text === lastLine) return;
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
  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach(a => a.classList.toggle('active', a.hash === '#' + id));
      if (id !== 'map') say(window.CAT_LINES[id]);
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

  // 地图与游园
  window.buildGardenMap($('gardenMap'));
  window.initTour();

  // 钉屏期间收起角落的猫，免得两只猫同时说话
  new IntersectionObserver(([e]) => {
    document.body.classList.toggle('in-tour', e.intersectionRatio > .5);
  }, { threshold: [0, .5, 1] }).observe($('tourStage'));
})();
