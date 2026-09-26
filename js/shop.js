(function () {
  const $ = id => document.getElementById(id);
  const { url, anonKey } = window.SUPABASE_CONFIG;
  const sb = supabase.createClient(url, anonKey);

  let user = null;
  let current = null;      // 详情里正在看的商品
  let pendingOrder = false; // 点了下单但还没登录，登录后接着下
  let mode = 'login';

  const price = p => '¥' + Number(p.price).toFixed(2);

  // 商品列表
  async function loadGoods() {
    const { data, error } = await sb.from('products').select('*').order('sort');
    if (error) {
      $('shopStatus').textContent = '货架暂时没搬出来，请稍后刷新再试。';
      return;
    }
    $('shopStatus').hidden = true;
    $('goods').replaceChildren(...data.map(p => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'good';
      const img = document.createElement('img');
      img.src = p.image;
      img.alt = p.name;
      img.loading = 'lazy';
      const name = document.createElement('h3');
      name.textContent = p.name;
      const pr = document.createElement('p');
      pr.textContent = price(p);
      card.append(img, name, pr);
      card.addEventListener('click', () => openItem(p));
      return card;
    }));
  }

  function openItem(p) {
    current = p;
    $('itemImg').src = p.image;
    $('itemImg').alt = p.name;
    $('itemName').textContent = p.name;
    $('itemPrice').textContent = price(p);
    $('itemDesc').textContent = p.description;
    $('orderMsg').textContent = '';
    $('itemModal').showModal();
  }

  // 付款还没做：登录后下单一律缺货
  function placeOrder() {
    if (!user) {
      pendingOrder = true;
      openAuth('login', '下单前请先登录。');
      return;
    }
    $('orderMsg').textContent = '此商品暂时缺货，请稍后再试';
  }
  $('orderBtn').addEventListener('click', placeOrder);

  // 账号
  function setUser(u) {
    user = u;
    $('loginBtn').hidden = !!u;
    $('who').hidden = !u;
    $('whoEmail').textContent = u ? u.email : '';
  }
  sb.auth.onAuthStateChange((_event, session) => setUser(session ? session.user : null));

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.auth-tabs [data-mode]').forEach(b =>
      b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    $('authSubmit').textContent = m === 'login' ? '登录' : '注册';
    $('authForm').password.autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('authMsg').textContent = '';
  }
  function openAuth(m, tip) {
    setMode(m);
    $('authTip').textContent = tip;
    $('authModal').showModal();
  }
  document.querySelectorAll('.auth-tabs [data-mode]').forEach(b =>
    b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('loginBtn').addEventListener('click', () => openAuth('login', '用邮箱登录或注册。'));
  $('logoutBtn').addEventListener('click', () => sb.auth.signOut());
  $('authModal').addEventListener('close', () => { pendingOrder = false; });

  const ERRORS = {
    invalid_credentials: '邮箱或密码不对。',
    user_already_exists: '这个邮箱已经注册过了，直接登录吧。',
    email_not_confirmed: '邮箱还没确认，请先去邮箱点确认链接。',
    weak_password: '密码太简单了，换一个长一点的。',
    over_email_send_rate_limit: '发信太频繁了，请过一会儿再试。',
    over_request_rate_limit: '操作太频繁了，请过一会儿再试。'
  };

  $('authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const msg = $('authMsg');
    msg.textContent = '';
    $('authSubmit').disabled = true;

    const { data, error } = mode === 'login'
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.href } });

    $('authSubmit').disabled = false;
    if (error) {
      msg.textContent = ERRORS[error.code] || error.message;
      return;
    }
    if (!data.session) {
      msg.textContent = '注册成功！请到邮箱点确认链接，然后回来登录。';
      return;
    }
    const resume = pendingOrder;
    form.reset();
    $('authModal').close();
    if (resume) placeOrder();
  });

  document.querySelectorAll('.modal').forEach(m => {
    m.querySelector('[data-close]').addEventListener('click', () => m.close());
    // 点遮罩关闭
    m.addEventListener('click', e => { if (e.target === m) m.close(); });
  });

  loadGoods();
})();
