// lib/verdeServer.js
// ============================================
// Talking to Verde's Booking API from THIS site's server.
//
// The secret key (VERDE_API_KEY) never reaches a browser: every page calls
// this site's own /api/verde/... route, which adds the key here and forwards
// the request. That's the pattern any real integration should follow - Verde
// refuses a request that carries a browser's Origin header anyway.
//
// REDIRECTS ARE NOT FOLLOWED (commit 003). imverde.com redirects to
// www.imverde.com, and fetch follows a redirect to another host by DROPPING
// the Authorization header - so the key silently went missing and Verde
// answered 401 "Send your secret key". A redirect now comes back as a plain
// error naming the address to put in VERDE_API_BASE instead.
// ============================================

const BASE = (process.env.VERDE_API_BASE || 'https://www.imverde.com/api/public/v1').replace(/\/+$/, '');

/** Verde's own address (for sending a member to sign in), from the API base. */
export function verdeOrigin() { return new URL(BASE).origin; }

export async function verde(path, { method = 'GET', body, idempotencyKey, memberToken } = {}) {
  if (!process.env.VERDE_API_KEY) {
    return { status: 500, json: { error: { code: 'not_configured', message: 'VERDE_API_KEY is not set on this site.' } } };
  }
  const headers = { Authorization: 'Bearer ' + process.env.VERDE_API_KEY.trim(), Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  /* A signed-in member (Sign in with Verde): the API acts as them. */
  if (memberToken) headers['Verde-Member'] = memberToken;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  } catch (e) {
    /* Verde unreachable (DNS, network, a wrong VERDE_API_BASE): an answer the
       pages can show, not a crashed request (commit 009). */
    return { status: 502, json: { error: { code: 'unreachable', message: 'Verde could not be reached at ' + BASE + '. Check VERDE_API_BASE.' } } };
  }
  if (res.status >= 300 && res.status < 400) {
    const to = res.headers.get('location') || '';
    const base = to ? to.replace(/(\/api\/public\/v1).*$/, '$1') : '';
    return { status: 502, json: { error: { code: 'redirected',
      message: 'Verde redirected this request' + (to ? ' to ' + to : '') + ', which would drop the API key. Set VERDE_API_BASE to ' + (base || 'the address it redirects to') + ' and redeploy.' } } };
  }
  let json = null;
  try { json = await res.json(); } catch { json = { error: { code: 'bad_response', message: 'Verde did not answer with JSON (HTTP ' + res.status + '). Check VERDE_API_BASE.' } }; }
  return { status: res.status, json, replayed: res.headers.get('idempotent-replayed') === 'true' };
}
