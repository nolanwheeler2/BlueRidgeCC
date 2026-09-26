// components/EventCard.js
// One event: a scene with its date, the title, when, fee, spots left and how
// full it is. `action` replaces the default Details link.
import Link from 'next/link';
import Scene from './Scene';
import { money } from '../lib/verdeClient';

export default function EventCard({ t, action }) {
  const d = t.starts_at ? new Date(t.starts_at) : null;
  const pct = t.capacity ? Math.min(100, Math.round(((t.entrants || 0) / t.capacity) * 100)) : null;
  return (
    <div className="ev">
      <div className="top">
        <Scene kind="events" height={110} />
        {d ? <div className="badge"><b>{d.getDate()}</b><small>{d.toLocaleDateString('en-US', { month: 'short' })}</small></div> : null}
      </div>
      <div className="body">
        <h3>{t.title}</h3>
        <div className="meta">
          {d ? d.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
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
