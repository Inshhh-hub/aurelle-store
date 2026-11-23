// Single data layer for the whole site.
// PROTOTYPE: data lives in this browser's localStorage so you can test everything with zero setup.
// PRODUCTION: replace the load()/save() functions (and the auth + order functions) with calls to a real
// database + auth service (e.g. Supabase or Firebase). The rest of the UI does not need to change.
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_SETTINGS, SEED_COUPONS, SEED_OUTFITS } from './data.js';

const KEY = 'aurelle:v1';
export const STATUSES = ['Placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
export const S = {};
const listeners = new Set();
export const on = fn => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } });
export const rid = (p = 'id') => p + Math.random().toString(36).slice(2, 9);

// Pure-JS SHA-256 fallback: crypto.subtle only exists on HTTPS/localhost.
function sha256js(str) {
  const m = new TextEncoder().encode(str), l = m.length, K = [], H = [];
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  let pc = 0; const c = {};
  for (let i = 2; pc < 64; i++) { if (!c[i]) { for (let j = i * i; j < 313; j += i) c[j] = 1; if (pc < 8) H[pc] = (Math.pow(i, .5) * 4294967296) | 0; K[pc++] = (Math.pow(i, 1 / 3) * 4294967296) | 0; } }
  const n = (((l + 8) >> 6) + 1) << 4, w = new Uint32Array(n);
  for (let i = 0; i < l; i++) w[i >> 2] |= m[i] << ((3 - (i & 3)) * 8);
  w[l >> 2] |= 0x80 << ((3 - (l & 3)) * 8);
  w[n - 1] = l * 8;
  let h = H.slice();
  for (let o = 0; o < n; o += 16) {
    const x = new Array(64);
    for (let i = 0; i < 64; i++) {
      if (i < 16) x[i] = w[o + i];
      else { const a = x[i - 15], b = x[i - 2]; x[i] = (x[i - 16] + (rr(a, 7) ^ rr(a, 18) ^ (a >>> 3)) + x[i - 7] + (rr(b, 17) ^ rr(b, 19) ^ (b >>> 10))) | 0; }
    }
    let [a, b, cc, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + x[i]) | 0;
      const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & cc) ^ (b & cc))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = cc; cc = b; b = a; a = (t1 + t2) | 0;
    }
    h = [h[0] + a, h[1] + b, h[2] + cc, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(v => v | 0);
  }
  return h.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}
async function sha(text) {
  if (globalThis.crypto?.subtle) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { /* fall through */ }
  }
  return sha256js(text);
}
async function makeUser(name, email, password, role = 'customer', extra = {}) {
  const salt = rid('s');
  return { id: rid('u'), name, email: email.toLowerCase(), phone: '', role, salt, hash: await sha(salt + password), addresses: [], createdAt: Date.now(), ...extra };
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { window.dispatchEvent(new CustomEvent('storage-error')); }
  emit();
}

async function seedAll() {
  Object.assign(S, {
    products: structuredClone(SEED_PRODUCTS), categories: structuredClone(SEED_CATEGORIES), outfits: structuredClone(SEED_OUTFITS),
    settings: structuredClone(SEED_SETTINGS), coupons: structuredClone(SEED_COUPONS),
    users: [], orders: [], cart: [], wishlist: [], newsletter: [], recent: [], sessionId: null, couponCode: '',
  });
  const admin = await makeUser('Store Admin', 'admin@aurelle.test', 'Admin@123', 'admin');
  const demo = await makeUser('Demo Customer', 'demo@aurelle.test', 'Demo@123', 'customer', { phone: '9876543210', addresses: [{ id: 'a1', label: 'Home', name: 'Demo Customer', phone: '9876543210', line1: '12, 4th Cross, Indiranagar', city: 'Bengaluru', state: 'Karnataka', pin: '560038' }] });
  const c2 = await makeUser('Ananya Rao', 'ananya@example.com', 'Demo@123', 'customer', { sample: true });
  const c3 = await makeUser('Karthik Shah', 'karthik@example.com', 'Demo@123', 'customer', { sample: true });
  S.users.push(admin, demo, c2, c3);
  // a few sample orders so the dashboard has something to show
  const pick = (i) => S.products[i % S.products.length];
  const users = [demo, c2, c3];
  const stat = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Packed', 'Placed', 'Delivered', 'Out for delivery', 'Delivered', 'Placed'];
  for (let i = 0; i < 10; i++) {
    const u = users[i % 3], p1 = pick(i * 3), p2 = pick(i * 3 + 13);
    const lines = [p1, p2].map(p => ({ id: rid('l'), type: 'item', productId: p.id, name: p.name, color: p.colors[0].name, hex: p.colors[0].hex, size: p.sizes[1] || p.sizes[0], qty: 1, unit: p.salePrice || p.price }));
    const sub = lines.reduce((a, l) => a + l.unit * l.qty, 0), ship = sub >= SEED_SETTINGS.shipping.freeAbove ? 0 : SEED_SETTINGS.shipping.flat;
    const at = Date.now() - (14 - i * 1.4) * 86400000;
    S.orders.push({
      id: 'AUR-' + (24100 + i), userId: u.id, email: u.email, customer: u.name, lines, totals: { original: sub, bundleSave: 0, couponOff: 0, shipping: ship, extra: 0, total: sub + ship },
      address: { name: u.name, phone: '9876543210', line1: '12, 4th Cross', city: 'Bengaluru', state: 'Karnataka', pin: '560038' }, delivery: 'standard',
      payment: { method: 'razorpay', status: 'paid', ref: 'demo_' + rid() }, status: stat[i],
      history: STATUSES.slice(0, STATUSES.indexOf(stat[i]) + 1).map((s, k) => ({ status: s, at: at + k * 86400000 })), createdAt: at, sample: true,
    });
  }
}

export async function init() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (raw) {
    try { Object.assign(S, JSON.parse(raw)); return; } catch (e) { /* fall through to reseed */ }
  }
  await seedAll();
  save();
}
export async function resetAll() { await seedAll(); save(); }

/* ---------- catalogue helpers ---------- */
export const cat = id => S.categories.find(c => c.id === id);
export const groupOf = p => cat(p.category)?.group || 'top';
export const product = id => S.products.find(p => p.id === id);
export const price = p => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
export const onSale = p => !!(p.salePrice && p.salePrice < p.price);
export const stockOf = (p, size) => (p.stock?.[size] ?? 0);
export const totalStock = p => Object.values(p.stock || {}).reduce((a, b) => a + (+b || 0), 0);
export const byGroup = (...g) => S.products.filter(p => g.includes(groupOf(p)));
export const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
export const colorOf = (p, name) => p.colors.find(c => c.name === name) || p.colors[0];

/* ---------- bundle pricing ---------- */
export function bundleRule(override) { return override || S.settings.bundle; }
export function bundlePrice(items, override = null) {
  const list = items.filter(Boolean);
  const original = list.reduce((a, p) => a + price(p), 0);
  const groups = new Set(list.map(groupOf));
  const complete = groups.has('top') && groups.has('bottom') && groups.has('shoes');
  const r = bundleRule(override);
  let discount = 0;
  if (complete) discount = r.type === 'flat' ? Math.min(r.value, original) : Math.round(original * r.value / 100);
  return { original, discount, final: original - discount, pct: original ? Math.round(discount / original * 100) : 0, complete, rule: r };
}

/* ---------- cart ---------- */
export function addItem({ productId, color, size, qty = 1 }) {
  const p = product(productId); if (!p) return { ok: false, msg: 'Product not found' };
  if (!size) return { ok: false, msg: 'Choose a size first' };
  const have = stockOf(p, size);
  const line = S.cart.find(l => l.type === 'item' && l.productId === productId && l.color === color && l.size === size);
  const already = line ? line.qty : 0;
  if (have <= 0) return { ok: false, msg: 'That size is sold out' };
  if (already + qty > have) return { ok: false, msg: `Only ${have} left in size ${size}` };
  if (line) line.qty += qty; else S.cart.push({ id: rid('l'), type: 'item', productId, color, size, qty });
  save(); return { ok: true };
}
export function addBundle({ name, items, override = null }) {
  for (const it of items) {
    const p = product(it.productId);
    if (!p) return { ok: false, msg: 'An item in this outfit is no longer available' };
    if (!it.size) return { ok: false, msg: `Choose a size for ${p.name}` };
    if (stockOf(p, it.size) <= 0) return { ok: false, msg: `${p.name} is sold out in size ${it.size}` };
  }
  S.cart.push({ id: rid('l'), type: 'bundle', name: name || 'Complete outfit', items: items.map(i => ({ ...i })), override, qty: 1 });
  save(); return { ok: true };
}
export function setQty(id, qty) {
  const l = S.cart.find(x => x.id === id); if (!l) return { ok: false };
  if (qty <= 0) { S.cart = S.cart.filter(x => x.id !== id); save(); return { ok: true }; }
  if (l.type === 'item') {
    const p = product(l.productId), have = p ? stockOf(p, l.size) : 0;
    if (qty > have) { return { ok: false, msg: `Only ${have} left in size ${l.size}` }; }
  }
  l.qty = Math.min(qty, 10); save(); return { ok: true };
}
export const removeLine = id => { S.cart = S.cart.filter(l => l.id !== id); save(); };
export const clearCart = () => { S.cart = []; S.couponCode = ''; save(); };

export function resolvedCart() {
  return S.cart.map(l => {
    if (l.type === 'item') {
      const p = product(l.productId);
      if (!p) return { ...l, missing: true, unit: 0, original: 0, discount: 0 };
      const c = colorOf(p, l.color), unit = price(p);
      return { ...l, p, hex: c.hex, unit, original: unit, discount: 0, outOfStock: stockOf(p, l.size) < l.qty };
    }
    const parts = l.items.map(i => ({ ...i, p: product(i.productId) }));
    if (parts.some(i => !i.p)) return { ...l, missing: true, unit: 0, original: 0, discount: 0, parts };
    const bp = bundlePrice(parts.map(i => i.p), l.override);
    return { ...l, parts: parts.map(i => ({ ...i, hex: colorOf(i.p, i.color).hex })), unit: bp.final, original: bp.original, discount: bp.discount, pct: bp.pct, complete: bp.complete, outOfStock: parts.some(i => stockOf(i.p, i.size) < l.qty) };
  });
}
export function couponCheck(code, subtotal) {
  const c = S.coupons.find(x => x.code === (code || '').trim().toUpperCase() && x.active);
  if (!c) return { ok: false, msg: 'That code is not valid' };
  if (subtotal < c.min) return { ok: false, msg: `Add ${inr(c.min - subtotal)} more to use ${c.code}`, coupon: c };
  return { ok: true, coupon: c };
}
export function totals({ express = false, cod = false } = {}) {
  const lines = resolvedCart().filter(l => !l.missing);
  const original = lines.reduce((a, l) => a + l.original * l.qty, 0);
  const bundleSave = lines.reduce((a, l) => a + l.discount * l.qty, 0);
  const subtotal = original - bundleSave;
  let couponOff = 0, freeShip = false, coupon = null, couponMsg = '';
  if (S.couponCode) {
    const r = couponCheck(S.couponCode, subtotal);
    if (r.ok) {
      coupon = r.coupon;
      if (coupon.type === 'percent') couponOff = Math.round(Math.min(subtotal * coupon.value / 100, coupon.maxOff || Infinity));
      else if (coupon.type === 'flat') couponOff = Math.min(coupon.value, subtotal);
      else freeShip = true;
    } else couponMsg = r.msg;
  }
  const sh = S.settings.shipping;
  const baseShip = !lines.length ? 0 : (freeShip || (subtotal - couponOff) >= sh.freeAbove ? 0 : sh.flat);
  const extra = (express && lines.length ? sh.expressExtra : 0) + (cod && lines.length ? sh.codFee : 0);
  const total = Math.max(0, subtotal - couponOff) + baseShip + extra;
  const toFree = Math.max(0, sh.freeAbove - (subtotal - couponOff));
  return { lines, count: lines.reduce((a, l) => a + l.qty, 0), original, bundleSave, subtotal, couponOff, coupon, couponMsg, shipping: baseShip, extra, total, toFree };
}

/* ---------- wishlist / recent ---------- */
export const isWished = id => S.wishlist.includes(id);
export function toggleWish(id) {
  const had = isWished(id);
  S.wishlist = had ? S.wishlist.filter(x => x !== id) : [...S.wishlist, id];
  save(); return !had;
}
export function pushRecent(id) { S.recent = [id, ...S.recent.filter(x => x !== id)].slice(0, 8); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

/* ---------- auth (prototype only: hashing in the browser is NOT real security) ---------- */
export const me = () => S.users.find(u => u.id === S.sessionId) || null;
export const isAdmin = () => me()?.role === 'admin';
export async function register({ name, email, password, phone }) {
  email = email.trim().toLowerCase();
  if (S.users.some(u => u.email === email)) return { ok: false, msg: 'An account with this email already exists' };
  const u = await makeUser(name.trim(), email, password, 'customer', { phone: (phone || '').trim() });
  S.users.push(u); S.sessionId = u.id; save(); return { ok: true, user: u };
}
export async function login(email, password) {
  const u = S.users.find(x => x.email === email.trim().toLowerCase());
  if (!u || (await sha(u.salt + password)) !== u.hash) return { ok: false, msg: 'Email or password is incorrect' };
  S.sessionId = u.id; save(); return { ok: true, user: u };
}
export const logout = () => { S.sessionId = null; save(); };
export function updateProfile(patch) { const u = me(); if (!u) return; Object.assign(u, patch); save(); }
export function saveAddress(a) {
  const u = me(); if (!u) return;
  if (a.id) { const i = u.addresses.findIndex(x => x.id === a.id); if (i >= 0) u.addresses[i] = a; else u.addresses.push(a); }
  else u.addresses.push({ ...a, id: rid('a') });
  save();
}
export function deleteAddress(id) { const u = me(); if (!u) return; u.addresses = u.addresses.filter(a => a.id !== id); save(); }

/* ---------- orders ---------- */
export function placeOrder({ address, delivery, method, payment }) {
  const u = me(); if (!u) return { ok: false, msg: 'Please sign in first' };
  const t = totals({ express: delivery === 'express', cod: method === 'cod' });
  if (!t.lines.length) return { ok: false, msg: 'Your cart is empty' };
  // re-check stock
  for (const l of t.lines) {
    const parts = l.type === 'item' ? [{ p: l.p, size: l.size, q: l.qty }] : l.parts.map(i => ({ p: i.p, size: i.size, q: l.qty }));
    for (const x of parts) if (stockOf(x.p, x.size) < x.q) return { ok: false, msg: `${x.p.name} (size ${x.size}) is no longer available in that quantity` };
  }
  for (const l of t.lines) {
    const parts = l.type === 'item' ? [{ p: l.p, size: l.size, q: l.qty }] : l.parts.map(i => ({ p: i.p, size: i.size, q: l.qty }));
    for (const x of parts) x.p.stock[x.size] = stockOf(x.p, x.size) - x.q;
  }
  const lines = t.lines.map(l => l.type === 'item'
    ? { id: l.id, type: 'item', productId: l.productId, name: l.p.name, color: l.color, hex: l.hex, size: l.size, qty: l.qty, unit: l.unit }
    : { id: l.id, type: 'bundle', name: l.name, qty: l.qty, unit: l.unit, original: l.original, discount: l.discount, parts: l.parts.map(i => ({ productId: i.productId, name: i.p.name, color: i.color, hex: i.hex, size: i.size, unit: price(i.p) })) });
  const now = Date.now();
  const order = {
    id: 'AUR-' + (24100 + S.orders.length + Math.floor(Math.random() * 90)), userId: u.id, email: u.email, customer: u.name, lines,
    totals: { original: t.original, bundleSave: t.bundleSave, couponOff: t.couponOff, coupon: t.coupon?.code || '', shipping: t.shipping, extra: t.extra, total: t.total },
    address, delivery, payment: { method, status: method === 'cod' ? 'pay on delivery' : 'paid', ref: payment?.ref || '' },
    status: 'Placed', history: [{ status: 'Placed', at: now }], createdAt: now,
  };
  S.orders.unshift(order); S.cart = []; S.couponCode = ''; save();
  return { ok: true, order };
}
export function setOrderStatus(id, status) {
  const o = S.orders.find(x => x.id === id); if (!o) return;
  if (status === 'Cancelled') { o.status = status; o.history.push({ status, at: Date.now() }); }
  else {
    o.status = status;
    const idx = STATUSES.indexOf(status);
    o.history = STATUSES.slice(0, idx + 1).map(s => o.history.find(h => h.status === s) || { status: s, at: Date.now() });
  }
  save();
}

/* ---------- admin CRUD ---------- */
export function upsertProduct(p) {
  const i = S.products.findIndex(x => x.id === p.id);
  if (i >= 0) S.products[i] = p; else S.products.unshift({ ...p, id: 'p' + Date.now().toString(36), createdAt: Date.now(), rating: 4.5, ratingCount: 0 });
  save();
}
export function deleteProduct(id) {
  S.products = S.products.filter(p => p.id !== id);
  S.wishlist = S.wishlist.filter(x => x !== id);
  S.outfits.forEach(o => { o.items = o.items.filter(x => x !== id); });
  save();
}
export function removeSampleData() {
  S.products = S.products.filter(p => !p.sample);
  S.outfits = [];
  S.orders = S.orders.filter(o => !o.sample);
  S.users = S.users.filter(u => !u.sample);
  const ids = new Set(S.products.map(p => p.id));
  S.cart = S.cart.filter(l => l.type === 'bundle' ? l.items.every(i => ids.has(i.productId)) : ids.has(l.productId));
  S.wishlist = S.wishlist.filter(id => ids.has(id));
  save();
}
export function subscribe(email) {
  if (!S.newsletter.includes(email)) S.newsletter.push(email); save();
}
