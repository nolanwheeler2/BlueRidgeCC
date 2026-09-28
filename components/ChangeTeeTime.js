// components/ChangeTeeTime.js
// ============================================
// Change a tee time on this site - the day, the time, who's playing, carts -
// as in the club's app (POST /bookings/{id}/change):
//   quote   the changed round priced; the difference and how it's settled
//   apply   made: member account charged or credited, card refunded, or at
//           the club - or, when more is owed by card, POST /payments with
//           type tee_adjust, and the change is made when it's paid
// Members who've already accepted stay, shown as confirmed.
// ============================================

import { useEffect, useState } from 'react';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';
import { DateStrip, Segmented, TimeGroups } from './Picker';
import GroupPlayers, { groupFields } from './GroupPlayers';
import CardPayment from './CardPayment';
import Result from './Result';
import { useClub } from './Club';
import { fmtTime, ymdOfIso } from '../lib/clubTime';


export default function ChangeTeeTime({ booking, onDone, onClose }) {
  const others = (booking.players || []).filter((p) => !p.is_me);
  /* The round's day and times at the club, not in the visitor's zone (commit 015). */
  const { tz } = useClub();
  const dayOf = (iso) => ymdOfIso(iso, tz);
  const [date, setDate] = useState(booking.start ? dayOf(booking.start) : todayPlus(1, tz));
  const [list, setList] = useState(null);
  const [start, setStart] = useState(booking.start);
  const [group, setGroup] = useState(others.map((p) => (p.member_id ? { kind: 'member', id: p.member_id, name: p.name, locked: !!p.accepted } : { kind: 'guest', name: p.name })));
  const [cart, setCart] = useState((booking.players || []).some((p) => p.cart));
  const [quote, setQuote] = useState(null);
  const [applied, setApplied] = useState(null);
  const [key] = useState(newKey());

  /* The round's own course (commit 006): its times, and priced at its rates. */
  const cid = booking.course_id || undefined;
  useEffect(() => { api('/tee-times?date=' + date + (cid ? '&course_id=' + cid : '')).then(setList); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps
  const body = () => ({ start, cart, ...(cid ? { course_id: cid } : {}), ...groupFields(group) });
  useEffect(() => {
    if (!start) return;
    const t = setTimeout(async () => setQuote(await api('/bookings/' + booking.id + '/change', { method: 'POST', body: { action: 'quote', ...body() } })), 250);
    return () => clearTimeout(t);
  }, [start, cart, JSON.stringify(group)]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = quote?.json?.quote;
  const times = (list?.json?.tee_times || []).map((t) => ({ key: t.start, iso: t.start, label: t.time, sub: t.spots_remaining + ' open', t }));
  if (booking.start && dayOf(booking.start) === date && !times.some((t) => t.iso === booking.start)) {
    times.unshift({ key: booking.start, iso: booking.start, label: fmtTime(booking.start, list?.json?.timezone || tz), sub: 'your time', t: { start: booking.start } });
  }
  const delta = q?.delta_cents ?? 0;
  const settle = !q ? '' : delta === 0 ? 'No change in price.'
    : delta > 0 ? money(delta) + ' more, ' + (q.settle === 'account' ? 'charged to your member account.' : q.settle === 'card' ? 'paid by card.' : 'paid at the club.')
    : money(-delta) + ' less, ' + (q.settle === 'account' ? 'credited to your member account.' : q.settle === 'card' ? 'refunded to your card.' : 'settled at the club.');

  const apply = async () => {
    const r = await api('/bookings/' + booking.id + '/change', { method: 'POST', key, body: { action: 'apply', ...body(), expected_delta_cents: delta } });
    setApplied(r);
    if (r.ok) onDone();
  };

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h2>Change your tee time</h2>
      <p className="sub">Pick a new time or change who&rsquo;s playing. Members who&rsquo;ve accepted stay with the round.</p>
      <DateStrip value={date} onChange={setDate} />
      {times.length ? <TimeGroups slots={times} value={start} onPick={(s) => setStart(s.iso)} tz={list?.json?.timezone} /> : <p className="empty">No open times that day.</p>}
      <h3 style={{ margin: '20px 0 10px', fontSize: 15 }}>Who&rsquo;s playing</h3>
      <GroupPlayers value={group} onChange={setGroup} />
      {/* Walking or riding, the same control as the tee times page (commit 021). */}
      <div style={{ marginTop: 12 }}><Segmented label="Getting around" value={cart ? 'cart' : 'walk'} onChange={(v) => setCart(v === 'cart')} options={[['walk', 'Walking'], ['cart', 'Carts for the group']]} /></div>
      {q ? <div className="notice info">New total {money(q.total_cents)}. {settle}</div> : null}
      {quote && !quote.ok ? <div className="notice bad">{quote.json?.error?.message}</div> : null}
      {applied && !applied.ok ? <div className="notice bad">{applied.json?.error?.message}</div> : null}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={onClose}>Keep as is</button>
        {q && q.settle === 'card' && delta > 0 ? (
          <CardPayment label={'Pay ' + money(delta) + ' and change'} start={{ type: 'tee_adjust', booking_id: booking.id, ...body(), expected_delta_cents: delta }} onDone={() => onDone()} />
        ) : (
          <button className="btn" disabled={!q} onClick={apply}>Make the change</button>
        )}
      </div>
      <Result result={quote} title={'POST /bookings/' + booking.id.slice(0, 8) + '…/change (quote)'} />
      <Result result={applied} title="POST /bookings/{id}/change (apply)" />
    </div>
  );
}
