// Creates a Razorpay order. Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on Vercel.
// Without them this returns 501 and the checkout shows a clearly-labelled test payment simulator.
// PRODUCTION NOTE: once you have a real database, compute `amount` here from the stored cart/prices
// instead of trusting the browser. The prototype accepts the amount from the client.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return res.status(501).json({ error: 'Razorpay is not configured' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const amount = Math.round(Number(body?.amount));
    if (!Number.isInteger(amount) || amount < 100 || amount > 50_000_000) return res.status(400).json({ error: 'Invalid amount' });
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'content-type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt: String(body?.receipt || '').slice(0, 40) }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Payment provider error' });
    const o = await r.json();
    return res.status(200).json({ orderId: o.id, amount: o.amount, keyId: id });
  } catch (e) {
    return res.status(500).json({ error: 'Could not create order' });
  }
}
