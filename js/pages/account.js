import { S, me, isAdmin, login, register, logout, updateProfile, saveAddress, deleteAddress, inr, STATUSES } from '../store.js';
import { esc, icon, toast, openModal, closeModal, empty, $, $$, go, fmtDate, fmtTime } from '../ui.js';
import { addressForm, readAddress } from './checkout.js';

const pwOk = p => p.length >= 8 && /\d/.test(p) && /[A-Za-z]/.test(p);
const setErr = (form, name, msg) => { const e = $(`.ferr[data-for="${name}"]`, form); if (e) e.textContent = msg || ''; };
const pwField = (name, label, ac) => `<label class="fld"><span>${label}</span><div class="pw"><input name="${name}" type="password" autocomplete="${ac}" required><button type="button" class="icon-btn sm" data-eye aria-label="Show password">${icon('eye', 18)}</button></div><em class="ferr" data-for="${name}"></em></label>`;

export const loginPage = {
  title: () => 'Sign in',
  render(ctx) {
    if (me()) { setTimeout(() => go('/' + (ctx.query.next || 'account')), 0); return ''; }
    const reg = ctx.query.mode === 'register';
    return `<section class="wrap auth"><div class="auth-card"><div class="tabs" role="tablist"><button role="tab" class="${reg ? '' : 'on'}" data-mode="login">Sign in</button><button role="tab" class="${reg ? 'on' : ''}" data-mode="register">Create account</button></div>
    <form id="auth" novalidate data-mode="${reg ? 'register' : 'login'}">${reg ? `<label class="fld"><span>Full name</span><input name="name" autocomplete="name" required><em class="ferr" data-for="name"></em></label>` : ''}
      <label class="fld"><span>Email</span><input name="email" type="email" autocomplete="email" required><em class="ferr" data-for="email"></em></label>
      ${reg ? `<label class="fld"><span>Mobile number (optional)</span><input name="phone" inputmode="numeric" maxlength="10" autocomplete="tel-national"><em class="ferr" data-for="phone"></em></label>` : ''}
      ${pwField('password', 'Password', reg ? 'new-password' : 'current-password')}${reg ? '<p class="muted sm">At least 8 characters with a letter and a number.</p>' : ''}
      <p class="err-line" id="auth-err" role="alert"></p><button class="btn primary block lg">${reg ? 'Create account' : 'Sign in'}</button></form>
    <div class="note demo">${icon('info', 16)}<div><b>Prototype logins</b><br>Customer: demo@aurelle.test / Demo@123<br>Admin: admin@aurelle.test / Admin@123<br><span class="muted">Change these before going live.</span></div></div></div></section>`;
  },
  mount(root, ctx) {
    root.addEventListener('click', e => {
      const m = e.target.closest('[data-mode]'); if (m) { history.replaceState(null, '', `#/login?mode=${m.dataset.mode}${ctx.query.next ? '&next=' + ctx.query.next : ''}`); location.reload(); return; }
      const eye = e.target.closest('[data-eye]'); if (eye) { const i = eye.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; }
    });
    $('#auth', root)?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)), reg = f.dataset.mode === 'register';
      let bad = false; $$('.ferr', f).forEach(x => x.textContent = '');
      if (reg && !d.name.trim()) { setErr(f, 'name', 'Enter your name'); bad = true; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) { setErr(f, 'email', 'Enter a valid email'); bad = true; }
      if (reg && d.phone && !/^[6-9]\d{9}$/.test(d.phone)) { setErr(f, 'phone', 'Enter a valid 10-digit number'); bad = true; }
      if (!d.password) { setErr(f, 'password', 'Enter your password'); bad = true; } else if (reg && !pwOk(d.password)) { setErr(f, 'password', 'Use 8+ characters with a letter and a number'); bad = true; }
      if (bad) return;
      const btn = f.querySelector('button.btn'); btn.disabled = true;
      const r = reg ? await register(d) : await login(d.email, d.password);
      btn.disabled = false;
      if (!r.ok) { $('#auth-err', root).textContent = r.msg; return; }
      toast(reg ? 'Welcome! Your account is ready.' : `Welcome back, ${r.user.name.split(' ')[0]}`);
      go('/' + (ctx.query.next || (r.user.role === 'admin' && !reg ? 'admin' : 'account')));
    });
  },
};

const timeline = o => {
  const cancelled = o.status === 'Cancelled';
  const idx = STATUSES.indexOf(o.status);
  return `<ol class="tl ${cancelled ? 'cancelled' : ''}">${STATUSES.map((s, i) => { const h = o.history.find(x => x.status === s); return `<li class="${!cancelled && i <= idx ? 'done' : ''} ${!cancelled && i === idx ? 'now' : ''}"><i>${!cancelled && i <= idx ? icon('check', 14) : ''}</i><div><b>${s}</b><span class="muted sm">${h ? fmtTime(h.at) : 'Pending'}</span></div></li>`; }).join('')}</ol>${cancelled ? '<p class="err-line">This order was cancelled.</p>' : ''}`;
};
const eta = o => { const d = new Date(o.createdAt + (o.delivery === 'express' ? 3 : 6) * 86400000); return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); };

function orderCard(o) {
  return `<article class="order"><header class="row between wrap-s"><div><b>${esc(o.id)}</b><p class="muted sm">${fmtDate(o.createdAt)} · ${o.lines.length} ${o.lines.length === 1 ? 'item' : 'items'}</p></div><div class="row gap center-y"><span class="status s-${o.status.replace(/\s/g, '').toLowerCase()}">${o.status}</span><b>${inr(o.totals.total)}</b></div></header>
  <ul class="parts">${o.lines.map(l => `<li><span>${esc(l.name)}${l.type === 'item' ? ` · ${esc(l.color)} · ${esc(l.size)}` : ` · outfit bundle`} × ${l.qty}</span><span>${inr(l.unit * l.qty)}</span></li>`).join('')}</ul>
  <div class="row between wrap-s"><span class="muted sm">${o.status === 'Delivered' ? 'Delivered' : o.status === 'Cancelled' ? '' : 'Expected by ' + eta(o)}</span><a class="btn ghost sm" href="#/track/${o.id}">Track order</a></div></article>`;
}

export const trackPage = {
  title: () => 'Track order',
  render(ctx) {
    const id = ctx.params[0], u = me();
    const o = id && S.orders.find(x => x.id.toLowerCase() === id.toLowerCase() && (u?.role === 'admin' || u?.id === x.userId || (ctx.query.e && x.email === ctx.query.e.toLowerCase())));
    return `<section class="wrap narrow track"><div class="page-h"><h1>Track your order</h1></div>
    <form id="track" class="co-card row gap wrap-s" novalidate><label class="fld grow"><span>Order number</span><input name="id" value="${esc(id || '')}" placeholder="AUR-24100" required></label><label class="fld grow"><span>Email used at checkout</span><input name="email" type="email" value="${esc(u?.email || '')}" required></label><button class="btn primary">Track</button></form>
    ${id && !o ? `<p class="err-line">We couldn't find that order. Check the number and email and try again.</p>` : ''}
    ${o ? `<div class="co-card"><div class="row between wrap-s"><div><h2>${esc(o.id)}</h2><p class="muted">Placed ${fmtDate(o.createdAt)}</p></div>${o.status === 'Cancelled' || o.status === 'Delivered' ? '' : `<div class="text-r"><p class="muted sm">Expected by</p><b>${eta(o)}</b></div>`}</div>${timeline(o)}
      <h3>Items</h3><ul class="parts">${o.lines.map(l => `<li><span>${esc(l.name)}${l.type === 'item' ? ` · ${esc(l.color)} · ${esc(l.size)}` : ' · outfit bundle'} × ${l.qty}</span><span>${inr(l.unit * l.qty)}</span></li>`).join('')}</ul>
      <p class="muted">Shipping to ${esc(o.address.name)}, ${esc(o.address.line1)}, ${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.pin)}</p></div>` : ''}</section>`;
  },
  mount(root) {
    $('#track', root).addEventListener('submit', e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); if (!d.id.trim() || !d.email.trim()) return toast('Enter your order number and email', 'err'); go(`/track/${encodeURIComponent(d.id.trim().toUpperCase())}?e=${encodeURIComponent(d.email.trim())}`); });
  },
};

export default {
  title: () => 'My account',
  render(ctx) {
    const u = me(); if (!u) { setTimeout(() => go('/login?next=account'), 0); return ''; }
    const tab = ctx.params[0] || 'profile';
    const orders = S.orders.filter(o => o.userId === u.id);
    const tabs = [['profile', 'Profile'], ['addresses', 'Saved addresses'], ['orders', 'Order history']];
    return `<section class="wrap acct"><div class="page-h row between wrap-s"><div><h1>My account</h1><p class="muted">${esc(u.name)} · ${esc(u.email)}</p></div><div class="row gap">${u.role === 'admin' ? '<a class="btn ghost" href="#/admin">Admin dashboard</a>' : ''}<button class="btn text" data-action="logout">Sign out</button></div></div>
    <div class="acct-grid"><nav class="side-nav" aria-label="Account">${tabs.map(([k, t]) => `<a href="#/account/${k}" class="${tab === k ? 'on' : ''}">${t}${k === 'orders' ? `<em>${orders.length}</em>` : ''}</a>`).join('')}<a href="#/wishlist">Wishlist<em>${S.wishlist.length}</em></a></nav>
    <div class="acct-main">${tab === 'orders' ? (orders.length ? orders.map(orderCard).join('') : empty('No orders yet', 'When you place an order it will appear here.', '<a class="btn primary" href="#/shop">Start shopping</a>'))
      : tab === 'addresses' ? `<div class="row between"><h2>Saved addresses</h2><button class="btn primary" id="add-addr">${icon('plus', 16)} Add address</button></div><div class="addr-grid">${u.addresses.map(a => `<div class="co-card"><b>${esc(a.name)}</b> ${a.label ? `<em class="tagx">${esc(a.label)}</em>` : ''}<p>${esc(a.line1)}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.pin)}<br><span class="muted">Mobile ${esc(a.phone)}</span></p><div class="row gap"><button class="btn text sm" data-edit="${a.id}">Edit</button><button class="btn text sm" data-del="${a.id}">Delete</button></div></div>`).join('') || '<p class="muted">No saved addresses yet.</p>'}</div>`
      : `<h2>Profile</h2><form id="prof" class="co-card narrow-form" novalidate><label class="fld"><span>Full name</span><input name="name" value="${esc(u.name)}" required><em class="ferr" data-for="name"></em></label><label class="fld"><span>Email</span><input value="${esc(u.email)}" disabled></label><label class="fld"><span>Mobile number</span><input name="phone" value="${esc(u.phone || '')}" maxlength="10" inputmode="numeric"><em class="ferr" data-for="phone"></em></label><button class="btn primary">Save changes</button></form>`}</div></div></section>`;
  },
  mount(root) {
    const u = me(); if (!u) return;
    $('#prof', root)?.addEventListener('submit', e => {
      e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)); let bad = false;
      if (!d.name.trim()) { setErr(f, 'name', 'Enter your name'); bad = true; } else setErr(f, 'name', '');
      if (d.phone && !/^[6-9]\d{9}$/.test(d.phone)) { setErr(f, 'phone', 'Enter a valid 10-digit number'); bad = true; } else setErr(f, 'phone', '');
      if (bad) return; updateProfile({ name: d.name.trim(), phone: d.phone.trim() }); toast('Profile saved');
    });
    const editor = (a = {}) => {
      const el = openModal(`<h2>${a.id ? 'Edit address' : 'Add address'}</h2><form id="af" novalidate>${addressForm(a)}<label class="fld"><span>Label</span><input name="label" value="${esc(a.label || 'Home')}" placeholder="Home, Work…"></label><button class="btn primary block">Save address</button></form>`);
      $('#af', el).addEventListener('submit', e => { e.preventDefault(); const d = readAddress(e.target); if (!d) return; saveAddress({ ...d, id: a.id }); closeModal(); toast('Address saved'); location.reload(); });
    };
    root.addEventListener('click', e => {
      const t = e.target; let b;
      if (t.closest('#add-addr')) editor({ name: u.name, phone: u.phone });
      else if ((b = t.closest('[data-edit]'))) editor(u.addresses.find(a => a.id === b.dataset.edit));
      else if ((b = t.closest('[data-del]'))) { deleteAddress(b.dataset.del); toast('Address removed'); location.reload(); }
    });
  },
};
