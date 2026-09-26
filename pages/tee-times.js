// pages/tee-times.js
// GET /tee-times -> POST /tee-times/quote -> POST /tee-times/bookings (pay at
// the course) or POST /payments (card). A date inside a tee time release
// comes back with reason "release_in_progress" and the line's link.
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import CardPayment from '../components/CardPayment';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';

export default function TeeTimes() {
  const [date, setDate] = useState(todayPlus(1));
  const [list, setList] = useState(null);
  const [slot, setSlot] = useState(null);
  const [players, setPlayers] = useState(2);
  const [cart, setCart] = useState(false);
  const [quote, setQuote] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [booked, setBooked] = useState(null);
  const [bookKey] = useState(newKey());

  const load = async () => { setSlot(null); setQuote(null); setBooked(null); setList(await api('/tee-times?date=' + date)); };
  const doQuote = async (s) => { setSlot(s); setBooked(null); setQuote(await api('/tee-times/quote', { method: 'POST', body: { start: s.start, players, cart } })); };
  const book = async () => setBooked(await api('/tee-times/bookings', { method: 'POST', key: bookKey, body: {
    start: slot.start, players, cart, name: who.name, email: who.email, phone: who.phone,
    expected_total_cents: quote?.json?.quote?.total_cents } }));

  const tz = list?.json?.timezone;
  const q = quote?.json?.quote;
  return (
    <Layout title="Tee times">
      <h1>Tee times</h1>
      <div className="card row">
        <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field">Players<select value={players} onChange={(e) => setPlayers(Number(e.target.value))}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="field"><span>Cart</span><input type="checkbox" checked={cart} onChange={(e) => setCart(e.target.checked)} /></label>
        <button onClick={load}>Show tee times</button>
      </div>
      {list?.json?.reason === 'release_in_progress' ? (
        <div className="card warn ui">These tee times are being released through a line. <a href={list.json.release.url} target="_blank" rel="noreferrer">Join the line</a>.</div>
      ) : null}
      {list?.json?.tee_times ? (
        <div className="slots">
          {list.json.tee_times.map((t) => (
            <button key={t.start} className={slot?.start === t.start ? 'on' : ''} onClick={() => doQuote(t)}>
              {t.time} - {money(t.price_cents)} - {t.spots_remaining} left
            </button>
          ))}
          {!list.json.tee_times.length ? <p className="note">No tee times{list.json.reason ? ' (' + list.json.reason + ')' : ''}.</p> : null}
        </div>
      ) : null}
      {q ? (
        <div className="card">
          <p className="ui" style={{ marginTop: 0 }}>Total <b>{money(q.total_cents)}</b> for {players} - payment: {q.payment?.mode}{q.payment?.api_bookable === false ? ' (not bookable through the API without a card)' : ''}</p>
          <div className="row">
            <label className="field">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
            <label className="field">Email<input value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
            <label className="field">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></label>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={book} disabled={!who.name || !who.email}>Book - pay at the course</button>
          </div>
          {who.name && who.email ? <CardPayment start={{ type: 'tee_time', start: slot.start, players, cart, name: who.name, email: who.email, phone: who.phone }} /> : <p className="note">Add a name and email to pay by card.</p>}
        </div>
      ) : null}
      {booked?.json?.booking ? <p className="ok ui">Booked. Access code {booked.json.booking.access_code} - <a href="/manage">manage it</a>.</p> : null}
      <Result result={booked} title="POST /tee-times/bookings" />
      <Result result={quote} title="POST /tee-times/quote" />
      <Result result={list} title={'GET /tee-times?date=' + date} />
      {tz ? <p className="note">Club time zone: {tz}</p> : null}
    </Layout>
  );
}
