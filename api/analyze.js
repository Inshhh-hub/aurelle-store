// Optional AI vision for "Upload & Match". Needs the ANTHROPIC_API_KEY environment variable on Vercel.
// Without it this returns 501 and the website falls back to on-device colour analysis automatically.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ error: 'AI vision is not configured' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body?.image || '');
    if (!m || m[2].length > 1_800_000) return res.status(400).json({ error: 'Send a JPEG/PNG/WebP data URL under ~1.3 MB' });
    const prompt = 'You analyse one photographed clothing item for a fashion store. Reply with ONLY compact JSON: ' +
      '{"type":"top|bottom|shoes","hex":"#rrggbb dominant garment colour (ignore background)","colour":"plain colour name","pattern":"solid|striped|checked|printed","occasion":"casual|smart|formal|party|sport","style":"classic|minimal|relaxed|street","label":"e.g. olive cargo trousers"}. ' +
      'If it is a jacket or layer treat it as "top". If unsure, make your best guess.';
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5', max_tokens: 300,
        messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }, { type: 'text', text: prompt }] }],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Vision service error' });
    const j = await r.json();
    const text = (j.content || []).map(c => c.text || '').join('');
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return res.status(200).json({
      type: ['top', 'bottom', 'shoes'].includes(parsed.type) ? parsed.type : 'top', hex: /^#[0-9a-f]{6}$/i.test(parsed.hex) ? parsed.hex : null,
      colour: String(parsed.colour || '').slice(0, 30), pattern: parsed.pattern, occasion: parsed.occasion, style: parsed.style, label: String(parsed.label || '').slice(0, 60),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Could not analyse image' });
  }
}
