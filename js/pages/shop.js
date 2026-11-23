import { S, price, onSale, totalStock, groupOf, cat } from '../store.js';
import { esc, icon, productCard, empty, $, $$, swatch } from '../ui.js';
import { colourFamily, FAMILY_HEX } from '../match.js';

const SORTS = [['featured', 'Featured'], ['new', 'Newest'], ['popular', 'Most popular'], ['rating', 'Top rated'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['name', 'Name A–Z']];
const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', 'One size'];
let F = {};

const parseQ = q => ({
  q: q.q || '', cats: q.cat ? q.cat.split(',') : [], min: q.min ? +q.min : null, max: q.max ? +q.max : null, colors: q.col ? q.col.split(',') : [],
  sizes: q.size ? q.size.split(',') : [], inStock: q.stock === '1', sale: q.sale === '1', tag: q.tag || '', sort: q.sort || 'featured', cols: +q.cols || 4,
});
function toQuery() {
  const p = new URLSearchParams();
  if (F.q) p.set('q', F.q); if (F.cats.length) p.set('cat', F.cats.join(',')); if (F.min != null) p.set('min', F.min); if (F.max != null) p.set('max', F.max);
  if (F.colors.length) p.set('col', F.colors.join(',')); if (F.sizes.length) p.set('size', F.sizes.join(','));
  if (F.inStock) p.set('stock', 1); if (F.sale) p.set('sale', 1); if (F.tag) p.set('tag', F.tag);
  if (F.sort !== 'featured') p.set('sort', F.sort); if (F.cols !== 4) p.set('cols', F.cols);
  return p.toString();
}
const bounds = () => { const ps = S.products.map(price); return [Math.floor(Math.min(...ps, 0) / 100) * 100, Math.ceil(Math.max(...ps, 100) / 100) * 100]; };

function filtered() {
  const q = F.q.trim().toLowerCase();
  let list = S.products.filter(p => {
    if (q && ![p.name, cat(p.category)?.name, ...(p.tags || []), ...p.colors.map(c => c.name), p.fabric, p.description].join(' ').toLowerCase().includes(q)) return false;
    if (F.cats.length && !F.cats.includes(p.category)) return false;
    if (F.min != null && price(p) < F.min) return false;
    if (F.max != null && price(p) > F.max) return false;
    if (F.colors.length && !p.colors.some(c => F.colors.includes(colourFamily(c.hex)))) return false;
    if (F.sizes.length && !F.sizes.some(s => (p.stock?.[s] || 0) > 0)) return false;
    if (F.inStock && totalStock(p) <= 0) return false;
    if (F.sale && !onSale(p)) return false;
    if (F.tag && !(p.tags || []).includes(F.tag)) return false;
    return true;
  });
  const by = {
    featured: (a, b) => (b.isFeatured - a.isFeatured) || (b.isTrending - a.isTrending) || (b.createdAt - a.createdAt), new: (a, b) => b.createdAt - a.createdAt,
    popular: (a, b) => b.ratingCount - a.ratingCount, rating: (a, b) => b.rating - a.rating, low: (a, b) => price(a) - price(b), high: (a, b) => price(b) - price(a), name: (a, b) => a.name.localeCompare(b.name),
  };
  return list.sort(by[F.sort] || by.featured);
}

function chips() {
  const out = [];
  if (F.q) out.push(['q', `“${F.q}”`]); F.cats.forEach(c => out.push(['cat:' + c, cat(c)?.name || c]));
  if (F.min != null || F.max != null) out.push(['price', `₹${F.min ?? ''}–${F.max ?? ''}`]);
  F.colors.forEach(c => out.push(['col:' + c, c])); F.sizes.forEach(s => out.push(['size:' + s, 'Size ' + s]));
  if (F.inStock) out.push(['stock', 'In stock']); if (F.sale) out.push(['sale', 'On sale']); if (F.tag) out.push(['tag', 'Collection: ' + F.tag]);
  return out;
}

export default {
  title: () => 'Shop',
  render(ctx) {
    F = parseQ(ctx.query);
    const [lo, hi] = bounds();
    const fams = [...new Set(S.products.flatMap(p => p.colors.map(c => colourFamily(c.hex))))];
    const sizes = [...new Set(S.products.flatMap(p => p.sizes))].sort((a, b) => { const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b); return (ia < 0 ? 100 + +a : ia) - (ib < 0 ? 100 + +b : ib); });
    return `<section class="wrap shop"><div class="shop-head"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>Shop</span></nav><h1>Shop the collection</h1></div>
    <div class="shop-bar"><button class="btn ghost only-m" id="open-f">${icon('filter', 18)} Filters</button><p class="muted" id="count" aria-live="polite"></p>
      <div class="row gap"><div class="seg hide-m" role="group" aria-label="Grid density">${[2, 3, 4].map(n => `<button data-cols="${n}" class="${F.cols === n ? 'on' : ''}" aria-label="${n} columns">${n}</button>`).join('')}</div>
      <label class="sel"><span class="sr">Sort by</span><select id="sort">${SORTS.map(([v, t]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div></div>
    <div class="shop-body"><aside class="filters" id="filters" aria-label="Filters"><div class="f-head only-m"><h2>Filters</h2><button class="icon-btn" id="close-f" aria-label="Close filters">${icon('close')}</button></div>
      <div class="f-group"><label class="lbl" for="fq">Search</label><div class="field-ico">${icon('search', 18)}<input id="fq" type="search" value="${esc(F.q)}" placeholder="Search products"></div></div>
      <div class="f-group"><p class="lbl">Category</p>${S.categories.map(c => `<label class="check"><input type="checkbox" data-cat="${c.id}" ${F.cats.includes(c.id) ? 'checked' : ''}><span>${esc(c.name)}</span><em>${S.products.filter(p => p.category === c.id).length}</em></label>`).join('')}</div>
      <div class="f-group"><p class="lbl">Price</p><div class="range"><input type="range" id="pmin" min="${lo}" max="${hi}" step="100" value="${F.min ?? lo}" aria-label="Minimum price"><input type="range" id="pmax" min="${lo}" max="${hi}" step="100" value="${F.max ?? hi}" aria-label="Maximum price"></div><div class="row between"><b id="plo">₹${F.min ?? lo}</b><b id="phi">₹${F.max ?? hi}</b></div></div>
      <div class="f-group"><p class="lbl">Colour</p><div class="sws wrap-s">${fams.map(f => swatch({ name: f, hex: FAMILY_HEX[f] || '#999' }, { on: F.colors.includes(f), attrs: `data-fam="${f}"` })).join('')}</div></div>
      <div class="f-group"><p class="lbl">Size</p><div class="chips">${sizes.map(s => `<button class="chip ${F.sizes.includes(s) ? 'on' : ''}" data-size="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
      <div class="f-group"><label class="toggle"><input type="checkbox" id="f-stock" ${F.inStock ? 'checked' : ''}><i></i><span>In stock only</span></label><label class="toggle"><input type="checkbox" id="f-sale" ${F.sale ? 'checked' : ''}><i></i><span>On sale</span></label></div>
      <div class="f-foot only-m"><button class="btn primary block" id="apply-f">Show results</button></div>
      <button class="link" id="clear-f">Clear all filters</button></aside>
    <div class="shop-main"><div class="active-chips" id="achips"></div><div id="results"></div></div></div></section>`;
  },
  mount(root) {
    const res = $('#results', root), count = $('#count', root), achips = $('#achips', root), fil = $('#filters', root);
    const [lo, hi] = bounds();
    const sync = (replace = true) => { const qs = toQuery(); history.replaceState(null, '', '#/shop' + (qs ? '?' + qs : '')); draw(); };
    function draw() {
      const list = filtered();
      count.textContent = `${list.length} ${list.length === 1 ? 'product' : 'products'}`;
      res.className = 'grid g' + F.cols;
      res.innerHTML = list.length ? list.map(productCard).join('') : `<div class="span-all">${empty('No products match', 'Try removing a filter or searching for something broader.', '<button class="btn primary" id="reset2">Clear filters</button>')}</div>`;
      res.classList.remove('swap'); void res.offsetWidth; res.classList.add('swap');
      achips.innerHTML = chips().map(([k, t]) => `<button class="chip on removable" data-rm="${esc(k)}">${esc(t)} ${icon('close', 14)}</button>`).join('');
      $$('[data-cols]', root).forEach(b => b.classList.toggle('on', +b.dataset.cols === F.cols));
    }
    draw();
    const clear = () => { F = parseQ({}); history.replaceState(null, '', '#/shop'); location.reload(); };
    root.addEventListener('click', e => {
      const t = e.target; let b;
      if ((b = t.closest('[data-size]'))) { const s = b.dataset.size; F.sizes = F.sizes.includes(s) ? F.sizes.filter(x => x !== s) : [...F.sizes, s]; b.classList.toggle('on'); sync(); }
      else if ((b = t.closest('[data-fam]'))) { const s = b.dataset.fam; F.colors = F.colors.includes(s) ? F.colors.filter(x => x !== s) : [...F.colors, s]; b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); sync(); }
      else if ((b = t.closest('[data-cols]'))) { F.cols = +b.dataset.cols; sync(); }
      else if ((b = t.closest('[data-rm]'))) {
        const [k, v] = b.dataset.rm.split(':');
        if (k === 'q') { F.q = ''; $('#fq', root).value = ''; } else if (k === 'cat') { F.cats = F.cats.filter(x => x !== v); $(`[data-cat="${v}"]`, root).checked = false; }
        else if (k === 'price') { F.min = F.max = null; $('#pmin', root).value = lo; $('#pmax', root).value = hi; $('#plo', root).textContent = '₹' + lo; $('#phi', root).textContent = '₹' + hi; }
        else if (k === 'col') { F.colors = F.colors.filter(x => x !== v); $(`[data-fam="${v}"]`, root)?.classList.remove('on'); }
        else if (k === 'size') { F.sizes = F.sizes.filter(x => x !== v); $(`[data-size="${v}"]`, root)?.classList.remove('on'); }
        else if (k === 'stock') { F.inStock = false; $('#f-stock', root).checked = false; } else if (k === 'sale') { F.sale = false; $('#f-sale', root).checked = false; } else if (k === 'tag') F.tag = '';
        sync();
      }
      else if (t.closest('#clear-f, #reset2')) clear();
      else if (t.closest('#open-f')) fil.classList.add('open');
      else if (t.closest('#close-f, #apply-f')) fil.classList.remove('open');
    });
    root.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.cat) { F.cats = t.checked ? [...F.cats, t.dataset.cat] : F.cats.filter(x => x !== t.dataset.cat); sync(); }
      else if (t.id === 'sort') { F.sort = t.value; sync(); }
      else if (t.id === 'f-stock') { F.inStock = t.checked; sync(); } else if (t.id === 'f-sale') { F.sale = t.checked; sync(); }
    });
    root.addEventListener('input', e => {
      const t = e.target;
      if (t.id === 'fq') { F.q = t.value; sync(); }
      else if (t.id === 'pmin' || t.id === 'pmax') {
        let a = +$('#pmin', root).value, z = +$('#pmax', root).value;
        if (a > z) { if (t.id === 'pmin') { a = z; $('#pmin', root).value = a; } else { z = a; $('#pmax', root).value = z; } }
        F.min = a <= lo ? null : a; F.max = z >= hi ? null : z;
        $('#plo', root).textContent = '₹' + a; $('#phi', root).textContent = '₹' + z; sync();
      }
    });
  },
};
