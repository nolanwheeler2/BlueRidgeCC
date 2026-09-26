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
import { api, money, newKey, todayPlus } from '../lib/verdeClient';

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

  useEffect(() => { api('/club').then((r) => { const cs = r.json?.club?.courses || []; setCourses(cs); if (cs[0]) setCourseId(cs[0].id); }); }, []);
  const cq = courseId ? '&course_id=' + courseId : '';
  const reset = () => { setSlot(null); setQuote(null); setBooked(null); setPaid(null); setBookKey(newKey()); };
  const load = async () => { reset(); setList(await api('/tee-times?date=' + date + cq)); };
  useEffect(() => { if (courseId || courses.length === 0) load(); }, [date, courseId]); // eslint-disable-line react-hooks/exhaustive-deps
  const doQuote = async (s, p = players, c = cart) => { setSlot(s); setBooked(null); setQuote(await api('/tee-times/quote', { method: 'POST', body: { start: s.start, players: p, cart: c, course_id: courseId || undefined } })); };
  const book = async () => setBooked(await api('/tee-times/bookings', { method: 'POST', key: bookKey, body: {
    start: slot.start, players, cart, course_id: courseId || undefined, name: who.name, email: who.email, phone: who.phone,
    expected_total_cents: quote?.json?.quote?.total_cents } }));

  const q = quote?.json?.quote;
  const done = booked?.json?.booking || paid;
  const release = list?.json?.reason === 'release_in_progress' ? list.json.release : null;
  const ready = who.name && who.email;

  return (
    <Layout title="Tee Times" eyebrow="Golf" intro="Choose a day and a time. Prices are the club's own, including cart and tax.">
      <div className="wrap booking">
        <div>
          {done ? (
            <Success title="You're on the tee sheet" code={booked?.json?.booking?.access_code}>
              {slot?.time} on {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, {players} {players === 1 ? 'player' : 'players'}.
              {booked?.json?.booking ? <> Keep your code to change or cancel.</> : <> Paid by card - your receipt is on its way.</>}
            </Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>When</h2>
                <p className="sub">Up to two weeks ahead, in the club&rsquo;s time.</p>
                <div className="fields">
                  {courses.length > 1 ? (
                    <label className="field">Course<select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.holes ? ' · ' + c.holes + ' holes' : ''}</option>)}
                    </select></label>
                  ) : null}
                  <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                  <label className="field">Players<select value={players} onChange={(e) => { const p = Number(e.target.value); setPlayers(p); if (slot) doQuote(slot, p, cart); }}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></label>
                  <label className="check"><input type="checkbox" checked={cart} onChange={(e) => { setCart(e.target.checked); if (slot) doQuote(slot, players, e.target.checked); }} /> Add a cart</label>
                </div>
                {release ? (
                  <div className="notice info">Tee times for this date are being released through a line. <a href={release.url} target="_blank" rel="noreferrer">Join the line</a> to get your turn.</div>
                ) : null}
                <div className="group">
                  <div className="pills">
                    {(list?.json?.tee_times || []).map((t) => (
                      <button key={t.start} className={'pill' + (slot?.start === t.start ? ' on' : '')} onClick={() => doQuote(t)}>
                        {t.time}<small>{money(t.price_cents)} · {t.spots_remaining} open</small>
                      </button>
                    ))}
                  </div>
                  {list && !release && !(list.json?.tee_times || []).length ? <p className="empty">No tee times {list.json?.reason ? '(' + list.json.reason.replace(/_/g, ' ') + ')' : 'this day'}. Try another date.</p> : null}
                </div>
                <Notice result={list} />
              </div>

              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Who&rsquo;s playing</h2>
                  <p className="sub">We&rsquo;ll send the confirmation here.</p>
                  <div className="fields">
                    <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
                    <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
                    <label className="field grow">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></label>
                  </div>
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
          rows={slot ? [['Date', new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })], ['Time', slot.time], ['Players', players], ['Cart', cart ? 'Yes' : 'No']] : []}
          total={q?.total_cents}
          fine={q ? (q.payment?.mode === 'deposit' ? 'The club takes a deposit when you book - pay by card.' : 'Pay at the course, or by card now.') : null}>
          {q && !done ? (
            <>
              {q.payment?.api_bookable !== false ? <button className="btn" disabled={!ready} onClick={book}>Book - pay at the course</button> : null}
              {ready ? <CardPayment label="Pay now by card" start={{ type: 'tee_time', start: slot.start, players, cart, course_id: courseId || undefined, name: who.name, email: who.email, phone: who.phone }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
