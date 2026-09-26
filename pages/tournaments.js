// pages/tournaments.js
// GET /tournaments -> POST /tournaments/{id}/entries (free events whose club
// lets guests sign up; others link to the club's own sign-up page).
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import { api, money, newKey } from '../lib/verdeClient';

export default function Tournaments() {
  const [list, setList] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [entry, setEntry] = useState(null);
  useEffect(() => { api('/tournaments').then(setList); }, []);
  const enter = async (t) => setEntry(await api('/tournaments/' + t.id + '/entries', { method: 'POST', key: newKey(), body: who }));
  return (
    <Layout title="Tournaments">
      <h1>Tournaments</h1>
      <div className="card row">
        <label className="field">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></label>
        <label className="field">Email<input value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} /></label>
        <label className="field">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></label>
      </div>
      <table className="card">
        <thead><tr><th>Event</th><th>When</th><th>Fee</th><th>Spots</th><th /></tr></thead>
        <tbody>
          {(list?.json?.tournaments || []).map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.starts_at ? new Date(t.starts_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</td>
              <td>{t.entry_fee_cents ? money(t.entry_fee_cents) : 'Free'}</td>
              <td>{t.spots_left ?? '-'}</td>
              <td>{t.guests_can_enter
                ? <button disabled={!who.name || !who.email} onClick={() => enter(t)}>Enter</button>
                : t.url ? <a href={t.url} target="_blank" rel="noreferrer">Sign up at the club</a> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Result result={entry} title="POST /tournaments/{id}/entries" />
      <Result result={list} title="GET /tournaments" />
    </Layout>
  );
}
