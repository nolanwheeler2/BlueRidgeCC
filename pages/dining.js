// pages/dining.js
// GET /dining -> GET /dining/availability -> POST /dining/reservations.
// A reservation can come back "confirmed" or "waitlist" (the club confirms it).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import { api, newKey, todayPlus } from '../lib/verdeClient';

export default function Dining() {
  const [areas, setAreas] = useState(null);
  const [area, setArea] = useState('');
  const [date, setDate] = useState(todayPlus(1));
  const [party, setParty] = useState(2);
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '', occasion: '', requests: '' });
  const [made, setMade] = useState(null);
  const [key] = useState(newKey());

  useEffect(() => { api('/dining').then((r) => { setAreas(r); if (r.json?.areas?.[0]) setArea(r.json.areas[0].id); }); }, []);
  const load = async () => { setTime(null); setMade(null); setSlots(await api('/dining/availability?area_id=' + area + '&date=' + date + '&party_size=' + party)); };
  const reserve = async () => setMade(await api('/dining/reservations', { method: 'POST', key, body: { area_id: area, date, time, party_size: party, ...who } }));
  return (
    <Layout title="Dining">
      <h1>Dining</h1>
      <div className="card row">
        <label className="field">Where<select value={area} onChange={(e) => setArea(e.target.value)}>{(areas?.json?.areas || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field">Party<input type="number" min={1} max={20} value={party} onChange={(e) => setParty(Number(e.target.value))} style={{ width: 70 }} /></label>
        <button onClick={load} disabled={!area}>Show times</button>
      </div>
      <div className="slots">
        {(slots?.json?.slots || []).map((s) => (
          <button key={s.time} disabled={s.status === 'full'} className={time === s.time ? 'on' : ''} onClick={() => setTime(s.time)}>
            {s.time}{s.status === 'limited' ? ' (few left)' : s.status === 'full' ? ' (full)' : ''}
          </button>
        ))}
      </div>
      {time ? (
        <div className="card row">
          <label className="field">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
          <label className="field">Email<input value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
          <label className="field">Occasion<input value={who.occasion} onChange={(e) => setWho({ ...who, occasion: e.target.value })} /></label>
          <label className="field">Requests<input value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} /></label>
          <button onClick={reserve} disabled={!who.name || !who.email}>Reserve {time}</button>
        </div>
      ) : null}
      {made?.json?.reservation ? <p className="ok ui">Reservation {made.json.reservation.status}. Cancel it on <a href="/manage">Manage a booking</a> with id {made.json.reservation.id}.</p> : null}
      <Result result={made} title="POST /dining/reservations" />
      <Result result={slots} title="GET /dining/availability" />
      <Result result={areas} title="GET /dining" />
    </Layout>
  );
}
