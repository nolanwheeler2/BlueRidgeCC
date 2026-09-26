// pages/tournaments.js
// GET /tournaments -> POST /tournaments/{id}/entries (free events whose club
// lets guests sign up; others link to the club's own sign-up page).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import EventCard from '../components/EventCard';
import { api, newKey } from '../lib/verdeClient';

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
  const ready = who.name && who.email;
  return (
    <Layout title="Events" eyebrow="Tournaments & outings" intro="Scrambles, the member-guest and the season finale. Enter online where the club takes guest entries.">
      <div className="wrap" style={{ padding: '36px 24px 72px' }}>
        <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 4 }}>
          <h2>Entering as</h2>
          <p className="sub">Fill this in once - it&rsquo;s used for any event you enter below.</p>
          <div className="fields">
            <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} autoComplete="name" /></label>
            <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} autoComplete="email" /></label>
            <label className="field grow">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} autoComplete="tel" /></label>
          </div>
          <Notice result={entry} kind="bad" />
        </div>
        <div className="evgrid" style={{ marginTop: 8 }}>
          {events.map((t) => (
            <EventCard key={t.id} t={t} action={
              entered[t.id] ? <span className="tag good">{entered[t.id] === 'waitlist' ? 'On the waitlist' : 'You\u2019re in'}</span>
              : t.guests_can_enter ? <button className="btn small" disabled={!ready} onClick={() => enter(t)} title={ready ? '' : 'Add your name and email above'}>Enter</button>
              : t.url ? <a className="btn small ghost" href={t.url} target="_blank" rel="noreferrer">Sign up at the club</a>
              : <span className="tag">Members only</span>
            } />
          ))}
        </div>
        {list && !events.length && !list.json?.error ? <div className="panel"><p className="empty">No events posted yet - check back soon.</p></div> : null}
        <Notice result={list} />
        <Result result={entry} title="POST /tournaments/{id}/entries" />
        <Result result={list} title="GET /tournaments" />
      </div>
    </Layout>
  );
}
