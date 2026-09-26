// pages/simulators.js
// GET /simulators -> POST /simulators/quote -> POST /simulators/bookings (pay
// at the venue) or POST /payments (card); cancel on /manage.
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import CardPayment from '../components/CardPayment';
import { api, money, newKey, timeIn, todayPlus } from '../lib/verdeClient';

export default function Simulators() {
  const [date, setDate] = useState(todayPlus(1));
  const [duration, setDuration] = useState(60);
  const [party, setParty] = useState(2);
  const [list, setList] = useState(null);
  const [pick, setPick] = useState(null);
  const [quote, setQuote] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [booked, setBooked] = useState(null);
  const [key] = useState(newKey());

  const load = async () => { setPick(null); setQuote(null); setBooked(null); setList(await api('/simulators?date=' + date + '&duration=' + duration)); };
  const choose = async (bay, start) => { setPick({ bay, start }); setBooked(null); setQuote(await api('/simulators/quote', { method: 'POST', body: { bay_id: bay.id, start, duration } })); };
  const book = async () => setBooked(await api('/simulators/bookings', { method: 'POST', key, body: {
    bay_id: pick.bay.id, start: pick.start, duration, party_size: party, name: who.name, email: who.email, phone: who.phone,
    expected_total_cents: quote?.json?.quote?.total_cents } }));
  const tz = list?.json?.timezone;
  return (
    <Layout title="Simulators">
      <h1>Simulators</h1>
      <div className="card row">
        <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field">Minutes<select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{[30, 60, 90, 120].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="field">Party<input type="number" min={1} max={8} value={party} onChange={(e) => setParty(Number(e.target.value))} style={{ width: 70 }} /></label>
        <button onClick={load}>Show bays</button>
      </div>
      {(list?.json?.bays || []).map((bay) => (
        <div className="card" key={bay.id}>
          <b className="ui">{bay.name}</b>
          <div className="slots">
            {bay.starts.map((s) => <button key={s} className={pick?.bay.id === bay.id && pick?.start === s ? 'on' : ''} onClick={() => choose(bay, s)}>{timeIn(s, tz)}</button>)}
            {!bay.starts.length ? <span className="note">Nothing free.</span> : null}
          </div>
        </div>
      ))}
      {quote?.json?.quote ? (
        <div className="card">
          <p className="ui" style={{ marginTop: 0 }}>{pick.bay.name}, {timeIn(pick.start, tz)}, {duration} min - <b>{money(quote.json.quote.total_cents)}</b></p>
          <div className="row">
            <label className="field">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
            <label className="field">Email<input value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
            <label className="field">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></label>
            <button onClick={book} disabled={!who.name || !who.email}>Book - pay at the venue</button>
          </div>
          {who.name && who.email ? <CardPayment start={{ type: 'simulator', bay_id: pick.bay.id, start: pick.start, duration, party_size: party, name: who.name, email: who.email, phone: who.phone }} /> : null}
        </div>
      ) : null}
      <Result result={booked} title="POST /simulators/bookings" />
      <Result result={quote} title="POST /simulators/quote" />
      <Result result={list} title="GET /simulators" />
    </Layout>
  );
}
