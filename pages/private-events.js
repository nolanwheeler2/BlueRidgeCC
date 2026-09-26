// pages/private-events.js
// GET /private-events -> POST /private-events/enquiries. An enquiry is a
// request; the club replies with a quote.
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import { api, newKey, todayPlus } from '../lib/verdeClient';

export default function PrivateEvents() {
  const [info, setInfo] = useState(null);
  const [f, setF] = useState({ name: '', email: '', phone: '', occasion: 'wedding', guests: 100, preferred_date: todayPlus(180), message: '' });
  const [sent, setSent] = useState(null);
  const [key] = useState(newKey());
  useEffect(() => { api('/private-events').then(setInfo); }, []);
  const e = info?.json?.enquiries;
  const send = async () => setSent(await api('/private-events/enquiries', { method: 'POST', key, body: { ...f, guests: Number(f.guests) } }));
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  return (
    <Layout title="Private events">
      <h1>Private events</h1>
      {e ? <p>{e.enabled ? 'Taking enquiries' : 'Not taking enquiries'}{e.min_guests ? ' - from ' + e.min_guests + ' guests' : ''}{e.min_notice_days ? ', ' + e.min_notice_days + ' days\u2019 notice' : ''}.</p> : null}
      <div className="card row">
        <label className="field">Name<input value={f.name} onChange={set('name')} /></label>
        <label className="field">Email<input value={f.email} onChange={set('email')} /></label>
        <label className="field">Phone<input value={f.phone} onChange={set('phone')} /></label>
        <label className="field">Occasion<select value={f.occasion} onChange={set('occasion')}>{(e?.occasions || ['wedding', 'corporate', 'banquet', 'celebration', 'golf_outing', 'meeting', 'other']).map((o) => <option key={o}>{o}</option>)}</select></label>
        <label className="field">Guests<input type="number" value={f.guests} onChange={set('guests')} style={{ width: 90 }} /></label>
        <label className="field">Preferred date<input type="date" value={f.preferred_date} onChange={set('preferred_date')} /></label>
        <label className="field" style={{ flex: '1 1 100%' }}>Message<textarea rows={3} value={f.message} onChange={set('message')} /></label>
        <button onClick={send} disabled={!f.name || (!f.email && !f.phone)}>Send enquiry</button>
      </div>
      <Result result={sent} title="POST /private-events/enquiries" />
      <Result result={info} title="GET /private-events" />
    </Layout>
  );
}
