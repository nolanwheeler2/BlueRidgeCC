// lib/verdeClient.js
// ============================================
// The pages' side: call this site's /api/verde/... pass-through. Every POST
// that makes something gets its own Idempotency-Key, so a double click or a
// retry can't book twice (Verde replays the first answer).
// ============================================

export function newKey() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

export async function api(path, { method = 'GET', body, key } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method === 'POST') headers['Idempotency-Key'] = key || newKey();
  const res = await fetch('/api/verde' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => ({ error: { code: 'bad_response', message: 'No JSON from this site.' } }));
  return { ok: res.ok, status: res.status, json, replayed: res.headers.get('idempotent-replayed') === 'true' };
}

export const money = (cents) => (cents == null ? '-' : (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }));

export function timeIn(iso, tz) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz || undefined });
}

export function todayPlus(days = 0) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
