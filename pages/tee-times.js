// pages/tee-times.js
// GET /tee-times -> POST /tee-times/quote -> POST /tee-times/bookings (pay at
// the course) or POST /payments (card). A date inside a tee time release
// comes back with reason "release_in_progress" and the line's link.
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import CardPayment from '../components/CardPayment';
import Details, { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, DateStrip, Segmented, Toggle, TimeGroups } from '../components/Picker';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';

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
  const { member, accounts } = useMember();

  useEffect(() => { api('/club').then((r) => { const cs = r.json?.club?.courses || []; setCourses(cs); setCourseId(cs[0]?.id || 'none'); }); }, []);
  const cid = courseId && courseId !== 'none' ? courseId : undefined;
  useEffect(() => {
    if (!courseId) return;
    setSlot(null); setQuote(null); setBooked(null); setPaid(null); setBookKey(newKey());
    api('/tee-times?date=' + date + (cid ? '&course_id=' + cid : '')).then(setList);
  }, [date, courseId]); // eslint-disable-line react-hooks/exhaustive-deps
  const doQuote = async (s, p = players, c = cart) => { setSlot(s); setBooked(null); setQuote(await api('/tee-times/quote', { method: 'POST', body: { start: s.start, players: p, cart: c, course_id: cid } })); };
  const book = async (account) => setBooked(await api('/tee-times/bookings', { method: 'POST', key: bookKey, body: {
    start: slot.start, players, cart, course_id: cid, ...person(who, member),
    ...(account ? { payment: 'member_account', charge_account_id: account } : {}),
    expected_total_cents: quote?.json?.quote?.total_cents } }));

  const q = quote?.json?.quote;
  const done = booked?.json?.booking || paid;
  const release = list?.json?.reason === 'release_in_progress' ? list.json.release : null;
  const ready = !!member || (who.name && who.email);
  const p = person(who, member);
  const times = (list?.json?.tee_times || []).map((t) => ({ key: t.start, iso: t.start, label: t.time, sub: money(t.price_cents) + ' · ' + t.spots_remaining + ' open', disabled: t.spots_remaining < players, t }));
  const course = courses.find((c) => c.id === courseId);

  return (
    <Layout title="Tee Times" eyebrow="Golf" intro="Choose a day and a time. Prices are the club's own, including cart and tax.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a time', 'Your details', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title="You're on the tee sheet" code={booked?.json?.booking?.access_code}>
              {slot?.time} on {longDate(date)}{course ? ' at ' + course.name : ''}, {players} {players === 1 ? 'player' : 'players'}{cart ? ' with a cart' : ''}.
              {booked?.json?.booking ? <> Keep your code to change or cancel.</> : <> Paid by card - your receipt is on its way.</>}
            </Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a time</h2>
                <p className="sub">Up to two weeks ahead, in the club&rsquo;s time.</p>
                {courses.length > 1 ? <div style={{ marginBottom: 16 }}><Segmented label="Course" value={courseId} onChange={setCourseId} options={courses.map((c) => [c.id, c.name + (c.holes ? ' · ' + c.holes : '')])} /></div> : null}
                <DateStrip value={date} onChange={setDate} />
                <div className="options">
                  <Segmented label="Players" value={players} onChange={(p) => { setPlayers(p); if (slot) doQuote(slot, p, cart); }} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]} />
                  <Toggle checked={cart} onChange={(v) => { setCart(v); if (slot) doQuote(slot, players, v); }} title="Add a cart" detail="Recommended on the back nine" />
                </div>
                {release ? <div className="notice info" style={{ marginTop: 18 }}>Tee times for {longDate(date)} are being released through a line. <a href={release.url} target="_blank" rel="noreferrer">Join the line</a> to get your turn.</div> : null}
                {times.length ? <TimeGroups slots={times} value={slot?.start} onPick={(s) => doQuote(s.t)} tz={list?.json?.timezone} /> : null}
                {list && !release && !times.length && !list.json?.error ? <p className="empty" style={{ marginTop: 16 }}>No tee times on {longDate(date)}. Try another day.</p> : null}
                <Notice result={list} />
              </div>

              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Who&rsquo;s playing</h2>
                  <p className="sub">The confirmation goes to this email.</p>
                  <Details who={who} setWho={setWho} />
                  <Notice result={booked} kind="bad" />
                </div>
              ) : null}
            </>
          )}
          <Result result={booked} title="POST /tee-times/bookings" />
          <Result result={quote} title="POST /tee-times/quote" />
          <Result result={list} title={'GET /tee-times?date=' + date} />
        </div>

        <Summary
          scene="golf"
          rows={slot ? [course ? ['Course', course.name] : null, ['Date', new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })], ['Tee time', slot.time], ['Players', players], ['Holes', q?.holes || slot.holes]] : []}
          lines={q ? [['Green fees', q.greens_fee_cents], ['Cart', q.cart_fee_cents], ['Service fee', q.service_fee_cents], ['Tax', q.tax_cents]] : []}
          total={q?.total_cents}
          fine={q ? (q.payment?.mode === 'deposit' ? 'The club takes a deposit when you book - pay by card.' : 'Pay at the course, or by card now.') : null}>
          {q && !done ? (
            <>
              {q.payment?.api_bookable !== false ? <button className="btn" disabled={!ready} onClick={() => book()}>Book - pay at the course</button> : null}
              {member && accounts.length ? <button className="btn ghost" onClick={() => book(accounts[0].id)}>Charge my member account</button> : null}
              {ready ? <CardPayment label="Pay now by card" start={{ type: 'tee_time', start: slot.start, players, cart, course_id: cid, ...p }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
