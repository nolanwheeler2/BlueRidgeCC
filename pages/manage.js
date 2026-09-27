// pages/manage.js
// A signed-in member's bookings, listed for them (GET /members/bookings -
// no reference needed), each cancellable here, and tee time invitations
// waiting for an answer. A guest looks theirs up by reference, as before.
//
// Look up and cancel a booking:
//   tee times   GET /bookings/{id}, POST /bookings/{id}/cancel
//   simulators  POST /simulators/reservations/{id}/cancel
//   courts      POST /courts/reservations/{id}/cancel
//   dining      POST /dining/reservations/{id}/cancel
//   rooms       POST /lodging/reservations/{id}/cancel
//   packages    GET /packages/bookings/{id}, POST /packages/bookings/{id}/cancel
// Cancellation fees are reported, never waived.
import { useEffect, useState } from 'react';
import { useMember } from '../components/Member';
import ChangeTeeTime from '../components/ChangeTeeTime';
import CardPayment from '../components/CardPayment';
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

/* GET /members/bookings types -> the cancel paths above. */
const TYPE = { tee_time: 'tee', simulator: 'sim', court: 'court', dining: 'dining', lodging: 'room' };
const TYPE_LABEL = { tee_time: 'Tee time', simulator: 'Simulator', court: 'Court', dining: 'Dining', lodging: 'Room' };
const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return iso.length === 10
    ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : d.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/* The member's own bookings and invitations - no reference needed. */
function YourBookings() {
  const [past, setPast] = useState(false);
  const [mine, setMine] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [changing, setChanging] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [payingFor, setPayingFor] = useState(null);
  const load = async (withPast) => setMine(await api('/members/bookings' + (withPast ? '?past=1' : '')));
  useEffect(() => { void load(past); }, [past]);
  const list = mine?.json?.bookings || [];
  const invites = mine?.json?.invitations || [];
  const now = Date.now();
  const upcoming = list.filter((b) => !b.start || new Date(b.start.length === 10 ? b.start + 'T23:59:59' : b.start).getTime() >= now);
  const earlier = list.filter((b) => !upcoming.includes(b));

  const row = (b) => {
    const canceled = String(b.status || '').startsWith('cancel');
    const kind = TYPE[b.type];
    const mayCancel = kind && b.role === 'host' && !canceled && upcoming.includes(b);
    return (
      <div key={b.type + b.id} className="resource" style={{ gridTemplateColumns: '1fr', marginTop: 12 }}>
        <div className="body">
          <h3>{TYPE_LABEL[b.type] || 'Booking'} &middot; {when(b.start)}</h3>
          <div className="tags">
            <span className={'tag' + (canceled ? '' : ' good')}>{canceled ? 'Canceled' : b.role === 'player' ? 'You’re playing' : 'Confirmed'}</span>
            {b.course ? <span className="tag">{b.course}</span> : null}
            {b.holes ? <span className="tag">{b.holes} holes</span> : null}
            {b.party ? <span className="tag">{b.party} {b.type === 'lodging' ? 'guests' : 'people'}</span> : null}
            {b.total_cents != null ? <span className="tag">{money(b.total_cents)}</span> : null}
            {b.share_cents != null ? <span className="tag">Your share {money(b.share_cents)}</span> : null}
            {b.access_code ? <span className="tag">Code {b.access_code}</span> : null}
          </div>
          {b.players?.length ? (
            <p style={{ margin: '8px 0 0', fontSize: 14 }}>
              {b.players.map((p) => (p.is_me ? 'You' : p.name) + (p.invited ? ' (invited)' : '')).join(', ')}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {b.type === 'tee_time' && b.role === 'host' && !canceled && upcoming.includes(b)
              ? <button className="btn ghost small" onClick={() => setChanging(changing === b.id ? null : b.id)}>{changing === b.id ? 'Close' : 'Change time or players'}</button> : null}
            {mayCancel ? (
              <button className="btn small" onClick={async () => {
                if (!window.confirm('Cancel this ' + (TYPE_LABEL[b.type] || 'booking').toLowerCase() + '?')) return;
                const r = await api(KINDS[kind][1](b.id), { method: 'POST', body: {} });
                setCancel(r);
                if (r.ok) await load(past);
              }}>Cancel</button>
            ) : null}
          </div>
          {changing === b.id ? <ChangeTeeTime booking={b} onClose={() => setChanging(null)} onDone={async () => { setChanging(null); await load(past); }} /> : null}
        </div>
      </div>
    );
  };

  /* Answering an invitation, here (POST /members/invitations/{id}). */
  const respond = async (v, action, payment) => {
    const r = await api('/members/invitations/' + v.player_id, { method: 'POST', body: { action, ...(payment ? { payment } : {}) } });
    setAnswer(r);
    if (r.ok) await load(past);
  };
  const acceptLabel = (v, m) => (v.share_cents === 0 ? 'Accept'
    : m === 'member_account' ? 'Accept · charge my member account' : m === 'card' ? 'Accept · pay ' + money(v.share_cents) + ' by card' : 'Accept · pay at the club');

  return (
    <>
      {invites.length ? (
        <div className="panel">
          <h2>Invitations</h2>
          <p className="sub">Tee times you&rsquo;ve been invited to. Your place is held until the time shown.</p>
          {invites.map((v) => (
            <div key={v.player_id} className="resource" style={{ gridTemplateColumns: '1fr', marginTop: 12 }}>
              <div className="body">
                <h3>{v.host} invited you &middot; {when(v.start)}</h3>
                <div className="tags">
                  {v.course ? <span className="tag">{v.course}</span> : null}
                  <span className="tag">{v.share_cents > 0 ? 'Your share ' + money(v.share_cents) : 'Nothing to pay'}</span>
                  {v.held_until ? <span className="tag">Held until {when(v.held_until)}</span> : null}
                </div>
                {payingFor === v.player_id ? (
                  <div style={{ marginTop: 12 }}>
                    <CardPayment label={'Pay ' + money(v.share_cents)} start={{ type: 'tee_invite', player_id: v.player_id }} onDone={async () => { setPayingFor(null); await load(past); }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    {(v.payment_methods?.length ? v.payment_methods : ['pay_at_course']).map((m) => (
                      <button key={m} className="btn small" onClick={() => (m === 'card' && v.share_cents > 0 ? setPayingFor(v.player_id) : respond(v, 'accept', m))}>{acceptLabel(v, m)}</button>
                    ))}
                    <button className="btn ghost small" onClick={() => respond(v, 'decline')}>Decline</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {answer?.ok ? <div className="notice info">{answer.json?.answered === 'accept' ? 'You’re in. The host has been told.' : 'Declined. The host has been told.'}</div> : null}
          <Notice result={answer} kind="bad" />
        </div>
      ) : null}

      <div className="panel">
        <h2>Your bookings</h2>
        <p className="sub">Everything you have at the club, soonest first.</p>
        {!mine ? <p className="sub">Loading&hellip;</p> : null}
        {mine && !mine.ok ? <Notice result={mine} kind="bad" /> : null}
        {mine?.ok && !upcoming.length ? <p className="sub" style={{ margin: 0 }}>Nothing coming up. Book a tee time, a bay or a table from the menu above.</p> : null}
        {upcoming.map(row)}
        {past && earlier.length ? <><h3 style={{ margin: '22px 0 0', fontSize: 15 }}>Earlier</h3>{earlier.map(row)}</> : null}
        <button className="btn ghost small" style={{ marginTop: 16 }} onClick={() => setPast(!past)}>{past ? 'Hide past bookings' : 'Show the last 90 days'}</button>
        {cancel?.ok ? <div className="notice info">{cancel.json?.already_cancelled ? 'That was already canceled.' : ('Canceled.' + (cancel.json?.fee_cents > 0 ? ' A late fee of ' + money(cancel.json.fee_cents) + ' applies.' : ''))}</div> : null}
        <Notice result={cancel} kind="bad" />
      </div>
      <Result result={mine} title="GET /members/bookings" />
    </>
  );
}

export default function Manage() {
  const { member, ready } = useMember();
  const [kind, setKind] = useState('tee');
  const [id, setId] = useState('');
  const [look, setLook] = useState(null);
  const [cancel, setCancel] = useState(null);
  const b = look?.json?.booking;
  const canceled = b && String(b.status).startsWith('cancel');
  return (
    <Layout title={member ? 'Your Bookings' : 'Manage a Booking'}
      intro={member ? 'Everything you have at the club, and any invitations waiting for you.' : 'Look up or cancel a booking with the reference in your confirmation.'}>
      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 72, maxWidth: 1080 }}>
        <div className="info-grid">
          <div className="info"><b>Changing plans?</b><span>Cancel here, then book a new time - it only takes a minute.</span></div>
          <div className="info"><b>Cancellation fees</b><span>Some bookings close to the time carry a fee; you&rsquo;ll see it before anything is charged.</span></div>
          <div className="info"><b>Need help?</b><span>Call the club and we&rsquo;ll sort it out.</span></div>
        </div>
        {ready && member ? <YourBookings /> : null}
        <div className="panel">
          <h2>{member ? 'Booked as a guest?' : 'Find your booking'}</h2>
          <p className="sub">{member ? 'A booking made without signing in: choose what it was and paste the reference from its confirmation.' : 'Choose what you booked and paste its reference. Members: sign in to see all of yours without one.'}</p>
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
