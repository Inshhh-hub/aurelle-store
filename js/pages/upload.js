import { S, byGroup, product, price, inr, groupOf, totalStock } from '../store.js';
import { esc, icon, art, productCard, quickAdd, toast, $, $$, go, swatch } from '../ui.js';
import { garmentInner } from '../garments.js';
import { recommend, pct, colourFamily } from '../match.js';
import { analyze, fileToDataURL } from '../analyze.js';
import { hold } from '../bundle.js';

const stock = p => totalStock(p) > 0;
const OCC = [['casual', 'Casual'], ['smart', 'Smart casual'], ['formal', 'Formal'], ['party', 'Evening'], ['sport', 'Active']];
const TYPES = [['top', 'Top'], ['bottom', 'Bottom'], ['shoes', 'Shoes']];
const PATTERNS = [['solid', 'Solid'], ['striped', 'Striped'], ['checked', 'Checked'], ['printed', 'Printed']];
let R = null; // current result

const svgSample = (shape, hex, pattern = 'solid') => {
  const inner = garmentInner({ category: shape === 'shoe' ? 'shoes' : shape === 'tshirt' ? 'tshirts' : 'trousers', shape, pattern }, hex, S.categories);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="400" height="480"><rect width="200" height="240" fill="#fff"/>${inner}</svg>`);
};
const SAMPLES = [['Olive trousers', () => svgSample('trousers', '#6B7152')], ['Navy striped tee', () => svgSample('tshirt', '#263349', 'striped')], ['White sneakers', () => svgSample('shoe', '#F1EFEA')]];

export default {
  title: () => 'Upload & Match',
  render() {
    return `<section class="wrap upload"><div class="page-h"><p class="kicker">Upload & Match</p><h1>Show us what you already own</h1><p class="lead narrow-text">Upload a photo of a top, bottoms or shoes. We read its colour and pattern, then recommend pieces from our collection that go with it.</p></div>
    <div class="up-grid"><div class="up-left"><div class="drop" id="drop" tabindex="0" role="button" aria-label="Upload a photo"><input type="file" id="file" accept="image/*" hidden><input type="file" id="cam" accept="image/*" capture="environment" hidden>
      <div class="drop-preview" id="preview" hidden></div>
      <div class="drop-empty" id="dempty"><div class="drop-ico">${icon('upload', 30)}</div><b>Drag a photo here</b><p class="muted">or click to choose a file</p></div></div>
      <div class="row gap wrap-s"><button class="btn ghost" id="pick">${icon('upload', 18)} Choose photo</button><button class="btn ghost" id="shoot">${icon('camera', 18)} Use camera</button><button class="btn text" id="reset" hidden>Start over</button></div>
      <div class="samples"><p class="muted sm">No photo handy? Try a sample:</p><div class="chips">${SAMPLES.map(([n], i) => `<button class="chip" data-sample="${i}">${n}</button>`).join('')}</div></div>
      <p class="privacy">${icon('shield', 16)} Photos are analysed in your browser. If AI vision is enabled on this site, a small copy is sent for analysis and is not stored.</p></div>
    <div class="up-right" id="up-right"><div class="m-empty">${icon('camera', 30)}<h2>Your matches will appear here</h2><p class="muted">We only recommend products that are in our catalogue.</p></div></div></div></section>`;
  },
  mount(root) {
    R = null;
    const right = $('#up-right', root), drop = $('#drop', root), file = $('#file', root), cam = $('#cam', root), prev = $('#preview', root), de = $('#dempty', root);

    async function run(dataUrl) {
      prev.hidden = false; de.hidden = true; $('#reset', root).hidden = false;
      prev.innerHTML = `<img src="${dataUrl}" alt="Your uploaded clothing item"><div class="scan"></div>`;
      right.innerHTML = `<div class="m-empty"><div class="spinner" aria-hidden="true"></div><h2>Analysing your photo…</h2><p class="muted">Looking at colour, pattern and type.</p></div>`;
      const [res] = await Promise.all([analyze(dataUrl), new Promise(r => setTimeout(r, 1300))]).catch(e => { toast(e.message, 'err'); return [null]; });
      prev.querySelector('.scan')?.remove();
      if (!res) { right.innerHTML = `<div class="m-empty"><h2>We couldn't read that image</h2><p class="muted">Try a clear, well-lit photo on a plain background.</p></div>`; return; }
      R = { ...res, img: dataUrl }; draw();
    }

    function draw() {
      const base = { hex: R.hex, pattern: R.pattern, occasions: [R.occasion, R.occasion === 'casual' ? 'smart' : 'casual'], style: R.style || 'classic' };
      const want = { top: ['bottom', 'shoes'], bottom: ['top', 'shoes'], shoes: ['top', 'bottom'] }[R.type];
      const groups = want.map(g => ({ g, recs: recommend(base, byGroup(g).filter(stock), { limit: 4 }) }));
      R.groups = groups;
      const names = { top: 'Tops & shirts', bottom: 'Trousers, jeans & shorts', shoes: 'Shoes' };
      right.innerHTML = `<div class="detect"><div class="row between wrap-s"><h2>What we found</h2><span class="pill ${R.source === 'ai' ? 'ok' : ''}" title="${R.source === 'ai' ? 'AI vision' : 'Colour analysis ran on your device'}">${R.source === 'ai' ? 'AI vision' : 'On-device analysis'}</span></div>
        ${R.source !== 'ai' ? `<p class="note">${icon('info', 16)} AI vision isn't switched on for this site, so we used colour analysis on your device. Check the details below and adjust anything that looks off.</p>` : ''}
        <div class="dt-row"><span class="lbl">Item type</span><div class="chips">${TYPES.map(([v, t]) => `<button class="chip ${R.type === v ? 'on' : ''}" data-type="${v}">${t}</button>`).join('')}</div></div>
        <div class="dt-row"><span class="lbl">Main colour</span><div class="sws">${R.palette.map((h, i) => swatch({ name: colourFamily(h), hex: h }, { on: h === R.hex, attrs: `data-hex="${h}"` })).join('')}<span class="muted sm">${esc(R.colourName || colourFamily(R.hex))}</span></div></div>
        <div class="dt-row"><span class="lbl">Pattern</span><div class="chips">${PATTERNS.map(([v, t]) => `<button class="chip ${R.pattern === v ? 'on' : ''}" data-pat="${v}">${t}</button>`).join('')}</div></div>
        <div class="dt-row"><span class="lbl">Occasion</span><div class="chips">${OCC.map(([v, t]) => `<button class="chip ${R.occasion === v ? 'on' : ''}" data-occ="${v}">${t}</button>`).join('')}</div></div></div>
      ${groups.map(({ g, recs }) => `<div class="rec-group"><h3>${names[g]}</h3>${recs.length ? `<div class="grid g4 sm-grid">${recs.map(r => productCard(r.product, { color: r.color.name, match: pct(r.score), small: true })).join('')}</div>` : '<p class="muted">No in-stock matches in this category yet.</p>'}</div>`).join('')}
      <div class="row gap wrap-s"><button class="btn primary" id="to-build">Build a full outfit from these picks</button></div>`;
    }

    const take = async f => {
      if (!f || !f.type.startsWith('image/')) return toast('Please choose an image file', 'err');
      if (f.size > 12 * 1024 * 1024) return toast('That image is over 12 MB. Try a smaller one.', 'err');
      try { run(await fileToDataURL(f)); } catch (e) { toast(e.message, 'err'); }
    };
    drop.addEventListener('click', e => { if (!R && !e.target.closest('button')) file.click(); });
    drop.addEventListener('keydown', e => { if (e.key === 'Enter') file.click(); });
    $('#pick', root).onclick = () => file.click(); $('#shoot', root).onclick = () => cam.click();
    file.onchange = () => take(file.files[0]); cam.onchange = () => take(cam.files[0]);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));
    $('#reset', root).onclick = () => { R = null; prev.hidden = true; de.hidden = false; $('#reset', root).hidden = true; file.value = ''; right.innerHTML = `<div class="m-empty">${icon('camera', 30)}<h2>Your matches will appear here</h2><p class="muted">We only recommend products that are in our catalogue.</p></div>`; };

    root.addEventListener('click', e => {
      const t = e.target; let b;
      if ((b = t.closest('[data-sample]'))) run(SAMPLES[+b.dataset.sample][1]());
      else if (R && (b = t.closest('[data-type]'))) { R.type = b.dataset.type; draw(); }
      else if (R && (b = t.closest('[data-hex]'))) { R.hex = b.dataset.hex; draw(); }
      else if (R && (b = t.closest('[data-pat]'))) { R.pattern = b.dataset.pat; draw(); }
      else if (R && (b = t.closest('[data-occ]'))) { R.occasion = b.dataset.occ; draw(); }
      else if (t.closest('#to-build') && R) {
        const q = new URLSearchParams();
        R.groups.forEach(({ g, recs }) => { if (recs[0]) q.set(g, `${recs[0].product.id}:${recs[0].color.name}`); });
        go('/build?' + q.toString()); toast('Loaded the best matches into the outfit builder');
      }
    });
    if (hold.file) { const f = hold.file; hold.file = null; take(f); }
  },
};
