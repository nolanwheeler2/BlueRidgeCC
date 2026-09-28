// components/DatePicker.js
// ============================================
// A date field that always reads MM/DD/YYYY (commit 015).
//
// The browser's own date field shows whatever the visitor's computer is set
// to - day/month/year abroad - and counts days on the visitor's clock. This
// one is the club's: typed or picked as 10/05/2026, with a calendar whose
// "today" is today at the club (components/Club).
//
//   <DatePicker value="2026-10-05" onChange={setDate} min={today} label="Arrive" />
//   allow={[5]}      only these weekdays (0 = Sunday), e.g. a package's arrivals
//   variant="tile"   the "Other" tile at the end of a day strip
//
// Typing: digits fill in the slashes; Enter or leaving the field applies it,
// and anything that isn't a real, allowed date goes back to the last good one.
// ============================================

import { useEffect, useRef, useState } from 'react';
import { useClub } from './Club';
import { addDays, clubToday, fmtDay, parseUs, usDate, weekdayOf } from '../lib/clubTime';

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const firstOfMonth = (ymd) => ymd.slice(0, 8) + '01';
const monthShift = (first, n) => { const [y, m] = first.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1, 12)); return d.toISOString().slice(0, 10); };

/* Digits typed become MM/DD/YYYY as they go. */
function mask(text) {
  const d = String(text).replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, 2) + '/' + d.slice(2);
  return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
}

export default function DatePicker({ value, onChange, min, max, allow, label, variant, id }) {
  const { tz } = useClub();
  const today = clubToday(tz);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(usDate(value));
  const [month, setMonth] = useState(firstOfMonth(value || today));
  const box = useRef(null);
  const trigger = useRef(null);
  /* The tile sits inside a strip that scrolls sideways, which would clip a
     calendar opening inside it - so the tile's calendar floats above the page,
     placed under the tile, and moves with it. */
  const [float, setFloat] = useState(null);
  const place = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (r) setFloat({ top: r.bottom + 6, left: Math.max(12, Math.min(r.right - 296, window.innerWidth - 308)) });
  };
  const openTile = () => { if (open) { setOpen(false); return; } place(); setOpen(true); };

  useEffect(() => { setText(usDate(value)); if (value) setMonth(firstOfMonth(value)); }, [value]);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    /* A floating calendar follows its tile as the page or the strip scrolls. */
    const moved = () => { if (variant === 'tile') place(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', moved, true);
    window.addEventListener('resize', moved);
    return () => {
      document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', moved, true); window.removeEventListener('resize', moved);
    };
  }, [open]);

  const ok = (ymd) => !!ymd && (!min || ymd >= min) && (!max || ymd <= max) && (!allow || allow.includes(weekdayOf(ymd)));
  const pick = (ymd) => { if (ok(ymd)) { onChange(ymd); setOpen(false); } };
  const commit = () => { const ymd = parseUs(text); if (ymd && ok(ymd)) { if (ymd !== value) onChange(ymd); } else setText(usDate(value)); };

  /* The month's grid: blanks before the 1st, then each day. */
  const days = [];
  const lead = weekdayOf(month);
  for (let i = 0; i < lead; i++) days.push(null);
  for (let d = month; d.slice(0, 7) === month.slice(0, 7); d = addDays(d, 1)) days.push(d);
  const canBack = !min || monthShift(month, -1) >= firstOfMonth(min) || monthShift(month, -1).slice(0, 7) === min.slice(0, 7);

  const calendar = open ? (
    <div className={'dp-pop' + (variant === 'tile' ? ' floating' : '')} role="dialog" aria-label="Choose a date"
      style={variant === 'tile' && float ? { position: 'fixed', top: float.top, left: float.left, right: 'auto' } : undefined}>
      <div className="dp-head">
        <button type="button" className="dp-nav" onClick={() => setMonth(monthShift(month, -1))} disabled={!canBack} aria-label="Previous month">&#8249;</button>
        <b>{fmtDay(month, { month: 'long', year: 'numeric' })}</b>
        <button type="button" className="dp-nav" onClick={() => setMonth(monthShift(month, 1))} aria-label="Next month">&#8250;</button>
      </div>
      <div className="dp-grid">
        {WEEK.map((w) => <span key={w} className="dp-w">{w}</span>)}
        {days.map((d, i) => d ? (
          <button type="button" key={d} disabled={!ok(d)} onClick={() => pick(d)}
            className={'dp-d' + (d === value ? ' on' : '') + (d === today ? ' today' : '')}
            aria-label={fmtDay(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} aria-pressed={d === value}>
            {Number(d.slice(8))}
          </button>
        ) : <span key={'b' + i} />)}
      </div>
    </div>
  ) : null;

  if (variant === 'tile') {
    return (
      <div className="dp tile-dp" ref={box}>
        <button type="button" ref={trigger} className={'day more' + (value ? ' on' : '')} onClick={openTile} aria-expanded={open}>
          {value
            ? <><small>{fmtDay(value, { weekday: 'short' })}</small><b>{Number(value.slice(8))}</b><small>{fmtDay(value, { month: 'short' })}</small></>
            : <><small>Other</small><b>+</b><small>Date</small></>}
        </button>
        {calendar}
      </div>
    );
  }

  return (
    <div className="dp" ref={box}>
      {label ? <label className="dp-label" htmlFor={id}>{label}</label> : null}
      <div className="dp-field">
        <input id={id} inputMode="numeric" placeholder="MM/DD/YYYY" value={text} maxLength={10}
          onChange={(e) => setText(mask(e.target.value))}
          onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
          onFocus={() => setOpen(true)} aria-label={label || 'Date'} />
        <button type="button" className="dp-open" onClick={() => setOpen((o) => !o)} aria-label="Open calendar" tabIndex={-1}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 6h13M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.2" /></svg>
        </button>
      </div>
      {calendar}
    </div>
  );
}
