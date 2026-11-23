// Shared UI helpers: icons, toasts, modals, drawers, product card, quick-add.
import { S, price, onSale, inr, totalStock, stockOf, isWished, colorOf, addItem, cat, product } from './store.js';
import { productArt } from './garments.js';

export const actions = {}; // data-action handlers, wired in app.js
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const go = path => { location.hash = path; };

const ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z"/>',
  user: '<circle cx="12" cy="8.500" r="3.500"/><path d="M5 20c.8-3.600 3.600-5.500 7-5.500s6.200 1.900 7 5.500"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', arrowL: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  upload: '<path d="M12 16V5m0 0-4 4m4-4 4 4"/><path d="M5 17v2h14v-2"/>',
  sparkle: '<path d="M12 4v5m0 6v5M4 12h5m6 0h5"/><path d="m7 7 2 2m6 6 2 2m0-10-2 2m-6 6-2 2"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12"/>',
  edit: '<path d="M5 19l1-4L16.500 4.500a2 2 0 0 1 3 3L9 18l-4 1Z"/>',
  shuffle: '<path d="M4 7h3c4 0 5 10 9 10h4m0 0-3-3m3 3-3 3M4 17h3c1.500 0 2.500-1 3.500-2.500M20 7h-4c-1.500 0-2.500 1-3.500 2.500M20 7l-3-3m3 3-3 3"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="17" cy="17.500" r="1.800"/>',
  star: '<path d="m12 4 2.400 5 5.500.8-4 3.900.9 5.500-4.800-2.600L7.200 19.200l.9-5.500-4-3.900L9.600 9 12 4Z"/>',
  shirt: '<path d="M8 4 3.500 7l2 4L8 9.500V20h8V9.500l2.500 1.500 2-4L16 4c-.5 1.500-2 2.300-4 2.300S8.500 5.500 8 4Z"/>',
  layers: '<path d="m12 4 9 5-9 5-9-5 9-5Z"/><path d="m3 14 9 5 9-5"/>',
  camera: '<path d="M4 8h3l1.500-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13" r="3.500"/>',
  shield: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  box: '<path d="m4 8 8-4 8 4v8l-8 4-8-4V8Z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
  chart: '<path d="M5 19V9m5 10V5m5 14v-7m5 7H3"/>', users: '<circle cx="9" cy="9" r="3"/><path d="M3.500 19c.7-3 3-4.500 5.500-4.500s4.800 1.500 5.500 4.500M16 6.500a3 3 0 0 1 0 5.500M17 14.700c2 .5 3.200 2 3.600 4.300"/>',
  tag: '<path d="M4 4h8l8 8-8 8-8-8V4Z"/><circle cx="8.500" cy="8.500" r="1.200"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>',
  eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12Z"/><circle cx="12" cy="12" r="2.800"/>',
  info: '<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5M12 8v.1"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
};
export const icon = (n, s = 20) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- toast ---------- */
export function toast(msg, kind = 'ok') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = `${icon(kind === 'err' ? 'info' : 'check', 18)}<span>${esc(msg)}</span>`;
  box.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 3200);
}

/* ---------- modal + drawer ---------- */
let lastFocus = null;
export function openModal(html, { wide = false, cls = '' } = {}) {
  closeModal(true);
  lastFocus = document.activeElement;
  const el = document.createElement('div');
  el.className = 'overlay'; el.id = 'modal';
  el.innerHTML = `<div class="modal ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true"><button class="x" data-action="close-modal" aria-label="Close">${icon('close')}</button>${html}</div>`;
  document.body.append(el);
  document.body.classList.add('lock');
  requestAnimationFrame(() => el.classList.add('open'));
  el.addEventListener('mousedown', e => { if (e.target === el) closeModal(); });
  const f = el.querySelector('input,select,textarea,button:not(.x)'); f?.focus({ preventScroll: true });
  return el;
}
export function closeModal(quick = false) {
  const el = $('#modal'); if (!el) return;
  el.classList.remove('open');
  const rm = () => { el.remove(); if (!$('#drawer') && !$('#modal')) document.body.classList.remove('lock'); };
  quick ? rm() : setTimeout(rm, 220);
  lastFocus?.focus?.({ preventScroll: true });
}
export function openDrawer(html, { side = 'right', title = '' } = {}) {
  closeDrawer(true);
  const el = document.createElement('div');
  el.className = 'overlay drawer-wrap ' + side; el.id = 'drawer';
  el.innerHTML = `<aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="drawer-h"><h2>${esc(title)}</h2><button class="icon-btn" data-action="close-drawer" aria-label="Close">${icon('close')}</button></header><div class="drawer-b">${html}</div></aside>`;
  document.body.append(el); document.body.classList.add('lock');
  requestAnimationFrame(() => el.classList.add('open'));
  el.addEventListener('mousedown', e => { if (e.target === el) closeDrawer(); });
  return el;
}
export function closeDrawer(quick = false) {
  const el = $('#drawer'); if (!el) return;
  el.classList.remove('open');
  const rm = () => { el.remove(); if (!$('#modal')) document.body.classList.remove('lock'); };
  quick ? rm() : setTimeout(rm, 260);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });

/* ---------- number tween ---------- */
export function tween(el, to, { fmt = inr, ms = 450 } = {}) {
  if (!el) return;
  const from = +el.dataset.v || 0; el.dataset.v = to;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- product visuals ---------- */
export function art(p, hex, view = 0) {
  if (p.images?.length) return `<img src="${p.images[Math.min(view, p.images.length - 1)]}" alt="${esc(p.name)}" loading="lazy" draggable="false">`;
  return productArt(p, hex || p.colors[0]?.hex || '#999', { view, cats: S.categories });
}
export const stars = r => `<span class="stars" aria-label="${r.toFixed(1)} out of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${r >= i - 0.25 ? 'on' : ''}">${icon('star', 13)}</i>`).join('')}</span>`;
export const swatch = (c, { on = false, attrs = '', size = 'md' } = {}) => `<button type="button" class="sw ${size} ${on ? 'on' : ''}" style="--c:${c.hex}" title="${esc(c.name)}" aria-label="${esc(c.name)}" aria-pressed="${on}" ${attrs}></button>`;

export function stockLabel(p, size) {
  const n = size ? stockOf(p, size) : totalStock(p);
  if (n <= 0) return `<span class="stock out">Sold out</span>`;
  if (n <= 5) return `<span class="stock low">Only ${n} left</span>`;
  return `<span class="stock ok">In stock</span>`;
}

export function productCard(p, { color = null, match = null, small = false } = {}) {
  const c = color ? colorOf(p, color) : p.colors[0];
  const sold = totalStock(p) <= 0;
  const off = onSale(p) ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const badges = [sold ? '<span class="badge dark">Sold out</span>' : '', !sold && off ? `<span class="badge">${off}% off</span>` : '', !sold && !off && p.isNew ? '<span class="badge soft">New</span>' : ''].join('');
  return `<article class="card ${small ? 'sm' : ''}" data-id="${p.id}">
    <div class="card-top"><a class="card-media" href="#/product/${p.id}?c=${encodeURIComponent(c.name)}" aria-label="${esc(p.name)}"><div class="art">${art(p, c.hex)}</div></a>
    <div class="badges">${badges}</div>
    <button class="wish ${isWished(p.id) ? 'on' : ''}" data-action="wish" data-id="${p.id}" aria-pressed="${isWished(p.id)}" aria-label="Add ${esc(p.name)} to wishlist">${icon('heart', 18)}</button>
    ${match != null ? `<span class="match-pill" title="How well this goes with your pick">${match}% match</span>` : ''}
    ${sold ? '' : `<button class="quick" data-action="quick" data-id="${p.id}" data-color="${esc(c.name)}">Quick add</button>`}</div>
    <div class="card-body">
      <a class="name" href="#/product/${p.id}?c=${encodeURIComponent(c.name)}">${esc(p.name)}</a>
      <div class="price"><b>${inr(price(p))}</b>${onSale(p) ? `<s>${inr(p.price)}</s>` : ''}</div>
      <div class="sws">${p.colors.slice(0, 5).map(x => swatch(x, { on: x.name === c.name, size: 'sm', attrs: `data-action="card-color" data-id="${p.id}" data-color="${esc(x.name)}"` })).join('')}${p.colors.length > 5 ? `<span class="more">+${p.colors.length - 5}</span>` : ''}</div>
    </div>
  </article>`;
}

/* ---------- quick add (size picker) ---------- */
export function quickAdd(id, colorName, { onAdded, title = 'Add to cart' } = {}) {
  const p = product(id); if (!p) return;
  let color = colorName || p.colors[0].name, size = p.sizes.length === 1 && stockOf(p, p.sizes[0]) > 0 ? p.sizes[0] : '', qty = 1;
  const el = openModal('', { cls: 'quick-modal' });
  const body = el.querySelector('.modal');
  const draw = () => {
    const c = colorOf(p, color);
    body.querySelector('.qa')?.remove();
    body.insertAdjacentHTML('beforeend', `<div class="qa"><div class="qa-art art">${art(p, c.hex)}</div><div class="qa-info">
      <h2>${esc(p.name)}</h2><div class="price"><b>${inr(price(p))}</b>${onSale(p) ? `<s>${inr(p.price)}</s>` : ''}</div>
      <p class="lbl">Colour: <b>${esc(c.name)}</b></p><div class="sws">${p.colors.map(x => swatch(x, { on: x.name === color, attrs: `data-qa-color="${esc(x.name)}"` })).join('')}</div>
      <p class="lbl">Size ${size ? `<b>${esc(size)}</b>` : ''}</p><div class="chips">${p.sizes.map(s => `<button type="button" class="chip ${s === size ? 'on' : ''}" ${stockOf(p, s) <= 0 ? 'disabled' : ''} data-qa-size="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <p class="hint" id="qa-hint">${size ? stockLabel(p, size) : 'Pick a size to continue'}</p>
      <div class="row"><div class="stepper"><button type="button" data-qa-q="-1" aria-label="Fewer">${icon('minus', 16)}</button><output>${qty}</output><button type="button" data-qa-q="1" aria-label="More">${icon('plus', 16)}</button></div>
      <button class="btn primary grow" data-qa-add>${esc(title)}</button></div>
      <a class="link" href="#/product/${p.id}?c=${encodeURIComponent(color)}" data-action="close-modal">View full details</a></div></div>`);
  };
  draw();
  body.addEventListener('click', e => {
    const t = e.target.closest('[data-qa-color],[data-qa-size],[data-qa-q],[data-qa-add]'); if (!t) return;
    if (t.dataset.qaColor) { color = t.dataset.qaColor; draw(); }
    else if (t.dataset.qaSize) { size = t.dataset.qaSize; qty = Math.min(qty, stockOf(p, size)); draw(); }
    else if (t.dataset.qaQ) { qty = Math.max(1, Math.min(10, qty + +t.dataset.qaQ)); body.querySelector('output').textContent = qty; }
    else if (t.hasAttribute('data-qa-add')) {
      const r = addItem({ productId: id, color, size, qty });
      if (!r.ok) { const h = body.querySelector('#qa-hint'); h.innerHTML = `<span class="stock out">${esc(r.msg)}</span>`; h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake'); return; }
      closeModal(); toast(`${p.name} added to your cart`); bump(); onAdded?.({ color, size, qty });
    }
  });
}
export function bump() { const b = $('#cart-count'); if (!b) return; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }

/* ---------- misc ---------- */
export const empty = (title, text, cta = '') => `<div class="empty"><div class="empty-ico">${icon('bag', 28)}</div><h2>${esc(title)}</h2><p>${esc(text)}</p>${cta}</div>`;
export const catName = id => cat(id)?.name || '';
export const fmtDate = t => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = t => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function reveal(root = document) {
  const els = $$('.reveal:not(.in)', root);
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
  els.forEach(e => io.observe(e));
}

export function imageToDataURL(file, max = 900, q = 0.82) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read that image')); };
    img.src = url;
  });
}
