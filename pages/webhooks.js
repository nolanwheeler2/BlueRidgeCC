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
  /* Set after the page loads, not while rendering: the server doesn't know
     this site's address, and rendering it differently in the browser made
     React throw a hydration error (commit 005). */
  const [origin, setOrigin] = useState('https://<this site>');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  return (
    <Layout title="Webhooks" eyebrow="Developer" intro="Events Verde sends to this site - bookings made, paid for or canceled, however they were made.">
      <div className="wrap" style={{ padding: '36px 24px 72px' }}>
        <div className="panel">
          <h2>Set up</h2>
          <p className="sub" style={{ lineHeight: 1.7 }}>In Verde, add <code>{origin}/api/webhooks/verde</code> under <b>For developers: webhooks</b>, put the signing secret in <code>VERDE_WEBHOOK_SECRET</code>, redeploy, and press <b>Send a test</b>. This page refreshes every 5 seconds. It keeps the last 50 in this server&rsquo;s memory; Vercel&rsquo;s function logs keep every one.</p>
        </div>
        {!list.length ? <div className="panel"><p className="empty">Nothing received yet.</p></div> : list.map((d, i) => (
          <details className="devbox" key={i} open={i === 0}>
            <summary>
              <span className="devtag">{d.type}</span>{new Date(d.at).toLocaleTimeString('en-US')}
              <span className="devstatus" style={{ color: d.verified ? 'var(--ok)' : 'var(--bad)' }}>{d.verified ? 'signature verified' : 'signature REFUSED'}</span>
            </summary>
            {d.event ? <pre>{JSON.stringify(d.event, null, 2)}</pre> : null}
          </details>
        ))}
      </div>
    </Layout>
  );
}
