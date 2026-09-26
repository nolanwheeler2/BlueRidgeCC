// pages/api/auth/start.js
// ============================================
// Sign in with Verde, step 1: send the member to Verde.
// GET /api/auth/start?return=/simulators
//
// A random `state` goes in a short-lived httpOnly cookie and in the link;
// the callback only accepts a code that comes back with the same state, so
// nobody can finish a sign-in they didn't start (login CSRF).
// ============================================
import crypto from 'crypto';
import { verdeOrigin } from '../../../lib/verdeServer';
import { cookie } from '../../../lib/cookies';
import { returnAddress } from '../../../lib/siteUrl';

export default function handler(req, res) {
  if (!process.env.VERDE_CLIENT_ID) return res.status(500).send('VERDE_CLIENT_ID is not set on this site - the client id from the key in Verde.');
  const state = crypto.randomBytes(24).toString('base64url');
  const back = typeof req.query.return === 'string' && req.query.return.startsWith('/') && !req.query.return.startsWith('//') ? req.query.return : '/';
  res.setHeader('Set-Cookie', [cookie('br_state', state, { maxAge: 600 }), cookie('br_return', back, { maxAge: 600 })]);
  const url = new URL(verdeOrigin() + '/connect');
  url.searchParams.set('client_id', process.env.VERDE_CLIENT_ID.trim());
  url.searchParams.set('redirect_uri', returnAddress(req));
  url.searchParams.set('state', state);
  res.redirect(302, url.toString());
}
