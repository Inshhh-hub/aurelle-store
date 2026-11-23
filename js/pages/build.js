import { S, byGroup, product, price, inr, colorOf, groupOf, cat, stockOf, totalStock, bundlePrice, addBundle } from '../store.js';
import { esc, icon, art, swatch, toast, bump, tween, $, $$, go } from '../ui.js';
import { outfitArt } from '../garments.js';
import { bestVariant, recommend, asItem, pairScore, pct } from '../match.js';
import { confirmBundle } from '../bundle.js';

const TABS = [['top', 'Tops', ['top']], ['bottom', 'Bottoms', ['bottom']], ['shoes', 'Shoes', ['shoes']], ['acc', 'Add-ons', ['accessory', 'outer']]];
const LABEL = { top: 'Top', bottom: 'Bottom', shoes: 'Shoes', acc: 'Add-on' };
const stock = p => totalStock(p) > 0;
const slotOfGroup = g => (g === 'top' ? 'top' : g === 'bottom' ? 'bottom' : g === 'shoes' ? 'shoes' : 'acc');
let o, tab = 'top', catf = '', prevSum = [0, 0, 0];

function parse() {
  o = { top: null, bottom: null, shoes: null, acc: [] };
  const qs = new URLSearchParams((location.hash.split('?')[1]) || '');
  for (const [k, v] of qs.entries()) {
    const [id, c] = v.split(':'); const p = product(id); if (!p) continue;
    const it = { id, color: c ? decodeURIComponent(c) : p.colors[0].name, size: '' };
    if (k === 'acc') { if (o.acc.length < 3) o.acc.push(it); } else if (['top', 'bottom', 'shoes'].includes(k)) o[k] = it;
  }
}
const items = () => ['top', 'bottom', 'shoes'].map(k => o[k]).concat(o.acc).filter(Boolean);
const full = it => ({ p: product(it.id), hex: colorOf(product(it.id), it.color).hex });
function sync() {
  const q = new URLSearchParams();
  ['top', 'bottom', 'shoes'].forEach(k => o[k] && q.set(k, `${o[k].id}:${o[k].color}`));
  o.acc.forEach(a => q.append('acc', `${a.id}:${a.color}`));
  history.replaceState(null, '', '#/build' + (q.toString() ? '?' + q.toString() : ''));
}
function place(p, color = null) {
  const slot = slotOfGroup(groupOf(p));
  const base = items().filter(it => slotOfGroup(groupOf(product(it.id))) !== slot && slot !== 'acc').map(it => full(it));
  let c = color;
  if (!c) {
    if (base.length) {
      let best = null;
      for (const col of p.colors) { const sc = base.reduce((a, b) => a + pairScore(asItem(b.p, b.hex), asItem(p, col.hex)).score, 0) / base.length; if (!best || sc > best.sc) best = { sc, name: col.name }; }
      c = best.name;
    } else c = p.colors[0].name;
  }
  const it = { id: p.id, color: c, size: '' };
  if (slot === 'acc') { if (o.acc.some(a => a.id === p.id)) return 'Already added'; if (o.acc.length >= 3) return 'You can add up to 3 add-ons'; o.acc.push(it); } else o[slot] = it;
  return '';
}

export default {
  title: () => 'Build Your Outfit',
  render() {
    parse();
    return `<section class="wrap build"><div class="page-h row between wrap-m"><div><p class="kicker">Build Your Outfit</p><h1>Put the whole look together</h1><p class="lead narrow-text">Choose a top, a bottom and shoes. Complete outfits get an automatic discount.</p></div>
      <div class="row gap wrap-s" id="starters"></div></div><div class="build-grid"><div class="b-pick" id="b-pick"></div><div class="b-fig"><div class="fig-box" id="fig" aria-label="Outfit preview. Drop a product here."></div><div class="row gap center-x wrap-s"><button class="btn ghost" id="shuffle">${icon('shuffle', 18)} Surprise me</button><button class="btn ghost" id="complete">${icon('sparkle', 18)} Complete the look</button><button class="btn text" id="clear">Clear</button></div></div>
      <aside class="b-sum" id="b-sum"></aside></div></section>`;
  },
  mount(root) {
    const pick = $('#b-pick', root), fig = $('#fig', root), sum = $('#b-sum', root);

    function drawStarters() {
      $('#starters', root).innerHTML = S.outfits.length ? `<span class="muted sm">Start from:</span>` + S.outfits.map(x => `<button class="chip" data-start="${x.id}">${esc(x.name)}</button>`).join('') : '';
    }
    function drawPick() {
      const t = TABS.find(x => x[0] === tab), ps = byGroup(...t[2]).filter(stock);
      const cats = [...new Set(ps.map(p => p.category))];
      const shown = ps.filter(p => !catf || p.category === catf);
      const picked = id => items().some(it => it.id === id);
      pick.innerHTML = `<div class="tabs" role="tablist">${TABS.map(([k, n, g]) => { const has = k === 'acc' ? o.acc.length : o[k] ? 1 : 0; return `<button role="tab" class="${tab === k ? 'on' : ''}" data-tab="${k}" aria-selected="${tab === k}">${n}${has ? `<i class="dot-n">${has}</i>` : ''}</button>`; }).join('')}</div>
      ${cats.length > 1 ? `<div class="chips"><button class="chip ${!catf ? 'on' : ''}" data-catf="">All</button>${cats.map(c => `<button class="chip ${catf === c ? 'on' : ''}" data-catf="${c}">${esc(cat(c)?.name)}</button>`).join('')}</div>` : ''}
      <p class="muted sm">Click to add, or drag onto the figure.</p>
      <div class="tiles">${shown.map(p => `<button class="tile ${picked(p.id) ? 'on' : ''}" draggable="true" data-add="${p.id}" aria-pressed="${picked(p.id)}"><div class="art">${art(p, p.colors[0].hex)}</div><b>${esc(p.name)}</b><span>${inr(price(p))}</span>${picked(p.id) ? `<i class="tick">${icon('check', 14)}</i>` : ''}</button>`).join('') || '<p class="muted">Nothing in stock here yet.</p>'}</div>`;
    }
    function drawFig(anim) {
      const slots = { top: o.top && full(o.top), bottom: o.bottom && full(o.bottom), shoes: o.shoes && full(o.shoes), accessories: o.acc.map(full) };
      fig.innerHTML = outfitArt(slots, S.categories, { empty: true });
      if (anim) { fig.classList.remove('flash'); void fig.offsetWidth; fig.classList.add('flash'); }
    }
    function drawSum() {
      const its = items(), ps = its.map(it => product(it.id)), bp = bundlePrice(ps);
      const ess = ['top', 'bottom', 'shoes'].filter(k => o[k]).length;
      const rule = bp.rule, teaser = rule.type === 'percent' ? `${rule.value}%` : inr(rule.value);
      const row = (key, it, idx) => {
        const p = it && product(it.id);
        if (!p) return `<li class="srow empty"><span class="muted">${LABEL[key]}</span><button class="btn text" data-goto="${key}">+ Add ${key === 'acc' ? 'an add-on' : 'a ' + LABEL[key].toLowerCase()}</button></li>`;
        const c = colorOf(p, it.color), ref = key === 'acc' ? `acc-${idx}` : key;
        return `<li class="srow" data-ref="${ref}"><div class="thumb art">${art(p, c.hex)}</div><div class="grow"><div class="row between"><b>${esc(p.name)}</b><button class="icon-btn sm" data-rm="${ref}" aria-label="Remove ${esc(p.name)}">${icon('close', 16)}</button></div>
        <div class="sws">${p.colors.map(x => swatch(x, { on: x.name === it.color, size: 'sm', attrs: `data-sc="${ref}" data-c="${esc(x.name)}"` })).join('')}<span class="muted sm">${esc(c.name)}</span></div>
        <div class="chips sm-chips">${p.sizes.map(s => `<button class="chip xs ${s === it.size ? 'on' : ''}" ${stockOf(p, s) <= 0 ? 'disabled' : ''} data-ss="${ref}" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <div class="row between"><button class="btn text sm" data-goto="${key}">Swap</button><b>${inr(price(p))}</b></div></div></li>`;
      };
      sum.innerHTML = `<h2>Your outfit</h2><ul class="srows">${row('top', o.top)}${row('bottom', o.bottom)}${row('shoes', o.shoes)}${o.acc.map((a, i) => row('acc', a, i)).join('')}${o.acc.length < 3 ? row('acc', null) : ''}</ul>
      <div class="unlock ${bp.complete ? 'done' : ''}"><div class="steps">${['Top', 'Bottom', 'Shoes'].map((l, i) => `<span class="${o[['top', 'bottom', 'shoes'][i]] ? 'on' : ''}">${o[['top', 'bottom', 'shoes'][i]] ? icon('check', 14) : ''}${l}</span>`).join('')}</div>
        <p>${bp.complete ? `<b>Complete outfit discount applied</b>` : ess === 0 ? `Pick a top, bottom and shoes to save <b>${teaser}</b>` : `Add ${3 - ess} more essential${3 - ess > 1 ? 's' : ''} to save <b>${teaser}</b>`}</p></div>
      <dl class="sumtbl"><div><dt>Original total</dt><dd id="s-orig" data-v="0">${inr(bp.original)}</dd></div>
      <div class="save ${bp.complete ? '' : 'off'}"><dt>Outfit discount ${bp.complete ? `(${bp.pct}% saved)` : ''}</dt><dd>−<span id="s-disc" data-v="0">${inr(bp.discount)}</span></dd></div>
      <div class="total"><dt>Outfit price</dt><dd id="s-final" data-v="0">${inr(bp.final)}</dd></div></dl>
      ${bp.complete ? `<p class="saved-note">${icon('check', 16)} You save ${inr(bp.discount)}</p>` : ''}
      <p class="err-line" id="b-err" role="alert"></p>
      <button class="btn primary block lg" id="b-add" ${its.length ? '' : 'disabled'}>Add outfit to cart</button>
      <button class="btn ghost block" id="b-share" ${its.length ? '' : 'disabled'}>Copy outfit link</button>`;
      const now = [bp.original, bp.discount, bp.final];
      ['s-orig', 's-disc', 's-final'].forEach((id, i) => { const el = $('#' + id, sum); el.dataset.v = prevSum[i]; tween(el, now[i]); });
      prevSum = now;
    }
    const all = (anim = false) => { drawPick(); drawFig(anim); drawSum(); drawStarters(); sync(); };
    all();

    const refSet = (ref, fn) => { if (ref.startsWith('acc-')) fn(o.acc[+ref.slice(4)]); else fn(o[ref]); };
    root.addEventListener('click', e => {
      const t = e.target; let b;
      if ((b = t.closest('[data-tab]'))) { tab = b.dataset.tab; catf = ''; drawPick(); }
      else if ((b = t.closest('[data-catf]'))) { catf = b.dataset.catf; drawPick(); }
      else if ((b = t.closest('[data-add]'))) {
        const p = product(b.dataset.add), slot = slotOfGroup(groupOf(p));
        const already = slot === 'acc' ? o.acc.findIndex(a => a.id === p.id) : (o[slot]?.id === p.id ? 0 : -1);
        if (already >= 0) { if (slot === 'acc') o.acc.splice(already, 1); else o[slot] = null; all(true); return; }
        const msg = place(p); if (msg) return toast(msg, 'err'); all(true);
      }
      else if ((b = t.closest('[data-goto]'))) { tab = b.dataset.goto; catf = ''; drawPick(); $('#b-pick', root).scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      else if ((b = t.closest('[data-rm]'))) { const r = b.dataset.rm; if (r.startsWith('acc-')) o.acc.splice(+r.slice(4), 1); else o[r] = null; all(true); }
      else if ((b = t.closest('[data-sc]'))) { refSet(b.dataset.sc, it => { it.color = b.dataset.c; }); drawPick(); drawFig(true); drawSum(); sync(); }
      else if ((b = t.closest('[data-ss]'))) { refSet(b.dataset.ss, it => { it.size = b.dataset.s; }); drawSum(); }
      else if ((b = t.closest('[data-start]'))) {
        const x = S.outfits.find(z => z.id === b.dataset.start); o = { top: null, bottom: null, shoes: null, acc: [] };
        x.items.map(product).filter(Boolean).forEach(p => place(p, p.colors[0].name)); all(true); toast(`Loaded “${x.name}”`);
      }
      else if (t.closest('#clear')) { o = { top: null, bottom: null, shoes: null, acc: [] }; tab = 'top'; all(true); }
      else if (t.closest('#shuffle')) {
        const tops = byGroup('top').filter(stock), p = tops[Math.floor(Math.random() * tops.length)];
        o = { top: null, bottom: null, shoes: null, acc: [] }; place(p, p.colors[Math.floor(Math.random() * p.colors.length)].name); fillMissing(); all(true);
      }
      else if (t.closest('#complete')) { if (!items().length) return toast('Add one piece first and we will complete the look', 'err'); fillMissing(); all(true); }
      else if (t.closest('#b-share')) { navigator.clipboard?.writeText(location.href).then(() => toast('Outfit link copied'), () => toast('Copy the address bar to share', 'err')); }
      else if (t.closest('#b-add')) {
        const its = items(), err = $('#b-err', sum);
        const missing = its.filter(it => !it.size && product(it.id).sizes.length > 1);
        const picks = its.map(it => ({ productId: it.id, color: it.color, size: it.size }));
        if (!missing.length) {
          const r = addBundle({ name: 'Custom outfit', items: picks });
          if (!r.ok) { err.textContent = r.msg; return; }
          toast('Outfit added to your cart'); bump(); return;
        }
        confirmBundle({ name: 'Custom outfit', picks });
      }
    });

    function fillMissing() {
      const need = ['top', 'bottom', 'shoes'].filter(k => !o[k]);
      for (const k of need) {
        const have = items().map(it => full(it)); if (!have.length) break;
        const g = [k]; const cands = byGroup(...g).filter(stock);
        let best = null;
        for (const c of cands) { const bv = have.map(h => bestVariant(c, asItem(h.p, h.hex))); const sc = bv.reduce((a, r) => a + r.score, 0) / bv.length; if (!best || sc > best.sc) best = { c, color: bv[0].color.name, sc }; }
        if (best) place(best.c, null);
      }
    }

    // drag & drop
    root.addEventListener('dragstart', e => { const t = e.target.closest('[data-add]'); if (t) { e.dataTransfer.setData('text/plain', t.dataset.add); e.dataTransfer.effectAllowed = 'copy'; } });
    ['dragenter', 'dragover'].forEach(ev => fig.addEventListener(ev, e => { e.preventDefault(); fig.classList.add('over'); }));
    fig.addEventListener('dragleave', () => fig.classList.remove('over'));
    fig.addEventListener('drop', e => {
      e.preventDefault(); fig.classList.remove('over');
      const p = product(e.dataTransfer.getData('text/plain')); if (!p) return;
      const msg = place(p); if (msg) toast(msg, 'err'); all(true);
    });
  },
};
