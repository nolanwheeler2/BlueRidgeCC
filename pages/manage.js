// pages/manage.js
// Look up and cancel what this site booked:
//   tee times   GET /bookings/{id}, POST /bookings/{id}/cancel
//   simulators  POST /simulators/reservations/{id}/cancel
//   courts      POST /courts/reservations/{id}/cancel
//   dining      POST /dining/reservations/{id}/cancel
// Cancellation fees are reported, never waived.
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
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
    <Layout title="Manage a booking">
      <h1>Manage a booking</h1>
      <p>Paste the id from a booking made on this site.</p>
      <div className="card row">
        <label className="field">Kind<select value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field" style={{ flex: 1 }}>Id<input value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="00000000-0000-..." /></label>
        {kind === 'tee' ? <button className="ghost" disabled={!id} onClick={async () => setLook(await api('/bookings/' + id))}>Look up</button> : null}
        <button disabled={!id} onClick={async () => { if (window.confirm('Cancel this ' + k[1].toLowerCase() + '?')) setCancel(await api(k[2](id), { method: 'POST', body: {} })); }}>Cancel it</button>
      </div>
      <Result result={cancel} title="Cancel" />
      <Result result={look} title="GET /bookings/{id}" />
    </Layout>
  );
}
