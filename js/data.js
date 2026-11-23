// Seed catalogue. Everything here is SAMPLE data and can be replaced from the Admin dashboard.
// (Admin → Settings → "Remove all sample data" clears it.)

export const BRAND = { name: 'AURELLE', tagline: 'Dress the whole look, not just the piece.' };

export const SEED_CATEGORIES = [
  { id: 'tshirts', name: 'T-shirts', group: 'top' },
  { id: 'shirts', name: 'Shirts', group: 'top' },
  { id: 'jeans', name: 'Jeans', group: 'bottom' },
  { id: 'trousers', name: 'Trousers', group: 'bottom' },
  { id: 'shorts', name: 'Shorts', group: 'bottom' },
  { id: 'jackets', name: 'Jackets', group: 'outer' },
  { id: 'shoes', name: 'Shoes', group: 'shoes' },
  { id: 'accessories', name: 'Accessories', group: 'accessory' },
];

const C = {
  ivory: ['Ivory', '#F1EEE7'], white: ['White', '#F7F6F2'], black: ['Black', '#1E1F21'], charcoal: ['Charcoal', '#3B3D41'],
  grey: ['Grey', '#8D9094'], stone: ['Stone', '#B9B3A7'], sand: ['Sand', '#D6C8AC'], navy: ['Navy', '#263349'],
  sky: ['Sky', '#A8BDD3'], sage: ['Sage', '#9DAE9A'], olive: ['Olive', '#6C7152'], terracotta: ['Terracotta', '#B5755C'],
  blush: ['Blush', '#E2C8C0'], burgundy: ['Burgundy', '#6C303B'], denim: ['Denim Blue', '#5C7894'], indigo: ['Indigo', '#3E5373'],
  light: ['Light Wash', '#9EB5CC'], blackdenim: ['Washed Black', '#2B2C2F'], camel: ['Camel', '#B58D5E'], khaki: ['Khaki', '#A89B77'],
  mustard: ['Mustard', '#C8A24E'], forest: ['Forest', '#40594A'], taupe: ['Taupe', '#8C7F73'], lilac: ['Lilac', '#B9B1C9'],
};
const col = (...keys) => keys.map(k => ({ name: C[k][0], hex: C[k][1] }));
const APP = ['S', 'M', 'L', 'XL', 'XXL'];
const WAIST = ['28', '30', '32', '34', '36'];
const SHOE = ['6', '7', '8', '9', '10', '11'];
const stock = (sizes, seed) => Object.fromEntries(sizes.map((s, i) => [s, ((seed * 7 + i * 5) % 13) + (i === 0 && seed % 4 === 0 ? 0 : 2)]));

let n = 0;
const P = (name, category, price, sale, colors, sizes, o = {}) => {
  n++;
  return {
    id: 'p' + String(n).padStart(3, '0'), name, category, price, salePrice: sale || null, colors, sizes,
    stock: o.stock || stock(sizes, n), pattern: o.pattern || 'solid', occasions: o.occasions || ['casual'],
    style: o.style || 'classic', fabric: o.fabric || '', tags: o.tags || [], shape: o.shape || null,
    description: o.desc || '', images: [], isNew: !!o.isNew, isTrending: !!o.isTrending, isFeatured: !!o.isFeatured,
    rating: o.rating || 4.3 + ((n * 3) % 7) / 10, ratingCount: 18 + n * 9, createdAt: Date.now() - n * 86400000 * 2, sample: true,
  };
};

export const SEED_PRODUCTS = [
  P('Everyday Heavy Tee', 'tshirts', 699, 599, col('ivory', 'black', 'sage', 'terracotta'), APP, { occasions: ['casual'], style: 'minimal', fabric: '240 GSM combed cotton', tags: ['neutrals', 'weekend'], isTrending: true, isNew: true, desc: 'A boxy, substantial tee that holds its shape wash after wash. Brushed inside, clean ribbed neck.' }),
  P('Stripe Breton Tee', 'tshirts', 849, null, col('ivory', 'navy'), APP, { pattern: 'striped', occasions: ['casual'], style: 'classic', fabric: 'Soft-spun cotton jersey', tags: ['weekend'], isFeatured: true, desc: 'A quiet nod to coastal wardrobes with a slim, even stripe and a relaxed drop shoulder.' }),
  P('Pocket Relaxed Tee', 'tshirts', 749, null, col('sand', 'charcoal', 'sky'), APP, { occasions: ['casual'], style: 'relaxed', fabric: 'Garment-dyed cotton', tags: ['weekend'], desc: 'Garment-dyed for a lived-in colour, finished with a single chest pocket.' }),
  P('Studio Print Tee', 'tshirts', 899, 799, col('white', 'olive'), APP, { pattern: 'printed', occasions: ['casual', 'party'], style: 'street', fabric: 'Organic cotton', tags: ['street'], isTrending: true, desc: 'Hand-drawn line print placed low on the chest. Limited run.' }),
  P('Linen Camp Shirt', 'shirts', 1499, 1299, col('white', 'sage', 'sand', 'sky'), APP, { occasions: ['casual', 'smart'], style: 'relaxed', fabric: 'Washed European linen', tags: ['summer', 'neutrals'], isNew: true, isFeatured: true, desc: 'An open-collar linen shirt with a boxy cut. Gets softer every wash.' }),
  P('Oxford Button-Down', 'shirts', 1699, null, col('sky', 'white', 'navy'), APP, { occasions: ['smart', 'formal', 'casual'], style: 'classic', fabric: 'Oxford cotton', tags: ['work'], isTrending: true, desc: 'The shirt that goes anywhere. Structured collar, mother-of-pearl style buttons.' }),
  P('Gingham Weekend Shirt', 'shirts', 1599, 1399, col('sage', 'blush'), APP, { pattern: 'checked', occasions: ['casual', 'smart'], style: 'relaxed', fabric: 'Yarn-dyed cotton', tags: ['weekend'], desc: 'A small-scale check in muted colours, easy enough for Sundays.' }),
  P('Mandarin Collar Shirt', 'shirts', 1799, null, col('black', 'ivory', 'burgundy'), APP, { occasions: ['smart', 'party', 'formal'], style: 'minimal', fabric: 'Cotton-poplin', tags: ['evening'], isNew: true, desc: 'Sharp, collarless line. Wear it buttoned up or open over a tee.' }),
  P('Straight Indigo Jeans', 'jeans', 2199, 1899, col('indigo', 'light', 'blackdenim'), WAIST, { occasions: ['casual', 'smart'], style: 'classic', fabric: '12 oz Japanese-style denim', tags: ['denim'], isTrending: true, isFeatured: true, desc: 'A true straight leg with a mid rise. Rigid enough to age beautifully.' }),
  P('Relaxed Tapered Jeans', 'jeans', 2399, null, col('denim', 'blackdenim'), WAIST, { occasions: ['casual'], style: 'relaxed', fabric: 'Stretch denim', tags: ['denim'], desc: 'Room through the thigh, tapered below the knee.' }),
  P('Wide Leg Jeans', 'jeans', 2299, 1999, col('light', 'stone'), WAIST, { occasions: ['casual', 'party'], style: 'street', fabric: 'Cotton twill denim', tags: ['denim', 'street'], isNew: true, desc: 'Floor-skimming and loose, in a washed denim finish.' }),
  P('Pleated Chinos', 'trousers', 1899, 1599, col('khaki', 'navy', 'olive', 'stone'), WAIST, { occasions: ['smart', 'casual', 'formal'], style: 'classic', fabric: 'Cotton twill, 2% elastane', tags: ['work', 'neutrals'], isTrending: true, desc: 'Single pleat, tapered leg. Equally good with a tee or a shirt.' }),
  P('Tailored Trousers', 'trousers', 2199, null, col('charcoal', 'black', 'taupe'), WAIST, { occasions: ['formal', 'smart', 'party'], style: 'minimal', fabric: 'Wool-blend suiting', tags: ['work', 'evening'], isFeatured: true, desc: 'Sharp crease, clean waistband, and a drape that looks expensive.' }),
  P('Linen Drawstring Trousers', 'trousers', 1799, null, col('sand', 'sage', 'ivory'), WAIST, { occasions: ['casual'], style: 'relaxed', fabric: 'Linen-cotton blend', tags: ['summer'], isNew: true, desc: 'Easy, elastic-back waist with a drawstring. Made for warm days.' }),
  P('Utility Cargo Trousers', 'trousers', 2099, 1799, col('olive', 'black'), WAIST, { occasions: ['casual', 'sport'], style: 'street', fabric: 'Ripstop cotton', tags: ['street'], desc: 'Six pockets, tapered ankle, tough enough for the daily commute.' }),
  P('Everyday Chino Shorts', 'shorts', 1199, 999, col('khaki', 'navy', 'sage'), WAIST, { occasions: ['casual'], style: 'classic', fabric: 'Cotton twill', tags: ['summer'], desc: 'Knee-grazing length with a clean flat front.' }),
  P('Linen Pull-On Shorts', 'shorts', 1099, null, col('ivory', 'terracotta', 'sky'), WAIST, { occasions: ['casual'], style: 'relaxed', fabric: 'Linen blend', tags: ['summer'], isNew: true, desc: 'Barely-there linen shorts with an easy elastic waist.' }),
  P('Denim Cut-Offs', 'shorts', 1299, null, col('light', 'blackdenim'), WAIST, { occasions: ['casual', 'party'], style: 'street', fabric: 'Cotton denim', tags: ['denim'], desc: 'Raw-hem denim shorts with a roomy fit.' }),
  P('Coach Jacket', 'jackets', 2999, 2599, col('navy', 'olive', 'black'), APP, { occasions: ['casual', 'smart'], style: 'street', fabric: 'Water-resistant nylon', tags: ['layers'], isTrending: true, desc: 'Snap-front coach jacket with a soft lining.' }),
  P('Wool Overshirt', 'jackets', 3799, null, col('camel', 'forest', 'charcoal'), APP, { pattern: 'checked', occasions: ['casual', 'smart'], style: 'classic', fabric: 'Brushed wool blend', tags: ['layers', 'winter'], isFeatured: true, desc: 'A heavy shirt-jacket you can wear as a light coat.' }),
  P('Washed Denim Jacket', 'jackets', 3299, 2899, col('denim', 'blackdenim'), APP, { occasions: ['casual', 'party'], style: 'classic', fabric: '11 oz denim', tags: ['denim', 'layers'], isNew: true, desc: 'The boxy trucker, softened with a stone wash.' }),
  P('Court Sneakers', 'shoes', 3299, 2799, col('white', 'black', 'sage'), SHOE, { occasions: ['casual', 'smart', 'party'], style: 'minimal', fabric: 'Full-grain leather', tags: ['neutrals'], isTrending: true, isFeatured: true, desc: 'Clean leather court sneakers with a cushioned insole.' }),
  P('Suede Derby Shoes', 'shoes', 3799, null, col('taupe', 'black', 'camel'), SHOE, { occasions: ['formal', 'smart', 'party'], style: 'classic', fabric: 'Suede upper, leather lining', tags: ['work'], desc: 'Soft suede, lightweight sole, and a profile slim enough for tailoring.' }),
  P('Canvas Low-Tops', 'shoes', 2499, 2199, col('ivory', 'navy', 'terracotta'), SHOE, { occasions: ['casual'], style: 'relaxed', fabric: 'Organic canvas', tags: ['weekend'], isNew: true, desc: 'Lightweight canvas low-tops that go with everything in the catalogue.' }),
  P('Canvas Cap', 'accessories', 599, null, col('navy', 'sand', 'olive'), ['One size'], { occasions: ['casual', 'sport'], style: 'classic', shape: 'cap', fabric: 'Cotton canvas', desc: 'Six-panel, unstructured, with a metal adjuster.' }),
  P('Leather Belt', 'accessories', 1199, 999, col('black', 'camel'), ['S', 'M', 'L'], { occasions: ['formal', 'smart', 'casual'], style: 'classic', shape: 'belt', fabric: 'Vegetable-tanned leather', desc: 'Full-grain leather with a brushed brass buckle.' }),
  P('Everyday Tote', 'accessories', 1499, null, col('ivory', 'black', 'terracotta'), ['One size'], { occasions: ['casual', 'smart'], style: 'minimal', shape: 'tote', fabric: 'Heavy cotton canvas', isTrending: true, desc: 'A roomy tote with an inner zip pocket and reinforced straps.' }),
  P('Minimal Watch', 'accessories', 1899, 1599, col('black', 'stone'), ['One size'], { occasions: ['formal', 'smart', 'casual'], style: 'minimal', shape: 'watch', fabric: 'Steel case, leather strap', isNew: true, desc: 'A slim, three-hand watch with a sapphire-coated glass.' }),
];

export const SEED_SETTINGS = {
  brandName: BRAND.name, tagline: BRAND.tagline, contactEmail: 'hello@yourbrand.in', phone: '+91 98765 43210', city: 'Bengaluru, India',
  shipping: { flat: 99, freeAbove: 1999, expressExtra: 149, codFee: 49 },
  bundle: { type: 'percent', value: 10 }, // 'percent' | 'flat' — applies when top + bottom + shoes are chosen
  social: { instagram: '#', facebook: '#', x: '#', youtube: '#' },
};

export const SEED_COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10, min: 999, maxOff: 500, active: true, note: '10% off your first order (up to ₹500)' },
  { code: 'FLAT200', type: 'flat', value: 200, min: 2499, maxOff: 0, active: true, note: '₹200 off orders above ₹2,499' },
  { code: 'FREESHIP', type: 'ship', value: 0, min: 0, maxOff: 0, active: true, note: 'Free standard shipping' },
];

// Curated bundles shown on the homepage. Discount follows the global bundle setting unless overridden.
export const SEED_OUTFITS = [
  { id: 'o1', name: 'Weekend Neutrals', note: 'Easy, quiet colours for slow days.', items: ['p001', 'p014', 'p024'], override: null },
  { id: 'o2', name: 'Smart Casual Friday', note: 'Office-ready without the stiffness.', items: ['p006', 'p012', 'p023'], override: null },
  { id: 'o3', name: 'Evening Out', note: 'Sharp lines for dinner and after.', items: ['p008', 'p013', 'p023'], override: { type: 'percent', value: 12 } },
];

export const SEED_REVIEWS = [
  { name: 'Ananya R.', city: 'Mumbai', text: 'I uploaded a photo of my old olive trousers and it suggested a tee I would never have picked. I wear that pair constantly now.', stars: 5 },
  { name: 'Karthik S.', city: 'Bengaluru', text: 'Building the outfit and seeing the price drop as I filled each slot was oddly satisfying. Fit and fabric are better than the price suggests.', stars: 5 },
  { name: 'Meera D.', city: 'Pune', text: 'Find Your Match saved me an hour of guessing. The linen shirt and sand trousers were an easy yes.', stars: 4 },
  { name: 'Rohan P.', city: 'Hyderabad', text: 'The jeans fit right out of the box, and delivery tracking was clear at every step.', stars: 5 },
];

export const COLLECTIONS = [
  { id: 'neutrals', name: 'Everyday Neutrals', blurb: 'Colours that go with everything', tag: 'neutrals' },
  { id: 'summer', name: 'Warm-Weather Linen', blurb: 'Light, breathable and easy', tag: 'summer' },
  { id: 'layers', name: 'Layer Up', blurb: 'Jackets and overshirts', tag: 'layers' },
];
