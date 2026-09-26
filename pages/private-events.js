// pages/private-events.js
// GET /private-events -> POST /private-events/enquiries. An enquiry is a
// request; the club replies with a quote.
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Success from '../components/Success';
import { api, newKey, todayPlus } from '../lib/verdeClient';

const LABEL = { wedding: 'Wedding', corporate: 'Corporate', banquet: 'Banquet', celebration: 'Celebration', golf_outing: 'Golf outing', meeting: 'Meeting', other: 'Something else' };

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
    <Layout title="Private Events" eyebrow="Weddings · Outings · Meetings" intro="Tell us what you have in mind. Our events team replies with dates, spaces and a quote.">
      <div className="wrap" style={{ padding: '36px 24px 72px', maxWidth: 820 }}>
        {sent?.ok ? (
          <Success title="Thank you - we'll be in touch">Our events team will reply within a day or two with dates and a quote.</Success>
        ) : (
          <div className="panel">
            <h2>Plan your event</h2>
            <p className="sub">{e ? (e.enabled ? 'We welcome enquiries' : 'We aren\u2019t taking enquiries online right now') + (e.min_guests ? ' for ' + e.min_guests + ' guests or more' : '') + (e.min_notice_days ? ', with ' + e.min_notice_days + ' days\u2019 notice' : '') + '.' : ''}</p>
            <div className="fields">
              <label className="field grow">Name<input value={f.name} onChange={set('name')} /></label>
              <label className="field grow">Email<input type="email" value={f.email} onChange={set('email')} /></label>
              <label className="field grow">Phone<input value={f.phone} onChange={set('phone')} /></label>
              <label className="field">Occasion<select value={f.occasion} onChange={set('occasion')}>{(e?.occasions || Object.keys(LABEL)).map((o) => <option key={o} value={o}>{LABEL[o] || o}</option>)}</select></label>
              <label className="field">Guests<input type="number" value={f.guests} onChange={set('guests')} style={{ width: 100 }} /></label>
              <label className="field">Preferred date<input type="date" value={f.preferred_date} onChange={set('preferred_date')} /></label>
              <label className="field" style={{ flex: '1 1 100%' }}>Tell us about it<textarea rows={4} value={f.message} onChange={set('message')} placeholder="Ceremony on the 18th green, dinner for 120..." /></label>
            </div>
            <Notice result={sent} kind="bad" />
            <button className="btn" style={{ marginTop: 16 }} onClick={send} disabled={!f.name || (!f.email && !f.phone)}>Send enquiry</button>
          </div>
        )}
        <Result result={sent} title="POST /private-events/enquiries" />
        <Result result={info} title="GET /private-events" />
      </div>
    </Layout>
  );
}
