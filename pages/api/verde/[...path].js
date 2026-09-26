// pages/api/verde/[...path].js
// ============================================
// This site's pass-through to Verde's Booking API (lib/verdeServer.js adds
// the secret key). /api/verde/tee-times?date=... becomes
// GET https://imverde.com/api/public/v1/tee-times?date=...
//
// A test site: anyone who can open it can use this club's key through here.
// Use a key for a test club, and turn it off in Verde when you're done.
// ============================================

import { verde } from '../../../lib/verdeServer';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'GET or POST.' } });
  }
  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  if (parts.some((p) => !/^[A-Za-z0-9_-]+$/.test(String(p || '')))) {
    return res.status(400).json({ error: { code: 'bad_path', message: 'That is not an API path.' } });
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) { if (k !== 'path' && typeof v === 'string') qs.set(k, v); }
  const path = '/' + parts.join('/') + (qs.toString() ? '?' + qs.toString() : '');
  const out = await verde(path, {
    method: req.method,
    body: req.method === 'POST' ? (req.body || {}) : undefined,
    idempotencyKey: req.headers['idempotency-key'] || undefined,
  });
  if (out.replayed) res.setHeader('Idempotent-Replayed', 'true');
  return res.status(out.status).json(out.json);
}
