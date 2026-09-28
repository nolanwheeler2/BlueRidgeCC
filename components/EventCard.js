// components/EventCard.js
// One event: a scene with its date, the title, when, fee, spots left and how
// full it is. `action` replaces the default Details link.
import Link from 'next/link';
import Scene from './Scene';
import { money } from '../lib/verdeClient';
import { useClub } from './Club';
import { fmtDay, fmtTime, ymdOfIso } from '../lib/clubTime';

export default function EventCard({ t, action }) {
  /* The event's day and time at the club (commit 015). */
  const { tz } = useClub();
  const day = t.starts_at ? ymdOfIso(t.starts_at, tz) : null;
  const pct = t.capacity ? Math.min(100, Math.round(((t.entrants || 0) / t.capacity) * 100)) : null;
  return (
    <div className="ev">
      <div className="top">
        <Scene kind="events" height={110} />
        {day ? <div className="badge"><b>{Number(day.slice(8))}</b><small>{fmtDay(day, { month: 'short' })}</small></div> : null}
      </div>
      <div className="body">
        <h3>{t.title}</h3>
        <div className="meta">
          {day ? fmtDay(day, { weekday: 'long' }) + ', ' + fmtTime(t.starts_at, tz) : ''}
          {t.format ? ' · ' + String(t.format).replace(/_/g, ' ') : ''}
        </div>
        <div className="tags">
          <span className="tag">{t.entry_fee_cents ? money(t.entry_fee_cents) + ' entry' : 'Free'}</span>
          {t.spots_left != null ? <span className={'tag' + (t.spots_left > 5 ? ' good' : '')}>{t.spots_left ? t.spots_left + ' spots left' : 'Full - waitlist'}</span> : null}
        </div>
        {pct != null ? <div className="spots" title={pct + '% full'}><i style={{ width: pct + '%' }} /></div> : null}
        <div className="foot">{action || <Link href="/tournaments" className="btn small ghost">Details</Link>}</div>
      </div>
    </div>
  );
}
