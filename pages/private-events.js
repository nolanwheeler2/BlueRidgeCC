// pages/private-events.js
// GET /private-events -> POST /private-events/enquiries. An enquiry is a
// request; the club replies with a quote.
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Success from '../components/Success';
import Scene from '../components/Scene';
import { useMember } from '../components/Member';
import { api, newKey } from '../lib/verdeClient';
import DatePicker from '../components/DatePicker';
import { useClub } from '../components/Club';
import { addDays, clubToday } from '../lib/clubTime';

const LABEL = { wedding: 'Wedding', corporate: 'Corporate', banquet: 'Banquet', celebration: 'Celebration', golf_outing: 'Golf outing', meeting: 'Meeting', other: 'Something else' };
const SPACES = [
  ['The Eighteenth Green', 'Ceremonies at sunset with the ridge behind you.', 'Up to 200 seated'],
  ['The Ridge Room', 'Dinners and receptions with a dance floor and terrace.', 'Up to 160'],
  ['The Library', 'Board meetings and rehearsal dinners, quietly.', 'Up to 24'],
];

export default function PrivateEvents() {
  const [info, setInfo] = useState(null);
  const { tz, ready } = useClub();
  const [f, setF] = useState({ name: '', email: '', phone: '', occasion: 'wedding', guests: 100, preferred_date: '', message: '' });
  /* Six months out at the club, once its zone is known (commit 015). */
  useEffect(() => { if (ready) setF((x) => (x.preferred_date ? x : { ...x, preferred_date: addDays(clubToday(tz), 180) })); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sent, setSent] = useState(null);
  const [key] = useState(newKey());
  const { member } = useMember();
  useEffect(() => { if (member) setF((x) => ({ ...x, name: x.name || member.name || '', email: x.email || member.email || '', phone: x.phone || member.phone || '' })); }, [member]);
  useEffect(() => { api('/private-events').then(setInfo); }, []);
  const e = info?.json?.enquiries;
  const send = async () => setSent(await api('/private-events/enquiries', { method: 'POST', key, body: { ...f, guests: Number(f.guests) } }));
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  return (
    <Layout title="Private Events" eyebrow="Weddings · Outings · Meetings" intro="Tell us what you have in mind. Our events team replies with dates, spaces and a quote.">
      <div className="wrap" style={{ padding: '36px 24px 72px' }}>
        <div className="evgrid" style={{ marginBottom: 22 }}>
          {SPACES.map(([name, sub, cap]) => (
            <div className="ev" key={name}>
              <div className="top"><Scene kind="venue" height={120} /></div>
              <div className="body"><h3>{name}</h3><div className="meta">{sub}</div><div className="tags"><span className="tag">{cap}</span></div></div>
            </div>
          ))}
        </div>
        <div className="booking" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div>
            {sent?.ok ? (
              <Success title="Thank you - we'll be in touch">Our events team will reply with dates, spaces and a quote.</Success>
            ) : (
              <div className="panel">
                <h2>Plan your event</h2>
                <p className="sub">{e ? (e.enabled ? 'We welcome enquiries' : 'We aren\u2019t taking enquiries online right now') + (e.min_guests ? ' for ' + e.min_guests + ' guests or more' : '') + (e.min_notice_days ? ', with ' + e.min_notice_days + ' days\u2019 notice' : '') + '.' : 'Tell us about your day.'}</p>
                <div className="fields">
                  <label className="field grow">Name<input value={f.name} onChange={set('name')} autoComplete="name" /></label>
                  <label className="field grow">Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
                  <label className="field grow">Phone<input value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
                  <label className="field">Occasion<select value={f.occasion} onChange={set('occasion')}>{(e?.occasions || Object.keys(LABEL)).map((o) => <option key={o} value={o}>{LABEL[o] || o}</option>)}</select></label>
                  <label className="field">Guests<input type="number" value={f.guests} onChange={set('guests')} style={{ width: 110 }} /></label>
                  <DatePicker label="Preferred date" id="preferred" value={f.preferred_date} min={clubToday(tz)} onChange={(d) => setF((x) => ({ ...x, preferred_date: d }))} />
                  <label className="field" style={{ flex: '1 1 100%' }}>Tell us about it<textarea rows={4} value={f.message} onChange={set('message')} placeholder="Ceremony on the eighteenth green, dinner for 120, a band until eleven..." /></label>
                </div>
                <Notice result={sent} kind="bad" />
                <button className="btn" style={{ marginTop: 16 }} onClick={send} disabled={!f.name || (!f.email && !f.phone)}>Send enquiry</button>
              </div>
            )}
            <Result result={sent} title="POST /private-events/enquiries" />
            <Result result={info} title="GET /private-events" />
          </div>
          <aside className="summary">
            <div className="summary-art"><Scene kind="venue" height={110} /></div>
            <div className="summary-body">
              <h3>How it works</h3>
              <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                <li>Send us the basics - no commitment.</li>
                <li>Our events team replies with open dates and spaces.</li>
                <li>You get a written quote to review.</li>
                <li>A deposit holds your date.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
