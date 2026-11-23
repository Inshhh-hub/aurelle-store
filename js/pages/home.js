import { S, byGroup, product, price, inr, colorOf, bundlePrice, groupOf, totalStock } from '../store.js';
import { esc, icon, productCard, art, stars, $, $$, swatch, go, toast } from '../ui.js';
import { outfitArt } from '../garments.js';
import { pairScore, asItem, recommend, pct } from '../match.js';
import { confirmBundle, hold } from '../bundle.js';
import { COLLECTIONS, SEED_REVIEWS } from '../data.js';

const stock = p => totalStock(p) > 0;
let studio = null;

function pool(g) { return byGroup(...g).filter(stock); }
function initStudio() {
  const tops = pool(['top']), bottoms = pool(['bottom']), shoes = pool(['shoes']);
  const pickTop = tops.find(p => p.isFeatured) || tops[0];
  const top = { p: pickTop, color: pickTop?.colors[0].name };
  studio = { top, bottom: null, shoes: null };
  autoFill('bottom'); autoFill('shoes');
}
function item(slot) { const s = studio[slot]; return s ? { p: s.p, hex: colorOf(s.p, s.color).hex } : null; }
function autoFill(slot) {
  const base = studio.top && slot !== 'top' ? item('top') : item('bottom');
  const group = slot === 'top' ? ['top'] : slot === 'bottom' ? ['bottom'] : ['shoes'];
  const cands = pool(group); if (!cands.length || !base) return;
  const r = recommend(asItem(base.p, base.hex), cands, { limit: 1 })[0];
  if (r) studio[slot] = { p: r.product, color: r.color.name };
}
function studioScore() {
  const a = item('top'), b = item('bottom'), c = item('shoes'); if (!a || !b) return 0;
  const s1 = pairScore(asItem(a.p, a.hex), asItem(b.p, b.hex)).score;
  const s2 = c ? pairScore(asItem(b.p, b.hex), asItem(c.p, c.hex)).score : s1;
  return pct((s1 + s2) / 2);
}
function studioHTML() {
  const slots = { top: item('top'), bottom: item('bottom'), shoes: item('shoes') };
  const ps = ['top', 'bottom', 'shoes'].map(k => studio[k]?.p).filter(Boolean);
  const bp = bundlePrice(ps);
  const row = (slot, label) => {
    const s = studio[slot]; if (!s) return '';
    return `<div class="st-row"><div class="st-h"><span class="lbl">${label}</span><div class="st-nav"><button data-st-prev="${slot}" aria-label="Previous ${label}">${icon('arrowL', 16)}</button><button data-st-next="${slot}" aria-label="Next ${label}">${icon('arrow', 16)}</button></div></div>
      <p class="st-name">${esc(s.p.name)}</p><div class="sws">${s.p.colors.map(c => swatch(c, { on: c.name === s.color, attrs: `data-st-color="${slot}" data-c="${esc(c.name)}"` })).join('')}</div></div>`;
  };
  return `<div class="studio-fig">${outfitArt(slots, S.categories, { empty: false, box: '8 22 244 470' })}</div>
  <div class="studio-ctl">${row('top', 'Top')}${row('bottom', 'Bottom')}${row('shoes', 'Shoes')}
    <div class="st-foot"><div><span class="muted sm">Colour harmony</span><b class="st-score">${studioScore()}%</b></div><div class="text-r"><span class="muted sm">Outfit price</span><div><s class="muted">${inr(bp.original)}</s> <b>${inr(bp.final)}</b></div>${bp.complete ? `<span class="pill ok">Save ${inr(bp.discount)}</span>` : ''}</div></div>
    <div class="row gap"><button class="btn ghost" data-st-shuffle>${icon('shuffle', 18)} Shuffle</button><button class="btn primary grow" data-st-open>Customise this outfit</button></div></div>`;
}

function cardsRow(list) { return list.map(p => productCard(p)).join(''); }

export default {
  title: () => 'Dress the whole look',
  render() {
    initStudio();
    const nw = [...S.products].filter(p => p.isNew && stock(p)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
    const tr = S.products.filter(p => p.isTrending && stock(p)).slice(0, 8);
    const outfits = S.outfits.map(o => ({ o, ps: o.items.map(product).filter(Boolean) })).filter(x => x.ps.length >= 2);
    const tops = pool(['top']);
    const demoTop = tops.find(p => p.name.includes('Oxford')) || tops[0];
    return `
<section class="hero"><div class="wrap hero-in">
  <div class="hero-copy"><p class="kicker">Independent label · Made in India</p>
    <h1>${esc(S.settings.tagline)}</h1>
    <p class="lead">Shop pieces, find what matches what you own, or build a full outfit and save when you wear it together. Every look is made from our own collection.</p>
    <div class="row gap wrap-m"><a class="btn primary lg" href="#/shop">Shop now</a><a class="btn ghost lg" href="#/build">Build an outfit</a></div>
    <ul class="hero-points"><li>${icon('layers', 18)} Outfit bundles save up to ${S.settings.bundle.type === 'percent' ? S.settings.bundle.value + '%' : inr(S.settings.bundle.value)}</li><li>${icon('camera', 18)} Upload a photo, get matches</li><li>${icon('truck', 18)} Free delivery over ${inr(S.settings.shipping.freeAbove)}</li></ul></div>
  <div class="studio" id="studio" aria-label="Interactive outfit studio"><div class="studio-tag">Try it: change colours, swap pieces</div><div class="studio-in" id="studio-in">${studioHTML()}</div></div>
</div></section>

<section class="sec"><div class="wrap"><div class="sec-h"><h2>Four ways to shop</h2><p class="muted">This is more than a rail of clothes.</p></div>
<div class="ways">
  <a class="way" href="#/shop"><span class="way-ico">${icon('tag', 22)}</span><h3>Shop the collection</h3><p>Browse tees, shirts, denim, trousers, jackets, shoes and accessories.</p><span class="way-go">Start browsing ${icon('arrow', 16)}</span></a>
  <a class="way" href="#/match"><span class="way-ico">${icon('sparkle', 22)}</span><h3>Find your match</h3><p>Pick one piece and see what goes with it, ranked by colour and style.</p><span class="way-go">Find a match ${icon('arrow', 16)}</span></a>
  <a class="way" href="#/build"><span class="way-ico">${icon('layers', 22)}</span><h3>Build your outfit</h3><p>Choose a top, bottom and shoes. Complete the look and the price drops.</p><span class="way-go">Start building ${icon('arrow', 16)}</span></a>
  <a class="way" href="#/upload"><span class="way-ico">${icon('camera', 22)}</span><h3>Upload and match</h3><p>Snap what you already own and we'll suggest pieces from our range.</p><span class="way-go">Upload a photo ${icon('arrow', 16)}</span></a>
</div></div></section>

<section class="sec tight"><div class="wrap"><div class="sec-h row between"><h2>New arrivals</h2><div class="row gap"><button class="icon-btn ring" data-scroll="-1" aria-label="Scroll left">${icon('arrowL')}</button><button class="icon-btn ring" data-scroll="1" aria-label="Scroll right">${icon('arrow')}</button></div></div>
<div class="rail" id="rail">${cardsRow(nw)}</div></div></section>

<section class="sec band"><div class="wrap split">
  <div class="split-copy"><p class="kicker">Find Your Match</p><h2>Pick one piece. We'll pair the rest.</h2><p class="lead">Choose a shirt or tee, and see trousers, jeans and shorts that suit it, scored on colour, pattern and occasion.</p>
    <a class="btn primary" href="#/match">Try Find Your Match</a></div>
  <div class="mini-match" id="mini-match" data-id="${demoTop?.id}"></div>
</div></section>

<section class="sec"><div class="wrap"><div class="sec-h row between"><h2>Trending now</h2><a class="link" href="#/shop?sort=popular">View all</a></div>
<div class="grid g4">${cardsRow(tr)}</div></div></section>

<section class="sec band"><div class="wrap">
  <div class="sec-h center"><p class="kicker">Build Your Outfit</p><h2>Complete outfit, special price</h2><p class="muted narrow-text">Add a top, a bottom and shoes and the discount applies automatically. The more you see together, the easier it is to choose.</p></div>
  <div class="offers">${outfits.map(({ o, ps }) => {
    const bp = bundlePrice(ps, o.override);
    const slots = { top: null, bottom: null, shoes: null, accessories: [] };
    ps.forEach(p => { const g = groupOf(p), it = { p, hex: p.colors[0].hex }; if (g === 'top') slots.top = it; else if (g === 'bottom') slots.bottom = it; else if (g === 'shoes') slots.shoes = it; else slots.accessories.push(it); });
    return `<article class="offer"><div class="offer-art">${outfitArt(slots, S.categories, { empty: false })}</div><div class="offer-b"><h3>${esc(o.name)}</h3><p class="muted">${esc(o.note)}</p>
      <ul class="offer-items">${ps.map(p => `<li><a href="#/product/${p.id}">${esc(p.name)}</a><span>${inr(price(p))}</span></li>`).join('')}</ul>
      <div class="row between"><div><s class="muted">${inr(bp.original)}</s> <b class="big">${inr(bp.final)}</b></div>${bp.complete ? `<span class="pill ok">Save ${inr(bp.discount)} (${bp.pct}%)</span>` : ''}</div>
      <div class="row gap"><button class="btn primary grow" data-offer-add="${o.id}">Add outfit to cart</button><a class="btn ghost" href="#/build?${o.items.map(id => { const p = product(id); return p ? groupOf(p) + '=' + id + ':' + encodeURIComponent(p.colors[0].name) : ''; }).filter(Boolean).join('&').replace(/outer=/g, 'acc=').replace(/accessory=/g, 'acc=')}">Customise</a></div></div></article>`;
  }).join('') || '<p class="muted center">Create outfit bundles in the admin dashboard and they appear here.</p>'}</div>
  <div class="center mt"><a class="btn ghost lg" href="#/build">Build your own</a></div>
</div></section>

<section class="sec"><div class="wrap"><div class="sec-h"><h2>Featured collections</h2></div>
<div class="colls">${COLLECTIONS.map(c => {
    const ps = S.products.filter(p => (p.tags || []).includes(c.tag)).slice(0, 3);
    return `<a class="coll" href="#/shop?tag=${c.tag}"><div class="coll-art">${ps.map((p, i) => `<div class="art" style="--i:${i}">${art(p, p.colors[0].hex)}</div>`).join('')}</div><div class="coll-b"><h3>${esc(c.name)}</h3><p class="muted">${esc(c.blurb)}</p><span class="way-go">Explore ${icon('arrow', 16)}</span></div></a>`;
  }).join('')}</div></div></section>

<section class="sec band"><div class="wrap split rev">
  <div class="drop home-drop" id="home-drop" tabindex="0" role="button" aria-label="Upload a photo of clothing you own"><input type="file" accept="image/*" id="home-file" hidden>
    <div class="drop-ico">${icon('upload', 28)}</div><b>Drop a photo here</b><p class="muted">or click to choose one. Trousers, shirts, tees or shoes all work.</p></div>
  <div class="split-copy"><p class="kicker">Upload & Match</p><h2>Show us what's already in your wardrobe</h2><p class="lead">We read the colour, pattern and type from your photo, then suggest pieces from our collection that go with it.</p><a class="btn primary" href="#/upload">Open Upload & Match</a></div>
</div></section>

<section class="sec"><div class="wrap"><div class="sec-h center"><h2>What customers say</h2></div>
<div class="reviews" id="reviews"></div></div></section>

<section class="sec news"><div class="wrap narrow center"><h2>Join the list</h2><p class="muted">New drops and outfit ideas, once or twice a month. No spam.</p>
<form data-newsletter class="news-form" novalidate><label class="sr" for="nl">Email address</label><input id="nl" name="email" type="email" placeholder="you@example.com" required autocomplete="email"><button class="btn primary">Subscribe</button></form></div></section>`;
  },

  mount(root) {
    const stIn = $('#studio-in', root);
    const redraw = () => { stIn.innerHTML = studioHTML(); };
    const cycle = (slot, d) => {
      const list = pool([slot]); const i = list.findIndex(p => p.id === studio[slot].p.id);
      const p = list[(i + d + list.length) % list.length]; studio[slot] = { p, color: p.colors[0].name };
      if (slot === 'top') { autoFill('bottom'); autoFill('shoes'); }
      redraw();
    };
    root.addEventListener('click', e => {
      const t = e.target;
      let b;
      if ((b = t.closest('[data-st-prev]'))) return cycle(b.dataset.stPrev, -1);
      if ((b = t.closest('[data-st-next]'))) return cycle(b.dataset.stNext, 1);
      if ((b = t.closest('[data-st-color]'))) { studio[b.dataset.stColor].color = b.dataset.c; redraw(); return; }
      if (t.closest('[data-st-shuffle]')) {
        const tops = pool(['top']), p = tops[Math.floor(Math.random() * tops.length)];
        studio.top = { p, color: p.colors[Math.floor(Math.random() * p.colors.length)].name };
        autoFill('bottom'); autoFill('shoes'); redraw(); return;
      }
      if (t.closest('[data-st-open]')) { go('/build?' + ['top', 'bottom', 'shoes'].map(k => studio[k] ? `${k}=${studio[k].p.id}:${encodeURIComponent(studio[k].color)}` : '').filter(Boolean).join('&')); return; }
      if ((b = t.closest('[data-scroll]'))) { const r = $('#rail', root); r.scrollBy({ left: b.dataset.scroll * r.clientWidth * 0.8, behavior: 'smooth' }); return; }
      if ((b = t.closest('[data-offer-add]'))) {
        const o = S.outfits.find(x => x.id === b.dataset.offerAdd);
        confirmBundle({ name: o.name, picks: o.items.map(id => ({ productId: id, color: product(id).colors[0].name })), override: o.override });
        return;
      }
      if ((b = t.closest('[data-mm-color]'))) { mm.color = b.dataset.mmColor; drawMini(); return; }
    });

    // mini match demo
    const mini = $('#mini-match', root);
    const mm = { id: mini?.dataset.id, color: null };
    function drawMini() {
      const p = product(mm.id); if (!p || !mini) return;
      mm.color ||= p.colors[0].name;
      const c = colorOf(p, mm.color);
      const recs = recommend(asItem(p, c.hex), byGroup('bottom').filter(stock), { limit: 3 });
      mini.innerHTML = `<div class="mm-pick"><div class="art">${art(p, c.hex)}</div><div><b>${esc(p.name)}</b><div class="sws">${p.colors.map(x => swatch(x, { on: x.name === mm.color, attrs: `data-mm-color="${esc(x.name)}"` })).join('')}</div><p class="muted sm">Colour: ${esc(c.name)}</p></div></div>
      <div class="mm-recs">${recs.map(r => `<a class="mm-rec" href="#/product/${r.product.id}?c=${encodeURIComponent(r.color.name)}"><div class="art">${art(r.product, r.color.hex)}</div><b>${esc(r.product.name)}</b><span class="pill">${pct(r.score)}%</span></a>`).join('')}</div>`;
    }
    drawMini();

    // reviews carousel
    const rv = $('#reviews', root); let ri = 0, timer;
    const drawRev = () => {
      const R = SEED_REVIEWS;
      rv.innerHTML = `<div class="rev-card"><div class="stars-l">${stars(R[ri].stars)}</div><blockquote>${esc(R[ri].text)}</blockquote><p><b>${esc(R[ri].name)}</b> · ${esc(R[ri].city)}</p></div><div class="dots">${R.map((_, i) => `<button class="dot ${i === ri ? 'on' : ''}" data-rev="${i}" aria-label="Review ${i + 1}"></button>`).join('')}</div>`;
    };
    drawRev(); timer = setInterval(() => { ri = (ri + 1) % SEED_REVIEWS.length; drawRev(); }, 6000);
    rv.addEventListener('click', e => { const d = e.target.closest('[data-rev]'); if (d) { ri = +d.dataset.rev; drawRev(); clearInterval(timer); } });

    // upload drop on home
    const drop = $('#home-drop', root), file = $('#home-file', root);
    const take = f => { if (!f || !f.type.startsWith('image/')) return toast('Please choose an image file', 'err'); hold.file = f; go('/upload'); };
    drop.addEventListener('click', () => file.click());
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    file.addEventListener('change', () => take(file.files[0]));
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));

    // hero tilt
    const st = $('#studio', root);
    const mv = e => { const r = st.getBoundingClientRect(); st.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -3 + 'deg'); st.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 3 + 'deg'); };
    st.addEventListener('mousemove', mv); st.addEventListener('mouseleave', () => { st.style.setProperty('--rx', '0deg'); st.style.setProperty('--ry', '0deg'); });
    return () => clearInterval(timer);
  },
};
