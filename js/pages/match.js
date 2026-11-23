import { S, byGroup, product, price, inr, colorOf, groupOf, cat, totalStock } from '../store.js';
import { esc, icon, art, swatch, quickAdd, $, $$, empty } from '../ui.js';
import { outfitArt } from '../garments.js';
import { recommend, asItem, pct } from '../match.js';
import { confirmBundle } from '../bundle.js';

const OCC = [['', 'Any occasion'], ['casual', 'Casual'], ['smart', 'Smart casual'], ['formal', 'Formal'], ['party', 'Evening'], ['sport', 'Active']];
const st = { mode: 'top', id: null, color: null, occ: '', catf: '', preview: null };
const stock = p => totalStock(p) > 0;

export default {
  title: () => 'Find Your Match',
  render(ctx) {
    const p0 = product(ctx.query.id);
    if (p0 && ['top', 'bottom'].includes(groupOf(p0))) { st.mode = groupOf(p0); st.id = p0.id; st.color = ctx.query.c || p0.colors[0].name; st.preview = null; st.occ = ''; st.catf = ''; }
    return `<section class="wrap match"><div class="page-h"><p class="kicker">Find Your Match</p><h1>What are you wearing it with?</h1><p class="lead narrow-text">Choose one piece. We'll rank everything from our collection that goes with it.</p></div>
    <div class="tabs big" role="tablist" aria-label="Match direction"><button role="tab" data-mode="top" class="${st.mode === 'top' ? 'on' : ''}" aria-selected="${st.mode === 'top'}">${icon('shirt', 20)} Find a match for your top</button><button role="tab" data-mode="bottom" class="${st.mode === 'bottom' ? 'on' : ''}" aria-selected="${st.mode === 'bottom'}">${icon('layers', 20)} Find a match for your bottom</button></div>
    <div class="match-grid"><div class="m-left" id="m-left"></div><div class="m-right" id="m-right"></div></div></section>`;
  },
  mount(root) {
    const left = $('#m-left', root), right = $('#m-right', root);
    const pool = () => byGroup(st.mode).filter(stock);
    const cur = () => { const p = product(st.id); return p && groupOf(p) === st.mode ? p : null; };

    function drawLeft() {
      const p = cur(), ps = pool(), cats = [...new Set(ps.map(x => x.category))];
      const shown = ps.filter(x => !st.catf || x.category === st.catf);
      left.innerHTML = `<h2 class="step"><span>1</span> Choose your ${st.mode}</h2>
      <div class="chips"><button class="chip ${!st.catf ? 'on' : ''}" data-catf="">All</button>${cats.map(c => `<button class="chip ${st.catf === c ? 'on' : ''}" data-catf="${c}">${esc(cat(c)?.name)}</button>`).join('')}</div>
      <div class="picker">${shown.map(x => `<button class="pick ${p?.id === x.id ? 'on' : ''}" data-pick="${x.id}" aria-pressed="${p?.id === x.id}"><div class="art">${art(x, x.colors[0].hex)}</div><span>${esc(x.name)}</span><em>${inr(price(x))}</em></button>`).join('')}</div>`;
    }

    function stageArt(p, c) {
      if (st.preview) {
        const r = st.preview, slots = st.mode === 'top' ? { top: { p, hex: c.hex }, bottom: { p: r.product, hex: r.color.hex } } : { top: { p: r.product, hex: r.color.hex }, bottom: { p, hex: c.hex } };
        return `<div class="stage-pair">${outfitArt({ ...slots, shoes: null }, S.categories, { empty: false }).replace('viewBox="0 0 300 500"', 'viewBox="0 20 300 400"')}</div>`;
      }
      return `<div class="stage-single art">${art(p, c.hex)}</div>`;
    }

    function drawRight() {
      const p = cur();
      if (!p) { right.innerHTML = `<div class="m-empty">${icon('sparkle', 30)}<h2>Pick a ${st.mode} to begin</h2><p class="muted">Your matches will appear here, best first.</p></div>`; return; }
      const c = colorOf(p, st.color);
      const targets = st.mode === 'top' ? ['bottom'] : ['top'];
      let recs = recommend(asItem(p, c.hex), byGroup(...targets), { occasion: st.occ || null, limit: 24 });
      const rc = [...new Set(recs.map(r => r.product.category))];
      if (st.recCat) recs = recs.filter(r => r.product.category === st.recCat);
      right.innerHTML = `<h2 class="step"><span>2</span> Your match</h2>
      <div class="stage"><div class="stage-view" id="stage">${stageArt(p, c)}</div>
        <div class="stage-info"><p class="muted">${st.preview ? 'Previewing pair' : 'You chose'}</p><h3>${esc(p.name)}</h3><p class="price"><b>${inr(price(p))}</b></p>
        <p class="lbl">Colour: <b>${esc(c.name)}</b></p><div class="sws">${p.colors.map(x => swatch(x, { on: x.name === c.name, attrs: `data-mcolor="${esc(x.name)}"` })).join('')}</div>
        <div class="row gap wrap-s mt-s"><button class="btn ghost" data-qa="${p.id}" data-c="${esc(c.name)}">Add this to cart</button><a class="btn ghost" href="#/product/${p.id}?c=${encodeURIComponent(c.name)}">View details</a><button class="btn text" data-change>Change selection</button></div>
        ${st.preview ? `<button class="btn text" data-clear-preview>${icon('close', 16)} Back to single item</button>` : ''}</div></div>
      <div class="rec-filters"><div class="chips" aria-label="Occasion">${OCC.map(([v, t]) => `<button class="chip ${st.occ === v ? 'on' : ''}" data-occ="${v}">${t}</button>`).join('')}</div>
        ${rc.length > 1 ? `<div class="chips"><button class="chip ${!st.recCat ? 'on' : ''}" data-reccat="">All</button>${rc.map(x => `<button class="chip ${st.recCat === x ? 'on' : ''}" data-reccat="${x}">${esc(cat(x)?.name)}</button>`).join('')}</div>` : ''}</div>
      ${recs.length ? `<p class="muted" aria-live="polite">${recs.length} ${recs.length === 1 ? 'match' : 'matches'}, best first. Select one to preview the pair.</p><div class="recs">${recs.map((r, i) => {
        const sel = st.preview?.product.id === r.product.id && st.preview?.color.name === r.color.name;
        return `<article class="rec ${sel ? 'on' : ''}" style="--d:${Math.min(i, 8) * 40}ms"><button class="rec-art" data-preview="${r.product.id}" data-pc="${esc(r.color.name)}" aria-label="Preview ${esc(r.product.name)} with your ${esc(p.name)}"><div class="art">${art(r.product, r.color.hex)}</div><span class="ring" style="--p:${pct(r.score)}"><b>${pct(r.score)}</b></span></button>
        <div class="rec-b"><a class="name" href="#/product/${r.product.id}?c=${encodeURIComponent(r.color.name)}">${esc(r.product.name)}</a><p class="muted sm">in ${esc(r.color.name)} · ${inr(price(r.product))}</p>
        <ul class="why">${r.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="row gap"><button class="btn primary sm grow" data-qa="${r.product.id}" data-c="${esc(r.color.name)}">Add to cart</button><button class="btn ghost sm" data-pair="${r.product.id}" data-pc="${esc(r.color.name)}" title="Add both pieces">Add both</button></div></div></article>`;
      }).join('')}</div>` : empty('No matches for that filter', 'Try another occasion or category.', '<button class="btn primary" data-occ="">Show all matches</button>')}`;
    }

    function drawAll() { drawLeft(); drawRight(); }
    drawAll();

    root.addEventListener('click', e => {
      const t = e.target; let b;
      if ((b = t.closest('[data-mode]'))) { st.mode = b.dataset.mode; st.id = null; st.preview = null; st.catf = ''; st.recCat = ''; $$('.tabs [data-mode]', root).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); }); drawAll(); }
      else if ((b = t.closest('[data-catf]'))) { st.catf = b.dataset.catf; drawLeft(); }
      else if ((b = t.closest('[data-pick]'))) { st.id = b.dataset.pick; st.color = product(st.id).colors[0].name; st.preview = null; st.recCat = ''; drawAll(); if (innerWidth < 900) $('#m-right', root).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if ((b = t.closest('[data-mcolor]'))) { st.color = b.dataset.mcolor; st.preview = null; drawRight(); }
      else if ((b = t.closest('[data-occ]'))) { st.occ = b.dataset.occ; st.preview = null; drawRight(); }
      else if ((b = t.closest('[data-reccat]'))) { st.recCat = b.dataset.reccat; drawRight(); }
      else if (t.closest('[data-change]')) { st.id = null; st.preview = null; drawAll(); $('#m-left', root).scrollIntoView({ behavior: 'smooth' }); }
      else if (t.closest('[data-clear-preview]')) { st.preview = null; drawRight(); }
      else if ((b = t.closest('[data-preview]'))) {
        const rp = product(b.dataset.preview); st.preview = { product: rp, color: colorOf(rp, b.dataset.pc) }; drawRight();
        $('#stage', root).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      else if ((b = t.closest('[data-qa]'))) quickAdd(b.dataset.qa, b.dataset.c);
      else if ((b = t.closest('[data-pair]'))) {
        const p = cur(), c = colorOf(p, st.color);
        confirmBundle({ name: 'Matching pair', picks: [{ productId: p.id, color: c.name }, { productId: b.dataset.pair, color: b.dataset.pc }] });
      }
    });
  },
};
