// pages/simulators.js
// ============================================
// Simulators (laid out for the page in commit 011).
//
// GET /simulators -> POST /simulators/quote -> POST /simulators/bookings (pay
// at the club, or to a member account) or POST /payments (card). A closed
// day comes back with `closure` (why, and until when).
//
// The layout follows tee times: a booking bar (how long, players), the next
// two weeks, then the day - each bay a row with its name, what it is, and its
// open starts as tiles. Choosing a start folds the bays into one line, so the
// details and the price are right there.
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

const LENGTHS = [[30, '30 Min'], [60, '1 Hour'], [90, '90 Min'], [120, '2 Hours']];
const longDate = (d) => fmtDay(d, { weekday: 'long', month: 'long', day: 'numeric' });
const lengthWords = (m) => (m % 60 === 0 ? (m / 60) + (m === 60 ? ' hour' : ' hours') : m + ' minutes');

export default function Simulators() {
  /* Today at the club, or the next day with something left to book (commit 024). */
  const [date, setDate, skipIfEmpty, skippedFrom] = useOpenDay();
  const [duration, setDuration] = useState(60);
  const [party, setParty] = useState(2);
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
    api('/simulators?date=' + date + '&duration=' + duration).then(setList);
  }, [date, duration]);
  const choose = async (bay, start) => { setPick({ bay, start }); setBooked(null); setQuote(await api('/simulators/quote', { method: 'POST', body: { bay_id: bay.id, start, duration } })); };
  const book = async (account) => setBooked(await api('/simulators/bookings', { method: 'POST', key, body: {
    bay_id: pick.bay.id, start: pick.start, duration, party_size: party, ...person(who, member),
    ...(account ? { payment: 'member_account', charge_account_id: account } : {}),
    expected_total_cents: quote?.json?.quote?.total_cents } }));

  const { tz: clubTz } = useClub();
  const tz = list?.json?.timezone || clubTz;
  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = !!member || (who.name && who.email);
  const p = person(who, member);
  const bays = list?.json?.bays || [];
  const loading = !date || !list;
  /* Nothing left to book today and no closure to explain it: open the next day (commit 024). */
  useEffect(() => {
    if (list?.ok) skipIfEmpty(!(list.json?.bays || []).some((x) => (x.starts || []).length) && !list.json?.closure);
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = bays.reduce((n, b) => n + b.starts.length, 0);

  return (
    <Layout title="Simulators" eyebrow="Indoor Golf" intro="Launch-monitor bays by the hour. Play any course in the world, whatever the weather on the ridge.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a Bay', 'Your Details', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title="Your Bay Is Booked">{pick?.bay.name}, {longDate(date)} at {timeIn(pick?.start, tz)}, for {lengthWords(duration)}. Your confirmation is on its way.</Success>
          ) : (
            <>
              <div className="panel">
                <div className="tee-bar">
                  <Segmented label="How long" value={duration} onChange={setDuration} options={LENGTHS} />
                  <Segmented label="Players" value={party} onChange={setParty} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4'], [6, '6']]} />
                  <p className="bar-note">Clubs, balls and the full course library are included.</p>
                </div>
                <DateStrip value={date} onChange={setDate} />

                <div className="tee-day">
                  <h2>{longDate(date)}</h2>
                  <span>{loading ? 'Checking the bays\u2026' : skippedFrom ? 'No more times ' + (skippedFrom === clubToday(clubTz) ? 'today' : 'on ' + fmtDay(skippedFrom, { weekday: 'long' })) + ', so here\u2019s ' + fmtDay(date, { weekday: 'long' }) + '.' : bays.length && !pick ? open + (open === 1 ? ' start' : ' starts') + ' open for ' + lengthWords(duration) : ''}</span>
                </div>

                {list?.json?.closure?.message ? <div className="notice bad">{list.json.closure.message}</div> : null}

                {pick && q ? (
                  <div className="chosen">
                    <div>
                      <b>{timeIn(pick.start, tz)}</b>
                      <span>{pick.bay.name} · {lengthWords(duration)} · {party} {party === 1 ? 'player' : 'players'}</span>
                    </div>
                    <button className="btn ghost small" onClick={() => { setPick(null); setQuote(null); setBooked(null); }}>Change Time</button>
                  </div>
                ) : loading ? (
                  <div className="bays" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="bay"><span className="tile ghost" style={{ height: 64 }} /></div>)}</div>
                ) : (
                  <div className="bays">
                    {bays.map((bay) => {
                      const tooSmall = bay.max_players && party > bay.max_players;
                      return (
                        <div key={bay.id} className="bay">
                          <div className="bay-head">
                            <h3>{bay.name}</h3>
                            <span>
                              {[bay.simulator_type, bay.max_players ? 'Up to ' + bay.max_players + ' players' : null].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                          {tooSmall ? <p className="empty">This bay takes up to {bay.max_players} players.</p>
                            : bay.starts.length ? (
                              <div className="tiles compact">
                                {bay.starts.map((s) => (
                                  <button key={s} className="tile" onClick={() => choose(bay, s)}><span className="tile-time">{timeIn(s, tz)}</span></button>
                                ))}
                              </div>
                            ) : <p className="empty">Booked for the day.</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {list && !bays.length && !list.json?.error && !list.json?.closure ? <p className="empty">No bays open on {longDate(date)}. Try another day.</p> : null}
                <Notice result={list} />
              </div>

              {q ? (
                <div className="panel">
                  <h2>Your Details</h2>
                  <p className="sub">Your confirmation goes to this email.</p>
                  <Details who={who} setWho={setWho} />
                  <Notice result={booked} kind="bad" />
                </div>
              ) : null}
            </>
          )}
        </div>
        <Summary scene="sim" title="Your Bay Time" empty="Choose a start to see the details here."
          rows={pick ? [['Bay', pick.bay.name], ['Date', fmtDay(date, { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', timeIn(pick.start, tz)], ['Length', lengthWords(duration)], ['Players', party]] : []}
          lines={q ? [['Bay time', q.subtotal_cents], ['Tax', q.tax_cents]] : []}
          total={q?.total_cents} fine={q ? 'Pay at the club, or by card now.' : null}>
          {q && !done ? (
            <>
              <button className="btn" disabled={!ready} onClick={() => book()}>Book and Pay at the Club</button>
              {member && accounts.length ? <button className="btn ghost" onClick={() => book(accounts[0].id)}>Charge My Member Account</button> : null}
              {ready ? <CardPayment label="Pay Now by Card" start={{ type: 'simulator', bay_id: pick.bay.id, start: pick.start, duration, party_size: party, ...p }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
