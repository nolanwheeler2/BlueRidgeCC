// pages/manage.js
// Look up and cancel a booking:
//   tee times   GET /bookings/{id}, POST /bookings/{id}/cancel
//   simulators  POST /simulators/reservations/{id}/cancel
//   courts      POST /courts/reservations/{id}/cancel
//   dining      POST /dining/reservations/{id}/cancel
//   rooms       POST /lodging/reservations/{id}/cancel
//   packages    GET /packages/bookings/{id}, POST /packages/bookings/{id}/cancel
// Cancellation fees are reported, never waived.
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import { Segmented } from '../components/Picker';
import { api, money } from '../lib/verdeClient';

const KINDS = {
  tee: ['Tee time', (id) => '/bookings/' + id + '/cancel'],
  sim: ['Simulator', (id) => '/simulators/reservations/' + id + '/cancel'],
  court: ['Court', (id) => '/courts/reservations/' + id + '/cancel'],
  dining: ['Dining', (id) => '/dining/reservations/' + id + '/cancel'],
  room: ['Room', (id) => '/lodging/reservations/' + id + '/cancel'],
  pkg: ['Package', (id) => '/packages/bookings/' + id + '/cancel'],
};
const LOOKUP = { tee: (id) => '/bookings/' + id, pkg: (id) => '/packages/bookings/' + id };

export default function Manage() {
  const [kind, setKind] = useState('tee');
  const [id, setId] = useState('');
  const [look, setLook] = useState(null);
  const [cancel, setCancel] = useState(null);
  const b = look?.json?.booking;
  const canceled = b && String(b.status).startsWith('cancel');
  return (
    <Layout title="Manage a Booking" intro="Look up or cancel a booking with the reference in your confirmation.">
      <div className="wrap" style={{ padding: '36px 24px 72px', maxWidth: 860 }}>
        <div className="info-grid">
          <div className="info"><b>Changing plans?</b><span>Cancel here, then book a new time - it only takes a minute.</span></div>
          <div className="info"><b>Cancellation fees</b><span>Some bookings close to the time carry a fee; you&rsquo;ll see it before anything is charged.</span></div>
          <div className="info"><b>Need help?</b><span>Call the club and we&rsquo;ll sort it out.</span></div>
        </div>
        <div className="panel">
          <h2>Find your booking</h2>
          <p className="sub">Choose what you booked and paste its reference.</p>
          <Segmented value={kind} onChange={(k) => { setKind(k); setLook(null); setCancel(null); }} options={Object.entries(KINDS).map(([v, [l]]) => [v, l])} />
          <div className="fields" style={{ marginTop: 16 }}>
            <label className="field grow">Reference<input value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="00000000-0000-0000-0000-000000000000" /></label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {LOOKUP[kind] ? <button className="btn ghost" disabled={!id} onClick={async () => { setCancel(null); setLook(await api(LOOKUP[kind](id))); }}>Look it up</button> : null}
            <button className="btn" disabled={!id || canceled} onClick={async () => { if (window.confirm('Cancel this ' + KINDS[kind][0].toLowerCase() + '?')) setCancel(await api(KINDS[kind][1](id), { method: 'POST', body: {} })); }}>Cancel it</button>
          </div>
          {b && kind === 'pkg' ? (
            <div className="resource" style={{ gridTemplateColumns: '1fr', marginTop: 18 }}>
              <div className="body">
                <h3>{b.package?.name || 'Package'}, {b.guests} {b.guests === 1 ? 'guest' : 'guests'}, arriving {new Date(b.arrival + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                <div className="tags">
                  <span className={'tag' + (canceled ? '' : ' good')}>{canceled ? 'Canceled' : 'Confirmed'}</span>
                  {b.confirmation ? <span className="tag">Confirmation {b.confirmation}</span> : null}
                  {b.room ? <span className="tag">{b.room.name}</span> : null}
                  <span className="tag">{money(b.paid_cents)} paid of {money(b.total_cents)}</span>
                  {b.balance_cents > 0 ? <span className="tag">{money(b.balance_cents)} due on arrival</span> : null}
                </div>
                {(b.tee_times || []).map((t, i) => <p key={i} style={{ margin: '8px 0 0' }}>Tee time: {new Date(t.start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}, {t.players} {t.players === 1 ? 'player' : 'players'}</p>)}
                {(b.credits || []).map((c) => <p key={c.kind} style={{ margin: '4px 0 0' }}>{c.kind === 'food_and_beverage' ? 'Food and drink' : 'Pro shop'} credit: {money(c.remaining_cents)} left of {money(c.amount_cents)}</p>)}
              </div>
            </div>
          ) : b ? (
            <div className="resource" style={{ gridTemplateColumns: '1fr', marginTop: 18 }}>
              <div className="body">
                <h3>{b.players} {b.players === 1 ? 'player' : 'players'}{b.start ? ', ' + new Date(b.start).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</h3>
                <div className="tags">
                  <span className={'tag' + (canceled ? '' : ' good')}>{canceled ? 'Canceled' : 'Confirmed'}</span>
                  {b.holes ? <span className="tag">{b.holes} holes</span> : null}
                  {b.total_cents != null ? <span className="tag">{money(b.total_cents)}</span> : null}
                  {b.access_code ? <span className="tag">Code {b.access_code}</span> : null}
                </div>
              </div>
            </div>
          ) : null}
          {cancel?.ok ? <div className="notice info">{cancel.json?.already_cancelled ? 'This booking was already canceled.' : (cancel.json?.message || ('Canceled.' + (cancel.json?.fee_cents > 0 ? ' A late fee of ' + money(cancel.json.fee_cents) + ' applies.' : '') + (cancel.json?.paid_cents > (cancel.json?.fee_cents || 0) ? ' The club will refund ' + money(cancel.json.paid_cents - (cancel.json?.fee_cents || 0)) + '.' : '')))}</div> : null}
          <Notice result={cancel} kind="bad" />
          <Notice result={look} kind="bad" />
        </div>
        <Result result={cancel} title="Cancel" />
        <Result result={look} title={kind === 'pkg' ? 'GET /packages/bookings/{id}' : 'GET /bookings/{id}'} />
      </div>
    </Layout>
  );
}
