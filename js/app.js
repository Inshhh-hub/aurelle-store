// App shell: router, header/footer, search, cart drawer, global actions.
import { S, init, on, me, isAdmin, product, price, cat, totals, inr, toggleWish, isWished, setQty, removeLine, logout, colorOf, subscribe, pushRecent } from './store.js';
import { $, $$, esc, icon, actions, openDrawer, closeDrawer, closeModal, openModal, toast, quickAdd, art, reveal, empty, go } from './ui.js';

const routes = {
  '': () => import('./pages/home.js'), shop: () => import('./pages/shop.js'), product: () => import('./pages/product.js'),
  match: () => import('./pages/match.js'), build: () => import('./pages/build.js'), upload: () => import('./pages/upload.js'),
  wishlist: () => import('./pages/lists.js').then(m => m.wishlistPage), cart: () => import('./pages/lists.js').then(m => m.cartPage),
  checkout: () => import('./pages/checkout.js'), order: () => import('./pages/checkout.js').then(m => m.orderDone),
  login: () => import('./pages/account.js').then(m => m.loginPage), account: () => import('./pages/account.js'),
  track: () => import('./pages/account.js').then(m => m.trackPage), admin: () => import('./pages/admin.js'),
};

let current = null, cleanup = null;

function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { name: parts[0] || '', params: parts.slice(1), query: Object.fromEntries(new URLSearchParams(qs)), raw };
}

async function render() {
  const ctx = parse();
  const loader = routes[ctx.name] || routes[''];
  cleanup?.(); cleanup = null;
  // fresh container each navigation so page-level listeners never pile up
  let root = $('#view'); const fresh = root.cloneNode(false); root.replaceWith(fresh); root = fresh;
  try {
    const mod = await loader();
    const page = mod.default || mod;
    const out = page.render(ctx);
    root.innerHTML = typeof out === 'string' ? out : await out;
    root.className = 'view page-' + (ctx.name || 'home');
    window.scrollTo({ top: 0, behavior: 'instant' });
    cleanup = page.mount?.(root, ctx) || null;
    current = { ...ctx, page };
    reveal(root);
    document.title = (page.title?.(ctx) || (ctx.name ? ctx.name[0].toUpperCase() + ctx.name.slice(1) : 'Home')) + ' · ' + S.settings.brandName;
    root.focus({ preventScroll: true });
  } catch (e) {
    console.error(e);
    root.innerHTML = `<section class="wrap narrow">${empty('Something went wrong', 'This page could not load. Check your connection and try again.', `<a class="btn primary" href="#/">Back to home</a>`)}</section>`;
  }
  syncChrome();
}

/* ---------- chrome (header, footer, bottom bar) ---------- */
const NAV = [['', 'Home'], ['shop', 'Shop'], ['match', 'Find Your Match'], ['build', 'Build Your Outfit'], ['upload', 'Upload & Match']];

function header() {
  const cnt = totals().count, wl = S.wishlist.length, user = me();
  return `<header class="hdr" id="hdr"><div class="wrap hdr-in">
    <button class="icon-btn only-m" data-action="open-menu" aria-label="Menu">${icon('menu')}</button>
    <a class="logo" href="#/" aria-label="${esc(S.settings.brandName)} home"><span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="26" height="26"><path d="M16 5 6 27h5l1.600-4h6.800l1.600 4h5L16 5Zm0 9.500 2.300 5.500h-4.600L16 14.500Z" fill="currentColor"/></svg></span>${esc(S.settings.brandName)}</a>
    <nav class="nav" aria-label="Main">${NAV.map(([h, t]) => `<a href="#/${h}" data-nav="${h}">${t}</a>`).join('')}</nav>
    <div class="hdr-act">
      <button class="icon-btn" data-action="open-search" aria-label="Search (press /)">${icon('search')}</button>
      <a class="icon-btn hide-m" href="#/wishlist" aria-label="Wishlist" data-nav="wishlist">${icon('heart')}${wl ? `<i class="count" id="wl-count">${wl}</i>` : ''}</a>
      <a class="icon-btn" href="#/${user ? 'account' : 'login'}" aria-label="${user ? 'My account' : 'Sign in'}" data-nav="account">${icon('user')}</a>
      <button class="icon-btn" data-action="open-cart" aria-label="Cart, ${cnt} items">${icon('bag')}<i class="count ${cnt ? '' : 'zero'}" id="cart-count">${cnt}</i></button>
    </div></div></header>`;
}
function footer() {
  const s = S.settings;
  return `<footer class="ftr"><div class="wrap ftr-grid">
    <div><a class="logo" href="#/">${esc(s.brandName)}</a><p class="muted">${esc(s.tagline)}</p>
      <div class="social">${[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['x', 'X'], ['youtube', 'YouTube']].map(([k, n]) => `<a href="${esc(s.social[k] || '#')}" target="_blank" rel="noopener" aria-label="${n}" class="soc">${n[0]}</a>`).join('')}</div></div>
    <div><h3>Shop</h3><a href="#/shop">All products</a><a href="#/shop?sort=new">New arrivals</a><a href="#/shop?sale=1">Sale</a><a href="#/wishlist">Wishlist</a></div>
    <div><h3>Discover</h3><a href="#/match">Find Your Match</a><a href="#/build">Build Your Outfit</a><a href="#/upload">Upload & Match</a><a href="#/track">Track your order</a></div>
    <div><h3>Help</h3><a href="#" data-action="info" data-k="shipping">Shipping & delivery</a><a href="#" data-action="info" data-k="returns">Returns & exchanges</a><a href="#" data-action="info" data-k="size">Size guide</a><a href="#/account">My account</a></div>
    <div><h3>Contact</h3><p class="muted">${esc(s.city)}<br><a href="mailto:${esc(s.contactEmail)}">${esc(s.contactEmail)}</a><br>${esc(s.phone)}</p></div>
  </div><div class="wrap ftr-base"><span>© ${new Date().getFullYear()} ${esc(s.brandName)}. All rights reserved.</span><span>Prices in INR, inclusive of taxes.</span></div></footer>`;
}
function bottomBar() {
  const items = [['', 'Home', 'shirt'], ['shop', 'Shop', 'tag'], ['match', 'Match', 'sparkle'], ['build', 'Build', 'layers'], ['cart', 'Cart', 'bag']];
  return `<nav class="tabbar" aria-label="App navigation">${items.map(([h, t, i]) => `<a href="#/${h}" data-nav="${h}">${icon(i, 22)}<span>${t}</span>${h === 'cart' && totals().count ? `<i class="count">${totals().count}</i>` : ''}</a>`).join('')}</nav>`;
}
function syncChrome() {
  const h = $('#hdr-slot'); if (h) h.innerHTML = header();
  const b = $('#tab-slot'); if (b) b.innerHTML = bottomBar();
  const name = current?.name ?? parse().name;
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name || (a.dataset.nav === 'account' && name === 'login')));
  $('#hdr')?.classList.toggle('scrolled', scrollY > 8);
  const admin = name === 'admin';
  document.body.classList.toggle('is-admin', admin);
  if (!$('#ftr-slot').dataset.done) { $('#ftr-slot').innerHTML = footer(); $('#ftr-slot').dataset.done = 1; }
  $('#ftr-slot').hidden = admin;
}

/* ---------- cart drawer ---------- */
function cartBody() {
  const t = totals();
  if (!t.lines.length) return empty('Your cart is empty', 'Add a piece, or build a full outfit and save on the bundle.', `<a class="btn primary" href="#/build" data-action="close-drawer">Build an outfit</a>`);
  const ship = S.settings.shipping;
  const pctFree = Math.min(100, ((t.subtotal - t.couponOff) / ship.freeAbove) * 100);
  return `<div class="ship-bar"><p>${t.toFree > 0 ? `Add <b>${inr(t.toFree)}</b> more for free delivery` : '<b>Free delivery</b> unlocked'}</p><div class="bar"><i style="width:${pctFree}%"></i></div></div>
  <ul class="mini-lines">${t.lines.map(l => l.type === 'item' ? `<li><div class="thumb art">${art(l.p, l.hex)}</div><div class="grow"><a href="#/product/${l.p.id}" data-action="close-drawer"><b>${esc(l.p.name)}</b></a><p class="muted sm">${esc(l.color)} · ${esc(l.size)}</p>
    <div class="row between"><div class="stepper sm"><button data-action="qty" data-id="${l.id}" data-d="-1" aria-label="Fewer">${icon('minus', 14)}</button><output>${l.qty}</output><button data-action="qty" data-id="${l.id}" data-d="1" aria-label="More">${icon('plus', 14)}</button></div><b>${inr(l.unit * l.qty)}</b></div></div>
    <button class="icon-btn sm" data-action="rm-line" data-id="${l.id}" aria-label="Remove">${icon('close', 16)}</button></li>`
    : `<li class="bundle"><div class="thumb-stack">${l.parts.map(i => `<div class="art">${art(i.p, i.hex)}</div>`).join('')}</div><div class="grow"><b>${esc(l.name)}</b><p class="muted sm">${l.parts.length} pieces · saved ${inr(l.discount)}</p>
    <div class="row between"><div class="stepper sm"><button data-action="qty" data-id="${l.id}" data-d="-1" aria-label="Fewer">${icon('minus', 14)}</button><output>${l.qty}</output><button data-action="qty" data-id="${l.id}" data-d="1" aria-label="More">${icon('plus', 14)}</button></div><span><s class="muted">${inr(l.original * l.qty)}</s> <b>${inr(l.unit * l.qty)}</b></span></div></div>
    <button class="icon-btn sm" data-action="rm-line" data-id="${l.id}" aria-label="Remove">${icon('close', 16)}</button></li>`).join('')}</ul>
  <div class="drawer-f">${t.bundleSave ? `<div class="row between save"><span>Outfit bundle savings</span><b>−${inr(t.bundleSave)}</b></div>` : ''}<div class="row between"><span>Subtotal</span><b>${inr(t.subtotal)}</b></div><p class="muted sm">Shipping and coupons are applied at checkout.</p>
  <a class="btn primary block" href="#/checkout" data-action="close-drawer">Checkout</a><a class="btn ghost block" href="#/cart" data-action="close-drawer">View cart</a></div>`;
}
function openCart() { openDrawer(cartBody(), { title: `Your cart (${totals().count})` }); }
function refreshCartDrawer() {
  const d = $('#drawer .drawer-b'); if (!d || $('#drawer .drawer-h h2')?.textContent.indexOf('cart') < 0) return;
  d.innerHTML = cartBody(); $('#drawer .drawer-h h2').textContent = `Your cart (${totals().count})`;
}

/* ---------- search ---------- */
function searchHits(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  return S.products.filter(p => [p.name, cat(p.category)?.name, ...(p.tags || []), ...p.colors.map(c => c.name), p.fabric].join(' ').toLowerCase().includes(q)).slice(0, 6);
}
function openSearch() {
  const el = openModal(`<div class="search"><div class="search-in">${icon('search')}<input id="q" type="search" placeholder="Search tees, jeans, linen, olive…" autocomplete="off" aria-label="Search products"></div>
    <div class="search-res" id="sres"><p class="muted">Try “linen”, “navy” or “shoes”. Press Enter to see every result.</p></div></div>`, { cls: 'search-modal' });
  const input = el.querySelector('#q'), res = el.querySelector('#sres');
  const draw = () => {
    const q = input.value, hits = searchHits(q);
    res.innerHTML = !q ? '<p class="muted">Try “linen”, “navy” or “shoes”. Press Enter to see every result.</p>'
      : hits.length ? hits.map(p => `<a class="hit" href="#/product/${p.id}" data-action="close-modal"><div class="art">${art(p, p.colors[0].hex)}</div><div><b>${esc(p.name)}</b><p class="muted sm">${esc(cat(p.category)?.name || '')} · ${inr(price(p))}</p></div></a>`).join('') + `<a class="link" href="#/shop?q=${encodeURIComponent(q)}" data-action="close-modal">See all results for “${esc(q)}”</a>`
        : `<p class="muted">Nothing matches “${esc(q)}”. Try a colour, a category or a fabric.</p>`;
  };
  input.addEventListener('input', draw);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && input.value.trim()) { closeModal(); go('/shop?q=' + encodeURIComponent(input.value.trim())); } });
}

const INFO = {
  shipping: ['Shipping & delivery', () => `<p>Standard delivery takes 4–6 working days across India. Express delivery (+${inr(S.settings.shipping.expressExtra)}) arrives in 2–3 days in metro cities.</p><p>Orders above ${inr(S.settings.shipping.freeAbove)} ship free. Otherwise shipping is ${inr(S.settings.shipping.flat)}.</p>`],
  returns: ['Returns & exchanges', () => '<p>Not quite right? Return or exchange unworn items with tags within 7 days of delivery. Refunds go back to your original payment method within 5–7 working days.</p>'],
  size: ['Size guide', () => `<table class="tbl"><thead><tr><th>Size</th><th>Chest (in)</th><th>Waist (in)</th></tr></thead><tbody>${[['S', 36, 30], ['M', 38, 32], ['L', 40, 34], ['XL', 42, 36], ['XXL', 44, 38]].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table><p class="muted">Between sizes? Size up for a relaxed fit. Shoe sizes are UK.</p>`],
};

/* ---------- global actions ---------- */
function bindActions() {
  Object.assign(actions, {
    'close-modal': () => closeModal(), 'close-drawer': () => closeDrawer(),
    'open-cart': openCart, 'open-search': openSearch,
    'open-menu': () => openDrawer(`<nav class="m-nav">${[...NAV, ['wishlist', 'Wishlist'], ['cart', 'Cart'], [me() ? 'account' : 'login', 'My Account'], ...(isAdmin() ? [['admin', 'Admin dashboard']] : [])].map(([h, t]) => `<a href="#/${h}" data-action="close-drawer">${t}</a>`).join('')}</nav>`, { side: 'left', title: S.settings.brandName }),
    wish: el => {
      const id = el.dataset.id, now = toggleWish(id);
      toast(now ? 'Saved to your wishlist' : 'Removed from your wishlist');
      $$(`.wish[data-id="${id}"]`).forEach(b => { b.classList.toggle('on', now); b.setAttribute('aria-pressed', now); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
      if (current?.name === 'wishlist' && !now) render();
    },
    quick: el => quickAdd(el.dataset.id, el.dataset.color),
    'card-color': (el, e) => {
      const card = el.closest('.card'), p = product(el.dataset.id); if (!card || !p) return;
      const c = colorOf(p, el.dataset.color);
      card.querySelector('.art').innerHTML = art(p, c.hex);
      if (e.type === 'click') {
        $$('.sw', card).forEach(s => { s.classList.toggle('on', s === el); s.setAttribute('aria-pressed', s === el); });
        $$('a[href^="#/product"]', card).forEach(a => { a.href = `#/product/${p.id}?c=${encodeURIComponent(c.name)}`; });
        const q = card.querySelector('.quick'); if (q) q.dataset.color = c.name;
      }
    },
    qty: el => { const l = S.cart.find(x => x.id === el.dataset.id); if (!l) return; const r = setQty(l.id, l.qty + +el.dataset.d); if (r && r.ok === false && r.msg) toast(r.msg, 'err'); },
    'rm-line': el => { removeLine(el.dataset.id); toast('Removed from cart'); },
    info: el => { const [t, f] = INFO[el.dataset.k]; openModal(`<h2>${t}</h2><div class="prose">${f()}</div>`); },
    logout: () => { logout(); toast('Signed out'); go('/'); },
  });
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const fn = actions[el.dataset.action]; if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    if (el.dataset.action === 'card-color') e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-action="card-color"]');
    if (el && matchMedia('(hover:hover)').matches) actions['card-color'](el, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  // newsletter form, anywhere
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-newsletter]'); if (!f) return;
    e.preventDefault();
    const em = f.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { f.email.setCustomValidity('Enter a valid email'); f.email.reportValidity(); return; }
    subscribe(em); f.innerHTML = `<p class="ok-line">${icon('check')} You're in. Look out for a welcome code soon.</p>`;
  });
  document.addEventListener('input', e => e.target.setCustomValidity?.(''));
  addEventListener('scroll', () => $('#hdr')?.classList.toggle('scrolled', scrollY > 8), { passive: true });
  addEventListener('storage-error', () => toast('Browser storage is full. Remove some product photos or reset sample data.', 'err'));
}

/* ---------- boot ---------- */
(async function boot() {
  await init();
  bindActions();
  on(() => {
    const h = $('#hdr-slot'); if (h) { h.innerHTML = header(); }
    const b = $('#tab-slot'); if (b) b.innerHTML = bottomBar();
    const name = current?.name; $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
    refreshCartDrawer();
  });
  addEventListener('hashchange', () => { closeDrawer(true); closeModal(true); render(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(() => {});
  await render();
  $('#boot')?.remove();
})();
