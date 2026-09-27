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
import { DateStrip, TimeGroups, Toggle } from './Picker';
import GroupPlayers, { groupFields } from './GroupPlayers';
import CardPayment from './CardPayment';
import Result from './Result';

const dayOf = (iso) => { const d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

export default function ChangeTeeTime({ booking, onDone, onClose }) {
  const others = (booking.players || []).filter((p) => !p.is_me);
  const [date, setDate] = useState(booking.start ? dayOf(booking.start) : todayPlus(1));
  const [list, setList] = useState(null);
  const [start, setStart] = useState(booking.start);
  const [group, setGroup] = useState(others.map((p) => (p.member_id ? { kind: 'member', id: p.member_id, name: p.name, locked: !!p.accepted } : { kind: 'guest', name: p.name })));
  const [cart, setCart] = useState((booking.players || []).some((p) => p.cart));
  const [quote, setQuote] = useState(null);
  const [applied, setApplied] = useState(null);
  const [key] = useState(newKey());

  useEffect(() => { api('/tee-times?date=' + date).then(setList); }, [date]);
  const body = () => ({ start, cart, ...groupFields(group) });
  useEffect(() => {
    if (!start) return;
    const t = setTimeout(async () => setQuote(await api('/bookings/' + booking.id + '/change', { method: 'POST', body: { action: 'quote', ...body() } })), 250);
    return () => clearTimeout(t);
  }, [start, cart, JSON.stringify(group)]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = quote?.json?.quote;
  const times = (list?.json?.tee_times || []).map((t) => ({ key: t.start, iso: t.start, label: t.time, sub: t.spots_remaining + ' open', t }));
  if (booking.start && dayOf(booking.start) === date && !times.some((t) => t.iso === booking.start)) {
    times.unshift({ key: booking.start, iso: booking.start, label: new Date(booking.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), sub: 'your time', t: { start: booking.start } });
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
      <div style={{ marginTop: 12 }}><Toggle checked={cart} onChange={setCart} title="Carts" detail="For the group" /></div>
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
