// pages/webhooks.js
// ============================================
// Webhooks from Verde, for developers (rebuilt in commit 025).
//
// Every event Verde sends to this site - a booking made, paid for or
// canceled, however it was made - newest first, refreshed every 5 seconds,
// in the developer console's style: the event type, when it arrived (the
// club's time, commit 015), whether its signature verified, and the event
// itself as highlighted JSON. The same feed as the console's Webhooks tab
// (components/DevConsole), on a page of its own.
//
// Set it up in Verde: Website -> Booking on your own website -> For
// developers: webhooks -> add https://<this site>/api/webhooks/verde, put the
// signing secret in VERDE_WEBHOOK_SECRET, redeploy, then press Send a test.
// This site keeps the last 50 in memory; Vercel's function logs keep all.
// ============================================

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Json } from '../components/DevConsole';
import { useClub } from '../components/Club';
import { fmtDateTime } from '../lib/clubTime';

function Copy({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn ghost small" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* ignore */ }
    }}>{done ? 'Copied' : 'Copy'}</button>
  );
}

export default function Webhooks() {
  const { tz } = useClub();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(0);
  useEffect(() => {
    let live = true;
    const tick = async () => {
      const r = await fetch('/api/webhooks/recent').then((x) => x.json()).catch(() => null);
      if (live && r) setList(r.deliveries || []);
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);
  /* Set after the page loads, not while rendering: the server doesn't know
     this site's address, and rendering it differently in the browser made
     React throw a hydration error (commit 005). */
  const [origin, setOrigin] = useState('https://your-site');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const url = origin + '/api/webhooks/verde';
  const verified = (list || []).filter((d) => d.verified).length;

  return (
    <Layout title="Webhooks" eyebrow="Developer" intro="Every event Verde sends to this site: bookings made, paid for or canceled, however they were made.">
      <div className="wrap events-page">
        <section className="ev-month">
          <h2>Set Up</h2>
          <ol className="setup-steps">
            <li>
              <b>Add This Address in Verde</b>
              <span>Website, then Booking on Your Own Website, then For Developers: Webhooks.</span>
              <div className="setup-url"><code>{url}</code><Copy text={url} /></div>
            </li>
            <li><b>Save the Signing Secret</b><span>Put it in this site&rsquo;s <code>VERDE_WEBHOOK_SECRET</code> environment variable, then redeploy.</span></li>
            <li><b>Send a Test</b><span>Press Send a Test in Verde. It appears below within five seconds.</span></li>
          </ol>
        </section>

        <section className="ev-month">
          <div className="wh-head">
            <h2>Deliveries</h2>
            <span>{list ? list.length + (list.length === 1 ? ' event' : ' events') + (list.length ? ' · ' + verified + ' verified' : '') + ' · refreshes every 5 seconds' : 'Loading\u2026'}</span>
          </div>
          <div className="dc-panel">
            {list && !list.length ? (
              <p className="dc-empty">Nothing received yet. Add the address above in Verde and press Send a Test.</p>
            ) : (list || []).map((d, i) => (
              <div key={i} className={'dc-hook' + (open === i ? ' open' : '')}>
                <button className="dc-hook-row" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  <span className="dc-cells wh-cells">
                    <span className="dc-m post">{d.type}</span>
                    <span className="dc-t" style={{ textAlign: 'left' }}>{fmtDateTime(d.at, tz, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>
                    <span className={'dc-s ' + (d.verified ? 'ok' : 'err')}>{d.verified ? 'Signature verified' : 'Signature refused'}</span>
                  </span>
                </button>
                {open === i && d.event ? <div className="wh-body"><Json value={d.event} /></div> : null}
              </div>
            ))}
          </div>
          <p className="fine" style={{ marginTop: 14 }}>This site keeps the last 50 deliveries in memory. Vercel&rsquo;s function logs keep every one. Times are the club&rsquo;s.</p>
        </section>
      </div>
    </Layout>
  );
}
