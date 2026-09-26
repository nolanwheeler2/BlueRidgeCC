// pages/api/auth/start.js
// ============================================
// Sign in with Verde, step 1: send the member to Verde.
// GET /api/auth/start?return=/simulators
//
// The client id comes from Verde itself (GET /members/client, with this
// site's secret key) - VERDE_CLIENT_ID is only an override. Before anyone is
// sent to sign in, this checks the club has registered this site's return
// address, and if not, says exactly which address to add (commit 009): a
// missing setting shows a setup page, not a dead end.
//
// A random `state` goes in a short-lived httpOnly cookie and in the link;
// the callback only accepts a code that comes back with the same state, so
// nobody can finish a sign-in they didn't start (login CSRF).
// ============================================
import crypto from 'crypto';
import { verde, verdeOrigin } from '../../../lib/verdeServer';
import { cookie } from '../../../lib/cookies';
import { returnAddress } from '../../../lib/siteUrl';

let cached = null; // { at, info } - Verde's answer, kept for a minute per server instance

async function clientInfo() {
  if (cached && Date.now() - cached.at < 60_000) return cached.info;
  const out = await verde('/members/client');
  const info = out.status === 200 ? out.json : { error: out.json?.error || { message: 'Verde answered HTTP ' + out.status } };
  if (out.status === 200) cached = { at: Date.now(), info };
  return info;
}

function setupPage(res, title, body) {
  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{margin:0;background:#faf6ef;font-family:Inter,system-ui,sans-serif;color:#1f2a33;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}
.c{max-width:560px;background:#fffdf9;border:1px solid #e4ddd0;border-radius:14px;padding:28px}h1{font-family:Georgia,serif;color:#1d3450;font-weight:500;margin:0 0 10px}
p,li{line-height:1.6;color:#4a5763}code{background:#efe6d6;padding:2px 6px;border-radius:6px;font-size:13.5px;word-break:break-all}a{color:#2b4a6f}</style></head>
<body><div class="c"><h1>${title}</h1>${body}<p><a href="/">Back to the site</a></p></div></body></html>`);
}

export default async function handler(req, res) {
  const back = typeof req.query.return === 'string' && req.query.return.startsWith('/') && !req.query.return.startsWith('//') ? req.query.return : '/';
  const redirectUri = returnAddress(req);

  let clientId = (process.env.VERDE_CLIENT_ID || '').trim();
  if (!clientId) {
    const info = await clientInfo();
    if (info.error) {
      return setupPage(res, 'Member sign-in isn&rsquo;t available yet',
        `<p>This site couldn&rsquo;t get its sign-in settings from Verde: <b>${String(info.error.message || info.error.code || 'unknown error').replace(/</g, '&lt;')}</b>.</p>
         <p>Check <code>VERDE_API_KEY</code> and <code>VERDE_API_BASE</code> in this site&rsquo;s settings, and that Verde has the Sign in with Verde update.</p>`);
    }
    if (!(info.return_urls || []).includes(redirectUri)) {
      return setupPage(res, 'One step left to turn on member sign-in',
        `<p>In Verde, open <b>Website &rarr; Booking on your own website &rarr; For developers: the Booking API</b>, press <b>Member sign-in</b> on this site&rsquo;s key, and add this return address exactly:</p>
         <p><code>${redirectUri}</code></p>
         <p>Then come back and sign in - there&rsquo;s nothing to change on this site.</p>`);
    }
    clientId = info.client_id;
  }

  const state = crypto.randomBytes(24).toString('base64url');
  res.setHeader('Set-Cookie', [cookie('br_state', state, { maxAge: 600 }), cookie('br_return', back, { maxAge: 600 })]);
  const url = new URL(verdeOrigin() + '/connect');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  res.redirect(302, url.toString());
}
