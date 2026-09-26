// pages/rooms.js
// GET /lodging -> POST /lodging/quote -> POST /lodging/bookings or POST /payments.
import { useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import CardPayment from '../components/CardPayment';
import { api, money, newKey, todayPlus } from '../lib/verdeClient';

export default function Rooms() {
  const [checkIn, setCheckIn] = useState(todayPlus(7));
  const [checkOut, setCheckOut] = useState(todayPlus(9));
  const [guests, setGuests] = useState(2);
  const [list, setList] = useState(null);
  const [room, setRoom] = useState(null);
  const [quote, setQuote] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '', requests: '' });
  const [booked, setBooked] = useState(null);
  const [key] = useState(newKey());

  const load = async () => { setRoom(null); setQuote(null); setBooked(null); setList(await api('/lodging?check_in=' + checkIn + '&check_out=' + checkOut + '&guests=' + guests)); };
  const choose = async (r) => { setRoom(r); setBooked(null); setQuote(await api('/lodging/quote', { method: 'POST', body: { room_id: r.id, check_in: checkIn, check_out: checkOut } })); };
  const book = async () => setBooked(await api('/lodging/bookings', { method: 'POST', key, body: {
    room_id: room.id, check_in: checkIn, check_out: checkOut, guests, name: who.name, email: who.email, phone: who.phone,
    requests: who.requests, expected_total_cents: quote?.json?.quote?.total_cents } }));
  const q = quote?.json?.quote;
  return (
    <Layout title="Rooms">
      <h1>Rooms</h1>
      <div className="card row">
        <label className="field">Check in<input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></label>
        <label className="field">Check out<input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></label>
        <label className="field">Guests<input type="number" min={1} max={8} value={guests} onChange={(e) => setGuests(Number(e.target.value))} style={{ width: 70 }} /></label>
        <button onClick={load}>Show rooms</button>
      </div>
      <div className="slots">
        {(list?.json?.rooms || []).map((r) => <button key={r.id} className={room?.id === r.id ? 'on' : ''} onClick={() => choose(r)}>{r.name}{r.max_guests ? ' - sleeps ' + r.max_guests : ''}</button>)}
      </div>
      {q ? (
        <div className="card">
          <p className="ui" style={{ marginTop: 0 }}>{room.name}, {q.nights} nights - <b>{money(q.total_cents)}</b>{q.payment?.mode === 'deposit' ? ' (the club takes a deposit - card only)' : ''}</p>
          <div className="row">
            <label className="field">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
            <label className="field">Email<input value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
            <label className="field">Requests<input value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} /></label>
            <button onClick={book} disabled={!who.name || !who.email}>Book - pay at the club</button>
          </div>
          {who.name && who.email ? <CardPayment start={{ type: 'lodging', room_id: room.id, check_in: checkIn, check_out: checkOut, guests, name: who.name, email: who.email, phone: who.phone, requests: who.requests }} /> : null}
        </div>
      ) : null}
      <Result result={booked} title="POST /lodging/bookings" />
      <Result result={quote} title="POST /lodging/quote" />
      <Result result={list} title="GET /lodging" />
    </Layout>
  );
}
