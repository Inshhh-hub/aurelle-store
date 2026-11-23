// Verifies the Razorpay payment signature on the server (never trust the browser alone).
import { createHmac, timingSafeEqual } from 'node:crypto';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(501).json({ error: 'Razorpay is not configured' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s } = b || {};
    if (!o || !p || !s) return res.status(400).json({ error: 'Missing fields' });
    const expected = createHmac('sha256', secret).update(`${o}|${p}`).digest('hex');
    const a = Buffer.from(expected), c = Buffer.from(String(s));
    if (a.length !== c.length || !timingSafeEqual(a, c)) return res.status(400).json({ verified: false });
    return res.status(200).json({ verified: true });
  } catch (e) {
    return res.status(500).json({ error: 'Verification failed' });
  }
}
