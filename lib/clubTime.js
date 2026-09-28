// lib/clubTime.js
// ============================================
// DATES AND TIMES IN THE CLUB'S TIME ZONE (commit 015).
//
// Everything on this site happens on the club's clock, never the visitor's:
// "today", the next two weeks, a tee time's day, an event's start. The club's
// zone comes from Verde (GET /club -> timezone) through components/Club.js.
//
// Two kinds of value, kept apart:
//   a calendar DATE   'YYYY-MM-DD' - a day at the club. Formatted at noon UTC
//                     with timeZone 'UTC', so no visitor's offset can move it
//                     to the day before or after.
//   an INSTANT        an ISO timestamp - a moment. Always formatted with the
//                     club's zone.
//
// Dates are written the American way: 10/05/2026.
// ============================================

export const DEFAULT_TZ = 'America/New_York';

const pad = (n) => String(n).padStart(2, '0');

/** The calendar date at the club for an instant (now, by default). */
export function ymdIn(tz, when = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz || DEFAULT_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(when);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

/** Today at the club. */
export const clubToday = (tz) => ymdIn(tz);

/** A calendar date moved by whole days. */
export function addDays(ymd, n) {
  const d = new Date(ymd + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}

/** Whole days from one calendar date to another. */
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);

/** 0 = Sunday, for a calendar date. */
export const weekdayOf = (ymd) => new Date(ymd + 'T12:00:00Z').getUTCDay();

/** A calendar date in words ({ weekday: 'long', month: 'long', day: 'numeric' }). */
export function fmtDay(ymd, opts = { weekday: 'long', month: 'long', day: 'numeric' }) {
  if (!ymd) return '';
  return new Date(ymd + 'T12:00:00Z').toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

/** A calendar date as MM/DD/YYYY. */
export function usDate(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  const [y, m, d] = ymd.split('-');
  return m + '/' + d + '/' + y;
}

/** MM/DD/YYYY (or M/D/YYYY) back to a calendar date; null when it isn't one. */
export function parseUs(text) {
  const m = String(text || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const ymd = m[3] + '-' + pad(Number(m[1])) + '-' + pad(Number(m[2]));
  return addDays(ymd, 0) === ymd ? ymd : null; // rejects 02/31/2026
}

/** An instant's time at the club: 7:30 AM. */
export function fmtTime(iso, tz) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz || DEFAULT_TZ });
}

/** An instant in words at the club ({ weekday, month, day, hour, minute }). */
export function fmtDateTime(iso, tz, opts = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { ...opts, timeZone: tz || DEFAULT_TZ });
}

/** The day at the club an instant falls on. */
export const ymdOfIso = (iso, tz) => ymdIn(tz, new Date(iso));
