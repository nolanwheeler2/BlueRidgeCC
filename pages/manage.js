// pages/manage.js
// Look up and cancel a booking:
//   tee times   GET /bookings/{id}, POST /bookings/{id}/cancel
//   simulators  POST /simulators/reservations/{id}/cancel
//   courts      POST /courts/reservations/{id}/cancel
//   dining      POST /dining/reservations/{id}/cancel
// Cancellation fees are reported, never waived.
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import { api } from '../lib/verdeClient';

const KINDS = [
  ['tee', 'Tee time', (id) => '/bookings/' + id + '/cancel'],
  ['sim', 'Simulator', (id) => '/simulators/reservations/' + id + '/cancel'],
  ['court', 'Court', (id) => '/courts/reservations/' + id + '/cancel'],
  ['dining', 'Dining', (id) => '/dining/reservations/' + id + '/cancel'],
];

export default function Manage() {
  const [kind, setKind] = useState('tee');
  const [id, setId] = useState('');
  const [look, setLook] = useState(null);
  const [cancel, setCancel] = useState(null);
  const k = KINDS.find((x) => x[0] === kind);
  return (
    <Layout title="Manage a Booking" intro="Look up or cancel a booking with its reference.">
      <div className="wrap" style={{ padding: '36px 24px 72px', maxWidth: 820 }}>
        <div className="panel">
          <h2>Find your booking</h2>
          <p className="sub">The reference is in your confirmation.</p>
          <div className="fields">
            <label className="field">Booking<select value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="field grow">Reference<input value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="00000000-0000-..." /></label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {kind === 'tee' ? <button className="btn ghost" disabled={!id} onClick={async () => setLook(await api('/bookings/' + id))}>Look it up</button> : null}
            <button className="btn" disabled={!id} onClick={async () => { if (window.confirm('Cancel this ' + k[1].toLowerCase() + '?')) setCancel(await api(k[2](id), { method: 'POST', body: {} })); }}>Cancel it</button>
          </div>
          {look?.json?.booking ? <div className="notice info">{look.json.booking.status === 'cancelled' || look.json.booking.status === 'canceled' ? 'This booking is canceled.' : 'Booked: ' + look.json.booking.players + ' players, ' + new Date(look.json.booking.start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '.'}</div> : null}
          {cancel?.ok ? <div className="notice info">Canceled.{cancel.json?.fee_cents ? ' A cancellation fee applies.' : ''}</div> : null}
          <Notice result={cancel} kind="bad" />
          <Notice result={look} kind="bad" />
        </div>
        <Result result={cancel} title="Cancel" />
        <Result result={look} title="GET /bookings/{id}" />
      </div>
    </Layout>
  );
}
