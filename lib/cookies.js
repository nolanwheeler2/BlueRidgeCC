// lib/cookies.js
// Reading and writing this site's own cookies on the server. The member token
// lives in an httpOnly cookie - JavaScript in the page can never read it.
export function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function cookie(name, value, { maxAge, httpOnly = true } = {}) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return name + '=' + encodeURIComponent(value) + '; Path=/; SameSite=Lax' + (httpOnly ? '; HttpOnly' : '') + secure
    + (maxAge != null ? '; Max-Age=' + maxAge : '');
}

export const MEMBER_COOKIE = 'br_member';
