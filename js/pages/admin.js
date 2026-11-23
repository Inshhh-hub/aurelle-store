import { S, me, isAdmin, price, onSale, inr, totalStock, cat, product, upsertProduct, deleteProduct, setOrderStatus, STATUSES, save, rid, removeSampleData, resetAll, bundlePrice, groupOf } from '../store.js';
import { esc, icon, art, toast, openModal, closeModal, empty, imageToDataURL, $, $$, fmtDate, fmtTime, swatch } from '../ui.js';

const TABS = [['overview', 'Overview', 'chart'], ['products', 'Products', 'tag'], ['categories', 'Categories', 'layers'], ['outfits', 'Outfits & bundles', 'shirt'], ['orders', 'Orders', 'box'], ['customers', 'Customers', 'users'], ['coupons', 'Coupons', 'tag'], ['settings', 'Settings', 'gear']];
const OCC = ['casual', 'smart', 'formal', 'party', 'sport'], STYLES = ['classic', 'minimal', 'relaxed', 'street'], PATS = ['solid', 'striped', 'checked', 'printed'];
const PRESET = { top: ['S', 'M', 'L', 'XL', 'XXL'], outer: ['S', 'M', 'L', 'XL', 'XXL'], bottom: ['28', '30', '32', '34', '36'], shoes: ['6', '7', '8', '9', '10', '11'], accessory: ['One size'] };
const SHAPES = [['', 'Auto'], ['cap', 'Cap'], ['belt', 'Belt'], ['tote', 'Tote bag'], ['watch', 'Watch']];
let tab = 'overview', ordFilter = '', prodQ = '', prodCat = '';

const revenueOrders = () => S.orders.filter(o => o.status !== 'Cancelled');

/* ---------- charts ---------- */
function bars(data, { fmt = inr, h = 220 } = {}) {
  const W = 680, pad = { l: 46, r: 8, t: 12, b: 28 }, iw = W - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = Math.max(1, ...data.map(d => d.v)), step = Math.pow(10, Math.floor(Math.log10(max))) , top = Math.ceil(max / step) * step;
  const bw = Math.min(26, iw / data.length - 8), gap = iw / data.length;
  const grid = [0, .5, 1].map(f => { const y = pad.t + ih - ih * f; return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" class="ax">${f ? (top * f >= 1000 ? Math.round(top * f / 1000) + 'k' : Math.round(top * f)) : '0'}</text>`; }).join('');
  const bs = data.map((d, i) => { const x = pad.l + gap * i + (gap - bw) / 2, bh = ih * d.v / top, y = pad.t + ih - bh; return `<g class="bar-g" data-tip="${esc(d.label)}: ${fmt(d.v)}"><rect x="${pad.l + gap * i}" y="${pad.t}" width="${gap}" height="${ih}" fill="transparent"/>${d.v ? `<path d="M${x} ${pad.t + ih} V${y + 4} a4 4 0 0 1 4 -4 h${bw - 8} a4 4 0 0 1 4 4 V${pad.t + ih} Z" class="bar"/>` : ''}${i % 2 === 0 ? `<text x="${x + bw / 2}" y="${h - 8}" text-anchor="middle" class="ax">${esc(d.label)}</text>` : ''}</g>`; }).join('');
  return `<div class="chart" role="img" aria-label="Bar chart"><svg viewBox="0 0 ${W} ${h}">${grid}${bs}</svg><div class="tip" hidden></div><table class="sr"><tbody>${data.map(d => `<tr><th>${esc(d.label)}</th><td>${fmt(d.v)}</td></tr>`).join('')}</tbody></table></div>`;
}

function overview() {
  const os = revenueOrders(), rev = os.reduce((a, o) => a + o.totals.total, 0), cust = S.users.filter(u => u.role === 'customer').length;
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i)); return d; });
  const series = days.map(d => ({ label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), v: os.filter(o => { const x = new Date(o.createdAt); x.setHours(0, 0, 0, 0); return +x === +d; }).reduce((a, o) => a + o.totals.total, 0) }));
  const sold = {}; os.forEach(o => o.lines.forEach(l => { const parts = l.type === 'item' ? [{ name: l.name, q: l.qty, v: l.unit * l.qty }] : l.parts.map(p => ({ name: p.name, q: l.qty, v: p.unit * l.qty })); parts.forEach(p => { sold[p.name] = sold[p.name] || { q: 0, v: 0 }; sold[p.name].q += p.q; sold[p.name].v += p.v; }); }));
  const top = Object.entries(sold).sort((a, b) => b[1].q - a[1].q).slice(0, 5);
  const low = S.products.flatMap(p => Object.entries(p.stock || {}).filter(([, n]) => n <= 3).map(([s, n]) => ({ p, s, n }))).sort((a, b) => a.n - b.n).slice(0, 6);
  const byStatus = [...STATUSES, 'Cancelled'].map(s => [s, S.orders.filter(o => o.status === s).length]);
  const maxS = Math.max(1, ...byStatus.map(x => x[1]));
  return `<div class="kpis"><div class="kpi"><span>Revenue</span><b>${inr(rev)}</b></div><div class="kpi"><span>Orders</span><b>${S.orders.length}</b></div><div class="kpi"><span>Average order</span><b>${inr(os.length ? rev / os.length : 0)}</b></div><div class="kpi"><span>Customers</span><b>${cust}</b></div></div>
  <div class="ad-grid"><div class="co-card span2"><h2>Revenue, last 14 days</h2>${bars(series)}</div>
  <div class="co-card"><h2>Orders by status</h2><ul class="hbars">${byStatus.map(([s, n]) => `<li><span>${s}</span><div><i style="width:${n / maxS * 100}%"></i></div><b>${n}</b></li>`).join('')}</ul></div>
  <div class="co-card"><h2>Best sellers</h2>${top.length ? `<ol class="rank">${top.map(([n, v]) => `<li><span>${esc(n)}</span><b>${v.q} sold</b></li>`).join('')}</ol>` : '<p class="muted">No sales yet.</p>'}</div>
  <div class="co-card span2"><h2>Low stock</h2>${low.length ? `<ul class="rank">${low.map(x => `<li><span>${esc(x.p.name)} · size ${esc(x.s)}</span><b class="${x.n === 0 ? 'stock out' : 'stock low'}">${x.n === 0 ? 'Sold out' : x.n + ' left'}</b></li>`).join('')}</ul>` : '<p class="muted">Everything is well stocked.</p>'}</div></div>`;
}

/* ---------- products ---------- */
function products() {
  const list = S.products.filter(p => (!prodQ || p.name.toLowerCase().includes(prodQ.toLowerCase())) && (!prodCat || p.category === prodCat));
  return `<div class="ad-bar"><div class="field-ico">${icon('search', 18)}<input id="pq" type="search" placeholder="Search products" value="${esc(prodQ)}"></div>
  <select id="pcat"><option value="">All categories</option>${S.categories.map(c => `<option value="${c.id}" ${prodCat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button class="btn primary" data-prod="new">${icon('plus', 16)} Add product</button></div>
  ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th></th></tr></thead><tbody>${list.map(p => `<tr><td><div class="thumb sm art">${art(p, p.colors[0].hex)}</div></td><td><b>${esc(p.name)}</b>${p.sample ? ' <em class="tagx">sample</em>' : ''}<br><span class="muted sm">${p.colors.length} colours · ${p.images?.length ? p.images.length + ' photos' : 'illustration'}</span></td><td>${esc(cat(p.category)?.name || '—')}</td><td>${onSale(p) ? `<b>${inr(p.salePrice)}</b> <s class="muted">${inr(p.price)}</s>` : `<b>${inr(p.price)}</b>`}</td><td>${totalStock(p) <= 0 ? '<span class="stock out">Sold out</span>' : totalStock(p)}</td><td class="sm">${[p.isNew && 'New', p.isTrending && 'Trending', p.isFeatured && 'Featured'].filter(Boolean).join(', ') || '—'}</td><td class="row gap"><button class="icon-btn sm" data-prod="${p.id}" aria-label="Edit ${esc(p.name)}">${icon('edit', 18)}</button><button class="icon-btn sm" data-delprod="${p.id}" aria-label="Delete ${esc(p.name)}">${icon('trash', 18)}</button></td></tr>`).join('')}</tbody></table></div>` : empty('No products', 'Add your first product to start selling.', '<button class="btn primary" data-prod="new">Add product</button>')}`;
}

function productModal(id, done) {
  const base = id === 'new' ? { name: '', category: S.categories[0]?.id, description: '', price: '', salePrice: '', colors: [], sizes: [], stock: {}, pattern: 'solid', occasions: ['casual'], style: 'classic', fabric: '', tags: [], shape: '', images: [], isNew: true, isTrending: false, isFeatured: false } : structuredClone(product(id));
  const d = base;
  const el = openModal('', { wide: true, cls: 'prod-modal' }), body = el.querySelector('.modal');
  const grp = () => cat(d.category)?.group || 'top';
  const draw = () => {
    body.querySelector('form')?.remove();
    body.insertAdjacentHTML('beforeend', `<form id="pf" novalidate><h2>${id === 'new' ? 'Add product' : 'Edit product'}</h2>
    <div class="pf-grid"><div>
      <label class="fld"><span>Product name</span><input name="name" value="${esc(d.name)}" required><em class="ferr" data-for="name"></em></label>
      <label class="fld"><span>Description</span><textarea name="description" rows="3">${esc(d.description)}</textarea></label>
      <div class="two"><label class="fld"><span>Category</span><select name="category">${S.categories.map(c => `<option value="${c.id}" ${d.category === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label><label class="fld"><span>Fabric</span><input name="fabric" value="${esc(d.fabric)}"></label></div>
      <div class="two"><label class="fld"><span>Price (₹)</span><input name="price" type="number" min="1" value="${d.price}"><em class="ferr" data-for="price"></em></label><label class="fld"><span>Sale price (₹, optional)</span><input name="salePrice" type="number" min="1" value="${d.salePrice || ''}"><em class="ferr" data-for="salePrice"></em></label></div>
      <p class="lbl">Colours</p><div class="sws">${d.colors.map((c, i) => `<span class="cpill">${swatch(c, { size: 'sm' })}${esc(c.name)}<button type="button" data-rmc="${i}" aria-label="Remove ${esc(c.name)}">${icon('close', 12)}</button></span>`).join('')}</div>
      <div class="row gap center-y"><input type="color" id="nc-hex" value="#6c7152" aria-label="Colour"><input id="nc-name" placeholder="Colour name, e.g. Olive"><button type="button" class="btn ghost sm" data-addc>Add colour</button></div><em class="ferr" data-for="colors"></em>
      <p class="lbl">Sizes and stock</p><div class="chips">${[...new Set([...PRESET[grp()], ...d.sizes])].map(s => `<button type="button" class="chip ${d.sizes.includes(s) ? 'on' : ''}" data-tsize="${esc(s)}">${esc(s)}</button>`).join('')}<input id="ns" class="mini-in" placeholder="Custom size"><button type="button" class="btn ghost sm" data-adds>Add</button></div><em class="ferr" data-for="sizes"></em>
      <div class="stock-grid">${d.sizes.map(s => `<label class="fld"><span>${esc(s)}</span><input type="number" min="0" data-stock="${esc(s)}" value="${d.stock[s] ?? 0}"></label>`).join('')}</div>
    </div><div>
      <p class="lbl">Photographs</p><div class="img-grid">${d.images.map((im, i) => `<div class="img-t"><img src="${im}" alt="Photo ${i + 1}"><button type="button" data-rmi="${i}" aria-label="Remove photo" class="icon-btn sm">${icon('close', 14)}</button>${i ? `<button type="button" data-first="${i}" class="btn xs">Make first</button>` : '<span class="pill">Cover</span>'}</div>`).join('')}<label class="img-add">${icon('plus', 22)}<span>Add photos</span><input type="file" id="imgs" accept="image/*" multiple hidden></label></div>
      <p class="muted sm">${d.images.length ? 'Photos replace the illustration on the storefront.' : 'No photos yet. A drawn illustration is shown until you add some.'}</p>
      ${grp() === 'accessory' ? `<label class="fld"><span>Accessory illustration</span><select name="shape">${SHAPES.map(([v, t]) => `<option value="${v}" ${d.shape === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
      <div class="two"><label class="fld"><span>Pattern</span><select name="pattern">${PATS.map(v => `<option ${d.pattern === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="fld"><span>Style</span><select name="style">${STYLES.map(v => `<option ${d.style === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
      <p class="lbl">Occasions (used for matching)</p><div class="chips">${OCC.map(o => `<button type="button" class="chip ${d.occasions.includes(o) ? 'on' : ''}" data-occ="${o}">${o}</button>`).join('')}</div>
      <label class="fld"><span>Tags / collections (comma separated)</span><input name="tags" value="${esc((d.tags || []).join(', '))}" placeholder="neutrals, summer, layers"></label>
      <div class="row gap wrap-s"><label class="check"><input type="checkbox" name="isNew" ${d.isNew ? 'checked' : ''}><span>New arrival</span></label><label class="check"><input type="checkbox" name="isTrending" ${d.isTrending ? 'checked' : ''}><span>Trending</span></label><label class="check"><input type="checkbox" name="isFeatured" ${d.isFeatured ? 'checked' : ''}><span>Featured</span></label></div>
    </div></div><div class="row gap end"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">Save product</button></div></form>`);
  };
  const pull = () => { const f = $('#pf', body); if (!f) return; for (const k of ['name', 'description', 'category', 'fabric', 'price', 'salePrice', 'pattern', 'style', 'shape']) if (f.elements[k]) d[k] = f.elements[k].value; d.tags = (f.elements.tags?.value || '').split(',').map(x => x.trim()).filter(Boolean); ['isNew', 'isTrending', 'isFeatured'].forEach(k => { d[k] = f.elements[k].checked; }); $$('[data-stock]', f).forEach(i => { d.stock[i.dataset.stock] = Math.max(0, +i.value || 0); }); };
  draw();
  body.addEventListener('change', async e => {
    if (e.target.name === 'category') { pull(); d.sizes = []; d.stock = {}; draw(); }
    else if (e.target.id === 'imgs') {
      pull(); for (const f of e.target.files) { try { d.images.push(await imageToDataURL(f)); } catch (err) { toast(err.message, 'err'); } } draw();
    }
  });
  body.addEventListener('click', e => {
    const t = e.target; let b;
    if ((b = t.closest('[data-rmc]'))) { pull(); d.colors.splice(+b.dataset.rmc, 1); draw(); }
    else if (t.closest('[data-addc]')) { pull(); const n = $('#nc-name', body).value.trim(); if (!n) return $('#nc-name', body).focus(); if (d.colors.some(c => c.name.toLowerCase() === n.toLowerCase())) return toast('That colour is already added', 'err'); d.colors.push({ name: n, hex: $('#nc-hex', body).value }); draw(); }
    else if ((b = t.closest('[data-tsize]'))) { pull(); const s = b.dataset.tsize; d.sizes = d.sizes.includes(s) ? d.sizes.filter(x => x !== s) : [...d.sizes, s]; if (d.stock[s] == null) d.stock[s] = 10; draw(); }
    else if (t.closest('[data-adds]')) { pull(); const s = $('#ns', body).value.trim(); if (s && !d.sizes.includes(s)) { d.sizes.push(s); d.stock[s] = 10; } draw(); }
    else if ((b = t.closest('[data-occ]'))) { pull(); const o = b.dataset.occ; d.occasions = d.occasions.includes(o) ? d.occasions.filter(x => x !== o) : [...d.occasions, o]; draw(); }
    else if ((b = t.closest('[data-rmi]'))) { pull(); d.images.splice(+b.dataset.rmi, 1); draw(); }
    else if ((b = t.closest('[data-first]'))) { pull(); const [im] = d.images.splice(+b.dataset.first, 1); d.images.unshift(im); draw(); }
  });
  body.addEventListener('submit', e => {
    e.preventDefault(); pull(); const f = $('#pf', body); let ok = true;
    const err = (k, m) => { const x = $(`.ferr[data-for="${k}"]`, f); if (x) x.textContent = m || ''; if (m) ok = false; };
    ['name', 'price', 'salePrice', 'colors', 'sizes'].forEach(k => err(k, ''));
    if (!d.name.trim()) err('name', 'Enter a product name');
    if (!(+d.price > 0)) err('price', 'Enter a price above 0');
    if (d.salePrice && !(+d.salePrice > 0 && +d.salePrice < +d.price)) err('salePrice', 'Sale price must be lower than the price');
    if (!d.colors.length) err('colors', 'Add at least one colour');
    if (!d.sizes.length) err('sizes', 'Choose at least one size');
    if (!ok) { toast('Please fix the highlighted fields', 'err'); return; }
    const out = { ...d, name: d.name.trim(), price: +d.price, salePrice: d.salePrice ? +d.salePrice : null, sample: id === 'new' ? false : d.sample, shape: d.shape || null };
    out.stock = Object.fromEntries(out.sizes.map(s => [s, d.stock[s] ?? 0]));
    if (id !== 'new') out.id = id;
    upsertProduct(out); closeModal(); toast(id === 'new' ? 'Product added' : 'Product updated'); done();
  });
}

/* ---------- categories ---------- */
function categories() {
  return `<div class="ad-bar"><h2>Categories</h2><button class="btn primary" data-cat="new">${icon('plus', 16)} Add category</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Used for</th><th>Products</th><th></th></tr></thead><tbody>${S.categories.map(c => `<tr><td><b>${esc(c.name)}</b></td><td>${{ top: 'Top (matches with bottoms)', bottom: 'Bottom (matches with tops)', shoes: 'Shoes', outer: 'Jackets and layers', accessory: 'Accessories' }[c.group]}</td><td>${S.products.filter(p => p.category === c.id).length}</td><td class="row gap"><button class="icon-btn sm" data-cat="${c.id}" aria-label="Edit ${esc(c.name)}">${icon('edit', 18)}</button><button class="icon-btn sm" data-delcat="${c.id}" aria-label="Delete ${esc(c.name)}">${icon('trash', 18)}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function catModal(id, done) {
  const c = id === 'new' ? { name: '', group: 'top' } : cat(id);
  const el = openModal(`<h2>${id === 'new' ? 'Add category' : 'Edit category'}</h2><form id="cf" novalidate><label class="fld"><span>Name</span><input name="name" value="${esc(c.name)}" required><em class="ferr" data-for="name"></em></label>
  <label class="fld"><span>Behaves like</span><select name="group">${[['top', 'Top (T-shirts, shirts)'], ['bottom', 'Bottom (jeans, trousers, shorts)'], ['shoes', 'Shoes'], ['outer', 'Jackets and layers'], ['accessory', 'Accessories']].map(([v, t]) => `<option value="${v}" ${c.group === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
  <p class="muted sm">This decides how Find Your Match and Build Your Outfit treat products in the category.</p><button class="btn primary block">Save category</button></form>`);
  $('#cf', el).addEventListener('submit', e => { e.preventDefault(); const f = e.target; const name = f.name.value.trim(); if (!name) { $('.ferr', f).textContent = 'Enter a category name'; return; } if (id === 'new') S.categories.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + rid('').slice(0, 3), name, group: f.group.value }); else { c.name = name; c.group = f.group.value; } save(); closeModal(); toast('Category saved'); done(); });
}

/* ---------- outfits & bundle discount ---------- */
function outfits() {
  const b = S.settings.bundle, ex = bundlePrice([{ price: 500 }, { price: 800 }, { price: 700 }].map((x, i) => ({ ...x, category: ['tshirts', 'trousers', 'shoes'][i], salePrice: null })));
  return `<div class="co-card"><h2>Complete-outfit discount</h2><p class="muted">Applies automatically when a customer chooses a top, a bottom and shoes.</p>
  <form id="bf" class="row gap wrap-s center-y"><label class="fld"><span>Discount type</span><select name="type"><option value="percent" ${b.type === 'percent' ? 'selected' : ''}>Percentage off</option><option value="flat" ${b.type === 'flat' ? 'selected' : ''}>Flat amount off (₹)</option></select></label><label class="fld"><span>${b.type === 'percent' ? 'Percent' : 'Amount (₹)'}</span><input name="value" type="number" min="0" max="${b.type === 'percent' ? 90 : 100000}" value="${b.value}"></label><button class="btn primary">Save discount</button></form>
  <p class="note">${icon('info', 16)} Example: ₹500 + ₹800 + ₹700 = ₹2,000 → discount ${inr(b.type === 'percent' ? 2000 * b.value / 100 : Math.min(b.value, 2000))} → customer pays <b>${inr(2000 - (b.type === 'percent' ? Math.round(2000 * b.value / 100) : Math.min(b.value, 2000)))}</b></p></div>
  <div class="ad-bar"><h2>Curated outfits (shown on the homepage)</h2><button class="btn primary" data-outfit="new">${icon('plus', 16)} Create outfit</button></div>
  ${S.outfits.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Outfit</th><th>Pieces</th><th>Price</th><th></th></tr></thead><tbody>${S.outfits.map(o => { const ps = o.items.map(product).filter(Boolean), bp = bundlePrice(ps, o.override); return `<tr><td><b>${esc(o.name)}</b><br><span class="muted sm">${esc(o.note || '')}</span></td><td class="sm">${ps.map(p => esc(p.name)).join(', ')}</td><td><s class="muted">${inr(bp.original)}</s> <b>${inr(bp.final)}</b>${o.override ? '<br><span class="muted sm">custom discount</span>' : ''}</td><td class="row gap"><button class="icon-btn sm" data-outfit="${o.id}" aria-label="Edit ${esc(o.name)}">${icon('edit', 18)}</button><button class="icon-btn sm" data-deloutfit="${o.id}" aria-label="Delete ${esc(o.name)}">${icon('trash', 18)}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">No curated outfits yet.</p>'}`;
}
function outfitModal(id, done) {
  const o = id === 'new' ? { name: '', note: '', items: [], override: null } : structuredClone(S.outfits.find(x => x.id === id));
  const el = openModal('', { wide: true }), body = el.querySelector('.modal');
  const draw = () => {
    body.querySelector('form')?.remove();
    const ps = o.items.map(product).filter(Boolean), bp = bundlePrice(ps, o.override);
    body.insertAdjacentHTML('beforeend', `<form id="of" novalidate><h2>${id === 'new' ? 'Create outfit' : 'Edit outfit'}</h2><div class="two"><label class="fld"><span>Outfit name</span><input name="name" value="${esc(o.name)}"><em class="ferr" data-for="name"></em></label><label class="fld"><span>Short note</span><input name="note" value="${esc(o.note || '')}"></label></div>
      <div class="row gap wrap-s center-y"><label class="check"><input type="checkbox" name="ov" ${o.override ? 'checked' : ''}><span>Use a custom discount for this outfit</span></label>${o.override ? `<select name="otype"><option value="percent" ${o.override.type === 'percent' ? 'selected' : ''}>%</option><option value="flat" ${o.override.type === 'flat' ? 'selected' : ''}>₹</option></select><input name="oval" type="number" min="0" value="${o.override.value}" class="mini-in">` : ''}</div>
      <p class="lbl">Choose pieces (${o.items.length} selected)</p><div class="tiles sm-tiles">${S.products.map(p => `<button type="button" class="tile ${o.items.includes(p.id) ? 'on' : ''}" data-toggle="${p.id}"><div class="art">${art(p, p.colors[0].hex)}</div><b>${esc(p.name)}</b><span>${inr(price(p))}</span></button>`).join('')}</div>
      <div class="note">Price: <s>${inr(bp.original)}</s> <b>${inr(bp.final)}</b> ${bp.complete ? `· saves ${inr(bp.discount)}` : '· add a top, bottom and shoes for the discount'}</div><button class="btn primary block">Save outfit</button></form>`);
  };
  draw();
  const pull = () => { const f = $('#of', body); o.name = f.name.value; o.note = f.note.value; const ov = f.ov.checked; if (!ov) o.override = null; else o.override = { type: f.otype?.value || o.override?.type || 'percent', value: +(f.oval?.value ?? o.override?.value ?? 10) }; if (ov && !f.otype) o.override = o.override || { type: 'percent', value: 10 }; };
  body.addEventListener('click', e => { const b = e.target.closest('[data-toggle]'); if (!b) return; pull(); const p = b.dataset.toggle; o.items = o.items.includes(p) ? o.items.filter(x => x !== p) : [...o.items, p]; draw(); });
  body.addEventListener('change', e => { if (['ov', 'otype', 'oval'].includes(e.target.name)) { pull(); if (e.target.name === 'ov' && e.target.checked && !o.override) o.override = { type: 'percent', value: 10 }; draw(); } });
  body.addEventListener('submit', e => { e.preventDefault(); pull(); if (!o.name.trim()) { $('.ferr', body).textContent = 'Enter an outfit name'; return; } if (o.items.length < 2) return toast('Choose at least two pieces', 'err'); if (id === 'new') S.outfits.push({ ...o, id: rid('o') }); else S.outfits[S.outfits.findIndex(x => x.id === id)] = o; save(); closeModal(); toast('Outfit saved'); done(); });
}

/* ---------- orders ---------- */
function orders() {
  const list = S.orders.filter(o => !ordFilter || o.status === ordFilter);
  return `<div class="ad-bar"><h2>Orders</h2><div class="chips"><button class="chip ${!ordFilter ? 'on' : ''}" data-ofil="">All (${S.orders.length})</button>${[...STATUSES, 'Cancelled'].map(s => `<button class="chip ${ordFilter === s ? 'on' : ''}" data-ofil="${s}">${s}</button>`).join('')}</div></div>
  ${list.length ? list.map(o => `<details class="co-card ord"><summary><span><b>${esc(o.id)}</b> · ${esc(o.customer)}</span><span class="row gap center-y"><span class="muted sm">${fmtDate(o.createdAt)}</span><span class="status s-${o.status.replace(/\s/g, '').toLowerCase()}">${o.status}</span><b>${inr(o.totals.total)}</b></span></summary>
    <div class="ord-b"><div><h3>Items</h3><ul class="parts">${o.lines.map(l => `<li><span>${esc(l.name)}${l.type === 'item' ? ` · ${esc(l.color)} · ${esc(l.size)}` : ' · outfit bundle: ' + l.parts.map(p => esc(p.name) + ' (' + esc(p.size) + ')').join(', ')} × ${l.qty}</span><span>${inr(l.unit * l.qty)}</span></li>`).join('')}</ul>
      <p class="muted sm">Payment: ${o.payment.method === 'cod' ? 'Cash on delivery' : 'Online'} (${esc(o.payment.status)}) ${o.payment.ref ? '· ' + esc(o.payment.ref) : ''}</p></div>
      <div><h3>Customer</h3><p>${esc(o.address.name)}<br>${esc(o.address.line1)}, ${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.pin)}<br>${esc(o.address.phone)} · ${esc(o.email)}</p>
      <label class="fld"><span>Update status</span><select data-status="${o.id}">${[...STATUSES, 'Cancelled'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div></div></details>`).join('') : '<p class="muted">No orders in this view.</p>'}`;
}

function customers() {
  const cs = S.users.filter(u => u.role === 'customer');
  return `<h2>Customers</h2>${cs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Joined</th></tr></thead><tbody>${cs.map(u => { const os = S.orders.filter(o => o.userId === u.id && o.status !== 'Cancelled'); return `<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${esc(u.phone || '—')}</td><td>${os.length}</td><td>${inr(os.reduce((a, o) => a + o.totals.total, 0))}</td><td>${fmtDate(u.createdAt)}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">No customers yet.</p>'}`;
}

function coupons() {
  return `<div class="ad-bar"><h2>Coupons</h2><button class="btn primary" data-coupon="new">${icon('plus', 16)} Add coupon</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Offer</th><th>Minimum</th><th>Active</th><th></th></tr></thead><tbody>${S.coupons.map(c => `<tr><td><b>${esc(c.code)}</b></td><td>${c.type === 'percent' ? c.value + '% off' + (c.maxOff ? ' (max ' + inr(c.maxOff) + ')' : '') : c.type === 'flat' ? inr(c.value) + ' off' : 'Free shipping'}</td><td>${c.min ? inr(c.min) : '—'}</td><td><label class="toggle"><input type="checkbox" data-ctoggle="${c.code}" ${c.active ? 'checked' : ''} aria-label="Active"><i></i></label></td><td class="row gap"><button class="icon-btn sm" data-coupon="${c.code}" aria-label="Edit">${icon('edit', 18)}</button><button class="icon-btn sm" data-delcoupon="${c.code}" aria-label="Delete">${icon('trash', 18)}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function couponModal(code, done) {
  const c = code === 'new' ? { code: '', type: 'percent', value: 10, min: 0, maxOff: 0, active: true, note: '' } : { ...S.coupons.find(x => x.code === code) };
  const el = openModal(`<h2>${code === 'new' ? 'Add coupon' : 'Edit coupon'}</h2><form id="cpf" novalidate><label class="fld"><span>Code</span><input name="code" value="${esc(c.code)}" ${code !== 'new' ? 'readonly' : ''} style="text-transform:uppercase"><em class="ferr" data-for="code"></em></label>
  <div class="two"><label class="fld"><span>Type</span><select name="type"><option value="percent" ${c.type === 'percent' ? 'selected' : ''}>Percentage</option><option value="flat" ${c.type === 'flat' ? 'selected' : ''}>Flat amount</option><option value="ship" ${c.type === 'ship' ? 'selected' : ''}>Free shipping</option></select></label><label class="fld"><span>Value</span><input name="value" type="number" min="0" value="${c.value}"></label></div>
  <div class="two"><label class="fld"><span>Minimum order (₹)</span><input name="min" type="number" min="0" value="${c.min}"></label><label class="fld"><span>Max discount (₹, % only)</span><input name="maxOff" type="number" min="0" value="${c.maxOff}"></label></div>
  <label class="fld"><span>Description</span><input name="note" value="${esc(c.note || '')}"></label><button class="btn primary block">Save coupon</button></form>`);
  $('#cpf', el).addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, v = Object.fromEntries(new FormData(f)), cd = v.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,16}$/.test(cd)) { $('.ferr', f).textContent = 'Use 3–16 letters or numbers'; return; }
    if (code === 'new' && S.coupons.some(x => x.code === cd)) { $('.ferr', f).textContent = 'That code already exists'; return; }
    const out = { code: cd, type: v.type, value: +v.value || 0, min: +v.min || 0, maxOff: +v.maxOff || 0, active: c.active, note: v.note };
    if (code === 'new') S.coupons.push(out); else S.coupons[S.coupons.findIndex(x => x.code === code)] = out; save(); closeModal(); toast('Coupon saved'); done();
  });
}

function settings() {
  const s = S.settings, sh = s.shipping;
  return `<h2>Store settings</h2><form id="sf" class="co-card" novalidate><div class="two"><label class="fld"><span>Brand name</span><input name="brandName" value="${esc(s.brandName)}"></label><label class="fld"><span>Tagline</span><input name="tagline" value="${esc(s.tagline)}"></label></div>
  <div class="two"><label class="fld"><span>Contact email</span><input name="contactEmail" value="${esc(s.contactEmail)}"></label><label class="fld"><span>Phone</span><input name="phone" value="${esc(s.phone)}"></label></div>
  <label class="fld"><span>City / address line</span><input name="city" value="${esc(s.city)}"></label>
  <div class="two"><label class="fld"><span>Shipping charge (₹)</span><input name="flat" type="number" min="0" value="${sh.flat}"></label><label class="fld"><span>Free shipping above (₹)</span><input name="freeAbove" type="number" min="0" value="${sh.freeAbove}"></label></div>
  <div class="two"><label class="fld"><span>Express delivery extra (₹)</span><input name="expressExtra" type="number" min="0" value="${sh.expressExtra}"></label><label class="fld"><span>COD fee (₹)</span><input name="codFee" type="number" min="0" value="${sh.codFee}"></label></div>
  <div class="two">${['instagram', 'facebook', 'x', 'youtube'].map(k => `<label class="fld"><span>${k[0].toUpperCase() + k.slice(1)} link</span><input name="soc_${k}" value="${esc(s.social[k] || '')}" placeholder="https://"></label>`).join('')}</div><button class="btn primary">Save settings</button></form>
  <div class="co-card"><h2>Backup and data</h2><p class="muted">In this prototype your data is stored in this browser. Download a backup before clearing browser data or switching device.</p><div class="row gap wrap-s"><button class="btn ghost" id="bk-dl">Download backup</button><label class="btn ghost">Restore backup<input type="file" id="bk-up" accept="application/json" hidden></label></div></div>
  <div class="co-card danger"><h2>Sample data</h2><p class="muted">Ready to go live with your own products? Remove every sample product, outfit and demo order in one step. Your categories, settings, coupons and own products stay.</p><div class="row gap wrap-s"><button class="btn ghost" id="rm-sample">Remove all sample data</button><button class="btn text" id="reset-all">Reset everything to demo</button></div></div>`;
}

const BODY = { overview, products, categories, outfits, orders, customers, coupons, settings };

export default {
  title: () => 'Admin',
  render(ctx) {
    if (!isAdmin()) return `<section class="wrap narrow">${empty('Admin access only', me() ? 'Your account does not have admin access.' : 'Sign in with an admin account to manage the store.', `<a class="btn primary" href="#/login?next=admin">${me() ? 'Switch account' : 'Sign in'}</a>`)}</section>`;
    tab = BODY[ctx.params[0]] ? ctx.params[0] : 'overview';
    return `<div class="admin"><aside class="ad-side"><p class="ad-brand">${esc(S.settings.brandName)} <em>Admin</em></p><nav aria-label="Admin">${TABS.map(([k, t, i]) => `<a href="#/admin/${k}" class="${tab === k ? 'on' : ''}">${icon(i, 18)}<span>${t}</span></a>`).join('')}</nav><a class="ad-back" href="#/">${icon('arrowL', 16)} View storefront</a></aside><main class="ad-main" id="ad-main"><h1 class="sr">${tab}</h1><div id="ad-body">${BODY[tab]()}</div></main></div>`;
  },
  mount(root) {
    if (!isAdmin()) return;
    const host = $('#ad-body', root), draw = () => { const y = scrollY; host.innerHTML = BODY[tab](); scrollTo(0, y); wireChart(); };
    const wireChart = () => $$('.chart', host).forEach(c => { const tip = $('.tip', c); c.addEventListener('mousemove', e => { const g = e.target.closest('.bar-g'); if (!g) { tip.hidden = true; return; } const r = c.getBoundingClientRect(); tip.textContent = g.dataset.tip; tip.hidden = false; tip.style.left = Math.min(e.clientX - r.left + 12, r.width - 140) + 'px'; tip.style.top = (e.clientY - r.top - 34) + 'px'; }); c.addEventListener('mouseleave', () => { tip.hidden = true; }); });
    wireChart();
    root.addEventListener('click', async e => {
      const t = e.target; let b;
      if ((b = t.closest('[data-prod]'))) productModal(b.dataset.prod, draw);
      else if ((b = t.closest('[data-delprod]'))) { const p = product(b.dataset.delprod); if (confirm(`Delete “${p.name}”? This cannot be undone.`)) { deleteProduct(p.id); toast('Product deleted'); draw(); } }
      else if ((b = t.closest('[data-cat]'))) catModal(b.dataset.cat, draw);
      else if ((b = t.closest('[data-delcat]'))) { const c = cat(b.dataset.delcat); if (S.products.some(p => p.category === c.id)) return toast('Move or delete this category’s products first', 'err'); if (confirm(`Delete category “${c.name}”?`)) { S.categories = S.categories.filter(x => x.id !== c.id); save(); toast('Category deleted'); draw(); } }
      else if ((b = t.closest('[data-outfit]'))) outfitModal(b.dataset.outfit, draw);
      else if ((b = t.closest('[data-deloutfit]'))) { if (confirm('Delete this outfit?')) { S.outfits = S.outfits.filter(x => x.id !== b.dataset.deloutfit); save(); draw(); } }
      else if ((b = t.closest('[data-ofil]'))) { ordFilter = b.dataset.ofil; draw(); }
      else if ((b = t.closest('[data-coupon]'))) couponModal(b.dataset.coupon, draw);
      else if ((b = t.closest('[data-delcoupon]'))) { if (confirm('Delete this coupon?')) { S.coupons = S.coupons.filter(x => x.code !== b.dataset.delcoupon); save(); draw(); } }
      else if (t.closest('#bk-dl')) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'store-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); }
      else if (t.closest('#rm-sample')) { if (confirm('Remove all sample products, outfits and demo orders?')) { removeSampleData(); toast('Sample data removed. Add your own products to get started.'); draw(); } }
      else if (t.closest('#reset-all')) { if (confirm('Reset the whole store to the demo data? Your changes will be lost.')) { await resetAll(); toast('Demo data restored'); draw(); } }
    });
    root.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.status) { setOrderStatus(t.dataset.status, t.value); toast(`Order ${t.dataset.status} marked ${t.value}`); }
      else if (t.dataset.ctoggle) { S.coupons.find(c => c.code === t.dataset.ctoggle).active = t.checked; save(); toast(t.checked ? 'Coupon activated' : 'Coupon paused'); }
      else if (t.id === 'pcat') { prodCat = t.value; draw(); }
      else if (t.id === 'bk-up') { const f = t.files[0]; if (!f) return; f.text().then(txt => { try { const j = JSON.parse(txt); if (!Array.isArray(j.products) || !Array.isArray(j.users)) throw 0; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, j); save(); toast('Backup restored'); location.reload(); } catch (err) { toast('That file is not a valid backup', 'err'); } }); }
      else if (t.closest('#bf') && t.name === 'type') { const f = t.form; S.settings.bundle = { type: t.value, value: t.value === 'percent' ? 10 : 200 }; save(); draw(); }
    });
    root.addEventListener('input', e => { if (e.target.id === 'pq') { prodQ = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#pq', root); i.focus(); i.setSelectionRange(pos, pos); } });
    root.addEventListener('submit', e => {
      const f = e.target;
      if (f.id === 'bf') { e.preventDefault(); const v = +f.value.value; if (!(v >= 0)) return; S.settings.bundle = { type: f.type.value, value: f.type.value === 'percent' ? Math.min(90, v) : v }; save(); toast('Bundle discount updated'); draw(); }
      else if (f.id === 'sf') { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); Object.assign(S.settings, { brandName: d.brandName.trim() || S.settings.brandName, tagline: d.tagline.trim(), contactEmail: d.contactEmail.trim(), phone: d.phone.trim(), city: d.city.trim() }); S.settings.shipping = { flat: +d.flat || 0, freeAbove: +d.freeAbove || 0, expressExtra: +d.expressExtra || 0, codFee: +d.codFee || 0 }; S.settings.social = { instagram: d.soc_instagram, facebook: d.soc_facebook, x: d.soc_x, youtube: d.soc_youtube }; save(); toast('Settings saved'); }
    });
  },
};
