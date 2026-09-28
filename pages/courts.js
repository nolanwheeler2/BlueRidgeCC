// pages/courts.js
// GET /courts -> POST /courts/quote (with rentals) -> POST /courts/bookings or
// POST /payments (card).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import Scene from '../components/Scene';
import CardPayment from '../components/CardPayment';
import Details, { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, DateStrip, Segmented, Toggle } from '../components/Picker';
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
  const { member, accounts } = useMember();

  useEffect(() => {
    setPick(null); setQuote(null); setBooked(null); setPaid(null); setKey(newKey());
    api('/courts?date=' + date + '&duration=' + duration).then(setList);
  }, [date, duration]);
  const choose = async (court, start, p = paddles, b = balls) => { setPick({ court, start }); setBooked(null); setQuote(await api('/courts/quote', { method: 'POST', body: { court_id: court.id, start, duration, paddles: p, balls: b } })); };
  const book = async (account) => setBooked(await api('/courts/bookings', { method: 'POST', key, body: {
    court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, ...person(who, member),
    ...(account ? { payment: 'member_account', charge_account_id: account } : {}),
    expected_total_cents: quote?.json?.quote?.total_cents } }));
  const tz = list?.json?.timezone;
  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = !!member || (who.name && who.email);
  const p = person(who, member);
  const courts = list?.json?.courts || [];

  return (
    <Layout title="Courts" eyebrow="Pickleball & tennis" intro="Lit courts by the hour. Paddles and balls are here if you need them.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a court', 'Your details', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title="Your court is booked">{pick?.court.name}, {timeIn(pick?.start, tz)} for {duration} minutes.</Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a court and time</h2>
                <p className="sub">Peak hours are marked - they&rsquo;re priced a little higher.</p>
                <DateStrip value={date} onChange={setDate} />
                <div className="options">
                  <Segmented label="How long" value={duration} onChange={setDuration} options={[[60, '1 hr'], [90, '1.5 hr'], [120, '2 hr']]} />
                  <Segmented label="Players" value={players} onChange={setPlayers} options={[[2, '2'], [4, '4'], [6, '6']]} />
                </div>
                <div className="options">
                  <Segmented label="Rent paddles" value={paddles} onChange={(v) => { setPaddles(v); if (pick) choose(pick.court, pick.start, v, balls); }} options={[[0, 'None'], [2, '2'], [4, '4']]} />
                  <Toggle checked={balls} onChange={(v) => { setBalls(v); if (pick) choose(pick.court, pick.start, paddles, v); }} title="Balls" detail="A fresh can for your session" />
                </div>
                <div className="resources">
                  {courts.map((c) => (
                    <div key={c.id} className={'resource' + (pick?.court.id === c.id ? ' selected' : '')}>
                      <div className="art"><Scene kind="court" height={170} /></div>
                      <div className="body">
                        <h3>{c.name}</h3>
                        <div className="tags">
                          {c.sport ? <span className="tag">{String(c.sport).replace(/_/g, ' ')}</span> : null}
                          {c.surface ? <span className="tag">{String(c.surface).replace(/_/g, ' ')}</span> : null}
                          <span className={'tag' + (c.starts.length ? ' good' : '')}>{c.starts.length ? c.starts.length + ' times open' : 'Fully booked'}</span>
                        </div>
                        <div className="pills">
                          {c.starts.map((s) => <button key={s.start} className={'pill' + (pick?.court.id === c.id && pick?.start === s.start ? ' on' : '')} onClick={() => choose(c, s.start)}>{timeIn(s.start, tz)}{s.peak ? <small>Peak</small> : null}</button>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Closed (Verde commit 486): why, and until when. */}
                {list?.json?.closure?.message ? <div className="notice bad" style={{ marginTop: 16 }}>{list.json.closure.message}</div> : null}
                <Notice result={list} />
              </div>
              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
                  <p className="sub">The confirmation goes to this email.</p>
                  <Details who={who} setWho={setWho} phone={false} />
                  <Notice result={booked} kind="bad" />
                </div>
              ) : null}
            </>
          )}
          <Result result={booked} title="POST /courts/bookings" />
          <Result result={quote} title="POST /courts/quote" />
          <Result result={list} title="GET /courts" />
        </div>
        <Summary scene="court"
          rows={pick ? [['Court', pick.court.name], ['Date', new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', timeIn(pick.start, tz)], ['Length', duration + ' min'], ['Players', players]] : []}
          lines={q ? [['Court', q.court_cents ?? q.subtotal_cents], ['Rentals', q.equipment_cents], ['Tax', q.tax_cents]] : []}
          total={q?.total_cents} fine={q ? 'Pay at the club, or by card now.' : null}>
          {q && !done ? (
            <>
              <button className="btn" disabled={!ready} onClick={() => book()}>Book - pay at the club</button>
              {member && accounts.length ? <button className="btn ghost" onClick={() => book(accounts[0].id)}>Charge my member account</button> : null}
              {ready ? <CardPayment label="Pay now by card" start={{ type: 'court', court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, ...p }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
