// pages/manage.js
// ============================================
// Your Bookings (laid out for the page in commit 019).
//
// Signed in: the member's own bookings (GET /members/bookings - no reference
// needed) as an itinerary, each changeable or cancellable here, and tee time
// invitations waiting for an answer (POST /members/invitations/{id}).
// Not signed in: find a booking by what it was and its reference.
//
// Look up and cancel a booking:
//   tee times   GET /bookings/{id}, POST /bookings/{id}/cancel
//   simulators  POST /simulators/reservations/{id}/cancel
//   courts      POST /courts/reservations/{id}/cancel
//   dining      POST /dining/reservations/{id}/cancel
//   rooms       POST /lodging/reservations/{id}/cancel
//   packages    GET /packages/bookings/{id}, POST /packages/bookings/{id}/cancel
// Cancellation fees are reported, never waived. Cancelling asks first, in
// place - "Cancel this tee time? Yes, Cancel / Keep It" - not in a browser
// pop-up. Every date and time is the club's (commit 015).
// ============================================

import { useEffect, useState } from 'react';
import { useMember } from '../components/Member';
import ChangeTeeTime from '../components/ChangeTeeTime';
import CardPayment from '../components/CardPayment';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import { Segmented } from '../components/Picker';
import { api, money } from '../lib/verdeClient';
import { useClub } from '../components/Club';
import { fmtDateTime, fmtDay, fmtTime, ymdOfIso } from '../lib/clubTime';

const KINDS = {
  tee: ['Tee Time', (id) => '/bookings/' + id + '/cancel'],
  sim: ['Simulator', (id) => '/simulators/reservations/' + id + '/cancel'],
  court: ['Court', (id) => '/courts/reservations/' + id + '/cancel'],
  dining: ['Dining', (id) => '/dining/reservations/' + id + '/cancel'],
  room: ['Room', (id) => '/lodging/reservations/' + id + '/cancel'],
  pkg: ['Package', (id) => '/packages/bookings/' + id + '/cancel'],
};
const LOOKUP = { tee: (id) => '/bookings/' + id, pkg: (id) => '/packages/bookings/' + id };

/* GET /members/bookings types -> the cancel paths above. */
const TYPE = { tee_time: 'tee', simulator: 'sim', court: 'court', dining: 'dining', lodging: 'room' };
const TYPE_LABEL = { tee_time: 'Tee Time', simulator: 'Simulator', court: 'Court', dining: 'Dining', lodging: 'Stay' };
const NOUN = { tee_time: 'tee time', simulator: 'simulator booking', court: 'court booking', dining: 'reservation', lodging: 'stay' };

/* A booking's day at the club: a date alone is the club's calendar day; a
   timestamp falls on the club's day in its zone (commit 015). */
const dayOf = (iso, tz) => (!iso ? null : iso.length === 10 ? iso : ymdOfIso(iso, tz));

function cancelMessage(j) {
  if (j?.already_cancelled) return 'That booking was already canceled.';
  if (j?.message) return j.message;
  const fee = j?.fee_cents || 0;
  return 'Canceled.' + (fee > 0 ? ' A late fee of ' + money(fee) + ' applies.' : '')
    + (j?.paid_cents > fee ? ' The club will refund ' + money(j.paid_cents - fee) + '.' : '');
}

/* The member's own bookings and invitations - no reference needed. */
function YourBookings() {
  const { tz } = useClub();
  const [past, setPast] = useState(false);
  const [mine, setMine] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [asking, setAsking] = useState(null);
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

  const doCancel = async (b) => {
    const r = await api(KINDS[TYPE[b.type]][1](b.id), { method: 'POST', body: {} });
    setCancel({ id: b.type + b.id, r });
    setAsking(null);
    if (r.ok) await load(past);
  };

  const row = (b) => {
    const rid = b.type + b.id;
    const canceled = String(b.status || '').startsWith('cancel');
    const kind = TYPE[b.type];
    const future = upcoming.includes(b);
    const mayCancel = kind && b.role === 'host' && !canceled && future;
    const day = dayOf(b.start, tz);
    const time = b.start && b.start.length > 10 ? fmtTime(b.start, tz) : null;
    return (
      <article key={rid} className={'trip' + (canceled ? ' canceled' : '')}>
        <div className="ev-date">
          <b>{day ? Number(day.slice(8)) : '\u2014'}</b>
          <span>{day ? fmtDay(day, { month: 'short' }) + ' · ' + fmtDay(day, { weekday: 'short' }) : ''}</span>
        </div>
        <div className="trip-main">
          <p className="trip-kind">{TYPE_LABEL[b.type] || 'Booking'}</p>
          <h3>{[time, b.course || b.place || null].filter(Boolean).join(' · ') || (day ? fmtDay(day) : 'Booking')}</h3>
          <p className="ev-facts">
            <span className={canceled ? 'warn' : 'ok'}>{canceled ? 'Canceled' : b.role === 'player' ? 'You\u2019re Playing' : 'Confirmed'}</span>
            {b.holes ? <span>{b.holes} holes</span> : null}
            {b.party ? <span>{b.party} {b.type === 'lodging' ? 'guests' : b.party === 1 ? 'person' : 'people'}</span> : null}
            {b.share_cents != null ? <span>Your share {money(b.share_cents)}</span> : b.total_cents != null ? <span>{money(b.total_cents)}</span> : null}
            {b.access_code ? <span>Code <b className="code">{b.access_code}</b></span> : null}
          </p>
          {b.players?.length ? <p className="trip-players">{b.players.map((p) => (p.is_me ? 'You' : p.name) + (p.invited ? ' (invited)' : '')).join(', ')}</p> : null}

          {asking === rid ? (
            <div className="confirm">
              <span>Cancel this {NOUN[b.type] || 'booking'}?{' '}Any late fee is shown before anything is charged.</span>
              <button className="btn small" onClick={() => doCancel(b)}>Yes, Cancel</button>
              <button className="btn ghost small" onClick={() => setAsking(null)}>Keep It</button>
            </div>
          ) : (b.type === 'tee_time' && b.role === 'host' && !canceled && future) || mayCancel ? (
            <div className="trip-actions">
              {b.type === 'tee_time' && b.role === 'host' && !canceled && future
                ? <button className="btn ghost small" onClick={() => setChanging(changing === b.id ? null : b.id)}>{changing === b.id ? 'Close' : 'Change Time or Players'}</button> : null}
              {mayCancel ? <button className="text-link" onClick={() => { setAsking(rid); setCancel(null); }}>Cancel</button> : null}
            </div>
          ) : null}
          {cancel?.id === rid ? (cancel.r.ok ? <div className="notice info">{cancelMessage(cancel.r.json)}</div> : <Notice result={cancel.r} kind="bad" />) : null}
        </div>
        {changing === b.id ? <div className="trip-change"><ChangeTeeTime booking={b} onClose={() => setChanging(null)} onDone={async () => { setChanging(null); await load(past); }} /></div> : null}
      </article>
    );
  };

  /* Answering an invitation, here (POST /members/invitations/{id}). */
  const respond = async (v, action, payment) => {
    const r = await api('/members/invitations/' + v.player_id, { method: 'POST', body: { action, ...(payment ? { payment } : {}) } });
    setAnswer(r);
    if (r.ok) await load(past);
  };
  const acceptLabel = (v, m) => (v.share_cents === 0 ? 'Accept'
    : m === 'member_account' ? 'Accept and Charge My Account' : m === 'card' ? 'Accept and Pay ' + money(v.share_cents) + ' by Card' : 'Accept and Pay at the Club');

  return (
    <>
      {invites.length ? (
        <section className="ev-month">
          <h2>Invitations</h2>
          <p className="sub" style={{ margin: '0 0 12px' }}>Tee times you&rsquo;ve been invited to. Your place is held until the time shown.</p>
          <div className="ev-list">
            {invites.map((v) => {
              const day = dayOf(v.start, tz);
              return (
                <article key={v.player_id} className="trip">
                  <div className="ev-date"><b>{day ? Number(day.slice(8)) : '\u2014'}</b><span>{day ? fmtDay(day, { month: 'short' }) + ' · ' + fmtDay(day, { weekday: 'short' }) : ''}</span></div>
                  <div className="trip-main">
                    <p className="trip-kind">From {v.host}</p>
                    <h3>{[v.start ? fmtTime(v.start, tz) : null, v.course].filter(Boolean).join(' · ')}</h3>
                    <p className="ev-facts">
                      <span>{v.share_cents > 0 ? 'Your share ' + money(v.share_cents) : 'Nothing to pay'}</span>
                      {v.held_until ? <span className="low">Held until {fmtDateTime(v.held_until, tz, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span> : null}
                    </p>
                    {payingFor === v.player_id ? (
                      <div style={{ marginTop: 12, maxWidth: 420 }}>
                        <CardPayment label={'Pay ' + money(v.share_cents) + ' by Card'} start={{ type: 'tee_invite', player_id: v.player_id }} onDone={async () => { setPayingFor(null); await load(past); }} />
                      </div>
                    ) : (
                      <div className="trip-actions">
                        {(v.payment_methods?.length ? v.payment_methods : ['pay_at_course']).map((m) => (
                          <button key={m} className="btn small" onClick={() => (m === 'card' && v.share_cents > 0 ? setPayingFor(v.player_id) : respond(v, 'accept', m))}>{acceptLabel(v, m)}</button>
                        ))}
                        <button className="text-link" onClick={() => respond(v, 'decline')}>Decline</button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {answer?.ok ? <div className="notice info">{answer.json?.answered === 'accept' ? 'You\u2019re in. The host has been told.' : 'Declined. The host has been told.'}</div> : null}
          <Notice result={answer} kind="bad" />
        </section>
      ) : null}

      <section className="ev-month">
        <h2>Coming Up</h2>
        {!mine ? <div className="bays" aria-hidden="true">{[0, 1].map((i) => <div key={i} className="bay"><span className="tile ghost" style={{ height: 90 }} /></div>)}</div> : null}
        {mine && !mine.ok ? <Notice result={mine} kind="bad" /> : null}
        {mine?.ok && !upcoming.length ? <p className="empty" style={{ padding: '12px 0 24px' }}>Nothing coming up. Book a tee time, a bay or a table from the menu above.</p> : null}
        {upcoming.length ? <div className="ev-list">{upcoming.map(row)}</div> : null}
      </section>

      {past && earlier.length ? (
        <section className="ev-month">
          <h2>Earlier</h2>
          <div className="ev-list">{earlier.map(row)}</div>
        </section>
      ) : null}
      {mine?.ok ? <button className="btn ghost small" onClick={() => setPast(!past)}>{past ? 'Hide Past Bookings' : 'Show the Last 90 Days'}</button> : null}
    </>
  );
}

export default function Manage() {
  const { tz } = useClub();
  const { member, ready, signIn } = useMember();
  const [kind, setKind] = useState('tee');
  const [id, setId] = useState('');
  const [look, setLook] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [asking, setAsking] = useState(false);
  const b = look?.json?.booking;
  const canceled = b && String(b.status).startsWith('cancel');
  const reset = () => { setLook(null); setCancel(null); setAsking(false); };

  const finder = (
    <section className={member ? 'finder quiet' : 'finder'}>
      <h2>{member ? 'Booked Without Signing In?' : 'Find Your Booking'}</h2>
      <p className="sub">{member ? 'Choose what it was and paste the reference from its confirmation email.' : 'Choose what you booked and paste the reference from your confirmation email.'}</p>
      <Segmented label="What you booked" value={kind} onChange={(k) => { setKind(k); reset(); }} options={Object.entries(KINDS).map(([v, [l]]) => [v, l])} />
      <div className="fields" style={{ marginTop: 18 }}>
        <label className="field grow">Reference<input value={id} onChange={(e) => { setId(e.target.value.trim()); reset(); }} placeholder="From your confirmation email" spellCheck={false} /></label>
      </div>
      <div className="trip-actions" style={{ marginTop: 16 }}>
        {LOOKUP[kind] ? <button className="btn" disabled={!id} onClick={async () => { setCancel(null); setLook(await api(LOOKUP[kind](id))); }}>Look It Up</button> : null}
        {asking ? (
          <div className="confirm">
            <span>Cancel this {KINDS[kind][0].toLowerCase()}? Any late fee is shown before anything is charged.</span>
            <button className="btn small" onClick={async () => { setCancel(await api(KINDS[kind][1](id), { method: 'POST', body: {} })); setAsking(false); }}>Yes, Cancel</button>
            <button className="btn ghost small" onClick={() => setAsking(false)}>Keep It</button>
          </div>
        ) : <button className={LOOKUP[kind] ? 'text-link' : 'btn'} disabled={!id || canceled} onClick={() => setAsking(true)}>Cancel Booking</button>}
      </div>

      {b && kind === 'pkg' ? (
        <div className="found">
          <p className="trip-kind">Stay and Play</p>
          <h3>{b.package?.name || 'Package'}, arriving {fmtDay(b.arrival)}</h3>
          <p className="ev-facts">
            <span className={canceled ? 'warn' : 'ok'}>{canceled ? 'Canceled' : 'Confirmed'}</span>
            <span>{b.guests} {b.guests === 1 ? 'guest' : 'guests'}</span>
            {b.room ? <span>{b.room.name}</span> : null}
            {b.confirmation ? <span>Confirmation <b className="code">{b.confirmation}</b></span> : null}
          </p>
          <p className="ev-facts"><span>{money(b.paid_cents)} paid of {money(b.total_cents)}</span>{b.balance_cents > 0 ? <span>{money(b.balance_cents)} due on arrival</span> : null}</p>
          {(b.tee_times || []).map((t, i) => <p key={i} className="trip-players">Tee time: {fmtDateTime(t.start, tz, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}, {t.players} {t.players === 1 ? 'player' : 'players'}</p>)}
          {(b.credits || []).map((c) => <p key={c.kind} className="trip-players">{c.kind === 'food_and_beverage' ? 'Food and drink' : 'Pro shop'} credit: {money(c.remaining_cents)} left of {money(c.amount_cents)}</p>)}
        </div>
      ) : b ? (
        <div className="found">
          <p className="trip-kind">Tee Time</p>
          <h3>{b.start ? fmtDateTime(b.start, tz, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Your tee time'}</h3>
          <p className="ev-facts">
            <span className={canceled ? 'warn' : 'ok'}>{canceled ? 'Canceled' : 'Confirmed'}</span>
            <span>{b.players} {b.players === 1 ? 'player' : 'players'}</span>
            {b.holes ? <span>{b.holes} holes</span> : null}
            {b.total_cents != null ? <span>{money(b.total_cents)}</span> : null}
            {b.access_code ? <span>Code <b className="code">{b.access_code}</b></span> : null}
          </p>
        </div>
      ) : null}
      {cancel?.ok ? <div className="notice info">{cancelMessage(cancel.json)}</div> : null}
      <Notice result={cancel} kind="bad" />
      <Notice result={look} kind="bad" />
      {!member && ready ? <p className="fine" style={{ marginTop: 22 }}>Members: <button className="linkish" onClick={signIn}>Sign In</button> to see everything you&rsquo;ve booked, without a reference.</p> : null}
    </section>
  );

  return (
    <Layout title={member ? 'Your Bookings' : 'Find a Booking'}
      intro={member ? 'Everything you have at the club, and any invitations waiting for you.' : 'Look up or cancel a booking with the reference in your confirmation.'}>
      <div className="wrap events-page">
        {ready && member ? <YourBookings /> : null}
        {ready ? finder : null}
        <div className="help-strip">
          <div><b>Changing Plans?</b><span>Change a tee time here, or cancel and book again. It only takes a minute.</span></div>
          <div><b>Cancellation Fees</b><span>Some bookings close to the time carry a fee. You&rsquo;ll see it before anything is charged.</span></div>
          <div><b>Need a Hand?</b><span>Call the club and the front desk will sort it out.</span></div>
        </div>
      </div>
    </Layout>
  );
}
