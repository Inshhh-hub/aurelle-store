// Colour theory + style matching. Everything runs against YOUR catalogue only.

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}
export const hsl = hex => rgbToHsl(...hexToRgb(hex));
export function shade(hex, amt) { // amt -1..1 (negative darkens)
  const [r, g, b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
export function isNeutral(hex) {
  const { s, l } = hsl(hex);
  return s < 0.14 || l > 0.9 || l < 0.14 || (l < 0.27 && s < 0.5); // black, white, grey, navy/charcoal, beige-ish handled by low s
}
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

export function colourFamily(hex) {
  const { h, s, l } = hsl(hex);
  if (l < 0.16) return 'Black';
  if (l > 0.9 && s < 0.25) return 'White';
  if (s < 0.1) return l > 0.6 ? 'Grey' : 'Charcoal';
  if (s < 0.3 && l > 0.55 && h >= 25 && h < 70) return 'Beige';
  if (h < 14 || h >= 345) return l > 0.75 ? 'Pink' : 'Red';
  if (h < 40) return l < 0.5 ? 'Brown' : (l > 0.75 ? 'Pink' : 'Orange');
  if (h < 70) return l < 0.45 ? 'Brown' : 'Yellow';
  if (h < 170) return 'Green';
  if (h < 260) return 'Blue';
  if (h < 330) return 'Purple';
  return 'Pink';
}
export const FAMILY_HEX = { Black: '#1E1F21', White: '#F7F6F2', Grey: '#9A9DA1', Charcoal: '#3B3D41', Beige: '#D6C8AC', Brown: '#8C6A4F', Red: '#9C3A3A', Pink: '#E2C8C0', Orange: '#B5755C', Yellow: '#C8A24E', Green: '#6C7C5E', Blue: '#5C7894', Purple: '#B9B1C9' };

// 0..1 how well two colours wear together
export function colourScore(a, b) {
  const A = hsl(a), B = hsl(b), na = isNeutral(a), nb = isNeutral(b);
  const dl = Math.abs(A.l - B.l);
  if (na && nb) return Math.min(1, 0.72 + Math.min(dl, 0.5) * 0.5);
  if (na || nb) {
    const c = na ? B : A;
    return c.s > 0.7 ? 0.74 : 0.84 + (c.s < 0.45 ? 0.08 : 0);
  }
  const dh = hueDist(A.h, B.h), avgS = (A.s + B.s) / 2;
  let s;
  if (dh < 30) s = dl < 0.1 ? 0.56 : 0.78 + Math.min(dl, 0.4) * 0.3; // analogous, wants contrast
  else if (dh > 150) s = avgS < 0.5 ? 0.82 : 0.6; // complementary
  else if (dh > 100) s = 0.5 + (1 - avgS) * 0.3; // triadic
  else s = 0.38 + (1 - avgS) * 0.3;
  if (A.s < 0.45 && B.s < 0.45) s += 0.08; // earthy, muted pairs
  return Math.min(1, s);
}

const sharesOccasion = (a, b) => (a || []).some(o => (b || []).includes(o));
const BRIDGE = { formal: ['smart'], smart: ['formal', 'casual'], casual: ['smart'], party: ['smart'], sport: ['casual'] };
function occasionScore(a, b) {
  if (sharesOccasion(a, b)) return 1;
  if ((a || []).some(o => (BRIDGE[o] || []).some(x => (b || []).includes(x)))) return 0.7;
  return 0.3;
}
function patternScore(pa, pb) {
  const sa = !pa || pa === 'solid', sb = !pb || pb === 'solid';
  if (sa && sb) return 0.85;
  if (sa || sb) return 1;
  return pa === pb ? 0.35 : 0.2;
}
const styleScore = (a, b) => (a === b ? 1 : (a === 'classic' || b === 'classic' || a === 'minimal' || b === 'minimal') ? 0.8 : 0.55);

// item = { hex, pattern, occasions, style }
export function pairScore(x, y) {
  const c = colourScore(x.hex, y.hex), o = occasionScore(x.occasions, y.occasions), p = patternScore(x.pattern, y.pattern), s = styleScore(x.style, y.style);
  const score = c * 0.5 + o * 0.2 + p * 0.15 + s * 0.15;
  const reasons = [];
  const nx = isNeutral(x.hex), ny = isNeutral(y.hex);
  if (nx && ny) reasons.push('Tonal neutrals');
  else if (nx || ny) reasons.push('Neutral base lets the colour lead');
  else if (c > 0.78) reasons.push('Colours sit well together');
  else if (c > 0.6) reasons.push('Balanced colour pairing');
  if (o === 1) reasons.push('Same occasion: ' + ((x.occasions || []).find(v => (y.occasions || []).includes(v)) || 'everyday'));
  if (p >= 0.95) reasons.push('Pattern + solid balance');
  if (s === 1) reasons.push('Matching ' + x.style + ' style');
  return { score, reasons: reasons.slice(0, 3) };
}

const asItem = (p, hex) => ({ hex, pattern: p.pattern, occasions: p.occasions, style: p.style });

// best colour variant of `cand` against fixed item `base`
export function bestVariant(cand, base) {
  let best = null;
  for (const c of cand.colors) {
    const r = pairScore(base, asItem(cand, c.hex));
    if (!best || r.score > best.score) best = { ...r, color: c };
  }
  return best;
}

export function recommend(base, candidates, { occasion = null, limit = 12 } = {}) {
  return candidates
    .filter(p => p.colors.length && Object.values(p.stock || {}).some(v => v > 0))
    .filter(p => !occasion || (p.occasions || []).includes(occasion))
    .map(p => ({ product: p, ...bestVariant(p, base) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const pct = s => Math.round(Math.min(0.99, Math.max(0.4, s)) * 100);
export { asItem };
