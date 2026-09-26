// lib/siteUrl.js
// This site's own address, for the sign-in return address. SITE_URL if set;
// otherwise the address the request came in on (Vercel sets the forwarded
// headers). It must match a return address the club registered in Verde
// exactly, so set SITE_URL if the site has more than one domain.
export function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0];
  return proto + '://' + host;
}
export const returnAddress = (req) => siteUrl(req) + '/api/auth/callback';
