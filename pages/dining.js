// pages/dining.js
// GET /dining -> GET /dining/availability -> POST /dining/reservations.
// A reservation comes back "confirmed" or "waitlist" (the club confirms it).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import Scene from '../components/Scene';
import { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, DateStrip, Segmented, TimeGroups } from '../components/Picker';
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
  const { member } = useMember();
  /* A signed-in member's name and email fill in for them (commit 007). */
  useEffect(() => { if (member) setWho((w) => ({ ...w, name: w.name || member.name || '', email: w.email || member.email || '', phone: w.phone || member.phone || '' })); }, [member]);

  useEffect(() => { api('/dining').then((r) => { setAreas(r); if (r.json?.areas?.[0]) setArea(r.json.areas[0].id); }); }, []);
  useEffect(() => { if (!area) return; setTime(null); setMade(null); setKey(newKey()); api('/dining/availability?area_id=' + area + '&date=' + date + '&party_size=' + party).then(setSlots); }, [area, date, party]);
  const reserve = async () => setMade(await api('/dining/reservations', { method: 'POST', key, body: { area_id: area, date, time, party_size: party, ...who } }));
  const all = areas?.json?.areas || [];
  const a = all.find((x) => x.id === area);
  const res = made?.json?.reservation;
  const times = (slots?.json?.slots || []).map((s) => ({ key: s.time, iso: date + 'T' + s.time + ':00', label: ampm(s.time), sub: s.status === 'limited' ? 'Few left' : s.status === 'full' ? 'Full' : null, disabled: s.status === 'full' }));

  return (
    <Layout title="Dining" eyebrow="The Grill & Terrace" intro="From breakfast before your round to supper on the terrace at last light.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a table', 'Your details', 'Reserved']} at={res ? 2 : time ? 1 : 0} />
          {res ? (
            <Success title={res.status === 'waitlist' ? 'Request received' : 'Your table is booked'}>
              {a?.name}, {ampm(time)} on {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} for {party}. {res.status === 'waitlist' ? 'The club confirms these itself - you\u2019ll hear back shortly.' : 'See you then.'}
            </Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a table</h2>
                <p className="sub">Where would you like to sit?</p>
                <div className="resources" style={{ marginTop: 0, marginBottom: 18 }}>
                  {all.map((x) => (
                    <button key={x.id} className={'resource' + (x.id === area ? ' selected' : '')} style={{ textAlign: 'left', cursor: 'pointer', padding: 0, font: 'inherit' }} onClick={() => setArea(x.id)}>
                      <div className="art"><Scene kind="dining" height={130} /></div>
                      <div className="body">
                        <h3>{x.name}</h3>
                        <div className="tags">
                          <span className="tag">Open {ampm(x.open_time)} - {ampm(x.close_time)}</span>
                          <span className="tag">Up to {x.max_party_size} guests</span>
                          {x.id === area ? <span className="tag good">Selected</span> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {areas && !all.length ? <p className="empty">Online reservations aren&rsquo;t open right now - please call the club.</p> : null}
                <DateStrip value={date} onChange={setDate} />
                <div className="options"><Segmented label="Guests" value={party} onChange={setParty} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8']]} /></div>
                {times.length ? <TimeGroups slots={times} value={time} onPick={(s) => setTime(s.key)} /> : null}
                {slots && !times.length && !slots.json?.error ? <p className="empty" style={{ marginTop: 16 }}>No tables that day - try another.</p> : null}
                {/* Closed (Verde commit 486): why, and until when. */}
                {slots?.json?.closure?.message ? <div className="notice bad" style={{ marginTop: 16 }}>{slots.json.closure.message}</div> : null}
                <Notice result={slots} />
              </div>
              {time ? (
                <div className="panel">
                  <h2><span className="n">2</span>Your details</h2>
                  <p className="sub">The confirmation goes to this email.</p>
                  <div className="fields">
                    <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} autoComplete="name" /></label>
                    <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} autoComplete="email" /></label>
                    <label className="field grow">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} autoComplete="tel" /></label>
                    <label className="field grow">Occasion<input value={who.occasion} onChange={(e) => setWho({ ...who, occasion: e.target.value })} placeholder="Birthday, anniversary..." /></label>
                    <label className="field" style={{ flex: '1 1 100%' }}>Requests<textarea rows={2} value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="A table by the window, a high chair..." /></label>
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
        <Summary title="Your table" scene="dining"
          rows={time ? [['Where', a?.name], ['Date', new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', ampm(time)], ['Guests', party]] : []}
          reassure={false}>
          {time && !res ? <button className="btn" disabled={!who.name || !who.email} onClick={reserve}>Reserve the table</button> : null}
        </Summary>
      </div>
    </Layout>
  );
}
