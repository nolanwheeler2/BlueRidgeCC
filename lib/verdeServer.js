// lib/verdeServer.js
// ============================================
// Talking to Verde's Booking API from THIS site's server.
//
// The secret key (VERDE_API_KEY) never reaches a browser: every page calls
// this site's own /api/verde/... route, which adds the key here and forwards
// the request. That's the pattern any real integration should follow - Verde
// refuses a request that carries a browser's Origin header anyway.
// ============================================

const BASE = (process.env.VERDE_API_BASE || 'https://imverde.com/api/public/v1').replace(/\/+$/, '');

export async function verde(path, { method = 'GET', body, idempotencyKey } = {}) {
  if (!process.env.VERDE_API_KEY) {
    return { status: 500, json: { error: { code: 'not_configured', message: 'VERDE_API_KEY is not set on this site.' } } };
  }
  const headers = { Authorization: 'Bearer ' + process.env.VERDE_API_KEY, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null;
  try { json = await res.json(); } catch { json = { error: { code: 'bad_response', message: 'Verde did not answer with JSON (HTTP ' + res.status + ').' } }; }
  return { status: res.status, json, replayed: res.headers.get('idempotent-replayed') === 'true' };
}
