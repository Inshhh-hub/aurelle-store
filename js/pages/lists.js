import { S, product, totals, inr, save, couponCheck, setQty, removeLine, toggleWish, on, me } from '../store.js';
import { esc, icon, art, productCard, empty, toast, $, go } from '../ui.js';

export const wishlistPage = {
  title: () => 'Wishlist',
  render() {
    const ps = S.wishlist.map(product).filter(Boolean);
    return `<section class="wrap"><div class="page-h"><h1>Your wishlist</h1><p class="muted">${ps.length ? `${ps.length} saved ${ps.length === 1 ? 'piece' : 'pieces'}` : ''}</p></div>
    ${ps.length ? `<div class="grid g4">${ps.map(p => productCard(p)).join('')}</div>` : empty('Nothing saved yet', 'Tap the heart on any product to keep it here.', '<a class="btn primary" href="#/shop">Browse the collection</a>')}</section>`;
  },
};

function view() {
  const t = totals();
  if (!t.lines.length) return `<section class="wrap narrow">${empty('Your cart is empty', 'Add a few pieces, or build a complete outfit and save on the bundle.', '<div class="row gap center-x"><a class="btn primary" href="#/shop">Shop now</a><a class="btn ghost" href="#/build">Build an outfit</a></div>')}</section>`;
  const ship = S.settings.shipping, pctFree = Math.min(100, ((t.subtotal - t.couponOff) / ship.freeAbove) * 100);
  const avail = S.coupons.filter(c => c.active);
  return `<section class="wrap cart"><div class="page-h"><h1>Your cart</h1><p class="muted">${t.count} ${t.count === 1 ? 'item' : 'items'}</p></div>
  <div class="cart-grid"><div class="cart-lines"><div class="ship-bar"><p>${t.toFree > 0 ? `Add <b>${inr(t.toFree)}</b> more for free delivery` : `<b>You've unlocked free delivery</b>`}</p><div class="bar"><i style="width:${pctFree}%"></i></div></div>
  <ul class="lines">${t.lines.map(l => l.type === 'item' ? `<li class="line"><a class="thumb lg art" href="#/product/${l.p.id}?c=${encodeURIComponent(l.color)}">${art(l.p, l.hex)}</a><div class="grow"><div class="row between"><a class="name" href="#/product/${l.p.id}?c=${encodeURIComponent(l.color)}">${esc(l.p.name)}</a><b>${inr(l.unit * l.qty)}</b></div>
    <p class="muted sm">Colour ${esc(l.color)} · Size ${esc(l.size)} · ${inr(l.unit)} each</p>${l.outOfStock ? `<p class="stock out">Only ${l.p.stock[l.size] || 0} left in this size. Please reduce the quantity.</p>` : ''}
    <div class="row between"><div class="stepper"><button data-q="${l.id}" data-d="-1" aria-label="Fewer">${icon('minus', 16)}</button><output>${l.qty}</output><button data-q="${l.id}" data-d="1" aria-label="More">${icon('plus', 16)}</button></div>
    <div class="row gap"><button class="btn text sm" data-save="${l.id}">Move to wishlist</button><button class="btn text sm" data-rm="${l.id}">Remove</button></div></div></div></li>`
  : `<li class="line bundle-line"><div class="thumb-stack lg">${l.parts.map(i => `<div class="art">${art(i.p, i.hex)}</div>`).join('')}</div><div class="grow"><div class="row between"><b class="name">${esc(l.name)} <span class="pill ok">Outfit bundle</span></b><span><s class="muted">${inr(l.original * l.qty)}</s> <b>${inr(l.unit * l.qty)}</b></span></div>
    <ul class="parts">${l.parts.map(i => `<li><a href="#/product/${i.p.id}?c=${encodeURIComponent(i.color)}">${esc(i.p.name)}</a><span class="muted">${esc(i.color)} · ${esc(i.size)}</span></li>`).join('')}</ul>
    <p class="save-line">${icon('check', 14)} You save ${inr(l.discount * l.qty)} (${l.pct}%) on this outfit</p>${l.outOfStock ? '<p class="stock out">One piece is no longer available in this quantity.</p>' : ''}
    <div class="row between"><div class="stepper"><button data-q="${l.id}" data-d="-1" aria-label="Fewer">${icon('minus', 16)}</button><output>${l.qty}</output><button data-q="${l.id}" data-d="1" aria-label="More">${icon('plus', 16)}</button></div><button class="btn text sm" data-rm="${l.id}">Remove</button></div></div></li>`).join('')}</ul></div>
  <aside class="summary"><h2>Order summary</h2>
    <form class="coupon" id="coupon" novalidate><label class="sr" for="cc">Coupon code</label><input id="cc" placeholder="Coupon code" value="${esc(S.couponCode)}" autocomplete="off"><button class="btn ghost">${S.couponCode && t.coupon ? 'Change' : 'Apply'}</button></form>
    ${t.couponMsg ? `<p class="err-line">${esc(t.couponMsg)}</p>` : ''}${t.coupon ? `<p class="ok-line">${icon('check', 16)} <b>${esc(t.coupon.code)}</b> applied <button class="btn text sm" data-nocoupon>Remove</button></p>` : `<div class="chips">${avail.map(c => `<button class="chip" data-code="${esc(c.code)}" title="${esc(c.note)}">${esc(c.code)}</button>`).join('')}</div>`}
    <dl class="sumtbl"><div><dt>Items</dt><dd>${inr(t.original)}</dd></div>${t.bundleSave ? `<div class="save"><dt>Outfit bundle savings</dt><dd>−${inr(t.bundleSave)}</dd></div>` : ''}${t.couponOff ? `<div class="save"><dt>Coupon (${esc(t.coupon.code)})</dt><dd>−${inr(t.couponOff)}</dd></div>` : ''}<div><dt>Shipping</dt><dd>${t.shipping ? inr(t.shipping) : 'Free'}</dd></div><div class="total"><dt>Total payable</dt><dd>${inr(t.total)}</dd></div></dl>
    <p class="muted sm">Inclusive of all taxes. Express delivery and payment options are chosen at checkout.</p>
    <a class="btn primary block lg" href="#/checkout">Proceed to checkout</a><a class="btn text block" href="#/shop">Continue shopping</a></aside></div></section>`;
}

export const cartPage = {
  title: () => 'Cart',
  render: view,
  mount(root) {
    const redraw = () => { const y = scrollY; root.innerHTML = view(); scrollTo(0, y); };
    const off = on(() => { if (location.hash.startsWith('#/cart')) redraw(); });
    root.addEventListener('click', e => {
      const t = e.target; let b;
      if ((b = t.closest('[data-q]'))) { const l = S.cart.find(x => x.id === b.dataset.q); const r = setQty(l.id, l.qty + +b.dataset.d); if (r && r.ok === false && r.msg) toast(r.msg, 'err'); }
      else if ((b = t.closest('[data-rm]'))) { removeLine(b.dataset.rm); toast('Removed from cart'); }
      else if ((b = t.closest('[data-save]'))) { const l = S.cart.find(x => x.id === b.dataset.save); if (!S.wishlist.includes(l.productId)) toggleWish(l.productId); removeLine(l.id); toast('Moved to your wishlist'); }
      else if ((b = t.closest('[data-code]'))) { const r = couponCheck(b.dataset.code, totals().subtotal); S.couponCode = b.dataset.code; save(); if (!r.ok) toast(r.msg, 'err'); else toast('Coupon applied'); }
      else if (t.closest('[data-nocoupon]')) { S.couponCode = ''; save(); }
    });
    root.addEventListener('submit', e => {
      if (!e.target.matches('#coupon')) return; e.preventDefault();
      const code = $('#cc', root).value.trim().toUpperCase(); if (!code) { S.couponCode = ''; save(); return; }
      const r = couponCheck(code, totals().subtotal);
      if (!r.coupon) { toast(r.msg, 'err'); return; }
      S.couponCode = code; save(); if (!r.ok) toast(r.msg, 'err'); else toast('Coupon applied');
    });
    return off;
  },
};
