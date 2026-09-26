// pages/webhooks.js
// Deliveries from Verde, newest first. Set it up in Verde: Website -> Booking
// on your own website -> For developers: webhooks -> add
// https://<this site>/api/webhooks/verde, copy the signing secret into
// VERDE_WEBHOOK_SECRET, redeploy, then press "Send a test".
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

export default function Webhooks() {
  const [list, setList] = useState([]);
  useEffect(() => {
    let live = true;
    const tick = async () => { const r = await fetch('/api/webhooks/recent').then((x) => x.json()).catch(() => null); if (live && r) setList(r.deliveries || []); };
    tick(); const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://<this site>';
  return (
    <Layout title="Webhooks">
      <h1>Webhooks</h1>
      <p>In Verde, add <code>{origin}/api/webhooks/verde</code> under <b>For developers: webhooks</b>, put the signing secret in this site&rsquo;s <code>VERDE_WEBHOOK_SECRET</code>, redeploy, and press <b>Send a test</b>. Make a booking on any page here and its event arrives below. This page refreshes every 5 seconds.</p>
      <p className="note">Kept in this server&rsquo;s memory, so a restart empties it - Vercel&rsquo;s function logs keep every delivery.</p>
      {!list.length ? <div className="card note">Nothing received yet.</div> : list.map((d, i) => (
        <div className="card" key={i}>
          <div className="ui" style={{ fontSize: 14 }}>
            <b>{d.type}</b> - {new Date(d.at).toLocaleTimeString('en-US')} - {d.verified ? <span className="ok">signature verified</span> : <span className="bad">signature REFUSED</span>}
          </div>
          {d.event ? <pre>{JSON.stringify(d.event, null, 2)}</pre> : null}
        </div>
      ))}
    </Layout>
  );
}
