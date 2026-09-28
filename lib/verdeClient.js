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

import { DEFAULT_TZ, addDays, clubToday, fmtTime } from './clubTime';

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

/* On the club's clock (commit 015): a time at the club, and a day counted from
   today at the club - never the visitor's own time zone. Pages get the zone
   from components/Club (useClub().tz). */
export function timeIn(iso, tz) {
  return fmtTime(iso, tz || DEFAULT_TZ);
}

export function todayPlus(days = 0, tz = DEFAULT_TZ) {
  return addDays(clubToday(tz), days);
}


/* A SHORT MEMORY FOR WHAT'S BEEN SHOWN (commit 029). A day's tee times, kept
   for a little while in the page, so going back to a day shows it at once -
   and fetching the next day in the background (prefetch) so moving forward is
   instant. Anything older than `fresh` is shown and asked for again; nothing
   older than `keep` is shown at all. Booking is always checked by Verde, so a
   moment-old list can never book a time that's gone. */
const memory = new Map();
export function remembered(path, keep = 120000) {
  const hit = memory.get(path);
  return hit && Date.now() - hit.at < keep ? hit.value : null;
}
export async function apiRemembered(path, fresh = 15000) {
  const hit = memory.get(path);
  if (hit && Date.now() - hit.at < fresh) return hit.value;
  if (hit && hit.pending) return hit.pending;
  const pending = api(path).then((value) => { if (value.ok) memory.set(path, { at: Date.now(), value }); else memory.delete(path); return value; });
  memory.set(path, { at: hit ? hit.at : 0, value: hit ? hit.value : null, pending });
  return pending;
}
export function prefetch(path) { void apiRemembered(path); }
export function forget(prefix) { for (const k of Array.from(memory.keys())) if (k.startsWith(prefix)) memory.delete(k); }
