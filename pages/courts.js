// pages/courts.js
// ============================================
// Courts (laid out for the page in commit 012).
//
// GET /courts -> POST /courts/quote (with rentals) -> POST /courts/bookings
// (pay at the club, or to a member account) or POST /payments (card). A
// closed day comes back with `closure`.
//
// The simulators pattern, for courts: a booking bar (how long, players, and
// the sport when the club has more than one), the next two weeks, then each
// court as a row with its sport and surface and its open starts - peak starts
// marked, since they're priced higher. Choosing a start folds the courts into
// one line; paddles and balls come next, with your details, because they're
// an add-on to a court you've already found.
// ============================================

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import CardPayment from '../components/CardPayment';
import Details, { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, DateStrip, Segmented } from '../components/Picker';
import { api, newKey, timeIn } from '../lib/verdeClient';
import { useClub, useOpenDay } from '../components/Club';
import { clubToday, fmtDay } from '../lib/clubTime';

const longDate = (d) => fmtDay(d, { weekday: 'long', month: 'long', day: 'numeric' });
const lengthWords = (m) => (m % 60 === 0 ? (m / 60) + (m === 60 ? ' hour' : ' hours') : m + ' minutes');
const words = (v) => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Courts() {
  /* Today at the club, or the next day with something left to book (commit 024). */
  const [date, setDate, skipIfEmpty, skippedFrom] = useOpenDay();
  const [duration, setDuration] = useState(60);
  const [players, setPlayers] = useState(4);
  const [sport, setSport] = useState('all');
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
    setList(null);
    if (!date) return;
    api('/courts?date=' + date + '&duration=' + duration).then(setList);
  }, [date, duration]);
  const choose = async (court, start, pd = paddles, b = balls) => { setPick({ court, start }); setBooked(null); setQuote(await api('/courts/quote', { method: 'POST', body: { court_id: court.id, start, duration, paddles: pd, balls: b } })); };
  const book = async (account) => setBooked(await api('/courts/bookings', { method: 'POST', key, body: {
    court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, ...person(who, member),
    ...(account ? { payment: 'member_account', charge_account_id: account } : {}),
    expected_total_cents: quote?.json?.quote?.total_cents } }));

  const { tz: clubTz } = useClub();
  const tz = list?.json?.timezone || clubTz;
  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = !!member || (who.name && who.email);
  const p = person(who, member);
  const all = list?.json?.courts || [];
  const sports = [...new Set(all.map((c) => c.sport).filter(Boolean))];
  const courts = sport === 'all' ? all : all.filter((c) => c.sport === sport);
  const loading = !date || !list;
  /* Nothing left to book today and no closure to explain it: open the next day (commit 024). */
  useEffect(() => {
    if (list?.ok) skipIfEmpty(!(list.json?.courts || []).some((x) => (x.starts || []).length) && !list.json?.closure);
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = courts.reduce((n, c) => n + c.starts.length, 0);
  const pickedPeak = pick && pick.court.starts.find((s) => s.start === pick.start)?.peak;

  return (
    <Layout title="Courts" eyebrow="Pickleball and Tennis" intro="Lit courts by the hour. Paddles and balls are at the desk if you need them.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a Court', 'Your Details', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title="Your Court Is Booked">{pick?.court.name}, {longDate(date)} at {timeIn(pick?.start, tz)}, for {lengthWords(duration)}. Your confirmation is on its way.</Success>
          ) : (
            <>
              <div className="panel">
                <div className="tee-bar">
                  {sports.length > 1 ? <Segmented label="Sport" value={sport} onChange={(v) => { setSport(v); setPick(null); setQuote(null); }} options={[['all', 'All'], ...sports.map((s) => [s, words(s)])]} /> : null}
                  <Segmented label="How long" value={duration} onChange={setDuration} options={[[60, '1 Hour'], [90, '90 Min'], [120, '2 Hours']]} />
                  <Segmented label="Players" value={players} onChange={setPlayers} options={[[2, '2'], [4, '4'], [6, '6']]} />
                </div>
                <DateStrip value={date} onChange={setDate} />

                <div className="tee-day">
                  <h2>{longDate(date)}</h2>
                  <span>{loading ? 'Checking the courts\u2026' : skippedFrom ? 'No more times ' + (skippedFrom === clubToday(clubTz) ? 'today' : 'on ' + fmtDay(skippedFrom, { weekday: 'long' })) + ', so here\u2019s ' + fmtDay(date, { weekday: 'long' }) + '.' : courts.length && !pick ? open + (open === 1 ? ' start' : ' starts') + ' open · Peak hours are marked' : ''}</span>
                </div>

                {list?.json?.closure?.message ? <div className="notice bad">{list.json.closure.message}</div> : null}

                {pick && q ? (
                  <div className="chosen">
                    <div>
                      <b>{timeIn(pick.start, tz)}</b>
                      <span>{pick.court.name} · {lengthWords(duration)} · {players} players{pickedPeak ? ' · Peak' : ''}</span>
                    </div>
                    <button className="btn ghost small" onClick={() => { setPick(null); setQuote(null); setBooked(null); }}>Change Time</button>
                  </div>
                ) : loading ? (
                  <div className="bays" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="bay"><span className="tile ghost" style={{ height: 64 }} /></div>)}</div>
                ) : (
                  <div className="bays">
                    {courts.map((c) => (
                      <div key={c.id} className="bay">
                        <div className="bay-head">
                          <h3>{c.name}</h3>
                          <span>{[c.sport ? words(c.sport) : null, c.surface ? words(c.surface) : null].filter(Boolean).join(' · ')}</span>
                        </div>
                        {c.starts.length ? (
                          <div className="tiles compact">
                            {c.starts.map((s) => (
                              <button key={s.start} className={'tile' + (s.peak ? ' peak' : '')} onClick={() => choose(c, s.start)}>
                                <span className="tile-time">{timeIn(s.start, tz)}</span>
                                {s.peak ? <span className="tile-meta">Peak</span> : null}
                              </button>
                            ))}
                          </div>
                        ) : <p className="empty">Booked for the day.</p>}
                      </div>
                    ))}
                  </div>
                )}
                {list && !all.length && !list.json?.error && !list.json?.closure ? <p className="empty">No courts open on {longDate(date)}. Try another day.</p> : null}
                <Notice result={list} />
              </div>

              {q ? (
                <>
                  <div className="panel">
                    <h2>Rentals</h2>
                    <p className="sub">Bring your own, or pick them up at the desk when you check in.</p>
                    <div className="fields">
                      <Segmented label="Paddles" value={paddles} onChange={(v) => { setPaddles(v); choose(pick.court, pick.start, v, balls); }} options={[[0, 'None'], [2, '2'], [4, '4']]} />
                      {/* The same control as paddles (commit 021). */}
                      <Segmented label="Balls" value={balls ? 'yes' : 'no'} onChange={(v) => { const b = v === 'yes'; setBalls(b); choose(pick.court, pick.start, paddles, b); }} options={[['no', 'None'], ['yes', 'A Fresh Can']]} />
                    </div>
                  </div>
                  <div className="panel">
                    <h2>Your Details</h2>
                    <p className="sub">Your confirmation goes to this email.</p>
                    <Details who={who} setWho={setWho} phone={false} />
                    <Notice result={booked} kind="bad" />
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
        <Summary scene="court" title="Your Court Time" empty="Choose a start to see the details here."
          rows={pick ? [['Court', pick.court.name], ['Date', fmtDay(date, { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', timeIn(pick.start, tz) + (pickedPeak ? ' (peak)' : '')], ['Length', lengthWords(duration)], ['Players', players]] : []}
          lines={q ? [['Court', q.court_cents ?? q.subtotal_cents], ['Rentals', q.equipment_cents], ['Tax', q.tax_cents]] : []}
          total={q?.total_cents} fine={q ? 'Pay at the club, or by card now.' : null}>
          {q && !done ? (
            <>
              <button className="btn" disabled={!ready} onClick={() => book()}>Book and Pay at the Club</button>
              {member && accounts.length ? <button className="btn ghost" onClick={() => book(accounts[0].id)}>Charge My Member Account</button> : null}
              {ready ? <CardPayment label="Pay Now by Card" start={{ type: 'court', court_id: pick.court.id, start: pick.start, duration, players, paddles, balls, ...p }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
