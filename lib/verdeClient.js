// lib/verdeClient.js
// ============================================
// The pages' side: call this site's /api/verde/... pass-through. Every POST
// that makes something gets its own Idempotency-Key, so a double click or a
// retry can't book twice (Verde replays the first answer).
//
// Every call is also reported to the developer console (commit 008,
// components/DevConsole): method, path, status, time taken, what was sent and
// what came back. Nothing is shown unless Developer view is on.
// ============================================

export function newKey() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

let seq = 0;

export async function api(path, { method = 'GET', body, key } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method === 'POST') headers['Idempotency-Key'] = key || newKey();
  const started = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const id = ++seq;
  let res;
  let json;
  try {
    res = await fetch('/api/verde' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    json = await res.json().catch(() => ({ error: { code: 'bad_response', message: 'No JSON from this site.' } }));
  } catch (e) {
    json = { error: { code: 'network', message: 'This site could not be reached.' } };
  }
  const out = { ok: !!res?.ok, status: res?.status || 0, json, replayed: res?.headers.get('idempotent-replayed') === 'true' };
  if (typeof window !== 'undefined') {
    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started);
    window.dispatchEvent(new CustomEvent('verde:api', { detail: {
      id, at: Date.now(), method, path, status: out.status, ms, replayed: out.replayed,
      idempotencyKey: headers['Idempotency-Key'] || null, request: body === undefined ? null : body, response: json,
    } }));
  }
  return out;
}

export const money = (cents) => (cents == null ? '-' : (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }));

export function timeIn(iso, tz) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz || undefined });
}

export function todayPlus(days = 0) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
