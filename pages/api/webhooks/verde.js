// pages/api/webhooks/verde.js
// ============================================
// The address to give Verde: https://<this site>/api/webhooks/verde
//
// Checks each delivery the way /developers describes:
//   * recompute Verde-Signature (t=<unix>,v1=<hex HMAC-SHA256 of "t.body">)
//     from the RAW body with VERDE_WEBHOOK_SECRET, compared in constant time;
//   * refuse a timestamp more than five minutes off, so a copied request
//     can't be replayed;
//   * answer 2xx quickly, and ignore an event id already seen (Verde can
//     deliver the same event twice).
// ============================================

import crypto from 'crypto';
import { remember, recent } from '../../../lib/webhookLog';

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function isFromVerde(raw, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(String(header).split(',').map((p) => p.split('=')));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(parts.t + '.' + raw).digest('hex');
  const got = String(parts.v1 || '');
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const raw = await rawBody(req);
  const ok = isFromVerde(raw, req.headers['verde-signature'], process.env.VERDE_WEBHOOK_SECRET);
  const eventId = String(req.headers['verde-event-id'] || '');
  if (!ok) {
    console.warn('[webhook] refused: signature did not verify', eventId);
    remember({ at: new Date().toISOString(), verified: false, type: req.headers['verde-event-type'] || '?', id: eventId });
    return res.status(401).json({ error: 'signature' });
  }
  if (recent().some((e) => e.verified && e.id === eventId)) return res.status(200).json({ ok: true, duplicate: true });
  let event = null;
  try { event = JSON.parse(raw); } catch { /* verified but not JSON - keep the raw text */ }
  console.log('[webhook]', req.headers['verde-event-type'], eventId, raw);
  remember({ at: new Date().toISOString(), verified: true, type: req.headers['verde-event-type'], id: eventId, event: event || raw });
  return res.status(200).json({ ok: true });
}
