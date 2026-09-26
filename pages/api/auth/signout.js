// pages/api/auth/signout.js
// POST /api/auth/signout - ends the member's token on Verde, then forgets it here.
import { verde } from '../../../lib/verdeServer';
import { readCookie, cookie, MEMBER_COOKIE } from '../../../lib/cookies';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const token = readCookie(req, MEMBER_COOKIE);
  if (token) await verde('/members/sign-out', { method: 'POST', body: { member_token: token } }).catch(() => null);
  res.setHeader('Set-Cookie', cookie(MEMBER_COOKIE, '', { maxAge: 0 }));
  return res.status(200).json({ ok: true });
}
