// pages/simulators.js
// GET /simulators -> POST /simulators/quote -> POST /simulators/bookings (pay
// at the venue) or POST /payments (card).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import CardPayment from '../components/CardPayment';
import { api, newKey, timeIn, todayPlus } from '../lib/verdeClient';

export default function Simulators() {
  const [date, setDate] = useState(todayPlus(1));
  const [duration, setDuration] = useState(60);
  const [party, setParty] = useState(2);
  const [list, setList] = useState(null);
  const [pick, setPick] = useState(null);
  const [quote, setQuote] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [booked, setBooked] = useState(null);
  const [paid, setPaid] = useState(null);
  const [key, setKey] = useState(newKey());

  const load = async () => { setPick(null); setQuote(null); setBooked(null); setPaid(null); setKey(newKey()); setList(await api('/simulators?date=' + date + '&duration=' + duration)); };
  useEffect(() => { load(); }, [date, duration]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = async (bay, start) => { setPick({ bay, start }); setBooked(null); setQuote(await api('/simulators/quote', { method: 'POST', body: { bay_id: bay.id, start, duration } })); };
  const book = async () => setBooked(await api('/simulators/bookings', { method: 'POST', key, body: {
    bay_id: pick.bay.id, start: pick.start, duration, party_size: party, name: who.name, email: who.email, phone: who.phone,
    expected_total_cents: quote?.json?.quote?.total_cents } }));
  const tz = list?.json?.timezone;
  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = who.name && who.email;

  return (
    <Layout title="Simulators" eyebrow="Indoor golf" intro="TrackMan bays by the hour - any course in the world, whatever the weather.">
      <div className="wrap booking">
        <div>
          {done ? (
            <Success title="Your bay is booked">{pick?.bay.name}, {timeIn(pick?.start, tz)} for {duration} minutes. A confirmation is on its way.</Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a bay and time</h2>
                <div className="fields">
                  <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                  <label className="field">How long<select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{[30, 60, 90, 120].map((n) => <option key={n} value={n}>{n} minutes</option>)}</select></label>
                  <label className="field">Players<input type="number" min={1} max={8} value={party} onChange={(e) => setParty(Number(e.target.value))} style={{ width: 90 }} /></label>
                </div>
                {(list?.json?.bays || []).map((bay) => (
                  <div className="group" key={bay.id}>
                    <h3>{bay.name}</h3>
                    <div className="pills">
                      {bay.starts.map((s) => <button key={s} className={'pill' + (pick?.bay.id === bay.id && pick?.start === s ? ' on' : '')} onClick={() => choose(bay, s)}>{timeIn(s, tz)}</button>)}
                      {!bay.starts.length ? <span className="empty">Fully booked.</span> : null}
                    </div>
                  </div>
                ))}
                {list && !(list.json?.bays || []).length ? <p className="empty">No bays open {list.json?.reason ? '(' + String(list.json.reason).replace(/_/g, ' ') + ')' : 'this day'}.</p> : null}
                <Notice result={list} />
              </div>
              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
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
          <Result result={booked} title="POST /simulators/bookings" />
          <Result result={quote} title="POST /simulators/quote" />
          <Result result={list} title="GET /simulators" />
        </div>
        <Summary rows={pick ? [['Bay', pick.bay.name], ['Time', timeIn(pick.start, tz)], ['Length', duration + ' min'], ['Players', party]] : []} total={q?.total_cents} fine={q ? 'Pay at the club, or by card now.' : null}>
          {q && !done ? (
            <>
              <button className="btn" disabled={!ready} onClick={book}>Book - pay at the club</button>
              {ready ? <CardPayment label="Pay now by card" start={{ type: 'simulator', bay_id: pick.bay.id, start: pick.start, duration, party_size: party, name: who.name, email: who.email, phone: who.phone }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
