// pages/api/auth/me.js
// Who's signed in on this site: GET /members/me with the member's token, or
// { member: null }. The page never sees the token itself.
import { verde } from '../../../lib/verdeServer';
import { readCookie, cookie, MEMBER_COOKIE } from '../../../lib/cookies';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const token = readCookie(req, MEMBER_COOKIE);
  if (!token) return res.status(200).json({ member: null, charge_accounts: [] });
  const out = await verde('/members/me', { memberToken: token });
  if (out.status !== 200) {
    if (out.status === 401) res.setHeader('Set-Cookie', cookie(MEMBER_COOKIE, '', { maxAge: 0 }));
    return res.status(200).json({ member: null, charge_accounts: [], error: out.json?.error || null });
  }
  return res.status(200).json(out.json);
}
