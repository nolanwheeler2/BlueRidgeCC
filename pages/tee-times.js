// pages/tee-times.js
// ============================================
// Tee times (laid out for the page in commit 009).
//
// GET /tee-times -> POST /tee-times/quote -> POST /tee-times/bookings (pay at
// the course) or POST /payments (card). A signed-in member books a group as
// in the club's app: guests by name, other members invited (GET
// /members/search), each at their own rate (the quote's `group`). A date inside
// a tee time release comes back with reason "release_in_progress" and the
// line's link; a closed day with `closure` (why, and until when).
//
// The layout: a booking bar (course, players, cart), the next two weeks, and
// the day as a tee sheet - morning, afternoon and evening, each time a tile
// with its price and the places left. The summary rides alongside.
// ============================================

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import CardPayment from '../components/CardPayment';
import Details, { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, DateStrip, Segmented, Toggle, TimeGroups } from '../components/Picker';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';
import GroupPlayers, { groupFields } from '../components/GroupPlayers';

const longDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function TeeTimes() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(todayPlus(1));
  const [players, setPlayers] = useState(2);
  const [cart, setCart] = useState(false);
  const [list, setList] = useState(null);
  const [slot, setSlot] = useState(null);
  const [quote, setQuote] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [booked, setBooked] = useState(null);
  const [paid, setPaid] = useState(null);
  const [bookKey, setBookKey] = useState(newKey());
  const { member } = useMember();
  /* A member's group: the other players, guests or invited members. */
  const [group, setGroup] = useState([{ kind: 'guest', name: '' }]);
  const memberBody = () => ({ ...groupFields(group), cart });

  useEffect(() => { api('/club').then((r) => { const cs = r.json?.club?.courses || []; setCourses(cs); setCourseId(cs[0]?.id || 'none'); }); }, []);
  const cid = courseId && courseId !== 'none' ? courseId : undefined;
  useEffect(() => {
    if (!courseId) return;
    setSlot(null); setQuote(null); setBooked(null); setPaid(null); setBookKey(newKey());
    setList(null);
    api('/tee-times?date=' + date + (cid ? '&course_id=' + cid : '')).then(setList);
  }, [date, courseId]); // eslint-disable-line react-hooks/exhaustive-deps
  const doQuote = async (s, p = players, c = cart, g = group) => { setSlot(s); setBooked(null); setQuote(await api('/tee-times/quote', { method: 'POST',
    body: member ? { start: s.start, players: g.length + 1, cart: c, course_id: cid, ...groupFields(g) } : { start: s.start, players: p, cart: c, course_id: cid } })); };
  useEffect(() => { if (member && slot) void doQuote(slot, group.length + 1, cart, group); }, [JSON.stringify(group)]); // eslint-disable-line react-hooks/exhaustive-deps
  const grp = quote?.json?.group;
  const book = async (onAccount) => setBooked(await api('/tee-times/bookings', { method: 'POST', key: bookKey, body: {
    start: slot.start, course_id: cid, ...person(who, member),
    ...(member ? memberBody() : { players, cart }),
    ...(onAccount ? { payment: 'member_account' } : {}),
    expected_total_cents: member ? grp?.total_cents : quote?.json?.quote?.total_cents } }));

  const q = quote?.json?.quote;
  const done = booked?.json?.booking || paid;
  const release = list?.json?.reason === 'release_in_progress' ? list.json.release : null;
  const ready = !!member || (who.name && who.email);
  const p = person(who, member);
  const size = member ? group.length + 1 : players;
  const times = (list?.json?.tee_times || []).map((t) => ({
    key: t.start, iso: t.start, label: t.time,
    sub: money(t.price_cents),
    meta: t.spots_remaining <= 0 ? 'Full' : t.spots_remaining >= 4 ? 'Open' : t.spots_remaining + (t.spots_remaining === 1 ? ' place left' : ' places left'),
    disabled: t.spots_remaining < size, t,
  }));
  const course = courses.find((c) => c.id === courseId);
  const loading = courseId && !list;

  return (
    <Layout title="Tee Times" eyebrow="Golf" intro="Choose a day and a time. Every price is the club's own, with the cart and tax shown before you book.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a Time', 'Who\u2019s Playing', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title={'You\u2019re on the Tee Sheet'} code={booked?.json?.booking?.access_code}>
              {slot?.time} on {longDate(date)}{course ? ' at ' + course.name : ''}, {size} {size === 1 ? 'player' : 'players'}{cart ? ' with a cart' : ''}.
              {member && group.some((g) => g.kind === 'member') ? <> The members you invited have been asked to confirm.</> : null}
              {booked?.json?.booking ? <> Keep your code to change or cancel.</> : <> Paid by card. Your receipt is on its way.</>}
            </Success>
          ) : (
            <>
              <div className="panel">
                <div className="tee-bar">
                  {courses.length > 1 ? <Segmented label="Course" value={courseId} onChange={setCourseId} options={courses.map((c) => [c.id, c.name + (c.holes ? ' · ' + c.holes : '')])} /> : null}
                  {!member ? <Segmented label="Players" value={players} onChange={(n) => { setPlayers(n); if (slot) doQuote(slot, n, cart); }} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]} /> : null}
                  <Toggle checked={cart} onChange={(v) => { setCart(v); if (slot) doQuote(slot, players, v); }} title="Add a Cart" detail="Recommended for the back nine" />
                </div>
                <DateStrip value={date} onChange={setDate} />

                <div className="tee-day">
                  <h2>{longDate(date)}</h2>
                  {/* Each part of the day counts its own times; this only says
                      when the sheet is still loading. */}
                  <span>{loading ? 'Checking the tee sheet\u2026' : ''}</span>
                </div>

                {release ? <div className="notice info">Tee times for {longDate(date)} are being released through a line. <a href={release.url} target="_blank" rel="noreferrer">Join the Line</a> to get your turn.</div> : null}
                {/* Closed (Verde commit 486): why, and until when. */}
                {list?.json?.closure?.message ? <div className="notice bad">{list.json.closure.message}</div> : null}
                {/* Once a time is chosen the sheet folds into one line, so the
                    details are right under it rather than below every tile. */}
                {slot && q ? (
                  <div className="chosen">
                    <div>
                      <b>{slot.time}</b>
                      <span>{size} {size === 1 ? 'player' : 'players'}{cart ? ', with a cart' : ''}{course && courses.length > 1 ? ' · ' + course.name : ''}</span>
                    </div>
                    <button className="btn ghost small" onClick={() => { setSlot(null); setQuote(null); setBooked(null); }}>Change Time</button>
                  </div>
                ) : loading ? (
                  <div className="tiles loading" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} className="tile ghost" />)}</div>
                ) : times.length ? (
                  <TimeGroups tiles slots={times} value={slot?.start} onPick={(s) => doQuote(s.t)} tz={list?.json?.timezone} />
                ) : null}
                {list && !release && !times.length && !list.json?.error && !list.json?.closure ? <p className="empty">No tee times on {longDate(date)}. Try another day.</p> : null}
                <Notice result={list} />
              </div>

              {q ? (
                <div className="panel">
                  <h2>Who&rsquo;s Playing</h2>
                  {member ? (
                    <>
                      <p className="sub">Add guests by name, or invite other members. They confirm and pay their own share.</p>
                      <GroupPlayers value={group} onChange={setGroup} />
                    </>
                  ) : (
                    <>
                      <p className="sub">Your confirmation goes to this email.</p>
                      <Details who={who} setWho={setWho} />
                    </>
                  )}
                  <Notice result={booked} kind="bad" />
                </div>
              ) : null}
            </>
          )}
        </div>

        <Summary
          scene="golf"
          title="Your Tee Time"
          rows={slot ? [course ? ['Course', course.name] : null, ['Date', new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })], ['Tee time', slot.time], ['Players', size], ['Holes', q?.holes || slot.holes]] : []}
          lines={member && grp
            ? [...grp.players.filter((pl) => !pl.invited).map((pl) => [(pl.kind === 'host' ? 'You' : pl.name || 'Guest') + (pl.rate ? ' (' + pl.rate + ')' : ''), pl.price_cents + pl.cart_cents + pl.guest_fee_cents]),
               ['Service fee', grp.service_fee_cents], ['Tax', grp.tax_cents]]
            : q ? [['Green fees', q.greens_fee_cents], ['Cart', q.cart_fee_cents], ['Service fee', q.service_fee_cents], ['Tax', q.tax_cents]] : []}
          total={member && grp ? grp.total_cents : q?.total_cents}
          fine={q ? (q.payment?.mode === 'deposit' ? 'The club takes a deposit when you book, by card.' : 'Pay at the course, or by card now.') : null}>
          {q && !done ? (
            <>
              {(member ? grp?.payment_methods?.includes('pay_at_course') : q.payment?.api_bookable !== false) ? <button className="btn" disabled={!ready} onClick={() => book()}>Book and Pay at the Course</button> : null}
              {member && grp?.payment_methods?.includes('member_account') ? <button className="btn ghost" onClick={() => book(true)}>Charge My Member Account</button> : null}
              {member && grp && !grp.payment_methods?.includes('card') ? null
                : ready ? <CardPayment label="Pay Now by Card" start={{ type: 'tee_time', start: slot.start, course_id: cid, ...p, ...(member ? { ...memberBody(), expected_total_cents: grp?.total_cents } : { players, cart }) }} onDone={(j) => setPaid(j.booking)} />
                : <p className="fine">Add your name and email to book.</p>}
              {member && grp ? grp.players.filter((pl) => pl.invited).map((pl) => <p key={pl.member_id} className="fine">{pl.name} is invited and pays their own share once they accept.</p>) : null}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
