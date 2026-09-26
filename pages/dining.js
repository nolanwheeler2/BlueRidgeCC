// pages/dining.js
// GET /dining -> GET /dining/availability -> POST /dining/reservations.
// A reservation comes back "confirmed" or "waitlist" (the club confirms it).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import { api, newKey, todayPlus } from '../lib/verdeClient';

const ampm = (t) => { const [h, m] = t.split(':').map(Number); return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };

export default function Dining() {
  const [areas, setAreas] = useState(null);
  const [area, setArea] = useState('');
  const [date, setDate] = useState(todayPlus(1));
  const [party, setParty] = useState(2);
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '', occasion: '', requests: '' });
  const [made, setMade] = useState(null);
  const [key, setKey] = useState(newKey());

  useEffect(() => { api('/dining').then((r) => { setAreas(r); if (r.json?.areas?.[0]) setArea(r.json.areas[0].id); }); }, []);
  useEffect(() => { if (!area) return; setTime(null); setMade(null); setKey(newKey()); api('/dining/availability?area_id=' + area + '&date=' + date + '&party_size=' + party).then(setSlots); }, [area, date, party]);
  const reserve = async () => setMade(await api('/dining/reservations', { method: 'POST', key, body: { area_id: area, date, time, party_size: party, ...who } }));
  const areaName = (areas?.json?.areas || []).find((a) => a.id === area)?.name;
  const res = made?.json?.reservation;

  return (
    <Layout title="Dining" eyebrow="The Grill & Terrace" intro="From breakfast before your round to supper on the terrace at last light.">
      <div className="wrap booking">
        <div>
          {res ? (
            <Success title={res.status === 'waitlist' ? 'Request received' : 'Your table is booked'}>
              {areaName}, {ampm(time)} for {party}. {res.status === 'waitlist' ? 'The club confirms these itself - you\u2019ll hear back shortly.' : 'See you then.'}
            </Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a table</h2>
                <div className="fields">
                  <label className="field">Where<select value={area} onChange={(e) => setArea(e.target.value)}>{(areas?.json?.areas || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
                  <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                  <label className="field">Guests<input type="number" min={1} max={20} value={party} onChange={(e) => setParty(Number(e.target.value))} style={{ width: 90 }} /></label>
                </div>
                <div className="group">
                  <div className="pills">
                    {(slots?.json?.slots || []).map((s) => (
                      <button key={s.time} disabled={s.status === 'full'} className={'pill' + (time === s.time ? ' on' : '')} onClick={() => setTime(s.time)}>
                        {ampm(s.time)}{s.status === 'limited' ? <small>Few left</small> : s.status === 'full' ? <small>Full</small> : null}
                      </button>
                    ))}
                  </div>
                  {areas && !(areas.json?.areas || []).length ? <p className="empty">Online reservations aren&rsquo;t open right now - please call the club.</p> : null}
                </div>
                <Notice result={slots} />
              </div>
              {time ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
                  <div className="fields">
                    <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
                    <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
                    <label className="field grow">Occasion<input value={who.occasion} onChange={(e) => setWho({ ...who, occasion: e.target.value })} placeholder="Birthday, anniversary..." /></label>
                    <label className="field grow">Requests<input value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="Terrace if we can" /></label>
                  </div>
                  <Notice result={made} kind="bad" />
                </div>
              ) : null}
            </>
          )}
          <Result result={made} title="POST /dining/reservations" />
          <Result result={slots} title="GET /dining/availability" />
          <Result result={areas} title="GET /dining" />
        </div>
        <Summary title="Your table" rows={time ? [['Where', areaName], ['Date', new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })], ['Time', ampm(time)], ['Guests', party]] : []}>
          {time && !res ? <button className="btn" disabled={!who.name || !who.email} onClick={reserve}>Reserve</button> : null}
        </Summary>
      </div>
    </Layout>
  );
}
