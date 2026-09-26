// pages/courts.js
// GET /courts -> POST /courts/quote (with rentals) -> POST /courts/bookings or
// POST /payments (card).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import CardPayment from '../components/CardPayment';
import { api, newKey, timeIn, todayPlus } from '../lib/verdeClient';

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
  const [paid, setPaid] = useState(null);
  const [key, setKey] = useState(newKey());

  const load = async () => { setPick(null); setQuote(null); setBooked(null); setPaid(null); setKey(newKey()); setList(await api('/courts?date=' + date + '&duration=' + duration)); };
  useEffect(() => { load(); }, [date, duration]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = async (court, start, p = paddles, b = balls) => { setPick({ court, start }); setBooked(null); setQuote(await api('/courts/quote', { method: 'POST', body: { court_id: court.id, start, duration, paddles: p, balls: b } })); };
  const book = async () => setBooked(await api('/courts/bookings', { method: 'POST', key, body: {
    court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, name: who.name, email: who.email, phone: who.phone,
    expected_total_cents: quote?.json?.quote?.total_cents } }));
  const tz = list?.json?.timezone;
  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = who.name && who.email;

  return (
    <Layout title="Courts" eyebrow="Pickleball & tennis" intro="Book a court by the hour. Paddles and balls are here if you need them.">
      <div className="wrap booking">
        <div>
          {done ? (
            <Success title="Your court is booked">{pick?.court.name}, {timeIn(pick?.start, tz)} for {duration} minutes.</Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a court and time</h2>
                <div className="fields">
                  <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                  <label className="field">How long<select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{[60, 90, 120].map((n) => <option key={n} value={n}>{n} minutes</option>)}</select></label>
                  <label className="field">Players<input type="number" min={1} max={8} value={players} onChange={(e) => setPlayers(Number(e.target.value))} style={{ width: 90 }} /></label>
                  <label className="field">Rent paddles<input type="number" min={0} max={8} value={paddles} onChange={(e) => { const v = Number(e.target.value); setPaddles(v); if (pick) choose(pick.court, pick.start, v, balls); }} style={{ width: 90 }} /></label>
                  <label className="check"><input type="checkbox" checked={balls} onChange={(e) => { setBalls(e.target.checked); if (pick) choose(pick.court, pick.start, paddles, e.target.checked); }} /> Balls</label>
                </div>
                {(list?.json?.courts || []).map((c) => (
                  <div className="group" key={c.id}>
                    <h3>{c.name}{c.sport ? <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {c.sport}</span> : null}</h3>
                    <div className="pills">
                      {c.starts.map((s) => <button key={s.start} className={'pill' + (pick?.court.id === c.id && pick?.start === s.start ? ' on' : '')} onClick={() => choose(c, s.start)}>{timeIn(s.start, tz)}{s.peak ? <small>Peak</small> : null}</button>)}
                      {!c.starts.length ? <span className="empty">Fully booked.</span> : null}
                    </div>
                  </div>
                ))}
                <Notice result={list} />
              </div>
              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
                  <div className="fields">
                    <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
                    <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
                  </div>
                  <Notice result={booked} kind="bad" />
                </div>
              ) : null}
            </>
          )}
          <Result result={booked} title="POST /courts/bookings" />
          <Result result={quote} title="POST /courts/quote" />
          <Result result={list} title="GET /courts" />
        </div>
        <Summary rows={pick ? [['Court', pick.court.name], ['Time', timeIn(pick.start, tz)], ['Length', duration + ' min'], paddles ? ['Paddles', paddles] : null, balls ? ['Balls', 'Yes'] : null] : []} total={q?.total_cents} fine={q ? 'Pay at the club, or by card now.' : null}>
          {q && !done ? (
            <>
              <button className="btn" disabled={!ready} onClick={book}>Book - pay at the club</button>
              {ready ? <CardPayment label="Pay now by card" start={{ type: 'court', court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, name: who.name, email: who.email, phone: who.phone }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
