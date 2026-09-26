// pages/courts.js
// GET /courts -> POST /courts/quote (with rentals) -> POST /courts/bookings or
// POST /payments (card).
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import CardPayment from '../components/CardPayment';
import { api, money, newKey, timeIn, todayPlus } from '../lib/verdeClient';

export default function Courts() {
  const [date, setDate] = useState(todayPlus(1));
  const [duration, setDuration] = useState(60);
  const [players, setPlayers] = useState(4);
  const [paddles, setPaddles] = useState(0);
  const [balls, setBalls] = useState(false);
  const [list, setList] = useState(null);
  const [pick, setPick] = useState(null);
  const [quote, setQuote] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [booked, setBooked] = useState(null);
  const [key] = useState(newKey());

  const load = async () => { setPick(null); setQuote(null); setBooked(null); setList(await api('/courts?date=' + date + '&duration=' + duration)); };
  const choose = async (court, start) => { setPick({ court, start }); setBooked(null); setQuote(await api('/courts/quote', { method: 'POST', body: { court_id: court.id, start, duration, paddles, balls } })); };
  const book = async () => setBooked(await api('/courts/bookings', { method: 'POST', key, body: {
    court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, name: who.name, email: who.email, phone: who.phone,
    expected_total_cents: quote?.json?.quote?.total_cents } }));
  const tz = list?.json?.timezone;
  return (
    <Layout title="Courts">
      <h1>Courts</h1>
      <div className="card row">
        <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field">Minutes<select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{[60, 90, 120].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="field">Players<input type="number" min={1} max={8} value={players} onChange={(e) => setPlayers(Number(e.target.value))} style={{ width: 70 }} /></label>
        <label className="field">Paddles<input type="number" min={0} max={8} value={paddles} onChange={(e) => setPaddles(Number(e.target.value))} style={{ width: 70 }} /></label>
        <label className="field"><span>Balls</span><input type="checkbox" checked={balls} onChange={(e) => setBalls(e.target.checked)} /></label>
        <button onClick={load}>Show courts</button>
      </div>
      {(list?.json?.courts || []).map((c) => (
        <div className="card" key={c.id}>
          <b className="ui">{c.name}</b> <span className="note">{c.sport || ''}</span>
          <div className="slots">
            {c.starts.map((s) => <button key={s.start} className={pick?.court.id === c.id && pick?.start === s.start ? 'on' : ''} onClick={() => choose(c, s.start)}>{timeIn(s.start, tz)}{s.peak ? ' (peak)' : ''}</button>)}
            {!c.starts.length ? <span className="note">Nothing free.</span> : null}
          </div>
        </div>
      ))}
      {quote?.json?.quote ? (
        <div className="card">
          <p className="ui" style={{ marginTop: 0 }}>{pick.court.name}, {timeIn(pick.start, tz)} - <b>{money(quote.json.quote.total_cents)}</b></p>
          <div className="row">
            <label className="field">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
            <label className="field">Email<input value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
            <button onClick={book} disabled={!who.name || !who.email}>Book - pay at the venue</button>
          </div>
          {who.name && who.email ? <CardPayment start={{ type: 'court', court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, name: who.name, email: who.email, phone: who.phone }} /> : null}
        </div>
      ) : null}
      <Result result={booked} title="POST /courts/bookings" />
      <Result result={quote} title="POST /courts/quote" />
      <Result result={list} title="GET /courts" />
    </Layout>
  );
}
