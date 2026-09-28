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
import { readCookie, cookie, MEMBER_COOKIE } from '../../../lib/cookies';

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
  const started = Date.now();
  const out = await verde(path, {
    method: req.method,
    body: req.method === 'POST' ? (req.body || {}) : undefined,
    idempotencyKey: req.headers['idempotency-key'] || undefined,
    memberToken: readCookie(req, MEMBER_COOKIE) || undefined,
  });
  /* The member's sign-in ended on Verde's side (signed out elsewhere, turned
     off, expired): forget it here too, so the site shows them signed out. */
  if (out.status === 401 && out.json?.error?.code === 'member_token_invalid') res.setHeader('Set-Cookie', cookie(MEMBER_COOKIE, '', { maxAge: 0 }));
  if (out.replayed) res.setHeader('Idempotent-Replayed', 'true');
  /* WHERE THE TIME GOES (commit 030): the Network tab's Timing shows this
     site's own time, the trip to Verde, and Verde's breakdown of its part -
     so a slow request says which leg is slow. Times only. */
  const timing = [
    'site;dur=' + Math.max(0, Date.now() - started - (out.tripMs || 0)) + ';desc="This site"',
    'verde-trip;dur=' + (out.tripMs || 0) + ';desc="Trip to Verde and back"',
  ];
  if (out.verdeTiming) timing.push(out.verdeTiming);
  res.setHeader('Server-Timing', timing.join(', '));
  return res.status(out.status).json(out.json);
}
