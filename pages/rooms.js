// pages/rooms.js
// GET /lodging -> POST /lodging/quote -> POST /lodging/bookings or POST /payments.
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
import { StepBar, Segmented } from '../components/Picker';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';

const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const nightsBetween = (a, b) => Math.max(0, Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000));

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
    if (checkOut <= checkIn) { setList(null); return; }
    api('/lodging?check_in=' + checkIn + '&check_out=' + checkOut + '&guests=' + guests).then(setList);
  }, [checkIn, checkOut, guests]);
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

  return (
    <Layout title="Stay" eyebrow="Cottages" intro="Wake up above the eighteenth green. Stay and play, or just stay.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a room', 'Your details', 'Confirmed']} at={done ? 2 : q ? 1 : 0} />
          {done ? (
            <Success title="Your stay is booked">{room?.name}, {fmt(checkIn)} to {fmt(checkOut)}. We look forward to having you.</Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Your dates</h2>
                <p className="sub">{nights > 0 ? nights + (nights === 1 ? ' night' : ' nights') + ', ' + fmt(checkIn) + ' to ' + fmt(checkOut) : 'Choose when you arrive and leave.'}</p>
                <div className="fields">
                  <label className="field">Arrive<input type="date" value={checkIn} min={todayPlus(0)} onChange={(e) => setCheckIn(e.target.value)} /></label>
                  <label className="field">Leave<input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} /></label>
                  <Segmented label="Guests" value={guests} onChange={setGuests} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]} />
                </div>
                {checkOut <= checkIn ? <div className="notice warn">Leave after you arrive.</div> : null}
                <div className="resources">
                  {rooms.map((r) => (
                    <div key={r.id} className={'resource' + (room?.id === r.id ? ' selected' : '')}>
                      <div className="art">{r.image_url ? <img src={r.image_url} alt="" /> : <Scene kind="room" height={190} />}</div>
                      <div className="body">
                        <h3>{r.name}</h3>
                        <div className="tags">
                          {r.type ? <span className="tag">{String(r.type).replace(/_/g, ' ')}</span> : null}
                          {r.max_guests ? <span className="tag">Sleeps {r.max_guests}</span> : null}
                          {r.beds ? <span className="tag">{r.beds} {r.bed_type ? String(r.bed_type).replace(/_/g, ' ') : ''} {r.beds === 1 ? 'bed' : 'beds'}</span> : null}
                        </div>
                        {r.description ? <p>{r.description}</p> : null}
                        {(r.amenities || []).length ? <div className="tags" style={{ marginTop: 8 }}>{r.amenities.slice(0, 6).map((a) => <span key={a} className="tag good">{String(a).replace(/_/g, ' ')}</span>)}</div> : null}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                          <span style={{ fontSize: 14, color: 'var(--muted)' }}>{r.base_rate_cents ? <><b style={{ fontSize: 20, color: 'var(--navy)' }}>{money(r.base_rate_cents)}</b> a night</> : null}</span>
                          <button className={'btn small' + (room?.id === r.id ? '' : ' ghost')} onClick={() => choose(r)}>{room?.id === r.id ? 'Selected' : 'Choose'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {list && !rooms.length && !list.json?.error ? <p className="empty" style={{ marginTop: 16 }}>No rooms free for those dates. Try moving a night either way.</p> : null}
                <Notice result={list} />
              </div>
              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
                  <p className="sub">The confirmation goes to this email.</p>
                  <Details who={who} setWho={setWho} />
                  <div className="fields" style={{ marginTop: 14 }}>
                    <label className="field" style={{ flex: '1 1 100%' }}>Anything we should know?<textarea rows={2} value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="Late arrival, extra pillows, celebrating something..." /></label>
                  </div>
                  <Notice result={booked} kind="bad" />
                </div>
              ) : null}
            </>
          )}
          <Result result={booked} title="POST /lodging/bookings" />
          <Result result={quote} title="POST /lodging/quote" />
          <Result result={list} title="GET /lodging" />
        </div>
        <Summary title="Your stay" scene="room"
          rows={room ? [['Room', room.name], ['Arrive', fmt(checkIn)], ['Leave', fmt(checkOut)], ['Guests', guests]] : []}
          lines={q ? [[q.nights + (q.nights === 1 ? ' night' : ' nights') + (q.rate_per_night_cents ? ' × ' + money(q.rate_per_night_cents) : ''), q.room_cents], ['Fees', q.fees_cents], ['Service fee', q.service_fee_cents], ['Tax', q.tax_cents]] : []}
          total={q?.total_cents}
          fine={q ? (q.payment?.mode === 'deposit' ? 'The club takes a ' + (q.payment.deposit_percent || '') + '% deposit when you book - pay by card.' : 'Pay at check-in, or by card now.') : null}>
          {q && !done ? (
            <>
              {q.payment?.api_bookable !== false ? <button className="btn" disabled={!ready} onClick={() => book()}>Book - pay at check-in</button> : null}
              {member && accounts.length ? <button className="btn ghost" onClick={() => book(accounts[0].id)}>Charge my member account</button> : null}
              {ready ? <CardPayment label="Pay now by card" start={{ type: 'lodging', room_id: room.id, check_in: checkIn, check_out: checkOut, guests, ...p, requests: who.requests }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
