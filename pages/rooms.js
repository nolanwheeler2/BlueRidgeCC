// pages/rooms.js
// GET /lodging -> POST /lodging/quote -> POST /lodging/bookings or POST /payments.
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import CardPayment from '../components/CardPayment';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';

const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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

  const load = async () => { setRoom(null); setQuote(null); setBooked(null); setPaid(null); setKey(newKey()); setList(await api('/lodging?check_in=' + checkIn + '&check_out=' + checkOut + '&guests=' + guests)); };
  const choose = async (r) => { setRoom(r); setBooked(null); setQuote(await api('/lodging/quote', { method: 'POST', body: { room_id: r.id, check_in: checkIn, check_out: checkOut } })); };
  const book = async () => setBooked(await api('/lodging/bookings', { method: 'POST', key, body: {
    room_id: room.id, check_in: checkIn, check_out: checkOut, guests, name: who.name, email: who.email, phone: who.phone,
    requests: who.requests, expected_total_cents: quote?.json?.quote?.total_cents } }));
  const q = quote?.json?.quote;
  const done = booked?.json?.reservation || paid;
  const ready = who.name && who.email;

  return (
    <Layout title="Stay" eyebrow="Cottages" intro="Wake up above the eighteenth green. Check in from 3 PM, out by 11 AM.">
      <div className="wrap booking">
        <div>
          {done ? (
            <Success title="Your stay is booked">{room?.name}, {fmt(checkIn)} to {fmt(checkOut)}. We look forward to having you.</Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Your dates</h2>
                <div className="fields">
                  <label className="field">Arrive<input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></label>
                  <label className="field">Leave<input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></label>
                  <label className="field">Guests<input type="number" min={1} max={8} value={guests} onChange={(e) => setGuests(Number(e.target.value))} style={{ width: 90 }} /></label>
                  <button className="btn" onClick={load}>See rooms</button>
                </div>
                <div className="group">
                  <div className="pills">
                    {(list?.json?.rooms || []).map((r) => (
                      <button key={r.id} className={'pill' + (room?.id === r.id ? ' on' : '')} onClick={() => choose(r)}>
                        {r.name}<small>{r.max_guests ? 'Sleeps ' + r.max_guests : ''}{r.base_rate_cents ? ' · from ' + money(r.base_rate_cents) : ''}</small>
                      </button>
                    ))}
                  </div>
                  {list && !(list.json?.rooms || []).length && !list.json?.error ? <p className="empty">No rooms free for those dates.</p> : null}
                </div>
                <Notice result={list} />
              </div>
              {q ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
                  <div className="fields">
                    <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
                    <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
                    <label className="field grow">Anything we should know?<input value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="Late arrival, extra pillows..." /></label>
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
        <Summary title="Your stay" rows={room ? [['Room', room.name], ['Arrive', fmt(checkIn)], ['Leave', fmt(checkOut)], q ? ['Nights', q.nights] : null, ['Guests', guests]] : []} total={q?.total_cents}
          fine={q ? (q.payment?.mode === 'deposit' ? 'The club takes a deposit when you book - pay by card.' : 'Pay at check-in, or by card now.') : null}>
          {q && !done ? (
            <>
              {q.payment?.api_bookable !== false ? <button className="btn" disabled={!ready} onClick={book}>Book - pay at check-in</button> : null}
              {ready ? <CardPayment label="Pay now by card" start={{ type: 'lodging', room_id: room.id, check_in: checkIn, check_out: checkOut, guests, name: who.name, email: who.email, phone: who.phone, requests: who.requests }} onDone={(j) => setPaid(j.booking)} /> : <p className="fine">Add your name and email to book.</p>}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
