// lib/webhookLog.js
// The last 50 webhooks this server instance received, for the Webhooks page.
// In memory only: on Vercel a cold start or a second instance starts empty, so
// the page is a convenience - Vercel's function logs have every delivery.
const g = globalThis;
g.__verdeWebhooks = g.__verdeWebhooks || [];
export function remember(entry) { g.__verdeWebhooks.unshift(entry); g.__verdeWebhooks.length = Math.min(g.__verdeWebhooks.length, 50); }
export function recent() { return g.__verdeWebhooks; }
