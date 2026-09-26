// pages/tournaments.js
// GET /tournaments -> POST /tournaments/{id}/entries (free events whose club
// lets guests sign up; others link to the club's own sign-up page).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import { api, money, newKey } from '../lib/verdeClient';

export default function Tournaments() {
  const [list, setList] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [entry, setEntry] = useState(null);
  const [entered, setEntered] = useState({});
  useEffect(() => { api('/tournaments').then(setList); }, []);
  const enter = async (t) => {
    const r = await api('/tournaments/' + t.id + '/entries', { method: 'POST', key: newKey(), body: who });
    setEntry(r);
    if (r.ok) setEntered((e) => ({ ...e, [t.id]: r.json.entry.status }));
  };
  const events = list?.json?.tournaments || [];
  return (
    <Layout title="Events" eyebrow="Tournaments & outings" intro="Scrambles, member-guests and the season finale. Enter online where the club takes guest entries.">
      <div className="wrap" style={{ padding: '36px 24px 72px' }}>
        <div className="panel">
          <h2>Your details</h2>
          <p className="sub">Used for any event you enter below.</p>
          <div className="fields">
            <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
            <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
            <label className="field grow">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></label>
          </div>
          <Notice result={entry} kind="bad" />
        </div>
        <div className="events">
          {events.map((t) => {
            const d = t.starts_at ? new Date(t.starts_at) : null;
            return (
              <div className="event" key={t.id}>
                <div className="date"><b>{d ? d.getDate() : '-'}</b><small>{d ? d.toLocaleDateString('en-US', { month: 'short' }) : ''}</small></div>
                <div className="what">
                  <b>{t.title}</b>
                  <span>{d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' · ' : ''}{t.entry_fee_cents ? money(t.entry_fee_cents) + ' entry' : 'Free'}{t.spots_left != null ? ' · ' + t.spots_left + ' spots left' : ''}</span>
                </div>
                {entered[t.id] ? <span className="notice info" style={{ margin: 0 }}>{entered[t.id] === 'waitlist' ? 'On the waitlist' : 'You\u2019re in'}</span>
                  : t.guests_can_enter ? <button className="btn small" disabled={!who.name || !who.email} onClick={() => enter(t)}>Enter</button>
                  : t.url ? <a className="btn small ghost" href={t.url} target="_blank" rel="noreferrer">Sign up</a> : null}
              </div>
            );
          })}
          {list && !events.length ? <p className="empty">No events posted yet - check back soon.</p> : null}
        </div>
        <Result result={entry} title="POST /tournaments/{id}/entries" />
        <Result result={list} title="GET /tournaments" />
      </div>
    </Layout>
  );
}
