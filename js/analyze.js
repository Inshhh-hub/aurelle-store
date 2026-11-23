// Image analysis for "Upload & Match".
// 1) Always runs an on-device colour/pattern analysis (no API key, no data leaves the browser).
// 2) If the optional /api/analyze serverless function is configured (ANTHROPIC_API_KEY), AI vision refines the result.
import { rgbToHex, hexToRgb, rgbToHsl } from './match.js';

const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read that image')); i.src = src; });

export async function fileToDataURL(file, max = 640) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url), k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.85);
  } finally { URL.revokeObjectURL(url); }
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export async function analyzeLocal(dataUrl) {
  const img = await loadImg(dataUrl), N = 96;
  const cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, N, N);
  const k = Math.min(N / img.width, N / img.height), w = img.width * k, h = img.height * k;
  ctx.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
  const { data } = ctx.getImageData(0, 0, N, N);
  const px = i => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
  // background = median of the border pixels
  const border = []; for (let x = 0; x < N; x++) { border.push(px(x), px((N - 1) * N + x)); } for (let y = 0; y < N; y++) { border.push(px(y * N), px(y * N + N - 1)); }
  const med = c => border.map(b => b[c]).sort((a, b) => a - b)[border.length >> 1];
  const bg = [med(0), med(1), med(2)];
  const fg = new Uint8Array(N * N); let n = 0, minX = N, maxX = 0, minY = N, maxY = 0;
  for (let i = 0; i < N * N; i++) {
    if (dist(px(i), bg) > 42) { fg[i] = 1; n++; const x = i % N, y = (i / N) | 0; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  const useAll = n < N * N * 0.04; if (useAll) fg.fill(1);
  // dominant colours: 12-level quantisation
  const buckets = new Map();
  for (let i = 0; i < N * N; i++) {
    if (!fg[i]) continue; const [r, g, b] = px(i), key = ((r / 22) | 0) * 169 + ((g / 22) | 0) * 13 + ((b / 22) | 0);
    const e = buckets.get(key) || { c: 0, r: 0, g: 0, b: 0 }; e.c++; e.r += r; e.g += g; e.b += b; buckets.set(key, e);
  }
  const ranked = [...buckets.values()].sort((a, b) => b.c - a.c).map(e => ({ rgb: [e.r / e.c, e.g / e.c, e.b / e.c], c: e.c }));
  const total = ranked.reduce((a, e) => a + e.c, 0) || 1, palette = [];
  for (const e of ranked) { if (palette.every(p => dist(p.rgb, e.rgb) > 55)) palette.push({ ...e, share: e.c / total }); if (palette.length >= 3) break; }
  // merge pixels near each palette colour for stable shares
  const main = palette[0]?.rgb || [128, 128, 128];
  // pattern: gradient energy + direction
  let edges = 0, gx = 0, gy = 0, cnt = 0;
  const lum = i => { const [r, g, b] = px(i); return 0.3 * r + 0.59 * g + 0.11 * b; };
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
    const i = y * N + x; if (!fg[i] || !fg[i - 2] || !fg[i + 2] || !fg[i - 2 * N] || !fg[i + 2 * N]) continue;
    const dx = Math.abs(lum(i + 1) - lum(i - 1)), dy = Math.abs(lum(i + N) - lum(i - N)); cnt++;
    if (dx + dy > 36) { edges++; gx += dx; gy += dy; }
  }
  const density = cnt ? edges / cnt : 0, second = palette[1]?.share || 0;
  let pattern = 'solid';
  if (density > 0.1 && second > 0.12) {
    const r = (gx + 1) / (gy + 1);
    pattern = (r > 2.3 || r < 0.43) ? 'striped' : (density > 0.3 ? 'printed' : 'checked');
  }
  // type guess from silhouette
  const bw = Math.max(1, maxX - minX + 1), bh = Math.max(1, maxY - minY + 1), asp = useAll ? 1 : bw / bh;
  const type = asp >= 1.4 ? 'shoes' : asp <= 0.82 ? 'bottom' : 'top';
  const hexes = palette.map(p => rgbToHex(...p.rgb));
  const { s, l } = rgbToHsl(...main);
  return { source: 'device', type, hex: hexes[0] || '#808080', palette: hexes, pattern, confident: !useAll, occasion: l < 0.2 && s < 0.2 ? 'smart' : 'casual', style: 'classic' };
}

export async function analyze(dataUrl) {
  const local = await analyzeLocal(dataUrl);
  try {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: dataUrl }), signal: ctl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error('unavailable');
    const j = await r.json();
    if (!j || !/^#[0-9a-f]{6}$/i.test(j.hex || '')) throw new Error('bad response');
    return {
      ...local, source: 'ai', hex: j.hex, palette: [j.hex, ...(local.palette || []).filter(x => x !== j.hex)].slice(0, 3),
      type: ['top', 'bottom', 'shoes'].includes(j.type) ? j.type : local.type, pattern: ['solid', 'striped', 'checked', 'printed'].includes(j.pattern) ? j.pattern : local.pattern,
      occasion: ['casual', 'smart', 'formal', 'party', 'sport'].includes(j.occasion) ? j.occasion : local.occasion, style: j.style || local.style, label: j.label || '', colourName: j.colour || '',
    };
  } catch (e) { return local; }
}
export { hexToRgb };
