// pages/simulators.js
// GET /simulators -> POST /simulators/quote -> POST /simulators/bookings (pay
// at the venue) or POST /payments (card).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import Scene from '../components/Scene';
import CardPayment from '../components/CardPayment';
import { StepBar, DateStrip, Segmented } from '../components/Picker';
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

  useEffect(() => {
    setPick(null); setQuote(null); setBooked(null); setPaid(null); setKey(newKey());
    api('/simulators?date=' + date + '&duration=' + duration).then(setList);
  }, [date, duration]);
  const choose = async (bay, start) => { setPick({ bay, start }); setBooked(null); setQuote(await api('/simulators/quote', { method: 'POST', body: { bay_id: bay.id, start, duration } })); };
  const book = async () => setBooked(await api('/simulators/bookings', { method: 'POST', key, body: {
    bay_id: pick.bay.id, start: pick.start, duration, party_size: party, name: who.name, email: who.email, phone: who.phone,
    expected_total_cents: quote?.json?.quote?.total_cents } }));
  const tz = list?.json?.timezone;
  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = who.name && who.email;
  const bays = list?.json?.bays || [];

  return (
    <Layout title="Simulators" eyebrow="Indoor golf" intro="Launch-monitor bays by the hour - play any course in the world, whatever the weather.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a bay', 'Your details', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title="Your bay is booked">{pick?.bay.name}, {timeIn(pick?.start, tz)} for {duration} minutes. A confirmation is on its way.</Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a bay and time</h2>
                <p className="sub">Clubs, balls and the course library are included.</p>
                <DateStrip value={date} onChange={setDate} />
                <div className="options">
                  <Segmented label="How long" value={duration} onChange={setDuration} options={[[30, '30 min'], [60, '1 hr'], [90, '1.5 hr'], [120, '2 hr']]} />
                  <Segmented label="Players" value={party} onChange={setParty} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4'], [6, '6']]} />
                </div>
                <div className="resources">
                  {bays.map((bay) => (
                    <div key={bay.id} className={'resource' + (pick?.bay.id === bay.id ? ' selected' : '')}>
                      <div className="art"><Scene kind="sim" height={170} /></div>
                      <div className="body">
                        <h3>{bay.name}</h3>
                        <div className="tags">
                          {bay.simulator_type ? <span className="tag">{bay.simulator_type}</span> : null}
                          {bay.max_players ? <span className="tag">Up to {bay.max_players} players</span> : null}
                          <span className={'tag' + (bay.starts.length ? ' good' : '')}>{bay.starts.length ? bay.starts.length + ' times open' : 'Fully booked'}</span>
                        </div>
                        <div className="pills">
                          {bay.starts.map((s) => <button key={s} className={'pill' + (pick?.bay.id === bay.id && pick?.start === s ? ' on' : '')} onClick={() => choose(bay, s)}>{timeIn(s, tz)}</button>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {list && !bays.length && !list.json?.error ? <p className="empty" style={{ marginTop: 16 }}>No bays open {list.json?.reason ? '(' + String(list.json.reason).replace(/_/g, ' ') + ')' : 'this day'}. Try another day.</p> : null}
                <Notice result={list} />
              </div>
              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
                  <p className="sub">The confirmation goes to this email.</p>
                  <div className="fields">
                    <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} autoComplete="name" /></label>
                    <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} autoComplete="email" /></label>
                    <label className="field grow">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} autoComplete="tel" /></label>
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
        <Summary scene="sim"
          rows={pick ? [['Bay', pick.bay.name], ['Date', new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', timeIn(pick.start, tz)], ['Length', duration + ' min'], ['Players', party]] : []}
          lines={q ? [['Bay time', q.subtotal_cents], ['Tax', q.tax_cents]] : []}
          total={q?.total_cents} fine={q ? 'Pay at the club, or by card now.' : null}>
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
