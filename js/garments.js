// SVG garment illustrations so the prototype looks complete before you upload real photographs.
// Real photos uploaded in Admin always take priority over these drawings.
import { shade, hsl } from './match.js';

let uidCounter = 0;
const uid = () => 'g' + (++uidCounter);

function patternDefs(id, pattern, hex) {
  const dark = shade(hex, hsl(hex).l > 0.55 ? -0.28 : 0.3);
  if (pattern === 'striped') return `<pattern id="${id}p" width="200" height="12" patternUnits="userSpaceOnUse"><rect width="200" height="5" y="3" fill="${dark}" opacity=".85"/></pattern>`;
  if (pattern === 'checked') return `<pattern id="${id}p" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="3" y="6" fill="${dark}" opacity=".55"/><rect width="3" height="16" x="6" fill="${dark}" opacity=".55"/></pattern>`;
  if (pattern === 'printed') return `<pattern id="${id}p" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="3" fill="${dark}" opacity=".7"/><circle cx="20" cy="19" r="2" fill="${dark}" opacity=".5"/></pattern>`;
  return '';
}

const SHAPES = {
  tshirt: {
    body: 'M72 30 L40 44 L14 82 L38 96 L54 80 L54 208 L146 208 L146 80 L162 96 L186 82 L160 44 L128 30 C118 46 82 46 72 30 Z',
    extra: (d) => `<path d="M72 30 C82 46 118 46 128 30" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/><path d="M54 198 H146" stroke="${d}" stroke-width=".8" opacity=".5"/>`,
  },
  shirt: {
    body: 'M70 28 L38 42 L18 142 L44 148 L54 96 L54 212 L146 212 L146 96 L156 148 L182 142 L162 42 L130 28 L100 46 Z',
    extra: (d, l) => `<path d="M70 28 L100 58 L130 28 L124 24 L100 40 L76 24 Z" fill="${l}" stroke="${d}" stroke-width="1.2" stroke-linejoin="round"/><path d="M100 58 V212" stroke="${d}" stroke-width="1" opacity=".7"/>${[78, 106, 134, 162, 190].map(y => `<circle cx="100" cy="${y}" r="2" fill="${d}" opacity=".8"/>`).join('')}<rect x="112" y="92" width="22" height="22" rx="2" fill="none" stroke="${d}" stroke-width=".8" opacity=".6"/>`,
  },
  jeans: {
    body: 'M58 24 H142 L148 228 H106 L100 92 L94 228 H52 Z',
    extra: (d) => `<rect x="58" y="24" width="84" height="14" fill="none" stroke="${d}" stroke-width="1.2"/><path d="M100 38 V92" stroke="${d}" stroke-width="1"/><path d="M62 40 Q76 62 92 52 M138 40 Q124 62 108 52" fill="none" stroke="${d}" stroke-width="1.1" stroke-dasharray="3 2"/><path d="M60 224 H93 M107 224 H146" stroke="${d}" stroke-width="1" stroke-dasharray="3 2"/>`,
  },
  trousers: {
    body: 'M60 24 H140 L142 228 H108 L100 90 L92 228 H58 Z',
    extra: (d) => `<rect x="60" y="24" width="80" height="10" fill="none" stroke="${d}" stroke-width="1.2"/>${[72, 100, 128].map(x => `<rect x="${x - 2}" y="22" width="4" height="14" fill="${d}" opacity=".35"/>`).join('')}<path d="M76 40 V228 M124 40 V228" stroke="${d}" stroke-width=".8" opacity=".5"/><path d="M100 34 V90" stroke="${d}" stroke-width="1"/>`,
  },
  shorts: {
    body: 'M58 24 H142 L152 140 H106 L100 84 L94 140 H48 Z',
    extra: (d) => `<rect x="58" y="24" width="84" height="12" fill="none" stroke="${d}" stroke-width="1.2"/><path d="M100 36 V84" stroke="${d}" stroke-width="1"/><path d="M62 42 Q74 62 90 52 M138 42 Q126 62 110 52" fill="none" stroke="${d}" stroke-width="1" stroke-dasharray="3 2"/><path d="M50 134 H94 M106 134 H150" stroke="${d}" stroke-width=".9" stroke-dasharray="3 2"/>`,
  },
  jacket: {
    body: 'M68 26 L36 40 L14 150 L42 156 L52 98 L52 208 L148 208 L148 98 L158 156 L186 150 L164 40 L132 26 L100 40 Z',
    extra: (d, l) => `<path d="M68 26 L100 56 L132 26 L140 38 L100 68 L60 38 Z" fill="${l}" stroke="${d}" stroke-width="1.2" stroke-linejoin="round"/><path d="M100 68 V208" stroke="${d}" stroke-width="1.5"/>${Array.from({ length: 9 }, (_, i) => `<path d="M98 ${76 + i * 14} h4" stroke="${d}" stroke-width="1.2"/>`).join('')}<path d="M62 150 L82 166 V196 M138 150 L118 166 V196" fill="none" stroke="${d}" stroke-width="1.1"/>`,
  },
};

function drawGarment(shape, hex, pattern, id) {
  const d = shade(hex, -0.22), l = shade(hex, 0.12), pat = patternDefs(id, pattern, hex);
  const S = SHAPES[shape];
  const fill = pat ? `<path d="${S.body}" fill="url(#${id}p)"/>` : '';
  return `<defs>${pat}<linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".09"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>
  <path d="${S.body}" fill="${hex}" stroke="${d}" stroke-width="1.4" stroke-linejoin="round"/>${fill}<path d="${S.body}" fill="url(#${id}s)"/>${S.extra(d, l)}`;
}

function drawShoe(hex, id) {
  const d = shade(hex, -0.25), sole = hsl(hex).l > 0.8 ? '#D9D5CB' : '#F2EFE8';
  return `<g transform="translate(0 8)"><path d="M26 150 C26 124 38 104 62 104 L84 104 C94 122 112 130 136 134 C162 138 180 148 180 166 V176 H26 Z" fill="${hex}" stroke="${d}" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M24 170 H182 V184 Q182 192 172 192 H34 Q24 192 24 184 Z" fill="${sole}" stroke="${d}" stroke-width="1.2"/>
  <path d="M36 150 C36 134 44 120 62 118" fill="none" stroke="${d}" stroke-width="1" opacity=".6"/>
  <path d="M96 128 L112 116 M104 134 L120 122 M112 140 L128 128" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M148 140 C166 142 176 150 178 164" fill="none" stroke="${d}" stroke-width="1" opacity=".6"/><path d="M26 160 H178" stroke="${d}" stroke-width=".8" opacity=".4"/></g>`;
}

function drawAccessory(shape, hex, id) {
  const d = shade(hex, -0.25), l = shade(hex, 0.14), metal = '#B9A57B';
  if (shape === 'cap') return `<path d="M50 140 C50 90 150 90 150 140 Z" fill="${hex}" stroke="${d}" stroke-width="1.4"/><path d="M50 140 C80 128 150 128 176 150 C150 154 90 148 50 140 Z" fill="${l}" stroke="${d}" stroke-width="1.4" stroke-linejoin="round"/><path d="M100 94 V134 M76 100 C70 112 68 124 70 134 M124 100 C130 112 132 124 130 134" stroke="${d}" stroke-width=".9" fill="none" opacity=".6"/><circle cx="100" cy="94" r="3" fill="${d}"/>`;
  if (shape === 'belt') return `<path d="M30 120 H170 V138 H30 Z" fill="${hex}" stroke="${d}" stroke-width="1.4"/><path d="M30 129 H170" stroke="${d}" stroke-width=".8" stroke-dasharray="3 3" opacity=".6"/>${[120, 132, 144, 156].map(x => `<circle cx="${x}" cy="129" r="1.8" fill="${d}"/>`).join('')}<rect x="34" y="112" width="30" height="34" rx="3" fill="none" stroke="${metal}" stroke-width="4"/><path d="M64 124 H80" stroke="${metal}" stroke-width="3"/>`;
  if (shape === 'tote') return `<path d="M70 96 C70 56 130 56 130 96" fill="none" stroke="${d}" stroke-width="5" stroke-linecap="round"/><path d="M48 96 H152 L162 190 Q162 198 154 198 H46 Q38 198 38 190 Z" fill="${hex}" stroke="${d}" stroke-width="1.4"/><path d="M48 108 H152" stroke="${d}" stroke-width=".8" opacity=".5"/><rect x="82" y="130" width="36" height="24" rx="2" fill="${l}" stroke="${d}" stroke-width=".9"/>`;
  return `<rect x="88" y="40" width="24" height="52" fill="${hex}" stroke="${d}" stroke-width="1.2"/><rect x="88" y="148" width="24" height="52" fill="${hex}" stroke="${d}" stroke-width="1.2"/><circle cx="100" cy="120" r="38" fill="${hex === '#1E1F21' ? '#2A2C30' : l}" stroke="${d}" stroke-width="3"/><circle cx="100" cy="120" r="29" fill="#F4F2EC" stroke="${d}" stroke-width=".8"/><path d="M100 120 V100 M100 120 L114 128" stroke="${d}" stroke-width="2" stroke-linecap="round"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${100 + 25 * Math.sin(a)} ${120 - 25 * Math.cos(a)} L${100 + 28 * Math.sin(a)} ${120 - 28 * Math.cos(a)}" stroke="${d}" stroke-width="1"/>`; }).join('')}`;
}

export function shapeOf(p, cats) {
  if (p.shape) return p.shape;
  const map = { tshirts: 'tshirt', shirts: 'shirt', jeans: 'jeans', trousers: 'trousers', shorts: 'shorts', jackets: 'jacket', shoes: 'shoe' };
  if (map[p.category]) return map[p.category];
  const g = cats?.find(c => c.id === p.category)?.group;
  return { top: 'tshirt', bottom: 'trousers', outer: 'jacket', shoes: 'shoe', accessory: 'tote' }[g] || 'tshirt';
}

// inner markup in a 200x240 coordinate space (for composing outfits)
export function garmentInner(p, hex, cats) {
  const shape = shapeOf(p, cats), id = uid();
  const shadow = `<ellipse cx="100" cy="${shape === 'shoe' ? 200 : 232}" rx="${shape === 'shoe' ? 78 : 56}" ry="5" fill="#000" opacity=".07"/>`;
  if (SHAPES[shape]) return shadow + drawGarment(shape, hex, p.pattern, id);
  if (shape === 'shoe') return shadow + drawShoe(hex, id);
  return drawAccessory(shape, hex, id);
}

const BACKDROPS = ['#ECEAE4', '#E4E8E6', '#EAE6EA'];
export const VIEWS = [
  { label: 'Front', box: '0 0 200 240', rot: 0, bg: 0 },
  { label: 'Detail', box: '40 20 120 144', rot: 0, bg: 1 },
  { label: 'Flat lay', box: '-10 0 220 250', rot: -7, bg: 2 },
];

export function productArt(p, hex, { view = 0, cats, label = true } = {}) {
  const v = VIEWS[view] || VIEWS[0];
  const [x, y, w, h] = v.box.split(' ').map(Number);
  return `<svg viewBox="${v.box}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(p.name || '').replace(/"/g, '')}" preserveAspectRatio="xMidYMid slice"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${BACKDROPS[v.bg]}"/><g transform="rotate(${v.rot} 100 120)">${garmentInner(p, hex, cats)}</g></svg>`;
}

// Whole-outfit figure. slots: { top, bottom, shoes, accessories:[{p,hex}] } where each is { p, hex }
export function outfitArt(slots, cats, { empty = true, ids = false, box = '0 0 300 500' } = {}) {
  const PH = { top: [62, 62, 116, 128], bottom: [72, 206, 96, 150], shoes: [52, 376, 136, 84] };
  const place = (slot, x, y, w, h, label) => {
    const it = slots[slot];
    const attr = ids ? ` data-slot="${slot}"` : '';
    if (!it) { if (!empty) return ''; const [px, py, pw, ph] = PH[slot]; return `<g${attr} class="slot-empty"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="12" fill="none" stroke="#9AA19E" stroke-width="1.2" stroke-dasharray="5 5"/><text x="${px + pw / 2}" y="${py + ph / 2 + 4}" text-anchor="middle" font-size="12" fill="#7A817E" font-family="Figtree,system-ui,sans-serif">${label}</text></g>`; }
    return `<svg${attr} x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 200 240" overflow="visible">${garmentInner(it.p, it.hex, cats)}</svg>`;
  };
  const acc = (slots.accessories || []).slice(0, 3).map((a, i) => `<svg x="${222}" y="${60 + i * 78}" width="70" height="84" viewBox="0 0 200 240" overflow="visible">${garmentInner(a.p, a.hex, cats)}</svg>`).join('');
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" class="outfit-svg" role="img" aria-label="Outfit preview">
  <g opacity=".5" fill="#DEE1DD"><circle cx="130" cy="34" r="18"/><rect x="123" y="48" width="14" height="14" rx="4"/></g>
  ${place('bottom', 28, 170, 204, 244, 'Add bottoms')}
  ${place('top', 18, 52, 224, 270, 'Add a top')}
  ${place('shoes', 34, 378, 192, 115, 'Add shoes')}
  ${acc}
  ${empty && !(slots.accessories || []).length ? `<g class="slot-empty" ${ids ? 'data-slot="accessories"' : ''}><rect x="226" y="62" width="58" height="66" rx="10" fill="none" stroke="#9AA19E" stroke-width="1.2" stroke-dasharray="5 5"/><text x="255" y="99" text-anchor="middle" font-size="11" fill="#7A817E" font-family="Figtree,system-ui,sans-serif">Add-ons</text></g>` : ''}
  </svg>`;
}
