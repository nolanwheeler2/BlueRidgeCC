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
import { Segmented } from '../components/Picker';
import { api, money } from '../lib/verdeClient';

const KINDS = {
  tee: ['Tee time', (id) => '/bookings/' + id + '/cancel'],
  sim: ['Simulator', (id) => '/simulators/reservations/' + id + '/cancel'],
  court: ['Court', (id) => '/courts/reservations/' + id + '/cancel'],
  dining: ['Dining', (id) => '/dining/reservations/' + id + '/cancel'],
};

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
            {kind === 'tee' ? <button className="btn ghost" disabled={!id} onClick={async () => { setCancel(null); setLook(await api('/bookings/' + id)); }}>Look it up</button> : null}
            <button className="btn" disabled={!id || canceled} onClick={async () => { if (window.confirm('Cancel this ' + KINDS[kind][0].toLowerCase() + '?')) setCancel(await api(KINDS[kind][1](id), { method: 'POST', body: {} })); }}>Cancel it</button>
          </div>
          {b ? (
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
          {cancel?.ok ? <div className="notice info">{cancel.json?.already_cancelled ? 'This booking was already canceled.' : (cancel.json?.message || 'Canceled.')}</div> : null}
          <Notice result={cancel} kind="bad" />
          <Notice result={look} kind="bad" />
        </div>
        <Result result={cancel} title="Cancel" />
        <Result result={look} title="GET /bookings/{id}" />
      </div>
    </Layout>
  );
}
