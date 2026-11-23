import { S, me, totals, inr, placeOrder, saveAddress, product, rid } from '../store.js';
import { esc, icon, art, toast, openModal, closeModal, empty, $, $$, go, fmtDate } from '../ui.js';

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
let st;

const fld = (name, label, v = '', extra = '') => `<label class="fld"><span>${label}</span><input name="${name}" value="${esc(v)}" ${extra}><em class="ferr" data-for="${name}"></em></label>`;
export const addressForm = (a = {}) => `${fld('name', 'Full name', a.name, 'autocomplete="name" required')}${fld('phone', 'Mobile number', a.phone, 'inputmode="numeric" maxlength="10" autocomplete="tel-national" placeholder="10-digit number"')}
  ${fld('line1', 'Address (house, street, area)', a.line1, 'autocomplete="street-address" required')}<div class="two">${fld('city', 'City', a.city, 'autocomplete="address-level2"')}${fld('pin', 'PIN code', a.pin, 'inputmode="numeric" maxlength="6" autocomplete="postal-code"')}</div>
  <label class="fld"><span>State</span><select name="state">${STATES.map(s => `<option ${a.state === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>`;
export function readAddress(form) {
  const d = Object.fromEntries(new FormData(form).entries()), errs = {};
  if (!d.name?.trim()) errs.name = 'Enter your name';
  if (!/^[6-9]\d{9}$/.test((d.phone || '').trim())) errs.phone = 'Enter a valid 10-digit mobile number';
  if (!d.line1?.trim()) errs.line1 = 'Enter your address';
  if (!d.city?.trim()) errs.city = 'Enter your city';
  if (!/^[1-9]\d{5}$/.test((d.pin || '').trim())) errs.pin = 'Enter a valid 6-digit PIN code';
  $$('.ferr', form).forEach(e => { e.textContent = errs[e.dataset.for] || ''; });
  const first = Object.keys(errs)[0]; if (first) form.elements[first]?.focus();
  return Object.keys(errs).length ? null : Object.fromEntries(Object.entries(d).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
}

function view() {
  const u = me(), t = totals({ express: st.delivery === 'express', cod: st.pay === 'cod' });
  if (!t.lines.length) return `<section class="wrap narrow">${empty('Nothing to check out', 'Your cart is empty.', '<a class="btn primary" href="#/shop">Shop now</a>')}</section>`;
  if (!u) return `<section class="wrap narrow">${empty('Sign in to check out', 'Create an account or sign in so we can save your order and let you track it.', '<a class="btn primary" href="#/login?next=checkout">Sign in or create account</a>')}</section>`;
  const sh = S.settings.shipping;
  return `<section class="wrap checkout"><div class="page-h"><h1>Checkout</h1></div><div class="co-grid"><div class="co-main">
  <div class="co-card"><h2><span>1</span> Delivery address</h2>
    ${u.addresses.length ? `<div class="addr-list">${u.addresses.map(a => `<label class="radio card-r ${st.addr === a.id ? 'on' : ''}"><input type="radio" name="addr" value="${a.id}" ${st.addr === a.id ? 'checked' : ''}><span><b>${esc(a.name)}</b> ${a.label ? `<em class="tagx">${esc(a.label)}</em>` : ''}<br>${esc(a.line1)}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.pin)}<br><span class="muted">Mobile ${esc(a.phone)}</span></span></label>`).join('')}
      <label class="radio card-r ${st.addr === 'new' ? 'on' : ''}"><input type="radio" name="addr" value="new" ${st.addr === 'new' ? 'checked' : ''}><span><b>Use a new address</b></span></label></div>` : ''}
    ${st.addr === 'new' ? `<form id="addr-form" novalidate class="addr-form">${addressForm({ name: u.name, phone: u.phone })}<label class="check"><input type="checkbox" name="save" checked><span>Save this address to my account</span></label></form>` : ''}</div>
  <div class="co-card"><h2><span>2</span> Delivery speed</h2><div class="addr-list">
    <label class="radio card-r ${st.delivery === 'standard' ? 'on' : ''}"><input type="radio" name="del" value="standard" ${st.delivery === 'standard' ? 'checked' : ''}><span><b>Standard</b> · 4–6 days<br><span class="muted">${(totals().subtotal - totals().couponOff) >= sh.freeAbove || totals().coupon?.type === 'ship' ? 'Free' : inr(sh.flat)}</span></span></label>
    <label class="radio card-r ${st.delivery === 'express' ? 'on' : ''}"><input type="radio" name="del" value="express" ${st.delivery === 'express' ? 'checked' : ''}><span><b>Express</b> · 2–3 days<br><span class="muted">+${inr(sh.expressExtra)}</span></span></label></div></div>
  <div class="co-card"><h2><span>3</span> Payment</h2><div class="addr-list">
    <label class="radio card-r ${st.pay === 'razorpay' ? 'on' : ''}"><input type="radio" name="pay" value="razorpay" ${st.pay === 'razorpay' ? 'checked' : ''}><span><b>Pay online</b> · UPI, cards, net banking, wallets<br><span class="muted">${icon('shield', 14)} Processed securely by Razorpay. We never see or store your card details.</span></span></label>
    <label class="radio card-r ${st.pay === 'cod' ? 'on' : ''}"><input type="radio" name="pay" value="cod" ${st.pay === 'cod' ? 'checked' : ''}><span><b>Cash on delivery</b><br><span class="muted">+${inr(sh.codFee)} handling fee</span></span></label></div></div></div>
  <aside class="summary"><h2>Order summary</h2><ul class="mini-lines flat">${t.lines.map(l => l.type === 'item' ? `<li><div class="thumb art">${art(l.p, l.hex)}</div><div class="grow"><b>${esc(l.p.name)}</b><p class="muted sm">${esc(l.color)} · ${esc(l.size)} · Qty ${l.qty}</p></div><b>${inr(l.unit * l.qty)}</b></li>` : `<li><div class="thumb-stack">${l.parts.map(i => `<div class="art">${art(i.p, i.hex)}</div>`).join('')}</div><div class="grow"><b>${esc(l.name)}</b><p class="muted sm">${l.parts.length} pieces · Qty ${l.qty}</p></div><b>${inr(l.unit * l.qty)}</b></li>`).join('')}</ul>
    <dl class="sumtbl"><div><dt>Items</dt><dd>${inr(t.original)}</dd></div>${t.bundleSave ? `<div class="save"><dt>Outfit bundle savings</dt><dd>−${inr(t.bundleSave)}</dd></div>` : ''}${t.couponOff ? `<div class="save"><dt>Coupon</dt><dd>−${inr(t.couponOff)}</dd></div>` : ''}<div><dt>Shipping</dt><dd>${t.shipping ? inr(t.shipping) : 'Free'}</dd></div>${t.extra ? `<div><dt>Express / COD fees</dt><dd>${inr(t.extra)}</dd></div>` : ''}<div class="total"><dt>Total payable</dt><dd>${inr(t.total)}</dd></div></dl>
    <button class="btn primary block lg" id="place">${st.pay === 'cod' ? 'Place order' : 'Pay ' + inr(t.total)}</button><p class="muted sm center">By placing your order you agree to our terms and returns policy.</p></aside></div></section>`;
}

/* ---------- Razorpay (live) with a clearly-labelled test simulator fallback ---------- */
const loadScript = src => new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('script')); document.head.append(s); });
async function pay(amount, who) {
  let cfg = null;
  try {
    const r = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Math.round(amount * 100), receipt: rid('rcpt') }) });
    if (r.ok) cfg = await r.json();
  } catch (e) { /* no backend (local preview) */ }
  if (cfg?.orderId && cfg?.keyId) {
    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    return new Promise((resolve, reject) => {
      const rz = new window.Razorpay({
        key: cfg.keyId, amount: cfg.amount, currency: 'INR', name: S.settings.brandName, order_id: cfg.orderId, prefill: { name: who.name, email: who.email, contact: who.phone },
        theme: { color: '#3E5A56' }, modal: { ondismiss: () => reject(new Error('Payment was cancelled')) },
        handler: async resp => {
          try { const v = await fetch('/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resp) }); if (!v.ok) throw 0; resolve({ ref: resp.razorpay_payment_id }); }
          catch (e) { reject(new Error('We could not verify the payment. If money was debited it will be refunded.')); }
        },
      });
      rz.on('payment.failed', () => reject(new Error('Payment failed. Please try again.')));
      rz.open();
    });
  }
  // simulator
  return new Promise((resolve, reject) => {
    const el = openModal(`<h2>Test payment</h2><p class="note">${icon('info', 16)} Razorpay isn't configured on this site yet, so this is a <b>simulated</b> payment. No real money moves and no card details are collected. Add your Razorpay keys on Vercel to switch to live payments.</p>
      <dl class="sumtbl"><div class="total"><dt>Amount</dt><dd>${inr(amount)}</dd></div></dl><div class="row gap"><button class="btn primary grow" data-ok>Simulate successful payment</button><button class="btn ghost" data-fail>Simulate failure</button></div>`);
    let done = false;
    el.addEventListener('click', e => {
      if (e.target.closest('[data-ok]')) { done = true; closeModal(); resolve({ ref: 'test_' + rid() }); }
      else if (e.target.closest('[data-fail]')) { done = true; closeModal(); reject(new Error('Payment failed (simulated). Please try again.')); }
    });
    new MutationObserver((_, ob) => { if (!document.body.contains(el)) { ob.disconnect(); if (!done) reject(new Error('Payment was cancelled')); } }).observe(document.body, { childList: true });
  });
}

export default {
  title: () => 'Checkout',
  render() {
    const u = me();
    st = { addr: u?.addresses[0]?.id || 'new', delivery: 'standard', pay: 'razorpay' };
    return view();
  },
  mount(root) {
    const redraw = () => { const y = scrollY; const f = $('#addr-form', root); const keep = f ? new FormData(f) : null; root.innerHTML = view(); if (keep) { const nf = $('#addr-form', root); if (nf) for (const [k, v] of keep.entries()) if (nf.elements[k] && nf.elements[k].type !== 'checkbox') nf.elements[k].value = v; } scrollTo(0, y); };
    root.addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'addr') st.addr = t.value; else if (t.name === 'del') st.delivery = t.value; else if (t.name === 'pay') st.pay = t.value; else return;
      redraw();
    });
    root.addEventListener('click', async e => {
      const btn = e.target.closest('#place'); if (!btn) return;
      const u = me(); let address;
      if (st.addr === 'new') {
        const form = $('#addr-form', root); address = readAddress(form); if (!address) { toast('Please fix the highlighted fields', 'err'); return; }
        if (form.elements.save?.checked) saveAddress({ ...address, label: 'Home' });
      } else address = u.addresses.find(a => a.id === st.addr);
      const t = totals({ express: st.delivery === 'express', cod: st.pay === 'cod' });
      btn.disabled = true; btn.textContent = 'Processing…';
      try {
        let payment = null; if (st.pay === 'razorpay') payment = await pay(t.total, { name: u.name, email: u.email, phone: address.phone });
        const r = placeOrder({ address: { name: address.name, phone: address.phone, line1: address.line1, city: address.city, state: address.state, pin: address.pin }, delivery: st.delivery, method: st.pay, payment });
        if (!r.ok) { toast(r.msg, 'err'); btn.disabled = false; btn.textContent = 'Try again'; return; }
        go('/order/' + r.order.id);
      } catch (err) { toast(err.message, 'err'); btn.disabled = false; btn.textContent = st.pay === 'cod' ? 'Place order' : 'Pay ' + inr(t.total); }
    });
  },
};

export const orderDone = {
  title: () => 'Order confirmed',
  render(ctx) {
    const o = S.orders.find(x => x.id === ctx.params[0]);
    if (!o || o.userId !== me()?.id) return `<section class="wrap narrow">${empty('Order not found', 'Sign in with the account you used to place it.', '<a class="btn primary" href="#/account/orders">My orders</a>')}</section>`;
    return `<section class="wrap narrow done"><div class="done-mark"><svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="2" class="c"/><path d="m15 27 8 8 15-17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="t"/></svg></div>
    <h1>Thank you, ${esc(o.customer.split(' ')[0])}</h1><p class="lead">Your order <b>${esc(o.id)}</b> is confirmed. We've sent the details to ${esc(o.email)}.</p>
    <div class="co-card left"><h2>Order details</h2><ul class="parts">${o.lines.map(l => `<li><span>${esc(l.name)}${l.type === 'item' ? ` · ${esc(l.color)} · ${esc(l.size)}` : ` · ${l.parts.length} pieces`} × ${l.qty}</span><b>${inr(l.unit * l.qty)}</b></li>`).join('')}</ul>
    <dl class="sumtbl"><div class="total"><dt>Total ${o.payment.method === 'cod' ? '(pay on delivery)' : 'paid'}</dt><dd>${inr(o.totals.total)}</dd></div></dl>
    <p class="muted">Delivering to ${esc(o.address.name)}, ${esc(o.address.line1)}, ${esc(o.address.city)} ${esc(o.address.pin)}</p></div>
    <div class="row gap center-x wrap-s"><a class="btn primary" href="#/track/${o.id}">Track order</a><a class="btn ghost" href="#/shop">Keep shopping</a></div></section>`;
  },
};
