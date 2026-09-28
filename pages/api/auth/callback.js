// pages/api/auth/callback.js
// ============================================
// Sign in with Verde, steps 3-4: Verde sends the member back here with
// ?code=vmc_...&state=... ; the state must match the cookie from
// /api/auth/start, and the code is swapped - server to server, with the
// secret key - for a member token, kept in an httpOnly cookie for 30 days.
// Register this address in Verde: https://<this site>/api/auth/callback
// ============================================
import { verde } from '../../../lib/verdeServer';
import { cookie, readCookie, MEMBER_COOKIE } from '../../../lib/cookies';
import { returnAddress } from '../../../lib/siteUrl';

export default async function handler(req, res) {
  const back = readCookie(req, 'br_return') || '/';
  const clear = [cookie('br_state', '', { maxAge: 0 }), cookie('br_return', '', { maxAge: 0 })];
  const go = (path, extra = []) => { res.setHeader('Set-Cookie', [...clear, ...extra]); res.redirect(302, path); };
  const sep = back.includes('?') ? '&' : '?';

  const state = readCookie(req, 'br_state');
  if (!state || req.query.state !== state) return go(back + sep + 'signin=expired');
  if (req.query.error) return go(back + sep + 'signin=canceled');

  const out = await verde('/members/token', { method: 'POST', body: { code: String(req.query.code || ''), redirect_uri: returnAddress(req) } });
  if (out.status !== 200 || !out.json?.member_token) {
    console.warn('[sign-in] token swap failed', out.status, out.json?.error);
    return go(back + sep + 'signin=failed');
  }
  const maxAge = Math.max(60, Math.floor((Date.parse(out.json.expires_at) - Date.now()) / 1000));
  return go(back, [cookie(MEMBER_COOKIE, out.json.member_token, { maxAge })]);
}
