import { S, product, price, onSale, inr, colorOf, stockOf, totalStock, groupOf, cat, byGroup, addItem, isWished, pushRecent, bundlePrice } from '../store.js';
import { esc, icon, productCard, art, stars, swatch, stockLabel, toast, bump, go, $, $$, empty } from '../ui.js';
import { VIEWS } from '../garments.js';
import { recommend, asItem, pct } from '../match.js';
import { confirmBundle } from '../bundle.js';

export function looks(p, hex) {
  const g = groupOf(p);
  const want = g === 'top' ? ['bottom', 'shoes'] : g === 'bottom' ? ['top', 'shoes'] : g === 'shoes' ? ['top', 'bottom'] : ['top', 'bottom'];
  const base = asItem(p, hex);
  return want.map(w => recommend(base, byGroup(w), { limit: 1 })[0]).filter(Boolean);
}

export default {
  title: ctx => product(ctx.params[0])?.name || 'Product',
  render(ctx) {
    const p = product(ctx.params[0]);
    if (!p) return `<section class="wrap narrow">${empty('Product not found', 'It may have been removed. Browse the full collection instead.', '<a class="btn primary" href="#/shop">Shop all</a>')}</section>`;
    pushRecent(p.id);
    const c = colorOf(p, ctx.query.c);
    const viewCount = p.images?.length || VIEWS.length;
    const off = onSale(p) ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
    const related = S.products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
    const recent = S.recent.filter(id => id !== p.id).map(product).filter(Boolean).slice(0, 4);
    return `<section class="wrap pdp" data-id="${p.id}"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><a href="#/shop">Shop</a><a href="#/shop?cat=${p.category}">${esc(cat(p.category)?.name || '')}</a><span>${esc(p.name)}</span></nav>
    <div class="pdp-grid"><div class="gallery"><div class="gal-thumbs" id="thumbs">${Array.from({ length: viewCount }, (_, i) => `<button class="${i === 0 ? 'on' : ''}" data-v="${i}" aria-label="View ${i + 1}"><div class="art">${art(p, c.hex, i)}</div></button>`).join('')}</div>
      <div class="gal-main ${p.images?.length ? 'zoomable' : ''}" id="gmain"><div class="art" id="gart">${art(p, c.hex, 0)}</div><button class="wish big ${isWished(p.id) ? 'on' : ''}" data-action="wish" data-id="${p.id}" aria-label="Add to wishlist" aria-pressed="${isWished(p.id)}">${icon('heart', 22)}</button></div></div>
      <div class="pdp-info"><p class="muted">${esc(cat(p.category)?.name || '')}</p><h1>${esc(p.name)}</h1>
        <div class="row gap center-y">${stars(p.rating)}<span class="muted sm">${p.rating.toFixed(1)} (${p.ratingCount} reviews)</span></div>
        <div class="price lg"><b id="pp">${inr(price(p))}</b>${onSale(p) ? `<s>${inr(p.price)}</s><span class="pill ok">${off}% off</span>` : ''}</div><p class="muted sm">Inclusive of all taxes.</p>
        <p class="lbl">Colour: <b id="cname">${esc(c.name)}</b></p><div class="sws" id="pcolors">${p.colors.map(x => swatch(x, { on: x.name === c.name, attrs: `data-color="${esc(x.name)}"` })).join('')}</div>
        <div class="row between"><p class="lbl">Size: <b id="sname"></b></p><a href="#" class="link sm" data-action="info" data-k="size">Size guide</a></div>
        <div class="chips" id="psizes">${p.sizes.map(s => `<button class="chip ${stockOf(p, s) <= 0 ? 'out' : ''}" data-size="${esc(s)}" ${stockOf(p, s) <= 0 ? 'disabled aria-label="' + esc(s) + ' sold out"' : ''}>${esc(s)}</button>`).join('')}</div>
        <p class="hint" id="shint">${totalStock(p) > 0 ? 'Select a size to see availability' : '<span class="stock out">Currently sold out</span>'}</p>
        <div class="row gap"><div class="stepper"><button data-q="-1" aria-label="Fewer">${icon('minus', 16)}</button><output id="qty">1</output><button data-q="1" aria-label="More">${icon('plus', 16)}</button></div>
          <button class="btn primary grow" id="add" ${totalStock(p) <= 0 ? 'disabled' : ''}>Add to cart</button></div>
        <div class="row gap mt-s"><button class="btn dark grow" id="buy" ${totalStock(p) <= 0 ? 'disabled' : ''}>Buy now</button><button class="btn ghost grow" data-action="wish" data-id="${p.id}" id="wl-btn">${icon('heart', 18)} <span>${isWished(p.id) ? 'In wishlist' : 'Add to wishlist'}</span></button></div>
        <a class="match-link" href="#/match?id=${p.id}&c=${encodeURIComponent(c.name)}" id="match-link">${icon('sparkle', 20)}<span><b>Find what matches this</b><em>See ranked pairings from our range</em></span>${icon('arrow', 18)}</a>
        <div class="acc">${[['Details', `<p>${esc(p.description)}</p>${p.fabric ? `<p><b>Fabric:</b> ${esc(p.fabric)}</p>` : ''}<p><b>Occasions:</b> ${esc((p.occasions || []).join(', '))}</p>`], ['Care', '<p>Machine wash cold with similar colours. Do not bleach. Dry in shade. Iron on low heat.</p>'], ['Delivery & returns', `<p>Free delivery over ${inr(S.settings.shipping.freeAbove)}. Easy 7-day returns and exchanges on unworn items.</p>`]].map(([t, b], i) => `<details ${i === 0 ? 'open' : ''}><summary>${t}${icon('chevron', 18)}</summary><div>${b}</div></details>`).join('')}</div>
      </div></div>
    <div id="look"></div>
    ${related.length ? `<section class="sec tight"><div class="sec-h"><h2>More ${esc(cat(p.category)?.name || '')}</h2></div><div class="grid g4">${related.map(x => productCard(x)).join('')}</div></section>` : ''}
    ${recent.length ? `<section class="sec tight"><div class="sec-h"><h2>Recently viewed</h2></div><div class="grid g4">${recent.map(x => productCard(x)).join('')}</div></section>` : ''}</section>`;
  },
  mount(root, ctx) {
    const p = product(ctx.params[0]); if (!p) return;
    let color = colorOf(p, ctx.query.c).name, size = p.sizes.length === 1 && stockOf(p, p.sizes[0]) > 0 ? p.sizes[0] : '', qty = 1, view = 0;
    const hex = () => colorOf(p, color).hex;
    const drawArt = () => {
      $('#gart', root).innerHTML = art(p, hex(), view);
      if (!p.images?.length) $$('#thumbs button', root).forEach((b, i) => { b.querySelector('.art').innerHTML = art(p, hex(), i); });
    };
    const drawLook = () => {
      const ls = looks(p, hex()); const host = $('#look', root);
      if (!ls.length) { host.innerHTML = ''; return; }
      const items = [{ p, hex: hex(), color }, ...ls.map(l => ({ p: l.product, hex: l.color.hex, color: l.color.name }))];
      const bp = bundlePrice(items.map(i => i.p));
      host.innerHTML = `<section class="sec tight"><div class="sec-h row between"><div><h2>Complete the look</h2><p class="muted">Pieces from our range that pair well with this one.</p></div><a class="link" href="#/build?${[p, ...ls.map(l => l.product)].map((x, i) => `${groupOf(x) === 'outer' || groupOf(x) === 'accessory' ? 'acc' : groupOf(x)}=${x.id}:${encodeURIComponent(items[i].color)}`).join('&')}">Open in outfit builder</a></div>
      <div class="look"><div class="look-items">${items.map((it, i) => `<div class="look-it ${i === 0 ? 'cur' : ''}"><a href="#/product/${it.p.id}?c=${encodeURIComponent(it.color)}"><div class="art">${art(it.p, it.hex)}</div></a><b>${esc(it.p.name)}</b><span class="muted sm">${inr(price(it.p))}${i ? ` · ${pct(ls[i - 1].score)}% match` : ''}</span></div>${i < items.length - 1 ? `<span class="plus">${icon('plus', 18)}</span>` : ''}`).join('')}</div>
      <div class="look-sum"><p class="muted">Whole look</p><div><s class="muted">${inr(bp.original)}</s> <b class="big">${inr(bp.final)}</b></div>${bp.complete ? `<span class="pill ok">Save ${inr(bp.discount)}</span>` : '<span class="muted sm">Add a top, bottom and shoes to save</span>'}<button class="btn primary block" id="add-look">Add the look</button></div></div></section>`;
      $('#add-look', host).onclick = () => confirmBundle({ name: 'Complete the look', picks: items.map(i => ({ productId: i.p.id, color: i.color, size: i.p.id === p.id ? size : '' })) });
    };
    const setSize = s => {
      size = s; $('#sname', root).textContent = s;
      $$('#psizes .chip', root).forEach(b => b.classList.toggle('on', b.dataset.size === s));
      $('#shint', root).innerHTML = stockLabel(p, s); qty = Math.min(qty, Math.max(1, stockOf(p, s))); $('#qty', root).textContent = qty;
    };
    if (size) setSize(size);
    drawLook();
    const add = () => {
      if (!size) { const h = $('#shint', root); h.innerHTML = '<span class="stock out">Please choose a size</span>'; h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake'); $('#psizes', root).classList.add('nudge'); setTimeout(() => $('#psizes', root)?.classList.remove('nudge'), 900); return false; }
      const r = addItem({ productId: p.id, color, size, qty });
      if (!r.ok) { toast(r.msg, 'err'); return false; }
      bump(); return true;
    };
    root.addEventListener('click', e => {
      const t = e.target; let b;
      if ((b = t.closest('[data-color]'))) {
        color = b.dataset.color; $('#cname', root).textContent = color;
        $$('#pcolors .sw', root).forEach(s => { const on = s === b; s.classList.toggle('on', on); s.setAttribute('aria-pressed', on); });
        history.replaceState(null, '', `#/product/${p.id}?c=${encodeURIComponent(color)}`); $('#match-link', root).href = `#/match?id=${p.id}&c=${encodeURIComponent(color)}`; drawArt(); drawLook();
      }
      else if ((b = t.closest('#psizes [data-size]'))) setSize(b.dataset.size);
      else if ((b = t.closest('[data-v]'))) { view = +b.dataset.v; $$('#thumbs button', root).forEach(x => x.classList.toggle('on', x === b)); drawArt(); }
      else if ((b = t.closest('[data-q]'))) { const max = size ? stockOf(p, size) : 10; qty = Math.max(1, Math.min(Math.min(10, max || 10), qty + +b.dataset.q)); $('#qty', root).textContent = qty; }
      else if (t.closest('#add')) { if (add()) toast(`${p.name} added to your cart`); }
      else if (t.closest('#buy')) { if (add()) go('/checkout'); }
      else if (t.closest('#wl-btn')) { setTimeout(() => { $('#wl-btn span', root).textContent = isWished(p.id) ? 'In wishlist' : 'Add to wishlist'; }, 0); }
    });
    // hover zoom for uploaded photos
    const gm = $('#gmain', root);
    if (gm.classList.contains('zoomable')) {
      gm.addEventListener('mousemove', e => { const r = gm.getBoundingClientRect(); const img = gm.querySelector('img'); img.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; img.style.transform = 'scale(1.8)'; });
      gm.addEventListener('mouseleave', () => { const img = gm.querySelector('img'); if (img) img.style.transform = ''; });
    }
  },
};
