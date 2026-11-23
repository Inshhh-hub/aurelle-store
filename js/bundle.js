// Shared helpers for outfit bundles: size confirmation modal + one-off upload hand-off.
import { product, price, inr, bundlePrice, stockOf, colorOf, addBundle, S } from './store.js';
import { openModal, closeModal, esc, icon, art, toast, bump, go } from './ui.js';

export const hold = { file: null, dataUrl: null }; // image handed from the homepage drop zone to the upload page

// picks: [{ productId, color, size? }]
export function confirmBundle({ name, picks, override = null, goToCart = false }) {
  const items = picks.map(x => ({ ...x }));
  items.forEach(i => { const p = product(i.productId); if (p && !i.size && p.sizes.length === 1 && stockOf(p, p.sizes[0]) > 0) i.size = p.sizes[0]; });
  const el = openModal('', { cls: 'bundle-modal' });
  const body = el.querySelector('.modal');
  const draw = () => {
    const ps = items.map(i => product(i.productId)).filter(Boolean);
    const bp = bundlePrice(ps, override);
    body.querySelector('.bm')?.remove();
    body.insertAdjacentHTML('beforeend', `<div class="bm"><h2>${esc(name || 'Your outfit')}</h2><p class="muted">Pick a size for each piece to add the whole outfit.</p>
      <ul class="bm-list">${items.map((i, k) => { const p = product(i.productId); if (!p) return ''; const c = colorOf(p, i.color); return `<li><div class="thumb art">${art(p, c.hex)}</div><div class="grow"><b>${esc(p.name)}</b><p class="muted sm">${esc(c.name)} · ${inr(price(p))}</p>
        <div class="chips">${p.sizes.map(s => `<button type="button" class="chip ${s === i.size ? 'on' : ''}" ${stockOf(p, s) <= 0 ? 'disabled' : ''} data-k="${k}" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div></div></li>`; }).join('')}</ul>
      <div class="bm-sum"><div class="row between"><span>Original total</span><span>${inr(bp.original)}</span></div>
      ${bp.complete ? `<div class="row between save"><span>Complete-outfit discount (${bp.pct}%)</span><b>−${inr(bp.discount)}</b></div>` : '<p class="muted sm">Add a top, a bottom and shoes to unlock the outfit discount.</p>'}
      <div class="row between total"><span>Bundle price</span><b>${inr(bp.final)}</b></div></div>
      <p class="err-line" id="bm-err" role="alert"></p>
      <button class="btn primary block" data-add>Add outfit to cart</button></div>`);
  };
  draw();
  body.addEventListener('click', e => {
    const c = e.target.closest('[data-k]');
    if (c) { items[+c.dataset.k].size = c.dataset.s; draw(); return; }
    if (e.target.closest('[data-add]')) {
      const r = addBundle({ name, items, override });
      if (!r.ok) { body.querySelector('#bm-err').textContent = r.msg; return; }
      closeModal(); toast('Outfit added to your cart'); bump(); if (goToCart) go('/cart');
    }
  });
}
