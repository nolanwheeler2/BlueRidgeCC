// components/DevConsole.js
// ============================================
// THE DEVELOPER CONSOLE (commit 008)
//
// Every call this site makes to Verde's Booking API, live - captured from
// lib/verdeClient as it happens, from the moment the page loads, so turning
// Developer view on mid-demo still shows what the page already did - and
// every webhook Verde has delivered to this site.
//
//   Requests   method, path, status, time taken; open one for what was sent,
//              what came back (highlighted JSON), the idempotency key, and
//              copy-as-curl against Verde's API with the key left out
//   Webhooks   deliveries to /api/webhooks/verde, newest first, with whether
//              the signature verified
//
// A launcher sits in the corner while Developer view is on; ` (backtick)
// opens and closes the console, Esc closes it.
// ============================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDevMode } from './DevMode';

const API_BASE = (process.env.NEXT_PUBLIC_VERDE_API_BASE || 'https://www.imverde.com/api/public/v1').replace(/\/+$/, '');

function statusTone(s) {
  if (!s) return 'err';
  if (s >= 500) return 'err';
  if (s >= 400) return 'warn';
  return 'ok';
}

/* JSON, highlighted without a library: keys, strings, numbers, literals. */
function Json({ value }) {
  const html = useMemo(() => {
    const text = JSON.stringify(value, null, 2) ?? 'null';
    const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc.replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (m) => {
      let cls = 'n';
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'k' : 's';
      else if (/true|false/.test(m)) cls = 'b';
      else if (/null/.test(m)) cls = 'l';
      return '<span class="j' + cls + '">' + m + '</span>';
    });
  }, [value]);
  return <pre className="dc-json" dangerouslySetInnerHTML={{ __html: html }} />;
}

function curlFor(e) {
  const lines = ['curl -X ' + e.method + " '" + API_BASE + e.path + "'", "  -H 'Authorization: Bearer $VERDE_API_KEY'"];
  if (e.idempotencyKey) lines.push("  -H 'Idempotency-Key: " + e.idempotencyKey + "'");
  if (e.request) {
    lines.push("  -H 'Content-Type: application/json'");
    lines.push("  -d '" + JSON.stringify(e.request).replace(/'/g, "'\\''") + "'");
  }
  return lines.join(' \\\n');
}

function Copy({ text, label }) {
  const [done, setDone] = useState(false);
  return (
    <button className="dc-btn" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* ignore */ }
    }}>{done ? 'Copied' : label}</button>
  );
}

export default function DevConsole() {
  const { dev, setDev } = useDevMode();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('requests');
  const [calls, setCalls] = useState([]);
  const [picked, setPicked] = useState(null);
  const [hooks, setHooks] = useState([]);
  const listRef = useRef(null);

  /* Always listening, so the history is there the moment it's opened. */
  useEffect(() => {
    const on = (ev) => setCalls((list) => [ev.detail, ...list].slice(0, 200));
    window.addEventListener('verde:api', on);
    return () => window.removeEventListener('verde:api', on);
  }, []);

  useEffect(() => {
    if (!dev) return undefined;
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '`' && !typing) { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dev]);

  useEffect(() => {
    if (!dev || !open || tab !== 'webhooks') return undefined;
    let live = true;
    const tick = async () => {
      const r = await fetch('/api/webhooks/recent').then((x) => x.json()).catch(() => null);
      if (live && r) setHooks(r.deliveries || []);
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => { live = false; clearInterval(t); };
  }, [dev, open, tab]);

  if (!dev) return null;
  const sel = calls.find((c) => c.id === picked) || null;
  const last = calls[0];

  return (
    <>
      <button className={'dc-launch ' + (open ? 'is-open' : '')} onClick={() => setOpen((o) => !o)} aria-label="Developer console">
        <span className={'dc-dot ' + (last ? statusTone(last.status) : 'idle')} />
        <span>API</span>
        <b>{calls.length}</b>
        <kbd>`</kbd>
      </button>

      <aside className={'dc ' + (open ? 'open' : '')} aria-hidden={!open}>
        <header className="dc-head">
          <div className="dc-title">
            <b>Developer Console</b>
            <span>Verde Booking API &middot; {API_BASE.replace(/^https?:\/\//, '')}</span>
          </div>
          <div className="dc-actions">
            <button className="dc-btn" onClick={() => { setCalls([]); setPicked(null); }}>Clear</button>
            <button className="dc-btn" onClick={() => setDev(false)}>Turn Off</button>
            <button className="dc-x" onClick={() => setOpen(false)} aria-label="Close">&times;</button>
          </div>
        </header>
        <nav className="dc-tabs">
          <button className={tab === 'requests' ? 'on' : ''} onClick={() => setTab('requests')}>Requests <i>{calls.length}</i></button>
          <button className={tab === 'webhooks' ? 'on' : ''} onClick={() => setTab('webhooks')}>Webhooks <i>{hooks.length}</i></button>
        </nav>

        {tab === 'requests' ? (
          <div className={'dc-body' + (sel ? ' dc-split' : '')}>
            <div className="dc-list" ref={listRef}>
              {!calls.length ? <p className="dc-empty">Calls to Verde appear here as the site makes them. Load a booking page or pick a date.</p> : calls.map((c) => (
                <button key={c.id} className={'dc-row' + (c.id === picked ? ' on' : '')} onClick={() => setPicked(c.id === picked ? null : c.id)}>
                  {/* A button centers its contents in its own box, so the grid
                      is on this span, which fills the row. */}
                  <span className="dc-cells">
                    <span className={'dc-m ' + c.method.toLowerCase()}>{c.method}</span>
                    <span className="dc-p">{c.path}</span>
                    <span className={'dc-s ' + statusTone(c.status)}>{c.status || 'ERR'}</span>
                    <span className="dc-t">{c.ms} ms</span>
                  </span>
                </button>
              ))}
            </div>
            {sel ? (
              <div className="dc-detail">
                <dl className="dc-meta">
                  <dt>Request</dt><dd><code>{sel.method} {sel.path}</code></dd>
                  <dt>Status</dt><dd className={statusTone(sel.status)}>{sel.status || 'No response'}{sel.replayed ? ' · replayed (idempotent)' : ''}</dd>
                  <dt>Time</dt><dd>{sel.ms} ms &middot; {new Date(sel.at).toLocaleTimeString('en-US')}</dd>
                  {sel.idempotencyKey ? <><dt>Idempotency key</dt><dd><code>{sel.idempotencyKey}</code></dd></> : null}
                  {sel.response?.error ? <><dt>Error</dt><dd className="err"><code>{sel.response.error.code}</code> {sel.response.error.message}</dd></> : null}
                </dl>
                <div className="dc-tools">
                  <Copy text={curlFor(sel)} label="Copy as cURL" />
                  <Copy text={JSON.stringify(sel.response, null, 2)} label="Copy Response" />
                </div>
                {sel.request ? <><h4>Sent</h4><Json value={sel.request} /></> : null}
                <h4>Received</h4>
                <Json value={sel.response} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="dc-body">
            <div className="dc-list">
              {!hooks.length ? (
                <p className="dc-empty">No webhooks yet. In Verde, add <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/verde</code> under Booking on your own website &rarr; webhooks, then press Send a test.</p>
              ) : hooks.map((d, i) => (
                <details key={i} className="dc-hook" open={i === 0}>
                  <summary>
                    <span className="dc-m post">{d.type}</span>
                    <span className="dc-p">{new Date(d.at).toLocaleTimeString('en-US')}</span>
                    <span className={'dc-s ' + (d.verified ? 'ok' : 'err')}>{d.verified ? 'Signed' : 'Refused'}</span>
                  </summary>
                  {d.event ? <Json value={d.event} /> : null}
                </details>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
