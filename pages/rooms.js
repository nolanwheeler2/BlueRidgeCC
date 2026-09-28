// pages/rooms.js
// ============================================
// Stay - the cottages (laid out for the page in commit 013).
//
// GET /lodging -> POST /lodging/quote -> POST /lodging/bookings (pay at
// check-in, or to a member account) or POST /payments (card). A closed stretch
// comes back with `closure`.
//
// A hotel's layout rather than a tee sheet's: a stay bar (arrive, the nights,
// leave, guests), then each room as a listing - its name, what it is and who
// it sleeps, the description, amenities, the nightly rate and the total for
// the dates. Rooms show their own photos when the club has them; when none
// do, the listings are text-led instead of repeating one stock photo. Choosing
// a room folds the list into one line, as on every booking page.
// ============================================

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import Photo from '../components/Photo';
import CardPayment from '../components/CardPayment';
import Details, { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, Segmented } from '../components/Picker';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';

const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const longFmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const nightsBetween = (a, b) => Math.max(0, Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000));
const words = (v) => { const w = String(v || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); return w === 'Wifi' ? 'Wi-Fi' : w; };
/* A rate shown large: whole dollars without the cents. */
const rate = (c) => (c % 100 === 0 ? '$' + (c / 100).toLocaleString('en-US') : money(c));
const plusDays = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

export default function Rooms() {
  const [checkIn, setCheckIn] = useState(todayPlus(7));
  const [checkOut, setCheckOut] = useState(todayPlus(9));
  const [guests, setGuests] = useState(2);
  const [list, setList] = useState(null);
  const [room, setRoom] = useState(null);
  const [quote, setQuote] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '', requests: '' });
  const [booked, setBooked] = useState(null);
  const [paid, setPaid] = useState(null);
  const [key, setKey] = useState(newKey());
  const { member, accounts } = useMember();

  useEffect(() => {
    setRoom(null); setQuote(null); setBooked(null); setPaid(null); setKey(newKey());
    setList(null);
    if (checkOut <= checkIn) return;
    api('/lodging?check_in=' + checkIn + '&check_out=' + checkOut + '&guests=' + guests).then(setList);
  }, [checkIn, checkOut, guests]);
  /* Moving the arrival past the departure keeps the stay's length. */
  const arrive = (d) => { if (!d) return; const n = Math.max(1, nightsBetween(checkIn, checkOut)); setCheckIn(d); if (checkOut <= d) setCheckOut(plusDays(d, n)); };
  const choose = async (r) => { setRoom(r); setBooked(null); setQuote(await api('/lodging/quote', { method: 'POST', body: { room_id: r.id, check_in: checkIn, check_out: checkOut } })); };
  const book = async (account) => setBooked(await api('/lodging/bookings', { method: 'POST', key, body: {
    room_id: room.id, check_in: checkIn, check_out: checkOut, guests, ...person(who, member), requests: who.requests,
    ...(account ? { payment: 'member_account', charge_account_id: account } : {}),
    expected_total_cents: quote?.json?.quote?.total_cents } }));

  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = !!member || (who.name && who.email);
  const p = person(who, member);
  const rooms = list?.json?.rooms || [];
  const nights = nightsBetween(checkIn, checkOut);
  const badDates = checkOut <= checkIn;
  const loading = !badDates && !list;
  const pictured = rooms.some((r) => r.image_url);

  return (
    <Layout title="Stay" eyebrow="The Cottages" intro="Wake up above the eighteenth green. Stay and play, or just stay.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a Room', 'Your Details', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title="Your Stay Is Booked">{room?.name}, {longFmt(checkIn)} to {longFmt(checkOut)}. Your confirmation is on its way, and we look forward to having you.</Success>
          ) : (
            <>
              <div className="panel">
                <div className="stay-bar">
                  <label className="stay-date">
                    <span>Arrive</span>
                    <input type="date" value={checkIn} min={todayPlus(0)} onChange={(e) => arrive(e.target.value)} />
                  </label>
                  <div className="stay-nights" aria-live="polite">{nights > 0 ? nights + (nights === 1 ? ' night' : ' nights') : '\u2014'}</div>
                  <label className="stay-date">
                    <span>Leave</span>
                    <input type="date" value={checkOut} min={plusDays(checkIn, 1)} onChange={(e) => e.target.value && setCheckOut(e.target.value)} />
                  </label>
                  <Segmented label="Guests" value={guests} onChange={setGuests} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]} />
                </div>
                {badDates ? <div className="notice warn">Choose a departure after your arrival.</div> : null}

                <div className="tee-day">
                  <h2>{nights > 0 ? fmt(checkIn) + ' to ' + fmt(checkOut) : 'Your Dates'}</h2>
                  <span>{loading ? 'Checking the cottages\u2026' : rooms.length && !room ? rooms.length + (rooms.length === 1 ? ' room' : ' rooms') + ' free for ' + guests + (guests === 1 ? ' guest' : ' guests') : ''}</span>
                </div>

                {list?.json?.closure?.message ? <div className="notice bad">{list.json.closure.message}</div> : null}

                {room && q ? (
                  <div className="chosen">
                    <div>
                      <b>{room.name}</b>
                      <span>{fmt(checkIn)} to {fmt(checkOut)} · {nights} {nights === 1 ? 'night' : 'nights'} · {guests} {guests === 1 ? 'guest' : 'guests'}</span>
                    </div>
                    <button className="btn ghost small" onClick={() => { setRoom(null); setQuote(null); setBooked(null); }}>Change Room</button>
                  </div>
                ) : loading ? (
                  <div className="bays" aria-hidden="true">{[0, 1].map((i) => <div key={i} className="bay"><span className="tile ghost" style={{ height: 120 }} /></div>)}</div>
                ) : rooms.length ? (
                  <div className="listings">
                    {rooms.map((r) => {
                      const facts = [r.type ? words(r.type) : null, r.max_guests ? 'Sleeps ' + r.max_guests : null,
                        r.beds ? r.beds + ' ' + (r.bed_type ? words(r.bed_type) + ' ' : '') + (r.beds === 1 ? 'Bed' : 'Beds') : null].filter(Boolean);
                      return (
                        <article key={r.id} className={'listing' + (pictured ? ' pictured' : '')}>
                          {pictured ? (
                            <div className="listing-photo">
                              {r.image_url ? <img src={r.image_url} alt={r.name} loading="lazy" /> : <Photo name="amenities-lodging" alt="" />}
                            </div>
                          ) : null}
                          <div className="listing-body">
                            <h3>{r.name}</h3>
                            {facts.length ? <p className="listing-facts">{facts.join(' · ')}</p> : null}
                            {r.description ? <p className="listing-text">{r.description}</p> : null}
                            {(r.amenities || []).length ? <p className="listing-amenities">{r.amenities.slice(0, 6).map(words).join(' · ')}</p> : null}
                          </div>
                          <div className="listing-price">
                            {r.base_rate_cents ? (
                              <>
                                <b>{rate(r.base_rate_cents)}</b>
                                <span>a night</span>
                                {nights > 1 ? <small>{rate(r.base_rate_cents * nights)} for {nights} nights, before tax</small> : null}
                              </>
                            ) : null}
                            <button className="btn" onClick={() => choose(r)}>Choose Room</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
                {list && !rooms.length && !list.json?.error && !list.json?.closure ? <p className="empty">No rooms are free for those dates. Try moving a night either way.</p> : null}
                <Notice result={list} />
              </div>

              {q ? (
                <div className="panel">
                  <h2>Your Details</h2>
                  <p className="sub">Your confirmation goes to this email.</p>
                  <Details who={who} setWho={setWho} />
                  <div className="fields" style={{ marginTop: 18 }}>
                    <label className="field" style={{ flex: '1 1 100%' }}>Anything we should know?<textarea rows={3} value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="A late arrival, extra pillows, something you're celebrating" /></label>
                  </div>
                  <Notice result={booked} kind="bad" />
                </div>
              ) : null}
            </>
          )}
        </div>
        <Summary title="Your Stay" scene="room" empty="Choose a room to see your stay here."
          rows={room ? [['Room', room.name], ['Arrive', fmt(checkIn)], ['Leave', fmt(checkOut)], ['Guests', guests]] : []}
          lines={q ? [[q.nights + (q.nights === 1 ? ' night' : ' nights') + (q.rate_per_night_cents ? ' × ' + money(q.rate_per_night_cents) : ''), q.room_cents], ['Fees', q.fees_cents], ['Service fee', q.service_fee_cents], ['Tax', q.tax_cents]] : []}
          total={q?.total_cents}
          fine={q ? (q.payment?.mode === 'deposit' ? 'The club takes a ' + (q.payment.deposit_percent || '') + '% deposit when you book, by card.' : 'Pay at check-in, or by card now.') : null}>
          {q && !done ? (
            <>
              {q.payment?.api_bookable !== false ? <button className="btn" disabled={!ready} onClick={() => book()}>Book and Pay at Check-In</button> : null}
              {member && accounts.length ? <button className="btn ghost" onClick={() => book(accounts[0].id)}>Charge My Member Account</button> : null}
              {ready ? <CardPayment label="Pay Now by Card" start={{ type: 'lodging', room_id: room.id, check_in: checkIn, check_out: checkOut, guests, ...p, requests: who.requests }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
